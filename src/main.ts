// src/main.ts
//
// Made with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    // Config VDOM
    import { setConfig } from '@je-es/vdom';
    setConfig({
        devMode: false,             // Enable warnings
        sanitizeHTML: true,         // XSS protection
        // onError: (err) => {      // Custom error handler
        //     console.error('VDOM Error:', err);
        // }
    });

    // Types
    export * from './types';

    // Core
    export * from './mod/core/component';
    export * from './mod/core/decorators';
    export * from './mod/core/scheduler';
    export * from './mod/core/context';
    export * from './mod/core/hooks';
    export * from './mod/core/router';
    export * from './mod/core/store';
    export * from './mod/core/client';
    export * from './mod/core/styles';

    // Services
    export * from './mod/services/i18n';

    // Components
    export * from './mod/components/toast';
    export * from './mod/components/loader';
    export * from './mod/components/popup';
    export * from './mod/components/smart_form';
    export * from './mod/components/tabbed_view';
    export * from './mod/components/items_loader';
    export * from './mod/components/dropdown';

    // Utilities
    export * from './mod/help';
    export * from './mod/utils/intersection_observer';
    export * from './mod/utils/time_formatter';

    // Third-party packages
    export { api, http, configureApi, getApiConfig, resetApiConfig, type ApiError } from '@je-es/capi';
    export { createElement, html, patch, createDOMElement } from '@je-es/vdom';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝