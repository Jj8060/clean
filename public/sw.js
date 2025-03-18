// 增强版Service Worker - 彻底拦截Vercel相关请求和资源
const CACHE_NAME = 'vercel-popup-blocker-v2';
const BLOCKED_PATTERNS = [
  'vercel.app',
  'vercel.com',
  '/vercel',
  '/_vercel',
  '/__vercel',
  'reset-workspace'
];

// 安装阶段
self.addEventListener('install', event => {
  // 强制激活，不等待其他service worker终止
  self.skipWaiting();
  
  // 清除所有缓存
  event.waitUntil(
    Promise.all([
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }),
      // 创建新缓存并预缓存空响应
      caches.open(CACHE_NAME).then(cache => {
        return cache.put(
          new Request('https://vercel-block'),
          new Response('', {
            status: 200,
            headers: new Headers({ 'Content-Type': 'text/plain' })
          })
        );
      })
    ])
  );
});

// 激活阶段
self.addEventListener('activate', event => {
  // 立即接管客户端
  event.waitUntil(
    Promise.all([
      // 清理旧缓存
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => cacheName !== CACHE_NAME)
            .map(cacheName => caches.delete(cacheName))
        );
      }),
      // 立即控制所有客户端
      self.clients.claim(),
      // 通知所有窗口SW已更新
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'SW_UPDATED', version: CACHE_NAME });
        });
      })
    ])
  );
});

// 拦截网络请求
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // 检查是否为需要拦截的请求
  const shouldBlock = BLOCKED_PATTERNS.some(pattern => {
    return (
      url.hostname.includes(pattern) || 
      url.pathname.includes(pattern) ||
      (event.request.referrer && event.request.referrer.includes(pattern))
    );
  });
  
  // 检查是否为Vercel API请求
  const isVercelApiRequest = 
    url.pathname.includes('/api/') && 
    (event.request.method === 'POST' || url.searchParams.has('ts')) &&
    (
      event.request.headers.get('content-type')?.includes('application/json') ||
      event.request.headers.get('accept')?.includes('application/json')
    );
  
  if (shouldBlock || isVercelApiRequest) {
    // 返回空响应
    event.respondWith(
      caches.match('https://vercel-block').then(response => {
        return response || new Response('', { 
          status: 200, 
          headers: new Headers({ 'Content-Type': 'text/plain' }) 
        });
      })
    );
    return;
  }
  
  // 对于页面刷新请求，传递一个清除标记
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // 克隆响应以便可以修改
          const clonedResponse = response.clone();
          
          // 处理响应
          return clonedResponse.text().then(html => {
            // 检查是否包含Vercel相关代码
            if (
              html.includes('vercel') || 
              html.includes('Vercel') ||
              html.includes('重置') ||
              html.includes('20分钟')
            ) {
              // 移除相关代码
              html = html
                .replace(/<!--[\s\S]*?-->/g, '') // 移除注释
                .replace(/<script[\s\S]*?src=["'](?:.*vercel.*?)["'][\s\S]*?<\/script>/gi, '')
                .replace(/<script[\s\S]*?data-vercel[\s\S]*?<\/script>/gi, '')
                .replace(/<script[\s\S]*?reset-workspace[\s\S]*?<\/script>/gi, '');
            }
            
            // 返回修改后的响应
            return new Response(html, {
              headers: response.headers,
              status: response.status,
              statusText: response.statusText
            });
          }).catch(() => {
            // 如果处理失败，返回原始响应
            return response;
          });
        })
        .catch(() => {
          // 网络请求失败时尝试从缓存获取
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // 对于其他请求，正常处理
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        // 网络请求失败时尝试从缓存获取
        return caches.match(event.request);
      })
  );
});

// 处理来自页面的消息
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CLEAR_CACHES') {
    // 清除所有缓存
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }).then(() => {
        // 通知页面缓存已清除
        event.ports[0].postMessage({ status: 'CACHES_CLEARED' });
      })
    );
  }
}); 