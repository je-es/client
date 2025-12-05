/* eslint-disable @typescript-eslint/no-explicit-any */
// test/decorators.test.ts
//
// Made with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import './setup';
    import { describe, expect, test, beforeEach, afterEach } from 'bun:test';
    import { Component, state, computed, watch, createElement } from '../src/main';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TEST ════════════════════════════════════════╗

    describe('Decorators', () => {
        let container: HTMLElement;

        beforeEach(() => {
            container = document.createElement('div');
            document.body.appendChild(container);
        });

        afterEach(() => {
            document.body.innerHTML = '';
        });

        test('@state should make property reactive', async () => {
            class TestComponent extends Component {
                @state count = 0;

                render() {
                    return createElement('div', {}, `Count: ${this.count}`);
                }
            }

            const component = new TestComponent();
            await component.mount(container);

            expect(container.textContent).toBe('Count: 0');

            component.count = 5;
            await new Promise(resolve => setTimeout(resolve, 50));

            expect(container.textContent).toBe('Count: 5');
        });

        test('@state should trigger update only when value changes', async () => {
            let updateCount = 0;

            class TestComponent extends Component {
                @state value = 'initial';

                update() {
                    updateCount++;
                    super.update();
                }

                render() {
                    return createElement('div', {}, this.value);
                }
            }

            const component = new TestComponent();
            await component.mount(container);

            const initialUpdates = updateCount;

            // Set same value
            component.value = 'initial';
            await new Promise(resolve => setTimeout(resolve, 50));

            expect(updateCount).toBe(initialUpdates);

            // Set different value
            component.value = 'changed';
            await new Promise(resolve => setTimeout(resolve, 50));

            expect(updateCount).toBeGreaterThan(initialUpdates);
        });

        test('@state should work with multiple properties', async () => {
            class TestComponent extends Component {
                @state firstName = 'John';
                @state lastName = 'Doe';

                render() {
                    return createElement('div', {}, `${this.firstName} ${this.lastName}`);
                }
            }

            const component = new TestComponent();
            await component.mount(container);

            expect(container.textContent).toBe('John Doe');

            component.firstName = 'Jane';
            await new Promise(resolve => setTimeout(resolve, 50));

            expect(container.textContent).toBe('Jane Doe');

            component.lastName = 'Smith';
            await new Promise(resolve => setTimeout(resolve, 50));

            expect(container.textContent).toBe('Jane Smith');
        });

        test('@state should handle complex objects', async () => {
            class TestComponent extends Component {
                @state user = { name: 'John', age: 30 };

                render() {
                    return createElement('div', {}, `${this.user.name}, ${this.user.age}`);
                }
            }

            const component = new TestComponent();
            await component.mount(container);

            expect(container.textContent).toBe('John, 30');

            component.user = { name: 'Jane', age: 25 };
            await new Promise(resolve => setTimeout(resolve, 50));

            expect(container.textContent).toBe('Jane, 25');
        });

        test('@state should handle arrays', async () => {
            class TestComponent extends Component {
                @state items = ['A', 'B', 'C'];

                render() {
                    return createElement('div', {}, this.items.join(', '));
                }
            }

            const component = new TestComponent();
            await component.mount(container);

            expect(container.textContent).toBe('A, B, C');

            component.items = ['X', 'Y', 'Z'];
            await new Promise(resolve => setTimeout(resolve, 50));

            expect(container.textContent).toBe('X, Y, Z');
        });

        test('@computed should cache computed values', async () => {
            let computeCount = 0;

            class TestComponent extends Component {
                @state firstName = 'John';
                @state lastName = 'Doe';

                @computed
                get fullName() {
                    computeCount++;
                    return `${this.firstName} ${this.lastName}`;
                }

                render() {
                    return createElement('div', {}, this.fullName);
                }
            }

            const component = new TestComponent();
            await component.mount(container);

            expect(container.textContent).toBe('John Doe');
            const initialComputes = computeCount;

            // Access multiple times - should use cache
            const name1 = component.fullName;
            const name2 = component.fullName;
            const name3 = component.fullName;

            expect(computeCount).toBe(initialComputes);
            expect(name1).toBe(name2);
            expect(name2).toBe(name3);
        });

        test('@computed should recompute when dependencies change', async () => {
            let computeCount = 0;

            class TestComponent extends Component {
                @state value = 10;

                @computed
                get doubled() {
                    computeCount++;
                    return this.value * 2;
                }

                render() {
                    return createElement('div', {}, `${this.doubled}`);
                }
            }

            const component = new TestComponent();
            await component.mount(container);

            const initialComputes = computeCount;

            component.value = 20;
            await new Promise(resolve => setTimeout(resolve, 50));

            // Should have recomputed
            expect(computeCount).toBeGreaterThan(initialComputes);
            expect(container.textContent).toBe('40');
        });

        test('@computed should work with complex calculations', async () => {
            class TestComponent extends Component {
                @state items = [1, 2, 3, 4, 5];

                @computed
                get total() {
                    return this.items.reduce((sum, item) => sum + item, 0);
                }

                @computed
                get average() {
                    return this.total / this.items.length;
                }

                render() {
                    return createElement('div', {}, `Total: ${this.total}, Avg: ${this.average}`);
                }
            }

            const component = new TestComponent();
            await component.mount(container);

            expect(container.textContent).toBe('Total: 15, Avg: 3');

            component.items = [10, 20, 30];
            await new Promise(resolve => setTimeout(resolve, 50));

            expect(container.textContent).toBe('Total: 60, Avg: 20');
        });

        test('@watch should observe property changes', async () => {
            let watchCallCount = 0;
            let lastOldValue: any;
            let lastNewValue: any;

            class TestComponent extends Component {
                @state count = 0;

                @watch('count')
                onCountChange(newValue: number, oldValue: number) {
                    watchCallCount++;
                    lastOldValue = oldValue;
                    lastNewValue = newValue;
                }

                render() {
                    return createElement('div', {}, `Count: ${this.count}`);
                }
            }

            const component = new TestComponent();
            await component.mount(container);

            component.count = 5;
            await new Promise(resolve => setTimeout(resolve, 50));

            expect(watchCallCount).toBeGreaterThan(0);
            expect(lastOldValue).toBe(0);
            expect(lastNewValue).toBe(5);
        });

        test('@watch should handle multiple watchers on same property', async () => {
            let watcher1Calls = 0;
            let watcher2Calls = 0;

            class TestComponent extends Component {
                @state value = 0;

                @watch('value')
                onValueChange1() {
                    watcher1Calls++;
                }

                @watch('value')
                onValueChange2() {
                    watcher2Calls++;
                }

                render() {
                    return createElement('div', {}, `${this.value}`);
                }
            }

            const component = new TestComponent();
            await component.mount(container);

            component.value = 10;
            await new Promise(resolve => setTimeout(resolve, 50));

            expect(watcher1Calls).toBeGreaterThan(0);
            expect(watcher2Calls).toBeGreaterThan(0);
        });

        test('@watch should work with different properties', async () => {
            let firstNameChanges = 0;
            let lastNameChanges = 0;

            class TestComponent extends Component {
                @state firstName = 'John';
                @state lastName = 'Doe';

                @watch('firstName')
                onFirstNameChange() {
                    firstNameChanges++;
                }

                @watch('lastName')
                onLastNameChange() {
                    lastNameChanges++;
                }

                render() {
                    return createElement('div', {}, `${this.firstName} ${this.lastName}`);
                }
            }

            const component = new TestComponent();
            await component.mount(container);

            component.firstName = 'Jane';
            await new Promise(resolve => setTimeout(resolve, 50));

            expect(firstNameChanges).toBeGreaterThan(0);
            expect(lastNameChanges).toBe(0);

            component.lastName = 'Smith';
            await new Promise(resolve => setTimeout(resolve, 50));

            expect(lastNameChanges).toBeGreaterThan(0);
        });

        test('decorators should work together', async () => {
            let watcherCalled = false;

            class TestComponent extends Component {
                @state firstName = 'John';
                @state lastName = 'Doe';

                @computed
                get fullName() {
                    return `${this.firstName} ${this.lastName}`;
                }

                @watch('firstName')
                onFirstNameChange() {
                    watcherCalled = true;
                }

                render() {
                    return createElement('div', {}, this.fullName);
                }
            }

            const component = new TestComponent();
            await component.mount(container);

            expect(container.textContent).toBe('John Doe');

            component.firstName = 'Jane';
            await new Promise(resolve => setTimeout(resolve, 50));

            expect(container.textContent).toBe('Jane Doe');
            expect(watcherCalled).toBe(true);
        });

        test('@state should not trigger updates when unmounted', async () => {
            let updateCount = 0;

            class TestComponent extends Component {
                @state value = 0;

                update() {
                    updateCount++;
                    super.update();
                }

                render() {
                    return createElement('div', {}, `${this.value}`);
                }
            }

            const component = new TestComponent();
            await component.mount(container);

            const beforeUnmount = updateCount;

            component.unmount();

            component.value = 10;
            await new Promise(resolve => setTimeout(resolve, 50));

            // Should not have triggered update
            expect(updateCount).toBe(beforeUnmount);
        });

        test('@computed should throw when used on non-getter', () => {
            expect(() => {
                class TestComponent extends Component {
                    @computed
                    notAGetter() {
                        return 'test';
                    }

                    render() {
                        return createElement('div', {});
                    }
                }

                new TestComponent();
            }).toThrow('@computed can only be used on getters');
        });

        test('@state with boolean values', async () => {
            class TestComponent extends Component {
                @state isActive = false;

                render() {
                    return createElement('div', {}, this.isActive ? 'Active' : 'Inactive');
                }
            }

            const component = new TestComponent();
            await component.mount(container);

            expect(container.textContent).toBe('Inactive');

            component.isActive = true;
            await new Promise(resolve => setTimeout(resolve, 50));

            expect(container.textContent).toBe('Active');
        });

        test('@state with null and undefined', async () => {
            class TestComponent extends Component {
                @state value: string | null = null;

                render() {
                    return createElement('div', {}, this.value || 'Empty');
                }
            }

            const component = new TestComponent();
            await component.mount(container);

            expect(container.textContent).toBe('Empty');

            component.value = 'Has Value';
            await new Promise(resolve => setTimeout(resolve, 50));

            expect(container.textContent).toBe('Has Value');

            component.value = null;
            await new Promise(resolve => setTimeout(resolve, 50));

            expect(container.textContent).toBe('Empty');
        });

        test('@computed with nested properties', async () => {
            class TestComponent extends Component {
                @state user = { profile: { name: 'John' } };

                @computed
                get userName() {
                    return this.user.profile.name;
                }

                render() {
                    return createElement('div', {}, this.userName);
                }
            }

            const component = new TestComponent();
            await component.mount(container);

            expect(container.textContent).toBe('John');

            component.user = { profile: { name: 'Jane' } };
            await new Promise(resolve => setTimeout(resolve, 50));

            expect(container.textContent).toBe('Jane');
        });

        test('@watch should receive correct old and new values', async () => {
            const changes: { old: number; new: number }[] = [];

            class TestComponent extends Component {
                @state count = 0;

                @watch('count')
                onCountChange(newValue: number, oldValue: number) {
                    changes.push({ old: oldValue, new: newValue });
                }

                render() {
                    return createElement('div', {}, `${this.count}`);
                }
            }

            const component = new TestComponent();
            await component.mount(container);

            component.count = 1;
            await new Promise(resolve => setTimeout(resolve, 50));

            component.count = 2;
            await new Promise(resolve => setTimeout(resolve, 50));

            component.count = 3;
            await new Promise(resolve => setTimeout(resolve, 50));

            expect(changes.length).toBeGreaterThan(0);
            if (changes.length >= 1) {
                expect(changes[0].old).toBe(0);
                expect(changes[0].new).toBe(1);
            }
        });

        test('multiple @state decorators in inheritance chain', async () => {
            class BaseComponent extends Component {
                @state baseValue = 'base';

                render() {
                    return createElement('div', {});
                }
            }

            class DerivedComponent extends BaseComponent {
                @state derivedValue = 'derived';

                render() {
                    return createElement('div', {}, `${this.baseValue}-${this.derivedValue}`);
                }
            }

            const component = new DerivedComponent();
            await component.mount(container);

            expect(container.textContent).toBe('base-derived');

            component.baseValue = 'new-base';
            await new Promise(resolve => setTimeout(resolve, 50));

            expect(container.textContent).toBe('new-base-derived');

            component.derivedValue = 'new-derived';
            await new Promise(resolve => setTimeout(resolve, 50));
            expect(container.textContent).toBe('new-base-new-derived');
        });
    });

// ╚══════════════════════════════════════════════════════════════════════════════════════╝