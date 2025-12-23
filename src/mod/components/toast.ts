// src/mod/components/toast.ts
//
// Made with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import { Component } from '../core/component';
    import { div, html, i, span } from '@je-es/vdom';
    import { ClassMaker } from '../helpers';
    import { state } from '../core/decorators';
    import { t } from '../services/i18n';
    import type { VNode } from '../../types';
    import styleMap from './bb_map.json';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ INIT ════════════════════════════════════════╗

    export type ToastType = 'success' | 'error' | 'info' | 'warning';

    export interface ToastMessage {
        id: number;
        message: string;
        type: ToastType;
        translateKey?: string;
    }

    // Reference to style map
    const bb_ = styleMap.toast;

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
                    this.messages = this.messages.filter(msg => msg.id !== id);
                    this.update();
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

            render(): VNode {
                if (this.messages.length === 0) return html``;

                return div(
                    bb_.container,
                    ...this.messages.map(msg => this.renderToast(msg))
                ) as VNode;
            }

            renderToast(msg: ToastMessage): VNode {
                const iconMap = {
                    success: ClassMaker.fa('check-circle'),
                    error: ClassMaker.fa('exclamation-circle'),
                    info: ClassMaker.fa('info-circle'),
                    warning: ClassMaker.fa('exclamation-triangle')
                };

                const displayMessage = msg.translateKey ? t(msg.translateKey) : msg.message;

                return div(
                    {
                        key: String(msg.id),
                        class: `${bb_.toast} ${bb_.toast}--${msg.type}`,
                        'data-translate': msg.translateKey || undefined
                    },
                    i(`${iconMap[msg.type]} ${bb_.icon}`),
                    span(bb_.msg, displayMessage)
                ) as VNode;
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