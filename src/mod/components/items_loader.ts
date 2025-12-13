/* eslint-disable @typescript-eslint/no-explicit-any */
// src/frontend/app/gui/layout/items_loader.ts
//
// Made with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import { createDOMElement, createElement } from "@je-es/vdom";
    import { Component } from "../core/component";
    import { t } from "../services/i18n";

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ INIT ════════════════════════════════════════╗

    // Blah Blah Style Map
    const bb_ = {
        container: 'bb_itemsLoaderContainer',
        list: 'bb_itemsLoaderList',
        searchbar: 'bb_itemsLoaderSearchbar',
        loading: 'bb_itemsLoaderLoading',
        error: 'bb_itemsLoaderError',
        trigger: 'bb_itemsLoaderTrigger',
        end: 'bb_itemsLoaderEnd',
        emptyState: 'bb_tabbedviewEmptyState',
        button: 'bb_btn',
    };

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

    export interface ItemsLoaderConfig<T> {
        fetchUrl: string | ((page: number, filters: Record<string, any>) => string);
        renderItem: (item: T, index: number) => HTMLElement;
        pageSize?: number;
        emptyStateConfig?: {
            icon: string;
            title: string;
            description: string;
        };
        loadMoreText?: string;
        loadingText?: string;
        errorText?: string;
        containerClassName?: string;
        itemClassName?: string;
        filters?: Record<string, any>;
        onFiltersChange?: (filters: Record<string, any>) => void;
        onItemClick?: (item: T, index: number) => void;
        onLoadMore?: (page: number, items: T[]) => void;
        onError?: (error: Error) => void;
        initialItems?: T[];
        extractItems?: (response: any) => T[];
        extractTotal?: (response: any) => number;
        getAuthToken?: () => string | null;
        enableInfiniteScroll?: boolean;
        scrollThreshold?: number;
        enableSearch?: boolean;
        searchPlaceholder?: string;
        searchFilterKey?: string;
        searchDebounceMs?: number;
    }

    interface LoadState {
        loading: boolean;
        error: string | null;
        hasMore: boolean;
        page: number;
        total: number;
    }

    export class ItemsLoader<T = any> extends Component {
        items: T[] = [];
        loadState: LoadState = {
            loading: false,
            error: null,
            hasMore: true,
            page: 0,
            total: 0
        };
        filters: Record<string, any> = {};

        public config!: ItemsLoaderConfig<T>;
        private scrollContainer: HTMLElement | null = null;
        private loadMoreObserver: IntersectionObserver | null = null;
        private currentLoadMoreTrigger: Element | null = null;
        private isUpdating: boolean = false;
        private observerReconnectAttempts: number = 0;
        private maxObserverAttempts: number = 5;
        private itemsListContainer: HTMLElement | null = null;
        private searchInput: HTMLInputElement | null = null;
        private searchDebounceTimer: NodeJS.Timeout | null = null;

        initialize(config: ItemsLoaderConfig<T>) {

            this.config = {
                pageSize: 10,
                loadMoreText: 'Load More',
                loadingText: 'Loading...',
                errorText: 'Failed to load items',
                containerClassName: bb_.container,
                itemClassName: '__itemsLoader-item',
                enableInfiniteScroll: true,
                scrollThreshold: 200,
                enableSearch: false,
                searchPlaceholder: 'Search...',
                searchFilterKey: 'search',
                searchDebounceMs: 300,
                extractItems: (response) => response.notifications || response.items || response.data || [],
                extractTotal: (response) => response.total || response.count || 0,
                ...config
            };

            if (this.config.filters) {
                this.filters = { ...this.config.filters };
            }

            if (this.config.initialItems) {
                this.items = [...this.config.initialItems];
            }
        }

        async onMount() {
            if (this.items.length === 0) {
                await this.loadMore();
            }

            if (this.config.enableInfiniteScroll) {
                this.setupInfiniteScroll();
            }

            if (this.config.scrollThreshold) {
                this.setupScrollListener();
            }
        }

        onUnmount() {
            this.disconnectObserver();
            if (this.scrollContainer) {
                this.scrollContainer.removeEventListener('scroll', this.handleScroll);
                this.scrollContainer = null;
            }
        }

        async loadMore() {
            if (this.loadState.loading || !this.loadState.hasMore) {
                return;
            }

            try {
                this.loadState = { ...this.loadState, loading: true, error: null };
                // Don't call update() - instead show loading indicator directly
                this.updateLoadingState();

                const nextPage = this.loadState.page + 1;

                let url: string;
                if (typeof this.config.fetchUrl === 'function') {
                    url = this.config.fetchUrl(nextPage, this.filters);
                } else {
                    const separator = this.config.fetchUrl.includes('?') ? '&' : '?';
                    const params = new URLSearchParams({
                        page: nextPage.toString(),
                        limit: this.config.pageSize!.toString(),
                        ...this.filters
                    });
                    url = `${this.config.fetchUrl}${separator}${params}`;
                }

                const headers: HeadersInit = {
                    'Content-Type': 'application/json'
                };

                const token = this.config.getAuthToken?.();
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }

                const response = await fetch(url, {
                    credentials: 'include',
                    headers
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();

                const newItems = this.config.extractItems!(data);
                const total = this.config.extractTotal!(data);

                this.items = [...this.items, ...newItems];

                this.loadState = {
                    loading: false,
                    error: null,
                    hasMore: this.items.length < total,
                    page: nextPage,
                    total
                };

                // ✅ FIX: Update existing DOM instead of full re-render
                this.appendNewItems(newItems);

                // Reconnect observer
                this.observerReconnectAttempts = 0;
                this.reconnectObserver();

                this.config.onLoadMore?.(nextPage, this.items);

            } catch (error) {
                this.loadState = {
                    ...this.loadState,
                    loading: false,
                    error: error instanceof Error ? error.message : this.config.errorText!
                };
                // Show error and hide loading
                this.updateLoadingState();
                this.updateFooter();

                this.config.onError?.(error instanceof Error ? error : new Error('Unknown error'));
            }
        }

        async reload() {
            this.items = [];
            this.loadState = {
                loading: false,
                error: null,
                hasMore: true,
                page: 0,
                total: 0
            };
            await this.loadMore();
        }

        async applyFilters(newFilters: Record<string, any>) {
            if (this.isUpdating) {
                return;
            }

            this.isUpdating = true;
            this.filters = { ...newFilters };

            // ✅ Reset items and pagination when applying new filters
            this.items = [];
            this.loadState = {
                loading: true,
                error: null,
                hasMore: true,
                page: 0,
                total: 0
            };

            // Show loading indicator
            this.updateLoadingState();

            try {
                const url = typeof this.config.fetchUrl === 'function'
                    ? this.config.fetchUrl(1, this.filters)
                    : (() => {
                        const separator = this.config.fetchUrl.includes('?') ? '&' : '?';
                        const params = new URLSearchParams({
                            page: '1',
                            limit: this.config.pageSize!.toString(),
                            ...this.filters
                        });
                        return `${this.config.fetchUrl}${separator}${params}`;
                    })();

                const headers: HeadersInit = {
                    'Content-Type': 'application/json'
                };

                const token = this.config.getAuthToken?.();
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }

                const response = await fetch(url, {
                    credentials: 'include',
                    headers
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();

                const newItems = this.config.extractItems!(data);
                const total = this.config.extractTotal!(data);

                // Update state
                this.items = [...newItems];
                this.loadState = {
                    loading: false,
                    error: null,
                    hasMore: this.items.length < total,
                    page: 1,
                    total
                };

                // ✅ For filters, we need to clear the list and update
                // Clear the list container
                if (this.itemsListContainer) {
                    this.itemsListContainer.innerHTML = '';
                }

                // Clear old footer and empty state elements
                if (this.element) {
                    this.element.querySelectorAll(`${bb_.trigger}, ${bb_.end}, ${bb_.error}, ${bb_.loading}, ${bb_.emptyState}`).forEach(el => el.remove());
                }

                // If there are items after filter, append them
                if (this.items.length > 0) {
                    // Make sure list container is ready
                    if (!this.itemsListContainer) {
                        this.itemsListContainer = this.element?.querySelector(`.${bb_.list}`) as HTMLElement;
                    }

                    if (this.itemsListContainer) {
                        this.appendNewItems(this.items);
                    }
                } else {
                    // Show empty state - append to container, not list
                    if (this.config.emptyStateConfig && this.element) {
                        const emptyVNode = this.renderEmptyState();
                        const emptyElement = createDOMElement(emptyVNode);
                        this.element.appendChild(emptyElement);
                    }
                }

                // Re-establish container reference
                this.itemsListContainer = this.element?.querySelector(`.${bb_.list}`) as HTMLElement;
                this.observerReconnectAttempts = 0;
                this.reconnectObserver();

                this.config.onFiltersChange?.(this.filters);

            } catch (error) {
                this.loadState = {
                    ...this.loadState,
                    loading: false,
                    error: error instanceof Error ? error.message : this.config.errorText!
                };

                // Show error directly
                this.updateLoadingState();

                this.config.onError?.(error instanceof Error ? error : new Error('Unknown error'));
            } finally {
                this.isUpdating = false;
            }
        }

        async handleSearch(searchQuery: string) {
            // Clear existing debounce timer
            if (this.searchDebounceTimer) {
                clearTimeout(this.searchDebounceTimer);
            }

            // Set up new debounce timer
            this.searchDebounceTimer = setTimeout(async () => {
                const newFilters = { ...this.filters };

                if (searchQuery.trim()) {
                    newFilters[this.config.searchFilterKey!] = searchQuery.trim();
                } else {
                    delete newFilters[this.config.searchFilterKey!];
                }

                await this.applyFilters(newFilters);
            }, this.config.searchDebounceMs);
        }

        updateItems(updatedItems: T[]) {
            this.items = [...updatedItems];

            // Clear the list and re-append items instead of full re-render
            if (this.itemsListContainer) {
                this.itemsListContainer.innerHTML = '';
                this.appendNewItems(updatedItems);
            }
        }

        // ═══════════════════════════════════════════════════════════════════
        // DOM UPDATE HELPERS - ✅ NEW: Append without full re-render
        // ═══════════════════════════════════════════════════════════════════

        private appendNewItems(newItems: T[]) {
            // Ensure we have the list container reference
            if (!this.itemsListContainer) {
                this.itemsListContainer = this.element?.querySelector(`.${bb_.list}`) as HTMLElement;
            }

            if (!this.itemsListContainer) {
                return;
            }

            // Append new items to existing list
            const startIndex = this.items.length - newItems.length;
            newItems.forEach((item, index) => {
                const itemElement = this.config.renderItem(item, startIndex + index);

                if (this.config.onItemClick) {
                    itemElement.className = `${itemElement.className} ${this.config.itemClassName} clickable`;
                    itemElement.onclick = () => this.handleItemClick(item, startIndex + index);
                } else {
                    itemElement.className = `${itemElement.className} ${this.config.itemClassName}`;
                }

                this.itemsListContainer!.appendChild(itemElement);
            });

            // Update end message and trigger
            this.updateFooter();
        }

        private updateLoadingState() {
            const container = this.element?.querySelector(`.${bb_.container}`);
            if (!container) return;

            // Find or create loading indicator
            let loadingEl = container.querySelector(`.${bb_.loading}`) as HTMLElement;

            if (this.loadState.loading) {
                if (!loadingEl) {
                    loadingEl = this.renderLoading() as any;
                    container.appendChild(loadingEl);
                }
            } else {
                if (loadingEl) {
                    loadingEl.remove();
                }
            }
        }

        // ✅ PUBLIC: Update footer to show empty state, trigger, or end message
        public updateFooter() {
            // The container is what ItemsLoader renders as its root
            // So this.element points to the outermost div created by render()
            // which has className this.config.containerClassName (bb_itemsLoaderContainer)
            const container = this.element;
            if (!container) {
                return;
            }

            // Remove old footer elements AND empty state
            container.querySelectorAll(`.${bb_.trigger}, .${bb_.end}, .${bb_.emptyState}`).forEach(el => {
                el.remove();
            });

            // ✅ NEW: Show empty state if there are no items after loading
            if (this.items.length === 0 && !this.loadState.loading && this.config.emptyStateConfig) {
                const emptyVNode = this.renderEmptyState();
                const emptyElement = createDOMElement(emptyVNode);
                container.appendChild(emptyElement);
                return; // Don't add trigger/end message if showing empty state
            }

            // Add new footer elements
            if (this.loadState.hasMore && !this.loadState.loading && this.items.length > 0) {
                const triggerVNode = this.renderLoadMoreTrigger();
                const triggerElement = createDOMElement(triggerVNode);
                container.appendChild(triggerElement);
            }

            if (!this.loadState.hasMore && this.items.length > 0) {
                const endMsgVNode = this.renderEndMessage();
                const endMsgElement = createDOMElement(endMsgVNode);
                container.appendChild(endMsgElement);
            }
        }

        // ═══════════════════════════════════════════════════════════════════
        // INFINITE SCROLL SETUP
        // ═══════════════════════════════════════════════════════════════════

        private setupInfiniteScroll() {
            if (this.loadMoreObserver) {
                this.loadMoreObserver.disconnect();
            }

            this.loadMoreObserver = new IntersectionObserver(
                (entries) => {
                    const [entry] = entries;

                    if (entry.isIntersecting && !this.loadState.loading && this.loadState.hasMore) {
                        this.loadMore();
                    }
                },
                {
                    threshold: 0.1,
                    rootMargin: '50px'
                }
            );

            this.reconnectObserver();
        }

        private reconnectObserver() {

            if (!this.config.enableInfiniteScroll || !this.loadMoreObserver) {
                return;
            }

            if (this.currentLoadMoreTrigger) {
                this.loadMoreObserver.unobserve(this.currentLoadMoreTrigger);
                this.currentLoadMoreTrigger = null;
            }

            const tryObserve = () => {
                this.observerReconnectAttempts++;

                // Always look from the root element (this.element)
                const trigger = this.element?.querySelector('[data-load-more-trigger="true"]');

                if (trigger) {
                    this.loadMoreObserver!.observe(trigger);
                    this.currentLoadMoreTrigger = trigger;
                    this.observerReconnectAttempts = 0;
                    return true;
                }

                if (this.observerReconnectAttempts < this.maxObserverAttempts) {
                    const delay = [50, 100, 200, 300, 500][Math.min(this.observerReconnectAttempts - 1, 4)];
                    setTimeout(tryObserve, delay);
                } else {
                    this.observerReconnectAttempts = 0;
                }

                return false;
            };

            requestAnimationFrame(tryObserve);
        }

        private disconnectObserver() {
            if (this.loadMoreObserver && this.currentLoadMoreTrigger) {
                this.loadMoreObserver.unobserve(this.currentLoadMoreTrigger);
                this.currentLoadMoreTrigger = null;
            }
        }

        private setupScrollListener() {
            requestAnimationFrame(() => {
                // Try to find the scroll container - it should be the notifications loader div
                this.scrollContainer = this.element?.querySelector('[data-notifications-loader]') as HTMLElement;

                // If not found, try the element itself
                if (!this.scrollContainer) {
                    this.scrollContainer = this.element as HTMLElement;
                }

                if (this.scrollContainer) {
                    this.scrollContainer.addEventListener('scroll', this.handleScroll);
                }
            });
        }

        private handleScroll = () => {
            if (!this.scrollContainer || this.loadState.loading || !this.loadState.hasMore) {
                return;
            }

            const { scrollTop, scrollHeight, clientHeight } = this.scrollContainer;
            const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

            if (distanceFromBottom < this.config.scrollThreshold!) {
                this.loadMore();
            }
        };

        private handleItemClick = (item: T, index: number) => {
            this.config.onItemClick?.(item, index);
        };

        // ═══════════════════════════════════════════════════════════════════
        // RENDER
        // ═══════════════════════════════════════════════════════════════════

        render() {
            if (this.items.length === 0 && !this.loadState.loading && this.loadState.page > 0 && this.config.emptyStateConfig) {
                return this.renderEmptyState();
            }

            // ✅ Don't include HTMLElements in VNode tree. Instead, create empty containers
            // and populate them via DOM manipulation in appendNewItems()
            return createElement('div', {
                className: this.config.containerClassName
            },
                this.config.enableSearch ? this.renderSearchBar() : null,
                createElement('div', {
                    className: bb_.list,
                    ref: (el: HTMLElement | null) => {
                        if (el) {
                            this.itemsListContainer = el;
                        }
                    }
                }),

                this.loadState.error ? this.renderError() : null,
                this.loadState.loading ? this.renderLoading() : null,
                this.loadState.hasMore && !this.loadState.loading && this.items.length > 0 ? this.renderLoadMoreTrigger() : null,
                !this.loadState.hasMore && this.items.length > 0 ? this.renderEndMessage() : null
            );
        }

        private renderSearchBar() {
            return createElement('div', { className: bb_.searchbar, style: 'margin-bottom: 12px;' },
                createElement('div', { className: 'row gap-sm', style: 'position: relative;' },
                    createElement('i', { className: 'fas fa-search', style: 'position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-color-quaternary);' }),
                    createElement('input', {
                        type: 'text',
                        className: '__input',
                        placeholder: this.config.searchPlaceholder,
                        style: 'padding-left: 36px; flex: 1;',
                        ref: (el: HTMLElement | null) => {
                            if (el) {
                                this.searchInput = el as HTMLInputElement;
                                this.searchInput.addEventListener('input', (e) => {
                                    const query = (e.target as HTMLInputElement).value;
                                    this.handleSearch(query);
                                });
                            }
                        }
                    })
                )
            );
        }

        private renderEmptyState() {
            const config = this.config.emptyStateConfig!;
            return createElement('div', { className: bb_.emptyState },
                createElement('i', { className: `__icon ${config.icon}` }),
                createElement('h3', { className: '__title' }, config.title),
                createElement('p', { className: '__desc' }, config.description)
            );
        }

        private renderLoading() {
            return createElement('div', { className: bb_.loading },
                createElement('i', { className: 'fas fa-spinner fa-spin' }),
                createElement('p', {}, this.config.loadingText)
            );
        }

        private renderError() {
            return createElement('div', { className: bb_.error },
                createElement('i', { className: 'fas fa-exclamation-triangle' }),
                createElement('p', {}, this.loadState.error),
                createElement('button', {
                    className: `${bb_.button} secondary`,
                    onclick: () => this.loadMore()
                },
                    createElement('i', { className: 'fas fa-redo' }),
                    ' Retry'
                )
            );
        }

        private renderLoadMoreTrigger() {
            return createElement('div', {
                className: bb_.trigger,
                'data-load-more-trigger': 'true',
                style: 'height: 1px; visibility: hidden;'
            });
        }

        private renderEndMessage() {
            return createElement('div', { className: bb_.end },
                createElement('i', { className: 'fas fa-check-circle' }),
                t(`global.all_loaded`, { count: String(this.loadState.total), title: 'global.sm.notifications' })
                // `All ${total} ${title} loaded`
            );
        }
    }

    export function createItemsLoader<T>(config: ItemsLoaderConfig<T>): ItemsLoader<T> {
        const loader = new ItemsLoader<T>();
        loader.initialize(config);
        return loader;
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝