// src/mod/help.ts
//
// Made with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import type { ClassValue } from '../types';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

    /**
     * Debounce function
     * Delays function execution until after wait time
     */
    export function debounce<T extends (...args: never[]) => unknown>(
        fn: T,
        delay: number
    ): (...args: Parameters<T>) => void {
        let timeoutId: ReturnType<typeof setTimeout> | null = null;

        return (...args: Parameters<T>): void => {
            if (timeoutId !== null) {
                clearTimeout(timeoutId);
            }

            timeoutId = setTimeout(() => {
                timeoutId = null;
                fn(...args);
            }, delay);
        };
    }

    /**
     * Throttle function
     * Limits function execution to once per time period
     */
    export function throttle<T extends (...args: never[]) => unknown>(
        fn: T,
        delay: number
    ): (...args: Parameters<T>) => void {
        let lastCall = 0;
        let timeoutId: ReturnType<typeof setTimeout> | null = null;

        return (...args: Parameters<T>): void => {
            const now = Date.now();
            const timeSinceLastCall = now - lastCall;

            if (timeSinceLastCall >= delay) {
                lastCall = now;
                fn(...args);
            } else if (!timeoutId) {
                // Schedule execution at the end of the throttle period
                timeoutId = setTimeout(() => {
                    lastCall = Date.now();
                    timeoutId = null;
                    fn(...args);
                }, delay - timeSinceLastCall);
            }
        };
    }

    /**
     * Class names utility
     * Combines class names conditionally
     */
    export function classNames(...classes: ClassValue[]): string {
        const result: string[] = [];

        for (const cls of classes) {
            if (!cls) continue;

            if (typeof cls === 'string') {
                result.push(cls);
            } else if (typeof cls === 'object') {
                for (const [key, value] of Object.entries(cls)) {
                    if (value) {
                        result.push(key);
                    }
                }
            }
        }

        return result.join(' ');
    }

    /**
     * Format date
     * Simple date formatting utility with validation
     */
    export function formatDate(date: Date | string | number, format: string = 'YYYY-MM-DD'): string {
        const d = date instanceof Date ? date : new Date(date);

        // Validate date
        if (isNaN(d.getTime())) {
            throw new Error('Invalid date provided to formatDate');
        }

        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');

        return format
            .replace('YYYY', String(year))
            .replace('MM', month)
            .replace('DD', day)
            .replace('HH', hours)
            .replace('mm', minutes)
            .replace('ss', seconds);
    }

    /**
     * Deep clone object
     * Handles Date, Array, and nested objects
     */
    export function deepClone<T>(obj: T): T {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }

        if (obj instanceof Date) {
            return new Date(obj.getTime()) as T;
        }

        if (Array.isArray(obj)) {
            return obj.map(item => deepClone(item)) as T;
        }

        if (obj instanceof RegExp) {
            return new RegExp(obj.source, obj.flags) as T;
        }

        if (obj instanceof Map) {
            const clonedMap = new Map();
            obj.forEach((value, key) => {
                clonedMap.set(deepClone(key), deepClone(value));
            });
            return clonedMap as T;
        }

        if (obj instanceof Set) {
            const clonedSet = new Set();
            obj.forEach(value => {
                clonedSet.add(deepClone(value));
            });
            return clonedSet as T;
        }

        if (Object.prototype.toString.call(obj) === '[object Object]') {
            const cloned: Record<string, unknown> = {};
            for (const key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    cloned[key] = deepClone((obj as Record<string, unknown>)[key]);
                }
            }
            return cloned as T;
        }

        return obj;
    }

    /**
     * Merge objects deeply
     * Properly handles nested objects and arrays
     */
    export function deepMerge<T extends Record<string, unknown>>(
        target: T,
        ...sources: Partial<T>[]
    ): T {
        if (!sources.length) return target;

        const source = sources.shift();
        if (!source) return target;

        if (isObject(target) && isObject(source)) {
            for (const key in source) {
                if (Object.prototype.hasOwnProperty.call(source, key)) {
                    const sourceValue = source[key];
                    const targetValue = target[key];

                    if (sourceValue !== undefined) {
                        if (isObject(sourceValue) && !Array.isArray(sourceValue)) {
                            if (!targetValue || !isObject(targetValue)) {
                                target[key] = {} as T[Extract<keyof T, string>];
                            }
                            deepMerge(target[key] as Record<string, unknown>, sourceValue as Record<string, unknown>);
                        } else {
                            target[key] = sourceValue as T[Extract<keyof T, string>];
                        }
                    }
                }
            }
        }

        return deepMerge(target, ...sources);
    }

    /**
     * Helper to check if value is a plain object
     */
    function isObject(item: unknown): item is Record<string, unknown> {
        return item !== null && typeof item === 'object' && !Array.isArray(item);
    }

    /**
     * Generate unique ID with better entropy
     */
    let uniqueIdCounter = 0;

    export function uniqueId(prefix: string = 'id'): string {
        const timestamp = Date.now().toString(36);
        const randomPart = Math.random().toString(36).substring(2, 11);
        uniqueIdCounter = (uniqueIdCounter || 0) + 1;
        const counter = uniqueIdCounter.toString(36);
        return `${prefix}_${timestamp}_${randomPart}_${counter}`;
    }

    /**
     * Sleep/delay utility
     */
    export function sleep(ms: number): Promise<void> {
        if (ms < 0) {
            throw new Error('Sleep duration must be non-negative');
        }
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Check if value is empty
     */
    export function isEmpty(value: unknown): boolean {
        if (value == null) return true;
        if (typeof value === 'string') return value.trim().length === 0;
        if (Array.isArray(value)) return value.length === 0;
        if (value instanceof Map || value instanceof Set) return value.size === 0;
        if (typeof value === 'object') return Object.keys(value).length === 0;
        return false;
    }

    /**
     * Capitalize first letter
     */
    export function capitalize(str: string): string {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * Convert to kebab-case
     */
    export function kebabCase(str: string): string {
        if (!str) return '';
        return str
            .replace(/([a-z])([A-Z])/g, '$1-$2')
            .replace(/[\s_]+/g, '-')
            .toLowerCase();
    }

    /**
     * Convert to camelCase
     */
    export function camelCase(str: string): string {
        if (!str) return '';
        return str
            .replace(/[-_\s]+(.)?/g, (_, char: string) => (char ? char.toUpperCase() : ''))
            .replace(/^[A-Z]/, char => char.toLowerCase());
    }

    /**
     * Convert to PascalCase
     */
    export function pascalCase(str: string): string {
        if (!str) return '';
        const camel = camelCase(str);
        return camel.charAt(0).toUpperCase() + camel.slice(1);
    }

    /**
     * Truncate string
     */
    export function truncate(str: string, length: number, suffix: string = '...'): string {
        if (!str || str.length <= length) return str;
        return str.substring(0, length - suffix.length) + suffix;
    }

    /**
     * Parse query string
     */
    export function parseQuery(queryString: string): Record<string, string | string[]> {
        const query: Record<string, string | string[]> = {};
        const cleaned = queryString.replace(/^\?/, '');

        if (!cleaned) return query;

        const pairs = cleaned.split('&');

        for (const pair of pairs) {
            const [key, value] = pair.split('=').map(decodeURIComponent);
            if (!key) continue;

            const decodedValue = value || '';

            // Handle array parameters (key[]=value)
            if (key.endsWith('[]')) {
                const actualKey = key.slice(0, -2);
                if (!query[actualKey]) {
                    query[actualKey] = [];
                }
                (query[actualKey] as string[]).push(decodedValue);
            } else {
                query[key] = decodedValue;
            }
        }

        return query;
    }

    /**
     * Stringify object to query string
     */
    export function stringifyQuery(obj: Record<string, unknown>): string {
        const pairs: string[] = [];

        for (const [key, value] of Object.entries(obj)) {
            if (value == null) continue;

            if (Array.isArray(value)) {
                // Handle arrays
                for (const item of value) {
                    if (item != null) {
                        pairs.push(`${encodeURIComponent(key)}[]=${encodeURIComponent(String(item))}`);
                    }
                }
            } else {
                pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
            }
        }

        return pairs.length > 0 ? `?${pairs.join('&')}` : '';
    }

    /**
     * Clamp a number between min and max
     */
    export function clamp(value: number, min: number, max: number): number {
        return Math.min(Math.max(value, min), max);
    }

    /**
     * Check if code is running in browser
     */
    export function isBrowser(): boolean {
        return typeof window !== 'undefined' && typeof document !== 'undefined';
    }

    /**
     * Safe JSON parse with fallback
     */
    export function safeJsonParse<T = unknown>(json: string, fallback: T): T {
        try {
            return JSON.parse(json) as T;
        } catch {
            return fallback;
        }
    }

    /**
     * Export all utilities
     */
    export const utils = {
        debounce,
        throttle,
        classNames,
        formatDate,
        deepClone,
        deepMerge,
        uniqueId,
        sleep,
        isEmpty,
        capitalize,
        kebabCase,
        camelCase,
        pascalCase,
        truncate,
        parseQuery,
        stringifyQuery,
        clamp,
        isBrowser,
        safeJsonParse,
    };

// ╚══════════════════════════════════════════════════════════════════════════════════════╝