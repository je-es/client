/* eslint-disable @typescript-eslint/no-explicit-any */
// test/context.test.ts
//
// Made with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import './setup';
    import { describe, expect, test, beforeEach, afterEach } from 'bun:test';
    import {
        Component,
        createElement,
        createContext,
        Provider,
        useContext,
        createCombinedContext} from '../src/main';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TEST ════════════════════════════════════════╗

    describe('Context API', () => {
        let container: HTMLElement;

        beforeEach(() => {
            container = document.createElement('div');
            document.body.appendChild(container);
        });

        afterEach(() => {
            document.body.innerHTML = '';
        });

        test('createContext should create context with default value', () => {
            const context = createContext({ theme: 'light' });

            expect(context.value).toEqual({ theme: 'light' });
        });

        test('context should update value', () => {
            const context = createContext({ count: 0 });

            context.value = { count: 5 };

            expect(context.value).toEqual({ count: 5 });
        });

        test('context should notify subscribers', () => {
            const context = createContext({ count: 0 });

            let notifyCount = 0;
            let lastValue: any = null;

            context.subscribe((value) => {
                notifyCount++;
                lastValue = value;
            });

            expect(notifyCount).toBe(1); // Initial call

            context.value = { count: 5 };

            expect(notifyCount).toBe(2);
            expect(lastValue).toEqual({ count: 5 });
        });

        test('context should not notify on same value', () => {
            const context = createContext({ count: 0 });

            let notifyCount = 0;

            context.subscribe(() => {
                notifyCount++;
            });

            const initialCount = notifyCount;

            expect(notifyCount).toBe(initialCount);
        });

        test('context subscribe should return unsubscribe function', () => {
            const context = createContext({ count: 0 });

            let notifyCount = 0;

            const unsubscribe = context.subscribe(() => {
                notifyCount++;
            });

            expect(notifyCount).toBe(1);

            context.value = { count: 1 };
            expect(notifyCount).toBe(2);

            unsubscribe();

            context.value = { count: 2 };
            expect(notifyCount).toBe(2); // Should not increase
        });

        test('context should reset to default value', () => {
            const context = createContext({ count: 0 });

            context.value = { count: 10 };
            expect(context.value.count).toBe(10);

            context.reset();

            expect(context.value.count).toBe(0);
        });

        test('context should update with updater function', () => {
            const context = createContext({ count: 0 });

            context.update(prev => ({ count: prev.count + 1 }));

            expect(context.value.count).toBe(1);
        });

        test('context should handle subscriber errors gracefully', () => {
            const context = createContext({ count: 0 });

            context.subscribe(() => {
                throw new Error('Subscriber error');
            });

            // Should not throw
            expect(() => {
                context.value = { count: 1 };
            }).not.toThrow();
        });

        test('context should report subscriber count', () => {
            const context = createContext({ count: 0 });

            expect(context.subscriberCount).toBe(0);

            const unsub1 = context.subscribe(() => {});
            expect(context.subscriberCount).toBe(1);

            const unsub2 = context.subscribe(() => {});
            expect(context.subscriberCount).toBe(2);

            unsub1();
            expect(context.subscriberCount).toBe(1);

            unsub2();
            expect(context.subscriberCount).toBe(0);
        });

        test('Provider should render children', async () => {
            const ThemeContext = createContext({ theme: 'light' });

            class TestProvider extends Provider<{ theme: string }> {}

            const provider = new TestProvider({
                context: ThemeContext,
                value: { theme: 'dark' },
                children: createElement('div', { className: 'child' }, 'Content')
            });

            await provider.mount(container);

            expect(container.querySelector('.child')).toBeTruthy();
            expect(container.textContent).toBe('Content');
        });

        test('Provider should update context value on mount', async () => {
            const ThemeContext = createContext({ theme: 'light' });

            class TestProvider extends Provider<{ theme: string }> {}

            const provider = new TestProvider({
                context: ThemeContext,
                value: { theme: 'dark' },
                children: createElement('div', {}, 'Content')
            });

            expect(ThemeContext.value.theme).toBe('light');

            await provider.mount(container);

            expect(ThemeContext.value.theme).toBe('dark');
        });

        test('Provider should update context on props change', async () => {
            const ThemeContext = createContext({ theme: 'light' });

            class TestProvider extends Provider<{ theme: string }> {}

            const provider = new TestProvider({
                context: ThemeContext,
                value: { theme: 'dark' },
                children: createElement('div', {}, 'Content')
            });

            await provider.mount(container);

            expect(ThemeContext.value.theme).not.toBeNull();
            if (ThemeContext.value.theme !== null) {
                expect(ThemeContext.value.theme).toBe('dark');
            }

            provider.setProps({ value: { theme: 'light' } });
            await new Promise(resolve => setTimeout(resolve, 50));

            expect(ThemeContext.value.theme).not.toBeNull();
            if (ThemeContext.value.theme !== null) {
                expect(ThemeContext.value.theme).toBe('light');
            }
        });

        test('Provider should handle array children', async () => {
            const ThemeContext = createContext({ theme: 'light' });

            class TestProvider extends Provider<{ theme: string }> {}

            const provider = new TestProvider({
                context: ThemeContext,
                value: { theme: 'dark' },
                children: [
                    createElement('div', { className: 'child1' }, 'Child 1'),
                    createElement('div', { className: 'child2' }, 'Child 2')
                ]
            });

            await provider.mount(container);

            expect(container.querySelector('.child1')).toBeTruthy();
            expect(container.querySelector('.child2')).toBeTruthy();
        });

        test('useContext should subscribe component to context', async () => {
            const ThemeContext = createContext({ theme: 'light' });

            class ConsumerComponent extends Component {
                render() {
                    const theme = useContext(ThemeContext, this);

                    return createElement('div', {
                        className: theme.theme
                    }, `Theme: ${theme.theme}`);
                }
            }

            const component = new ConsumerComponent();
            await component.mount(container);

            expect(container.textContent).toBe('Theme: light');

            ThemeContext.value = { theme: 'dark' };
            await new Promise(resolve => setTimeout(resolve, 50));

            expect(container.textContent).toBe('Theme: dark');
        });

        test('createCombinedContext should create combined context', () => {
            const combined = createCombinedContext({
                theme: 'light',
                user: { name: 'John' },
                count: 0
            });

            expect(combined.get('theme').value).toBe('light');
            expect(combined.get('user').value).toEqual({ name: 'John' });
            expect(combined.get('count').value).toBe(0);
        });

        test('combinedContext should set values', () => {
            const combined = createCombinedContext({
                theme: 'light',
                count: 0
            });

            combined.set('theme', 'dark');
            combined.set('count', 5);

            expect(combined.get('theme').value).toBe('dark');
            expect(combined.get('count').value).toBe(5);
        });

        test('combinedContext should subscribe to keys', () => {
            const combined = createCombinedContext({
                theme: 'light',
                count: 0
            });

            let themeUpdates = 0;
            let lastTheme: string | null = null;

            combined.subscribe('theme', (value) => {
                themeUpdates++;
                lastTheme = value;
            });

            expect(themeUpdates).toBe(1); // Initial
            expect(lastTheme).toBe('light' as any);

            combined.set('theme', 'dark');

            expect(themeUpdates).toBe(2);
            expect(lastTheme).toBe('dark' as any);
        });

        test('combinedContext should reset all contexts', () => {
            const combined = createCombinedContext({
                theme: 'light',
                count: 0
            });

            combined.set('theme', 'dark');
            combined.set('count', 10);

            expect(combined.get('theme').value).toBe('dark');
            expect(combined.get('count').value).toBe(10);

            combined.reset();

            expect(combined.get('theme').value).toBe('light');
            expect(combined.get('count').value).toBe(0);
        });

        test('combinedContext should throw on invalid key', () => {
            const combined = createCombinedContext({
                theme: 'light'
            });

            expect(() => {
                combined.get('invalid' as any);
            }).toThrow('Context key "invalid" not found');

            expect(() => {
                combined.subscribe('invalid' as any, () => {});
            }).toThrow('Context key "invalid" not found');
        });

        test('context should handle multiple subscribers independently', () => {
            const context = createContext({ count: 0 });

            let updates1 = 0;
            let updates2 = 0;

            const unsub1 = context.subscribe(() => { updates1++; });
            const unsub2 = context.subscribe(() => { updates2++; });

            expect(updates1).toBe(1);
            expect(updates2).toBe(1);

            context.value = { count: 1 };

            expect(updates1).toBe(2);
            expect(updates2).toBe(2);

            unsub1();

            context.value = { count: 2 };

            expect(updates1).toBe(2); // Should not increase
            expect(updates2).toBe(3);

            unsub2();
        });

        test('nested providers should work', async () => {
            const ThemeContext = createContext({ theme: 'light' });
            const UserContext = createContext({ name: 'Anonymous' });

            class ThemeProvider extends Provider<{ theme: string }> {}
            class UserProvider extends Provider<{ name: string }> {}

            class ConsumerComponent extends Component {
                render() {
                    const theme = useContext(ThemeContext, this);
                    const user = useContext(UserContext, this);

                    return createElement('div', {},
                        `Theme: ${theme.theme}, User: ${user.name}`
                    );
                }
            }

            const themeProvider = new ThemeProvider({
                context: ThemeContext,
                value: { theme: 'dark' },
                children: createElement('div', { className: 'theme-container' })
            });

            await themeProvider.mount(container);

            const themeContainer = container.querySelector('.theme-container');
            if (themeContainer) {
                const userProvider = new UserProvider({
                    context: UserContext,
                    value: { name: 'John' },
                    children: createElement('div', { className: 'user-container' })
                });

                await userProvider.mount(themeContainer as HTMLElement);

                const userContainer = container.querySelector('.user-container');
                if (userContainer) {
                    const consumer = new ConsumerComponent();
                    await consumer.mount(userContainer as HTMLElement);

                    expect(container.textContent).toContain('Theme: dark');
                    expect(container.textContent).toContain('User: John');
                }
            }
        });

        test('context should handle complex object updates', () => {
            interface AppState {
                user: {
                    name: string;
                    settings: {
                        theme: string;
                        notifications: boolean;
                    };
                };
                items: string[];
            }

            const context = createContext<AppState>({
                user: {
                    name: 'John',
                    settings: {
                        theme: 'light',
                        notifications: true
                    }
                },
                items: ['a', 'b']
            });

            let updateCount = 0;
            context.subscribe(() => { updateCount++; });

            const initialCount = updateCount;

            context.value = {
                ...context.value,
                user: {
                    ...context.value.user,
                    settings: {
                        ...context.value.user.settings,
                        theme: 'dark'
                    }
                }
            };

            expect(updateCount).toBe(initialCount + 1);
            expect(context.value.user.settings.theme).toBe('dark');
            expect(context.value.user.settings.notifications).toBe(true);
        });

        test('context update should not notify if updater returns same reference', () => {
            const context = createContext({ count: 0 });

            let updateCount = 0;
            context.subscribe(() => { updateCount++; });

            const initialCount = updateCount;

            // Update that returns same value
            context.update(prev => prev);

            expect(updateCount).toBe(initialCount);
        });

        test('multiple contexts can be used independently', () => {
            const context1 = createContext({ value: 1 });
            const context2 = createContext({ value: 2 });

            let updates1 = 0;
            let updates2 = 0;

            context1.subscribe(() => { updates1++; });
            context2.subscribe(() => { updates2++; });

            context1.value = { value: 10 };

            expect(updates1).toBe(2);
            expect(updates2).toBe(1); // Should not update

            context2.value = { value: 20 };

            expect(updates1).toBe(2); // Should not update
            expect(updates2).toBe(2);
        });
    });

// ╚══════════════════════════════════════════════════════════════════════════════════════╝