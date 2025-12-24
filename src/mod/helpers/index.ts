// src/mod/helpers/index.ts
//
// Made with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import { div, span, h1, h2, h3, h4, h5, h6, p, i, img, a, button, input, select, option, textarea, form } from "@je-es/vdom";
    import type { VNode } from "@je-es/vdom";
    import { getDefaultFATheme } from '../services/fa_config';
import { Popup } from "../components/popup";
import { Toast } from "../components/toast";
import { Loader } from "../components/loader";

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ _CM_ ════════════════════════════════════════╗

    export const ClassMaker = {
        /**
         * Generate Font Awesome icon classes
         * @param icon Icon name (without 'fa-' prefix)
         * @param style Font Awesome style (default: global default theme or 'solid')
         */
        fa: (icon: string, style?: 'solid' | 'regular' | 'light' | 'thin' | 'duotone' | 'brands' | 'sharp-solid' | 'sharp-regular' | 'sharp-light' | 'sharp-thin' | 'sharp-duotone-solid' | 'sharp-duotone-regular' | 'sharp-duotone-light' | 'sharp-duotone-thin' | 'notdog' | 'notdog-duo' | 'jelly' | 'jelly-fill' | 'jelly-duo' | 'chisel' | 'etch' | 'slab' | 'slab-press' | 'thumbprint' | 'utility' | 'utility-fill' | 'utility-duo' | 'whiteboard'): string => {
            const base = 'bb_icon';

            // if contains fa- return as it
            if(icon.includes('fa-')) return base + ' ' + icon;

            // Use provided style or fall back to default theme
            const resolvedStyle = style || getDefaultFATheme();

            const styleMap: Record<string, string> = {
                'solid': 'fas',
                'regular': 'far',
                'light': 'fal',
                'thin': 'fat',
                'duotone': 'fad',
                'brands': 'fab',

                // Sharp styles
                'sharp-solid': 'fass',
                'sharp-regular': 'fasr',
                'sharp-light': 'fasl',
                'sharp-thin': 'fast',

                // Sharp Duotone styles
                'sharp-duotone-solid': 'fasds',
                'sharp-duotone-regular': 'fasdr',
                'sharp-duotone-light': 'fasdl',
                'sharp-duotone-thin': 'fasdt',

                // Special styles
                'notdog': 'fa-notdog',
                'notdog-duo': 'fa-notdog-duo',
                'jelly': 'fa-jelly',
                'jelly-fill': 'fa-jelly-fill',
                'jelly-duo': 'fa-jelly-duo',
                'chisel': 'fa-chisel',
                'etch': 'fa-etch',
                'slab': 'fa-slab',
                'slab-press': 'fa-slab-press',
                'thumbprint': 'fa-thumbprint',
                'utility': 'fa-utility',
                'utility-fill': 'fa-utility-fill',
                'utility-duo': 'fa-utility-duo',
                'whiteboard': 'fa-whiteboard'
            };

            const prefix = styleMap[resolvedStyle] || 'fas';
            return `${base} ${prefix} fa-${icon}`;
        },

        /**
         * Generate button classes
         * @param level Button level (primary, secondary, tertiary)
         * @param className Additional classes
         */
        btn: (level: 'primary' | 'secondary' | 'tertiary', className = ''): string => {
            const baseClass = 'bb_btn';
            const levelClass = `bb_btn_${level}`;
            return `${baseClass} ${levelClass} ${className}`.trim();
        },
    };

    export const CM = ClassMaker;

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ _EC_ ════════════════════════════════════════╗

    export const ElementCreator = {
        div,
        span,
        h1,
        h2,
        h3,
        h4,
        h5,
        h6,
        p,
        i,
        img,
        a,
        button,
        input,
        select,
        option,
        textarea,
        form,

        /**
         * Create icon element with Font Awesome classes
         * @param icon Icon name (without 'fa-' prefix)
         * @param style Font Awesome style (default: 'solid')
         */
        icon: (icon: string, style?: 'solid' | 'regular' | 'light' | 'thin' | 'duotone' | 'brands' | 'sharp-solid' | 'sharp-regular' | 'sharp-light' | 'sharp-thin' | 'sharp-duotone-solid' | 'sharp-duotone-regular' | 'sharp-duotone-light' | 'sharp-duotone-thin' | 'notdog' | 'notdog-duo' | 'jelly' | 'jelly-fill' | 'jelly-duo' | 'chisel' | 'etch' | 'slab' | 'slab-press' | 'thumbprint' | 'utility' | 'utility-fill' | 'utility-duo' | 'whiteboard'): VNode => {
            return i(ClassMaker.fa(icon, style)) as VNode;
        },

        /**
         * Create button element
         */
        btn: (args: {
            label               : string;
            onClick?            : () => void | Promise<void>;
            className?          : string;
            icon?               : string;
            iconStyle?          : 'solid' | 'regular' | 'light' | 'thin' | 'duotone' | 'brands' | 'sharp-solid' | 'sharp-regular' | 'sharp-light' | 'sharp-thin' | 'sharp-duotone-solid' | 'sharp-duotone-regular' | 'sharp-duotone-light' | 'sharp-duotone-thin' | 'notdog' | 'notdog-duo' | 'jelly' | 'jelly-fill' | 'jelly-duo' | 'chisel' | 'etch' | 'slab' | 'slab-press' | 'thumbprint' | 'utility' | 'utility-fill' | 'utility-duo' | 'whiteboard';
            level?              : 'primary' | 'secondary' | 'tertiary';
            disabled?           : boolean;
        }): VNode => {
            return button(
                {
                    class       : ClassMaker.btn(args.level || 'secondary', args.className),
                    onclick     : args.onClick,
                    disabled    : args.disabled
                },
                args.icon ? ElementCreator.icon(args.icon, args.iconStyle) : null,
                args.label
            ) as VNode;
        },
    };

    export const EC = ElementCreator;

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ _DOM ════════════════════════════════════════╗

    // EventsManager - manages all window event listeners with automatic cleanup
    class EventsManager {
        private _handlers: Map<string, Set<EventListener>>;

        constructor() {
            this._handlers = new Map<string, Set<EventListener>>();
        }

        add(event: string, listener: EventListener): void {
            if (!this._handlers.has(event)) {
                this._handlers.set(event, new Set());
            }
            this._handlers.get(event)!.add(listener);
            window.addEventListener(event, listener);
        }

        remove(event: string, listener: EventListener): void {
            window.removeEventListener(event, listener);
            this._handlers.get(event)?.delete(listener);
        }

        removeAll(event?: string): void {
            if (event) {
                const listeners = this._handlers.get(event);
                if (listeners) {
                    listeners.forEach(listener => window.removeEventListener(event, listener));
                    this._handlers.delete(event);
                }
            } else {
                // Remove all listeners for all events
                this._handlers.forEach((listeners, eventName) => {
                    listeners.forEach(listener => window.removeEventListener(eventName, listener));
                });
                this._handlers.clear();
            }
        }

        get(event: string): Set<EventListener> | undefined {
            return this._handlers.get(event);
        }

        has(event: string): boolean {
            return this._handlers.has(event);
        }

        count(event?: string): number {
            if (event) {
                return this._handlers.get(event)?.size ?? 0;
            }
            return Array.from(this._handlers.values()).reduce((sum, set) => sum + set.size, 0);
        }
    }

    // @je-es/client components
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    export function getToast() : Toast { return (window as any).__globalToast; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    export function getPopup() : Popup { return (window as any).__globalPopup; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    export function getLoader() : Loader { return (window as any).__globalLoader; }
    export function hideLoader() { getLoader().hide(); }
    export function showLoader(message?:string) { getLoader().show(message); }

    // browser `window` helpers
    export const Window = {

        // Event management system
        Events: new EventsManager(),

        toast: getToast,
        popup: getPopup,
        loader: getLoader,
        showLoader: showLoader,
        hideLoader: hideLoader,

        reload: () => {
            window.location.reload();
        },

        getPathName: (): string => {
            return window.location.pathname;
        },

        setAttributes: (key: string, value: string) => {
            document.documentElement.setAttribute(key, value);
        },

        getAttributes: (key: string): string | null => {
            return document.documentElement.getAttribute(key);
        },

        setLocalStorage: (key: string, value: string) => {
            localStorage.setItem(key, value);
        },

        getLocalStorage: (key: string): string | null => {
            return localStorage.getItem(key);
        },

        addEventListener: (event: string, listener: EventListener) => {
            Window.Events.add(event, listener);
        },

        removeEventListener: (event: string, listener: EventListener) => {
            Window.Events.remove(event, listener);
        },

        dispatchEvent: (event: CustomEvent) => {
            window.dispatchEvent(event);
        },

        onScroll: (callback: () => void) => {
            Window.Events.add('scroll', callback as EventListener);
        },

        getScrollY: (): number => {
            return window.pageYOffset;
        },
    };

// ╚══════════════════════════════════════════════════════════════════════════════════════╝
