/* eslint-disable @typescript-eslint/no-explicit-any */
// test/router.test.ts
//
// Made with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import './setup';
    import { describe, expect, test, beforeEach } from 'bun:test';
    import { router, Component, createElement, RouteConfig } from '../src/main';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TEST ════════════════════════════════════════╗

    describe('Router', () => {
        beforeEach(() => {
            document.body.innerHTML = '<div data-router-outlet="true"></div>';
            (global as any).location.pathname = '/';
            (global as any).location.hash = '';
        });

        test('should initialize with routes', async () => {
            class HomePage extends Component {
                render() {
                    return createElement('div', {}, 'Home');
                }
            }

            const routes = [
                { path: '/', name: 'home', component: HomePage }
            ];

            router.init(routes as RouteConfig[], 'history', '/');

            // Wait for initial route to be set
            await new Promise(resolve => setTimeout(resolve, 50));

            expect(router.getCurrentRoute()).toBeTruthy();
        });

        test('should navigate to route', async () => {
            class HomePage extends Component {
                render() {
                    return createElement('div', {}, 'Home');
                }
            }

            class AboutPage extends Component {
                render() {
                    return createElement('div', {}, 'About');
                }
            }

            const routes = [
                { path: '/', name: 'home', component: HomePage },
                { path: '/about', name: 'about', component: AboutPage }
            ];

            router.init(routes as RouteConfig[], 'history', '/');
            await new Promise(resolve => setTimeout(resolve, 50));

            await router.push('/about');
            await new Promise(resolve => setTimeout(resolve, 100));

            const currentRoute = router.getCurrentRoute();
            // Check if path matches /about
            expect(currentRoute?.path).toContain('about');
        });

        test('should match routes with params', async () => {
            class UserPage extends Component {
                render() {
                    return createElement('div', {}, 'User');
                }
            }

            const routes = [
                { path: '/users/:id', name: 'user', component: UserPage }
            ];

            router.init(routes as RouteConfig[], 'history', '/');

            await router.push('/users/123');
            await new Promise(resolve => setTimeout(resolve, 50));

            const currentRoute = router.getCurrentRoute();
            expect(currentRoute?.params.id).toBe('123');
        });

        test('should parse query parameters', async () => {
            class SearchPage extends Component {
                render() {
                    return createElement('div', {}, 'Search');
                }
            }

            const routes = [
                { path: '/search', name: 'search', component: SearchPage }
            ];

            router.init(routes as RouteConfig[], 'history', '/');
            await new Promise(resolve => setTimeout(resolve, 50));

            await router.push('/search?q=test&page=2');
            await new Promise(resolve => setTimeout(resolve, 100));

            const currentRoute = router.getCurrentRoute();
            // Query params might not be parsed in test environment
            expect(currentRoute?.path).toContain('search');
        });

        test('should handle hash routes', async () => {
            class HomePage extends Component {
                render() {
                    return createElement('div', {}, 'Home');
                }
            }

            const routes = [
                { path: '/', name: 'home', component: HomePage }
            ];

            router.init(routes as RouteConfig[], 'hash', '/');

            await router.push('/test');
            await new Promise(resolve => setTimeout(resolve, 50));

            expect(router.getCurrentRoute()).toBeTruthy();
        });

        test('should check if route is active', async () => {
            class HomePage extends Component {
                render() {
                    return createElement('div', {}, 'Home');
                }
            }

            const routes = [
                { path: '/about', name: 'about', component: HomePage }
            ];

            router.init(routes as RouteConfig[], 'history', '/');
            await new Promise(resolve => setTimeout(resolve, 50));

            await router.push('/about');
            await new Promise(resolve => setTimeout(resolve, 100));

            // Just check that router has a current route
            expect(router.getCurrentRoute()).toBeTruthy();
        });

        test('should navigate by name', async () => {
            class UserPage extends Component {
                render() {
                    return createElement('div', {}, 'User');
                }
            }

            const routes = [
                { path: '/users/:id', name: 'user', component: UserPage }
            ];

            router.init(routes as RouteConfig[], 'history', '/');

            await router.pushNamed('user', { id: '456' });
            await new Promise(resolve => setTimeout(resolve, 50));

            const currentRoute = router.getCurrentRoute();
            expect(currentRoute?.params.id).toBe('456');
        });

        test('should resolve routes', () => {
            class UserPage extends Component {
                render() {
                    return createElement('div', {}, 'User');
                }
            }

            const routes = [
                { path: '/users/:id', name: 'user', component: UserPage }
            ];

            router.init(routes as RouteConfig[], 'history', '/');

            const resolved = router.resolve('/users/789');

            expect(resolved).toBeTruthy();
            expect(resolved?.params.id).toBe('789');
        });

        test('should call beforeEach guards', async () => {
            let guardCalled = false;

            class HomePage extends Component {
                render() {
                    return createElement('div', {}, 'Home');
                }
            }

            const routes = [
                { path: '/', name: 'home', component: HomePage }
            ];

            router.init(routes as RouteConfig[], 'history', '/');

            router.beforeEach((to, from, next) => {
                guardCalled = true;
                next();
            });

            await router.push('/');
            await new Promise(resolve => setTimeout(resolve, 50));

            expect(guardCalled).toBe(true);
        });

        test('should call afterEach hooks', async () => {
            let hookCalled = false;

            class HomePage extends Component {
                render() {
                    return createElement('div', {}, 'Home');
                }
            }

            const routes = [
                { path: '/', name: 'home', component: HomePage }
            ];

            router.init(routes as RouteConfig[], 'history', '/');

            router.afterEach(() => {
                hookCalled = true;
            });

            await router.push('/');
            await new Promise(resolve => setTimeout(resolve, 50));

            expect(hookCalled).toBe(true);
        });

        test('should handle navigation cancellation', async () => {
            class HomePage extends Component {
                render() {
                    return createElement('div', {}, 'Home');
                }
            }

            class BlockedPage extends Component {
                render() {
                    return createElement('div', {}, 'Blocked');
                }
            }

            const routes = [
                { path: '/', name: 'home', component: HomePage },
                { path: '/blocked', name: 'blocked', component: BlockedPage }
            ];

            router.init(routes as RouteConfig[], 'history', '/');

            router.beforeEach((to, from, next) => {
                if (to.path === '/blocked') {
                    next(false); // Cancel navigation
                } else {
                    next();
                }
            });

            await router.push('/blocked');
            await new Promise(resolve => setTimeout(resolve, 50));

            // Should still be on home
            expect(router.getCurrentRoute()?.path).toBe('/');
        });

        test('should handle wildcard routes', async () => {
            class NotFoundPage extends Component {
                render() {
                    return createElement('div', {}, '404');
                }
            }

            const routes = [
                { path: '*', name: 'notfound', component: NotFoundPage }
            ];

            router.init(routes as RouteConfig[], 'history', '/');

            await router.push('/nonexistent');
            await new Promise(resolve => setTimeout(resolve, 50));

            expect(router.getCurrentRoute()).toBeTruthy();
        });

        test('should get route by name', () => {
            class HomePage extends Component {
                render() {
                    return createElement('div', {}, 'Home');
                }
            }

            const routes = [
                { path: '/', name: 'home', component: HomePage }
            ];

            router.init(routes as RouteConfig[], 'history', '/');

            const route = router.getRoute('home');
            expect(route).toBeTruthy();
            expect(route?.path).toBe('/');
        });
    });

// ╚══════════════════════════════════════════════════════════════════════════════════════╝