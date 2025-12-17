// src/mod/components/dropdown.ts
//
// Made with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import { createElement as h, VNode, VNodeChild } from "@je-es/vdom";
    import { Component } from "../core/component";

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TYPE ════════════════════════════════════════╗

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
            element?: () => unknown;
            className?: string;
        };
        items: (DropdownItemConfig | 'divider')[];
        position?: 'left' | 'right';
        parentId?: string; // For nested dropdowns - ID of parent dropdown
        closeOnItemClick?: boolean; // Default: true
        preventAutoClose?: boolean; // Prevent closing when clicking inside menu (for interactive content)
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
     * - Clicking inside a dropdown with preventAutoClose keeps it open
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
         * Open dropdown and close siblings (but not ancestors or descendants)
         */
        public open(id: string): void {
            const dropdown = this.dropdowns.get(id);
            if (!dropdown) return;

            // console.log(`📂 Opening dropdown: ${id}`);

            // Close siblings (dropdowns at same level, excluding this one)
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

            // console.log(`📁 Closing dropdown: ${id}`);

            // Close this dropdown
            dropdown.setOpen(false);

            // Close all children
            this.closeChildren(id);
        }

        /**
         * Close all dropdowns
         */
        public closeAll(): void {
            // console.log('🗂️ Closing all dropdowns');
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
         * Check if dropdown is descendant of another
         */
        private isDescendant(descendantId: string, ancestorId: string): boolean {
            return this.isAncestor(ancestorId, descendantId);
        }

        /**
         * Get all ancestor IDs of a dropdown (parent, grandparent, etc.)
         */
        private getAncestors(id: string): Set<string> {
            const ancestors = new Set<string>();
            let currentId: string | undefined = id;

            while (currentId) {
                const parentId = this.hierarchy.get(currentId);
                if (parentId) {
                    ancestors.add(parentId);
                    currentId = parentId;
                } else {
                    break;
                }
            }

            return ancestors;
        }

        /**
         * ✨ NEW: Get all descendant IDs of a dropdown (children, grandchildren, etc.)
         */
        private getDescendants(id: string): Set<string> {
            const descendants = new Set<string>();

            const addChildren = (parentId: string) => {
                // Find all direct children
                const children = Array.from(this.hierarchy.entries())
                    .filter(([_, parent]) => parent === parentId)
                    .map(([childId, _]) => childId);

                // Add each child and recursively add their children
                children.forEach(childId => {
                    descendants.add(childId);
                    addChildren(childId); // Recursive call for grandchildren
                });
            };

            addChildren(id);
            return descendants;
        }

        /**
         * Close siblings (dropdowns at same hierarchy level)
         */
        private closeSiblings(id: string): void {
            const dropdown = this.dropdowns.get(id);
            if (!dropdown) return;

            const parentId = dropdown.config.parentId;

            // Get all dropdowns with same parent (siblings)
            const siblings = Array.from(this.dropdowns.values())
                .filter(d => d.config.parentId === parentId && d.config.id !== id);

           // console.log(`👥 Closing ${siblings.length} siblings of ${id}`);
            siblings.forEach(sibling => this.close(sibling.config.id));
        }

        /**
         * Close all children of a dropdown
         */
        private closeChildren(parentId: string): void {
            const children = Array.from(this.dropdowns.values())
                .filter(d => d.config.parentId === parentId);

           // console.log(`👶 Closing ${children.length} children of ${parentId}`);
            children.forEach(child => this.close(child.config.id));
        }

        /**
         * Check if there are any open dropdowns
         */
        private hasOpenDropdowns(): boolean {
            return Array.from(this.dropdowns.values()).some(d => d.isOpen);
        }

        /**
         * Find which dropdown an element belongs to (including nested)
         */
        private findDropdownForElement(element: HTMLElement): string | null {
            // Walk up the DOM tree looking for dropdown containers
            let current: HTMLElement | null = element;

            while (current && current !== document.body) {
                const dropdownId = current.getAttribute('data-dropdown-id');
                if (dropdownId) {
                    return dropdownId;
                }
                current = current.parentElement;
            }

            return null;
        }

        /**
         * Setup global click handler
         */
        private setupGlobalClickHandler(): void {
            if (typeof window === 'undefined') return;

            this.clickHandler = (e: Event) => {
                const target = e.target as HTMLElement;

               // console.log('🖱️ Global click detected');

                // No dropdowns open? Nothing to do
                if (!this.hasOpenDropdowns()) {
                   // console.log('  → No open dropdowns, ignoring');
                    return;
                }

                // Find which dropdown (if any) was clicked
                const clickedDropdownId = this.findDropdownForElement(target);

                if (!clickedDropdownId) {
                    // Clicked completely outside all dropdowns - close all
                   // console.log('  → Clicked outside all dropdowns, closing all');
                    this.closeAll();
                    return;
                }

               // console.log(`  → Clicked inside dropdown: ${clickedDropdownId}`);

                // Check if clicked dropdown has preventAutoClose
                const clickedDropdown = this.dropdowns.get(clickedDropdownId);
                if (clickedDropdown?.config.preventAutoClose) {
                   // console.log('  → Dropdown has preventAutoClose, keeping open');
                    return;
                }

                // Check if clicked on a trigger button (to let toggle handle it)
                const clickedOnTrigger = target.closest('.bb_dropdownTrigger');
                if (clickedOnTrigger) {
                   // console.log('  → Clicked on trigger, letting toggle handle it');
                    return;
                }

                // Clicked inside a dropdown menu but not on trigger
                const clickedOnMenu = target.closest('.bb_dropdownMenu');
                if (clickedOnMenu) {
                    // Get ancestors of clicked dropdown
                    const ancestors = this.getAncestors(clickedDropdownId);

                    // ✨ FIX: Get all descendants too
                    const descendants = this.getDescendants(clickedDropdownId);

                    // Close all dropdowns that are NOT:
                    // 1. The clicked dropdown itself
                    // 2. Ancestors of the clicked dropdown (parents)
                    // 3. Descendants of the clicked dropdown (children) ✨ NEW
                    const rootDropdowns = Array.from(this.dropdowns.values())
                        .filter(d => !d.config.parentId);

                    rootDropdowns.forEach(rootDropdown => {
                        const rootId = rootDropdown.config.id;

                    // Keep open if:
                    // - This is the clicked dropdown
                    // - This is an ancestor of the clicked dropdown
                    // - The clicked dropdown is an ancestor of this one (descendant)
                    const shouldKeepOpen =
                        rootId === clickedDropdownId ||
                        ancestors.has(rootId) ||
                        descendants.has(rootId) || // ✨ NEW: Keep descendants open
                        this.isDescendant(clickedDropdownId, rootId);

                        if (!shouldKeepOpen) {
                           // console.log(`  → Closing unrelated dropdown: ${rootId}`);
                            this.close(rootId);
                        } else {
                           // console.log(`  → Keeping related dropdown open: ${rootId}`);
                        }
                    });
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
                preventAutoClose: false,
                ...config
            };
        }

        onMount() {
            this.mounted = true;
            dropdownManager.register(this);
           // console.log(`✅ Dropdown mounted: ${this.config.id}`);
        }

        onUnmount() {
            this.mounted = false;
            dropdownManager.unregister(this.config.id);
           // console.log(`🛑 Dropdown unmounted: ${this.config.id}`);
        }

        /**
         * Public method to set open state (called by manager)
         */
        public setOpen(open: boolean) {
           // console.log(`🔄 Dropdown ${this.config.id} setOpen(${open}), current: ${this.isOpen}`);

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
                this.element.classList.add('bb_dropdown--open');
            } else {
                this.element.classList.remove('bb_dropdown--open');
            }

            // Find the menu container (next sibling of trigger)
            const trigger = this.element.querySelector('.bb_dropdownTrigger');
            const menuContainer = trigger?.nextElementSibling;

            if (this.isOpen) {
                // Create and append menu if it doesn't exist
                if (!menuContainer || !menuContainer.classList.contains('bb_dropdownMenu')) {
                    const menuVNode = this.renderMenu();
                    const menuElement = this.createElementFromVNode(menuVNode);
                    this.element.appendChild(menuElement);
                }
            } else {
                // Remove menu if it exists
                if (menuContainer && menuContainer.classList.contains('bb_dropdownMenu')) {
                    menuContainer.remove();
                }
            }
        }

        /**
         * Create DOM element from VNode (simplified version)
         */
        private createElementFromVNode(vnode: VNode): HTMLElement {
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
                    vnode.children.forEach((child: VNodeChild) => {
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

           // console.log(`🖱️ Dropdown ${this.config.id} toggle clicked, current state: ${this.isOpen}`);

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

           // console.log(`🎯 Item clicked in dropdown ${this.config.id}:`, item.label);

            // Don't prevent propagation - let it bubble up
            // But stop it if we're going to close
            if (this.config.closeOnItemClick) {
                e.preventDefault();
                e.stopPropagation();
                dropdownManager.close(this.config.id);
            }

            // Call item's onclick handler
            item.onclick?.(e);
        }

        render() {
           // console.log(`🎨 Dropdown ${this.config.id} render(), isOpen: ${this.isOpen}`);

            const trigger = this.renderTrigger();
            const menu = this.isOpen ? this.renderMenu() : null;

            return h('div', {
                className: `bb_dropdown bb_dropdown--${this.config.position || 'left'} ${this.isOpen ? 'bb_dropdown--open' : ''}`,
                'data-dropdown-id': this.config.id
            },
                trigger,
                menu
            );
        }

        private renderTrigger() {
            const customElement = this.config.trigger.element?.() as VNodeChild;

            const triggerClassName = [
                'bb_dropdownTrigger',
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
                    className: `bb_dropdownArrow fas fa-chevron-down ${this.isOpen ? 'bb_dropdownArrow--open' : ''}`
                })
            );
        }

        private renderMenu() {
            return h('div', {
                className: 'bb_dropdownMenu',
                onclick: (e: Event) => {
                    // Only stop propagation if preventAutoClose is true
                    if (this.config.preventAutoClose) {
                        e.stopPropagation();
                    }
                }
            },
                this.config.items.map((item, index) => {
                    if (item === 'divider') {
                        return h('div', {
                            className: 'bb_dropdown__divider',
                            key: `divider-${index}`
                        });
                    }

                    const itemClassName = [
                        'bb_dropdownItem',
                        item.className || '',
                        item.disabled ? 'bb_dropdownItem--disabled' : '',
                        item.selected ? 'bb_dropdownItem--selected' : ''
                    ].filter(Boolean).join(' ');

                    const buttonProps: {
                        key: string;
                        className: string;
                        onclick: (e: Event) => void;
                        disabled?: boolean;
                    } = {
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