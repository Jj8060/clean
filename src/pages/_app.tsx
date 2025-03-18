import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { useEffect } from 'react'

export default function App({ Component, pageProps }: AppProps) {
  // 注销可能存在的Service Worker并处理弹窗
  useEffect(() => {
    // 处理service worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        for (const registration of registrations) {
          registration.unregister()
        }
      })
    }
    
    // 处理vercel弹窗
    if (typeof window !== 'undefined') {
      // 重写alert方法以拦截特定弹窗
      const originalAlert = window.alert;
      window.alert = function(message?: any) {
        // 如果是特定弹窗，则不显示
        if (typeof message === 'string' && (
          message.includes('只能重置最近20分钟内的更改') ||
          message.includes('vercel.app 显示')
        )) {
          console.log('已拦截弹窗:', message);
          return;
        }
        // 其他警告正常显示
        return originalAlert(message);
      };
      
      // 移除可能存在的弹窗元素
      const removePopup = () => {
        const popups = document.querySelectorAll('[aria-label*="vercel"], [class*="vercel-popup"]');
        popups.forEach(popup => {
          popup.remove();
        });
      };
      
      // 定期检查并移除弹窗
      removePopup();
      const intervalId = setInterval(removePopup, 1000);
      
      return () => {
        // 清理
        window.alert = originalAlert;
        clearInterval(intervalId);
      };
    }
  }, []);

  return <Component {...pageProps} />
} 