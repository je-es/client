// src/mod/i18n/i18n.ts
//
// Made with ❤️ by Maysara.

import { TranslationSet, LanguageCode, I18nConfig } from './types';

class I18nManager {
    // ┌──────────────────────────────── INIT ──────────────────────────────┐

    private translations: TranslationSet = {};
    private currentLanguage: LanguageCode = 'en';
    private defaultLanguage: LanguageCode = 'en';
    private supportedLanguages = new Set<LanguageCode>(['en']);
    private cachePath: string = '';

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

        // Try current language, then default language, then return key itself
        let translation =
            this.translations[lang]?.[key] ||
            this.translations[this.defaultLanguage]?.[key] ||
            key;

        // Replace parameters if provided
        if (params) {
            Object.entries(params).forEach(([param, value]) => {
                // Check if the parameter value is a translation key
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

    // └────────────────────────────────────────────────────────────────────┘

    // ┌──────────────────────────────── HELPERS ──────────────────────────────┐

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
 * Initialize the i18n manager
 * @param config I18n configuration
 * @returns I18nManager instance
 */
export function initI18n(config?: I18nConfig): I18nManager {
    if (!i18nInstance) {
        i18nInstance = new I18nManager(config);
    }
    return i18nInstance;
}

/**
 * Get the global i18n instance
 */
export function getI18n(): I18nManager {
    if (!i18nInstance) {
        i18nInstance = new I18nManager();
    }
    return i18nInstance;
}

export default getI18n();
export { I18nManager };
