// 空的service worker文件，用于替换可能存在的旧service worker
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  // 清除所有缓存
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          return caches.delete(cacheName);
        })
      );
    })
  );
}); 