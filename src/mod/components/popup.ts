/* eslint-disable @typescript-eslint/no-explicit-any */
// src/mod/components/popup.ts
//
// Made with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import { createElement, VNode } from "@je-es/vdom";
    import { Component } from "../core/component";
    import { state } from "../core/decorators";
    import { t } from "../services/i18n";
    import { FormConfig, SmartForm } from "./smart_form";

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TYPE ════════════════════════════════════════╗

    export type PopupType = 'confirm' | 'alert' | 'form' | 'custom' | 'prompt';
    export type PopupVariant = 'default' | 'danger' | 'warning' | 'success' | 'info';
    export type PopupSize = 'small' | 'medium' | 'large' | 'xlarge' | 'fullscreen';

    export interface PopupButton {
        label: string;
        translateKey?: string;
        variant?: 'primary' | 'secondary' | 'danger' | 'success';
        icon?: string;
        onClick: () => void | Promise<void>;
        loading?: boolean;
    }

    export interface PopupFormOptions {
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

    export interface PopupOptions {
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

    // Blah Blah Style Map
    const bb_ = {
        container: 'bb_popupContainer',

        overlay: 'bb_popupOverlay',

        popup: {
            base: 'bb_popup',
            close: 'bb_popupClose',
        },

        header: {
            container: 'bb_popupHeader',
            icon: 'bb_popupHeaderIcon',
            content: 'bb_popupHeaderContent',
            title: 'bb_popupHeaderContentTitle',
            description: 'bb_popupHeaderContentDesc',
        },

        body: {
            container: 'bb_popupBody',
            message: 'bb_popupBodyMsg',
            input: 'bb_popupBodyInput',
            formContainer: 'bb_popupBodyFormContainer',
        },

        footer: 'bb_popupFooter',

        button: 'bb_btn',
    };

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

    export class Popup extends Component {

        // ────────────────────────────────── STATE ──────────────────────────────────

        // @ts-expect-error - TypeScript decorator limitation with class property types
        @state popups: ActivePopup[] = [];
        private nextId = 0;
        private handleEscapeKey?: (e: KeyboardEvent) => void;

        // ────────────────────────────────── LIFECYCLE ──────────────────────────────

        async onMount() {
            this.setupKeyboardListener();

            window.addEventListener('languagechange', () => {
                this.update();
            });
        }

        onUnmount() {
            if (this.handleEscapeKey) {
                document.removeEventListener('keydown', this.handleEscapeKey);
            }
        }

        // ────────────────────────────────── RENDER ─────────────────────────────────

        render() {
            if (this.popups.length === 0) {
                return createElement('div', { className: bb_.container });
            }

            return createElement('div', { className: bb_.container },
                ...this.popups.map(popup => this.renderPopup(popup))
            );
        }

        renderPopup(popup: ActivePopup) {
            const sizeClass = `bb_popup--${popup.size || 'medium'}`;
            const variantClass = popup.variant ? `bb_popup--${popup.variant}` : '';

            return createElement('div', {
                key: String(popup.id),
                className: bb_.overlay,
                'data-popup-id': popup.id,
                onClick: (e: Event) => {
                    if ((e.target as HTMLElement).classList.contains(bb_.overlay) &&
                        popup.closeOnOverlay !== false) {
                        this.closePopup(popup.id, false);
                    }
                }
            },
                createElement('div', {
                    className: `${bb_.popup.base} ${sizeClass} ${variantClass}`,
                    role: 'dialog',
                    'aria-modal': 'true',
                    'aria-labelledby': `popup-title-${popup.id}`
                },
                    // Close button
                    popup.showCloseButton !== false ? createElement('button', {
                        className: bb_.popup.close,
                        onClick: () => this.closePopup(popup.id, false),
                        'aria-label': 'Close'
                    },
                        createElement('i', { className: 'fas fa-times' })
                    ) : null,

                    // Header
                    createElement('div', { className: bb_.header.container },
                        popup.icon ? createElement('div', { className: bb_.header.icon },
                            createElement('i', { className: popup.icon })
                        ) : null,
                        createElement('div', { className: bb_.header.content },
                            createElement('h2', {
                                id: `popup-title-${popup.id}`,
                                className: bb_.header.title,
                                'data-translate': popup.titleTranslateKey
                            },
                                popup.titleTranslateKey ? t(popup.titleTranslateKey) : popup.title
                            ),
                            popup.description ? createElement('p', {
                                className: bb_.header.description,
                                'data-translate': popup.descriptionTranslateKey
                            },
                                popup.descriptionTranslateKey ? t(popup.descriptionTranslateKey) : popup.description
                            ) : null
                        )
                    ),

                    // Body
                    createElement('div', { className: bb_.body.container },
                        popup.message ? createElement('p', {
                            className: bb_.body.message,
                            'data-translate': popup.messageTranslateKey
                        },
                            popup.messageTranslateKey ? t(popup.messageTranslateKey) : popup.message
                        ) : null,

                        // Prompt input
                        popup.type === 'prompt' ? createElement('input', {
                            type: 'text',
                            className: bb_.body.input,
                            value: popup.inputValue || '',
                            placeholder: t('popup.prompt.placeholder'),
                            'data-translate': 'popup.prompt.placeholder',
                            onInput: (e: Event) => {
                                popup.inputValue = (e.target as HTMLInputElement).value;
                            }
                        }) : null,

                        // Form rendering
                        popup.type === 'form' && popup.formConfig ? createElement('div', {
                            className: bb_.body.formContainer
                        },
                            SmartForm(popup.formConfig)
                        ) : null,

                        // Custom content
                        popup.customContent || null
                    ),

                    // Footer with buttons
                    popup.buttons && popup.buttons.length > 0 && popup.type !== 'form' ? createElement('div', {
                        className: bb_.footer
                    },
                        ...popup.buttons.map(button => createElement('button', {
                            className: `${bb_.button} ${button.variant || 'secondary'}`,
                            'data-translate': button.translateKey,
                            disabled: button.loading || popup.isSubmitting,
                            onClick: async () => {
                                if (button.loading || popup.isSubmitting) return;
                                await button.onClick();
                            }
                        },
                            button.icon ? createElement('i', { className: button.icon }) : null,
                            button.loading || popup.isSubmitting ?
                                createElement('i', { className: 'fas fa-spinner fa-spin' }) : null,
                            ' ',
                            button.translateKey ? t(button.translateKey) : button.label
                        ))
                    ) : null
                )
            );
        }

        // ────────────────────────────────── PUBLIC API ─────────────────────────────

        /**
         * Show a custom popup
         */
        show(options: PopupOptions): Promise<boolean | string | null | unknown> {
            return new Promise((resolve) => {
                const id = this.nextId++;

                const popup: ActivePopup = {
                    ...options,
                    id,
                    resolve,
                    type: options.type || 'custom',
                    size: options.size || 'medium',
                    closeOnOverlay: options.closeOnOverlay !== false,
                    closeOnEscape: options.closeOnEscape !== false,
                    showCloseButton: options.showCloseButton !== false,
                    isSubmitting: false
                };

                this.popups = [...this.popups, popup];
                this.applyBodyLock();
                this.update();
            });
        }

        /**
         * Show a form popup
         */
        showForm(options: PopupFormOptions): Promise<unknown> {
            return new Promise((resolve, _reject) => {
                const id = this.nextId++;

                // Wrap the form config to handle submission
                const wrappedFormConfig: FormConfig = {
                    ...options.formConfig,
                    onSubmit: async (data) => {
                        const popup = this.popups.find(p => p.id === id);
                        if (popup) {
                            popup.isSubmitting = true;
                            this.update();
                        }

                        try {
                            // Call original onSubmit
                            if (options.formConfig.onSubmit) {
                                await options.formConfig.onSubmit(data, undefined as any);
                            }

                            this.closePopup(id, data);
                            resolve(data);
                        } catch (error) {
                            if (popup) {
                                popup.isSubmitting = false;
                                this.update();
                            }

                            // Don't close popup on error
                            if (options.formConfig.onError) {
                                options.formConfig.onError(error);
                            }
                        }
                    },
                    submitButton: {
                        ...options.formConfig.submitButton,
                        className: options.formConfig.submitButton?.className || `${bb_.button} primary wide`
                    }
                };

                const popup: ActivePopup = {
                    title: options.title,
                    titleTranslateKey: options.titleTranslateKey,
                    description: options.description,
                    descriptionTranslateKey: options.descriptionTranslateKey,
                    type: 'form',
                    variant: options.variant || 'default',
                    size: options.size || 'medium',
                    icon: options.icon,
                    formConfig: wrappedFormConfig,
                    closeOnOverlay: options.closeOnOverlay !== false,
                    closeOnEscape: options.closeOnEscape !== false,
                    showCloseButton: options.showCloseButton !== false,
                    id,
                    resolve,
                    isSubmitting: false
                };

                this.popups = [...this.popups, popup];
                this.applyBodyLock();
                this.update();
            });
        }

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
        }): Promise<boolean> {
            return new Promise((resolve) => {
                const id = this.nextId++;

                const popup: ActivePopup = {
                    id,
                    title: options.title,
                    titleTranslateKey: options.titleTranslateKey,
                    message: options.message,
                    messageTranslateKey: options.messageTranslateKey,
                    type: 'confirm',
                    variant: options.variant || 'default',
                    size: options.size || 'small',
                    icon: options.icon,
                    resolve: resolve as (value: boolean | string | unknown) => void,
                    onConfirm: options.onConfirm,
                    onCancel: options.onCancel,
                    buttons: [
                        {
                            label: options.cancelLabel || 'Cancel',
                            translateKey: options.cancelTranslateKey || 'button.cancel',
                            variant: 'secondary',
                            icon: 'fas fa-times',
                            onClick: async () => {
                                if (options.onCancel) {
                                    await options.onCancel();
                                }
                                this.closePopup(id, false);
                            }
                        },
                        {
                            label: options.confirmLabel || 'Confirm',
                            translateKey: options.confirmTranslateKey || 'button.confirm',
                            variant: options.variant === 'danger' ? 'danger' : 'primary',
                            icon: 'fas fa-check',
                            onClick: async () => {
                                if (options.onConfirm) {
                                    await options.onConfirm();
                                }
                                this.closePopup(id, true);
                            }
                        }
                    ]
                };

                this.popups = [...this.popups, popup];
                this.applyBodyLock();
                this.update();
            });
        }

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
        }): Promise<boolean> {
            return new Promise((resolve) => {
                const id = this.nextId++;

                const popup: ActivePopup = {
                    id,
                    title: options.title,
                    titleTranslateKey: options.titleTranslateKey,
                    message: options.message,
                    messageTranslateKey: options.messageTranslateKey,
                    type: 'alert',
                    variant: options.variant || 'info',
                    size: options.size || 'small',
                    icon: options.icon,
                    resolve: resolve as (value: boolean | string | unknown) => void,
                    onConfirm: options.onConfirm,
                    buttons: [
                        {
                            label: options.okLabel || 'OK',
                            translateKey: options.okTranslateKey || 'popup.ok',
                            variant: 'primary',
                            icon: 'fas fa-check',
                            onClick: async () => {
                                if (options.onConfirm) {
                                    await options.onConfirm();
                                }
                                this.closePopup(id, true);
                            }
                        }
                    ]
                };

                this.popups = [...this.popups, popup];
                this.applyBodyLock();
                this.update();
            });
        }

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
        }): Promise<string | null> {
            return new Promise((resolve) => {
                const id = this.nextId++;

                const popup: ActivePopup = {
                    id,
                    title: options.title,
                    titleTranslateKey: options.titleTranslateKey,
                    message: options.message,
                    messageTranslateKey: options.messageTranslateKey,
                    type: 'prompt',
                    variant: 'default',
                    icon: options.icon,
                    inputValue: options.defaultValue || '',
                    resolve: resolve as (value: boolean | string | unknown) => void,
                    onConfirm: options.onConfirm as (() => void | Promise<void>) | undefined,
                    onCancel: options.onCancel,
                    buttons: [
                        {
                            label: options.cancelLabel || 'Cancel',
                            translateKey: options.cancelTranslateKey || 'popup.cancel',
                            variant: 'secondary',
                            onClick: async () => {
                                if (options.onCancel) {
                                    await options.onCancel();
                                }
                                this.closePopup(id, null);
                            }
                        },
                        {
                            label: options.confirmLabel || 'OK',
                            translateKey: options.confirmTranslateKey || 'popup.ok',
                            variant: 'primary',
                            onClick: async () => {
                                const value = popup.inputValue || '';
                                if (options.onConfirm) {
                                    await options.onConfirm(value);
                                }
                                this.closePopup(id, value);
                            }
                        }
                    ]
                };

                this.popups = [...this.popups, popup];
                this.applyBodyLock();
            });
        }

        /**
         * Close a specific popup
         */
        closePopup(id: number, result: boolean | string | null | any) {
            const popup = this.popups.find(p => p.id === id);
            if (popup?.resolve) {
                popup.resolve(result);
            }

            this.popups = this.popups.filter(p => p.id !== id);

            if (this.popups.length === 0) {
                this.removeBodyLock();
            }

            this.update();
        }

        /**
         * Close all popups
         */
        closeAll() {
            this.popups.forEach(popup => {
                if (popup.resolve) {
                    popup.resolve(false);
                }
            });
            this.popups = [];
            this.removeBodyLock();
            this.update();
        }

        // ────────────────────────────────── HELPERS ────────────────────────────────

        private applyBodyLock() {
            document.body.style.overflow = 'hidden';
        }

        private removeBodyLock() {
            document.body.style.overflow = '';
        }

        private setupKeyboardListener() {
            this.handleEscapeKey = (e: KeyboardEvent) => {
                if (e.key === 'Escape' && this.popups.length > 0) {
                    const lastPopup = this.popups[this.popups.length - 1];
                    if (lastPopup.closeOnEscape !== false) {
                        this.closePopup(lastPopup.id, false);
                    }
                }
            };
            document.addEventListener('keydown', this.handleEscapeKey);
        }
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ GLOBAL ══════════════════════════════════════╗

    let globalPopup: Popup | null = null;

    export function initPopup(container?: HTMLElement): Popup {
        if (globalPopup) return globalPopup;

        const popupContainer = container || document.createElement('div');
        if (!container) {
            document.body.appendChild(popupContainer);
        }

        globalPopup = new Popup();
        globalPopup.mount(popupContainer);

        return globalPopup;
    }

    export function getPopup(): Popup {
        if (!globalPopup) {
            globalPopup = initPopup();
        }
        return globalPopup;
    }

    // Convenience exports
    export const popup = {
        show: (options: PopupOptions) => getPopup().show(options),

        confirm: (options: Parameters<Popup['confirm']>[0]) =>
            getPopup().confirm(options),

        alert: (options: Parameters<Popup['alert']>[0]) =>
            getPopup().alert(options),

        prompt: (options: {
            title: string;
            titleTranslateKey?: string;
            message: string;
            icon?: string;
            messageTranslateKey?: string;
            onConfirm?: () => void | Promise<void>;
        }) => getPopup().prompt(options),

        showForm: (options: PopupFormOptions) =>
            getPopup().showForm(options),

        closePopup: (id: number, result: boolean | string | null | any) =>
            getPopup().closePopup(id, result),

        closeLastPopup: () => getPopup().closePopup(getPopup().popups.length - 1, false),

        closeFirstPopup: () => getPopup().closePopup(0, false),

        closeAll: () => getPopup().closeAll()
    };

// ╚══════════════════════════════════════════════════════════════════════════════════════╝