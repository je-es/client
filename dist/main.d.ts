import { ApiInterceptors } from '@je-es/capi';
export { ApiError, ApiInterceptors, ApiOptions, ApiResponse, ApiConfig as CapiConfig, HttpMethod, ParamValue, RequestData, api, configureApi, getApiConfig, http, resetApiConfig } from '@je-es/capi';
import * as _je_es_vdom from '@je-es/vdom';
import { VNode } from '@je-es/vdom';
export { VNode, VNodeChild, VNodeProps, createDOMElement, createElement, html, patch } from '@je-es/vdom';

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
    private _isInitializing;
    private _skipNextUpdate;
    private _preservedElements;
    private _updateInProgress;
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
    skipNextUpdate(): void;
    beginInitialization(): void;
    endInitialization(): void;
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
    get isInitializing(): boolean;
    private _performUpdate;
    private _preserveComponentMounts;
    private _restoreComponentMounts;
    private _convertToVDomNode;
    private _createElementFromVNode;
    private _setElementProperty;
    private _handleError;
    private _areDepsEqual;
    _invalidateAllComputed(): void;
    _triggerWatchers(propertyName: string, newValue: unknown, oldValue: unknown): void;
}
interface ComponentConstructor {
    __watchers__?: Record<string, string[]>;
    __reactiveProps__?: string[];
}

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
type LanguageCode = string;
type TranslationSet = Record<string, Record<string, string>>;
interface I18nConfig {
    defaultLanguage?: LanguageCode;
    supportedLanguages?: LanguageCode[];
    staticPath?: string;
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
type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
type EventHandler<T extends Event = Event> = (event: T) => void;

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
/**
 * Navigate to a new route
 */
declare function navigate(path: string, replace?: boolean): void;
/**
 * Navigate back in history
 */
declare function goBack(): void;
/**
 * Navigate forward in history
 */
declare function goForward(): void;
/**
 * Get current path
 */
declare function getCurrentPath(): string;
/**
 * Check if current path matches
 */
declare function isCurrentPath(path: string): boolean;
/**
 * Check if current path starts with
 */
declare function isCurrentPathPrefix(prefix: string): boolean;
/**
 * Reload current route
 */
declare function reloadRoute(): void;
/**
 * Navigate with query params
 */
declare function navigateWithQuery(path: string, params: Record<string, string>): void;
/**
 * Get query parameters
 */
declare function getQueryParams(): URLSearchParams;
/**
 * Get single query parameter
 */
declare function getQueryParam(key: string): string | null;

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
    init(): Promise<void>;
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

declare class I18nManager {
    private translations;
    private currentLanguage;
    private defaultLanguage;
    private supportedLanguages;
    private cachePath;
    private readyListeners;
    constructor(config?: I18nConfig);
    /**
     * Load translations for a specific language
     * @param lang Language code (e.g., 'en', 'ar', 'fr')
     * @param translations Translation object
     */
    loadLanguage(lang: LanguageCode, translations: Record<string, string>): void;
    /**
     * Load all translations from static files
     * @param translations Object with language codes as keys and translation objects as values
     */
    loadTranslations(translations: TranslationSet): void;
    /**
     * Set the current language
     * @param lang Language code
     */
    setLanguage(lang: LanguageCode): void;
    /**
     * Get the current language
     */
    getLanguage(): LanguageCode;
    /**
     * Get all supported languages
     */
    getSupportedLanguages(): LanguageCode[];
    /**
     * Translate a key with smart parameter replacement
     * Supports nested translation keys as parameter values
     *
     * @example
     * // Simple translation
     * t('hello') // => "Hello" or "مرحبا" depending on current language
     *
     * @example
     * // With parameters
     * t('welcome', { app_name: 'MyApp' })
     * // => "Welcome to MyApp"
     *
     * @example
     * // With nested translation keys as parameters
     * t('greeting', { salutation: 'hello' })
     * // => "Say Hello to everyone"
     *
     * @param key Translation key
     * @param params Optional parameters for replacement
     * @returns Translated string with replaced parameters
     */
    t(key: string, params?: Record<string, string>): string;
    /**
     * Translate with a specific language (overrides current language temporarily)
     *
     * @param key Translation key
     * @param lang Language code
     * @param params Optional parameters
     * @returns Translated string
     */
    tLang(key: string, lang: LanguageCode, params?: Record<string, string>): string;
    /**
     * Translate a key and convert HTML tags in the translation to VNode elements
     * Supports tags like <br>, <strong>, <em>, <b>, <i>, etc.
     * Useful for multiline translations with formatting
     *
     * @example
     * // Translation: "Hello <br> World"
     * tHtml('greeting') // => [text node, br element, text node]
     *
     * @param key Translation key
     * @param params Optional parameters for replacement
     * @returns Array of VNode and string elements that can be used as children
     */
    tHtml(key: string, params?: Record<string, string>): (VNode | string)[];
    /**
     * Parse HTML string into VNode and text elements
     * Converts \n and /n sequences to <br> tags
     * @private
     */
    private parseHtmlString;
    /**
     * Get all translations for current language
     */
    getTranslations(): Record<string, string>;
    /**
     * Check if a translation key exists
     * @param key Translation key
     * @returns true if key exists in current or default language
     */
    hasKey(key: string): boolean;
    /**
     * Create a reactive translation function that listens to language changes
     * @param updateCallback Callback function to execute when language changes
     * @returns Function to unsubscribe from language changes
     */
    createTranslator(updateCallback: () => void): () => void;
    /**
     * Load translations from URL(s)
     * Supports patterns like '/static/i18n/*.json' or specific URLs
     *
     * @example
     * // Load from a pattern
     * await loadFromUrl('/static/i18n/*.json');
     *
     * @example
     * // Load specific language files
     * await loadFromUrl(['/static/i18n/en.json', '/static/i18n/ar.json']);
     *
     * @param urlPattern String pattern or array of URLs
     * @returns Promise that resolves when all translations are loaded
     */
    loadFromUrl(urlPattern: string | string[]): Promise<void>;
    /**
     * Register a callback for when i18n is ready
     */
    onReady(callback: () => void): void;
    /**
     * Notify all listeners that i18n is ready
     */
    private notifyReady;
    /**
     * Get language from localStorage
     */
    private getStoredLanguage;
    /**
     * Store language in localStorage
     */
    private storeLanguage;
    /**
     * Dispatch language change event
     */
    private dispatchLanguageChangeEvent;
}
/**
 * Get the global i18n instance
 */
declare function getI18n(): I18nManager;

/**
 * Global translation function
 * @param key Translation key
 * @param params Optional parameters
 * @returns Translated string
 */
declare function t(key: string, params?: Record<string, string>): string;
/**
 * Translate with a specific language (overrides current language temporarily)
 * @param key Translation key
 * @param lang Language code
 * @param params Optional parameters
 * @returns Translated string
 */
declare function tLang(key: string, lang: string, params?: Record<string, string>): string;
/**
 * Translate a key and convert HTML tags to VNode elements
 * Useful for multiline translations with formatting like <br>
 * @param key Translation key
 * @param params Optional parameters
 * @returns Array of VNode and string elements that can be used as children
 */
declare function tHtml(key: string, params?: Record<string, string>): (VNode | string)[];
/**
 * Set the current language globally (synchronous)
 * @param lang Language code
 */
declare function setLanguage(lang: string): void;
/**
 * Set the current language globally with lazy-loading support (asynchronous)
 * Use this when you want to lazy-load language files on demand
 * @param lang Language code
 * @param staticPath Path to language files for lazy-loading
 * @returns Promise that resolves when language is loaded and set
 */
declare function setLanguageAsync(lang: string, staticPath?: string): Promise<void>;
/**
 * Get the current language
 */
declare function getCurrentLanguage(): string;
/**
 * Load translations for a specific language
 * @param lang Language code
 * @param translations Translation object
 */
declare function loadLanguage(lang: string, translations: Record<string, string>): void;
/**
 * Load all translations
 * @param translations The translations object
 */
declare function loadTranslations(translations: Record<string, Record<string, string>>): void;
/**
 * Get all supported languages
 */
declare function getSupportedLanguages(): string[];
/**
 * Check if a translation key exists
 * @param key The translation key to check
 * @returns Whether the key exists
 */
declare function hasKey(key: string): boolean;
/**
 * Get all translations for current language
 */
declare function getTranslations(): Record<string, string>;
/**
 * Create a reactive translator that listens to language changes
 * @param updateCallback Callback function to execute when language changes
 * @returns Function to unsubscribe from language changes
 */
declare function createTranslator(updateCallback: () => void): () => void;
/**
 * Load translations from URL(s)
 * Supports patterns like '/static/i18n/*.json' or specific URLs
 *
 * @example
 * // Load from a pattern
 * await loadFromUrl('/static/i18n/*.json');
 *
 * @example
 * // Load specific language files
 * await loadFromUrl(['/static/i18n/en.json', '/static/i18n/ar.json']);
 *
 * @param urlPattern String pattern or array of URLs
 * @returns Promise that resolves when all translations are loaded
 */
declare function loadFromUrl(urlPattern: string | string[]): Promise<void>;
/**
 * Initialize i18n synchronously (useful for testing)
 * Creates a new I18nManager instance with the provided config
 *
 * @param config I18n configuration
 *
 * @example
 * initializeI18n({
 *     defaultLanguage: 'en',
 *     supportedLanguages: ['en', 'ar']
 * });
 */
declare function initializeI18n(config?: I18nConfig): void;
/**
 * Setup i18n: Initialize and load the currently selected language
 * Uses stored language from localStorage if available, otherwise uses default
 * Other languages are lazy-loaded when setLanguage is called
 *
 * @param config I18n configuration
 * @returns Promise that resolves when the selected language is loaded
 *
 * @example
 * await setupI18n({
 *     defaultLanguage: 'en',
 *     supportedLanguages: ['en', 'ar'],
 *     staticPath: 'static/i18n'
 * });
 * console.log(t('hello')); // Ready to use in current language!
 */
declare function setupI18n(config: I18nConfig): Promise<void>;
/**
 * Load a specific language file on-demand
 * Use this when user switches to a language that hasn't been loaded yet
 *
 * @param lang Language code (e.g., 'ar', 'fr')
 * @param staticPath Optional path to language files (defaults to 'static/i18n')
 * @returns Promise that resolves when language is loaded
 *
 * @example
 * // User switches to Arabic - load it first if not already loaded
 * await loadLanguageFile('ar');
 * setLanguage('ar');
 */
declare function loadLanguageFile(lang: string, staticPath?: string): Promise<void>;

type ToastType = 'success' | 'error' | 'info' | 'warning';
interface ToastMessage {
    id: number;
    message: string;
    type: ToastType;
    translateKey?: string;
}
declare class Toast extends Component {
    messages: ToastMessage[];
    private nextId;
    /**
     * Show a toast notification
     */
    show(message: string, type?: ToastType, duration?: number, translateKey?: string): void;
    /**
     * Convenience methods
     */
    success(message: string, duration?: number, translateKey?: string): void;
    error(message: string, duration?: number, translateKey?: string): void;
    info(message: string, duration?: number, translateKey?: string): void;
    warning(message: string, duration?: number, translateKey?: string): void;
    render(): _je_es_vdom.VNode;
    renderToast(msg: ToastMessage): _je_es_vdom.VNode;
}
declare function initToast(container?: HTMLElement): Toast;
declare function getToast(): Toast;
declare const toast: {
    show: (message: string, type?: ToastType, duration?: number, translateKey?: string) => void;
    success: (message: string, duration?: number, translateKey?: string) => void;
    error: (message: string, duration?: number, translateKey?: string) => void;
    info: (message: string, duration?: number, translateKey?: string) => void;
    warning: (message: string, duration?: number, translateKey?: string) => void;
};

type LoaderSize = 'small' | 'medium' | 'large';
type LoaderVariant = 'spinner' | 'dots' | 'pulse';
interface LoaderOptions {
    message?: string;
    variant?: LoaderVariant;
    size?: LoaderSize;
    overlay?: boolean;
}
declare class Loader extends Component {
    visible: boolean;
    message: string;
    variant: LoaderVariant;
    size: LoaderSize;
    overlay: boolean;
    progress: number;
    showProgress: boolean;
    private animationFrame;
    private hideTimeout;
    onMount(): Promise<void>;
    onUnmount(): void;
    render(): _je_es_vdom.VNode;
    renderSpinner(): _je_es_vdom.VNode;
    renderMessage(): _je_es_vdom.VNode;
    renderProgressBar(): _je_es_vdom.VNode;
    show(options?: LoaderOptions | string): void;
    hide(delay?: number): void;
    setMessage(message: string): void;
    setProgress(progress: number): void;
    updateProgress(increment: number): void;
    private performHide;
    private applyBodyLock;
    private removeBodyLock;
    private setupKeyboardListener;
    private handleKeyPress;
    private initializeAccessibility;
    isVisible(): boolean;
    getStatus(): {
        visible: boolean;
        message: string;
        progress: number;
    };
}

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

type PopupType = 'confirm' | 'alert' | 'form' | 'custom' | 'prompt';
type PopupVariant = 'default' | 'danger' | 'warning' | 'success' | 'info';
type PopupSize = 'small' | 'medium' | 'large' | 'xlarge' | 'fullscreen';
interface PopupButton {
    label: string;
    translateKey?: string;
    variant?: 'primary' | 'secondary' | 'danger' | 'success';
    icon?: string;
    onClick: () => void | Promise<void>;
    loading?: boolean;
}
interface PopupFormOptions {
    title: string;
    titleTranslateKey?: string;
    description?: string;
    descriptionTranslateKey?: string;
    formConfig: FormConfig;
    variant?: PopupVariant;
    icon?: string;
    size?: PopupSize;
    closeOnOverlay?: boolean;
    closeOnEscape?: boolean;
    showCloseButton?: boolean;
}
interface PopupOptions {
    title: string;
    titleTranslateKey?: string;
    message?: string;
    messageTranslateKey?: string;
    description?: string;
    descriptionTranslateKey?: string;
    type?: PopupType;
    variant?: PopupVariant;
    size?: PopupSize;
    buttons?: PopupButton[];
    customContent?: VNode;
    formConfig?: FormConfig;
    closeOnOverlay?: boolean;
    closeOnEscape?: boolean;
    showCloseButton?: boolean;
    icon?: string;
    onConfirm?: () => void | Promise<void>;
    onCancel?: () => void | Promise<void>;
}
interface ActivePopup extends PopupOptions {
    id: number;
    resolve?: (value: boolean | string | null | unknown) => void;
    inputValue?: string;
    isSubmitting?: boolean;
}
declare class Popup extends Component {
    popups: ActivePopup[];
    private nextId;
    private handleEscapeKey?;
    onMount(): Promise<void>;
    onUnmount(): void;
    render(): VNode;
    renderPopup(popup: ActivePopup): VNode;
    /**
     * Show a custom popup
     */
    show(options: PopupOptions): Promise<boolean | string | null | unknown>;
    /**
     * Show a form popup
     */
    showForm(options: PopupFormOptions): Promise<unknown>;
    /**
     * Show a confirmation dialog
     */
    confirm(options: {
        title: string;
        titleTranslateKey?: string;
        message: string;
        messageTranslateKey?: string;
        confirmLabel?: string;
        confirmTranslateKey?: string;
        cancelLabel?: string;
        cancelTranslateKey?: string;
        variant?: PopupVariant;
        icon?: string;
        size?: PopupSize;
        onConfirm?: () => void | Promise<void>;
        onCancel?: () => void | Promise<void>;
    }): Promise<boolean>;
    /**
     * Show an alert dialog
     */
    alert(options: {
        title: string;
        titleTranslateKey?: string;
        message: string;
        messageTranslateKey?: string;
        okLabel?: string;
        okTranslateKey?: string;
        variant?: PopupVariant;
        icon?: string;
        size?: PopupSize;
        onConfirm?: () => void | Promise<void>;
    }): Promise<boolean>;
    /**
     * Show a prompt dialog
     */
    prompt(options: {
        title: string;
        titleTranslateKey?: string;
        message: string;
        messageTranslateKey?: string;
        defaultValue?: string;
        confirmLabel?: string;
        confirmTranslateKey?: string;
        cancelLabel?: string;
        cancelTranslateKey?: string;
        icon?: string;
        onConfirm?: (value: string) => void | Promise<void>;
        onCancel?: () => void | Promise<void>;
    }): Promise<string | null>;
    /**
     * Close a specific popup
     */
    closePopup(id: number, result: boolean | string | null | any): void;
    /**
     * Close all popups
     */
    closeAll(): void;
    private applyBodyLock;
    private removeBodyLock;
    private setupKeyboardListener;
}
declare function initPopup(container?: HTMLElement): Popup;
declare function getPopup(): Popup;
declare const popup: {
    show: (options: PopupOptions) => Promise<unknown>;
    confirm: (options: Parameters<Popup["confirm"]>[0]) => Promise<boolean>;
    alert: (options: Parameters<Popup["alert"]>[0]) => Promise<boolean>;
    prompt: (options: {
        title: string;
        titleTranslateKey?: string;
        message: string;
        icon?: string;
        messageTranslateKey?: string;
        onConfirm?: () => void | Promise<void>;
    }) => Promise<string | null>;
    showForm: (options: PopupFormOptions) => Promise<unknown>;
    closePopup: (id: number, result: boolean | string | null | any) => void;
    closeLastPopup: () => void;
    closeFirstPopup: () => void;
    closeAll: () => void;
};

type TabPosition = 'top' | 'side';
type TabStyle = 'default' | 'pills' | 'minimal';
interface Tab {
    id: string;
    label: string;
    translateKey?: string;
    icon?: string;
    badge?: number | string;
    disabled?: boolean;
    component?: Component | (() => VNode);
    content?: VNode;
    onActivate?: () => void | Promise<void>;
}
interface TabbedViewOptions {
    tabs: Tab[];
    defaultTab?: string;
    position?: TabPosition;
    style?: TabStyle;
    className?: string;
    headerClassName?: string;
    contentClassName?: string;
    showTabCount?: boolean;
    persistState?: boolean;
    storageKey?: string;
    onChange?: (tabId: string) => void | Promise<void>;
}
declare class TabbedView extends Component {
    activeTabId: string;
    tabs: Tab[];
    position: TabPosition;
    style: TabStyle;
    className: string;
    headerClassName: string;
    contentClassName: string;
    showTabCount: boolean;
    persistState: boolean;
    storageKey: string;
    private currentTabComponent;
    private onChange?;
    onMount(): Promise<void>;
    onUnmount(): void;
    /**
     * Initialize the tabbed view with options
     */
    init(options: TabbedViewOptions): this;
    /**
     * Set active tab
     */
    setActiveTab(tabId: string): Promise<void>;
    /**
     * Add a new tab dynamically
     */
    addTab(tab: Tab): void;
    /**
     * Remove a tab
     */
    removeTab(tabId: string): void;
    /**
     * Update tab properties
     */
    updateTab(tabId: string, updates: Partial<Tab>): void;
    /**
     * Get active tab
     */
    getActiveTab(): Tab | undefined;
    render(): VNode;
    renderTabList(): VNode;
    renderTab(tab: Tab): VNode;
    renderTabContent(): VNode;
    renderActiveTabContent(tab: Tab): any;
}
/**
 * Create a new TabbedView instance with options
 */
declare function createTabbedView(options: TabbedViewOptions): TabbedView;
/**
 * Helper to create a simple tabbed view and mount it
 */
declare function mountTabbedView(container: HTMLElement, options: TabbedViewOptions): Promise<TabbedView>;

interface ItemsLoaderConfig<T> {
    fetchUrl: string | ((page: number, filters: Record<string, unknown>) => string);
    renderItem: (item: T, index: number) => HTMLElement;
    pageSize?: number;
    emptyStateConfig?: {
        icon: string;
        title: string;
        description: string;
    };
    loadMoreText?: string;
    loadingText?: string;
    errorText?: string;
    containerClassName?: string;
    itemClassName?: string;
    filters?: Record<string, unknown>;
    onFiltersChange?: (filters: Record<string, unknown>) => void;
    enableSearch?: boolean;
    searchPlaceholder?: string;
    searchFilterKey?: string;
    searchDebounceMs?: number;
    onItemClick?: (item: T, index: number) => void;
    onLoadMore?: (page: number, items: T[]) => void;
    onError?: (error: Error) => void;
    initialItems?: T[];
    extractItems?: (response: any) => T[];
    extractTotal?: (response: any) => number;
    getAuthToken?: () => string | null;
    enableInfiniteScroll?: boolean;
    scrollThreshold?: number;
    enableVisibilityTracking?: boolean;
    visibilityThreshold?: number;
    visibilityRootMargin?: string;
    onItemsViewed?: (viewedItems: T[]) => Promise<void>;
    getItemId?: (item: T) => number | string;
    shouldTrackItem?: (item: T) => boolean;
    onDropdownOpen?: () => void;
    onDropdownClose?: () => void;
    onBatchAction?: (action: string, itemIds: (number | string)[]) => Promise<void>;
}
interface LoadState {
    loading: boolean;
    error: string | null;
    hasMore: boolean;
    page: number;
    total: number;
}
declare class ItemsLoader<T = unknown> extends Component {
    items: T[];
    loadState: LoadState;
    filters: Record<string, unknown>;
    config: ItemsLoaderConfig<T>;
    private scrollContainer;
    private loadMoreObserver;
    private currentLoadMoreTrigger;
    private loadMoreMutationObserver;
    private visibilityObserver;
    private viewedItems;
    private dropdownIsOpen;
    private itemsListContainer;
    private searchInput;
    private isUpdating;
    private searchDebounceTimer;
    initialize(config: ItemsLoaderConfig<T>): void;
    onMount(): Promise<void>;
    onUnmount(): void;
    loadMore(): Promise<void>;
    reload(): Promise<void>;
    applyFilters(newFilters: Record<string, unknown>): Promise<void>;
    handleSearch(searchQuery: string): Promise<void>;
    updateItems(updatedItems: T[]): void;
    private setupVisibilityTracking;
    private observeTrackableItems;
    private trackAlreadyVisibleItems;
    private disconnectVisibilityObserver;
    handleDropdownOpen(): void;
    handleDropdownClose(): Promise<void>;
    performBatchAction(action: string, itemIds: (number | string)[]): Promise<void>;
    private appendNewItems;
    private updateLoadingState;
    updateFooter(): void;
    private setupInfiniteScroll;
    private reconnectInfiniteScrollObserver;
    private disconnectInfiniteScrollObserver;
    private setupScrollListener;
    private handleScroll;
    private findScrollContainer;
    private buildUrl;
    private buildHeaders;
    private handleItemClick;
    private createElementFromVNode;
    render(): VNode;
    private renderSearchBar;
    renderEmptyState(): VNode;
    private renderLoading;
    private renderError;
    private renderLoadMoreTrigger;
    private renderEndMessage;
}
declare function createItemsLoader<T>(config: ItemsLoaderConfig<T>): ItemsLoader<T>;

interface DropdownItemConfig {
    id?: string;
    icon?: string;
    label: string;
    onclick?: (e: Event) => void;
    className?: string;
    disabled?: boolean;
    selected?: boolean;
}
interface DropdownConfig {
    id: string;
    trigger: {
        text?: string;
        icon?: string;
        element?: () => unknown;
        className?: string;
    };
    items: (DropdownItemConfig | 'divider')[];
    position?: 'left' | 'right';
    parentId?: string;
    closeOnItemClick?: boolean;
    preventAutoClose?: boolean;
    onOpen?: () => void;
    onClose?: () => void;
}
declare class Dropdown extends Component {
    config: DropdownConfig;
    isOpen: boolean;
    private mounted;
    constructor(config: DropdownConfig);
    onMount(): void;
    onUnmount(): void;
    /**
     * Public method to set open state (called by manager)
     */
    setOpen(open: boolean): void;
    /**
     * Manually update the dropdown's DOM without triggering parent re-renders
     */
    private updateDOM;
    /**
     * Create DOM element from VNode (simplified version)
     */
    private createElementFromVNode;
    /**
     * Toggle dropdown
     */
    toggle(e: Event): void;
    /**
     * Handle item click
     */
    handleItemClick(item: DropdownItemConfig, e: Event): void;
    render(): VNode;
    private renderTrigger;
    private renderMenu;
}
/**
 * Create a dropdown instance
 */
declare function createDropdown(config: DropdownConfig): Dropdown;

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

/**
 * Configuration for intersection observer
 */
interface IntersectionConfig {
    root?: Element | null;
    rootMargin?: string;
    threshold?: number | number[];
    onEnter?: (entry: IntersectionObserverEntry) => void;
    onExit?: (entry: IntersectionObserverEntry) => void;
    once?: boolean;
}
/**
 * Simple wrapper around Intersection Observer API
 * Makes it easy to detect when elements become visible
 */
declare class VisibilityObserver {
    private observer;
    private observedElements;
    constructor(config: IntersectionConfig);
    /**
     * Start observing an element
     */
    observe(element: Element): void;
    /**
     * Stop observing an element
     */
    unobserve(element: Element): void;
    /**
     * Disconnect the observer
     */
    disconnect(): void;
}
/**
 * Helper function to observe when element becomes visible (once)
 * @param element - Element to observe
 * @param callback - Callback when element becomes visible
 * @returns Function to stop observing
 */
declare function observeVisibility(element: Element, callback: (entry: IntersectionObserverEntry) => void): () => void;

/**
 * Formats a timestamp into a relative time string with translation
 * Returns the formatted time and original ISO string as title attribute
 *
 * @param timestamp - ISO 8601 timestamp string or Date object
 * @returns Object with formatted time and original timestamp for title
 */
declare function formatRelativeTime(timestamp: string | Date): {
    formatted: string;
    originalDate: string;
    title: string;
};
/**
 * Creates an HTML time element with relative time and title attribute
 * Usage: place this directly in your component render
 *
 * @param timestamp - ISO 8601 timestamp string or Date object
 * @returns Object with text content and title for use in createElement
 */
declare function getTimeDisplay(timestamp: string | Date): {
    text: string;
    title: string;
};
/**
 * Format time for display with full date fallback
 * @param timestamp - ISO 8601 timestamp string or Date object
 * @returns Formatted string like "2 hours ago"
 */
declare function formatTimeAgo(timestamp: string | Date): string;
/**
 * Get the ISO string for title attribute
 * @param timestamp - ISO 8601 timestamp string or Date object
 * @returns Localized full date string
 */
declare function getTimeTitle(timestamp: string | Date): string;

export { type ApiConfig, type AppConfig, type BuildConfig, type ClassValue, type ClientConfig, CombinedContext, Component, type ComponentConstructor, Context, type ContextSubscriber, type DeepPartial, type DevToolsConfig, Dropdown, type DropdownConfig, type DropdownItemConfig, type EventHandler, type FormConfig, type FormField, type FormFieldConfig, type FormFieldOption, type FormSubmitHandler, type FormsConfig, type I18nConfig, I18nManager, type IntersectionConfig, ItemsLoader, type ItemsLoaderConfig, type LanguageCode, Loader, type LoaderOptions, type LoaderSize, type LoaderVariant, type NavigationGuard, Popup, type PopupButton, type PopupFormOptions, type PopupOptions, type PopupSize, type PopupType, type PopupVariant, Provider, type ProviderProps, type Route, type RouteConfig, Router, type RouterConfig, SmartForm, SmartFormComponent, type StateConfig, Store, type StoreMiddleware, type StoreOptions, type StoreSubscriber, StyleManager, type Tab, type TabPosition, type TabStyle, TabbedView, type TabbedViewOptions, Toast, type ToastMessage, type ToastType, type TranslationSet, type ValidationRule, VisibilityObserver, camelCase, capitalize, clamp, classNames, clearHookContext, client, computed, connect, createCombinedContext, createComputedStore, createContext, createDropdown, createFunctionalComponent, createItemsLoader, createStore, createTabbedView, createTranslator, css, debounce, deepClone, deepMerge, formatDate, formatRelativeTime, formatTimeAgo, getCurrentLanguage, getCurrentPath, getI18n, getPopup, getQueryParam, getQueryParams, getSupportedLanguages, getTimeDisplay, getTimeTitle, getToast, getTranslations, goBack, goForward, hasKey, initPopup, initToast, initializeI18n, isBrowser, isCurrentPath, isCurrentPathPrefix, isEmpty, kebabCase, loadFromUrl, loadLanguage, loadLanguageFile, loadTranslations, mountTabbedView, navigate, navigateWithQuery, observeVisibility, parseQuery, pascalCase, popup, reloadRoute, router, safeJsonParse, scheduler, setHookContext, setLanguage, setLanguageAsync, setupI18n, sleep, state, stringifyQuery, t, tHtml, tLang, throttle, toast, truncate, uniqueId, useCallback, useContext, useDebounce, useEffect, useEventListener, useFetch, useInterval, useLocalStorage, useMemo, usePrevious, useReducer, useRef, useState, useToggle, useWindowSize, utils, watch };
