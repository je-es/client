// src/mod/core/scheduler.ts
//
// Made with ❤️ by Maysara.



// ╔════════════════════════════════════════ TYPE ════════════════════════════════════════╗

    type UpdateCallback = () => void;

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

    /**
     * Update Scheduler
     * Batches multiple state changes into a single render
     */
    class UpdateScheduler {
        private queue = new Set<UpdateCallback>();
        private isFlushScheduled = false;
        private isFlushing = false;

        /**
         * Schedule a component update
         */
        schedule(callback: UpdateCallback): void {
            if (this.isFlushing) {
                // If we're currently flushing, schedule for next batch
                requestAnimationFrame(() => this.schedule(callback));
                return;
            }

            this.queue.add(callback);

            if (!this.isFlushScheduled) {
                this.isFlushScheduled = true;

                // Use microtask for immediate batching, then RAF for rendering
                Promise.resolve().then(() => {
                    requestAnimationFrame(() => this.flush());
                });
            }
        }

        /**
         * Force immediate flush (for urgent updates)
         */
        flushSync(callback: UpdateCallback): void {
            callback();
        }

        /**
         * Flush all pending updates
         */
        private flush(): void {
            if (this.queue.size === 0) {
                this.isFlushScheduled = false;
                return;
            }

            this.isFlushing = true;
            this.isFlushScheduled = false;

            const callbacks = Array.from(this.queue);
            this.queue.clear();

            // Execute all updates
            for (const callback of callbacks) {
                try {
                    callback();
                } catch (error) {
                    console.error('Error during update:', error);
                }
            }

            this.isFlushing = false;

            // If new updates were scheduled during flush, process them
            if (this.queue.size > 0) {
                this.schedule(() => {});
            }
        }

        /**
         * Clear all pending updates
         */
        clear(): void {
            this.queue.clear();
            this.isFlushScheduled = false;
        }

        /**
         * Get queue size (for debugging)
         */
        get size(): number {
            return this.queue.size;
        }
    }

    // Export singleton instance
    export const scheduler = new UpdateScheduler();

// ╚══════════════════════════════════════════════════════════════════════════════════════╝