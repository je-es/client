// src/mod/core/router.ts
//
// Made with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import type { Route, RouteConfig, NavigationGuard } from '../../types';
    import type { VNode }                               from '@je-es/vdom';
    import { Component, ComponentConstructor }          from './component';
    import { createElement }                            from '@je-es/vdom';

    export type { Route, RouteConfig, NavigationGuard };

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TYPE ════════════════════════════════════════╗

    // Type for lazy-loaded module
    interface LazyModule {
        default?        : ComponentConstructor;
        HomePage?       : ComponentConstructor;
        TodoPage?       : ComponentConstructor;
        [key: string]   : unknown;
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝


// ╔════════════════════════════════════════ TYPE ════════════════════════════════════════╗

    export class Router {
        private routes: RouteConfig[] = [];
        private currentRoute: Route | null = null;
        private mode: 'history' | 'hash' = 'history';
        private base: string = '/';
        private beforeEachHooks: NavigationGuard[] = [];
        private afterEachHooks: ((to: Route, from: Route) => void)[] = [];
        private currentComponent: Component | null = null;
        private routerOutlet: HTMLElement | null = null;
        private isNavigating: boolean = false;
        private scrollBehavior: 'auto' | 'smooth' | 'instant' = 'auto';
        private notFoundHandler: (() => void) | null = null;
        private _internalPath: string | null = null;

        /**
         * Initialize router
         */
        init(
            routes: RouteConfig[],
            mode: 'history' | 'hash' = 'history',
            base: string = '/',
            scrollBehavior: 'auto' | 'smooth' | 'instant' = 'auto'
        ): void {
            this.routes = routes;
            this.mode = mode;
            this.base = base.endsWith('/') ? base.slice(0, -1) : base;
            this.scrollBehavior = scrollBehavior;

            this._initializeRouting();
            this._handleRoute();
        }

        /**
         * Navigate to a path
         */
        async push(path: string, state?: Record<string, unknown>): Promise<void> {
            if (this.isNavigating) {
                // console.warn('Navigation already in progress');
                return;
            }

            this._internalPath = path;

            if (this.mode === 'history') {
                window.history.pushState(state || {}, '', this._buildFullPath(path));
            } else {
                window.location.hash = path;
            }

            await this._handleRoute();
        }

        /**
         * Replace current route
         */
        async replace(path: string, state?: Record<string, unknown>): Promise<void> {
            this._internalPath = path;

            if (this.mode === 'history') {
                window.history.replaceState(state || {}, '', this._buildFullPath(path));
            } else {
                window.location.hash = path;
            }

            return this._handleRoute();
        }

        back(): void { window.history.back(); }
        forward(): void { window.history.forward(); }
        go(delta: number): void { window.history.go(delta); }

        /**
         * Navigation guards
         */
        beforeEach(hook: NavigationGuard): void {
            this.beforeEachHooks.push(hook);
        }

        afterEach(hook: (to: Route, from: Route) => void): void {
            this.afterEachHooks.push(hook);
        }

        onNotFound(handler: () => void): void {
            this.notFoundHandler = handler;
        }

        /**
         * Route utilities
         */
        getCurrentRoute(): Route | null {
            return this.currentRoute ? { ...this.currentRoute } : null;
        }

        isActive(path: string, exact: boolean = false): boolean {
            if (!this.currentRoute) return false;
            return exact
                ? this.currentRoute.path === path
                : this.currentRoute.path.startsWith(path);
        }

        outlet(): VNode {
            return createElement('div', {
                'data-router-outlet': 'true',
                style: 'display: contents;'
            }) as VNode;
        }

        getRoute(name: string): RouteConfig | undefined {
            return this.routes.find(r => r.name === name);
        }

        async pushNamed(name: string, params?: Record<string, string>): Promise<void> {
            const route = this.getRoute(name);
            if (!route) {
                console.error(`Route with name "${name}" not found`);
                return;
            }

            let path = route.path;
            if (params) {
                for (const [key, value] of Object.entries(params)) {
                    path = path.replace(`:${key}`, value);
                }
            }

            return this.push(path);
        }

        resolve(path: string): Route | null {
            const matchedRoute = this._matchRoute(path);
            if (!matchedRoute) return null;

            const { route, params } = matchedRoute;
            return {
                path,
                params,
                query: this._parseQuery(path),
                meta: route.meta || {},
                hash: path.includes('#') ? path.split('#')[1] : '',
                name: route.name,
            };
        }

        /**
         * Initialize routing handlers
         */
        private _initializeRouting(): void {
            // Handle browser navigation
            window.addEventListener('popstate', () => {
                this._internalPath = null;
                this._handleRoute();
            });

            if (this.mode === 'hash') {
                window.addEventListener('hashchange', () => {
                    this._internalPath = null;
                    this._handleRoute();
                });
            }

            // Intercept link clicks
            document.addEventListener('click', (e) => {
                const link = (e.target as HTMLElement).closest('a[href]') as HTMLAnchorElement | null;

                if (link && this._shouldInterceptLink(link)) {
                    e.preventDefault();
                    const href = link.getAttribute('href');
                    if (href) {
                        const path = this.mode === 'hash' && href.startsWith('#')
                            ? href.substring(1)
                            : href.replace(this.base, '');
                        this.push(path);
                    }
                }
            });
        }

        private _shouldInterceptLink(link: HTMLAnchorElement): boolean {
            const href = link.getAttribute('href');
            return !!(
                href &&
                link.hostname === window.location.hostname &&
                link.target !== '_blank' &&
                !link.hasAttribute('download') &&
                link.rel !== 'external'
            );
        }

        /**
         * Handle route change
         */
        private async _handleRoute(): Promise<void> {
            if (this.isNavigating) return;

            this.isNavigating = true;

            try {
                const path = this._getCurrentPath();
                const matchedRoute = this._matchRoute(path);

                if (!matchedRoute) {
                    this._handleNotFound(path);
                    return;
                }

                const { route, params } = matchedRoute;
                const to = this._buildRouteObject(path, params, route);
                const from = this.currentRoute || this._buildEmptyRoute();

                // Run guards
                const canProceed = await this._runNavigationGuards(route, to, from);
                if (!canProceed) return;

                this.currentRoute = to;

                await this._renderComponent(route);
                this._handleScrollBehavior(to, from);

                if (route.meta?.title && typeof route.meta.title === 'string') {
                    document.title = route.meta.title;
                }

                // Run after hooks
                this.afterEachHooks.forEach(hook => hook(to, from));

            } catch (error) {
                console.error('Router error:', error);
            } finally {
                this.isNavigating = false;
            }
        }

        /**
         * Handle 404 not found
         */
        private _handleNotFound(path: string): void {
            console.warn(`No route matched for path: ${path}`);

            this.currentRoute = {
                path,
                params: {},
                query: this._parseQuery(),
                meta: {},
                hash: window.location.hash.substring(1),
            };

            if (this.notFoundHandler) {
                this.notFoundHandler();
            }
        }

        /**
         * Build route object
         */
        private _buildRouteObject(
            path: string,
            params: Record<string, string>,
            route: RouteConfig
        ): Route {
            return {
                path,
                params,
                query: this._parseQuery(),
                meta: route.meta || {},
                hash: window.location.hash.substring(1),
                name: route.name,
            };
        }

        private _buildEmptyRoute(): Route {
            return {
                path: '',
                params: {},
                query: {},
                meta: {},
                hash: '',
            };
        }

        /**
         * Run navigation guards
         */
        private async _runNavigationGuards(
            route: RouteConfig,
            to: Route,
            from: Route
        ): Promise<boolean> {
            // Route-specific guard
            if (route.beforeEnter) {
                const result = await this._runGuard(route.beforeEnter, to, from);
                if (!result) return false;
            }

            // Global guards
            for (const guard of this.beforeEachHooks) {
                const result = await this._runGuard(guard, to, from);
                if (!result) return false;
            }

            return true;
        }

        private _runGuard(
            guard: NavigationGuard,
            to: Route,
            from: Route
        ): Promise<boolean> {
            return new Promise((resolve) => {
                guard(to, from, (nextPath?: string | false) => {
                    if (nextPath === false) {
                        resolve(false);
                    } else if (typeof nextPath === 'string') {
                        this.push(nextPath);
                        resolve(false);
                    } else {
                        resolve(true);
                    }
                });
            });
        }

        /**
         * Render component - FIXED: Only clears outlet content, doesn't affect parent components
         */
        private async _renderComponent(route: RouteConfig): Promise<void> {
            // Get or find outlet
            if (!this.routerOutlet) {
                this.routerOutlet = document.querySelector('[data-router-outlet="true"]') as HTMLElement;
                if (!this.routerOutlet) {
                    console.warn('Router outlet not found');
                    return;
                }
            }

            // Unmount previous component PROPERLY
            if (this.currentComponent) {
                try {
                    this.currentComponent.unmount();
                } catch (error) {
                    console.error('Error unmounting component:', error);
                }
                this.currentComponent = null;
            }

            // FIXED: Only clear DIRECT children of outlet, preserve the outlet element itself
            // This prevents destroying parent component references
            while (this.routerOutlet.firstChild) {
                this.routerOutlet.removeChild(this.routerOutlet.firstChild);
            }

            try {
                const ComponentClass = await this._resolveComponent(route.component);

                if (!ComponentClass || typeof ComponentClass !== 'function') {
                    throw new Error('Component is null or not a constructor');
                }

                const ComponentCtor = ComponentClass as new () => Component;
                // console.log('🎨 Mounting:', ComponentCtor.name || 'Component');
                this.currentComponent = new ComponentCtor();

                if (this.currentComponent) {
                    await this.currentComponent.mount(this.routerOutlet);
                    // console.log('✅ Mounted successfully!');

                    // Dispatch custom event after route component is mounted
                    // This allows parent components (like Navbar) to reinitialize if needed
                    window.dispatchEvent(new CustomEvent('route-component-mounted', {
                        detail: { route: route.path, component: ComponentCtor.name }
                    }));
                }

            } catch (error) {
                this._renderError(route.path, error);
                throw error;
            }
        }

        /**
         * Resolve component (handle lazy loading)
         */
        private async _resolveComponent(
            component: ComponentConstructor | (() => Promise<LazyModule>)
        ): Promise<ComponentConstructor | null> {
            // console.log('🔍 Resolving component...');

            // Check if it's a class constructor
            if (typeof component === 'function') {
                // Try to determine if it's a class vs a loader function
                const hasPrototype = 'prototype' in component && component.prototype;
                const proto = hasPrototype ? (component as { prototype: unknown }).prototype : null;
                const hasConstructor = proto && typeof proto === 'object' && 'constructor' in proto;

                if (hasConstructor && (proto as { constructor: unknown }).constructor === component) {
                    // console.log('✅ Direct component class');
                    return component as ComponentConstructor;
                }

                // Otherwise treat as lazy loader
                // console.log('📦 Lazy loading...');
                try {
                    const result = await (component as () => Promise<LazyModule>)();
                    // console.log('📦 Module keys:', Object.keys(result));

                    // Find component in module
                    const found = result.HomePage ||
                        result.TodoPage ||
                        result.default ||
                        Object.values(result).find((exp: unknown): exp is ComponentConstructor => {
                            if (typeof exp !== 'function') return false;
                            // Type guard: check if it's a constructor function
                            const possibleCtor = exp as { prototype?: unknown };
                            const proto = possibleCtor.prototype;
                            return proto !== null && typeof proto === 'object' && proto !== undefined && 'constructor' in proto;
                        });

                    return found || null;
                } catch (error) {
                    console.error('Failed to load lazy component:', error);
                    return null;
                }
            }

            return null;
        }

        /**
         * Render error fallback
         */
        private _renderError(path: string, error: unknown): void {
            if (this.routerOutlet) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.routerOutlet.innerHTML = `
                    <div style="padding: 2rem; background: #fee; border: 2px solid #c00;
                                border-radius: 8px; margin: 2rem;">
                        <h2 style="color: #c00; margin-top: 0;">⚠️ Failed to Load Component</h2>
                        <p><strong>Route:</strong> ${path}</p>
                        <p><strong>Error:</strong> ${errorMessage}</p>
                    </div>
                `;
            }
        }

        /**
         * Handle scroll behavior
         */
        private _handleScrollBehavior(to: Route, from: Route): void {
            if (to.hash) {
                const element = document.getElementById(to.hash);
                if (element) {
                    element.scrollIntoView({ behavior: this.scrollBehavior });
                    return;
                }
            }

            if (to.path !== from.path) {
                window.scrollTo({ top: 0, behavior: this.scrollBehavior });
            }
        }

        /**
         * Get current path (handles test environments)
         */
        private _getCurrentPath(): string {
            if (this._internalPath !== null) {
                return this._internalPath;
            }

            if (this.mode === 'hash') {
                return window.location.hash.substring(1).split('?')[0] || '/';
            }

            let path = window.location.pathname;

            // Handle test environments
            if (!path || path === 'blank' || path === 'about:blank') {
                path = '/';
            }

            if (this.base && path.startsWith(this.base)) {
                path = path.substring(this.base.length);
            }

            return path || '/';
        }

        private _buildFullPath(path: string): string {
            if (path.startsWith('http')) return path;
            const normalizedPath = path.startsWith('/') ? path : '/' + path;
            return this.base + normalizedPath;
        }

        /**
         * Match route pattern to path
         */
        private _matchRoute(path: string): { route: RouteConfig; params: Record<string, string> } | null {
            const cleanPath = path.split('?')[0].split('#')[0];

            for (const route of this.routes) {
                const params = this._matchPath(route.path, cleanPath);
                if (params !== null) {
                    return { route, params };
                }
            }

            return null;
        }

        private _matchPath(pattern: string, path: string): Record<string, string> | null {
            if (pattern === '*') return {};
            if (pattern === path) return {};

            const paramNames: string[] = [];
            const regexPattern = pattern
                .replace(/\*/g, '.*')
                .replace(/:([^/]+)/g, (_, paramName: string) => {
                    paramNames.push(paramName);
                    return '([^/]+)';
                });

            const regex = new RegExp(`^${regexPattern}$`);
            const match = path.match(regex);

            if (!match) return null;

            return paramNames.reduce((params, name, i) => {
                params[name] = decodeURIComponent(match[i + 1]);
                return params;
            }, {} as Record<string, string>);
        }

        /**
         * Parse query string
         */
        private _parseQuery(path?: string): Record<string, string> {
            const search = path
                ? path.includes('?') ? path.split('?')[1].split('#')[0] : ''
                : window.location.search.substring(1);

            if (!search) return {};

            return search.split('&').reduce((query, pair) => {
                const [key, value] = pair.split('=').map(decodeURIComponent);
                if (key) query[key] = value || '';
                return query;
            }, {} as Record<string, string>);
        }
    }

    export const router = new Router();

// ╚══════════════════════════════════════════════════════════════════════════════════════╝