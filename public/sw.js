// InkFlow Service Worker - PWA 离线支持
const CACHE_NAME = 'inkflow-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json'
];

// 安装事件 - 缓存静态资源
self.addEventListener('install', (event) => {
    console.log('[SW] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Caching static assets');
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        })
    );
    self.clients.claim();
});

// 拦截请求 - 网络优先策略
self.addEventListener('fetch', (event) => {
    // 跳过非 GET 请求和 API 请求
    if (event.request.method !== 'GET') return;
    if (event.request.url.includes('/api/') ||
        event.request.url.includes('googleapis.com') ||
        event.request.url.includes('openai.com')) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // 克隆响应以便缓存
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseClone);
                });
                return response;
            })
            .catch(() => {
                // 网络失败时使用缓存
                return caches.match(event.request);
            })
    );
});
