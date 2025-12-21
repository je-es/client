// src/frontend/app/gui/layout/items_loader.ts
//
// Made with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import { createDOMElement, createElement, VNode, VNodeChild } from "@je-es/vdom";
    import { Component }    from "../core/component";
    import { t }            from "../services/i18n";

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ INIT ════════════════════════════════════════╗

    // Blah Blah Style Map
    const bb_ = {
        container           : 'bb_itemsLoaderContainer',
        list                : 'bb_itemsLoaderList',
        searchbar           : 'bb_itemsLoaderSearchbar',
        loading             : 'bb_itemsLoaderLoading',
        error               : 'bb_itemsLoaderError',
        trigger             : 'bb_itemsLoaderTrigger',
        end                 : 'bb_itemsLoaderEnd',
        emptyState          : 'bb_tabbedviewEmptyState',
        button              : 'bb_btn',
        item                : 'bb_itemsLoader-item',
        formFieldInput      : 'bb_formFieldInput',
    };

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TYPES ═══════════════════════════════════════╗

    export interface ItemsLoaderConfig<T> {
        // Core configuration
        fetchUrl                    : string | ((page: number, filters: Record<string, unknown>) => string);
        renderItem                  : (item: T, index: number) => HTMLElement;
        pageSize?                   : number;

        // Empty state
        emptyStateConfig?: {
            icon                    : string;
            title                   : string;
            description             : string;
        };

        // UI text
        loadMoreText?               : string;
        loadingText?                : string;
        errorText?                  : string;
        containerClassName?         : string;
        itemClassName?              : string;

        // Filtering
        filters?                    : Record<string, unknown>;
        onFiltersChange?            : (filters: Record<string, unknown>) => void;

        // Search
        enableSearch?               : boolean;
        searchPlaceholder?          : string;
        searchFilterKey?            : string;
        searchDebounceMs?           : number;

        // Callbacks
        onItemClick?                : (item: T, index: number) => void;
        onLoadMore?                 : (page: number, items: T[]) => void;
        onError?                    : (error: Error) => void;

        // Data extraction
        initialItems?               : T[];
        extractItems?               : (response: Record<string, unknown>) => T[];
        extractTotal?               : (response: Record<string, unknown>) => number;

        // Authentication
        getAuthToken?               : () => string | null;

        // Scroll behavior
        enableInfiniteScroll?       : boolean;
        scrollThreshold?            : number;

        // 🆕 Visibility tracking (for auto-mark-as-read, analytics, etc.)
        enableVisibilityTracking?   : boolean;
        visibilityThreshold?        : number;
        visibilityRootMargin?       : string;
        onItemsViewed?              : (viewedItems: T[]) => Promise<void>;
        getItemId?                  : (item: T) => number | string;
        shouldTrackItem?            : (item: T) => boolean; // e.g., only track unread items

        // 🆕 Dropdown lifecycle (for nested dropdowns)
        onDropdownOpen?             : () => void;
        onDropdownClose?            : () => void;

        // 🆕 Batch operations
        onBatchAction?              : (action: string, itemIds: (number | string)[]) => Promise<void>;
    }

    interface LoadState {
        loading                     : boolean;
        error                       : string | null;
        hasMore                     : boolean;
        page                        : number;
        total                       : number;
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

    export class ItemsLoader<T = unknown> extends Component {

        // ┌──────────────────────────────── INIT ──────────────────────────────┐

            items                               : T[] = [];
            loadState                           : LoadState = {
                loading                         : false,
                error                           : null,
                hasMore                         : true,
                page                            : 0,
                total                           : 0
            };
            filters                             : Record<string, unknown> = {};

            public config!                      : ItemsLoaderConfig<T>;

            // Scroll management
            private scrollContainer             : HTMLElement | null = null;

            // Infinite scroll
            private loadMoreObserver            : IntersectionObserver | null = null;
            private currentLoadMoreTrigger      : Element | null = null;
            private loadMoreMutationObserver    : MutationObserver | null = null;

            // Visibility tracking
            private visibilityObserver          : IntersectionObserver | null = null;
            private viewedItems                 = new Set<number | string>();
            private dropdownIsOpen              : boolean = false;

            // DOM references
            private itemsListContainer          : HTMLElement | null = null;
            private searchInput                 : HTMLInputElement | null = null;

            // State flags
            private isUpdating                  : boolean = false;
            private searchDebounceTimer         : NodeJS.Timeout | null = null;

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── ──── ──────────────────────────────┐

            initialize(config: ItemsLoaderConfig<T>) {
                this.config = {
                    pageSize: 10,
                    loadMoreText: 'Load More',
                    loadingText: 'Loading...',
                    errorText: 'Failed to load items',
                    containerClassName: bb_.container,
                    itemClassName: bb_.item,
                    enableInfiniteScroll: true,
                    scrollThreshold: 200,
                    enableSearch: false,
                    searchPlaceholder: 'Search...',
                    searchFilterKey: 'search',
                    searchDebounceMs: 300,
                    enableVisibilityTracking: false,
                    visibilityThreshold: 0.5,
                    visibilityRootMargin: '0px',
                    extractItems: (response: { notifications?: T[]; items?: T[]; data?: T[]; logs?: T[] }) =>
                        response.notifications || response.items || response.data || response.logs || [],
                    extractTotal: (response: { total?: number; count?: number; pagination?: { total?: number } }) =>
                        response.pagination?.total || response.total || response.count || 0,
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

                if (this.config.enableVisibilityTracking) {
                    this.setupVisibilityTracking();
                }
            }

            onUnmount() {
                this.disconnectInfiniteScrollObserver();
                this.disconnectVisibilityObserver();

                if (this.loadMoreMutationObserver) {
                    this.loadMoreMutationObserver.disconnect();
                    this.loadMoreMutationObserver = null;
                }

                if (this.scrollContainer) {
                    this.scrollContainer.removeEventListener('scroll', this.handleScroll);
                    this.scrollContainer = null;
                }

                if (this.searchDebounceTimer) {
                    clearTimeout(this.searchDebounceTimer);
                }
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── ──── ──────────────────────────────┐

            async loadMore() {
                if (this.loadState.loading || !this.loadState.hasMore) {
                    return;
                }

                try {
                    const scrollContainer = this.scrollContainer || this.findScrollContainer();
                    const savedScrollTop = scrollContainer?.scrollTop || 0;
                    const savedScrollHeight = scrollContainer?.scrollHeight || 0;

                    this.loadState = { ...this.loadState, loading: true, error: null };
                    this.updateLoadingState();

                    const nextPage = this.loadState.page + 1;
                    const url = this.buildUrl(nextPage);

                    const response = await fetch(url, {
                        credentials: 'include',
                        headers: this.buildHeaders()
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

                    this.updateLoadingState();
                    this.appendNewItems(newItems);

                    // Restore scroll position
                    if (scrollContainer && savedScrollTop > 0) {
                        scrollContainer.scrollTop = savedScrollTop;

                        requestAnimationFrame(() => {
                            const newScrollHeight = scrollContainer.scrollHeight;
                            const scrollHeightDiff = newScrollHeight - savedScrollHeight;

                            if (Math.abs(scrollHeightDiff) > 10) {
                                scrollContainer.scrollTop = savedScrollTop;
                            }
                        });
                    }

                    this.reconnectInfiniteScrollObserver();
                    this.config.onLoadMore?.(nextPage, this.items);

                } catch (error) {
                    this.loadState = {
                        ...this.loadState,
                        loading: false,
                        error: error instanceof Error ? error.message : this.config.errorText!
                    };

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

            async applyFilters(newFilters: Record<string, unknown>) {
                if (this.isUpdating) return;

                this.isUpdating = true;
                this.filters = { ...newFilters };

                this.items = [];
                this.loadState = {
                    loading: true,
                    error: null,
                    hasMore: true,
                    page: 0,
                    total: 0
                };

                this.updateLoadingState();

                try {
                    const url = this.buildUrl(1);
                    const response = await fetch(url, {
                        credentials: 'include',
                        headers: this.buildHeaders()
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }

                    const data = await response.json();
                    const newItems = this.config.extractItems!(data);
                    const total = this.config.extractTotal!(data);

                    this.items = [...newItems];
                    this.loadState = {
                        loading: false,
                        error: null,
                        hasMore: this.items.length < total,
                        page: 1,
                        total
                    };

                    // Clear container
                    if (this.itemsListContainer) {
                        this.itemsListContainer.innerHTML = '';
                    }

                    if (this.element) {
                        this.element.querySelectorAll(`.${bb_.trigger}, .${bb_.end}, .${bb_.error}, .${bb_.loading}, .${bb_.emptyState}`).forEach(el => el.remove());
                    }

                    // Append items or show empty state
                    if (this.items.length > 0) {
                        if (!this.itemsListContainer) {
                            this.itemsListContainer = this.element?.querySelector(`.${bb_.list}`) as HTMLElement;
                        }

                        if (this.itemsListContainer) {
                            this.appendNewItems(this.items);
                        }
                    } else {
                        this.updateFooter();
                    }

                    this.itemsListContainer = this.element?.querySelector(`.${bb_.list}`) as HTMLElement;
                    this.reconnectInfiniteScrollObserver();

                    this.config.onLoadMore?.(1, this.items);
                    this.config.onFiltersChange?.(this.filters);

                } catch (error) {
                    this.loadState = {
                        ...this.loadState,
                        loading: false,
                        error: error instanceof Error ? error.message : this.config.errorText!
                    };

                    this.updateLoadingState();
                    this.config.onError?.(error instanceof Error ? error : new Error('Unknown error'));
                } finally {
                    this.isUpdating = false;
                }
            }

            async handleSearch(searchQuery: string) {
                if (this.searchDebounceTimer) {
                    clearTimeout(this.searchDebounceTimer);
                }

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

                if (this.itemsListContainer) {
                    this.itemsListContainer.innerHTML = '';
                    this.appendNewItems(updatedItems);
                }
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── ──── ──────────────────────────────┐

            private setupVisibilityTracking() {
                if (!this.config.enableVisibilityTracking) return;

                if (this.visibilityObserver) {
                    this.visibilityObserver.disconnect();
                }

                const scrollContainer = this.findScrollContainer();

                this.visibilityObserver = new IntersectionObserver(
                    (entries) => {
                        entries.forEach(entry => {
                            if (entry.isIntersecting && this.dropdownIsOpen) {
                                const element = entry.target as HTMLElement;
                                const itemIndex = parseInt(element.getAttribute('data-item-index') || '-1');

                                if (itemIndex >= 0 && itemIndex < this.items.length) {
                                    const item = this.items[itemIndex];
                                    const itemId = this.config.getItemId?.(item);
                                    const shouldTrack = this.config.shouldTrackItem?.(item) ?? true;

                                    if (itemId && !this.viewedItems.has(itemId) && shouldTrack) {
                                        this.viewedItems.add(itemId);
                                    }
                                }
                            }
                        });
                    },
                    {
                        root: scrollContainer,
                        rootMargin: this.config.visibilityRootMargin,
                        threshold: this.config.visibilityThreshold
                    }
                );

                this.observeTrackableItems();
            }

            private observeTrackableItems() {
                if (!this.visibilityObserver || !this.itemsListContainer) return;

                const items = this.itemsListContainer.querySelectorAll('[data-item-index]');
                items.forEach(element => {
                    const itemIndex = parseInt((element as HTMLElement).getAttribute('data-item-index') || '-1');
                    if (itemIndex >= 0 && itemIndex < this.items.length) {
                        const item = this.items[itemIndex];
                        const shouldTrack = this.config.shouldTrackItem?.(item) ?? true;

                        if (shouldTrack) {
                            this.visibilityObserver!.observe(element);
                        }
                    }
                });
            }

            private trackAlreadyVisibleItems() {
                if (!this.itemsListContainer) return;

                const scrollContainer = this.findScrollContainer();
                if (!scrollContainer) return;

                const items = this.itemsListContainer.querySelectorAll('[data-item-index]');
                const containerRect = scrollContainer.getBoundingClientRect();

                items.forEach(element => {
                    const itemIndex = parseInt((element as HTMLElement).getAttribute('data-item-index') || '-1');
                    if (itemIndex < 0 || itemIndex >= this.items.length) return;

                    const item = this.items[itemIndex];
                    const itemId = this.config.getItemId?.(item);
                    if (!itemId || this.viewedItems.has(itemId)) return;

                    const shouldTrack = this.config.shouldTrackItem?.(item) ?? true;
                    if (!shouldTrack) return;

                    const rect = (element as HTMLElement).getBoundingClientRect();
                    const isVisible = (
                        rect.top < containerRect.bottom &&
                        rect.bottom > containerRect.top &&
                        rect.top >= containerRect.top - 100 &&
                        rect.bottom <= containerRect.bottom + 100
                    );

                    if (isVisible) {
                        this.viewedItems.add(itemId);
                    }
                });
            }

            private disconnectVisibilityObserver() {
                if (this.visibilityObserver) {
                    this.visibilityObserver.disconnect();
                    this.visibilityObserver = null;
                }
            }

            public handleDropdownOpen() {
                this.dropdownIsOpen = true;
                this.viewedItems.clear();

                if (this.config.enableVisibilityTracking) {
                    this.trackAlreadyVisibleItems();
                    this.observeTrackableItems();
                }

                this.config.onDropdownOpen?.();
            }

            public async handleDropdownClose() {
                this.dropdownIsOpen = false;

                if (this.viewedItems.size > 0 && this.config.onItemsViewed) {
                    const viewedItemsArray = this.items.filter(item => {
                        const itemId = this.config.getItemId?.(item);
                        return itemId && this.viewedItems.has(itemId);
                    });

                    await this.config.onItemsViewed(viewedItemsArray);
                }

                this.viewedItems.clear();
                this.config.onDropdownClose?.();
            }

            public async performBatchAction(action: string, itemIds: (number | string)[]) {
                if (this.config.onBatchAction) {
                    await this.config.onBatchAction(action, itemIds);
                }
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── ──── ──────────────────────────────┐

            private appendNewItems(newItems: T[]) {
                if (!this.itemsListContainer) {
                    this.itemsListContainer = this.element?.querySelector(`.${bb_.list}`) as HTMLElement;
                }

                if (!this.itemsListContainer) return;

                const fragment = document.createDocumentFragment();
                const startIndex = this.items.length - newItems.length;

                newItems.forEach((item, index) => {
                    const actualIndex = startIndex + index;
                    const itemElement = this.config.renderItem(item, actualIndex);

                    itemElement.setAttribute('data-item-index', actualIndex.toString());

                    if (this.config.onItemClick) {
                        itemElement.className = `${itemElement.className} ${this.config.itemClassName} clickable`;
                        itemElement.onclick = () => this.handleItemClick(item, actualIndex);
                    } else {
                        itemElement.className = `${itemElement.className} ${this.config.itemClassName}`;
                    }

                    fragment.appendChild(itemElement);
                });

                this.itemsListContainer.appendChild(fragment);
                this.updateFooter();

                if (this.config.enableVisibilityTracking && this.dropdownIsOpen) {
                    setTimeout(() => this.observeTrackableItems(), 100);
                }
            }

            private updateLoadingState() {
                const container = this.element?.querySelector(`.${bb_.container}`);
                if (!container) return;

                let loadingEl = container.querySelector(`.${bb_.loading}`) as HTMLElement;

                if (this.loadState.loading) {
                    if (!loadingEl) {
                        const loadingVNode = this.renderLoading();
                        loadingEl = this.createElementFromVNode(loadingVNode);
                        container.appendChild(loadingEl);
                    }
                } else {
                    if (loadingEl) {
                        loadingEl.remove();
                    }
                }
            }

            public updateFooter() {
                const container = this.element;
                if (!container) return;

                container.querySelectorAll(`.${bb_.trigger}, .${bb_.end}, .${bb_.emptyState}`).forEach(el => {
                    el.remove();
                });

                if (this.items.length === 0 && !this.loadState.loading && this.config.emptyStateConfig) {
                    const emptyVNode = this.renderEmptyState();
                    const emptyElement = createDOMElement(emptyVNode);
                    container.appendChild(emptyElement);
                    return;
                }

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

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── ──── ──────────────────────────────┐

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

                this.reconnectInfiniteScrollObserver();
            }

            private reconnectInfiniteScrollObserver() {
                if (!this.config.enableInfiniteScroll || !this.loadMoreObserver) return;

                if (this.currentLoadMoreTrigger) {
                    this.loadMoreObserver.unobserve(this.currentLoadMoreTrigger);
                    this.currentLoadMoreTrigger = null;
                }

                const tryObserve = () => {
                    const trigger = this.element?.querySelector('[data-load-more-trigger="true"]');

                    if (trigger) {
                        this.loadMoreObserver!.observe(trigger);
                        this.currentLoadMoreTrigger = trigger;
                        return true;
                    }

                    return false;
                };

                if (!tryObserve()) {
                    // Use MutationObserver to wait for trigger
                    if (this.loadMoreMutationObserver) {
                        this.loadMoreMutationObserver.disconnect();
                    }

                    this.loadMoreMutationObserver = new MutationObserver(() => {
                        if (tryObserve() && this.loadMoreMutationObserver) {
                            this.loadMoreMutationObserver.disconnect();
                            this.loadMoreMutationObserver = null;
                        }
                    });

                    if (this.element) {
                        this.loadMoreMutationObserver.observe(this.element, {
                            childList: true,
                            subtree: true
                        });

                        setTimeout(() => {
                            if (this.loadMoreMutationObserver) {
                                this.loadMoreMutationObserver.disconnect();
                                this.loadMoreMutationObserver = null;
                            }
                        }, 5000);
                    }
                }
            }

            private disconnectInfiniteScrollObserver() {
                if (this.loadMoreObserver && this.currentLoadMoreTrigger) {
                    this.loadMoreObserver.unobserve(this.currentLoadMoreTrigger);
                    this.currentLoadMoreTrigger = null;
                }
            }

            private setupScrollListener() {
                requestAnimationFrame(() => {
                    this.scrollContainer = this.findScrollContainer();

                    if (this.scrollContainer) {
                        if ('scrollRestoration' in history) {
                            history.scrollRestoration = 'manual';
                        }

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

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── ──── ──────────────────────────────┐

            private findScrollContainer(): HTMLElement | null {
                const candidates = [
                    this.element?.closest('.bb_notificationsContent'),
                    this.element?.closest('.bb_dropdownMenu'),
                    this.element?.querySelector('[data-notifications-loader]'),
                    this.element?.closest('[data-notifications-loader]'),
                    this.element?.closest('.scrollbar-thin'),
                    this.element?.parentElement,
                    this.element
                ];

                for (const candidate of candidates) {
                    if (candidate) {
                        const el = candidate as HTMLElement;
                        if (el.scrollHeight > el.clientHeight || el.classList.contains('scrollbar-thin')) {
                            return el;
                        }
                    }
                }

                return null;
            }

            private buildUrl(page: number): string {
                if (typeof this.config.fetchUrl === 'function') {
                    return this.config.fetchUrl(page, this.filters);
                }

                const separator = this.config.fetchUrl.includes('?') ? '&' : '?';
                const params = new URLSearchParams({
                    page: page.toString(),
                    limit: this.config.pageSize!.toString(),
                    ...this.filters as Record<string, string>
                });

                return `${this.config.fetchUrl}${separator}${params}`;
            }

            private buildHeaders(): HeadersInit {
                const headers: HeadersInit = {
                    'Content-Type': 'application/json'
                };

                const token = this.config.getAuthToken?.();
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }

                return headers;
            }

            private handleItemClick = (item: T, index: number) => {
                this.config.onItemClick?.(item, index);
            };

            private createElementFromVNode(vnode: VNode): HTMLElement {
                if (typeof vnode.type !== 'string') {
                    throw new Error('Can only create elements from string types');
                }

                const element = document.createElement(vnode.type);

                if (vnode.props) {
                    Object.entries(vnode.props).forEach(([key, value]) => {
                        if (key === 'className') {
                            element.className = value as string;
                        } else if (key === 'style') {
                            if (typeof value === 'string') {
                                element.setAttribute('style', value);
                            } else if (typeof value === 'object' && value !== null) {
                                Object.assign(element.style, value);
                            }
                        } else if (key === 'onclick' && typeof value === 'function') {
                            element.addEventListener('click', value as EventListener);
                        } else if (key !== 'children' && key !== 'ref') {
                            element.setAttribute(key, String(value));
                        }
                    });
                }

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

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── ──── ──────────────────────────────┐

            render() {
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
                return createElement('div', { className: bb_.searchbar },
                    createElement('div', { className: 'row gap-sm' },
                        createElement('i', { className: 'fas fa-search' }),
                        createElement('input', {
                            type: 'text',
                            className: bb_.formFieldInput,
                            placeholder: this.config.searchPlaceholder,
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

            public renderEmptyState() {
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
                    t(`All loaded`, { count: String(this.loadState.total) })
                );
            }

        // └────────────────────────────────────────────────────────────────────┘

    }

    export function createItemsLoader<T>(config: ItemsLoaderConfig<T>): ItemsLoader<T> {
        const loader = new ItemsLoader<T>();
        loader.initialize(config);
        return loader;
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝