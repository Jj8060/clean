import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="zh">
      <Head>
        <meta name="application-name" content="值日表系统" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="值日表系统" />
        <meta name="description" content="值日表系统 - 管理值日任务和考勤" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#4f46e5" />
        <meta name="robots" content="noindex, nofollow" />

        {/* 禁用Vercel相关功能的元标签 */}
        <meta name="vercel-deployment" content="disabled" />
        <meta name="referrer" content="no-referrer" />
        <meta name="x-vercel-skip-analytics" content="true" />
        <meta name="x-vercel-skip-ssg" content="true" />
        <meta name="x-vercel-skip-cache" content="true" />
        
        {/* 注册Service Worker */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('Service Worker 注册成功:', registration.scope);
                    })
                    .catch(function(error) {
                      console.log('Service Worker 注册失败:', error);
                    });
                });
                
                // 处理Service Worker消息
                navigator.serviceWorker.addEventListener('message', function(event) {
                  if (event.data && event.data.type === 'SW_UPDATED') {
                    console.log('Service Worker已更新到版本:', event.data.version);
                  }
                });
                
                // 清理任何现有的Vercel弹窗
                function cleanupVercelPopups() {
                  // 尝试通过各种选择器找到Vercel相关元素
                  const possibleSelectors = [
                    '[data-vercel-banner]',
                    '[class*="vercel"]',
                    '[id*="vercel"]',
                    '[aria-label*="vercel" i]',
                    '[class*="banner"]',
                    '[id*="banner"]',
                    'dialog',
                    '[role="dialog"]',
                    '[aria-modal="true"]',
                    '[class*="overlay"]',
                    '[id*="overlay"]',
                    '[class*="popup"]',
                    '[id*="popup"]',
                    '[class*="modal"]',
                    '[id*="modal"]',
                    '[style*="position: fixed"]',
                    '[class*="notification"]',
                    '[id*="notification"]',
                    '[class*="toast"]',
                    '[id*="toast"]',
                    '[style*="z-index: 9"]',
                    '[style*="z-index:9"]'
                  ];
                
                  // 移除匹配的元素
                  possibleSelectors.forEach(selector => {
                    try {
                      const elements = document.querySelectorAll(selector);
                      elements.forEach(el => {
                        const text = el.textContent || '';
                        const html = el.innerHTML || '';
                        if (
                          text.toLowerCase().includes('vercel') || 
                          text.includes('重置') || 
                          text.includes('20分钟') ||
                          html.toLowerCase().includes('vercel')
                        ) {
                          el.remove();
                        }
                      });
                    } catch (e) {}
                  });
                
                  // 确保body保持可滚动
                  if (document.body && document.body.style.overflow === 'hidden') {
                    document.body.style.overflow = '';
                  }
                }
                
                // 页面加载时清理
                window.addEventListener('load', cleanupVercelPopups);
                // 定期检查
                setInterval(cleanupVercelPopups, 2000);
                
                // 拦截弹窗
                const originalAlert = window.alert;
                window.alert = function(message) {
                  if (
                    typeof message === 'string' &&
                    (message.toLowerCase().includes('vercel') ||
                     message.includes('重置') ||
                     message.includes('20分钟'))
                  ) {
                    console.log('已拦截Vercel弹窗:', message);
                    return;
                  }
                  return originalAlert.apply(this, arguments);
                };
              }
            `,
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
} 