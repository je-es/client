// src/mod/core/component.ts
//
// Made with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import { patch }            from '@je-es/vdom';
    import type { VNode }       from '../../types';
    import { StyleManager }     from './styles';
    import { scheduler }        from './scheduler';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

    export abstract class Component<P = Record<string, unknown>, S = Record<string, unknown>> {

        // ┌──────────────────────────────── INIT ──────────────────────────────┐

            public props                    : P;
            public state                    : S;
            public _isMounted               : boolean                   = false;

            private _isUnmounting           : boolean                   = false;
            private _element                : HTMLElement | null        = null;
            private _vnode                  : VNode  | null             = null;
            private _styleId                : string | null             = null;
            private _isScheduledForUpdate   : boolean                   = false;
            private _updateBatch            = new Set<string>();
            private _refs                   = new Map<string, HTMLElement>();
            private _subscriptions          : (() => void)[] = [];
            private _memoCache              = new Map<string, { args: unknown[]; result: unknown }>();
            private _isInitializing         : boolean = false;
            private _skipNextUpdate         : boolean = false;
            private _preservedElements      = new Map<Element, { parent: Element; children: Node[] }>();
            private _updateInProgress       : boolean = false;

            constructor(props?: P, initialState?: S) {
                this.props = props || {} as P;
                this.state = initialState || {} as S;
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── ──── ──────────────────────────────┐

            onBeforeMount?(): void | Promise<void>;
            onMount?(): void | Promise<void>;
            onBeforeUpdate?(prevProps: P, prevState: S): void | Promise<void>;
            onUpdate?(prevProps: P, prevState: S): void;
            onBeforeUnmount?(): void;
            onUnmount?(): void;
            onError?(error: Error, errorInfo: { componentStack?: string }): void;
            onPropsChange?(prevProps: P, newProps: P): void;
            onStateChange?(prevState: S, newState: S): void;
            shouldUpdate?(prevProps: P, prevState: S): boolean;

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── ──── ──────────────────────────────┐

            abstract render(): VNode;
            styles?(): string;

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── ──── ──────────────────────────────┐

            setState(
                partialState: Partial<S> | ((prevState: S) => Partial<S>),
                callback?: () => void
            ): void {
                // Don't trigger updates during initialization
                if (this._isInitializing) {
                    const newState = typeof partialState === 'function'
                        ? partialState(this.state)
                        : partialState;
                    this.state = { ...this.state, ...newState };
                    return;
                }

                // Don't trigger updates during unmounting
                if (this._isUnmounting) {
                    return;
                }

                const prevState = { ...this.state };
                const newState = typeof partialState === 'function'
                    ? partialState(this.state)
                    : partialState;

                // Check if state actually changed
                let hasChanged = false;
                for (const key in newState) {
                    if (prevState[key] !== newState[key]) {
                        hasChanged = true;
                        break;
                    }
                }

                if (!hasChanged) {
                    // State didn't change, just run callback if provided
                    if (callback) {
                        scheduler.schedule(callback);
                    }
                    return;
                }

                this.state = { ...this.state, ...newState };

                this.onStateChange?.(prevState, this.state);
                this.update();

                if (callback) {
                    scheduler.schedule(callback);
                }
            }

            setProps(newProps: Partial<P>): void {
                if (this._isUnmounting) {
                    return;
                }

                const prevProps = { ...this.props };

                // Check if props actually changed
                let hasChanged = false;
                for (const key in newProps) {
                    if (prevProps[key] !== newProps[key]) {
                        hasChanged = true;
                        break;
                    }
                }

                if (!hasChanged) {
                    return;
                }

                this.props = { ...this.props, ...newProps };

                this.onPropsChange?.(prevProps, this.props);
                this.update();
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── ──── ──────────────────────────────┐

            batchUpdate(updater: () => void): void {
                const prevIsScheduled = this._isScheduledForUpdate;
                this._isScheduledForUpdate = true;

                try {
                    updater();
                } finally {
                    if (!prevIsScheduled) {
                        this._isScheduledForUpdate = false;
                        this.update();
                    }
                }
            }

            update(key?: string): void {
                // Guard conditions
                if (this._skipNextUpdate) {
                    this._skipNextUpdate = false;
                    return;
                }

                if (this._isInitializing || this._isUnmounting || !this._isMounted) {
                    return;
                }

                // Prevent concurrent updates
                if (this._updateInProgress) {
                    return;
                }

                if (key) {
                    this._updateBatch.add(key);
                }

                if (this._isScheduledForUpdate) {
                    return;
                }

                this._isScheduledForUpdate = true;
                scheduler.schedule(() => {
                    this._isScheduledForUpdate = false;
                    this._updateBatch.clear();
                    this._performUpdate();
                });
            }

            forceUpdate(): void {
                if (!this._isMounted || this._isUnmounting || this._updateInProgress) {
                    return;
                }

                scheduler.flushSync(() => {
                    this._performUpdate();
                });
            }

            skipNextUpdate(): void {
                this._skipNextUpdate = true;
            }

            beginInitialization(): void {
                this._isInitializing = true;
            }

            endInitialization(): void {
                this._isInitializing = false;
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── ──── ──────────────────────────────┐

            async mount(container: HTMLElement): Promise<void> {
                if (this._isMounted) {
                    console.warn(`Component ${this.constructor.name} is already mounted`);
                    return;
                }

                if (!container) {
                    throw new Error(`Cannot mount ${this.constructor.name}: container is null or undefined`);
                }

                try {
                    this._isInitializing = true;

                    await this.onBeforeMount?.();

                    this._vnode = this.render();
                    this._element = this._createElementFromVNode(this._vnode);

                    if (this.styles) {
                        this._styleId = StyleManager.inject(
                            this.styles(),
                            this.constructor.name
                        );
                        this._element?.setAttribute('data-scope', this.constructor.name);
                    }

                    container.appendChild(this._element);
                    this._isMounted = true;
                    this._isInitializing = false;

                    await this.onMount?.();
                } catch (error) {
                    this._isInitializing = false;
                    this._isMounted = false;
                    this._handleError(error as Error, { componentStack: this.constructor.name });
                    throw error;
                }
            }

            unmount(): void {
                if (!this._isMounted || this._isUnmounting) {
                    return;
                }

                this._isUnmounting = true;

                try {
                    this.onBeforeUnmount?.();

                    // Cancel pending updates
                    this._isScheduledForUpdate = false;
                    this._updateBatch.clear();

                    // Remove styles
                    if (this._styleId) {
                        StyleManager.remove(this._styleId);
                        this._styleId = null;
                    }

                    // Unsubscribe from all subscriptions
                    this._subscriptions.forEach(unsubscribe => {
                        try {
                            unsubscribe();
                        } catch (error) {
                            console.error('Error during unsubscribe:', error);
                        }
                    });
                    this._subscriptions = [];

                    // Remove from DOM
                    if (this._element?.parentElement) {
                        this._element.parentElement.removeChild(this._element);
                    }

                    // Clear state
                    this._isMounted = false;
                    this._element = null;
                    this._vnode = null;

                    this.onUnmount?.();

                    // Clear caches
                    this._refs.clear();
                    this._memoCache.clear();
                    this._preservedElements.clear();
                } catch (error) {
                    this._handleError(error as Error, { componentStack: this.constructor.name });
                } finally {
                    this._isUnmounting = false;
                }
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── ──── ──────────────────────────────┐

            getRef(name: string): HTMLElement | undefined {
                return this._refs.get(name);
            }

            createRef(name: string): (el: HTMLElement | null) => void {
                return (el: HTMLElement | null) => {
                    if (el) {
                        this._refs.set(name, el);
                    } else {
                        this._refs.delete(name);
                    }
                };
            }

            memo<T>(key: string, compute: () => T, deps: unknown[]): T {
                const cached = this._memoCache.get(key);

                if (cached && this._areDepsEqual(cached.args, deps)) {
                    return cached.result as T;
                }

                const result = compute();
                this._memoCache.set(key, { args: deps, result });
                return result;
            }

            subscribe(subscription: () => void): void {
                this._subscriptions.push(subscription);
            }

            debounce<T extends (...args: unknown[]) => unknown>(
                fn: T,
                delay: number
            ): (...args: Parameters<T>) => void {
                let timeoutId: ReturnType<typeof setTimeout> | null = null;

                return (...args: Parameters<T>): void => {
                    if (timeoutId !== null) {
                        clearTimeout(timeoutId);
                    }

                    timeoutId = setTimeout(() => {
                        timeoutId = null;
                        fn.apply(this, args);
                    }, delay);
                };
            }

            throttle<T extends (...args: unknown[]) => unknown>(
                fn: T,
                delay: number
            ): (...args: Parameters<T>) => void {
                let lastCall = 0;
                let timeoutId: ReturnType<typeof setTimeout> | null = null;

                return (...args: Parameters<T>): void => {
                    const now = Date.now();
                    const timeSinceLastCall = now - lastCall;

                    if (timeSinceLastCall >= delay) {
                        lastCall = now;
                        fn.apply(this, args);
                    } else if (!timeoutId) {
                        timeoutId = setTimeout(() => {
                            lastCall = Date.now();
                            timeoutId = null;
                            fn.apply(this, args);
                        }, delay - timeSinceLastCall);
                    }
                };
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── ──── ──────────────────────────────┐

            get element(): HTMLElement | null {
                return this._element;
            }

            get isMounted(): boolean {
                return this._isMounted;
            }

            get isUnmounting(): boolean {
                return this._isUnmounting;
            }

            get isInitializing(): boolean {
                return this._isInitializing;
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── ──── ──────────────────────────────┐

            private async _performUpdate(): Promise<void> {
                // Guard against invalid states
                if (!this._isMounted || !this._element || this._isUnmounting || this._isInitializing) {
                    return;
                }

                // Prevent concurrent updates
                if (this._updateInProgress) {
                    return;
                }

                this._updateInProgress = true;

                const prevProps = { ...this.props };
                const prevState = { ...this.state };

                try {
                    // Check if update should proceed
                    if (this.shouldUpdate && !this.shouldUpdate(prevProps, prevState)) {
                        return;
                    }

                    await this.onBeforeUpdate?.(prevProps, prevState);

                    // Preserve mounted child components before patching
                    this._preserveComponentMounts();

                    const newVNode = this.render();
                    const parent = this._element.parentElement;

                    if (this._vnode && parent) {
                        const index = Array.from(parent.childNodes).indexOf(this._element);

                        if (index === -1) {
                            // Element was removed from parent, skip update
                            console.warn(`Component ${this.constructor.name} element removed from parent, skipping update`);
                            return;
                        }

                        const oldVDomNode = this._convertToVDomNode(this._vnode);
                        const newVDomNode = this._convertToVDomNode(newVNode);

                        patch(parent, oldVDomNode, newVDomNode, index);
                        this._element = parent.childNodes[index] as HTMLElement;
                    }

                    this._vnode = newVNode;

                    // Restore preserved elements after patching
                    this._restoreComponentMounts();

                    this.onUpdate?.(prevProps, prevState);
                } catch (error) {
                    this._handleError(error as Error, { componentStack: this.constructor.name });
                } finally {
                    this._updateInProgress = false;
                }
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── ──── ──────────────────────────────┐

            private _preserveComponentMounts(): void {
                if (!this._element) return;

                this._preservedElements.clear();

                // Selectors for elements that contain mounted components
                const preserveSelectors = [
                    '[data-language-dropdown-mount]',
                    '[data-user-dropdown-mount]',
                    '[data-notifications-dropdown-mount]',
                    '[data-dropdown-id]',
                    '[data-preserve]',
                    '[data-toast-mount]',
                    '[data-popup-mount]',
                    '[data-loader-mount]',
                    '[data-navbar-notifications-list]'
                ];

                preserveSelectors.forEach(selector => {
                    const elements = this._element!.querySelectorAll(selector);
                    elements.forEach(el => {
                        if (el.children.length > 0 && el.parentElement) {
                            this._preservedElements.set(el, {
                                parent: el,
                                children: Array.from(el.childNodes)
                            });
                        }
                    });
                });
            }

            private _restoreComponentMounts(): void {
                if (!this._element) return;

                this._preservedElements.forEach((data, originalElement) => {
                    let newElement: Element | null = null;

                    // Find corresponding element in updated DOM by matching attributes
                    const attrs = Array.from(originalElement.attributes);
                    for (const attr of attrs) {
                        // Match by data attributes that identify mount points
                        if (attr.name.startsWith('data-')) {
                            const selector = `[${attr.name}="${attr.value}"]`;
                            newElement = this._element!.querySelector(selector);
                            if (newElement) break;
                        }
                    }

                    if (newElement && data.children.length > 0) {
                        // Clear any new children added during patch
                        while (newElement.firstChild) {
                            newElement.removeChild(newElement.firstChild);
                        }

                        // Restore original children
                        data.children.forEach(child => {
                            newElement!.appendChild(child);
                        });
                    }
                });

                this._preservedElements.clear();
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── ──── ──────────────────────────────┐

            private _convertToVDomNode(vnode: VNode): VNode {
                if (typeof vnode.type !== 'string') {
                    throw new Error('Component VNodes cannot be converted to VDom nodes');
                }

                const convertedProps: Record<string, unknown> = {};
                for (const [key, value] of Object.entries(vnode.props)) {
                    if (key === 'children') continue;

                    if (key === 'style' && typeof value === 'object' && value !== null && !Array.isArray(value)) {
                        convertedProps[key] = value as Record<string, string | number>;
                    } else {
                        convertedProps[key] = value;
                    }
                }

                const convertedChildren = vnode.children.map(child => {
                    if (child == null || typeof child === 'boolean') return null;
                    if (typeof child === 'string' || typeof child === 'number') return child;
                    return this._convertToVDomNode(child as VNode);
                }).filter((child): child is string | number | VNode => child !== null);

                return {
                    type: vnode.type,
                    props: convertedProps as never,
                    children: convertedChildren
                };
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── ──── ──────────────────────────────┐

            private _createElementFromVNode(vnode: VNode): HTMLElement {
                if (typeof vnode.type !== 'string') {
                    throw new Error('Component VNodes not supported in _createElementFromVNode');
                }

                const element = document.createElement(vnode.type);

                // Set properties
                for (const [key, value] of Object.entries(vnode.props)) {
                    if (key === 'children') continue;
                    this._setElementProperty(element, key, value);
                }

                // Add children
                for (const child of vnode.children) {
                    if (child == null || child === false) continue;

                    if (typeof child === 'string' || typeof child === 'number') {
                        element.appendChild(document.createTextNode(String(child)));
                    } else if (typeof child === 'object' && 'type' in child) {
                        element.appendChild(this._createElementFromVNode(child as VNode));
                    }
                }

                return element;
            }

            private _setElementProperty(element: HTMLElement, key: string, value: unknown): void {
                // Event handlers
                if (key.startsWith('on') && typeof value === 'function') {
                    const eventName = key.substring(2).toLowerCase();
                    element.addEventListener(eventName, value as EventListener);
                    return;
                }

                // Class names
                if (key === 'className' && typeof value === 'string') {
                    element.className = value;
                    return;
                }

                // Styles
                if (key === 'style') {
                    if (typeof value === 'string') {
                        element.setAttribute('style', value);
                    } else if (typeof value === 'object' && value !== null) {
                        Object.assign(element.style, value);
                    }
                    return;
                }

                // Refs
                if (key === 'ref' && typeof value === 'function') {
                    (value as (el: HTMLElement) => void)(element);
                    return;
                }

                // Boolean attributes
                if (key === 'checked' || key === 'disabled' || key === 'selected') {
                    const boolValue = value === 'true' || value === true || value === '';
                    if (boolValue) {
                        element.setAttribute(key, '');
                    }
                    return;
                }

                // Regular attributes
                if (value != null && value !== false) {
                    element.setAttribute(key, String(value));
                }
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── ──── ──────────────────────────────┐

            private _handleError(error: Error, errorInfo: { componentStack?: string }): void {
                console.error(`Error in component ${this.constructor.name}:`, error);
                console.error('Component stack:', errorInfo.componentStack);

                if (this.onError) {
                    this.onError(error, errorInfo);
                } else {
                    // Re-throw if no error handler
                    throw error;
                }
            }

            private _areDepsEqual(prevDeps: unknown[], nextDeps: unknown[]): boolean {
                if (prevDeps.length !== nextDeps.length) return false;
                return prevDeps.every((dep, i) => Object.is(dep, nextDeps[i]));
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── ──── ──────────────────────────────┐

            _invalidateAllComputed(): void {
                for (const key in this) {
                    if (key.startsWith('_computed_dirty_')) {
                        (this as Record<string, unknown>)[key] = true;
                    }
                }
            }

            _triggerWatchers(propertyName: string, newValue: unknown, oldValue: unknown): void {
                const watchers = (this.constructor as ComponentConstructor).__watchers__;
                if (!watchers?.[propertyName]) return;

                for (const methodName of watchers[propertyName]) {
                    if (typeof (this as Record<string, unknown>)[methodName] === 'function') {
                        try {
                            ((this as Record<string, unknown>)[methodName] as (nv: unknown, ov: unknown) => void).call(this, newValue, oldValue);
                        } catch (error) {
                            console.error(`Watcher error in ${methodName}:`, error);
                        }
                    }
                }
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── ──── ──────────────────────────────┐

            setElement(element: HTMLElement): void {
                this._element = element;
            }

        // └────────────────────────────────────────────────────────────────────┘

    }

    export interface ComponentConstructor {
        __watchers__?       : Record<string, string[]>;
        __reactiveProps__?  : string[];
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝