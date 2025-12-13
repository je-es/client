// src/mod/i18n/types.ts
//
// Made with ❤️ by Maysara.

export type LanguageCode = string;

export type TranslationSet = Record<string, Record<string, string>>;

export interface I18nConfig {
    defaultLanguage?: LanguageCode;
    supportedLanguages?: LanguageCode[];
    staticPath?: string;
}
