// src/mod/services/i18n.ts
//
// Made with ❤️ by Maysara.



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

    import type { TranslationSet, LanguageCode, I18nConfig } from '../../types';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

    class I18nManager {

        // ┌──────────────────────────────── INIT ──────────────────────────────┐

            private translations: TranslationSet = {};
            private currentLanguage: LanguageCode = 'en';
            private defaultLanguage: LanguageCode = 'en';
            private supportedLanguages = new Set<LanguageCode>(['en']);
            private cachePath: string = '';
            private readyListeners: (() => void)[] = [];

            constructor(config?: I18nConfig) {
                if (config) {
                    this.defaultLanguage = config.defaultLanguage || 'en';
                    this.currentLanguage = this.getStoredLanguage() || config.defaultLanguage || 'en';
                    this.cachePath = config.staticPath || 'static/i18n';
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
             * @param translations Translation object
             */
            public loadLanguage(lang: LanguageCode, translations: Record<string, string>): void {
                if (!this.translations[lang]) {
                    this.translations[lang] = {};
                }
                this.translations[lang] = { ...this.translations[lang], ...translations };
                this.supportedLanguages.add(lang);
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
            public t(key: string, params?: Record<string, string>): string {
                const lang = this.currentLanguage;

                let translation =
                    this.translations[lang]?.[key] ||
                    this.translations[this.defaultLanguage]?.[key] ||
                    key;

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
                                    const basePath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));
                                    if (fullUrl.startsWith('/')) {
                                        fullUrl = window.location.origin + fullUrl;
                                    } else {
                                        fullUrl = window.location.origin + basePath + '/' + fullUrl;
                                    }
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
                                const basePath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));
                                if (fullUrl.startsWith('/')) {
                                    fullUrl = window.location.origin + fullUrl;
                                } else {
                                    fullUrl = window.location.origin + basePath + '/' + fullUrl;
                                }
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

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ HELP ════════════════════════════════════════╗

    /**
     * Global translation function
     * @param key Translation key
     * @param params Optional parameters
     * @returns Translated string
     */
    export function t(key: string, params?: Record<string, string>): string {
        return getI18n().t(key, params);
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
     * Set the current language globally
     * @param lang Language code
     */
    export function setLanguage(lang: string): void {
        getI18n().setLanguage(lang);
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
     * @param translations Translation object
     */
    export function loadLanguage(lang: string, translations: Record<string, string>): void {
        getI18n().loadLanguage(lang, translations);
    }

    /**
     * Load all translations
     * @param translations The translations object
     */
    export function loadTranslations(translations: Record<string, Record<string, string>>): void {
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
     * Setup i18n: Initialize, load translations, and return ready promise
     * Simple one-call setup that handles everything
     *
     * @param config I18n configuration
     * @returns Promise that resolves when i18n is ready
     *
     * @example
     * await setupI18n({
     *     defaultLanguage: 'en',
     *     supportedLanguages: ['en', 'ar'],
     *     staticPath: 'static/i18n'
     * });
     * console.log(t('hello')); // Ready to use!
     */
    export async function setupI18n(config: I18nConfig): Promise<void> {
        // Initialize i18n with config
        const manager = new I18nManager(config);
        i18nInstance = manager;

        // Load translations
        if (config.staticPath && config.supportedLanguages) {
            const baseUrl = config.staticPath.endsWith('/')
                ? config.staticPath
                : config.staticPath + '/';
            const urlPattern = baseUrl + '*.json';

            await manager.loadFromUrl(urlPattern);
        }
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝
