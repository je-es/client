// src/main.ts
//
// Made with ❤️ by Maysara.



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

    // Core exports
    export { Component } from './mod/core/component';
    export { client } from './mod/core/client';
    export { router, Router } from './mod/core/router';
    export { Store, createStore, createComputedStore, connect } from './mod/core/store';
    export { api, http, configureApi, getApiConfig, resetApiConfig, type ApiError } from '@je-es/capi';
    export { StyleManager, css } from './mod/core/styles';
    export { createElement, html, patch, createDOMElement } from '@je-es/vdom';

    // Decorators
    export { state, computed, watch } from './mod/core/decorators';

    // Components
    export { SmartFormComponent, SmartForm, type FormConfig } from './mod/components/smart-form';

    // Utilities
    export { utils, debounce, throttle, classNames, formatDate, deepClone, deepMerge, uniqueId, sleep, isEmpty, capitalize, kebabCase, camelCase, pascalCase, truncate, parseQuery, stringifyQuery, clamp, isBrowser, safeJsonParse } from './mod/help';

    // i18n (Internationalization)
    export { 
        t, 
        tLang,
        setLanguage, 
        getCurrentLanguage, 
        loadLanguage,
        loadTranslations, 
        loadFromUrl,
        getSupportedLanguages,
        hasKey, 
        getTranslations,
        createTranslator,
        initializeI18n,
        type TranslationSet,
        type LanguageCode,
        type I18nConfig
    } from './mod/i18n';

    // Context API
    export {
        Context,
        createContext,
        Provider,
        useContext,
        CombinedContext,
        createCombinedContext
    } from './mod/core/context';

    // Hooks System
    export {
        // Core hooks
        useState,
        useEffect,
        useMemo,
        useCallback,
        useRef,
        useReducer,

        // Custom hooks
        useLocalStorage,
        useDebounce,
        usePrevious,
        useToggle,
        useInterval,
        useFetch,
        useWindowSize,
        useEventListener,

        // Functional components
        createFunctionalComponent,
        setHookContext,
        clearHookContext
    } from './mod/core/hooks';

    // VDOM Types
    export type { VNode, VNodeProps, ComponentConstructor, VNodeChild } from './types';

    // Client Types
    export type { ClientConfig, BuildConfig, AppConfig, StateConfig, FormsConfig, RouterConfig, ApiConfig, DevToolsConfig } from './types';

    // Router Types
    export type { Route, RouteConfig, NavigationGuard } from './types';

    // API Types
    export type { ApiOptions, ApiResponse, HttpMethod, ApiInterceptors } from './types';

    // Store Types
    export type { StoreOptions, StoreSubscriber, StoreMiddleware } from './types';

    // Form Types
    export type { FormFieldConfig, ValidationRule, FormFieldOption, FormSubmitHandler } from './types';

    // Scheduler
    export { scheduler } from './mod/core/scheduler';

    import { setConfig } from '@je-es/vdom';

    setConfig({
        devMode: false,              // Enable warnings
        sanitizeHTML: true,         // XSS protection
        // onError: (err) => {         // Custom error handler
        //     console.error('VDOM Error:', err);
        // }
    });

// ╚══════════════════════════════════════════════════════════════════════════════════════╝