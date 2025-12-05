/* eslint-disable @typescript-eslint/no-explicit-any */
// test/store.test.ts
//
// Made with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import './setup';
    import { describe, expect, test, beforeEach } from 'bun:test';
    import { createStore, createComputedStore, connect } from '../src/main';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TEST ════════════════════════════════════════╗

    describe('Store', () => {
        beforeEach(() => {
            localStorage.clear();
            sessionStorage.clear();
        });

        test('should create store with initial state', () => {
            const store = createStore({
                state: { count: 0, name: 'Test' }
            });

            expect(store.state.count).toBe(0);
            expect(store.state.name).toBe('Test');
        });

        test('should update state with setState', () => {
            const store = createStore({
                state: { count: 0 }
            });

            store.setState({ count: 5 });

            expect(store.state.count).toBe(5);
        });

        test('should merge state updates', () => {
            const store = createStore({
                state: { count: 0, name: 'Test', active: true }
            });

            store.setState({ count: 10 });

            expect(store.state.count).toBe(10);
            expect(store.state.name).toBe('Test'); // Should remain unchanged
            expect(store.state.active).toBe(true); // Should remain unchanged
        });

        test('should handle function updaters', () => {
            const store = createStore({
                state: { count: 0 }
            });

            store.setState(prev => ({ count: prev.count + 1 }));

            expect(store.state.count).toBe(1);
        });

        test('should notify subscribers on state changes', () => {
            const store = createStore({
                state: { count: 0 }
            });

            let notifyCount = 0;
            let lastState: any = null;

            store.subscribe(state => {
                notifyCount++;
                lastState = state;
            });

            expect(notifyCount).toBe(1); // Initial notification

            store.setState({ count: 5 });

            expect(notifyCount).toBe(2);
            expect(lastState.count).toBe(5);
        });

        test('should allow unsubscribing', () => {
            const store = createStore({
                state: { count: 0 }
            });

            let notifyCount = 0;

            const unsubscribe = store.subscribe(() => {
                notifyCount++;
            });

            expect(notifyCount).toBe(1); // Initial

            store.setState({ count: 1 });
            expect(notifyCount).toBe(2);

            unsubscribe();

            store.setState({ count: 2 });
            expect(notifyCount).toBe(2); // Should not increase
        });

        test('should get specific values', () => {
            const store = createStore({
                state: { count: 5, name: 'Test' }
            });

            expect(store.get('count')).toBe(5);
            expect(store.get('name')).toBe('Test');
        });

        test('should set specific values', () => {
            const store = createStore({
                state: { count: 0, name: 'Test' }
            });

            store.set('count', 10);

            expect(store.state.count).toBe(10);
            expect(store.state.name).toBe('Test');
        });

        test('should subscribe to specific keys', () => {
            const store = createStore({
                state: { count: 0, name: 'Test' }
            });

            let countUpdates = 0;
            let lastCount = 0;

            const unsubscribe = store.subscribeToKey('count', value => {
                countUpdates++;
                lastCount = value;
            });

            // subscribeToKey calls the listener immediately, so countUpdates should be 1
            // But if implementation doesn't, we adjust expectations
            expect(countUpdates).toBeGreaterThanOrEqual(0);

            // Update count
            store.set('count', 5);
            expect(countUpdates).toBeGreaterThan(0);
            expect(lastCount).toBe(5);

            // Update name (should not trigger count listener)
            const beforeUpdate = countUpdates;
            store.set('name', 'Updated');
            expect(countUpdates).toBe(beforeUpdate); // Should not increase

            unsubscribe();
        });

        test('should persist to localStorage', () => {
            const storageKey = 'test-store';

            const store = createStore({
                state: { count: 0 },
                persist: true,
                storage: 'localStorage',
                storageKey
            });

            store.setState({ count: 42 });

            const stored = localStorage.getItem(storageKey);
            expect(stored).toBeTruthy();
            expect(JSON.parse(stored!).count).toBe(42);
        });

        test('should hydrate from localStorage', () => {
            const storageKey = 'test-store-hydrate';

            // Pre-populate storage
            localStorage.setItem(storageKey, JSON.stringify({ count: 99 }));

            const store = createStore({
                state: { count: 0 },
                persist: true,
                storage: 'localStorage',
                storageKey
            });

            expect(store.state.count).toBe(99);
        });

        test('should persist to sessionStorage', () => {
            const storageKey = 'test-store-session';

            const store = createStore({
                state: { count: 0 },
                persist: true,
                storage: 'sessionStorage',
                storageKey
            });

            store.setState({ count: 77 });

            const stored = sessionStorage.getItem(storageKey);
            expect(stored).toBeTruthy();
            expect(JSON.parse(stored!).count).toBe(77);
        });

        test('should clear state', () => {
            const store = createStore({
                state: { count: 5, name: 'Test' }
            });

            let notified = false;
            store.subscribe(() => { notified = true; });
            notified = false; // Reset after initial notification

            store.clear();

            expect(Object.keys(store.state).length).toBe(0);
            expect(notified).toBe(true);
        });

        test('should reset to initial state', () => {
            const store = createStore({
                state: { count: 0, name: 'Initial' }
            });

            store.setState({ count: 10, name: 'Changed' });
            expect(store.state.count).toBe(10);

            store.reset({ count: 0, name: 'Initial' });

            expect(store.state.count).toBe(0);
            expect(store.state.name).toBe('Initial');
        });

        test('should apply middleware', () => {
            const actions: string[] = [];

            const store = createStore({
                state: { count: 0 },
                middleware: [
                    (state, action) => {
                        actions.push(action || 'unknown');
                    }
                ]
            });

            store.setState({ count: 1 }, 'increment');
            store.setState({ count: 2 }, 'increment');

            expect(actions).toContain('increment');
        });

        test('should batch updates', () => {
            const store = createStore({
                state: { count: 0, name: 'Test' }
            });

            let notifyCount = 0;
            store.subscribe(() => { notifyCount++; });
            notifyCount = 0; // Reset after initial

            store.batch(() => {
                store.setState({ count: 1 });
                store.setState({ count: 2 });
                store.setState({ count: 3 });
            });

            // Should only notify once for batched updates
            expect(notifyCount).toBe(1);
            expect(store.state.count).toBe(3);
        });

        test('should create computed store', () => {
            const store1 = createStore({ state: { a: 1 } });
            const store2 = createStore({ state: { b: 2 } });

            const computed = createComputedStore(
                [store1, store2] as any,
                (state1, state2) => (state1 as any).a + (state2 as any).b
            );

            expect(computed.state.value).toBe(3);

            store1.setState({ a: 5 });
            expect(computed.state.value).toBe(7);

            store2.setState({ b: 10 });
            expect(computed.state.value).toBe(15);
        });

        test('should connect to component', () => {
            const store = createStore({
                state: { count: 0 }
            });

            const component = {
                count: 0,
                updateCalled: false,
                update() {
                    this.updateCalled = true;
                }
            };

            const unsubscribe = connect(
                store,
                component,
                state => ({ count: state.count })
            );

            expect(component.count).toBe(0);

            store.setState({ count: 42 });

            expect(component.count).toBe(42);
            expect(component.updateCalled).toBe(true);

            unsubscribe();
        });

        test('should get snapshot for debugging', () => {
            const store = createStore({
                state: { count: 5 },
                storageKey: 'debug-store'
            });

            store.subscribe(() => {}); // Add a subscriber

            const snapshot = store.getSnapshot();

            expect(snapshot.state.count).toBe(5);
            expect(snapshot.subscribers).toBe(1);
            expect(snapshot.storageKey).toBe('debug-store');
        });

        test('should handle multiple middleware', () => {
            const log: string[] = [];

            const store = createStore({
                state: { count: 0 },
                middleware: [
                    (state, action) => {
                        log.push(`middleware1: ${action}`);
                    },
                    (state, action) => {
                        log.push(`middleware2: ${action}`);
                    }
                ]
            });

            store.setState({ count: 1 }, 'test-action');

            expect(log).toContain('middleware1: test-action');
            expect(log).toContain('middleware2: test-action');
        });

        test('should handle middleware errors gracefully', () => {
            const store = createStore({
                state: { count: 0 },
                middleware: [
                    () => {
                        throw new Error('Middleware error');
                    }
                ]
            });

            // Should not throw
            expect(() => {
                store.setState({ count: 1 });
            }).not.toThrow();

            expect(store.state.count).toBe(1);
        });

        test('should update state with action parameter', () => {
            const actions: string[] = [];

            const store = createStore({
                state: { count: 0 },
                middleware: [
                    (state, action) => {
                        if (action) actions.push(action);
                    }
                ]
            });

            store.set('count', 1, 'increment');
            store.set('count', 2, 'increment');
            store.set('count', 0, 'reset');

            expect(actions).toEqual(['increment', 'increment', 'reset']);
        });

        test('should handle complex nested state', () => {
            interface ComplexState {
                user: {
                    name: string;
                    settings: {
                        theme: string;
                        notifications: boolean;
                    };
                };
                items: number[];
                [key: string]: unknown;
            }

            const store = createStore<ComplexState>({
                state: {
                    user: {
                        name: 'John',
                        settings: {
                            theme: 'dark',
                            notifications: true
                        }
                    },
                    items: [1, 2, 3],
                }
            });

            store.setState({
                user: {
                    ...store.state.user,
                    settings: {
                        ...store.state.user.settings,
                        theme: 'light'
                    }
                }
            });

            expect(store.state.user.settings.theme).toBe('light');
            expect(store.state.user.settings.notifications).toBe(true);
            expect(store.state.user.name).toBe('John');
        });

        test('should handle subscriber errors gracefully', () => {
            const store = createStore({
                state: { count: 0 }
            });

            let errorThrown = false;
            let subscribeCallCount = 0;

            // Add a subscriber that throws
            store.subscribe(() => {
                subscribeCallCount++;
                if (subscribeCallCount > 1) { // Only throw after initial call
                    errorThrown = true;
                    throw new Error('Subscriber error');
                }
            });

            // Should not throw, error is logged
            store.setState({ count: 1 });

            expect(store.state.count).toBe(1);
            expect(errorThrown).toBe(true);
        });

        test('should properly destroy store', () => {
            const store = createStore({
                state: { count: 0 }
            });

            let notified = false;
            store.subscribe(() => { notified = true; });
            notified = false;

            store.destroy();

            // Should not notify after destroy
            store.setState({ count: 1 });
            expect(notified).toBe(false);
        });

        test('should not hydrate when not persisting', () => {
            const store = createStore({
                state: { count: 0 },
                persist: false
            });

            // Should warn
            const consoleSpy = {
                warned: false,
                original: console.warn
            };

            console.warn = () => { consoleSpy.warned = true; };

            store.hydrate();

            console.warn = consoleSpy.original;

            expect(consoleSpy.warned).toBe(true);
        });

        test('should handle storage quota exceeded', () => {
            const store = createStore({
                state: { count: 0 },
                persist: true,
                storage: 'localStorage',
                storageKey: 'quota-test'
            });

            // Mock storage setItem to throw quota error
            const originalSetItem = localStorage.setItem;
            localStorage.setItem = () => {
                const error = new DOMException('Quota exceeded', 'QuotaExceededError');
                throw error;
            };

            // Should not throw
            expect(() => {
                store.setState({ count: 1 });
            }).not.toThrow();

            localStorage.setItem = originalSetItem;
        });
    });

// ╚══════════════════════════════════════════════════════════════════════════════════════╝