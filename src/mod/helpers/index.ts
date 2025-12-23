// src/mod/helpers/index.ts
//
// Made with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import { div, span, h1, h2, h3, h4, h5, h6, p, i, img, a, button, input, select, option, textarea, form } from "@je-es/vdom";
    import type { VNode } from "@je-es/vdom";

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ _CM_ ════════════════════════════════════════╗

    export const ClassMaker = {
        /**
         * Generate Font Awesome icon classes
         * @param icon Icon name (without 'fa-' prefix)
         * @param style Font Awesome style (default: 'solid')
         */
        fa: (icon: string, style: 'solid' | 'regular' | 'light' | 'thin' | 'duotone' | 'brands' | 'sharp-solid' | 'sharp-regular' | 'sharp-light' | 'sharp-thin' | 'sharp-duotone-solid' | 'sharp-duotone-regular' | 'sharp-duotone-light' | 'sharp-duotone-thin' | 'notdog' | 'notdog-duo' | 'jelly' | 'jelly-fill' | 'jelly-duo' | 'chisel' | 'etch' | 'slab' | 'slab-press' | 'thumbprint' | 'utility' | 'utility-fill' | 'utility-duo' | 'whiteboard' = 'solid'): string => {
            const base = 'bb_icon';

            // if contains fa- return as it
            if(icon.includes('fa-')) return base + ' ' + icon;

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

            const prefix = styleMap[style] || 'fas';
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
