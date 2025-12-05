// src/mod/core/client.ts
//
// Made with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import type { ClientConfig }                    from '../../types';
    import type { ApiConfig as CapiConfigType }     from '@je-es/capi';
    import { router }                               from './router';
    import { configureApi }                         from '@je-es/capi';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TYPE ════════════════════════════════════════╗

    export type { ClientConfig };

    // Bun build types
    interface BunBuildOptions {
        entrypoints: string[];
        outdir: string;
        target: string;
        minify?: boolean;
        sourcemap?: 'none' | 'external' | 'inline';
        splitting?: boolean;
        naming?: { entry?: string };
    }

    interface BunBuildResult {
        success: boolean;
        logs: {
            message: string;
            level: 'error' | 'warning' | 'info';
        }[];
    }

    declare const Bun: {
        build(options: BunBuildOptions): Promise<BunBuildResult>;
    };

    // Window type extension for dev tools
    declare global {
        interface Window {
            __JEES_DEV__?: {
                router: typeof router;
                config: ClientConfig;
                version: string;
            };
        }
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

    /**
     * Client builder
     * Handles build process and runtime configuration
     */
    export function client(config: ClientConfig) {
        // Store configuration
        const _config = config;

        return {
            /**
             * Build the client application
             * This compiles TypeScript components to vanilla JavaScript
             */
            async build(): Promise<void> {
                if (!_config.build) {
                    console.warn('No build configuration provided');
                    return;
                }

                // console.log('🔨 Building @je-es/client application...');

                try {
                    // Use Bun's bundler
                    const result = await Bun.build({
                        entrypoints     : [_config.build.entry],
                        outdir          : _config.build.output.substring(0, _config.build.output.lastIndexOf('/')),
                        target          : 'browser',
                        minify          : false,
                        sourcemap       : _config.build.sourcemap ? 'external' : 'none',
                        splitting       : _config.build.optimization?.splitChunks ?? false,
                        naming          : {
                            entry       : _config.build.output.substring(_config.build.output.lastIndexOf('/') + 1),
                        },
                    });

                    if (!result.success) {
                        console.error('❌ Build failed:', result.logs);
                        throw new Error('Build failed');
                    }

                    // console.log('✅ Build completed successfully!');
                    // console.log(`📦 Output: ${_config.build.output}`);

                } catch (error) {
                    console.error('❌ Build error:', error);
                    throw error;
                }
            },

            /**
             * Initialize the client runtime
             * This runs in the browser
             */
            init(): void {
                // console.log('🚀 Initializing @je-es/client...');

                // Configure API client
                if (_config.api) {
                    // Build the capi-compatible config
                    const capiConfig: Partial<CapiConfigType> = {
                        baseURL: _config.api.baseURL,
                        timeout: _config.api.timeout,
                        headers: _config.api.headers,
                    };

                    // Add interceptors if they exist
                    if (_config.api.interceptors) {
                        capiConfig.interceptors = {
                            request: _config.api.interceptors.request || null,
                            response: _config.api.interceptors.response || null,
                            error: _config.api.interceptors.error || null,
                        };
                    }

                    configureApi(capiConfig);
                }

                // Configure router
                if (_config.router && _config.app?.routes) {
                    router.init(
                        _config.app.routes,
                        _config.router.mode,
                        _config.router.base
                    );

                    if (_config.router.beforeEach) {
                        router.beforeEach(_config.router.beforeEach);
                    }

                    if (_config.router.afterEach) {
                        router.afterEach(_config.router.afterEach);
                    }
                }

                // Mount root component
                if (_config.app?.root) {
                    const rootElement = document.querySelector(_config.app.root);
                    if (rootElement) {
                        // console.log('✅ Client initialized successfully!');
                    } else {
                        console.error(`❌ Root element "${_config.app.root}" not found`);
                    }
                }

                // Enable dev tools
                if (_config.devTools?.enabled) {
                    this._enableDevTools();
                }
            },

            /**
             * Enable development tools
             */
            _enableDevTools(): void {
                // console.log('🛠️ Dev tools enabled');

                // Add dev tools to window
                window.__JEES_DEV__ = {
                    router,
                    config: _config,
                    version: '0.0.1',
                };

                // // Log router changes
                // if (_config.devTools?.showRouterInfo) {
                //     router.afterEach((to: Route, from: Route) => {
                //         console.log('📍 Route changed:', {
                //             from: from.path,
                //             to: to.path,
                //             params: to.params,
                //             query: to.query,
                //         });
                //     });
                // }
            },

            /**
             * Get configuration
             */
            getConfig(): ClientConfig {
                return _config;
            },
        };
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝