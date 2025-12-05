// src/mod/core/decorators.ts
//
// Made with ❤️ by Maysara.



// ╔════════════════════════════════════════ TYPE ════════════════════════════════════════╗

    // Type for decorator context (Stage 3 decorators)
    interface ClassFieldDecoratorContext<This = unknown, Value = unknown> {
        kind: 'field';
        name: string | symbol;
        access: {
            get(object: This): Value;
            set(object: This, value: Value): void;
        };
        addInitializer(initializer: (this: This) => void): void;
    }

    interface ClassGetterDecoratorContext<This = unknown, Value = unknown> {
        kind: 'getter';
        name: string | symbol;
        access: {
            get(object: This): Value;
        };
        addInitializer(initializer: (this: This) => void): void;
    }

    interface ClassMethodDecoratorContext<This = unknown, Value = unknown> {
        kind: 'method';
        name: string | symbol;
        access: {
            get(object: This): Value;
        };
        addInitializer(initializer: (this: This) => void): void;
    }

    // Component metadata interface
    interface ComponentMetadata {
        __reactiveProps__?: string[];
        __watchers__?: Record<string, string[]>;
    }

    // Helper type for component instance
    type ComponentInstance = Record<string, unknown> & {
        constructor: ComponentMetadata;
        _invalidateAllComputed?: () => void;
        _triggerWatchers?: (key: string, newVal: unknown, oldVal: unknown) => void;
        _isMounted?: boolean;
        update?: () => void;
    };

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

    /**
     * State decorator - makes property reactive
     * Usage: @state fields = [];
     *
     * Supports both TypeScript 5 decorators and legacy decorators
     */
    export function state<This, Value>(
        target: undefined,
        context: ClassFieldDecoratorContext<This, Value>
    ): (this: This, initialValue: Value) => Value;
    export function state(
        target: Record<string, unknown>,
        context: string
    ): void;
    export function state<This, Value>(
        target: Record<string, unknown> | undefined,
        context: string | ClassFieldDecoratorContext<This, Value>
    ): unknown {
        // TypeScript 5+ decorator (Stage 3)
        if (context && typeof context === 'object' && 'kind' in context) {
            const propertyKey = context.name as string;

            context.addInitializer(function(this: unknown) {
                const instance = this as ComponentInstance;
                if (!instance.constructor.__reactiveProps__) {
                    instance.constructor.__reactiveProps__ = [];
                }
                if (!instance.constructor.__reactiveProps__.includes(propertyKey)) {
                    instance.constructor.__reactiveProps__.push(propertyKey);
                }
            });

            return function(this: This, initialValue: Value): Value {
                const instance = this as ComponentInstance;
                const hiddenKey = `_state_${propertyKey}`;

                // Store initial value
                instance[hiddenKey] = initialValue;

                // Define getter/setter
                Object.defineProperty(this, propertyKey, {
                    get(this: This) {
                        const inst = this as Record<string, unknown>;
                        return inst[hiddenKey];
                    },
                    set(this: This, newValue: Value) {
                        const inst = this as ComponentInstance;
                        const oldValue = inst[hiddenKey];

                        if (oldValue !== newValue) {
                            inst[hiddenKey] = newValue;

                            // Invalidate all computed properties
                            if (typeof inst._invalidateAllComputed === 'function') {
                                inst._invalidateAllComputed();
                            }

                            // Trigger watchers with correct old/new values
                            if (typeof inst._triggerWatchers === 'function') {
                                inst._triggerWatchers(propertyKey, newValue, oldValue);
                            }

                            // Trigger update if component is mounted
                            if (inst._isMounted && typeof inst.update === 'function') {
                                inst.update();
                            }
                        }
                    },
                    enumerable: true,
                    configurable: true,
                });

                return initialValue;
            };
        }

        // Legacy decorator (for backwards compatibility)
        const propertyKey = context as string;

        // Store reactive property metadata
        const targetConstructor = (target as { constructor: ComponentMetadata }).constructor;
        if (!targetConstructor.__reactiveProps__) {
            targetConstructor.__reactiveProps__ = [];
        }
        if (!targetConstructor.__reactiveProps__.includes(propertyKey)) {
            targetConstructor.__reactiveProps__.push(propertyKey);
        }

        // Create hidden property key
        const hiddenKey = `_state_${propertyKey}`;
        const initKey = `_state_init_${propertyKey}`;

        // Define getter/setter
        Object.defineProperty(target, propertyKey, {
            get(this: unknown) {
                const instance = this as Record<string, unknown>;
                // If not initialized yet, return undefined (don't trigger getter before init)
                if (!instance[initKey]) {
                    return undefined;
                }
                return instance[hiddenKey];
            },
            set(this: unknown, newValue: unknown) {
                const instance = this as ComponentInstance;
                // On first set (during construction), just store the value
                if (!instance[initKey]) {
                    instance[hiddenKey] = newValue;
                    instance[initKey] = true;
                    return;
                }

                const oldValue = instance[hiddenKey];

                if (oldValue !== newValue) {
                    instance[hiddenKey] = newValue;

                    // Invalidate all computed properties
                    if (typeof instance._invalidateAllComputed === 'function') {
                        instance._invalidateAllComputed();
                    }

                    // Trigger watchers with correct old/new values
                    if (typeof instance._triggerWatchers === 'function') {
                        instance._triggerWatchers(propertyKey, newValue, oldValue);
                    }

                    // Trigger update if component is mounted
                    if (instance._isMounted && typeof instance.update === 'function') {
                        instance.update();
                    }
                }
            },
            enumerable: true,
            configurable: true,
        });
    }

    /**
     * Computed decorator - creates computed property
     * Usage: @computed get fullName() { return this.firstName + ' ' + this.lastName; }
     */
    export function computed<This, Value>(
        originalGetter: (this: This) => Value,
        context: ClassGetterDecoratorContext<This, Value>
    ): (this: This) => Value;
    export function computed(
        target: Record<string, unknown>,
        context: string,
        descriptor: PropertyDescriptor
    ): PropertyDescriptor;
    // Catch-all for invalid uses (like methods) to provide better error messages
    export function computed(
        targetOrGetter: unknown,
        context: unknown
    ): never;
    export function computed<This, Value>(
        targetOrGetter: Record<string, unknown> | ((this: This) => Value) | unknown,
        context: string | ClassGetterDecoratorContext<This, Value> | unknown,
        descriptor?: PropertyDescriptor
    ): unknown {
        // TypeScript 5+ decorator (Stage 3)
        if (context && typeof context === 'object' && 'kind' in context) {
            const ctx = context as ClassGetterDecoratorContext<This, Value>;
            if (ctx.kind !== 'getter') {
                throw new Error('@computed can only be used on getters');
            }

            const originalGetter = targetOrGetter as (this: This) => Value;
            const propertyKey = ctx.name as string;
            const cacheKey = `_computed_cache_${propertyKey}`;
            const dirtyKey = `_computed_dirty_${propertyKey}`;

            return function(this: This): Value {
                const instance = this as Record<string, unknown>;
                // Initialize as dirty on first access
                if (instance[dirtyKey] === undefined) {
                    instance[dirtyKey] = true;
                }

                // Recompute if dirty
                if (instance[dirtyKey] === true) {
                    instance[cacheKey] = originalGetter.call(this);
                    instance[dirtyKey] = false;
                }

                return instance[cacheKey] as Value;
            };
        }

        // Legacy decorator
        const propertyKey = context as string;
        if (!descriptor) {
            throw new Error('@computed requires a property descriptor');
        }

        const originalGetter = descriptor.get;

        if (!originalGetter) {
            throw new Error('@computed can only be used on getters');
        }

        const cacheKey = `_computed_cache_${propertyKey}`;
        const dirtyKey = `_computed_dirty_${propertyKey}`;

        return {
            get(this: unknown) {
                const instance = this as Record<string, unknown>;
                // Initialize as dirty on first access
                if (instance[dirtyKey] === undefined) {
                    instance[dirtyKey] = true;
                }

                // Recompute if dirty
                if (instance[dirtyKey] === true) {
                    instance[cacheKey] = originalGetter.call(this);
                    instance[dirtyKey] = false;
                }

                return instance[cacheKey];
            },
            enumerable: descriptor.enumerable,
            configurable: descriptor.configurable,
        };
    }

    /**
     * Watch decorator - watches for property changes
     * Usage: @watch('propertyName') onPropertyChange(newValue, oldValue) {}
     */
    export function watch(propertyName: string) {
        function decorator<This, Args extends unknown[], Return>(
            originalMethod: (this: This, ...args: Args) => Return,
            context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
        ): void;
        function decorator(
            target: Record<string, unknown>,
            context: string,
            descriptor: PropertyDescriptor
        ): PropertyDescriptor;
        function decorator<This, Args extends unknown[], Return>(
            targetOrMethod: Record<string, unknown> | ((this: This, ...args: Args) => Return),
            context: string | ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>,
            descriptor?: PropertyDescriptor
        ): PropertyDescriptor | void {
            // TypeScript 5+ decorator (Stage 3)
            if (context && typeof context === 'object' && 'kind' in context) {
                if (context.kind !== 'method') {
                    throw new Error('@watch can only be used on methods');
                }

                const methodName = context.name as string;

                context.addInitializer(function(this: unknown) {
                    const instance = this as ComponentInstance;
                    if (!instance.constructor.__watchers__) {
                        instance.constructor.__watchers__ = {};
                    }
                    if (!instance.constructor.__watchers__[propertyName]) {
                        instance.constructor.__watchers__[propertyName] = [];
                    }
                    if (!instance.constructor.__watchers__[propertyName].includes(methodName)) {
                        instance.constructor.__watchers__[propertyName].push(methodName);
                    }
                });

                return;
            }

            // Legacy decorator
            const methodName = context as string;
            if (!descriptor) {
                throw new Error('@watch requires a property descriptor');
            }

            const target = targetOrMethod as Record<string, unknown>;
            const targetConstructor = (target as { constructor: ComponentMetadata }).constructor;
            if (!targetConstructor.__watchers__) {
                targetConstructor.__watchers__ = {};
            }
            if (!targetConstructor.__watchers__[propertyName]) {
                targetConstructor.__watchers__[propertyName] = [];
            }
            if (!targetConstructor.__watchers__[propertyName].includes(methodName)) {
                targetConstructor.__watchers__[propertyName].push(methodName);
            }

            return descriptor;
        }

        return decorator;
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝