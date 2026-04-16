/**
 * Color Scheme Switcher
 * 支持亮色/暗色主题切换
 */

(function() {
  'use strict';

  const storageKey = 'color-mode';
  const lightIcon = 'icon-sun';
  const darkIcon = 'icon-moon';

  // 获取当前主题
  function getCurrentMode() {
    return localStorage.getItem(storageKey) || 'light';
  }

  // 设置主题
  function setMode(mode) {
    document.documentElement.setAttribute('color-mode', mode);
    localStorage.setItem(storageKey, mode);
    updateIcon(mode);
  }

  // 切换主题
  function toggleMode() {
    const currentMode = getCurrentMode();
    const newMode = currentMode === 'light' ? 'dark' : 'light';
    setMode(newMode);

    // 触发自定义事件，通知其他组件主题已切换
    window.dispatchEvent(new CustomEvent('colorschemechange', {
      detail: { mode: newMode }
    }));
  }

  // 更新图标
  function updateIcon(mode) {
    const icon = document.getElementById('theme-icon');
    const btn = document.getElementById('switch-color-scheme');
    if (!icon) return;

    if (mode === 'dark') {
      icon.classList.remove(darkIcon);
      icon.classList.add(lightIcon);
      if (btn) btn.setAttribute('aria-label', '切换到亮色主题');
    } else {
      icon.classList.remove(lightIcon);
      icon.classList.add(darkIcon);
      if (btn) btn.setAttribute('aria-label', '切换到暗色主题');
    }
  }

  // 初始化
  function init() {
    const savedMode = getCurrentMode();
    setMode(savedMode);

    // 绑定点击事件
    const switchBtn = document.getElementById('switch-color-scheme');
    if (switchBtn) {
      switchBtn.addEventListener('click', function(e) {
        e.preventDefault();
        toggleMode();
      });
    }
  }

  // DOM 加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
