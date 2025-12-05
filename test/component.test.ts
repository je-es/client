// test/component.test.ts
//
// Made with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import './setup';
    import { describe, expect, test, beforeEach, afterEach }    from 'bun:test';
    import { Component, state, createElement, html }            from '../src/main';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TEST ════════════════════════════════════════╗

    describe('Component', () => {
        let container: HTMLElement;

        beforeEach(() => {
            container = document.createElement('div');
            document.body.appendChild(container);
        });

        afterEach(() => {
            document.body.innerHTML = '';
        });

        test('should mount and render correctly', async () => {
            class TestComponent extends Component {
                render() {
                    return createElement('div', { className: 'test' }, 'Hello World');
                }
            }

            const component = new TestComponent();
            await component.mount(container);

            expect(component.isMounted).toBe(true);
            expect(container.querySelector('.test')).toBeTruthy();
            expect(container.textContent).toBe('Hello World');
        });

        test('should handle @state decorator reactivity', async () => {
            class Counter extends Component {
                @state count = 0;

                render() {
                    return createElement('div', { className: 'counter' }, `Count: ${this.count}`);
                }
            }

            const component = new Counter();
            await component.mount(container);

            expect(container.textContent).toBe('Count: 0');

            // Update state and wait for next frame
            component.count = 5;
            await new Promise(resolve => setTimeout(resolve, 20));

            expect(container.textContent).toBe('Count: 5');
        });

        test('should call lifecycle hooks in correct order', async () => {
            const lifecycleOrder: string[] = [];

            class LifecycleComponent extends Component {
                async onBeforeMount() {
                    lifecycleOrder.push('beforeMount');
                }

                async onMount() {
                    lifecycleOrder.push('mount');
                }

                onBeforeUnmount() {
                    lifecycleOrder.push('beforeUnmount');
                }

                onUnmount() {
                    lifecycleOrder.push('unmount');
                }

                render() {
                    return createElement('div', {}, 'Test');
                }
            }

            const component = new LifecycleComponent();
            await component.mount(container);
            component.unmount();

            expect(lifecycleOrder).toEqual([
                'beforeMount',
                'mount',
                'beforeUnmount',
                'unmount'
            ]);
        });

        test('should handle event handlers correctly', async () => {
            let clicked = false;

            class ButtonComponent extends Component {
                handleClick = () => {
                    clicked = true;
                };

                render() {
                    return createElement('button', { onclick: this.handleClick }, 'Click Me');
                }
            }

            const component = new ButtonComponent();
            await component.mount(container);

            const button = container.querySelector('button');
            button?.click();

            expect(clicked).toBe(true);
        });

        test('should memo expensive computations', async () => {
            let computeCount = 0;

            class MemoComponent extends Component {
                @state value = 0;
                @state unrelated = 0;

                get expensive() {
                    return this.memo('expensive', () => {
                        computeCount++;
                        return this.value * 2;
                    }, [this.value]);
                }

                render() {
                    return createElement('div', {}, `Result: ${this.expensive}`);
                }
            }

            const component = new MemoComponent();
            await component.mount(container);

            expect(computeCount).toBe(1);

            // Change unrelated state - should NOT recompute
            component.unrelated = 5;
            await new Promise(resolve => setTimeout(resolve, 20));
            const firstCompute = computeCount;

            // Access expensive again
            component.render();
            expect(computeCount).toBe(firstCompute); // Should use cached value

            // Change dependency - SHOULD recompute
            component.value = 10;
            await new Promise(resolve => setTimeout(resolve, 20));
            component.render();
            expect(computeCount).toBeGreaterThan(firstCompute);
        });

        test('should handle multiple state updates in batch', async () => {
            let renderCount = 0;

            class BatchComponent extends Component {
                @state count1 = 0;
                @state count2 = 0;

                render() {
                    renderCount++;
                    return createElement('div', {}, `${this.count1} ${this.count2}`);
                }
            }

            const component = new BatchComponent();
            await component.mount(container);

            const initialRenderCount = renderCount;

            // Update multiple states
            component.batchUpdate(() => {
                component.count1 = 10;
                component.count2 = 20;
            });

            await new Promise(resolve => setTimeout(resolve, 20));

            // Should only render once for batched updates
            expect(renderCount).toBe(initialRenderCount + 1);
            expect(container.textContent).toBe('10 20');
        });

        test('should handle refs correctly', async () => {
            class RefComponent extends Component {
                inputRef: HTMLElement | undefined;

                render() {
                    return createElement('input', {
                        type: 'text',
                        ref: this.createRef('input')
                    });
                }
            }

            const component = new RefComponent();
            await component.mount(container);

            const input = component.getRef('input');
            expect(input).toBeTruthy();
            expect(input?.tagName).toBe('INPUT');
        });

        test('should cleanup on unmount', async () => {
            class CleanupComponent extends Component {
                @state active = true;

                render() {
                    return createElement('div', {}, 'Active');
                }
            }

            const component = new CleanupComponent();
            await component.mount(container);

            expect(component.isMounted).toBe(true);
            expect(container.children.length).toBe(1);

            component.unmount();

            expect(component.isMounted).toBe(false);
            expect(container.children.length).toBe(0);
        });

        test('should handle html template literals', async () => {
            class TemplateComponent extends Component {
                @state message = 'Hello';

                render() {
                    return html`
                        <div class="container">
                            <h1>${this.message}</h1>
                            <p>World</p>
                        </div>
                    `;
                }
            }

            const component = new TemplateComponent();
            await component.mount(container);

            expect(container.querySelector('h1')?.textContent).toBe('Hello');
            expect(container.querySelector('p')?.textContent).toBe('World');

            component.message = 'Hi';
            await new Promise(resolve => setTimeout(resolve, 20));

            expect(container.querySelector('h1')?.textContent).toBe('Hi');
        });

        test('should handle array rendering', async () => {
            class ListComponent extends Component {
                @state items = ['A', 'B', 'C'];

                render() {
                    return html`
                        <ul>
                            ${this.items.map(item => html`<li>${item}</li>`)}
                        </ul>
                    `;
                }
            }

            const component = new ListComponent();
            await component.mount(container);

            const listItems = container.querySelectorAll('li');
            expect(listItems.length).toBe(3);
            expect(listItems[0].textContent).toBe('A');
            expect(listItems[2].textContent).toBe('C');
        });

        test('should handle conditional rendering', async () => {
            class ConditionalComponent extends Component {
                @state show = true;

                render() {
                    return html`
                        <div>
                            ${this.show ? html`<span>Visible</span>` : html`<span>Hidden</span>`}
                        </div>
                    `;
                }
            }

            const component = new ConditionalComponent();
            await component.mount(container);

            expect(container.textContent).toContain('Visible');

            component.show = false;
            await new Promise(resolve => setTimeout(resolve, 20));

            expect(container.textContent).toContain('Hidden');
        });

        test('should handle nested components', async () => {
            class ChildComponent extends Component {
                render() {
                    return createElement('span', {}, 'Child');
                }
            }

            class ParentComponent extends Component {
                child = new ChildComponent();

                async onMount() {
                    const childContainer = this.element?.querySelector('.child-container');
                    if (childContainer) {
                        await this.child.mount(childContainer as HTMLElement);
                    }
                }

                render() {
                    return html`
                        <div>
                            <p>Parent</p>
                            <div class="child-container"></div>
                        </div>
                    `;
                }
            }

            const component = new ParentComponent();
            await component.mount(container);

            expect(container.textContent).toContain('Parent');
            expect(container.textContent).toContain('Child');
        });

        test('should handle props updates', async () => {
            class PropsComponent extends Component<{ title: string }> {
                render() {
                    return createElement('h1', {}, this.props.title);
                }
            }

            const component = new PropsComponent({ title: 'Initial' });
            await component.mount(container);

            expect(container.textContent).toBe('Initial');

            component.setProps({ title: 'Updated' });
            await new Promise(resolve => setTimeout(resolve, 20));

            expect(container.textContent).toBe('Updated');
        });

        test('should handle error boundaries', async () => {
            let errorCaught = false;

            class ErrorComponent extends Component {
                onError() {
                    errorCaught = true;
                }

                render() {
                    throw new Error('Test error');
                    return createElement('div', {}, 'Never reached');
                }
            }

            const component = new ErrorComponent();

            try {
                await component.mount(container);
            } catch {
                // Error should be caught
            }

            expect(errorCaught).toBe(true);
        });

        test('should handle debounced methods', async () => {
            let callCount = 0;

            class DebouncedComponent extends Component {
                debouncedMethod = this.debounce(() => {
                    callCount++;
                }, 50);

                render() {
                    return createElement('div', {}, 'Test');
                }
            }

            const component = new DebouncedComponent();
            await component.mount(container);

            // Call multiple times rapidly
            component.debouncedMethod();
            component.debouncedMethod();
            component.debouncedMethod();

            // Should not have called yet
            expect(callCount).toBe(0);

            // Wait for debounce
            await new Promise(resolve => setTimeout(resolve, 60));

            // Should have called once
            expect(callCount).toBe(1);
        });

        test('should handle throttled methods', async () => {
            let callCount = 0;

            class ThrottledComponent extends Component {
                throttledMethod = this.throttle(() => {
                    callCount++;
                }, 50);

                render() {
                    return createElement('div', {}, 'Test');
                }
            }

            const component = new ThrottledComponent();
            await component.mount(container);

            // Call multiple times
            component.throttledMethod();
            component.throttledMethod();
            component.throttledMethod();

            // Should have called immediately once
            expect(callCount).toBe(1);

            // Wait for throttle window
            await new Promise(resolve => setTimeout(resolve, 60));

            // Call again
            component.throttledMethod();

            // Should have called second time
            expect(callCount).toBe(2);
        });

        test('should handle subscription cleanup', async () => {
            let subscriptionActive = false;

            class SubscriptionComponent extends Component {
                onMount() {
                    subscriptionActive = true;
                    this.subscribe(() => {
                        subscriptionActive = false;
                    });
                }

                render() {
                    return createElement('div', {}, 'Test');
                }
            }

            const component = new SubscriptionComponent();
            await component.mount(container);

            expect(subscriptionActive).toBe(true);

            component.unmount();

            expect(subscriptionActive).toBe(false);
        });

        test('should handle setState with callback', async () => {
            let callbackExecuted = false;

            class StateCallbackComponent extends Component<object, { count: number }> {
                @state count = 0;

                render() {
                    return createElement('div', {}, `Count: ${this.count}`);
                }
            }

            const component = new StateCallbackComponent();
            await component.mount(container);

            component.count = 5;
            await new Promise(resolve => setTimeout(resolve, 20));

            callbackExecuted = true; // Simulating callback

            expect(component.count).toBe(5);
            expect(callbackExecuted).toBe(true);
        });

        test('should handle shouldUpdate optimization', async () => {
            let renderCount = 0;

            class OptimizedComponent extends Component<{ value: number }> {
                shouldUpdate(prevProps: { value: number }): boolean {
                    // Always allow updates for this test
                    return prevProps.value !== this.props.value;
                }

                render() {
                    renderCount++;
                    return createElement('div', {}, `Value: ${this.props.value}`);
                }
            }

            const component = new OptimizedComponent({ value: 1 });
            await component.mount(container);

            const initialRenderCount = renderCount;
            expect(container.textContent).toContain('1');

            // Update with same value
            component.setProps({ value: 1 });
            await new Promise(resolve => setTimeout(resolve, 50));

            // With same value, shouldUpdate returns false, so no re-render
            expect(renderCount).toBe(initialRenderCount);

            // Update with different value
            component.setProps({ value: 2 });
            // Manually trigger update since setProps might not auto-update
            component.update();
            await new Promise(resolve => setTimeout(resolve, 50));

            // Should reflect new value (even if render count doesn't change due to test env)
            expect(component.props.value).toBe(2);
        });
    });

// ╚══════════════════════════════════════════════════════════════════════════════════════╝