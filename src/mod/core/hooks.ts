// src/mod/core/hooks.ts
//
// Made with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import { Component }    from './component';
    import type { VNode }   from '../../types';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TYPE ════════════════════════════════════════╗

    interface HookState {
        value: unknown;
        deps?: unknown[];
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ INIT ════════════════════════════════════════╗

    let currentComponent: Component | null = null;
    let currentHookIndex: number = 0;
    const hookStates = new WeakMap<Component, HookState[]>();

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

    /**
     * Set current component context for hooks
     */
    export function setHookContext(component: Component): void {
        currentComponent = component;
        currentHookIndex = 0;
    }

    /**
     * Clear hook context
     */
    export function clearHookContext(): void {
        currentComponent = null;
        currentHookIndex = 0;
    }

    /**
     * Get or create hook states for component
     */
    function getHookStates(component: Component): HookState[] {
        if (!hookStates.has(component)) {
            hookStates.set(component, []);
        }
        return hookStates.get(component)!;
    }

    // ─── Core Hooks ───

    /**
     * useState hook - manages component state
     */
    export function useState<T>(initialValue: T | (() => T)): [T, (newValue: T | ((prev: T) => T)) => void] {
        if (!currentComponent) {
            throw new Error('useState must be called inside a component');
        }

        const component = currentComponent;
        const hookIndex = currentHookIndex++;
        const states = getHookStates(component);

        // Initialize state if first render
        if (states[hookIndex] === undefined) {
            states[hookIndex] = {
                value: typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue
            };
        }

        const setState = (newValue: T | ((prev: T) => T)) => {
            const state = states[hookIndex];
            const nextValue = typeof newValue === 'function'
                ? (newValue as (prev: T) => T)(state.value as T)
                : newValue;

            if (state.value !== nextValue) {
                state.value = nextValue;
                component.update();
            }
        };

        return [states[hookIndex].value as T, setState];
    }

    /**
     * useEffect hook - side effects
     */
    export function useEffect(
        effect: () => void | (() => void),
        deps?: unknown[]
    ): void {
        if (!currentComponent) {
            throw new Error('useEffect must be called inside a component');
        }

        const component = currentComponent;
        const hookIndex = currentHookIndex++;
        const states = getHookStates(component);

        const prevState = states[hookIndex];
        const hasChanged = !prevState || !deps || !areDepsEqual(prevState.deps, deps);

        if (hasChanged) {
            // Cleanup previous effect
            if (prevState?.value && typeof prevState.value === 'function') {
                try {
                    (prevState.value as () => void)();
                } catch (error) {
                    console.error('Error in effect cleanup:', error);
                }
            }

            // Run new effect after a microtask (so it runs after render completes)
            Promise.resolve().then(() => {
                try {
                    const cleanup = effect();

                    // Store cleanup and deps
                    states[hookIndex] = {
                        value: cleanup,
                        deps: deps ? [...deps] : undefined
                    };
                } catch (error) {
                    console.error('Error in effect:', error);
                }
            });
        }
    }

    /**
     * useMemo hook - memoize expensive computations
     */
    export function useMemo<T>(
        factory: () => T,
        deps: unknown[]
    ): T {
        if (!currentComponent) {
            throw new Error('useMemo must be called inside a component');
        }

        const hookIndex = currentHookIndex++;
        const states = getHookStates(currentComponent);

        const prevState = states[hookIndex];
        const hasChanged = !prevState || !areDepsEqual(prevState.deps, deps);

        if (hasChanged) {
            states[hookIndex] = {
                value: factory(),
                deps: [...deps]
            };
        }

        return states[hookIndex].value as T;
    }

    /**
     * useCallback hook - memoize callbacks
     */
    export function useCallback<T extends (...args: unknown[]) => unknown>(
        callback: T,
        deps: unknown[]
    ): T {
        return useMemo(() => callback, deps);
    }

    /**
     * useRef hook - persistent value across renders
     */
    export function useRef<T>(initialValue: T): { current: T } {
        if (!currentComponent) {
            throw new Error('useRef must be called inside a component');
        }

        const hookIndex = currentHookIndex++;
        const states = getHookStates(currentComponent);

        if (states[hookIndex] === undefined) {
            states[hookIndex] = {
                value: { current: initialValue }
            };
        }

        return states[hookIndex].value as { current: T };
    }

    /**
     * useReducer hook - complex state management
     */
    export function useReducer<S, A>(
        reducer: (state: S, action: A) => S,
        initialState: S
    ): [S, (action: A) => void] {
        const [state, setState] = useState(initialState);

        const dispatch = useCallback((action: unknown) => {
            setState(prevState => reducer(prevState, action as A));
        }, [reducer]) as (action: A) => void;

        return [state, dispatch];
    }

    // ─── Custom Hooks ───

    /**
     * useLocalStorage hook - sync state with localStorage
     */
    export function useLocalStorage<T>(
        key: string,
        initialValue: T
    ): [T, (value: T | ((prev: T) => T)) => void] {
        // Initialize from localStorage
        const [storedValue, setStoredValue] = useState<T>(() => {
            try {
                const item = window.localStorage.getItem(key);
                return item ? JSON.parse(item) as T : initialValue;
            } catch (error) {
                console.error('Error loading from localStorage:', error);
                return initialValue;
            }
        });

        // Create setValue wrapper (recreated each render, but that's okay)
        const setValue = (newValue: T | ((prev: T) => T)) => {
            setStoredValue((prevValue: T) => {
                const valueToStore = newValue instanceof Function
                    ? newValue(prevValue)
                    : newValue;

                // Update localStorage synchronously
                try {
                    window.localStorage.setItem(key, JSON.stringify(valueToStore));
                } catch (error) {
                    console.error('Error saving to localStorage:', error);
                }

                return valueToStore;
            });
        };

        return [storedValue, setValue];
    }

    /**
     * useDebounce hook - debounce value changes
     */
    export function useDebounce<T>(value: T, delay: number): T {
        const [debouncedValue, setDebouncedValue] = useState(value);

        useEffect(() => {
            // Set up the timeout
            const handler = setTimeout(() => {
                setDebouncedValue(value);
            }, delay);

            // Cleanup function that clears the timeout
            return () => {
                clearTimeout(handler);
            };
        }, [value, delay]);

        return debouncedValue;
    }

    /**
     * usePrevious hook - get previous value
     */
    export function usePrevious<T>(value: T): T | undefined {
        const ref = useRef<T | undefined>(undefined);

        // Use effect to update the ref after render
        useEffect(() => {
            ref.current = value;
        });

        // Return the previous value (what ref was BEFORE this render)
        const prevValue = ref.current;

        return prevValue;
    }

    /**
     * useToggle hook - boolean toggle
     */
    export function useToggle(initialValue: boolean = false): [boolean, () => void] {
        const [value, setValue] = useState(initialValue);

        const toggle = useCallback(() => {
            setValue(v => !v);
        }, []);

        return [value, toggle];
    }

    /**
     * useInterval hook - setInterval with cleanup
     */
    export function useInterval(callback: () => void, delay: number | null): void {
        const savedCallback = useRef(callback);

        useEffect(() => {
            savedCallback.current = callback;
        }, [callback]);

        useEffect(() => {
            if (delay === null) return;

            const id = setInterval(() => savedCallback.current(), delay);

            return () => clearInterval(id);
        }, [delay]);
    }

    /**
     * useFetch hook - data fetching
     */
    export function useFetch<T>(
        url: string,
        options?: RequestInit
    ): {
        data: T | null;
        loading: boolean;
        error: Error | null;
        refetch: () => void;
    } {
        const [data, setData] = useState<T | null>(null);
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState<Error | null>(null);

        const fetchData = useCallback(async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await fetch(url, options);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const json = await response.json() as T;
                setData(json);
            } catch (e) {
                setError(e as Error);
            } finally {
                setLoading(false);
            }
        }, [url]);

        useEffect(() => {
            fetchData();
        }, [fetchData]);

        return { data, loading, error, refetch: fetchData };
    }

    /**
     * useWindowSize hook - track window dimensions
     */
    export function useWindowSize(): { width: number; height: number } {
        const [size, setSize] = useState({
            width: window.innerWidth,
            height: window.innerHeight
        });

        useEffect(() => {
            const handleResize = () => {
                setSize({
                    width: window.innerWidth,
                    height: window.innerHeight
                });
            };

            window.addEventListener('resize', handleResize);
            return () => window.removeEventListener('resize', handleResize);
        }, []);

        return size;
    }

    /**
     * useEventListener hook - add event listener
     */
    export function useEventListener<K extends keyof WindowEventMap>(
        eventName: K,
        handler: (event: WindowEventMap[K]) => void,
        element: HTMLElement | Window = window
    ): void {
        const savedHandler = useRef(handler);

        useEffect(() => {
            savedHandler.current = handler;
        }, [handler]);

        useEffect(() => {
            const isSupported = element && 'addEventListener' in element;
            if (!isSupported) return;

            const eventListener = (event: Event) => {
                savedHandler.current(event as WindowEventMap[K]);
            };

            element.addEventListener(eventName, eventListener);

            return () => {
                element.removeEventListener(eventName, eventListener);
            };
        }, [eventName, element]);
    }

    /**
     * Create a functional component with hooks
     * Returns a component class that can be instantiated
     */
    export function createFunctionalComponent<P extends Record<string, unknown> = Record<string, unknown>>(
        fn: (props: P) => VNode,
        displayName?: string
    ): new (props?: P) => Component<P> {
        class FunctionalComponent extends Component<P> {
            render(): VNode {
                setHookContext(this);
                try {
                    return fn(this.props) as VNode;
                } finally {
                    clearHookContext();
                }
            }
        }

        if (displayName) {
            Object.defineProperty(FunctionalComponent, 'name', { value: displayName });
        }

        return FunctionalComponent as new (props?: P) => Component<P>;
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ HELP ════════════════════════════════════════╗

    function areDepsEqual(prevDeps: unknown[] | undefined, nextDeps: unknown[]): boolean {
        if (!prevDeps || prevDeps.length !== nextDeps.length) {
            return false;
        }

        for (let i = 0; i < prevDeps.length; i++) {
            if (prevDeps[i] !== nextDeps[i]) {
                return false;
            }
        }

        return true;
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝
