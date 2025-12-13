// test/i18n.test.ts
//
// Made with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import { describe, it, expect, beforeEach } from 'bun:test';
    import {
        t,
        tLang,
        setLanguage,
        getCurrentLanguage,
        loadLanguage,
        loadTranslations,
        getSupportedLanguages,
        hasKey,
        getTranslations,
        createTranslator,
        initializeI18n
    } from '../src/mod/services/i18n';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TEST ════════════════════════════════════════╗

    describe('i18n Module', () => {
        beforeEach(() => {
            // Clear instance and reinitialize
            initializeI18n({ defaultLanguage: 'en', supportedLanguages: ['en', 'ar'] });
        });

        it('should load translations for a specific language', () => {
            loadLanguage('en', {
                hello: 'Hello',
                goodbye: 'Goodbye'
            });
            expect(hasKey('hello')).toBe(true);
        });

        it('should load all translations at once', () => {
            const translations = {
                en: { hello: 'Hello', goodbye: 'Goodbye' },
                ar: { hello: 'مرحبا', goodbye: 'وداعا' }
            };
            loadTranslations(translations);
            expect(hasKey('hello')).toBe(true);
            expect(getSupportedLanguages()).toContain('ar');
        });

        it('should translate keys to the current language', () => {
            loadTranslations({
                en: { hello: 'Hello' },
                ar: { hello: 'مرحبا' }
            });
            setLanguage('en');
            expect(t('hello')).toBe('Hello');
            setLanguage('ar');
            expect(t('hello')).toBe('مرحبا');
        });

        it('should return the key if translation does not exist', () => {
            expect(t('non.existent.key')).toBe('non.existent.key');
        });

        it('should fall back to default language if translation is missing for current language', () => {
            loadLanguage('en', {
                greeting: 'Good morning'
            });
            setLanguage('ar');
            expect(t('greeting')).toBe('Good morning');
        });

        it('should replace parameters in translations', () => {
            loadTranslations({
                en: { welcome: 'Welcome to {app_name}' },
                ar: { welcome: 'مرحبا بك في {app_name}' }
            });
            setLanguage('en');
            expect(t('welcome', { app_name: 'MyApp' })).toBe('Welcome to MyApp');
            setLanguage('ar');
            expect(t('welcome', { app_name: 'تطبيقي' })).toBe('مرحبا بك في تطبيقي');
        });

        it('should handle nested parameter replacement with translation keys', () => {
            loadTranslations({
                en: {
                    hello: 'Hello',
                    greeting: 'Say {greeting} to everyone'
                },
                ar: {
                    hello: 'مرحبا',
                    greeting: 'قل {greeting} للجميع'
                }
            });
            setLanguage('en');
            expect(t('greeting', { greeting: 'hello' })).toBe('Say Hello to everyone');
        });

        it('should translate with a specific language temporarily', () => {
            loadTranslations({
                en: { hello: 'Hello' },
                ar: { hello: 'مرحبا' }
            });
            setLanguage('en');
            expect(getCurrentLanguage()).toBe('en');
            expect(tLang('hello', 'ar')).toBe('مرحبا');
            // Current language should not change
            expect(getCurrentLanguage()).toBe('en');
        });

        it('should set and get current language', () => {
            setLanguage('ar');
            expect(getCurrentLanguage()).toBe('ar');
            setLanguage('en');
            expect(getCurrentLanguage()).toBe('en');
        });

        it('should check if a key exists', () => {
            loadLanguage('en', {
                existing_key: 'Exists'
            });
            expect(hasKey('existing_key')).toBe(true);
            expect(hasKey('non_existing_key')).toBe(false);
        });

        it('should get all translations for current language', () => {
            const enTranslations = { hello: 'Hello', goodbye: 'Goodbye' };
            loadLanguage('en', enTranslations);
            setLanguage('en');
            const current = getTranslations();
            expect(current.hello).toBe('Hello');
        });

        it('should get all supported languages', () => {
            loadTranslations({
                en: { hello: 'Hello' },
                ar: { hello: 'مرحبا' },
                fr: { hello: 'Bonjour' }
            });
            const langs = getSupportedLanguages();
            expect(langs).toContain('en');
            expect(langs).toContain('ar');
            expect(langs).toContain('fr');
        });

        it('should create a translator that listens to language changes', () => {
            let callCount = 0;
            const unsubscribe = createTranslator(() => {
                callCount++;
            });

            loadLanguage('en', { hello: 'Hello' });
            loadLanguage('ar', { hello: 'مرحبا' });

            setLanguage('ar');
            expect(callCount).toBeGreaterThan(0);

            unsubscribe();
        });

        it('should preserve multiple parameter replacements', () => {
            loadLanguage('en', {
                message: '{greeting}, my name is {name}'
            });
            setLanguage('en');
            expect(t('message', { greeting: 'Hello', name: 'John' })).toBe('Hello, my name is John');
        });
    });

// ╚══════════════════════════════════════════════════════════════════════════════════════╝
