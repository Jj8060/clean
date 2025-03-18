import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { useEffect } from 'react'
import BlockVercelBanner from '../components/BlockVercelBanner'

export default function App({ Component, pageProps }: AppProps) {
  // 注销可能存在的Service Worker并处理弹窗
  useEffect(() => {
    // 处理service worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(registration => {
        console.log('Service Worker 已注册:', registration.scope);
      }).catch(error => {
        console.log('Service Worker 注册失败:', error);
      });
    }
    
    // 处理vercel弹窗 - 增强版
    if (typeof window !== 'undefined') {
      // 1. 重写alert方法彻底拦截所有弹窗
      const originalAlert = window.alert;
      window.alert = function(message?: any) {
        // 拦截任何可能包含vercel相关内容的弹窗
        if (typeof message === 'string' && (
          message.includes('vercel') || 
          message.includes('Vercel') || 
          message.includes('重置') || 
          message.includes('20分钟') ||
          message.includes('clean') ||
          message.includes('更改')
        )) {
          console.log('已拦截弹窗:', message);
          return;
        }
        // 其他警告正常显示
        return originalAlert(message);
      };
      
      // 2. 拦截并阻止可能创建弹窗的事件
      const preventVercelActions = (e: Event) => {
        const target = e.target as HTMLElement;
        if (target && target.nodeType === 1) {
          // 检查元素或父元素是否包含vercel相关类名或属性
          const isVercelElement = 
            (target.outerHTML && (
              target.outerHTML.includes('vercel') || 
              target.outerHTML.includes('Vercel') ||
              target.outerHTML.includes('popup')
            )) ||
            (target.getAttribute('aria-label') && 
             target.getAttribute('aria-label')!.includes('vercel'));
          
          if (isVercelElement) {
            e.preventDefault();
            e.stopPropagation();
            console.log('已阻止Vercel元素事件', target);
          }
        }
      };
      
      // 为所有可能触发弹窗的事件添加拦截
      document.addEventListener('click', preventVercelActions, true);
      document.addEventListener('mousedown', preventVercelActions, true);
      document.addEventListener('touchstart', preventVercelActions, true);
      
      // 3. 定期检查并删除弹窗元素
      const removeVercelElements = () => {
        // 广泛的选择器，查找任何可能的vercel相关元素
        const selectors = [
          '[aria-label*="vercel" i]', 
          '[class*="vercel" i]',
          '[id*="vercel" i]',
          '[class*="popup" i]',
          '[id*="popup" i]',
          '[class*="dialog" i]',
          '[role="dialog"]',
          '[class*="modal" i]',
          '[aria-modal="true"]',
          // 搜索特定内容的元素
          'div:contains("vercel")',
          'div:contains("Vercel")',
          'div:contains("重置")',
          'div:contains("20分钟")',
          'div:contains("更改")'
        ];
        
        try {
          // 查找并移除任何匹配的元素
          document.querySelectorAll(selectors.join(', ')).forEach(el => {
            // 检查是否包含vercel相关文本
            if (el.textContent && (
              el.textContent.includes('vercel') || 
              el.textContent.includes('Vercel') ||
              el.textContent.includes('重置') ||
              el.textContent.includes('20分钟') ||
              el.textContent.includes('更改')
            )) {
              console.log('删除Vercel相关元素:', el);
              el.remove();
            }
          });
          
          // 删除任何遮罩层
          document.querySelectorAll('.overlay, .backdrop, [class*="overlay" i], [class*="backdrop" i]').forEach(el => {
            if (el.classList.contains('fixed') || 
                (window.getComputedStyle(el).position === 'fixed' && 
                 window.getComputedStyle(el).zIndex !== 'auto')) {
              console.log('删除可能的遮罩层:', el);
              el.remove();
            }
          });
        } catch (e) {
          console.error('移除弹窗元素失败:', e);
        }
      };

      // 立即执行一次并设置定期清理
      removeVercelElements();
      const cleanupInterval = setInterval(removeVercelElements, 500);

      // 4. 监控并恢复body滚动
      const ensureBodyScrollable = () => {
        if (document.body.style.overflow === 'hidden') {
          document.body.style.overflow = '';
        }
      };
      const scrollInterval = setInterval(ensureBodyScrollable, 1000);
      
      // 清理函数
      return () => {
        document.removeEventListener('click', preventVercelActions, true);
        document.removeEventListener('mousedown', preventVercelActions, true);
        document.removeEventListener('touchstart', preventVercelActions, true);
        clearInterval(cleanupInterval);
        clearInterval(scrollInterval);
        window.alert = originalAlert;
      };
    }
  }, []);

  return (
    <>
      <BlockVercelBanner />
      <Component {...pageProps} />
    </>
  );
} 