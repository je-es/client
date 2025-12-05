/* eslint-disable @typescript-eslint/no-explicit-any */
// test/setup.ts
//
// Made with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import { Window } from 'happy-dom';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TEST ════════════════════════════════════════╗

    // Create virtual browser environment
    const window = new Window();
    const document = window.document;

    // Make DOM globals available
    (global as any).window = window;
    (global as any).document = document;
    (global as any).HTMLElement = window.HTMLElement;
    (global as any).Element = window.Element;
    (global as any).Node = window.Node;
    (global as any).Text = window.Text;
    (global as any).DocumentFragment = window.DocumentFragment;
    (global as any).Event = window.Event;
    (global as any).MouseEvent = window.MouseEvent;
    (global as any).CustomEvent = window.CustomEvent;
    (global as any).DOMException = window.DOMException;

    // Mock FormData
    (global as any).FormData = class FormData {
        private data = new Map<string, any>();

        append(name: string, value: any): void {
            this.data.set(name, value);
        }

        get(name: string): any {
            return this.data.get(name);
        }

        has(name: string): boolean {
            return this.data.has(name);
        }

        delete(name: string): void {
            this.data.delete(name);
        }

        entries(): IterableIterator<[string, any]> {
            return this.data.entries();
        }

        keys(): IterableIterator<string> {
            return this.data.keys();
        }

        values(): IterableIterator<any> {
            return this.data.values();
        }

        forEach(callback: (value: any, key: string) => void): void {
            this.data.forEach(callback);
        }
    };

    // Mock Headers API
    (global as any).Headers = class Headers {
        private headers = new Map<string, string>();

        constructor(init?: Record<string, string>) {
            if (init) {
                Object.entries(init).forEach(([key, value]) => {
                    this.headers.set(key.toLowerCase(), value);
                });
            }
        }

        get(name: string): string | null {
            return this.headers.get(name.toLowerCase()) || null;
        }

        set(name: string, value: string): void {
            this.headers.set(name.toLowerCase(), value);
        }

        has(name: string): boolean {
            return this.headers.has(name.toLowerCase());
        }

        delete(name: string): void {
            this.headers.delete(name.toLowerCase());
        }

        forEach(callback: (value: string, key: string) => void): void {
            this.headers.forEach(callback);
        }
    };

    // Mock AbortController
    (global as any).AbortController = class AbortController {
        signal = { aborted: false } as AbortSignal;

        abort() {
            (this.signal as any).aborted = true;
        }
    };

    // Mock requestAnimationFrame
    (global as any).requestAnimationFrame = (callback: FrameRequestCallback) => {
        return setTimeout(callback, 16) as any;
    };

    (global as any).cancelAnimationFrame = (id: number) => {
        clearTimeout(id);
    };

    // Mock performance API
    (global as any).performance = {
        now: () => Date.now(),
        timing: {},
        navigation: {},
        getEntriesByType: () => [],
        getEntriesByName: () => [],
        mark: () => {},
        measure: () => {},
        clearMarks: () => {},
        clearMeasures: () => {}
    };

    // Mock Storage APIs
    const createStorage = () => ({
        store: new Map<string, string>(),

        getItem(key: string): string | null {
            return this.store.get(key) || null;
        },

        setItem(key: string, value: string): void {
            this.store.set(key, value);
        },

        removeItem(key: string): void {
            this.store.delete(key);
        },

        clear(): void {
            this.store.clear();
        },

        get length(): number {
            return this.store.size;
        },

        key(index: number): string | null {
            return Array.from(this.store.keys())[index] || null;
        }
    });

    (global as any).localStorage = createStorage();
    (global as any).sessionStorage = createStorage();

    // Mock location
    (global as any).location = {
        href: 'http://localhost:3000/',
        origin: 'http://localhost:3000',
        protocol: 'http:',
        host: 'localhost:3000',
        hostname: 'localhost',
        port: '3000',
        pathname: '/',
        search: '',
        hash: '',
        reload: () => {},
        replace: () => {},
        assign: () => {}
    };

    // Mock navigator
    (global as any).navigator = {
        userAgent: 'Bun Test Runner',
        language: 'en-US',
        languages: ['en-US', 'en'],
        onLine: true,
        cookieEnabled: true,
        platform: 'Test'
    };

    // console.log('✓ DOM environment setup complete');

    export { window, document };

// ╚══════════════════════════════════════════════════════════════════════════════════════╝