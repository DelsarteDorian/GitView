class CacheManager {
    constructor() {
        this.cache = new Map();
        this.maxAge = 5 * 60 * 1000; // 5 minutes
    }

    async get(key) {
        const item = this.cache.get(key);
        if (!item) return null;

        if (Date.now() - item.timestamp > this.maxAge) {
            this.cache.delete(key);
            return null;
        }

        return item.data;
    }

    set(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    clear() {
        this.cache.clear();
    }

    async getCachedSearch(username, filters) {
        const key = this.generateCacheKey(username, filters);
        return this.get(key);
    }

    async cacheSearch(username, filters, results) {
        const key = this.generateCacheKey(username, filters);
        this.set(key, results);
    }

    generateCacheKey(username, filters) {
        return `${username}-${JSON.stringify(filters)}`;
    }

    // Gestion du cache persistant
    async saveToStorage() {
        const cacheData = Array.from(this.cache.entries()).map(([key, value]) => ({
            key,
            data: value.data,
            timestamp: value.timestamp
        }));

        await chrome.storage.local.set({ searchCache: cacheData });
    }

    async loadFromStorage() {
        const { searchCache } = await chrome.storage.local.get('searchCache');
        if (searchCache) {
            this.cache = new Map(
                searchCache.map(item => [
                    item.key,
                    {
                        data: item.data,
                        timestamp: item.timestamp
                    }
                ])
            );
        }
    }

    // Nettoyage automatique du cache
    startAutoCleanup() {
        setInterval(() => {
            const now = Date.now();
            for (const [key, value] of this.cache.entries()) {
                if (now - value.timestamp > this.maxAge) {
                    this.cache.delete(key);
                }
            }
            this.saveToStorage();
        }, 60000); // Vérifie toutes les minutes
    }
} 