// vocab-loader.js
// 用于在首次访问时从 `data/vocab.json` 加载词汇并缓存到 localStorage
// 调用示例：await VocabLoader.load(); 然后使用全局 `window.vocabularyData`
const VocabLoader = (function(){
    const STORAGE_KEY = 'vocabularyData';

    async function fetchAndCache() {
        // 使用相对路径并捕获 fetch 错误
        try {
            const resp = await fetch('./data/vocab.json');
            if (!resp.ok) throw new Error('Failed to fetch vocab.json: ' + resp.status);
            const data = await resp.json();
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            } catch (e) {
                console.warn('Failed to cache vocabularyData to localStorage', e);
            }
            window.vocabularyData = data;
            return data;
        } catch (err) {
            console.warn('fetchAndCache: 无法通过 fetch 获取 data/vocab.json，错误：', err);
            // 在 fetch 失败时，优雅降级为返回现有缓存或空数组，避免抛出未捕获异常
            try {
                const cached = localStorage.getItem(STORAGE_KEY);
                if (cached) {
                    window.vocabularyData = JSON.parse(cached);
                    return window.vocabularyData;
                }
            } catch (e) {
                console.warn('fetchAndCache: 无法读取本地缓存', e);
            }
            window.vocabularyData = [];
            return window.vocabularyData;
        }
    }

    return {
        load: async function() {
            // 优先使用 localStorage 缓存
            try {
                const cached = localStorage.getItem(STORAGE_KEY);
                if (cached) {
                    window.vocabularyData = JSON.parse(cached);
                    return window.vocabularyData;
                }
            } catch (e) {
                console.warn('Failed to read vocabularyData from localStorage', e);
            }

            // 没有缓存则 fetch 并缓存
            try {
                document.getElementById('loading-indicator')?.classList.remove('hidden');
            } catch (e) {}

            try {
                // 如果 fetch 失败，fetchAndCache 已在内部处理并返回缓存或空数组
                const data = await fetchAndCache();
                return data;
            } finally {
                try {
                    document.getElementById('loading-indicator')?.classList.add('hidden');
                } catch (e) {}
            }
        },
        // 用于在开发/更新数据时清除缓存并重新加载
        clearCache: function() {
            localStorage.removeItem(STORAGE_KEY);
            window.vocabularyData = null;
        }
    };
})();

// 如果脚本以模块/ESM 被直接加载，也暴露到全局
window.VocabLoader = VocabLoader;

// 自动尝试在脚本加载后开始加载（如果页面后续脚本需要同步可改为手动调用）
// 注意：把自动加载设为可选，默认先不自动加载，页面可用 `await VocabLoader.load()` 控制时机。
