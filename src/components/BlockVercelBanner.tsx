import { useEffect } from 'react';

const BlockVercelBanner = () => {
  useEffect(() => {
    // 拦截window.alert方法
    const originalAlert = window.alert;
    window.alert = function(message: string) {
      // 检查消息内容是否包含"vercel"或"重置"或"20分钟"
      if (
        typeof message === 'string' &&
        (message.toLowerCase().includes('vercel') ||
          message.includes('重置') ||
          message.includes('20分钟'))
      ) {
        console.log('已阻止Vercel弹窗:', message);
        return; // 阻止弹窗显示
      }
      return originalAlert.apply(this, arguments as any);
    };

    // 定期检查和移除Vercel横幅
    const cleanupVercelElements = () => {
      // 尝试通过各种选择器找到Vercel相关元素
      const possibleSelectors = [
        '[data-vercel-banner]',
        '[class*="vercel"]',
        '[id*="vercel"]',
        '[aria-label*="vercel" i]',
        '[class*="banner"]',
        '[id*="banner"]',
        // 对话框和模态框
        'dialog',
        '[role="dialog"]',
        '[aria-modal="true"]',
        // 覆盖层
        '[class*="overlay"]',
        '[id*="overlay"]',
        // 通用弹出元素
        '[class*="popup"]',
        '[id*="popup"]',
        '[class*="modal"]',
        '[id*="modal"]',
        // 固定位置元素(可能是弹窗)
        '[style*="position: fixed"]',
        // 通知类元素
        '[class*="notification"]',
        '[id*="notification"]',
        '[class*="toast"]',
        '[id*="toast"]',
        // z-index很高的元素
        '[style*="z-index: 9"]',
        '[style*="z-index:9"]'
      ];

      // 移除匹配的元素
      possibleSelectors.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector);
          elements.forEach(el => {
            // 检查元素内容或属性是否包含Vercel相关文本
            const text = el.textContent || '';
            const innerHTML = el.innerHTML || '';
            if (
              text.includes('vercel') || 
              text.includes('Vercel') || 
              text.includes('重置') || 
              text.includes('20分钟') ||
              innerHTML.includes('vercel') || 
              innerHTML.includes('Vercel')
            ) {
              el.remove();
              console.log('已移除Vercel相关元素:', el);
            }

            // 特殊检查: 如果元素看起来像是弹窗覆盖层(固定位置且覆盖全屏)
            const style = window.getComputedStyle(el);
            if (
              style.position === 'fixed' &&
              style.top === '0px' &&
              style.left === '0px' &&
              (style.right === '0px' || style.width === '100%') &&
              (style.bottom === '0px' || style.height === '100%')
            ) {
              el.remove();
              console.log('已移除疑似Vercel覆盖层:', el);
            }
          });
        } catch (e) {
          // 忽略选择器错误
        }
      });

      // 确保body保持可滚动
      if (document.body.style.overflow === 'hidden') {
        document.body.style.overflow = '';
      }
    };

    // 初始清理
    cleanupVercelElements();

    // 监听DOM变化
    const observer = new MutationObserver(mutations => {
      // 检查变化是否与Vercel相关
      const shouldCleanup = mutations.some(mutation => {
        const nodes = Array.from(mutation.addedNodes);
        return nodes.some(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as Element;
            const html = el.outerHTML || '';
            return (
              html.toLowerCase().includes('vercel') ||
              html.includes('重置') ||
              html.includes('20分钟')
            );
          }
          return false;
        });
      });

      if (shouldCleanup) {
        cleanupVercelElements();
      }
    });

    // 观察整个文档
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });

    // 定期检查，以防万一
    const intervalId = setInterval(cleanupVercelElements, 2000);

    // 阻止鼠标事件在某些元素上
    const handleClickCapture = (e: MouseEvent) => {
      const target = e.target as Element;
      if (!target) return;
      
      // 检查点击的元素是否与Vercel相关
      const html = target.outerHTML || '';
      const text = target.textContent || '';
      
      if (
        html.toLowerCase().includes('vercel') ||
        text.includes('重置') ||
        text.includes('20分钟')
      ) {
        e.stopPropagation();
        e.preventDefault();
        console.log('已阻止Vercel相关点击事件');
      }
    };
    
    document.addEventListener('click', handleClickCapture, true);

    // 清理函数
    return () => {
      window.alert = originalAlert;
      clearInterval(intervalId);
      observer.disconnect();
      document.removeEventListener('click', handleClickCapture, true);
    };
  }, []);

  return null; // 这个组件不渲染任何可见的内容
};

export default BlockVercelBanner; 