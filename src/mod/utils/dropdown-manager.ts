// src/mod/utils/intersection-observer.ts
//
// Made with ❤️ by Maysara.



// ╔════════════════════════════════════════ TYPE ════════════════════════════════════════╗

    type DropdownId = string;

    interface DropdownConfig {
        id: DropdownId;
        element: HTMLElement;
        parentId?: DropdownId;  // Parent dropdown ID for hierarchy
        onOpen?: () => void;
        onClose?: () => void;
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

    export class DropdownManager {
        private static instance: DropdownManager;
        private dropdowns = new Map<DropdownId, DropdownConfig>();
        private openDropdowns = new Set<DropdownId>();  // Track ALL open dropdowns, not just one
        private clickHandler?: EventListener;

        private constructor() {
            this.setupGlobalClickHandler();
        }

        /**
         * Get singleton instance
         */
        public static getInstance(): DropdownManager {
            if (!DropdownManager.instance) {
                DropdownManager.instance = new DropdownManager();
            }
            return DropdownManager.instance;
        }

        /**
         * Register a dropdown
         */
        public register(id: DropdownId, element: HTMLElement, callbacks?: { onOpen?: () => void; onClose?: () => void }, parentId?: DropdownId): void {
            this.dropdowns.set(id, {
                id,
                element,
                parentId,
                onOpen: callbacks?.onOpen,
                onClose: callbacks?.onClose
            });
        }

        /**
         * Unregister a dropdown
         */
        public unregister(id: DropdownId): void {
            if (this.openDropdowns.has(id)) {
                this.closeDropdown(id);
            }
            this.dropdowns.delete(id);
        }

        /**
         * Open a dropdown and close all others (except parent chain and children)
         */
        public openDropdown(id: DropdownId): void {
            const config = this.dropdowns.get(id);
            if (!config) {
                console.warn('DropdownManager: Dropdown not registered:', id);
                return;
            }

            // If already open, just return
            if (this.openDropdowns.has(id)) {
                return;
            }

            // Get parent chain for this dropdown
            const parentChain = this.getParentChain(id);

            // Collect IDs to close (don't modify set while iterating)
            const toClose: DropdownId[] = [];
            for (const openId of this.openDropdowns) {
                const openConfig = this.dropdowns.get(openId);
                if (!openConfig) continue;

                // Keep it open if it's in the parent chain
                if (parentChain.includes(openId)) continue;

                // Keep it open if it's a child of the one we're opening
                if (this.getParentChain(openId).includes(id)) continue;

                // Otherwise mark for closing (all others including siblings)
                toClose.push(openId);
            }

            // Close collected dropdowns
            for (const closeId of toClose) {
                this.closeDropdown(closeId);
            }

            // Add this dropdown to open set and call onOpen callback
            this.openDropdowns.add(id);
            if (config.onOpen) {
                config.onOpen();
            }
        }

        /**
         * Get the parent chain for a dropdown (including itself)
         */
        private getParentChain(id: DropdownId): DropdownId[] {
            const chain: DropdownId[] = [id];
            let currentId: DropdownId | undefined = id;

            while (currentId) {
                const config = this.dropdowns.get(currentId);
                if (config?.parentId) {
                    chain.push(config.parentId);
                    currentId = config.parentId;
                } else {
                    break;
                }
            }

            return chain;
        }

        /**
         * Close a specific dropdown and any children it has
         */
        public closeDropdown(id: DropdownId): void {
            if (!this.openDropdowns.has(id)) {
                return;
            }

            // Close any child dropdowns first (recursively)
            const childrenToClose: DropdownId[] = [];
            for (const openId of this.openDropdowns) {
                const openConfig = this.dropdowns.get(openId);
                if (openConfig?.parentId === id) {
                    childrenToClose.push(openId);
                }
            }

            // Close all children first
            for (const childId of childrenToClose) {
                this.closeDropdown(childId);
            }

            // Now close this dropdown and call onClose callback
            this.openDropdowns.delete(id);
            const config = this.dropdowns.get(id);
            if (config?.onClose) {
                config.onClose();
            }
        }

        /**
         * Close all open dropdowns
         */
        public closeAllDropdowns(): void {
            if (this.openDropdowns.size === 0) {
                return;
            }
            
            // Get all currently open dropdowns (make a copy to avoid modification during iteration)
            const toClose = Array.from(this.openDropdowns);
            
            // Close top-level dropdowns (ones without parents that are open)
            for (const id of toClose) {
                const config = this.dropdowns.get(id);
                const parentInOpen = config?.parentId && this.openDropdowns.has(config.parentId);
                
                // Only close top-level dropdowns (those whose parents aren't open)
                if (!parentInOpen) {
                    this.closeDropdown(id);
                }
            }
        }

        /**
         * Check if a dropdown is open
         */
        public isOpen(id: DropdownId): boolean {
            return this.openDropdowns.has(id);
        }

        /**
         * Check if any dropdown is open
         */
        public isAnyOpen(): boolean {
            return this.openDropdowns.size > 0;
        }

        /**
         * Setup global click handler to close dropdowns when clicking outside
         */
        private setupGlobalClickHandler(): void {
            this.clickHandler = (event: Event) => {
                const target = event.target as HTMLElement;

                // Check if clicking on any dropdown element (including nested ones)
                for (const [, config] of this.dropdowns) {
                    if (config.element.contains(target)) {
                        // Clicked inside this dropdown, don't close any
                        return;
                    }
                }

                // Close all dropdowns if clicking outside all of them
                this.closeAllDropdowns();
            };

            // Use bubble phase (false), not capture phase
            document.addEventListener('click', this.clickHandler, false);
        }

        /**
         * Cleanup - removes global click handler
         */
        public destroy(): void {
            if (this.clickHandler) {
                document.removeEventListener('click', this.clickHandler, false);
                this.clickHandler = undefined;
            }
            this.dropdowns.clear();
            this.openDropdowns.clear();
        }
    }

    /**
     * Convenience function to get dropdown manager instance
     */
    export function getDropdownManager(): DropdownManager {
        return DropdownManager.getInstance();
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝
