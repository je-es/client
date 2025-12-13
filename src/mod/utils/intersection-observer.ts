// src/mod/utils/intersection-observer.ts
//
// Made with ❤️ by Maysara.



// ╔════════════════════════════════════════ TYPE ════════════════════════════════════════╗

    /**
     * Configuration for intersection observer
     */
    export interface IntersectionConfig {
        root?: Element | null;
        rootMargin?: string;
        threshold?: number | number[];
        onEnter?: (entry: IntersectionObserverEntry) => void;
        onExit?: (entry: IntersectionObserverEntry) => void;
        once?: boolean; // If true, unobserve after first intersection
    }

    /**
     * Simple wrapper around Intersection Observer API
     * Makes it easy to detect when elements become visible
     */
    export class VisibilityObserver {
        private observer: IntersectionObserver | null = null;
        private observedElements = new Map<Element, boolean>(); // Track visibility state

        constructor(config: IntersectionConfig) {
            this.observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    const wasVisible = this.observedElements.get(entry.target) ?? false;
                    const isNowVisible = entry.isIntersecting;

                    // Only trigger callbacks on state change
                    if (isNowVisible && !wasVisible) {
                        // Element entered viewport
                        this.observedElements.set(entry.target, true);
                        config.onEnter?.(entry);

                        if (config.once) {
                            this.unobserve(entry.target);
                        }
                    } else if (!isNowVisible && wasVisible) {
                        // Element left viewport
                        this.observedElements.set(entry.target, false);
                        config.onExit?.(entry);
                    }
                });
            }, {
                root: config.root || null,
                rootMargin: config.rootMargin || '0px',
                threshold: config.threshold ?? 0.1
            });
        }

        /**
         * Start observing an element
         */
        observe(element: Element): void {
            if (this.observer) {
                this.observer.observe(element);
                this.observedElements.set(element, false);
            }
        }

        /**
         * Stop observing an element
         */
        unobserve(element: Element): void {
            if (this.observer) {
                this.observer.unobserve(element);
                this.observedElements.delete(element);
            }
        }

        /**
         * Disconnect the observer
         */
        disconnect(): void {
            if (this.observer) {
                this.observer.disconnect();
                this.observedElements.clear();
            }
        }
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

    /**
     * Helper function to observe when element becomes visible (once)
     * @param element - Element to observe
     * @param callback - Callback when element becomes visible
     * @returns Function to stop observing
     */
    export function observeVisibility(
        element: Element,
        callback: (entry: IntersectionObserverEntry) => void
    ): () => void {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    callback(entry);
                    observer.unobserve(element);
                }
            });
        }, {
            threshold: 0.1
        });

        observer.observe(element);

        return () => observer.disconnect();
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝
