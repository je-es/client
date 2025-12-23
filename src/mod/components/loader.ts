// src/mod/components/loader.ts
//
// Made with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import { Component } from "../core/component";
    import { div, type VNode } from "@je-es/vdom";
    import { state } from "../core/decorators";
    import { t } from "../services/i18n";
    import styleMap from "./bb_map.json";

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ INIT ════════════════════════════════════════╗

    export type LoaderSize          = 'small' | 'medium' | 'large';
    export type LoaderVariant       = 'spinner' | 'dots' | 'pulse';

    export interface LoaderOptions {
        message?                    : string;
        variant?                    : LoaderVariant;
        size?                       : LoaderSize;
        overlay?                    : boolean;
    }

    // Reference to style map
    const bb_ = styleMap.loader;

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

    export class Loader extends Component {

        // ┌──────────────────────────────── INIT ──────────────────────────────┐

            // @ts-expect-error - TypeScript decorator limitation with class property types
            @state visible          = false;
            // @ts-expect-error - TypeScript decorator limitation with class property types
            @state message          = '';
            // @ts-expect-error - TypeScript decorator limitation with class property types
            @state variant          : LoaderVariant = 'spinner';
            // @ts-expect-error - TypeScript decorator limitation with class property types
            @state size             : LoaderSize = 'medium';
            // @ts-expect-error - TypeScript decorator limitation with class property types
            @state overlay          = true;
            // @ts-expect-error - TypeScript decorator limitation with class property types
            @state progress         = 0;
            // @ts-expect-error - TypeScript decorator limitation with class property types
            @state showProgress     = false;

            private animationFrame  : number | null = null;
            private hideTimeout     : number | null = null;

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── MAIN ──────────────────────────────┐

            async onMount() {
                this.setupKeyboardListener();
                this.initializeAccessibility();

                window.addEventListener('languagechange', () => {
                    if (!this.message) {
                        this.update();
                    }
                });
            }

            onUnmount() {
                if (this.animationFrame) {
                    cancelAnimationFrame(this.animationFrame);
                }
                if (this.hideTimeout) {
                    clearTimeout(this.hideTimeout);
                }
                document.removeEventListener('keydown', this.handleKeyPress);
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── ──── ──────────────────────────────┐

            render(): VNode {
                const { loader: bb_ } = styleMap;
                const containerClasses = [
                    bb_.container,
                    this.overlay ? `${bb_.containerOverlay}` : '',
                    `${bb_.container}--${this.size}`
                ].filter(Boolean).join(' ');

                return div(
                    {
                        class: containerClasses,
                        'data-status': this.visible ? 'visible' : 'hidden',
                        role: 'status',
                        'aria-live': 'polite',
                        'aria-busy': 'true',
                    },
                    // bg for blur
                    div(bb_.bg),

                    div(
                        bb_.loader,
                        this.renderSpinner(),
                        this.renderMessage(),
                        this.showProgress ? this.renderProgressBar() : null
                    )
                ) as VNode;
            }

            renderSpinner(): VNode {
                const { loader: bb_ } = styleMap;
                const spinnerClass = `${bb_.spinner.container} ${bb_.spinner.container}--${this.variant}`;

                switch (this.variant) {
                    case 'dots':
                        return div(
                            spinnerClass,
                            div(bb_.spinner.dot),
                            div(bb_.spinner.dot),
                            div(bb_.spinner.dot)
                        ) as VNode;

                    case 'pulse':
                        return div(
                            spinnerClass,
                            div(bb_.spinner.pulse)
                        ) as VNode;

                    case 'spinner':
                    default:
                        return div(
                            spinnerClass,
                            div(bb_.spinner.icon)
                        ) as VNode;
                }
            }

            renderMessage(): VNode {
                const { loader: bb_ } = styleMap;
                const text = this.message || t('loader.loading');

                return div({
                    class: bb_.spinner.text,
                    'data-translate': this.message ? undefined : 'loader.loading'
                }, text) as VNode;
            }

            renderProgressBar(): VNode {
                const { loader: bb_ } = styleMap;
                return div(
                    bb_.progress.container,
                    div({
                        class: bb_.progress.bar,
                        style: `width: ${this.progress}%`,
                        'aria-valuenow': this.progress.toString(),
                        'aria-valuemin': '0',
                        'aria-valuemax': '100'
                    }),
                    div(
                        bb_.progress.text,
                        `${Math.round(this.progress)}%`
                    )
                ) as VNode;
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── CTRL ──────────────────────────────┐

            show(options?: LoaderOptions | string) {
                if (typeof options === 'string') {
                    this.message = options;
                } else if (options) {
                    this.message = options.message || '';
                    this.variant = options.variant || 'spinner';
                    this.size = options.size || 'medium';
                    this.overlay = options.overlay !== undefined ? options.overlay : true;
                }

                this.visible = true;
                this.progress = 0;
                this.showProgress = false;

                this.applyBodyLock();
                this.update();
            }

            hide(delay: number = 0) {
                if (this.hideTimeout) {
                    clearTimeout(this.hideTimeout);
                }

                if (delay > 0) {
                    this.hideTimeout = window.setTimeout(() => {
                        this.performHide();
                    }, delay);
                } else {
                    this.performHide();
                }
            }

            setMessage(message: string) {
                this.message = message;
                this.update();
            }

            setProgress(progress: number) {
                this.showProgress = true;
                this.progress = Math.max(0, Math.min(100, progress));
                this.update();
            }

            updateProgress(increment: number) {
                this.setProgress(this.progress + increment);
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── HELP ──────────────────────────────┐

            private performHide() {
                this.visible = false;
                this.message = '';
                this.progress = 0;
                this.showProgress = false;

                this.removeBodyLock();
                this.update();
            }

            private applyBodyLock() {
                if (this.overlay) {
                    document.body.style.overflow = 'hidden';
                }
            }

            private removeBodyLock() {
                document.body.style.overflow = '';
            }

            private setupKeyboardListener() {
                this.handleKeyPress = this.handleKeyPress.bind(this);
                document.addEventListener('keydown', this.handleKeyPress);
            }

            private handleKeyPress = (e: KeyboardEvent) => {
                if (e.key === 'Escape' && this.visible && !this.overlay) {
                    this.hide();
                }
            };

            private initializeAccessibility() {
                const container = this.element?.querySelector(`.${bb_.spinner.container}`);
                if (container) {
                    container.setAttribute('aria-label', t('loading'));
                }
            }

            isVisible(): boolean {
                return this.visible;
            }

            getStatus(): { visible: boolean; message: string; progress: number } {
                return {
                    visible: this.visible,
                    message: this.message,
                    progress: this.progress
                };
            }

        // └────────────────────────────────────────────────────────────────────┘

    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝