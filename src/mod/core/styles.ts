// src/mod/core/styles.ts
//
// Made with ❤️ by Maysara.



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

    /**
     * Style Manager - handles CSS injection and scoping
     */
    export class StyleManager {
        private static styles = new Map<string, HTMLStyleElement>();
        private static scopeCounter = 0;

        /**
         * Inject styles into document
         */
        static inject(css: string, componentName?: string): string {
            const id = componentName || `style-${this.scopeCounter++}`;

            if (this.styles.has(id)) {
                return id;
            }

            const styleElement = document.createElement('style');
            styleElement.setAttribute('data-component', id);

            // Scope the CSS
            const scopedCSS = this.scopeStyles(css, id);
            styleElement.textContent = scopedCSS;

            document.head.appendChild(styleElement);
            this.styles.set(id, styleElement);

            return id;
        }

        /**
         * Remove styles from document
         */
        static remove(id: string): void {
            const styleElement = this.styles.get(id);
            if (styleElement && styleElement.parentElement) {
                styleElement.parentElement.removeChild(styleElement);
                this.styles.delete(id);
            }
        }

        /**
         * Scope CSS selectors
         */
        private static scopeStyles(css: string, scope: string): string {
            // Simple scoping - prefix all selectors with [data-scope="id"]
            // This is a basic implementation. A production version would use a proper CSS parser

            const lines = css.split('\n');
            const scopedLines: string[] = [];
            let inMediaQuery = false;
            let braceCount = 0;

            for (let line of lines) {
                line = line.trim();

                // Handle media queries
                if (line.startsWith('@media')) {
                    inMediaQuery = true;
                    scopedLines.push(line);
                    continue;
                }

                // Count braces
                braceCount += (line.match(/{/g) || []).length;
                braceCount -= (line.match(/}/g) || []).length;

                if (inMediaQuery && braceCount === 0) {
                    inMediaQuery = false;
                }

                // Scope selectors
                if (line.includes('{') && !line.startsWith('@') && !line.startsWith('}')) {
                    const selector = line.substring(0, line.indexOf('{')).trim();
                    const rest = line.substring(line.indexOf('{'));

                    // Don't scope :root, *, or @-rules
                    if (selector === ':root' || selector === '*' || line.startsWith('@')) {
                        scopedLines.push(line);
                    } else {
                        const scopedSelector = `[data-scope="${scope}"] ${selector}`;
                        scopedLines.push(`${scopedSelector} ${rest}`);
                    }
                } else {
                    scopedLines.push(line);
                }
            }

            return scopedLines.join('\n');
        }

        /**
         * Clear all styles
         */
        static clear(): void {
            for (const [, element] of this.styles) {
                if (element.parentElement) {
                    element.parentElement.removeChild(element);
                }
            }
            this.styles.clear();
        }
    }

    /**
     * CSS template literal tag
     * Usage: css`.class { color: red; }`
     */
    export function css(
        strings: TemplateStringsArray,
        ...values: (string | number | boolean | null | undefined)[]
    ): string {
        let result = '';

        for (let i = 0; i < strings.length; i++) {
            result += strings[i];
            if (i < values.length) {
                result += values[i];
            }
        }

        return result;
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝