import { VNode } from '@je-es/vdom';
export { VNode, VNodeChild, VNodeProps, createDOMElement, createElement, html, patch } from '@je-es/vdom';
import { ApiInterceptors } from '@je-es/capi';
export { ApiError, ApiInterceptors, ApiOptions, ApiResponse, HttpMethod, api, configureApi, getApiConfig, http, resetApiConfig } from '@je-es/capi';

interface BuildConfig {
    entry: string;
    output: string;
    minify?: boolean;
    sourcemap?: boolean;
    optimization?: {
        splitChunks?: boolean;
        treeShaking?: boolean;
    };
    styles?: {
        input?: string;
        output?: string;
    };
}
interface AppConfig {
    root: string;
    routes?: RouteConfig[];
    mode?: 'spa' | 'ssr';
}
interface StateConfig {
    persist?: boolean;
    storage?: 'localStorage' | 'sessionStorage';
}
interface FormsConfig {
    autoValidate?: boolean;
    csrfProtection?: boolean;
}
interface RouterConfig {
    mode?: 'history' | 'hash';
    base?: string;
    scrollBehavior?: 'auto' | 'smooth' | 'instant';
    beforeEach?: NavigationGuard;
    afterEach?: (to: Route, from: Route) => void;
}
interface ApiConfig {
    baseURL?: string;
    timeout?: number;
    headers?: Record<string, string>;
    interceptors?: ApiInterceptors;
}
interface DevToolsConfig {
    enabled?: boolean;
    showRouterInfo?: boolean;
    showStateChanges?: boolean;
}
interface ClientConfig {
    build?: BuildConfig;
    app?: AppConfig;
    state?: StateConfig;
    forms?: FormsConfig;
    router?: RouterConfig;
    api?: ApiConfig;
    devTools?: DevToolsConfig;
}
interface Route {
    path: string;
    params: Record<string, string>;
    query: Record<string, string>;
    meta: Record<string, unknown>;
    hash: string;
    name?: string;
}
type NavigationGuard = (to: Route, from: Route, next: (path?: string | false) => void) => void | Promise<void>;
interface RouteConfig {
    path: string;
    name?: string;
    component: ComponentConstructor | (() => Promise<{
        default?: ComponentConstructor;
        [key: string]: unknown;
    }>);
    meta?: Record<string, unknown>;
    beforeEnter?: NavigationGuard;
    children?: RouteConfig[];
}
type StoreSubscriber<T> = (state: T) => void;
type StoreMiddleware<T> = (state: T, action?: string) => void;
interface StoreOptions<T> {
    state: T;
    persist?: boolean;
    storage?: 'localStorage' | 'sessionStorage';
    storageKey?: string;
    middleware?: StoreMiddleware<T>[];
}
interface ValidationRule {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: RegExp;
    email?: boolean;
    url?: boolean;
    custom?: (value: unknown) => boolean | string;
    message?: string;
}
interface FormFieldOption {
    label: string;
    value: string | number;
}
interface FormFieldConfig {
    name: string;
    label?: string;
    icon?: string;
    type?: string;
    placeholder?: string;
    value?: unknown;
    options?: FormFieldOption[];
    validation?: ValidationRule;
    disabled?: boolean;
    className?: string;
}
type FormSubmitHandler = (data: Record<string, unknown>, event: Event) => void | Promise<void>;
type ClassValue = string | Record<string, boolean> | undefined | null | false;

declare abstract class Component<P = Record<string, unknown>, S = Record<string, unknown>> {
    props: P;
    state: S;
    _isMounted: boolean;
    private _isUnmounting;
    private _element;
    private _vnode;
    private _styleId;
    private _isScheduledForUpdate;
    private _updateBatch;
    private _refs;
    private _subscriptions;
    private _memoCache;
    constructor(props?: P, initialState?: S);
    onBeforeMount?(): void | Promise<void>;
    onMount?(): void | Promise<void>;
    onBeforeUpdate?(prevProps: P, prevState: S): void | Promise<void>;
    onUpdate?(prevProps: P, prevState: S): void;
    onBeforeUnmount?(): void;
    onUnmount?(): void;
    onError?(error: Error, errorInfo: {
        componentStack?: string;
    }): void;
    onPropsChange?(prevProps: P, newProps: P): void;
    onStateChange?(prevState: S, newState: S): void;
    shouldUpdate?(prevProps: P, prevState: S): boolean;
    abstract render(): VNode;
    styles?(): string;
    setState(partialState: Partial<S> | ((prevState: S) => Partial<S>), callback?: () => void): void;
    setProps(newProps: Partial<P>): void;
    batchUpdate(updater: () => void): void;
    update(key?: string): void;
    forceUpdate(): void;
    mount(container: HTMLElement): Promise<void>;
    unmount(): void;
    getRef(name: string): HTMLElement | undefined;
    createRef(name: string): (el: HTMLElement | null) => void;
    memo<T>(key: string, compute: () => T, deps: unknown[]): T;
    subscribe(subscription: () => void): void;
    debounce<T extends (...args: unknown[]) => unknown>(fn: T, delay: number): (...args: Parameters<T>) => void;
    throttle<T extends (...args: unknown[]) => unknown>(fn: T, delay: number): (...args: Parameters<T>) => void;
    get element(): HTMLElement | null;
    get isMounted(): boolean;
    get isUnmounting(): boolean;
    private _performUpdate;
    private _convertToVDomNode;
    private _createElementFromVNode;
    private _setElementProperty;
    private _handleError;
    private _areDepsEqual;
    /**
     * Invalidate all computed property caches (called by decorators)
     */
    _invalidateAllComputed(): void;
    /**
     * Trigger watchers for a property (called by decorators)
     */
    _triggerWatchers(propertyName: string, newValue: unknown, oldValue: unknown): void;
}
interface ComponentConstructor {
    __watchers__?: Record<string, string[]>;
    __reactiveProps__?: string[];
}

declare class Router {
    private routes;
    private currentRoute;
    private mode;
    private base;
    private beforeEachHooks;
    private afterEachHooks;
    private currentComponent;
    private routerOutlet;
    private isNavigating;
    private scrollBehavior;
    private notFoundHandler;
    private _internalPath;
    /**
     * Initialize router
     */
    init(routes: RouteConfig[], mode?: 'history' | 'hash', base?: string, scrollBehavior?: 'auto' | 'smooth' | 'instant'): void;
    /**
     * Navigate to a path
     */
    push(path: string, state?: Record<string, unknown>): Promise<void>;
    /**
     * Replace current route
     */
    replace(path: string, state?: Record<string, unknown>): Promise<void>;
    back(): void;
    forward(): void;
    go(delta: number): void;
    /**
     * Navigation guards
     */
    beforeEach(hook: NavigationGuard): void;
    afterEach(hook: (to: Route, from: Route) => void): void;
    onNotFound(handler: () => void): void;
    /**
     * Route utilities
     */
    getCurrentRoute(): Route | null;
    isActive(path: string, exact?: boolean): boolean;
    outlet(): VNode;
    getRoute(name: string): RouteConfig | undefined;
    pushNamed(name: string, params?: Record<string, string>): Promise<void>;
    resolve(path: string): Route | null;
    /**
     * Initialize routing handlers
     */
    private _initializeRouting;
    private _shouldInterceptLink;
    /**
     * Handle route change
     */
    private _handleRoute;
    /**
     * Handle 404 not found
     */
    private _handleNotFound;
    /**
     * Build route object
     */
    private _buildRouteObject;
    private _buildEmptyRoute;
    /**
     * Run navigation guards
     */
    private _runNavigationGuards;
    private _runGuard;
    /**
     * Render component - simplified component resolution
     */
    private _renderComponent;
    /**
     * Resolve component (handle lazy loading)
     */
    private _resolveComponent;
    /**
     * Render error fallback
     */
    private _renderError;
    /**
     * Handle scroll behavior
     */
    private _handleScrollBehavior;
    /**
     * Get current path (handles test environments)
     */
    private _getCurrentPath;
    private _buildFullPath;
    /**
     * Match route pattern to path
     */
    private _matchRoute;
    private _matchPath;
    /**
     * Parse query string
     */
    private _parseQuery;
}
declare const router: Router;

declare global {
    interface Window {
        __JEES_DEV__?: {
            router: typeof router;
            config: ClientConfig;
            version: string;
        };
    }
}
/**
 * Client builder
 * Handles build process and runtime configuration
 */
declare function client(config: ClientConfig): {
    /**
     * Build the client application
     * This compiles TypeScript components to vanilla JavaScript
     */
    build(): Promise<void>;
    /**
     * Build JavaScript bundle
     */
    _buildJS(): Promise<void>;
    /**
     * Build SCSS/CSS styles
     */
    _buildStyles(): Promise<void>;
    /**
     * Recursively collect all SCSS files (excluding .sass)
     */
    _collectScssFiles(dir: string): Promise<string[]>;
    /**
     * Watch mode for development
     */
    watch(): Promise<void>;
    /**
     * Initialize the client runtime
     * This runs in the browser
     */
    init(): void;
    /**
     * Enable development tools
     */
    _enableDevTools(): void;
    /**
     * Get configuration
     */
    getConfig(): ClientConfig;
};

/**
 * Store - Global state management with improved features
 */
declare class Store<T extends Record<string, unknown> = Record<string, unknown>> {
    private _state;
    private _subscribers;
    private _persist;
    private _storage;
    private _storageKey;
    private _middleware;
    private _isHydrating;
    constructor(options: StoreOptions<T>);
    /**
     * Get current state (readonly)
     */
    get state(): Readonly<T>;
    /**
     * Set entire state (replaces state)
     */
    set state(newState: T);
    /**
     * Update state (merges with existing state)
     */
    setState(update: Partial<T> | ((prevState: T) => Partial<T>), action?: string): void;
    /**
     * Get a specific value from state
     */
    get<K extends keyof T>(key: K): T[K];
    /**
     * Set a specific value in state
     */
    set<K extends keyof T>(key: K, value: T[K], action?: string): void;
    /**
     * Subscribe to state changes
     * Returns unsubscribe function
     */
    subscribe(listener: StoreSubscriber<T>): () => void;
    /**
     * Subscribe to specific key changes
     */
    subscribeToKey<K extends keyof T>(key: K, listener: (value: T[K]) => void): () => void;
    /**
     * Add middleware
     */
    use(middleware: (state: T, action?: string) => void): void;
    /**
     * Clear all state
     */
    clear(): void;
    /**
     * Reset state to initial value
     */
    reset(initialState: T): void;
    /**
     * Hydrate state from storage
     */
    hydrate(): void;
    /**
     * Get store snapshot for debugging
     */
    getSnapshot(): {
        state: T;
        subscribers: number;
        storageKey: string;
    };
    /**
     * Batch multiple updates
     */
    batch(updates: () => void): void;
    /**
     * Notify all subscribers
     */
    private _notify;
    /**
     * Load state from storage
     */
    private _loadFromStorage;
    /**
     * Save state to storage
     */
    private _saveToStorage;
    /**
     * Destroy store and cleanup
     */
    destroy(): void;
}
/**
 * Create a store with type inference
 */
declare function createStore<T extends Record<string, unknown>>(options: StoreOptions<T>): Store<T>;
/**
 * Create a computed store that derives from other stores
 */
declare function createComputedStore<T, S extends Store<Record<string, unknown>>[]>(stores: S, computer: (...states: unknown[]) => T): Store<{
    value: T;
}>;
/**
 * Connect a component to a store
 */
declare function connect<T extends Record<string, unknown>, C extends {
    update?: () => void;
}>(store: Store<T>, component: C, mapStateToProps: (state: T) => Partial<C>): () => void;

/**
 * Style Manager - handles CSS injection and scoping
 */
declare class StyleManager {
    private static styles;
    private static scopeCounter;
    /**
     * Inject styles into document
     */
    static inject(css: string, componentName?: string): string;
    /**
     * Remove styles from document
     */
    static remove(id: string): void;
    /**
     * Scope CSS selectors
     */
    private static scopeStyles;
    /**
     * Clear all styles
     */
    static clear(): void;
}
/**
 * CSS template literal tag
 * Usage: css`.class { color: red; }`
 */
declare function css(strings: TemplateStringsArray, ...values: unknown[]): string;

interface ClassFieldDecoratorContext<This = unknown, Value = unknown> {
    kind: 'field';
    name: string | symbol;
    access: {
        get(object: This): Value;
        set(object: This, value: Value): void;
    };
    addInitializer(initializer: (this: This) => void): void;
}
interface ClassGetterDecoratorContext<This = unknown, Value = unknown> {
    kind: 'getter';
    name: string | symbol;
    access: {
        get(object: This): Value;
    };
    addInitializer(initializer: (this: This) => void): void;
}
interface ClassMethodDecoratorContext<This = unknown, Value = unknown> {
    kind: 'method';
    name: string | symbol;
    access: {
        get(object: This): Value;
    };
    addInitializer(initializer: (this: This) => void): void;
}
/**
 * State decorator - makes property reactive
 * Usage: @state fields = [];
 *
 * Supports both TypeScript 5 decorators and legacy decorators
 */
declare function state<This, Value>(target: undefined, context: ClassFieldDecoratorContext<This, Value>): (this: This, initialValue: Value) => Value;
declare function state(target: Record<string, unknown>, context: string): void;
/**
 * Computed decorator - creates computed property
 * Usage: @computed get fullName() { return this.firstName + ' ' + this.lastName; }
 */
declare function computed<This, Value>(originalGetter: (this: This) => Value, context: ClassGetterDecoratorContext<This, Value>): (this: This) => Value;
declare function computed(target: Record<string, unknown>, context: string, descriptor: PropertyDescriptor): PropertyDescriptor;
declare function computed(targetOrGetter: unknown, context: unknown): never;
/**
 * Watch decorator - watches for property changes
 * Usage: @watch('propertyName') onPropertyChange(newValue, oldValue) {}
 */
declare function watch(propertyName: string): {
    <This, Args extends unknown[], Return>(originalMethod: (this: This, ...args: Args) => Return, context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>): void;
    (target: Record<string, unknown>, context: string, descriptor: PropertyDescriptor): PropertyDescriptor;
};

interface FormConfig {
    fields: FormFieldConfig[];
    endpoint?: string;
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    onSubmit?: (data: Record<string, unknown>, event: Event) => void | Promise<void>;
    onSuccess?: (data: unknown) => void;
    onError?: (error: unknown) => void;
    onValidationError?: (errors: Record<string, string>) => void;
    submitButton?: {
        label?: string;
        loadingLabel?: string;
        className?: string;
    };
    className?: string;
    autoValidate?: boolean;
}
interface FormField extends FormFieldConfig {
    error?: string;
    touched?: boolean;
}
/**
 * SmartForm Component
 * Auto-validation, CSRF protection, API submission
 */
declare class SmartFormComponent extends Component<FormConfig> {
    fields: FormField[];
    formData: Record<string, unknown>;
    isSubmitting: boolean;
    submitError: string;
    submitSuccess: boolean;
    constructor(props: FormConfig);
    onMount(): void;
    /**
     * Handle field change
     */
    handleChange(fieldName: string, value: unknown): void;
    /**
     * Handle field blur
     */
    handleBlur(fieldName: string): void;
    /**
     * Validate single field
     */
    validateField(field: FormField, value: unknown): string | undefined;
    /**
     * Validate all fields
     */
    validateForm(): boolean;
    /**
     * Handle form submission
     */
    handleSubmit(event: Event): Promise<void>;
    /**
     * Render label with optional icon
     */
    renderLabel(field: FormField): VNode | string;
    /**
     * Render form field
     */
    renderField(field: FormField): VNode;
    render(): VNode;
    styles(): string;
}
/**
 * SmartForm helper function
 */
declare function SmartForm(config: FormConfig): VNode;

/**
 * Debounce function
 * Delays function execution until after wait time
 */
declare function debounce<T extends (...args: never[]) => unknown>(fn: T, delay: number): (...args: Parameters<T>) => void;
/**
 * Throttle function
 * Limits function execution to once per time period
 */
declare function throttle<T extends (...args: never[]) => unknown>(fn: T, delay: number): (...args: Parameters<T>) => void;
/**
 * Class names utility
 * Combines class names conditionally
 */
declare function classNames(...classes: ClassValue[]): string;
/**
 * Format date
 * Simple date formatting utility with validation
 */
declare function formatDate(date: Date | string | number, format?: string): string;
/**
 * Deep clone object
 * Handles Date, Array, and nested objects
 */
declare function deepClone<T>(obj: T): T;
/**
 * Merge objects deeply
 * Properly handles nested objects and arrays
 */
declare function deepMerge<T extends Record<string, unknown>>(target: T, ...sources: Partial<T>[]): T;
declare function uniqueId(prefix?: string): string;
/**
 * Sleep/delay utility
 */
declare function sleep(ms: number): Promise<void>;
/**
 * Check if value is empty
 */
declare function isEmpty(value: unknown): boolean;
/**
 * Capitalize first letter
 */
declare function capitalize(str: string): string;
/**
 * Convert to kebab-case
 */
declare function kebabCase(str: string): string;
/**
 * Convert to camelCase
 */
declare function camelCase(str: string): string;
/**
 * Convert to PascalCase
 */
declare function pascalCase(str: string): string;
/**
 * Truncate string
 */
declare function truncate(str: string, length: number, suffix?: string): string;
/**
 * Parse query string
 */
declare function parseQuery(queryString: string): Record<string, string | string[]>;
/**
 * Stringify object to query string
 */
declare function stringifyQuery(obj: Record<string, unknown>): string;
/**
 * Clamp a number between min and max
 */
declare function clamp(value: number, min: number, max: number): number;
/**
 * Check if code is running in browser
 */
declare function isBrowser(): boolean;
/**
 * Safe JSON parse with fallback
 */
declare function safeJsonParse<T = unknown>(json: string, fallback: T): T;
/**
 * Export all utilities
 */
declare const utils: {
    debounce: typeof debounce;
    throttle: typeof throttle;
    classNames: typeof classNames;
    formatDate: typeof formatDate;
    deepClone: typeof deepClone;
    deepMerge: typeof deepMerge;
    uniqueId: typeof uniqueId;
    sleep: typeof sleep;
    isEmpty: typeof isEmpty;
    capitalize: typeof capitalize;
    kebabCase: typeof kebabCase;
    camelCase: typeof camelCase;
    pascalCase: typeof pascalCase;
    truncate: typeof truncate;
    parseQuery: typeof parseQuery;
    stringifyQuery: typeof stringifyQuery;
    clamp: typeof clamp;
    isBrowser: typeof isBrowser;
    safeJsonParse: typeof safeJsonParse;
};

type ContextSubscriber<T> = (value: T) => void;
interface ProviderProps<T> {
    context: Context<T>;
    value: T;
    children: VNode | VNode[];
}
/**
 * Context class for sharing data across component tree
 */
declare class Context<T = unknown> {
    private _value;
    private _subscribers;
    private _defaultValue;
    constructor(defaultValue: T);
    get value(): T;
    set value(newValue: T);
    subscribe(subscriber: ContextSubscriber<T>): () => void;
    reset(): void;
    update(updater: (prev: T) => T): void;
    private _notify;
    get subscriberCount(): number;
}
/**
 * Create a new context
 */
declare function createContext<T>(defaultValue: T): Context<T>;
declare class Provider<T> extends Component<ProviderProps<T>> {
    onMount(): void;
    onUpdate(): void;
    onUnmount(): void;
    render(): VNode;
}
/**
 * Hook-like function to use context in components
 * Call this in your component to get context value
 */
declare function useContext<T>(context: Context<T>, component: Component): T;
/**
 * Combined context for complex state management
 */
declare class CombinedContext<T extends Record<string, unknown>> {
    private contexts;
    constructor(initialValues: T);
    get<K extends keyof T>(key: K): Context<T[K]>;
    set<K extends keyof T>(key: K, value: T[K]): void;
    subscribe<K extends keyof T>(key: K, subscriber: ContextSubscriber<T[K]>): () => void;
    reset(): void;
}
/**
 * Create combined context
 */
declare function createCombinedContext<T extends Record<string, unknown>>(initialValues: T): CombinedContext<T>;

/**
 * Set current component context for hooks
 */
declare function setHookContext(component: Component): void;
/**
 * Clear hook context
 */
declare function clearHookContext(): void;
/**
 * useState hook - manages component state
 */
declare function useState<T>(initialValue: T | (() => T)): [T, (newValue: T | ((prev: T) => T)) => void];
/**
 * useEffect hook - side effects
 */
declare function useEffect(effect: () => void | (() => void), deps?: unknown[]): void;
/**
 * useMemo hook - memoize expensive computations
 */
declare function useMemo<T>(factory: () => T, deps: unknown[]): T;
/**
 * useCallback hook - memoize callbacks
 */
declare function useCallback<T extends (...args: unknown[]) => unknown>(callback: T, deps: unknown[]): T;
/**
 * useRef hook - persistent value across renders
 */
declare function useRef<T>(initialValue: T): {
    current: T;
};
/**
 * useReducer hook - complex state management
 */
declare function useReducer<S, A>(reducer: (state: S, action: A) => S, initialState: S): [S, (action: A) => void];
/**
 * useLocalStorage hook - sync state with localStorage
 */
declare function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void];
/**
 * useDebounce hook - debounce value changes
 */
declare function useDebounce<T>(value: T, delay: number): T;
/**
 * usePrevious hook - get previous value
 */
declare function usePrevious<T>(value: T): T | undefined;
/**
 * useToggle hook - boolean toggle
 */
declare function useToggle(initialValue?: boolean): [boolean, () => void];
/**
 * useInterval hook - setInterval with cleanup
 */
declare function useInterval(callback: () => void, delay: number | null): void;
/**
 * useFetch hook - data fetching
 */
declare function useFetch<T>(url: string, options?: RequestInit): {
    data: T | null;
    loading: boolean;
    error: Error | null;
    refetch: () => void;
};
/**
 * useWindowSize hook - track window dimensions
 */
declare function useWindowSize(): {
    width: number;
    height: number;
};
/**
 * useEventListener hook - add event listener
 */
declare function useEventListener<K extends keyof WindowEventMap>(eventName: K, handler: (event: WindowEventMap[K]) => void, element?: HTMLElement | Window): void;
/**
 * Create a functional component with hooks
 * Returns a component class that can be instantiated
 */
declare function createFunctionalComponent<P extends Record<string, unknown> = Record<string, unknown>>(fn: (props: P) => VNode, displayName?: string): new (props?: P) => Component<P>;

type UpdateCallback = () => void;
/**
 * Update Scheduler
 * Batches multiple state changes into a single render
 */
declare class UpdateScheduler {
    private queue;
    private isFlushScheduled;
    private isFlushing;
    /**
     * Schedule a component update
     */
    schedule(callback: UpdateCallback): void;
    /**
     * Force immediate flush (for urgent updates)
     */
    flushSync(callback: UpdateCallback): void;
    /**
     * Flush all pending updates
     */
    private flush;
    /**
     * Clear all pending updates
     */
    clear(): void;
    /**
     * Get queue size (for debugging)
     */
    get size(): number;
}
declare const scheduler: UpdateScheduler;

export { type ApiConfig, type AppConfig, type BuildConfig, type ClientConfig, CombinedContext, Component, type ComponentConstructor, Context, type DevToolsConfig, type FormConfig, type FormFieldConfig, type FormFieldOption, type FormSubmitHandler, type FormsConfig, type NavigationGuard, Provider, type Route, type RouteConfig, Router, type RouterConfig, SmartForm, SmartFormComponent, type StateConfig, Store, type StoreMiddleware, type StoreOptions, type StoreSubscriber, StyleManager, type ValidationRule, camelCase, capitalize, clamp, classNames, clearHookContext, client, computed, connect, createCombinedContext, createComputedStore, createContext, createFunctionalComponent, createStore, css, debounce, deepClone, deepMerge, formatDate, isBrowser, isEmpty, kebabCase, parseQuery, pascalCase, router, safeJsonParse, scheduler, setHookContext, sleep, state, stringifyQuery, throttle, truncate, uniqueId, useCallback, useContext, useDebounce, useEffect, useEventListener, useFetch, useInterval, useLocalStorage, useMemo, usePrevious, useReducer, useRef, useState, useToggle, useWindowSize, utils, watch };
