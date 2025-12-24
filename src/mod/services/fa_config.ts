// src/mod/services/fa_config.ts
//
// Made with ❤️ by Maysara.



// ╔════════════════════════════════════════ TYPE ════════════════════════════════════════╗

    import type { FAConfig } from '../../types';

    type FATheme = 'solid' | 'regular' | 'light' | 'thin' | 'duotone' | 'brands' | 'sharp-solid' | 'sharp-regular' | 'sharp-light' | 'sharp-thin' | 'sharp-duotone-solid' | 'sharp-duotone-regular' | 'sharp-duotone-light' | 'sharp-duotone-thin' | 'notdog' | 'notdog-duo' | 'jelly' | 'jelly-fill' | 'jelly-duo' | 'chisel' | 'etch' | 'slab' | 'slab-press' | 'thumbprint' | 'utility' | 'utility-fill' | 'utility-duo' | 'whiteboard';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

    let defaultFATheme: FATheme = 'solid';

    /**
     * Get the default FontAwesome theme
     */
    export function getDefaultFATheme(): FATheme {
        return defaultFATheme;
    }

    /**
     * Set the default FontAwesome theme
     * @param theme The FontAwesome theme to use as default
     */
    export function setDefaultFATheme(theme: FATheme): void {
        defaultFATheme = theme;
    }

    /**
     * Initialize FontAwesome config from ClientConfig
     * @param faConfig The FA configuration from ClientConfig
     */
    export function initializeFAConfig(faConfig?: FAConfig): void {
        if (faConfig?.theme) {
            setDefaultFATheme(faConfig.theme);
        }
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝
