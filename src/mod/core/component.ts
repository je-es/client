// src/mod/core/component.ts
//
// Made with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import type { VNode } from '../../types';
    import { patch, VNode as VDomVNode } from '@je-es/vdom';
    import { StyleManager } from './styles';
    import { scheduler } from './scheduler';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TYPE ════════════════════════════════════════╗

    export abstract class Component<P = Record<string, unknown>, S = Record<string, unknown>> {
        public props: P;
        public state: S;
        public _isMounted: boolean = false;

        private _isUnmounting: boolean = false;
        private _element: HTMLElement | null = null;
        private _vnode: VNode | null = null;
        private _styleId: string | null = null;
        private _isScheduledForUpdate: boolean = false;
        private _updateBatch = new Set<string>();
        private _refs = new Map<string, HTMLElement>();
        private _subscriptions: (() => void)[] = [];
        private _memoCache = new Map<string, { args: unknown[]; result: unknown }>();
        private _childComponents = new Map<HTMLElement, Component>(); // Track child components

        constructor(props?: P, initialState?: S) {
            this.props = props || {} as P;
            this.state = initialState || {} as S;
        }

        // ─── Lifecycle Hooks ───

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

        // ─── Abstract Methods ───

        abstract render(): VNode;
        styles?(): string;

        // ─── State Management ───

        setState(
            partialState: Partial<S> | ((prevState: S) => Partial<S>),
            callback?: () => void
        ): void {
            const prevState = { ...this.state };
            const newState = typeof partialState === 'function'
                ? partialState(this.state)
                : partialState;

            this.state = { ...this.state, ...newState };

            this.onStateChange?.(prevState, this.state);
            this.update();

            if (callback) {
                scheduler.schedule(callback);
            }
        }

        setProps(newProps: Partial<P>): void {
            const prevProps = { ...this.props };
            this.props = { ...this.props, ...newProps };

            this.onPropsChange?.(prevProps, this.props);
            this.update();
        }

        // ─── Update Scheduling ───

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
            if (!this._isMounted || this._isUnmounting) return;

            if (key) {
                this._updateBatch.add(key);
            }

            if (this._isScheduledForUpdate) return;

            this._isScheduledForUpdate = true;
            scheduler.schedule(() => {
                this._isScheduledForUpdate = false;
                this._updateBatch.clear();
                this._performUpdate();
            });
        }

        forceUpdate(): void {
            if (!this._isMounted || this._isUnmounting) return;

            scheduler.flushSync(() => {
                this._performUpdate();
            });
        }

        // ─── Lifecycle Methods ───

        async mount(container: HTMLElement): Promise<void> {
            if (this._isMounted) {
                console.warn('Component is already mounted');
                return;
            }

            try {
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

                await this.onMount?.();
            } catch (error) {
                this._handleError(error as Error, { componentStack: this.constructor.name });
            }
        }

        unmount(): void {
            if (!this._isMounted || this._isUnmounting) return;

            this._isUnmounting = true;

            try {
                this.onBeforeUnmount?.();

                // Cleanup
                this._isScheduledForUpdate = false;
                this._updateBatch.clear();

                if (this._styleId) {
                    StyleManager.remove(this._styleId);
                }

                this._subscriptions.forEach(unsubscribe => unsubscribe());
                this._subscriptions = [];

                // Unmount child components
                for (const [, childComponent] of this._childComponents) {
                    if (childComponent._isMounted) {
                        childComponent.unmount();
                    }
                }
                this._childComponents.clear();

                if (this._element?.parentElement) {
                    this._element.parentElement.removeChild(this._element);
                }

                this._isMounted = false;
                this._element = null;
                this._vnode = null;

                this.onUnmount?.();

                this._refs.clear();
                this._memoCache.clear();
            } catch (error) {
                this._handleError(error as Error, { componentStack: this.constructor.name });
            } finally {
                this._isUnmounting = false;
            }
        }

        // ─── Helper Methods ───

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

        // ─── Child Component Management ───

        /**
         * Register a child component for lifecycle tracking
         */
        registerChild(container: HTMLElement, component: Component): void {
            this._childComponents.set(container, component);
        }

        /**
         * Unregister a child component
         */
        unregisterChild(container: HTMLElement): void {
            this._childComponents.delete(container);
        }

        // ─── Getters ───

        get element(): HTMLElement | null {
            return this._element;
        }

        get isMounted(): boolean {
            return this._isMounted;
        }

        get isUnmounting(): boolean {
            return this._isUnmounting;
        }

        // ─── Private Methods ───

        private async _performUpdate(): Promise<void> {
            if (!this._isMounted || !this._element || this._isUnmounting) return;

            const prevProps = { ...this.props };
            const prevState = { ...this.state };

            try {
                if (this.shouldUpdate && !this.shouldUpdate(prevProps, prevState)) {
                    return;
                }

                await this.onBeforeUpdate?.(prevProps, prevState);

                const newVNode = this.render();
                const parent = this._element.parentElement;

                if (this._vnode && parent) {
                    const index = Array.from(parent.childNodes).indexOf(this._element);

                    // Store references to child component containers BEFORE patching
                    const childContainers = new Map<string, { container: HTMLElement; component: Component }>();
                    for (const [container, component] of this._childComponents) {
                        // Use data attribute as stable identifier
                        const id = container.getAttribute('data-theme-toggle') ||
                                 container.getAttribute('data-language-toggle') ||
                                 container.getAttribute('data-child-component');
                        if (id) {
                            childContainers.set(id, { container, component });
                        }
                    }

                    // Convert to VDom-compatible VNode
                    const oldVDomNode = this._convertToVDomNode(this._vnode);
                    const newVDomNode = this._convertToVDomNode(newVNode);
                    patch(parent, oldVDomNode, newVDomNode, index);
                    this._element = parent.childNodes[index] as HTMLElement;

                    // Restore child components after patching
                    for (const [id, { component }] of childContainers) {
                        // Find the container again in the updated DOM
                        const newContainer = this._element.querySelector(
                            `[data-theme-toggle="${id}"], [data-language-toggle="${id}"], [data-child-component="${id}"]`
                        ) as HTMLElement;

                        if (newContainer && !component.element?.isConnected) {
                            // Container exists but component is not mounted - remount it
                            try {
                                await component.mount(newContainer);
                                this._childComponents.set(newContainer, component);
                            } catch (error) {
                                console.error('Error remounting child component:', error);
                            }
                        } else if (newContainer && component.element?.isConnected) {
                            // Update the container reference
                            this._childComponents.delete(childContainers.get(id)!.container);
                            this._childComponents.set(newContainer, component);
                        }
                    }
                }

                this._vnode = newVNode;
                this.onUpdate?.(prevProps, prevState);
            } catch (error) {
                this._handleError(error as Error, { componentStack: this.constructor.name });
            }
        }

        private _convertToVDomNode(vnode: VNode): VDomVNode {
            if (typeof vnode.type !== 'string') {
                throw new Error('Component VNodes cannot be converted to VDom nodes');
            }

            // Convert props to VDom-compatible format
            const convertedProps: Record<string, unknown> = {};
            for (const [key, value] of Object.entries(vnode.props)) {
                if (key === 'children') continue;

                // Convert style object if needed
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
            }).filter((child): child is string | number | VDomVNode => child !== null);

            return {
                type: vnode.type,
                props: convertedProps as never,
                children: convertedChildren
            };
        }

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

        private _handleError(error: Error, errorInfo: { componentStack?: string }): void {
            console.error(`Error in component ${this.constructor.name}:`, error);

            if (this.onError) {
                this.onError(error, errorInfo);
            } else {
                throw error;
            }
        }

        private _areDepsEqual(prevDeps: unknown[], nextDeps: unknown[]): boolean {
            if (prevDeps.length !== nextDeps.length) return false;
            return prevDeps.every((dep, i) => dep === nextDeps[i]);
        }

        /**
         * Invalidate all computed property caches (called by decorators)
         */
        _invalidateAllComputed(): void {
            for (const key in this) {
                if (key.startsWith('_computed_dirty_')) {
                    (this as Record<string, unknown>)[key] = true;
                }
            }
        }

        /**
         * Trigger watchers for a property (called by decorators)
         */
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
    }

    // Helper type for constructor metadata
    export interface ComponentConstructor {
        __watchers__?: Record<string, string[]>;
        __reactiveProps__?: string[];
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝