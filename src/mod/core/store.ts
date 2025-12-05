// src/mod/core/store.ts
//
// Made with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import { StoreOptions, StoreSubscriber } from '../../types';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

    /**
     * Store - Global state management with improved features
     */
    export class Store<T extends Record<string, unknown> = Record<string, unknown>> {
        private _state: T;
        private _subscribers = new Set<StoreSubscriber<T>>();
        private _persist: boolean;
        private _storage: Storage | null = null;
        private _storageKey: string;
        private _middleware: ((state: T, action?: string) => void)[] = [];
        private _isHydrating: boolean = false;

        constructor(options: StoreOptions<T>) {
            this._persist = options.persist ?? false;
            this._storageKey = options.storageKey || `store_${Date.now()}`;

            // Initialize storage
            if (this._persist && typeof window !== 'undefined') {
                this._storage = options.storage === 'sessionStorage'
                    ? sessionStorage
                    : localStorage;
            }

            // Load from storage if persisted
            if (this._persist && this._storage) {
                const stored = this._loadFromStorage();
                this._state = stored !== null ? stored : options.state;
            } else {
                this._state = options.state;
            }

            // Apply initial middleware
            if (options.middleware) {
                this._middleware = options.middleware;
            }
        }

        /**
         * Get current state (readonly)
         */
        get state(): Readonly<T> {
            return { ...this._state };
        }

        /**
         * Set entire state (replaces state)
         */
        set state(newState: T) {
            this.setState(newState);
        }

        /**
         * Update state (merges with existing state)
         */
        setState(update: Partial<T> | ((prevState: T) => Partial<T>), action?: string): void {
            const prevState = { ...this._state };

            const partialState = typeof update === 'function'
                ? update(prevState)
                : update;

            this._state = { ...prevState, ...partialState };

            // Apply middleware
            for (const middleware of this._middleware) {
                try {
                    middleware(this._state, action);
                } catch (error) {
                    console.error('Store middleware error:', error);
                }
            }

            // Persist to storage
            if (this._persist && !this._isHydrating) {
                this._saveToStorage();
            }

            // Notify subscribers
            this._notify();
        }

        /**
         * Get a specific value from state
         */
        get<K extends keyof T>(key: K): T[K] {
            return this._state[key];
        }

        /**
         * Set a specific value in state
         */
        set<K extends keyof T>(key: K, value: T[K], action?: string): void {
            this.setState({ [key]: value } as unknown as Partial<T>, action);
        }

        /**
         * Subscribe to state changes
         * Returns unsubscribe function
         */
        subscribe(listener: StoreSubscriber<T>): () => void {
            this._subscribers.add(listener);

            // Immediately call listener with current state
            listener(this._state);

            // Return unsubscribe function
            return () => {
                this._subscribers.delete(listener);
            };
        }

        /**
         * Subscribe to specific key changes
         */
        subscribeToKey<K extends keyof T>(
            key: K,
            listener: (value: T[K]) => void
        ): () => void {
            let prevValue = this._state[key];

            const subscriber = (state: T) => {
                const newValue = state[key];
                if (prevValue !== newValue) {
                    prevValue = newValue;
                    listener(newValue);
                }
            };

            return this.subscribe(subscriber);
        }

        /**
         * Add middleware
         */
        use(middleware: (state: T, action?: string) => void): void {
            this._middleware.push(middleware);
        }

        /**
         * Clear all state
         */
        clear(): void {
            this._state = {} as T;

            if (this._persist && this._storage) {
                try {
                    this._storage.removeItem(this._storageKey);
                } catch (error) {
                    console.error('Failed to clear storage:', error);
                }
            }

            this._notify();
        }

        /**
         * Reset state to initial value
         */
        reset(initialState: T): void {
            this._state = { ...initialState };

            if (this._persist) {
                this._saveToStorage();
            }

            this._notify();
        }

        /**
         * Hydrate state from storage
         */
        hydrate(): void {
            if (!this._persist || !this._storage) {
                console.warn('Cannot hydrate: persistence not enabled');
                return;
            }

            this._isHydrating = true;
            const stored = this._loadFromStorage();

            if (stored !== null) {
                this._state = stored;
                this._notify();
            }

            this._isHydrating = false;
        }

        /**
         * Get store snapshot for debugging
         */
        getSnapshot(): { state: T; subscribers: number; storageKey: string } {
            return {
                state: { ...this._state },
                subscribers: this._subscribers.size,
                storageKey: this._storageKey,
            };
        }

        /**
         * Batch multiple updates
         */
        batch(updates: () => void): void {
            const prevNotify = this._notify.bind(this);
            let shouldNotify = false;

            // Temporarily override notify
            this._notify = () => {
                shouldNotify = true;
            };

            try {
                updates();
            } finally {
                this._notify = prevNotify;
                if (shouldNotify) {
                    this._notify();
                }
            }
        }

        /**
         * Notify all subscribers
         */
        private _notify(): void {
            const stateCopy = { ...this._state };

            for (const subscriber of this._subscribers) {
                try {
                    subscriber(stateCopy);
                } catch (error) {
                    console.error('Store subscriber error:', error);
                }
            }
        }

        /**
         * Load state from storage
         */
        private _loadFromStorage(): T | null {
            if (!this._storage) return null;

            try {
                const stored = this._storage.getItem(this._storageKey);
                return stored ? JSON.parse(stored) as T : null;
            } catch (error) {
                console.error('Failed to load from storage:', error);
                return null;
            }
        }

        /**
         * Save state to storage
         */
        private _saveToStorage(): void {
            if (!this._storage) return;

            try {
                this._storage.setItem(this._storageKey, JSON.stringify(this._state));
            } catch (error) {
                console.error('Failed to save to storage:', error);

                // Handle quota exceeded
                if (error instanceof DOMException && error.name === 'QuotaExceededError') {
                    console.warn('Storage quota exceeded');
                    // Could implement cleanup strategy here
                }
            }
        }

        /**
         * Destroy store and cleanup
         */
        destroy(): void {
            this._subscribers.clear();
            this._middleware = [];
            this._state = {} as T;
        }
    }

    /**
     * Create a store with type inference
     */
    export function createStore<T extends Record<string, unknown>>(
        options: StoreOptions<T>
    ): Store<T> {
        return new Store(options);
    }

    /**
     * Create a computed store that derives from other stores
     */
    export function createComputedStore<T, S extends Store<Record<string, unknown>>[]>(
        stores: S,
        computer: (...states: unknown[]) => T
    ): Store<{ value: T }> {
        const computedStore = createStore<{ value: T }>({
            state: { value: computer(...stores.map(s => s.state)) },
        });

        // Subscribe to all source stores
        for (const store of stores) {
            store.subscribe(() => {
                computedStore.setState({
                    value: computer(...stores.map(s => s.state)),
                });
            });
        }

        return computedStore;
    }

    /**
     * Connect a component to a store
     */
    export function connect<T extends Record<string, unknown>, C extends { update?: () => void }>(
        store: Store<T>,
        component: C,
        mapStateToProps: (state: T) => Partial<C>
    ): () => void {
        const unsubscribe = store.subscribe((state) => {
            const props = mapStateToProps(state);
            Object.assign(component, props);

            // Trigger update if component has update method
            if (typeof component.update === 'function') {
                component.update();
            }
        });

        return unsubscribe;
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝