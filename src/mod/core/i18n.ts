/* eslint-disable @typescript-eslint/no-explicit-any */
// src/mod/core/i18n.ts
//
// Made with ❤️ by Maysara.



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

    import type { TranslationSet, LanguageCode, I18nConfig, VNode } from '../../types';
    import { createElement } from '@je-es/vdom';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

    class I18nManager {

        // ┌──────────────────────────────── INIT ──────────────────────────────┐

            private translations            : TranslationSet    = {};
            private currentLanguage         : LanguageCode      = 'en';
            private defaultLanguage         : LanguageCode      = 'en';
            private supportedLanguages      : Set<LanguageCode> = new Set<LanguageCode>(['en']);
            private cachePath               : string            = '';
            private readyListeners          : (() => void)[]    = [];

            constructor(config?: I18nConfig) {
                if (config) {
                    this.defaultLanguage    = config.defaultLanguage    || 'en';
                    this.cachePath          = config.staticPath         || 'static/i18n';
                    this.currentLanguage    = this.getStoredLanguage()  || config.defaultLanguage || 'en';

                    if (config.supportedLanguages) {
                        this.supportedLanguages = new Set(config.supportedLanguages);
                    }
                }
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── MAIN ──────────────────────────────┐

            /**
             * Load translations for a specific language
             * @param lang Language code (e.g., 'en', 'ar', 'fr')
             * @param translations Translation object (can be nested)
             */
            public loadLanguage(lang: LanguageCode, translations: Record<string, any>): void {
                if (!this.translations[lang]) {
                    this.translations[lang] = {};
                }
                // Flatten the nested translations
                const flattened = this.flattenObject(translations);
                this.translations[lang] = { ...this.translations[lang], ...flattened };
                this.supportedLanguages.add(lang);
            }

            /**
             * Flatten nested object into dot notation
             * @param obj Nested object
             * @param prefix Current prefix
             * @returns Flattened object with dot notation keys
             */
            private flattenObject(obj: Record<string, any>, prefix: string = ''): Record<string, string> {
                const flattened: Record<string, string> = {};

                for (const key in obj) {
                    if (Object.prototype.hasOwnProperty.call(obj, key)) {
                        const value = obj[key];
                        const newKey = prefix ? `${prefix}.${key}` : key;

                        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                            // Recursively flatten nested objects
                            Object.assign(flattened, this.flattenObject(value, newKey));
                        } else {
                            // Store the value
                            flattened[newKey] = String(value);
                        }
                    }
                }

                return flattened;
            }

            /**
             * Load all translations from static files
             * @param translations Object with language codes as keys and translation objects as values
             */
            public loadTranslations(translations: TranslationSet): void {
                Object.entries(translations).forEach(([lang, trans]) => {
                    this.loadLanguage(lang, trans);
                });
            }

            /**
             * Set the current language
             * @param lang Language code
             */
            public setLanguage(lang: LanguageCode): void {
                if (this.supportedLanguages.has(lang)) {
                    this.currentLanguage = lang;
                    this.storeLanguage(lang);
                    this.dispatchLanguageChangeEvent();
                } else if (this.supportedLanguages.has(this.defaultLanguage)) {
                    this.currentLanguage = this.defaultLanguage;
                }
            }

            /**
             * Get the current language
             */
            public getLanguage(): LanguageCode {
                return this.currentLanguage;
            }

            /**
             * Get all supported languages
             */
            public getSupportedLanguages(): LanguageCode[] {
                return Array.from(this.supportedLanguages);
            }

            /**
             * Translate a key with smart parameter replacement
             * Supports nested translation keys as parameter values
             *
             * @example
             * // Simple translation
             * t('button.login') // => "Login" or "دخـول" depending on current language
             *
             * @example
             * // With parameters
             * t('nav.credits', { count: '100' })
             * // => "Available Credits: 100"
             *
             * @example
             * // With nested translation keys as parameters
             * t('language.switching_to', { language: 'button.login' })
             * // => "Switching to Login..."
             *
             * @param key Translation key (supports dot notation for nested keys)
             * @param params Optional parameters for replacement
             * @param defaultValue Optional default translation key
             * @returns Translated string with replaced parameters
             */
            public t(key: string, params?: Record<string, string>, defaultValue?: string): string {
                const lang = this.currentLanguage;

                let translation = this.getTranslation(key, defaultValue);

                if (params) {
                    Object.entries(params).forEach(([param, value]) => {
                        const paramValue =
                            this.translations[lang]?.[value] ||
                            this.translations[this.defaultLanguage]?.[value] ||
                            value;

                        translation = translation.replace(
                            new RegExp(`\\{${param}\\}`, 'g'),
                            paramValue
                        );
                    });
                }

                return translation;
            }

            private getTranslation(key: string, defaultValue?: string): string {
                const lang = this.currentLanguage;

                // warn if not found
                if (!this.translations[lang]?.[key]) {
                    console.warn(`Translation key not found: ${key}`);

                    return defaultValue || key;
                }

                return this.translations[lang]?.[key] || this.translations[this.defaultLanguage]?.[key];
            }

            /**
             * Translate with a specific language (overrides current language temporarily)
             *
             * @param key Translation key
             * @param lang Language code
             * @param params Optional parameters
             * @returns Translated string
             */
            public tLang(key: string, lang: LanguageCode, params?: Record<string, string>): string {
                const currentLang = this.currentLanguage;
                this.currentLanguage = lang;
                const result = this.t(key, params);
                this.currentLanguage = currentLang;
                return result;
            }

            /**
             * Translate a key and convert HTML tags in the translation to VNode elements
             * Supports tags like <br>, <strong>, <em>, <b>, <i>, etc.
             * Useful for multiline translations with formatting
             *
             * @example
             * // Translation: "Hello <br> World"
             * tHtml('page.home.title') // => [text node, br element, text node]
             *
             * @param key Translation key
             * @param params Optional parameters for replacement
             * @param defaultValue Optional default translation key
             * @returns Array of VNode and string elements that can be used as children
             */
            public tHtml(key: string, params?: Record<string, string>, defaultValue?: string): (VNode | string)[] {
                const translation = this.t(key, params, defaultValue);
                return this.parseHtmlString(translation);
            }

            /**
             * Parse HTML string into VNode and text elements
             * Converts \n and /n sequences to <br> tags
             * @private
             */
            private parseHtmlString(htmlString: string): (VNode | string)[] {
                // Replace both \n and /n with <br> tags
                const processedString = htmlString.replace(/\\n|\/n/g, '<br>');

                const result: (VNode | string)[] = [];
                const regex = /<([^/>]+)>([^<]*)<\/\1>|<([^/>]+)\s*\/?>|([^<]+)/g;
                let match;

                while ((match = regex.exec(processedString)) !== null) {
                    const openingTag = match[1]; // For paired tags like <strong>text</strong>
                    const pairedContent = match[2];
                    const selfClosingTag = match[3]; // For self-closing tags like <br/>
                    const textContent = match[4];

                    if (textContent) {
                        // Plain text content
                        result.push(textContent);
                    } else if (openingTag) {
                        // Paired tag like <strong>text</strong>
                        const tagName = openingTag.split(/\s+/)[0].toLowerCase();
                        result.push(createElement(tagName, {}, pairedContent));
                    } else if (selfClosingTag) {
                        // Self-closing tag like <br/> or <br>
                        const tagName = selfClosingTag.trim().toLowerCase();
                        result.push(createElement(tagName, {}));
                    }
                }

                return result.length > 0 ? result : [htmlString];
            }

            /**
             * Get all translations for current language
             */
            public getTranslations(): Record<string, string> {
                return this.translations[this.currentLanguage] || {};
            }

            /**
             * Check if a translation key exists
             * @param key Translation key
             * @returns true if key exists in current or default language
             */
            public hasKey(key: string): boolean {
                return !!(
                    this.translations[this.currentLanguage]?.[key] ||
                    this.translations[this.defaultLanguage]?.[key]
                );
            }

            /**
             * Create a reactive translation function that listens to language changes
             * @param updateCallback Callback function to execute when language changes
             * @returns Function to unsubscribe from language changes
             */
            public createTranslator(updateCallback: () => void): () => void {
                const handler = () => updateCallback();
                if (typeof window !== 'undefined') {
                    window.addEventListener('languagechange', handler);
                    return () => window.removeEventListener('languagechange', handler);
                }
                return () => {};
            }

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
            public async loadFromUrl(urlPattern: string | string[]): Promise<void> {
                const urls = Array.isArray(urlPattern) ? urlPattern : [urlPattern];
                const translations: TranslationSet = {};
                // let loadedCount = 0;

                for (const url of urls) {
                    if (url.includes('*')) {
                        const pattern = url.replace('*.json', '');
                        const langCodes = this.supportedLanguages;

                        for (const lang of langCodes) {
                            try {
                                let fullUrl = `${pattern}${lang}.json`;

                                if (typeof window !== 'undefined' && !fullUrl.startsWith('http')) {
                                    // Always use domain root + path, ignoring current page path
                                    fullUrl = window.location.origin + (fullUrl.startsWith('/') ? fullUrl : '/' + fullUrl);
                                }

                                const response = await fetch(fullUrl);
                                if (response.ok) {
                                    const data = await response.json();
                                    translations[lang] = data;
                                    // loadedCount++;
                                }
                            } catch {
                                // Silently continue on error
                            }
                        }
                    } else {
                        try {
                            let fullUrl = url;

                            if (typeof window !== 'undefined' && !fullUrl.startsWith('http')) {
                                // Always use domain root + path, ignoring current page path
                                fullUrl = window.location.origin + (fullUrl.startsWith('/') ? fullUrl : '/' + fullUrl);
                            }

                            const response = await fetch(fullUrl);
                            if (response.ok) {
                                const data = await response.json();
                                const langMatch = url.match(/([a-z]{2,3})\.json$/i);
                                const lang = langMatch ? langMatch[1].toLowerCase() : 'en';
                                translations[lang] = data;
                                this.supportedLanguages.add(lang);
                                // loadedCount++;
                            }
                        } catch {
                            // Silently continue on error
                        }
                    }
                }

                if (Object.keys(translations).length > 0) {
                    this.loadTranslations(translations);
                    this.notifyReady();
                }
            }

            /**
             * Register a callback for when i18n is ready
             */
            public onReady(callback: () => void): void {
                if (Object.keys(this.translations).length > 0) {
                    // Already loaded, call immediately
                    callback();
                } else {
                    // Not loaded yet, add to listeners
                    this.readyListeners.push(callback);
                }
            }

            /**
             * Notify all listeners that i18n is ready
             */
            private notifyReady(): void {
                for (const listener of this.readyListeners) {
                    listener();
                }
                this.readyListeners = [];
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── HELP ──────────────────────────────┐

            /**
             * Get language from localStorage
             */
            private getStoredLanguage(): LanguageCode | null {
                if (typeof localStorage !== 'undefined') {
                    return (localStorage.getItem('app-language') as LanguageCode) || null;
                }
                return null;
            }

            /**
             * Store language in localStorage
             */
            private storeLanguage(lang: LanguageCode): void {
                if (typeof localStorage !== 'undefined') {
                    localStorage.setItem('app-language', lang);
                }
            }

            /**
             * Dispatch language change event
             */
            private dispatchLanguageChangeEvent(): void {
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('languagechange', { detail: { language: this.currentLanguage } }));
                }
            }

        // └────────────────────────────────────────────────────────────────────┘
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ HELP ════════════════════════════════════════╗

    // Singleton instance
    let i18nInstance: I18nManager | null = null;

    /**
     * Get the global i18n instance
     */
    export function getI18n(): I18nManager {
        if (!i18nInstance) {
            i18nInstance = new I18nManager();
        }
        return i18nInstance;
    }

    export { I18nManager };

    export type { TranslationSet, LanguageCode, I18nConfig };

    /**
     * Global translation function
     * @param key Translation key (supports dot notation for nested keys)
     * @param params Optional parameters
     * @param defaultValue Optional default translation key
     * @returns Translated string
     */
    export function t(key: string, params?: Record<string, string>, defaultValue?: string): string {
        return getI18n().t(key, params, defaultValue);
    }

    /**
     * Translate with a specific language (overrides current language temporarily)
     * @param key Translation key
     * @param lang Language code
     * @param params Optional parameters
     * @returns Translated string
     */
    export function tLang(key: string, lang: string, params?: Record<string, string>): string {
        return getI18n().tLang(key, lang, params);
    }

    /**
     * Translate a key and convert HTML tags to VNode elements
     * Useful for multiline translations with formatting like <br>
     * @param key Translation key
     * @param params Optional parameters
     * @param defaultValue Optional default translation key
     * @returns Array of VNode and string elements that can be used as children
     */
    export function tHtml(key: string, params?: Record<string, string>, defaultValue?: string): (VNode | string)[] {
        return getI18n().tHtml(key, params, defaultValue);
    }

    /**
     * Set the current language globally (synchronous)
     * @param lang Language code
     */
    export function setLanguage(lang: string): void {
        getI18n().setLanguage(lang);
    }

    /**
     * Set the current language globally with lazy-loading support (asynchronous)
     * Use this when you want to lazy-load language files on demand
     * @param lang Language code
     * @param staticPath Path to language files for lazy-loading
     * @returns Promise that resolves when language is loaded and set
     */
    export async function setLanguageAsync(lang: string, staticPath?: string): Promise<void> {
        const manager = getI18n();

        // Check if language is already loaded
        const currentTranslations = manager.getTranslations();
        const isLanguageLoaded = Object.keys(currentTranslations).length > 0;

        if (!isLanguageLoaded && staticPath) {
            // Language not loaded yet, try to lazy-load it
            const baseUrl = staticPath.endsWith('/') ? staticPath : staticPath + '/';
            try {
                await manager.loadFromUrl(baseUrl + `${lang}.json`);
            } catch (error) {
                console.warn(`Failed to lazy-load language: ${lang}`, error);
            }
        }

        manager.setLanguage(lang);
    }

    /**
     * Get the current language
     */
    export function getCurrentLanguage(): string {
        return getI18n().getLanguage();
    }

    /**
     * Load translations for a specific language
     * @param lang Language code
     * @param translations Translation object (can be nested)
     */
    export function loadLanguage(lang: string, translations: Record<string, any>): void {
        getI18n().loadLanguage(lang, translations);
    }

    /**
     * Load all translations
     * @param translations The translations object (can be nested)
     */
    export function loadTranslations(translations: Record<string, Record<string, any>>): void {
        getI18n().loadTranslations(translations);
    }

    /**
     * Get all supported languages
     */
    export function getSupportedLanguages(): string[] {
        return getI18n().getSupportedLanguages();
    }

    /**
     * Check if a translation key exists
     * @param key The translation key to check
     * @returns Whether the key exists
     */
    export function hasKey(key: string): boolean {
        return getI18n().hasKey(key);
    }

    /**
     * Get all translations for current language
     */
    export function getTranslations(): Record<string, string> {
        return getI18n().getTranslations();
    }

    /**
     * Create a reactive translator that listens to language changes
     * @param updateCallback Callback function to execute when language changes
     * @returns Function to unsubscribe from language changes
     */
    export function createTranslator(updateCallback: () => void): () => void {
        return getI18n().createTranslator(updateCallback);
    }

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
    export async function loadFromUrl(urlPattern: string | string[]): Promise<void> {
        return getI18n().loadFromUrl(urlPattern);
    }

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
    export function initializeI18n(config?: I18nConfig): void {
        i18nInstance = new I18nManager(config);
    }

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
     * console.log(t('button.login')); // Ready to use in current language!
     */
    export async function setupI18n(config: I18nConfig): Promise<void> {
        // Initialize i18n with config
        const manager = new I18nManager(config);
        i18nInstance = manager;

        // Load the CURRENT language (stored or default)
        if (config.staticPath) {
            const baseUrl = config.staticPath.endsWith('/')
                ? config.staticPath
                : config.staticPath + '/';

            // Get the language to load: stored language or default
            const langToLoad = manager.getLanguage();
            const langUrl = baseUrl + `${langToLoad}.json`;

            await manager.loadFromUrl(langUrl);
        }
    }

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
    export async function loadLanguageFile(lang: string, staticPath?: string): Promise<void> {
        const manager = getI18n();
        const path = staticPath || 'static/i18n';
        const baseUrl = path.endsWith('/') ? path : path + '/';
        const langUrl = baseUrl + lang + '.json';

        await manager.loadFromUrl(langUrl);
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝