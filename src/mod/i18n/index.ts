// src/mod/i18n/index.ts
//
// Made with ❤️ by Maysara.

import { getI18n, initI18n, I18nManager } from './i18n';

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
 * Create a reactive translation function that listens to language changes
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
 * Initialize the i18n manager with config
 * @param config I18n configuration
 */
export function initializeI18n(config?: Record<string, unknown>): I18nManager {
    return initI18n(config);
}

// Export types
export type { TranslationSet, LanguageCode, I18nConfig } from './types';
export { I18nManager };
