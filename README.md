<!-- ╔══════════════════════════════ BEG ══════════════════════════════╗ -->

<br>
<div align="center">
    <p>
        <img src="./assets/img/logo.png" alt="logo" style="" height="80" />
    </p>
</div>

<div align="center">
    <img src="https://img.shields.io/badge/v-0.0.3-black"/>
    <img src="https://img.shields.io/badge/🔥-@je--es-black"/>
    <br>
    <img src="https://github.com/je-es/client/actions/workflows/ci.yml/badge.svg" alt="CI" />
    <img src="https://img.shields.io/badge/coverage-90%25-brightgreen" alt="Test Coverage" />
    <img src="https://img.shields.io/github/issues/je-es/client?style=flat" alt="Github Repo Issues" />
    <img src="https://img.shields.io/github/stars/je-es/client?style=social" alt="GitHub Repo stars" />
</div>
<br>

<!-- ╚═════════════════════════════════════════════════════════════════╝ -->




<!-- ╔══════════════════════════════ DOC ══════════════════════════════╗ -->

- ## Quick Start 🔥

    > _**The simplest, fastest and most organized way to manage the front-end of web applications.**_

    > _**This lib must run with [@je-es/server](https://github.com/je-es/server)**_.

    > _We prefer to use [`space`](https://github.com//solution-lib/space) with [`@solution-dist/web`](https://github.com/solution-dist/web) for a better experience._

    - ### Setup

        > install [`space`](https://github.com/solution-lib/space) first.

        - #### Create

            ```bash
            > space init <name> -t web    # This will clone a ready-to-use repo and make some changes to suit your app.
            > cd <name>                   # Go to the project directory
            > space install               # Install the dependencies
            ```

        - #### Manage

            ```bash
            > space lint
            > space build
            > space test
            > space start
            ```

        - #### Usage

            ```typescript
            import { Component, html, state, router } from '@je-es/client';

            class MyComponent extends Component {
                @state count = 0;

                render() {
                    return html`
                        <div>
                            <h1>Count: ${this.count}</h1>
                            <button onclick=${() => this.count++}>
                                Increment
                            </button>
                        </div>
                    `;
                }
            }
            ```

            ```bash
             > space start

               Building @je-es/client application...
               Build completed successfully!
               Output: ./src/frontend/static/js/client.js

               Server started at http://localhost:3000
            ```

    <div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> <br> </div>

- ## Examples

    - ### Component System

        ```typescript
        import { Component, html, css, state, computed } from '@je-es/client';

        class TodoComponent extends Component {
            @state todos = [];
            @state filter = 'all';

            @computed
            get filteredTodos() {
                return this.filter === 'all'
                    ? this.todos
                    : this.todos.filter(t => t.status === this.filter);
            }

            render() {
                return html`
                    <div class="todo-app">
                        <h1>My Todos</h1>
                        ${this.filteredTodos.map(todo => html`
                            <div class="todo-item">
                                ${todo.title}
                            </div>
                        `)}
                    </div>
                `;
            }

            styles() {
                return css`
                    .todo-app {
                        padding: 2rem;
                        max-width: 600px;
                        margin: 0 auto;
                    }
                    .todo-item {
                        padding: 1rem;
                        border-bottom: 1px solid #eee;
                    }
                `;
            }
        }
        ```

        <div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> <br> </div>

    - ### Router Configuration

        ```typescript
        import { client, router } from '@je-es/client';

        const clientApp = client({
            app: {
                root: '#app',
                routes: [
                    {
                        path: '/',
                        component: () => import('./pages/HomePage'),
                        meta: { title: 'Home' }
                    },
                    {
                        path: '/users/:id',
                        component: () => import('./pages/UserPage'),
                        meta: { title: 'User Profile' },
                        beforeEnter: (to, from, next) => {
                            // Route guard
                            if (isAuthenticated()) {
                                next();
                            } else {
                                next('/login');
                            }
                        }
                    }
                ]
            },
            router: {
                mode: 'history',
                base: '/',
                scrollBehavior: 'smooth'
            }
        });

        // Navigate programmatically
        router.push('/users/123');
        router.replace('/home');
        router.back();
        ```

        <div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> <br> </div>

    - ### State Management (Store)

        ```typescript
        import { createStore, connect } from '@je-es/client';

        // Create global store
        const userStore = createStore({
            state: {
                user: null,
                isAuthenticated: false,
                preferences: {}
            },
            persist: true,
            storage: 'localStorage',
            storageKey: 'app-user-store'
        });

        // Subscribe to changes
        userStore.subscribe((state) => {
            console.log('User state changed:', state);
        });

        // Update state
        userStore.setState({
            user: { name: 'John', email: 'john@example.com' },
            isAuthenticated: true
        });

        // Connect to component
        class UserProfile extends Component {
            render() {
                return html`<div>User: ${userStore.state.user?.name}</div>`;
            }
        }

        connect(userStore, component, (state) => ({
            user: state.user
        }));
        ```

        <div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> <br> </div>

    - ### React-Like Hooks

        ```typescript
        import {
            createFunctionalComponent,
            useState,
            useEffect,
            useMemo
        } from '@je-es/client';

        const Counter = createFunctionalComponent((props) => {
            const [count, setCount] = useState(0);
            const [multiplier, setMultiplier] = useState(2);

            // Computed value
            const result = useMemo(() => {
                return count * multiplier;
            }, [count, multiplier]);

            // Side effect
            useEffect(() => {
                document.title = `Count: ${count}`;

                return () => {
                    // Cleanup
                    document.title = 'App';
                };
            }, [count]);

            return html`
                <div>
                    <h2>Result: ${result}</h2>
                    <button onclick=${() => setCount(count + 1)}>
                        Increment
                    </button>
                    <button onclick=${() => setMultiplier(multiplier + 1)}>
                        Increase Multiplier
                    </button>
                </div>
            `;
        }, 'Counter');

        const component = new Counter({ initial: 5 });
        await component.mount(container);
        ```

        <div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> <br> </div>

    - ### Smart Forms

        ```typescript
        import { SmartFormComponent } from '@je-es/client';

        const loginForm = new SmartFormComponent({
            fields: [
                {
                    name: 'email',
                    type: 'email',
                    label: 'Email Address',
                    placeholder: 'Enter your email',
                    validation: {
                        required: true,
                        email: true,
                        message: 'Please enter a valid email'
                    }
                },
                {
                    name: 'password',
                    type: 'password',
                    label: 'Password',
                    validation: {
                        required: true,
                        minLength: 8,
                        message: 'Password must be at least 8 characters'
                    }
                },
                {
                    name: 'remember',
                    type: 'checkbox',
                    label: 'Remember me'
                }
            ],
            endpoint: '/api/auth/login',
            method: 'POST',
            autoValidate: true,
            submitButton: {
                label: 'Sign In',
                loadingLabel: 'Signing in...',
                className: 'btn-primary'
            },
            onSuccess: (data) => {
                localStorage.setItem('token', data.token);
                router.push('/dashboard');
            },
            onError: (error) => {
                console.error('Login failed:', error);
            }
        });

        await loginForm.mount(container);
        ```

        <div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> <br> </div>

    - ### Context API

        ```typescript
        import { createContext, Provider, useContext } from '@je-es/client';

        // Create contexts
        const ThemeContext = createContext({ theme: 'light' });
        const UserContext = createContext({ user: null });

        // Provider component
        class App extends Component {
            @state theme = 'dark';
            @state user = { name: 'John' };

            render() {
                return html`
                    <${Provider}
                        context=${ThemeContext}
                        value=${{ theme: this.theme }}
                    >
                        <${Provider}
                            context=${UserContext}
                            value=${{ user: this.user }}
                        >
                            <${ConsumerComponent} />
                        </${Provider}>
                    </${Provider}>
                `;
            }
        }

        // Consumer component
        class ConsumerComponent extends Component {
            render() {
                const theme = useContext(ThemeContext, this);
                const user = useContext(UserContext, this);

                return html`
                    <div class="${theme.theme}">
                        Welcome, ${user.user?.name}!
                    </div>
                `;
            }
        }
        ```

        <div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> <br> </div>

    - ### API Integration

        ```typescript
        import { api, http, configureApi } from '@je-es/client';

        // Global configuration
        configureApi({
            baseURL: 'https://api.example.com',
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json'
            },
            interceptors: {
                request: (config) => {
                    const token = localStorage.getItem('token');
                    if (token) {
                        config.headers['Authorization'] = `Bearer ${token}`;
                    }
                    return config;
                },
                response: (response) => {
                    console.log('Response:', response);
                    return response;
                },
                error: (error) => {
                    if (error.status === 401) {
                        router.push('/login');
                    }
                    throw error;
                }
            }
        });

        // Make requests
        const users = await http.get('/users');
        const user = await http.get('/users/123');
        const created = await http.post('/users', { name: 'Jane' });
        const updated = await http.put('/users/123', { name: 'Jane Doe' });
        await http.delete('/users/123');

        // Advanced usage
        const response = await api({
            method: 'POST',
            url: '/upload',
            data: formData,
            params: { folder: 'avatars' },
            timeout: 60000
        });
        ```

    <br>

- ## API

    - ### Component Lifecycle

        ```typescript
        class MyComponent extends Component {
            // Called before component is mounted to DOM
            async onBeforeMount(): void {
                // Initialize data, fetch resources
            }

            // Called after component is mounted to DOM
            async onMount(): void {
                // Setup event listeners, start timers
            }

            // Called before component updates
            async onBeforeUpdate(prevProps, prevState): void {
                // Prepare for update
            }

            // Called after component updates
            onUpdate(prevProps, prevState): void {
                // React to changes
            }

            // Called before component unmounts
            onBeforeUnmount(): void {
                // Cleanup preparation
            }

            // Called after component unmounts
            onUnmount(): void {
                // Remove listeners, clear timers
            }

            // Called when error occurs
            onError(error: Error, errorInfo): void {
                // Handle errors
            }

            // Control whether component should update
            shouldUpdate(prevProps, prevState): boolean {
                return true; // or custom logic
            }
        }
        ```

        <div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> <br> </div>

    - ### Decorators

        ```typescript
        import { state, computed, watch } from '@je-es/client';

        class ReactiveComponent extends Component {
            // Reactive state - triggers re-render on change
            @state count = 0;
            @state items = [];
            @state user = { name: 'John' };

            // Computed property - cached until dependencies change
            @computed
            get doubleCount() {
                return this.count * 2;
            }

            @computed
            get itemCount() {
                return this.items.length;
            }

            // Watch for property changes
            @watch('count')
            onCountChange(newValue, oldValue) {
                console.log(`Count changed from ${oldValue} to ${newValue}`);
            }

            @watch('user')
            onUserChange(newUser, oldUser) {
                console.log('User updated:', newUser);
            }

            render() {
                return html`
                    <div>
                        Count: ${this.count}
                        Double: ${this.doubleCount}
                    </div>
                `;
            }
        }
        ```

        <div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> <br> </div>

    - ### React-Like Hooks

        ```typescript
        import {
            useState,
            useEffect,
            useMemo,
            useCallback,
            useRef,
            useReducer,
            useLocalStorage,
            useDebounce,
            usePrevious,
            useToggle,
            useInterval,
            useFetch,
            useWindowSize,
            useEventListener
        } from '@je-es/client';

        // State management
        const [count, setCount] = useState(0);
        const [user, setUser] = useState({ name: 'John' });

        // Side effects
        useEffect(() => {
            console.log('Component mounted');
            return () => console.log('Component unmounted');
        }, []);

        // Memoization
        const expensiveValue = useMemo(() => {
            return count * 2;
        }, [count]);

        // Callback memoization
        const handleClick = useCallback(() => {
            setCount(count + 1);
        }, [count]);

        // Persistent reference
        const inputRef = useRef(null);

        // Complex state
        const [state, dispatch] = useReducer(reducer, initialState);

        // LocalStorage sync
        const [value, setValue] = useLocalStorage('key', defaultValue);

        // Debounced value
        const debouncedSearch = useDebounce(searchTerm, 500);

        // Previous value
        const prevCount = usePrevious(count);

        // Boolean toggle
        const [isOn, toggle] = useToggle(false);

        // Interval
        useInterval(() => {
            console.log('Tick');
        }, 1000);

        // Data fetching
        const { data, loading, error, refetch } = useFetch('/api/users');

        // Window size
        const { width, height } = useWindowSize();

        // Event listener
        useEventListener('click', handleClick, element);
        ```

        <div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> <br> </div>

    - ### Router API

        ```typescript
        import { router, Router } from '@je-es/client';

        // Navigation
        router.push('/users/123');
        router.push('/search?q=test&page=2');
        router.replace('/home');
        router.back();
        router.forward();
        router.go(-2);

        // Named routes
        router.pushNamed('user', { id: '123' });

        // Route guards
        router.beforeEach((to, from, next) => {
            if (to.meta.requiresAuth && !isAuthenticated()) {
                next('/login');
            } else {
                next();
            }
        });

        router.afterEach((to, from) => {
            console.log(`Navigated from ${from.path} to ${to.path}`);
        });

        // Route info
        const current = router.getCurrentRoute();
        const isActive = router.isActive('/users');
        const route = router.resolve('/users/123');

        // Route outlet (in component)
        render() {
            return html`
                <div>
                    <nav>...</nav>
                    ${router.outlet()}
                </div>
            `;
        }
        ```

        <div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> <br> </div>

    - ### Store API

        ```typescript
        import { Store, createStore, createComputedStore, connect } from '@je-es/client';

        // Create store
        const store = createStore({
            state: { count: 0, user: null },
            persist: true,
            storage: 'localStorage',
            storageKey: 'my-store',
            middleware: [
                (state, action) => {
                    console.log('State changed:', action, state);
                }
            ]
        });

        // Get state
        const state = store.state;
        const count = store.get('count');

        // Update state
        store.setState({ count: 5 });
        store.set('count', 10);
        store.setState(prev => ({ count: prev.count + 1 }));

        // Subscribe
        const unsubscribe = store.subscribe((state) => {
            console.log('State:', state);
        });

        store.subscribeToKey('count', (value) => {
            console.log('Count:', value);
        });

        // Batch updates
        store.batch(() => {
            store.set('count', 1);
            store.set('user', { name: 'Jane' });
        });

        // Computed store
        const doubleStore = createComputedStore(
            [store],
            (state) => state.count * 2
        );

        // Clear/Reset
        store.clear();
        store.reset({ count: 0, user: null });

        // Destroy
        store.destroy();
        ```

        <div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> <br> </div>

    - ### Utility Functions

        ```typescript
        import {
            debounce,
            throttle,
            classNames,
            formatDate,
            deepClone,
            deepMerge,
            uniqueId,
            sleep,
            isEmpty,
            capitalize,
            kebabCase,
            camelCase,
            pascalCase,
            truncate,
            parseQuery,
            stringifyQuery,
            clamp
        } from '@je-es/client';

        // Function utilities
        const debouncedFn = debounce(() => console.log('Called'), 300);
        const throttledFn = throttle(() => console.log('Called'), 1000);

        // String utilities
        const classes = classNames('btn', { active: true, disabled: false });
        const date = formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss');
        const cap = capitalize('hello'); // 'Hello'
        const kebab = kebabCase('helloWorld'); // 'hello-world'
        const camel = camelCase('hello-world'); // 'helloWorld'
        const pascal = pascalCase('hello-world'); // 'HelloWorld'
        const short = truncate('Long text here', 10); // 'Long te...'

        // Object utilities
        const cloned = deepClone(obj);
        const merged = deepMerge(obj1, obj2, obj3);

        // Other utilities
        const id = uniqueId('prefix');
        await sleep(1000);
        const empty = isEmpty(value);
        const clamped = clamp(150, 0, 100); // 100

        // Query string
        const params = parseQuery('?page=1&limit=10');
        const query = stringifyQuery({ page: 1, limit: 10 });
        ```

<!-- ╚═════════════════════════════════════════════════════════════════╝ -->



<!-- ╔══════════════════════════════ END ══════════════════════════════╗ -->

<br>

---

<div align="center">
    <a href="https://github.com/solution-lib/space"><img src="https://img.shields.io/badge/by-Space-black"/></a>
</div>

<!-- ╚═════════════════════════════════════════════════════════════════╝ -->