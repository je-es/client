// src/types.ts
//
// Made with ❤️ by Maysara.



// ╔════════════════════════════════════════ TYPE ════════════════════════════════════════╗

    import { ApiInterceptors } from '@je-es/capi';
    import { ComponentConstructor } from './mod/core/component';
    export type { ComponentConstructor } from './mod/core/component';

    // Import VDOM types from @je-es/vdom to ensure compatibility
    export type {
        VNode,
        VNodeChild,
        VNodeProps,
    } from '@je-es/vdom';

    // Import API types from @je-es/capi to ensure compatibility
    export type {
        HttpMethod,
        ParamValue,
        RequestData,
        ApiOptions,
        ApiResponse,
        ApiError,
        ApiInterceptors,
        ApiConfig as CapiConfig
    } from '@je-es/capi';


    export interface BuildConfig {
        entry: string;
        output: string;
        minify?: boolean;
        sourcemap?: boolean;
        optimization?: {
            splitChunks?: boolean;
            treeShaking?: boolean;
        };
        styles?: {
            input?: string;  // Default: './app/style'
            output?: string; // Default: './static/client.css'
        };
    }

    export interface AppConfig {
        root: string;
        routes?: RouteConfig[];
        mode?: 'spa' | 'ssr';
    }

    export interface StateConfig {
        persist?: boolean;
        storage?: 'localStorage' | 'sessionStorage';
    }

    export interface FormsConfig {
        autoValidate?: boolean;
        csrfProtection?: boolean;
    }

    export interface RouterConfig {
        mode?: 'history' | 'hash';
        base?: string;
        scrollBehavior?: 'auto' | 'smooth' | 'instant';
        beforeEach?: NavigationGuard;
        afterEach?: (to: Route, from: Route) => void;
    }

    export interface ApiConfig {
        baseURL?: string;
        timeout?: number;
        headers?: Record<string, string>;
        interceptors?: ApiInterceptors;
    }

    export interface DevToolsConfig {
        enabled?: boolean;
        showRouterInfo?: boolean;
        showStateChanges?: boolean;
    }

    export type LanguageCode = string;

    export type TranslationSet = Record<string, Record<string, string>>;

    export interface I18nConfig {
        defaultLanguage?: LanguageCode;
        supportedLanguages?: LanguageCode[];
        staticPath?: string;
    }

    export interface ClientConfig {
        build?: BuildConfig;
        app?: AppConfig;
        state?: StateConfig;
        forms?: FormsConfig;
        router?: RouterConfig;
        api?: ApiConfig;
        i18n?: I18nConfig;
        devTools?: DevToolsConfig;
    }

    export interface Route {
        path: string;
        params: Record<string, string>;
        query: Record<string, string>;
        meta: Record<string, unknown>;
        hash: string;
        name?: string;
    }

    export type NavigationGuard = (
        to: Route,
        from: Route,
        next: (path?: string | false) => void
    ) => void | Promise<void>;

    export interface RouteConfig {
        path: string;
        name?: string;
        component: ComponentConstructor | (() => Promise<{ default?: ComponentConstructor; [key: string]: unknown }>);
        meta?: Record<string, unknown>;
        beforeEnter?: NavigationGuard;
        children?: RouteConfig[];
    }

    export type StoreSubscriber<T> = (state: T) => void;

    export type StoreMiddleware<T> = (state: T, action?: string) => void;

    export interface StoreOptions<T> {
        state: T;
        persist?: boolean;
        storage?: 'localStorage' | 'sessionStorage';
        storageKey?: string;
        middleware?: StoreMiddleware<T>[];
    }

    export interface ValidationRule {
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

    export interface FormFieldOption {
        label: string;
        value: string | number;
    }

    export interface FormFieldConfig {
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

    export type FormSubmitHandler = (data: Record<string, unknown>, event: Event) => void | Promise<void>;

    // Helper types for utility functions
    export type ClassValue = string | Record<string, boolean> | undefined | null | false;

    export type DeepPartial<T> = {
        [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
    };

    // Event handler types
    export type EventHandler<T extends Event = Event> = (event: T) => void;

// ╚══════════════════════════════════════════════════════════════════════════════════════╝