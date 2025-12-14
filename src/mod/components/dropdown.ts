/* eslint-disable @typescript-eslint/no-explicit-any */
// src/mod/components/dropdown.ts
//
// Made with ❤️ by Maysara.



// ╔════════════════════════════════════════ TYPE ════════════════════════════════════════╗

    import { createElement as h } from "@je-es/vdom";
    import { Component } from "../core/component";
    // import { state } from "../core/decorators";

    export interface DropdownItemConfig {
        id?: string;
        icon?: string;
        label: string;
        onclick?: (e: Event) => void;
        className?: string;
        disabled?: boolean;
        selected?: boolean;
    }

    export interface DropdownConfig {
        id: string;
        trigger: {
            text?: string;
            icon?: string;
            element?: () => any;
            className?: string;
        };
        items: (DropdownItemConfig | 'divider')[];
        position?: 'left' | 'right';
        parentId?: string; // For nested dropdowns - ID of parent dropdown
        closeOnItemClick?: boolean; // Default: true
        onOpen?: () => void;
        onClose?: () => void;
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ MANAGER ════════════════════════════════════╗

    /**
     * Global dropdown manager - handles hierarchical dropdown system
     * - Only one root dropdown open at a time
     * - Child dropdowns can be open while parent is open
     * - Clicking outside closes all dropdowns
     */
    class DropdownManagerSingleton {
        private static instance: DropdownManagerSingleton;
        private dropdowns = new Map<string, Dropdown>(); // id -> dropdown instance
        private hierarchy = new Map<string, string>(); // childId -> parentId
        private clickHandler?: EventListener;

        private constructor() {
            this.setupGlobalClickHandler();
        }

        static getInstance(): DropdownManagerSingleton {
            if (!DropdownManagerSingleton.instance) {
                DropdownManagerSingleton.instance = new DropdownManagerSingleton();
            }
            return DropdownManagerSingleton.instance;
        }

        /**
         * Register dropdown
         */
        public register(dropdown: Dropdown): void {
            this.dropdowns.set(dropdown.config.id, dropdown);

            // Register hierarchy if has parent
            if (dropdown.config.parentId) {
                this.hierarchy.set(dropdown.config.id, dropdown.config.parentId);
            }
        }

        /**
         * Unregister dropdown
         */
        public unregister(id: string): void {
            this.dropdowns.delete(id);
            this.hierarchy.delete(id);
        }

        /**
         * Open dropdown and close others at same level
         */
        public open(id: string): void {
            const dropdown = this.dropdowns.get(id);
            if (!dropdown) return;

            // Close siblings (dropdowns at same level)
            this.closeSiblings(id);

            // Actually open the dropdown
            dropdown.setOpen(true);
        }

        /**
         * Close dropdown and all its children
         */
        public close(id: string): void {
            const dropdown = this.dropdowns.get(id);
            if (!dropdown) return;

            // Close this dropdown
            dropdown.setOpen(false);

            // Close all children
            this.closeChildren(id);
        }

        /**
         * Close all dropdowns
         */
        public closeAll(): void {
            // Close all root dropdowns (those without parents)
            const rootDropdowns = Array.from(this.dropdowns.values())
                .filter(d => !d.config.parentId);

            rootDropdowns.forEach(d => this.close(d.config.id));
        }

        /**
         * Check if dropdown is ancestor of another
         */
        private isAncestor(ancestorId: string, descendantId: string): boolean {
            let currentId: string | undefined = descendantId;

            while (currentId) {
                if (currentId === ancestorId) return true;
                currentId = this.hierarchy.get(currentId);
            }

            return false;
        }

        /**
         * Close siblings (dropdowns at same hierarchy level)
         */
        private closeSiblings(id: string): void {
            const dropdown = this.dropdowns.get(id);
            if (!dropdown) return;

            const parentId = dropdown.config.parentId;

            // Get all dropdowns with same parent
            const siblings = Array.from(this.dropdowns.values())
                .filter(d => d.config.parentId === parentId && d.config.id !== id);

            siblings.forEach(sibling => this.close(sibling.config.id));
        }

        /**
         * Close all children of a dropdown
         */
        private closeChildren(parentId: string): void {
            const children = Array.from(this.dropdowns.values())
                .filter(d => d.config.parentId === parentId);

            children.forEach(child => this.close(child.config.id));
        }

        /**
         * Check if there are any open dropdowns
         */
        private hasOpenDropdowns(): boolean {
            return Array.from(this.dropdowns.values()).some(d => d.isOpen);
        }

        /**
         * Setup global click handler
         */
        private setupGlobalClickHandler(): void {
            if (typeof window === 'undefined') return;

            this.clickHandler = (e: Event) => {
                const target = e.target as HTMLElement;

                // Find closest dropdown container (either trigger or menu)
                const dropdownContainer = target.closest('[data-dropdown-id]');

                // Find closest dropdown trigger button
                const dropdownTrigger = target.closest('.je-es-dropdown__trigger');

                // Find closest dropdown menu
                const dropdownMenu = target.closest('.je-es-dropdown__menu');

                // CRITICAL FIX: Only close dropdowns if:
                // 1. There are open dropdowns
                // 2. Click is OUTSIDE all dropdown-related elements
                if (!this.hasOpenDropdowns()) {
                    // No dropdowns open, nothing to do
                    return;
                }

                if (dropdownTrigger || dropdownMenu) {
                    // Clicked inside a dropdown trigger or menu - let the dropdown handle it
                    // Don't close other dropdowns here
                    return;
                }

                if (dropdownContainer) {
                    // Clicked somewhere inside a dropdown container (but not trigger/menu)
                    const clickedId = dropdownContainer.getAttribute('data-dropdown-id');

                    // Close all dropdowns that are not ancestors of clicked dropdown
                    const rootDropdowns = Array.from(this.dropdowns.values())
                        .filter(d => !d.config.parentId);

                    rootDropdowns.forEach(rootDropdown => {
                        // Keep open if clicked dropdown is descendant
                        if (clickedId && !this.isAncestor(rootDropdown.config.id, clickedId)) {
                            this.close(rootDropdown.config.id);
                        }
                    });
                } else {
                    // Clicked completely outside all dropdowns - close all
                    this.closeAll();
                }
            };

            document.addEventListener('click', this.clickHandler, true);
        }

        public destroy(): void {
            if (this.clickHandler && typeof window !== 'undefined') {
                document.removeEventListener('click', this.clickHandler, true);
            }
            this.dropdowns.clear();
            this.hierarchy.clear();
        }
    }

    const dropdownManager = DropdownManagerSingleton.getInstance();

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

    export class Dropdown extends Component {
        public config: DropdownConfig;
        // DON'T use @state - manage isOpen manually to avoid parent re-renders
        public isOpen = false;
        private mounted = false;

        constructor(config: DropdownConfig) {
            super();
            this.config = {
                closeOnItemClick: true,
                ...config
            };
        }

        onMount() {
            this.mounted = true;
            dropdownManager.register(this);
            console.log(`✅ Dropdown mounted: ${this.config.id}`);
        }

        onUnmount() {
            this.mounted = false;
            dropdownManager.unregister(this.config.id);
            console.log(`🛑 Dropdown unmounted: ${this.config.id}`);
        }

        /**
         * Public method to set open state (called by manager)
         */
        public setOpen(open: boolean) {
            console.log(`🔄 Dropdown ${this.config.id} setOpen(${open}), current: ${this.isOpen}`);

            if (this.isOpen === open) return;

            this.isOpen = open;

            if (open) {
                this.config.onOpen?.();
            } else {
                this.config.onClose?.();
            }

            // Manually update DOM instead of triggering Component.update()
            this.updateDOM();
        }

        /**
         * Manually update the dropdown's DOM without triggering parent re-renders
         */
        private updateDOM() {
            if (!this.mounted || !this.element) return;

            // Update the container class
            if (this.isOpen) {
                this.element.classList.add('je-es-dropdown--open');
            } else {
                this.element.classList.remove('je-es-dropdown--open');
            }

            // Find the menu container (next sibling of trigger)
            const trigger = this.element.querySelector('.je-es-dropdown__trigger');
            const menuContainer = trigger?.nextElementSibling;

            if (this.isOpen) {
                // Create and append menu if it doesn't exist
                if (!menuContainer || !menuContainer.classList.contains('je-es-dropdown__menu')) {
                    const menuVNode = this.renderMenu();
                    const menuElement = this.createElementFromVNode(menuVNode);
                    this.element.appendChild(menuElement);
                }
            } else {
                // Remove menu if it exists
                if (menuContainer && menuContainer.classList.contains('je-es-dropdown__menu')) {
                    menuContainer.remove();
                }
            }
        }

        /**
         * Create DOM element from VNode (simplified version)
         */
        private createElementFromVNode(vnode: any): HTMLElement {
            if (typeof vnode.type === 'string') {
                const element = document.createElement(vnode.type);

                // Set properties
                if (vnode.props) {
                    Object.entries(vnode.props).forEach(([key, value]) => {
                        if (key === 'className') {
                            element.className = value as string;
                        } else if (key === 'onclick' && typeof value === 'function') {
                            element.addEventListener('click', value as EventListener);
                        } else if (key !== 'children' && key !== 'key') {
                            element.setAttribute(key, String(value));
                        }
                    });
                }

                // Add children
                if (vnode.children) {
                    vnode.children.forEach((child: any) => {
                        if (child === null || child === undefined) return;
                        if (typeof child === 'string' || typeof child === 'number') {
                            element.appendChild(document.createTextNode(String(child)));
                        } else if (typeof child === 'object') {
                            element.appendChild(this.createElementFromVNode(child));
                        }
                    });
                }

                return element;
            }

            return document.createElement('div');
        }

        /**
         * Toggle dropdown
         */
        toggle(e: Event) {
            e.preventDefault();
            e.stopPropagation();

            console.log(`🖱️ Dropdown ${this.config.id} toggle clicked, current state: ${this.isOpen}`);

            if (this.isOpen) {
                dropdownManager.close(this.config.id);
            } else {
                dropdownManager.open(this.config.id);
            }
        }

        /**
         * Handle item click
         */
        handleItemClick(item: DropdownItemConfig, e: Event) {
            if (item.disabled) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }

            e.preventDefault();
            e.stopPropagation();

            // Close dropdown if configured to do so
            if (this.config.closeOnItemClick) {
                dropdownManager.close(this.config.id);
            }

            // Call item's onclick handler
            item.onclick?.(e);
        }

        render() {
            console.log(`🎨 Dropdown ${this.config.id} render(), isOpen: ${this.isOpen}`);

            const trigger = this.renderTrigger();
            const menu = this.isOpen ? this.renderMenu() : null;

            return h('div', {
                className: `je-es-dropdown je-es-dropdown--${this.config.position || 'left'} ${this.isOpen ? 'je-es-dropdown--open' : ''}`,
                'data-dropdown-id': this.config.id
            },
                trigger,
                menu
            );
        }

        private renderTrigger() {
            const customElement = this.config.trigger.element?.();

            const triggerClassName = [
                'je-es-dropdown__trigger',
                this.config.trigger.className || ''
            ].filter(Boolean).join(' ');

            if (customElement) {
                return h('button', {
                    className: triggerClassName,
                    onclick: (e: Event) => this.toggle(e)
                },
                    customElement
                );
            }

            return h('button', {
                className: triggerClassName,
                onclick: (e: Event) => this.toggle(e)
            },
                this.config.trigger.icon ? h('i', { className: this.config.trigger.icon }) : null,
                this.config.trigger.text ? h('span', {}, this.config.trigger.text) : null,
                h('i', {
                    className: `je-es-dropdown__arrow fas fa-chevron-down ${this.isOpen ? 'je-es-dropdown__arrow--open' : ''}`
                })
            );
        }

        private renderMenu() {
            return h('div', {
                className: 'je-es-dropdown__menu',
                onclick: (e: Event) => {
                    // Prevent clicks in menu from closing parent
                    e.stopPropagation();
                }
            },
                this.config.items.map((item, index) => {
                    if (item === 'divider') {
                        return h('div', {
                            className: 'je-es-dropdown__divider',
                            key: `divider-${index}`
                        });
                    }

                    const itemClassName = [
                        'je-es-dropdown__item',
                        item.className || '',
                        item.disabled ? 'je-es-dropdown__item--disabled' : '',
                        item.selected ? 'je-es-dropdown__item--selected' : ''
                    ].filter(Boolean).join(' ');

                    const buttonProps: any = {
                        key: item.id || `item-${index}`,
                        className: itemClassName,
                        onclick: (e: Event) => this.handleItemClick(item, e)
                    };

                    // Only add disabled attribute if actually true
                    if (item.disabled) {
                        buttonProps.disabled = true;
                    }

                    return h('button', buttonProps,
                        item.icon ? h('i', { className: item.icon }) : null,
                        h('span', {}, item.label)
                    );
                })
            );
        }
    }

    /**
     * Create a dropdown instance
     */
    export function createDropdown(config: DropdownConfig): Dropdown {
        return new Dropdown(config);
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝