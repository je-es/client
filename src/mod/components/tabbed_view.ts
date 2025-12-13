/* eslint-disable @typescript-eslint/no-explicit-any */

// src/frontend/app/gui/layout/tabbed-view.ts
//
// Made with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import { createElement, VNode } from "@je-es/vdom";
    import { Component } from "../core/component";
    import { state } from "../core/decorators";
    import { t } from "../services/i18n";

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ INIT ════════════════════════════════════════╗

    // Blah Blah Style Map
    const bb_ = {
        container: 'bb_tabbedview',

        header: 'bb_tabbedviewHeader',

        tab: {
            base: 'bb_tabbedviewTab',
            active: 'bb_tabbedviewTab--active',
            disabled: 'bb_tabbedviewTab--disabled',
            badge: 'bb_tabbedviewBadge',
        },

        content: {
            container: 'bb_tabbedviewContent',
            emptyState: 'bb_tabbedviewEmptyState',
            error: 'bb_tabbedviewError',
        }
    };

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TYPE ════════════════════════════════════════╗

    export type TabPosition = 'top' | 'left' | 'right';
    export type TabStyle = 'default' | 'pills' | 'minimal';

    export interface Tab {
        id: string;
        label: string;
        translateKey?: string;
        icon?: string;
        badge?: number | string;
        disabled?: boolean;
        component?: Component | (() => VNode);
        content?: VNode;
        onActivate?: () => void | Promise<void>;
    }

    export interface TabbedViewOptions {
        tabs: Tab[];
        defaultTab?: string;
        position?: TabPosition;
        style?: TabStyle;
        className?: string;
        headerClassName?: string;
        contentClassName?: string;
        showTabCount?: boolean;
        persistState?: boolean; // Save active tab to localStorage
        storageKey?: string; // Key for localStorage
        onChange?: (tabId: string) => void | Promise<void>;
    }

// ╚═══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

    export class TabbedView extends Component {

        // ────────────────────────────────── STATE ──────────────────────────────────

        // @ts-expect-error - TypeScript decorator limitation with class property types
        @state activeTabId: string = '';
        // @ts-expect-error - TypeScript decorator limitation with class property types
        @state tabs: Tab[] = [];
        // @ts-expect-error - TypeScript decorator limitation with class property types
        @state position: TabPosition = 'top';
        // @ts-expect-error - TypeScript decorator limitation with class property types
        @state style: TabStyle = 'default';
        // @ts-expect-error - TypeScript decorator limitation with class property types
        @state className: string = '';
        // @ts-expect-error - TypeScript decorator limitation with class property types
        @state headerClassName: string = '';
        // @ts-expect-error - TypeScript decorator limitation with class property types
        @state contentClassName: string = '';
        // @ts-expect-error - TypeScript decorator limitation with class property types
        @state showTabCount: boolean = false;
        // @ts-expect-error - TypeScript decorator limitation with class property types
        @state persistState: boolean = false;
        // @ts-expect-error - TypeScript decorator limitation with class property types
        @state storageKey: string = 'tabbedview-active';

        private currentTabComponent: Component | null = null;
        private onChange?: (tabId: string) => void | Promise<void>;

        // ────────────────────────────────── LIFECYCLE ──────────────────────────────

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

        // ────────────────────────────────── PUBLIC API ─────────────────────────────

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

        // ────────────────────────────────── RENDER ─────────────────────────────────

        render() {
            const containerClass = [
                bb_.container,
                `__tabbedview__--${this.position}`,
                `__tabbedview__--${this.style}`,
                this.className
            ].filter(Boolean).join(' ');

            return createElement('div', { className: containerClass },
                this.renderTabList(),
                this.renderTabContent()
            );
        }

        renderTabList() {
            const headerClass = [
                bb_.header,
                this.headerClassName
            ].filter(Boolean).join(' ');

            return createElement('div', { className: headerClass },
                ...this.tabs.map(tab => this.renderTab(tab))
            );
        }

        renderTab(tab: Tab) {
            const isActive = this.activeTabId === tab.id;

            const tabClass = [
                bb_.tab.base,
                isActive ? bb_.tab.active : '',
                tab.disabled ? bb_.tab.disabled : ''
            ].filter(Boolean).join(' ');

            const label = tab.translateKey ? t(tab.translateKey) : tab.label;

            return createElement('button', {
                key: tab.id,
                className: tabClass,
                onclick: () => this.setActiveTab(tab.id),
                disabled: tab.disabled,
                'data-translate': tab.translateKey,
                'aria-selected': isActive,
                role: 'tab'
            },
                tab.icon ? createElement('i', { className: tab.icon }) : null,
                createElement('span', {}, label),
                tab.badge !== undefined && tab.badge !== null && tab.badge !== 0 ?
                    createElement('span', { className: bb_.tab.badge },
                        typeof tab.badge === 'number' && tab.badge > 99 ? '99+' : String(tab.badge)
                    ) : null
            );
        }

        renderTabContent() {
            const contentClass = [
                bb_.content.container,
                this.contentClassName
            ].filter(Boolean).join(' ');

            const activeTab = this.getActiveTab();
            if (!activeTab) {
                return createElement('div', { className: contentClass },
                    createElement('div', { className: bb_.content.emptyState },
                        createElement('p', {}, 'No tab selected')
                    )
                );
            }

            return createElement('div', {
                className: contentClass,
                role: 'tabpanel'
            },
                this.renderActiveTabContent(activeTab)
            );
        }

        renderActiveTabContent(tab: Tab) {
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
                                    (this.currentTabComponent as any)._element = el;
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

                        return wrappedVNode;
                    }

                    // Check if it's a function
                    if (typeof tab.component === 'function') {
                        const ComponentClass = tab.component as any;

                        // Check if it's a Component class (has prototype.render)
                        if (ComponentClass.prototype && typeof ComponentClass.prototype.render === 'function') {
                            // It's a Component class - create new instance
                            if (!this.currentTabComponent) {
                                this.currentTabComponent = new ComponentClass();

                                // Schedule onMount
                                if (this.currentTabComponent && typeof this.currentTabComponent.onMount === 'function') {
                                    setTimeout(() => {
                                        if (this.currentTabComponent && typeof this.currentTabComponent.onMount === 'function') {
                                            this.currentTabComponent.onMount();
                                        }
                                    }, 0);
                                }
                            }

                            return this.currentTabComponent!.render();
                        } else {
                            // It's a function returning VNode
                            return ComponentClass();
                        }
                    }
                } catch (error) {
                    console.error('Error rendering tab component:', error);
                    return createElement('div', { className: bb_.content.error },
                        'Error rendering tab content'
                    );
                }
            }

            // If tab has direct content VNode
            if (tab.content) {
                return tab.content;
            }

            // Fallback
            return createElement('div', { className: bb_.content.emptyState },
                createElement('p', {}, 'No content available')
            );
        }
    }

// ╚═══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ GLOBAL ═══════════════════════════════════════╗

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