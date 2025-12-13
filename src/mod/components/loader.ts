// src/mod/components/loader.ts
//
// Made with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import { createElement } from "@je-es/vdom";
    import { Component } from "../core/component";
    import { state } from "../core/decorators";
    import { t } from "../services/i18n";

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ INIT ════════════════════════════════════════╗

    export type LoaderSize = 'small' | 'medium' | 'large';
    export type LoaderVariant = 'spinner' | 'dots' | 'pulse';

    export interface LoaderOptions {
        message?: string;
        variant?: LoaderVariant;
        size?: LoaderSize;
        overlay?: boolean;
    }

    // Blah Blah Style Map
    const bb_ = {
        loader: {
            container: 'bb_loaderContainer',
            containerOverlay: 'bb_loaderContainer--overlay',
            bg: 'bb_loaderBg',
            loader: 'bb_loader',
        },

        spinner: {
            container: 'bb_loaderSpinnerContainer',
            icon: 'bb_loaderSpinnerIcon',
            dot: 'bb_loaderSpinnerDot',
            pulse: 'bb_loaderSpinnerPulse',
            text: 'bb_loaderSpinnerText',
        },

        progress: {
            container: 'bb_loaderProgressContainer',
            bar: 'bb_loaderProgressBar',
            text: 'bb_loaderProgressText',
        }
    };

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


        // ┌────────────────────────────────  UI  ──────────────────────────────┐

            render() {
                const containerClasses = [
                    bb_.loader.container,
                    this.overlay ? `${bb_.loader.containerOverlay}` : '',
                    `${bb_.loader.container}--${this.size}`
                ].filter(Boolean).join(' ');

                return createElement('div', {
                    className: containerClasses,
                    'data-status': this.visible ? 'visible' : 'hidden',
                    role: 'status',
                    'aria-live': 'polite',
                    'aria-busy': 'true',
                },
                    // bg for blur
                    createElement('div', { className: bb_.loader.bg }),

                    createElement('div', { className: bb_.loader.loader },
                        this.renderSpinner(),
                        this.renderMessage(),
                        this.showProgress ? this.renderProgressBar() : null
                    )
                );
            }

            renderSpinner() {
                const spinnerClass = `${bb_.spinner.container} ${bb_.spinner.container}--${this.variant}`;

                switch (this.variant) {
                    case 'dots':
                        return createElement('div', { className: spinnerClass },
                            createElement('div', { className: bb_.spinner.dot }),
                            createElement('div', { className: bb_.spinner.dot }),
                            createElement('div', { className: bb_.spinner.dot })
                        );

                    case 'pulse':
                        return createElement('div', { className: spinnerClass },
                            createElement('div', { className: bb_.spinner.pulse })
                        );

                    case 'spinner':
                    default:
                        return createElement('div', { className: spinnerClass },
                            createElement('div', { className: bb_.spinner.icon })
                        );
                }
            }

            renderMessage() {
                const text = this.message || t('global.loading');

                return createElement('div', {
                    className: bb_.spinner.text,
                    'data-translate': this.message ? undefined : 'global.loading'
                }, text);
            }

            renderProgressBar() {
                return createElement('div', { className: bb_.progress.container },
                    createElement('div', {
                        className: bb_.progress.bar,
                        style: `width: ${this.progress}%`,
                        'aria-valuenow': this.progress.toString(),
                        'aria-valuemin': '0',
                        'aria-valuemax': '100'
                    }),
                    createElement('div', { className: bb_.progress.text },
                        `${Math.round(this.progress)}%`
                    )
                );
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