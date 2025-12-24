// src/frontend/app/gui/layout/tabbed-view.ts
//
// Made with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import { type VNode, div, button, span, p, i }  from "@je-es/vdom";
    import { Component }            from "../core/component";
    import { state }                from "../core/decorators";
    import { t }                    from "../core/i18n";
    import styleMap                 from "./bb_map.json";

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ INIT ════════════════════════════════════════╗

    // Blah Blah Style Map
    const { tabbedView: bb_ } = styleMap;

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TYPE ════════════════════════════════════════╗

    export type TabPosition     = 'top' | 'side';
    export type TabStyle        = 'default' | 'pills' | 'minimal';

    export interface Tab {
        id                      : string;
        label                   : string;
        translateKey?           : string;
        icon?                   : string;
        badge?                  : number | string;
        disabled?               : boolean;
        component?              : Component | (() => VNode);
        content?                : VNode;
        onActivate?             : () => void | Promise<void>;
    }

    export interface TabbedViewOptions {
        tabs                    : Tab[];
        defaultTab?             : string;
        position?               : TabPosition;
        style?                  : TabStyle;
        className?              : string;
        headerClassName?        : string;
        contentClassName?       : string;
        showTabCount?           : boolean;
        persistState?           : boolean; // Save active tab to localStorage
        storageKey?             : string;  // Key for localStorage
        onChange?               : (tabId: string) => void | Promise<void>;
    }

// ╚═══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

    export class TabbedView extends Component {

        // ┌──────────────────────────────── INIT ──────────────────────────────┐

            // @ts-expect-error - TypeScript decorator limitation with class property types
            @state activeTabId          : string            = '';
            // @ts-expect-error - TypeScript decorator limitation with class property types
            @state tabs                 : Tab[]             = [];
            // @ts-expect-error - TypeScript decorator limitation with class property types
            @state position             : TabPosition       = 'top';
            // @ts-expect-error - TypeScript decorator limitation with class property types
            @state style                : TabStyle          = 'default';
            // @ts-expect-error - TypeScript decorator limitation with class property types
            @state className            : string            = '';
            // @ts-expect-error - TypeScript decorator limitation with class property types
            @state headerClassName      : string            = '';
            // @ts-expect-error - TypeScript decorator limitation with class property types
            @state contentClassName     : string            = '';
            // @ts-expect-error - TypeScript decorator limitation with class property types
            @state showTabCount         : boolean           = false;
            // @ts-expect-error - TypeScript decorator limitation with class property types
            @state persistState         : boolean           = false;
            // @ts-expect-error - TypeScript decorator limitation with class property types
            @state storageKey           : string            = 'tabbedview-active';

            private currentTabComponent : Component | null  = null;
            private onChange?           : (tabId: string) => void | Promise<void>;

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── MAIN ──────────────────────────────┐

            async onMount() {
                // Listen for language changes
                window.addEventListener('languagechange', () => {
                    this.update();
                });
            }

            onUnmount() {
                // Clean up current tab component
                if (this.currentTabComponent && typeof this.currentTabComponent.onUnmount === 'function') {
                    this.currentTabComponent.onUnmount();
                }
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── ──── ──────────────────────────────┐

            /**
             * Initialize the tabbed view with options
             */
            init(options: TabbedViewOptions) {
                this.tabs = options.tabs;
                this.position = options.position || 'top';
                this.style = options.style || 'default';
                this.className = options.className || '';
                this.headerClassName = options.headerClassName || '';
                this.contentClassName = options.contentClassName || '';
                this.showTabCount = options.showTabCount || false;
                this.persistState = options.persistState || false;
                this.storageKey = options.storageKey || 'tabbedview-active';
                this.onChange = options.onChange;

                // Determine initial active tab
                if (this.persistState) {
                    const savedTab = localStorage.getItem(this.storageKey);
                    if (savedTab && this.tabs.find(t => t.id === savedTab)) {
                        this.activeTabId = savedTab;
                    }
                }

                if (!this.activeTabId) {
                    this.activeTabId = options.defaultTab || this.tabs[0]?.id || '';
                }

                this.update();
                return this;
            }

            /**
             * Set active tab
             */
            async setActiveTab(tabId: string) {
                const tab = this.tabs.find(t => t.id === tabId);
                if (!tab || tab.disabled) return;

                // Clean up old tab component
                if (this.currentTabComponent && typeof this.currentTabComponent.onUnmount === 'function') {
                    this.currentTabComponent.onUnmount();
                }
                this.currentTabComponent = null;

                this.activeTabId = tabId;

                // Save to localStorage if persistence is enabled
                if (this.persistState) {
                    localStorage.setItem(this.storageKey, tabId);
                }

                // Call tab's onActivate callback
                if (tab.onActivate) {
                    await tab.onActivate();
                    // (window as any).__globalLoader?.show();
                    // TODO: better use in-container loading indicator
                }

                // Call global onChange callback
                if (this.onChange) {
                    await this.onChange(tabId);
                }

                this.update();
            }

            /**
             * Add a new tab dynamically
             */
            addTab(tab: Tab) {
                this.tabs = [...this.tabs, tab];
                this.update();
            }

            /**
             * Remove a tab
             */
            removeTab(tabId: string) {
                this.tabs = this.tabs.filter(t => t.id !== tabId);
                if (this.activeTabId === tabId && this.tabs.length > 0) {
                    this.activeTabId = this.tabs[0].id;
                }
                this.update();
            }

            /**
             * Update tab properties
             */
            updateTab(tabId: string, updates: Partial<Tab>) {
                const tab = this.tabs.find(t => t.id === tabId);
                if (tab) {
                    Object.assign(tab, updates);
                    this.update();
                }
            }

            /**
             * Get active tab
             */
            getActiveTab(): Tab | undefined {
                return this.tabs.find(t => t.id === this.activeTabId);
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── ──── ──────────────────────────────┐

            render(): VNode {
                const containerClass = [
                    bb_.container,
                    `bb_tabbedview__--${this.position}`,
                    `bb_tabbedview__--${this.style}`,
                    this.className
                ].filter(Boolean).join(' ');

                return div(
                    containerClass,
                    this.renderTabList(),
                    this.renderTabContent()
                ) as VNode;
            }

            renderTabList(): VNode {
                const headerClass = [
                    bb_.header,
                    this.headerClassName
                ].filter(Boolean).join(' ');

                return div(
                    headerClass,
                    ...this.tabs.map(tab => this.renderTab(tab))
                ) as VNode;
            }

            renderTab(tab: Tab): VNode {
                const isActive = this.activeTabId === tab.id;

                const tabClass = [
                    bb_.tab.base,
                    isActive ? bb_.tab.active : '',
                    tab.disabled ? bb_.tab.disabled : ''
                ].filter(Boolean).join(' ');

                const label = tab.translateKey ? t(tab.translateKey) : tab.label;

                return button(
                    {
                        key: tab.id,
                        class: tabClass,
                        onclick: () => this.setActiveTab(tab.id),
                        disabled: tab.disabled,
                        'data-translate': tab.translateKey,
                        'aria-selected': isActive,
                        role: 'tab'
                    },
                    tab.icon ? i(tab.icon) : null,
                    span({}, label),
                    tab.badge !== undefined && tab.badge !== null && tab.badge !== 0 ?
                        span(
                            bb_.tab.badge,
                            typeof tab.badge === 'number' && tab.badge > 99 ? '99+' : String(tab.badge)
                        ) : null
                ) as VNode;
            }

            renderTabContent(): VNode {
                const contentClass = [
                    bb_.content.container,
                    this.contentClassName
                ].filter(Boolean).join(' ');

                const activeTab = this.getActiveTab();
                if (!activeTab) {
                    return div(
                        contentClass,
                        div(
                            bb_.content.emptyState,
                            p({}, t('tabbedView.no_content'))
                        )
                    ) as VNode;
                }

                return div(
                    {
                        class: contentClass,
                        role: 'tabpanel'
                    },
                    this.renderActiveTabContent(activeTab)
                ) as VNode;
            }

            renderActiveTabContent(tab: Tab): VNode {
                // If tab has a component class/function
                if (tab.component) {
                    try {
                        // Check if it's a Component instance
                        if (tab.component instanceof Component) {
                            // It's already an instance, just render it
                            this.currentTabComponent = tab.component;

                            // Get the VNode from render()
                            const vnode = this.currentTabComponent.render();

                            // Wrap the VNode to set _element when it's mounted via ref callback
                            const wrappedProps = {
                                ...vnode.props,
                                ref: (el: HTMLElement | null) => {
                                    if (el && this.currentTabComponent) {
                                        // Set the component's _element through the private field
                                        (this.currentTabComponent as Component<Record<string, unknown>, Record<string, unknown>>).setElement(el);
                                        // console.log('✅ TabbedView set component._element via ref');
                                    }
                                    // Call original ref if it exists
                                    if (typeof vnode.props.ref === 'function') {
                                        vnode.props.ref(el);
                                    }
                                }
                            };

                            // Create a new VNode with the wrapped props
                            const wrappedVNode = {
                                ...vnode,
                                props: wrappedProps
                            };

                            // Schedule onMount to be called after element is in DOM
                            if (typeof this.currentTabComponent.onMount === 'function') {
                                setTimeout(() => {
                                    if (this.currentTabComponent && typeof this.currentTabComponent.onMount === 'function') {
                                        this.currentTabComponent.onMount();
                                    }
                                }, 0);
                            }

                            return wrappedVNode as VNode;
                        }

                        // Check if it's a function
                        if (typeof tab.component === 'function') {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const fn = tab.component as any;

                            // Check if it's a Component class (has prototype.render)
                            if (fn.prototype && typeof fn.prototype.render === 'function') {
                                // It's a Component class - create new instance
                                if (!this.currentTabComponent) {
                                    this.currentTabComponent = new fn();

                                    // Schedule onMount
                                    if (this.currentTabComponent && typeof this.currentTabComponent.onMount === 'function') {
                                        setTimeout(() => {
                                            if (this.currentTabComponent && typeof this.currentTabComponent.onMount === 'function') {
                                                this.currentTabComponent.onMount();
                                            }
                                        }, 0);
                                    }
                                }

                                return this.currentTabComponent!.render() as VNode;
                            } else {
                                // It's a function returning VNode
                                return fn() as VNode;
                            }
                        }
                    } catch (error) {
                        console.error('Error rendering tab component:', error);
                        return div(
                            bb_.content.error,
                            t('global.loading')
                        ) as VNode;
                    }
                }

                // If tab has direct content VNode
                if (tab.content) {
                    return tab.content;
                }

                // Fallback
                return div(
                    bb_.content.emptyState,
                    p({}, t('tabbedView.no_content'))
                ) as VNode;
            }

        // └────────────────────────────────────────────────────────────────────┘

    }

// ╚═══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ GLOB ════════════════════════════════════════╗

    /**
     * Create a new TabbedView instance with options
     */
    export function createTabbedView(options: TabbedViewOptions): TabbedView {
        const view = new TabbedView();
        view.init(options);
        return view;
    }

    /**
     * Helper to create a simple tabbed view and mount it
     */
    export async function mountTabbedView(
        container: HTMLElement,
        options: TabbedViewOptions
    ): Promise<TabbedView> {
        const view = createTabbedView(options);
        await view.mount(container);
        return view;
    }

// ╚═══════════════════════════════════════════════════════════════════════════════════════╝