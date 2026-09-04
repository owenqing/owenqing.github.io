/**
 * Font Switch
 * 默认无衬线字体 / 类似 Notion 的衬线字体切换
 */

(function() {
  'use strict';

  const storageKey = 'font-mode';
  const SANS = 'sans';
  const SERIF = 'serif';

  // 获取当前字体模式
  function getCurrentMode() {
    const saved = localStorage.getItem(storageKey);
    return saved === SERIF ? SERIF : SANS;
  }

  // 设置字体模式
  function setMode(mode) {
    const nextMode = mode === SERIF ? SERIF : SANS;
    document.documentElement.setAttribute('font-mode', nextMode);
    localStorage.setItem(storageKey, nextMode);
    updateButton(nextMode);
  }

  // 切换字体
  function toggleMode() {
    const nextMode = getCurrentMode() === SERIF ? SANS : SERIF;
    setMode(nextMode);

    // 触发自定义事件，通知其他组件字体已切换
    window.dispatchEvent(new CustomEvent('fontchange', {
      detail: { mode: nextMode }
    }));
  }

  // 更新按钮状态
  function updateButton(mode) {
    const btn = document.getElementById('switch-font');
    if (!btn) return;

    const isSerif = mode === SERIF;
    btn.setAttribute('aria-pressed', isSerif ? 'true' : 'false');
    btn.setAttribute('aria-label', isSerif ? '切换到默认字体' : '切换到衬线字体');
  }

  // 初始化
  function init() {
    const savedMode = getCurrentMode();
    setMode(savedMode);

    // 绑定点击事件
    const switchBtn = document.getElementById('switch-font');
    if (switchBtn) {
      switchBtn.addEventListener('click', function(e) {
        e.preventDefault();
        toggleMode();
      });
    }

    // 多标签页同步
    window.addEventListener('storage', function(e) {
      if (e.key === storageKey) {
        setMode(getCurrentMode());
      }
    });
  }

  // DOM 加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
