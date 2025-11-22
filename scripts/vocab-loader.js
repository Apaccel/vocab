// vocab-loader.js
// 用于在首次访问时从 `data/vocab.json` 加载词汇并缓存到 localStorage
// 调用示例：await VocabLoader.load(); 然后使用全局 `window.vocabularyData`
const VocabLoader = (function(){
    const STORAGE_KEY = 'vocabularyData';

    async function fetchAndCache() {
        // 使用相对路径并捕获 fetch 错误
        try {
            // 构造基于当前页面的词表 URL，兼容 GitHub Pages 子路径和 <base> 标签
            const vocabUrl = new URL('data/vocab.json', document.baseURI).href;
            const resp = await fetch(vocabUrl);
            if (!resp.ok) {
                // 如果返回非 2xx，记录更详细信息并抛出以进入降级逻辑
                console.warn('fetchAndCache: 请求已发送，但响应非 OK', { url: vocabUrl, status: resp.status });
                throw new Error('Failed to fetch vocab.json: ' + resp.status + ' at ' + vocabUrl);
            }
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
            // 优先使用页面中预加载的全局词库（例如 data/vocab.js 注入的 window.vocabularyData）
            /* try {
                if (window.vocabularyData && Array.isArray(window.vocabularyData) && window.vocabularyData.length > 0) {
                    try {
                        // 若未缓存，尝试缓存到 localStorage 以便下次快速使用
                        const STORAGE_KEY = 'vocabularyData';
                        if (!localStorage.getItem(STORAGE_KEY)) {
                            localStorage.setItem(STORAGE_KEY, JSON.stringify(window.vocabularyData));
                        }
                    } catch (e) {
                        console.warn('vocab-loader: 无法将预加载数据缓存到 localStorage', e);
                    }
                    return window.vocabularyData;
                }
            } catch (e) {
                // 忽略任何读取全局对象时的异常，继续后续逻辑
            } */
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
