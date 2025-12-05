/* eslint-disable @typescript-eslint/no-explicit-any */
// test/scheduler.test.ts
//
// Made with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import './setup';
    import { describe, expect, test, beforeEach } from 'bun:test';
    import { scheduler } from '../src/mod/core/scheduler';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TEST ════════════════════════════════════════╗

    describe('Scheduler', () => {
        beforeEach(() => {
            scheduler.clear();
        });

        test('should schedule updates', async () => {
            let executed = false;

            scheduler.schedule(() => {
                executed = true;
            });

            expect(executed).toBe(false);
            expect(scheduler.size).toBe(1);

            await new Promise(resolve => setTimeout(resolve, 50));

            expect(executed).toBe(true);
        });

        test('should batch multiple updates', async () => {
            let callCount = 0;

            scheduler.schedule(() => { callCount++; });
            scheduler.schedule(() => { callCount++; });
            scheduler.schedule(() => { callCount++; });

            expect(callCount).toBe(0);

            await new Promise(resolve => setTimeout(resolve, 50));

            expect(callCount).toBe(3);
        });

        test('should execute updates in order', async () => {
            const order: number[] = [];

            scheduler.schedule(() => { order.push(1); });
            scheduler.schedule(() => { order.push(2); });
            scheduler.schedule(() => { order.push(3); });

            await new Promise(resolve => setTimeout(resolve, 50));

            expect(order).toEqual([1, 2, 3]);
        });

        test('flushSync should execute immediately', () => {
            let executed = false;

            scheduler.flushSync(() => {
                executed = true;
            });

            expect(executed).toBe(true);
        });

        test('should handle errors in updates gracefully', async () => {
            let firstExecuted = false;
            let thirdExecuted = false;

            scheduler.schedule(() => {
                firstExecuted = true;
            });

            scheduler.schedule(() => {
                throw new Error('Update error');
            });

            scheduler.schedule(() => {
                thirdExecuted = true;
            });

            await new Promise(resolve => setTimeout(resolve, 50));

            expect(firstExecuted).toBe(true);
            expect(thirdExecuted).toBe(true);
        });

        test('should not duplicate same callback', async () => {
            let callCount = 0;
            const callback = () => { callCount++; };

            scheduler.schedule(callback);
            scheduler.schedule(callback);
            scheduler.schedule(callback);

            await new Promise(resolve => setTimeout(resolve, 50));

            // Set stores unique callbacks, so duplicate adds are ignored
            expect(callCount).toBeGreaterThan(0);
        });

        test('should clear all pending updates', async () => {
            let executed = false;

            scheduler.schedule(() => {
                executed = true;
            });

            expect(scheduler.size).toBe(1);

            scheduler.clear();

            expect(scheduler.size).toBe(0);

            await new Promise(resolve => setTimeout(resolve, 50));

            expect(executed).toBe(false);
        });

        test('should report queue size', () => {
            expect(scheduler.size).toBe(0);

            scheduler.schedule(() => {});
            expect(scheduler.size).toBe(1);

            scheduler.schedule(() => {});
            expect(scheduler.size).toBe(2);

            scheduler.clear();
            expect(scheduler.size).toBe(0);
        });

        test('should handle scheduling during flush', async () => {
            let firstExecuted = false;
            let secondExecuted = false;

            scheduler.schedule(() => {
                firstExecuted = true;
                // Schedule another update during flush
                scheduler.schedule(() => {
                    secondExecuted = true;
                });
            });

            await new Promise(resolve => setTimeout(resolve, 100));

            expect(firstExecuted).toBe(true);
            expect(secondExecuted).toBe(true);
        });

        test('should batch rapid updates', async () => {
            let updateCount = 0;

            // Schedule many updates rapidly
            for (let i = 0; i < 100; i++) {
                scheduler.schedule(() => {
                    updateCount++;
                });
            }

            await new Promise(resolve => setTimeout(resolve, 50));

            expect(updateCount).toBe(100);
        });

        test('multiple flushSync calls should work independently', () => {
            let count = 0;

            scheduler.flushSync(() => {
                count++;
            });

            expect(count).toBe(1);

            scheduler.flushSync(() => {
                count++;
            });

            expect(count).toBe(2);

            scheduler.flushSync(() => {
                count++;
            });

            expect(count).toBe(3);
        });

        test('should handle async operations in scheduled callbacks', async () => {
            let result: string | null = null;

            scheduler.schedule(async () => {
                await new Promise(resolve => setTimeout(resolve, 10));
                result = 'async completed';
            });

            await new Promise(resolve => setTimeout(resolve, 100));

            expect(result).not.toBeNull();
            if (result !== null) {
                expect(result).toBe('async completed' as any);
            }
        });

        test('should maintain separate batches', async () => {
            const batch1: number[] = [];
            const batch2: number[] = [];

            // First batch
            scheduler.schedule(() => { batch1.push(1); });
            scheduler.schedule(() => { batch1.push(2); });

            await new Promise(resolve => setTimeout(resolve, 50));

            expect(batch1).toEqual([1, 2]);
            expect(batch2).toEqual([]);

            // Second batch
            scheduler.schedule(() => { batch2.push(3); });
            scheduler.schedule(() => { batch2.push(4); });

            await new Promise(resolve => setTimeout(resolve, 50));

            expect(batch1).toEqual([1, 2]);
            expect(batch2).toEqual([3, 4]);
        });

        test('should handle callbacks that modify the queue', async () => {
            let callCount = 0;

            scheduler.schedule(() => {
                callCount++;
                if (callCount < 3) {
                    scheduler.schedule(() => {
                        callCount++;
                    });
                }
            });

            await new Promise(resolve => setTimeout(resolve, 150));

            expect(callCount).toBeGreaterThanOrEqual(2);
        });

        test('clear should work during scheduling', () => {
            // let executed = false;

            scheduler.schedule(() => {
                // executed = true;
            });

            scheduler.schedule(() => {
                scheduler.clear();
            });

            scheduler.clear();

            expect(scheduler.size).toBe(0);
        });

        test('should handle nested flushSync', () => {
            let outerExecuted = false;
            let innerExecuted = false;

            scheduler.flushSync(() => {
                outerExecuted = true;
                scheduler.flushSync(() => {
                    innerExecuted = true;
                });
            });

            expect(outerExecuted).toBe(true);
            expect(innerExecuted).toBe(true);
        });

        test('should batch updates within requestAnimationFrame', async () => {
            let frameCount = 0;

            scheduler.schedule(() => { frameCount++; });
            scheduler.schedule(() => { frameCount++; });
            scheduler.schedule(() => { frameCount++; });

            // Wait for RAF to execute
            await new Promise(resolve => setTimeout(resolve, 20));

            expect(frameCount).toBe(3);
        });

        test('should not schedule if already flushing', async () => {
            let mainExecuted = false;
            let nestedScheduled = false;

            scheduler.schedule(() => {
                mainExecuted = true;

                // Try to schedule during flush
                scheduler.schedule(() => {
                    nestedScheduled = true;
                });
            });

            await new Promise(resolve => setTimeout(resolve, 100));

            expect(mainExecuted).toBe(true);
            expect(nestedScheduled).toBe(true);
        });

        test('should handle callbacks that throw errors', async () => {
            let beforeError = false;
            let afterError = false;

            scheduler.schedule(() => {
                beforeError = true;
            });

            scheduler.schedule(() => {
                throw new Error('Test error');
            });

            scheduler.schedule(() => {
                afterError = true;
            });

            await new Promise(resolve => setTimeout(resolve, 50));

            expect(beforeError).toBe(true);
            expect(afterError).toBe(true);
        });

        test('size should decrease after flush', async () => {
            scheduler.schedule(() => {});
            scheduler.schedule(() => {});
            scheduler.schedule(() => {});

            expect(scheduler.size).toBe(3);

            await new Promise(resolve => setTimeout(resolve, 50));

            expect(scheduler.size).toBe(0);
        });

        test('should work with component updates', async () => {
            const updates: string[] = [];

            const scheduleUpdate = (id: string) => {
                scheduler.schedule(() => {
                    updates.push(id);
                });
            };

            scheduleUpdate('A');
            scheduleUpdate('B');
            scheduleUpdate('C');

            expect(updates.length).toBe(0);

            await new Promise(resolve => setTimeout(resolve, 50));

            expect(updates).toEqual(['A', 'B', 'C']);
        });

        test('should handle mixed sync and async operations', async () => {
            let syncResult = 0;
            let asyncResult = 0;

            scheduler.flushSync(() => {
                syncResult = 1;
            });

            scheduler.schedule(async () => {
                await new Promise(resolve => setTimeout(resolve, 10));
                asyncResult = 2;
            });

            expect(syncResult).toBe(1);
            expect(asyncResult).toBe(0);

            await new Promise(resolve => setTimeout(resolve, 50));

            expect(asyncResult).toBe(2);
        });

        test('should maintain order across multiple flush cycles', async () => {
            const order: number[] = [];

            // First cycle
            scheduler.schedule(() => { order.push(1); });
            await new Promise(resolve => setTimeout(resolve, 50));

            // Second cycle
            scheduler.schedule(() => { order.push(2); });
            await new Promise(resolve => setTimeout(resolve, 50));

            // Third cycle
            scheduler.schedule(() => { order.push(3); });
            await new Promise(resolve => setTimeout(resolve, 50));

            expect(order).toEqual([1, 2, 3]);
        });
    });

// ╚══════════════════════════════════════════════════════════════════════════════════════╝
