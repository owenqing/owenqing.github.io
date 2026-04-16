/**
 * Mermaid Configuration
 * Mermaid 图表配置
 */

(function() {
  'use strict';

  function initMermaid() {
    if (typeof mermaid === 'undefined') {
      console.warn('Mermaid not loaded');
      return;
    }

    // 转换 pre.mermaid 为 div.mermaid
    document.querySelectorAll('pre.mermaid').forEach(function(pre) {
      var code = pre.querySelector('code');
      var content = code ? code.textContent : pre.textContent;

      var div = document.createElement('div');
      div.className = 'mermaid';
      div.textContent = content.trim();

      // 保存原始内容
      div.setAttribute('data-original', content.trim());

      pre.parentNode.replaceChild(div, pre);
    });

    // 获取主题
    var isDark = document.documentElement.getAttribute('color-mode') === 'dark';

    // 初始化配置
    mermaid.initialize({
      startOnLoad: true,
      theme: isDark ? 'dark' : 'default',
      securityLevel: 'loose',
      flowchart: { useMaxWidth: true },
      sequence: { useMaxWidth: true },
      gantt: { useMaxWidth: true }
    });

    // 手动触发渲染
    if (mermaid.run) {
      // Mermaid 10.x
      mermaid.run({ querySelector: '.mermaid' });
    } else if (mermaid.init) {
      // Mermaid 9.x
      mermaid.init(undefined, document.querySelectorAll('.mermaid'));
    }
  }

  // 等待 DOM 和 Mermaid 加载
  function waitAndInit() {
    if (typeof mermaid !== 'undefined') {
      initMermaid();
    } else {
      setTimeout(waitAndInit, 100);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitAndInit);
  } else {
    waitAndInit();
  }

  // 监听主题切换事件，重新初始化 Mermaid
  window.addEventListener('colorschemechange', function(e) {
    var newMode = e.detail.mode;
    var isDark = newMode === 'dark';

    // 重新初始化 Mermaid 配置
    mermaid.initialize({
      startOnLoad: false,
      theme: isDark ? 'dark' : 'default',
      securityLevel: 'loose',
      flowchart: { useMaxWidth: true },
      sequence: { useMaxWidth: true },
      gantt: { useMaxWidth: true }
    });

    // 重新渲染所有 Mermaid 图表
    document.querySelectorAll('.mermaid').forEach(function(el) {
      // 恢复原始内容
      var originalContent = el.getAttribute('data-original');
      if (originalContent) {
        el.textContent = originalContent;
        el.removeAttribute('data-processed');
      }
    });

    // 重新运行渲染
    if (mermaid.run) {
      mermaid.run({ querySelector: '.mermaid' });
    } else if (mermaid.init) {
      mermaid.init(undefined, document.querySelectorAll('.mermaid'));
    }
  });
})();
