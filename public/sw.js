// 空的service worker文件，用于替换可能存在的旧service worker
self.addEventListener('install', event => {
  // 强制激活，不等待其他service worker终止
  self.skipWaiting();
  
  // 清除所有缓存
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          console.log('删除缓存:', cacheName);
          return caches.delete(cacheName);
        })
      );
    })
  );
});

self.addEventListener('activate', event => {
  // 立即接管页面
  event.waitUntil(clients.claim());
  
  // 再次清除所有缓存
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

// 拦截fetch请求
self.addEventListener('fetch', event => {
  // 对于vercel相关的请求，可以尝试拦截
  const url = event.request.url;
  if (url.includes('vercel.app') && url.includes('api')) {
    // 返回空响应，避免弹窗
    event.respondWith(new Response(null, { status: 200 }));
    return;
  }
  
  // 正常的请求通过网络获取
  event.respondWith(fetch(event.request));
}); 