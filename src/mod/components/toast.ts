// src/mod/components/toast.ts
//
// Made with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import { createElement, html } from "@je-es/vdom";
    import { Component } from "../core/component";
    import { state } from "../core/decorators";
    import { t } from "../services/i18n";

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ INIT ════════════════════════════════════════╗

    export type ToastType = 'success' | 'error' | 'info' | 'warning';

    export interface ToastMessage {
        id: number;
        message: string;
        type: ToastType;
        translateKey?: string;
    }

    // Blah Blah Style Map
    const bb_ = {
        toast: 'bb_toast',
        container: 'bb_toastContainer',
        icon: 'bb_toastIcon',
        msg: 'bb_toastMsg'
    };

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

    export class Toast extends Component {

        // ┌──────────────────────────────── INIT ──────────────────────────────┐

            // @ts-expect-error - TypeScript decorator limitation with class property types
            @state messages: ToastMessage[] = [];

            private nextId = 0;

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── MAIN ──────────────────────────────┐

            /**
             * Show a toast notification
             */
            show(message: string, type: ToastType = 'info', duration: number = 2000, translateKey?: string) {
                const id = this.nextId++;

                this.messages = [...this.messages, { id, message, type, translateKey }];

                setTimeout(() => {
                    this.messages = this.messages.filter(m => m.id !== id);
                }, duration);
            }

            /**
             * Convenience methods
             */
            success(message: string, duration?: number, translateKey?: string) {
                this.show(message, 'success', duration, translateKey);
            }

            error(message: string, duration?: number, translateKey?: string) {
                this.show(message, 'error', duration, translateKey);
            }

            info(message: string, duration?: number, translateKey?: string) {
                this.show(message, 'info', duration, translateKey);
            }

            warning(message: string, duration?: number, translateKey?: string) {
                this.show(message, 'warning', duration, translateKey);
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── ──── ──────────────────────────────┐

            render() {
                if (this.messages.length === 0) return html``;

                return createElement('div', {
                    className: bb_.container
                },
                    ...this.messages.map(msg => this.renderToast(msg))
                );
            }

            renderToast(msg: ToastMessage) {
                const icons = {
                    success: 'fas fa-check-circle',
                    error: 'fas fa-exclamation-circle',
                    info: 'fas fa-info-circle',
                    warning: 'fas fa-exclamation-triangle'
                };

                const displayMessage = msg.translateKey ? t(msg.translateKey) : msg.message;

                return createElement('div', {
                    key: String(msg.id),
                    className: `${bb_.toast} ${bb_.toast}--${msg.type}`,
                    'data-translate': msg.translateKey || undefined
                },
                    createElement('i', {
                        className: `${icons[msg.type]} ${bb_.icon}`
                    }),
                    createElement('span', {
                        className: bb_.msg
                    }, displayMessage)
                );
            }

        // └────────────────────────────────────────────────────────────────────┘

    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ GLOB ════════════════════════════════════════╗

    let globalToast: Toast | null = null;

    export function initToast(container?: HTMLElement): Toast {
        if (globalToast) return globalToast;

        const toastContainer = container || document.createElement('div');
        if (!container) {
            document.body.appendChild(toastContainer);
        }

        globalToast = new Toast();
        globalToast.mount(toastContainer);

        return globalToast;
    }

    export function getToast(): Toast {
        if (!globalToast) {
            globalToast = initToast();
        }
        return globalToast;
    }

    // Convenience exports
    export const toast = {
        show: (message: string, type: ToastType = 'info', duration?: number, translateKey?: string) => {
            getToast().show(message, type, duration, translateKey);
        },
        success: (message: string, duration?: number, translateKey?: string) => {
            getToast().success(message, duration, translateKey);
        },
        error: (message: string, duration?: number, translateKey?: string) => {
            getToast().error(message, duration, translateKey);
        },
        info: (message: string, duration?: number, translateKey?: string) => {
            getToast().info(message, duration, translateKey);
        },
        warning: (message: string, duration?: number, translateKey?: string) => {
            getToast().warning(message, duration, translateKey);
        }
    };

// ╚══════════════════════════════════════════════════════════════════════════════════════╝