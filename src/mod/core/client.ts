// src/mod/core/client.ts
//
// Made with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import type { ClientConfig }                    from '../../types';
    import type { ApiConfig as CapiConfigType }     from '@je-es/capi';
    import { router }                               from './router';
    import { configureApi }                         from '@je-es/capi';
    import * as sass                                from 'sass';
    import { readdirSync, statSync, writeFileSync, existsSync, mkdirSync } from 'fs';
    import { join, extname, relative, dirname }     from 'path';

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

                console.log('🔨 Building @je-es/client application...');

                try {
                    // Build JavaScript
                    await this._buildJS();

                    // Build SASS/CSS
                    await this._buildStyles();

                    console.log('✅ Build completed successfully!');

                } catch (error) {
                    console.error('❌ Build error:', error);
                    throw error;
                }
            },

            /**
             * Build JavaScript bundle
             */
            async _buildJS(): Promise<void> {
                if (!_config.build) return;

                const result = await Bun.build({
                    entrypoints     : [_config.build.entry],
                    outdir          : _config.build.output.substring(0, _config.build.output.lastIndexOf('/')),
                    target          : 'browser',
                    minify          : _config.build.minify ?? false,
                    sourcemap       : _config.build.sourcemap ? 'external' : 'none',
                    splitting       : _config.build.optimization?.splitChunks ?? false,
                    naming          : {
                        entry       : _config.build.output.substring(_config.build.output.lastIndexOf('/') + 1),
                    },
                });

                if (!result.success) {
                    console.error('❌ JS Build failed:', result.logs);
                    throw new Error('JS Build failed');
                }

                console.log('📦 JavaScript bundled');
            },

            /**
             * Build SASS/CSS styles
             */
            async _buildStyles(): Promise<void> {
                const stylesDir = _config.build?.styles?.input || './app/style';
                const outputPath = _config.build?.styles?.output || './static/client.css';
                const outputDir = dirname(outputPath);
                const outputFile = outputPath.split('/').pop() || 'client.css';

                // Check if styles directory exists
                if (!existsSync(stylesDir)) {
                    console.log('⚠️  No style directory found, skipping CSS build');
                    return;
                }

                try {
                    // Ensure output directory exists
                    if (!existsSync(outputDir)) {
                        mkdirSync(outputDir, { recursive: true });
                    }

                    // Collect all SASS/SCSS files
                    const sassFiles = this._collectSassFiles(stylesDir);

                    if (sassFiles.length === 0) {
                        console.log('⚠️  No SASS/SCSS files found, skipping CSS build');
                        return;
                    }

                    console.log(`📝 Found ${sassFiles.length} SASS file(s)`);

                    // Compile all SASS files and combine
                    let combinedCSS = '';

                    for (const file of sassFiles) {
                        try {
                            const result = sass.compile(file, {
                                style: _config.build?.minify ? 'compressed' : 'expanded',
                                sourceMap: _config.build?.sourcemap ? true : false,
                            });

                            combinedCSS += `\n/* ${relative(stylesDir, file)} */\n`;
                            combinedCSS += result.css;
                            combinedCSS += '\n';

                        } catch (sassError) {
                            console.error(`❌ Error compiling ${file}:`, sassError);
                            throw sassError;
                        }
                    }

                    // Write combined CSS
                    const fullOutputPath = join(outputDir, outputFile);
                    writeFileSync(fullOutputPath, combinedCSS, 'utf-8');

                    console.log(`💅 Styles compiled to ${fullOutputPath}`);

                    // Write source map if enabled
                    if (_config.build?.sourcemap) {
                        writeFileSync(
                            `${fullOutputPath}.map`,
                            JSON.stringify({
                                version: 3,
                                sources: sassFiles.map(f => relative(outputDir, f)),
                                names: [],
                                mappings: ''
                            }),
                            'utf-8'
                        );
                    }

                } catch (error) {
                    console.error('❌ CSS Build failed:', error);
                    throw error;
                }
            },

            /**
             * Recursively collect all SASS/SCSS files
             */
            _collectSassFiles(dir: string): string[] {
                const files: string[] = [];

                if (!existsSync(dir)) {
                    return files;
                }

                const entries = readdirSync(dir);

                for (const entry of entries) {
                    const fullPath = join(dir, entry);
                    const stat = statSync(fullPath);

                    if (stat.isDirectory()) {
                        // Recursively scan subdirectories
                        files.push(...this._collectSassFiles(fullPath));
                    } else if (stat.isFile()) {
                        const ext = extname(entry);
                        // Include .sass, .scss files but skip partials (starting with _)
                        if ((ext === '.sass' || ext === '.scss') && !entry.startsWith('_')) {
                            files.push(fullPath);
                        }
                    }
                }

                // Sort files to ensure consistent order
                return files.sort();
            },

            /**
             * Watch mode for development
             */
            async watch(): Promise<void> {
                console.log('👀 Watching for changes...');

                // Initial build
                await this.build();

                // Watch for file changes
                const { watch } = await import('fs');

                // Watch TypeScript files
                if (_config.build?.entry) {
                    const entryDir = dirname(_config.build.entry);
                    watch(entryDir, { recursive: true }, async (eventType, filename) => {
                        if (filename && (filename.endsWith('.ts') || filename.endsWith('.tsx'))) {
                            console.log(`🔄 ${filename} changed, rebuilding JS...`);
                            try {
                                await this._buildJS();
                                console.log('✅ JS rebuild complete');
                            } catch (error) {
                                console.error('❌ JS rebuild failed:', error);
                            }
                        }
                    });
                }

                // Watch SASS files
                const stylesDir = './app/style';
                if (existsSync(stylesDir)) {
                    watch(stylesDir, { recursive: true }, async (eventType, filename) => {
                        if (filename && (filename.endsWith('.sass') || filename.endsWith('.scss'))) {
                            console.log(`🔄 ${filename} changed, rebuilding CSS...`);
                            try {
                                await this._buildStyles();
                                console.log('✅ CSS rebuild complete');
                            } catch (error) {
                                console.error('❌ CSS rebuild failed:', error);
                            }
                        }
                    });
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