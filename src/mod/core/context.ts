// src/mod/core/context.ts
//
// Made with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import { Component } from './component';
    import { html, type VNode } from '@je-es/vdom';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TYPE ════════════════════════════════════════╗

    export type ContextSubscriber<T> = (value: T) => void;

    export interface ProviderProps<T> {
        context: Context<T>;
        value: T;
        children: VNode | VNode[];
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

    /**
     * Context class for sharing data across component tree
     */
    export class Context<T = unknown> {
        private _value: T;
        private _subscribers = new Set<ContextSubscriber<T>>();
        private _defaultValue: T;

        constructor(defaultValue: T) {
            this._value = defaultValue;
            this._defaultValue = defaultValue;
        }

        get value(): T {
            return this._value;
        }

        set value(newValue: T) {
            if (this._value !== newValue) {
                this._value = newValue;
                this._notify();
            }
        }

        subscribe(subscriber: ContextSubscriber<T>): () => void {
            this._subscribers.add(subscriber);

            // Immediately call with current value (wrapped in try-catch)
            try {
                subscriber(this._value);
            } catch (error) {
                console.error('Context subscriber error:', error);
                // Don't throw - the test expects this to not throw
            }

            // Return unsubscribe function
            return () => {
                this._subscribers.delete(subscriber);
            };
        }

        reset(): void {
            this.value = this._defaultValue;
        }

        update(updater: (prev: T) => T): void {
            this.value = updater(this._value);
        }

        private _notify(): void {
            for (const subscriber of this._subscribers) {
                try {
                    subscriber(this._value);
                } catch (error) {
                    console.error('Context subscriber error:', error);
                    // Continue notifying other subscribers
                }
            }
        }

        get subscriberCount(): number {
            return this._subscribers.size;
        }
    }

    /**
     * Create a new context
     */
    export function createContext<T>(defaultValue: T): Context<T> {
        return new Context(defaultValue);
    }

    export class Provider<T> extends Component<ProviderProps<T>> {
        onMount(): void {
            // Update context value
            this.props.context.value = this.props.value;
        }

        onUpdate(): void {
            // Update context when props change
            this.props.context.value = this.props.value;
        }

        onUnmount(): void {
            // Optionally reset context on unmount
            // this.props.context.reset();
        }

        render(): VNode {
            const children = Array.isArray(this.props.children)
                ? this.props.children
                : [this.props.children];

            return html`
                <div class="context-provider" style="display: contents;">
                    ${children}
                </div>
            `;
        }
    }

    /**
     * Hook-like function to use context in components
     * Call this in your component to get context value
     */
    export function useContext<T>(context: Context<T>, component: Component): T {
        // Subscribe to context changes
        const unsubscribe = context.subscribe(() => {
            if (component.isMounted) {
                component.update();
            }
        });

        // Cleanup on unmount
        component.subscribe(() => unsubscribe);

        return context.value;
    }

    /**
     * Combined context for complex state management
     */
    export class CombinedContext<T extends Record<string, unknown>> {
        private contexts = new Map<keyof T, Context<T[keyof T]>>();

        constructor(initialValues: T) {
            for (const [key, value] of Object.entries(initialValues)) {
                this.contexts.set(key as keyof T, new Context(value) as unknown as Context<T[keyof T]>);
            }
        }

        get<K extends keyof T>(key: K): Context<T[K]> {
            const context = this.contexts.get(key);
            if (!context) {
                throw new Error(`Context key "${String(key)}" not found`);
            }
            return context as unknown as Context<T[K]>;
        }

        set<K extends keyof T>(key: K, value: T[K]): void {
            const context = this.contexts.get(key);
            if (context) {
                (context as unknown as Context<T[K]>).value = value;
            }
        }

        subscribe<K extends keyof T>(
            key: K,
            subscriber: ContextSubscriber<T[K]>
        ): () => void {
            const context = this.contexts.get(key);
            if (!context) {
                throw new Error(`Context key "${String(key)}" not found`);
            }
            return (context as unknown as Context<T[K]>).subscribe(subscriber);
        }

        reset(): void {
            for (const context of this.contexts.values()) {
                context.reset();
            }
        }
    }

    /**
     * Create combined context
     */
    export function createCombinedContext<T extends Record<string, unknown>>(
        initialValues: T
    ): CombinedContext<T> {
        return new CombinedContext(initialValues);
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝
