// test/styles.test.ts
//
// Made with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import './setup';
    import { describe, expect, test, beforeEach, afterEach } from 'bun:test';
    import { StyleManager, css, Component, createElement } from '../src/main';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TEST ════════════════════════════════════════╗

    describe('StyleManager', () => {
        beforeEach(() => {
            StyleManager.clear();
            document.head.innerHTML = '';
        });

        afterEach(() => {
            StyleManager.clear();
            document.head.innerHTML = '';
        });

        test('should inject styles into document', () => {
            const styles = '.test { color: red; }';
            const id = StyleManager.inject(styles, 'TestComponent');

            expect(id).toBe('TestComponent');

            const styleElement = document.querySelector(`style[data-component="${id}"]`);
            expect(styleElement).toBeTruthy();
            expect(styleElement?.textContent).toContain('color: red');
        });

        test('should scope styles with component name', () => {
            const styles = '.button { color: blue; }';
            StyleManager.inject(styles, 'MyComponent');

            const styleElement = document.querySelector('style[data-component="MyComponent"]');
            expect(styleElement?.textContent).toContain('[data-scope="MyComponent"]');
        });

        test('should not inject duplicate styles', () => {
            const styles = '.test { color: red; }';

            const id1 = StyleManager.inject(styles, 'TestComponent');
            const id2 = StyleManager.inject(styles, 'TestComponent');

            expect(id1).toBe(id2);

            const styleElements = document.querySelectorAll('style[data-component="TestComponent"]');
            expect(styleElements.length).toBe(1);
        });

        test('should remove styles from document', () => {
            const styles = '.test { color: red; }';
            const id = StyleManager.inject(styles, 'TestComponent');

            let styleElement = document.querySelector(`style[data-component="${id}"]`);
            expect(styleElement).toBeTruthy();

            StyleManager.remove(id);

            styleElement = document.querySelector(`style[data-component="${id}"]`);
            expect(styleElement).toBeFalsy();
        });

        test('should handle removing non-existent styles', () => {
            expect(() => {
                StyleManager.remove('NonExistent');
            }).not.toThrow();
        });

        test('should generate unique IDs when no component name provided', () => {
            const id1 = StyleManager.inject('.test1 {}');
            const id2 = StyleManager.inject('.test2 {}');

            expect(id1).not.toBe(id2);
        });

        test('should scope multiple selectors', () => {
            const styles = `
                .button { color: red; }
                .input { color: blue; }
                .container { display: flex; }
            `;

            StyleManager.inject(styles, 'MultiComponent');

            const styleElement = document.querySelector('style[data-component="MultiComponent"]');
            const content = styleElement?.textContent || '';

            expect(content).toContain('[data-scope="MultiComponent"] .button');
            expect(content).toContain('[data-scope="MultiComponent"] .input');
            expect(content).toContain('[data-scope="MultiComponent"] .container');
        });

        test('should not scope :root selector', () => {
            const styles = ':root { --primary: blue; }';
            StyleManager.inject(styles, 'RootComponent');

            const styleElement = document.querySelector('style[data-component="RootComponent"]');
            const content = styleElement?.textContent || '';

            expect(content).toContain(':root');
            expect(content).not.toContain('[data-scope="RootComponent"] :root');
        });

        test('should not scope * selector', () => {
            const styles = '* { margin: 0; }';
            StyleManager.inject(styles, 'UniversalComponent');

            const styleElement = document.querySelector('style[data-component="UniversalComponent"]');
            const content = styleElement?.textContent || '';

            expect(content).toContain('*');
            expect(content).not.toContain('[data-scope="UniversalComponent"] *');
        });

        test('should handle media queries', () => {
            const styles = `
                @media (max-width: 768px) {
                    .button { font-size: 14px; }
                }
            `;

            StyleManager.inject(styles, 'ResponsiveComponent');

            const styleElement = document.querySelector('style[data-component="ResponsiveComponent"]');
            expect(styleElement?.textContent).toContain('@media');
        });

        test('should handle keyframes', () => {
            const styles = `
                @keyframes slide {
                    from { left: 0; }
                    to { left: 100%; }
                }
            `;

            StyleManager.inject(styles, 'AnimatedComponent');

            const styleElement = document.querySelector('style[data-component="AnimatedComponent"]');
            expect(styleElement?.textContent).toContain('@keyframes');
        });

        test('should clear all styles', () => {
            StyleManager.inject('.test1 {}', 'Component1');
            StyleManager.inject('.test2 {}', 'Component2');
            StyleManager.inject('.test3 {}', 'Component3');

            expect(document.querySelectorAll('style[data-component]').length).toBe(3);

            StyleManager.clear();

            expect(document.querySelectorAll('style[data-component]').length).toBe(0);
        });

        test('css template literal should return string', () => {
            const color = 'red';
            const size = '14px';

            const styles = css`
                .button {
                    color: ${color};
                    font-size: ${size};
                }
            `;

            expect(styles).toContain('color: red');
            expect(styles).toContain('font-size: 14px');
        });

        test('css template should handle nested values', () => {
            const theme = {
                primary: 'blue',
                secondary: 'green'
            };

            const styles = css`
                .button {
                    background: ${theme.primary};
                    border-color: ${theme.secondary};
                }
            `;

            expect(styles).toContain('background: blue');
            expect(styles).toContain('border-color: green');
        });

        test('component styles should be scoped', async () => {
            const container = document.createElement('div');
            document.body.appendChild(container);

            class StyledComponent extends Component {
                render() {
                    return createElement('div', { className: 'styled' }, 'Content');
                }

                styles() {
                    return css`
                        .styled { color: purple; }
                    `;
                }
            }

            const component = new StyledComponent();
            await component.mount(container);

            const styleElement = document.querySelector('style[data-component="StyledComponent"]');
            expect(styleElement).toBeTruthy();

            component.unmount();
            document.body.innerHTML = '';
        });

        test('should handle complex selectors', () => {
            const styles = `
                .parent > .child { color: red; }
                .sibling + .sibling { margin-left: 10px; }
                .element:hover { background: blue; }
                .element::before { content: ''; }
            `;

            StyleManager.inject(styles, 'ComplexComponent');

            const styleElement = document.querySelector('style[data-component="ComplexComponent"]');
            const content = styleElement?.textContent || '';

            expect(content).toContain('[data-scope="ComplexComponent"]');
        });

        test('should handle empty styles', () => {
            expect(() => {
                StyleManager.inject('', 'EmptyComponent');
            }).not.toThrow();
        });

        test('should handle styles with comments', () => {
            const styles = `
                /* This is a comment */
                .button { color: red; }
                // Another comment
                .input { color: blue; }
            `;

            expect(() => {
                StyleManager.inject(styles, 'CommentedComponent');
            }).not.toThrow();
        });

        test('should handle pseudo-classes', () => {
            const styles = `
                .button:hover { background: blue; }
                .input:focus { border-color: green; }
                .link:visited { color: purple; }
            `;

            StyleManager.inject(styles, 'PseudoComponent');

            const styleElement = document.querySelector('style[data-component="PseudoComponent"]');
            expect(styleElement?.textContent).toContain(':hover');
            expect(styleElement?.textContent).toContain(':focus');
            expect(styleElement?.textContent).toContain(':visited');
        });

        test('should handle pseudo-elements', () => {
            const styles = `
                .element::before { content: '→'; }
                .element::after { content: '←'; }
            `;

            StyleManager.inject(styles, 'PseudoElementComponent');

            const styleElement = document.querySelector('style[data-component="PseudoElementComponent"]');
            expect(styleElement?.textContent).toContain('::before');
            expect(styleElement?.textContent).toContain('::after');
        });

        test('should handle attribute selectors', () => {
            const styles = `
                [disabled] { opacity: 0.5; }
                input[type="text"] { border: 1px solid gray; }
            `;

            StyleManager.inject(styles, 'AttributeComponent');

            const styleElement = document.querySelector('style[data-component="AttributeComponent"]');
            expect(styleElement?.textContent).toContain('[disabled]');
            expect(styleElement?.textContent).toContain('[type="text"]');
        });

        test('multiple components should have separate styles', () => {
            StyleManager.inject('.button { color: red; }', 'Component1');
            StyleManager.inject('.button { color: blue; }', 'Component2');

            const style1 = document.querySelector('style[data-component="Component1"]');
            const style2 = document.querySelector('style[data-component="Component2"]');

            expect(style1?.textContent).toContain('color: red');
            expect(style2?.textContent).toContain('color: blue');
        });

        test('should handle CSS variables', () => {
            const styles = `
                .element {
                    --custom-color: blue;
                    color: var(--custom-color);
                }
            `;

            StyleManager.inject(styles, 'VariableComponent');

            const styleElement = document.querySelector('style[data-component="VariableComponent"]');
            expect(styleElement?.textContent).toContain('--custom-color');
            expect(styleElement?.textContent).toContain('var(--custom-color)');
        });

        test('should handle @import statements', () => {
            const styles = `
                @import url('https://fonts.googleapis.com/css2?family=Roboto');
                .text { font-family: Roboto; }
            `;

            StyleManager.inject(styles, 'ImportComponent');

            const styleElement = document.querySelector('style[data-component="ImportComponent"]');
            expect(styleElement?.textContent).toContain('@import');
        });

        test('css template should handle multiline', () => {
            const styles = css`
                .container {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .item {
                    padding: 0.5rem;
                }
            `;

            expect(styles).toContain('display: flex');
            expect(styles).toContain('flex-direction: column');
            expect(styles).toContain('padding: 0.5rem');
        });

        test('should handle special characters in selectors', () => {
            const styles = `
                .my-button { color: red; }
                .my_input { color: blue; }
                #unique-id { color: green; }
            `;

            expect(() => {
                StyleManager.inject(styles, 'SpecialCharsComponent');
            }).not.toThrow();
        });
    });

// ╚══════════════════════════════════════════════════════════════════════════════════════╝