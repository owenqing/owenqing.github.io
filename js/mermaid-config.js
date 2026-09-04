/**
 * Mermaid Configuration
 * Mermaid 图表配置
 */

(function() {
  'use strict';

  var FONT_STACK = [
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Roboto',
    '"Helvetica Neue"',
    'Arial',
    '"PingFang SC"',
    '"Hiragino Sans GB"',
    '"Microsoft YaHei"',
    'sans-serif'
  ].join(', ');

  function getThemeVariables(isDark) {
    if (isDark) {
      return {
        background: 'transparent',
        primaryColor: '#161b22',
        primaryTextColor: '#e6edf3',
        primaryBorderColor: '#444c56',
        secondaryColor: '#21262d',
        secondaryTextColor: '#8b949e',
        secondaryBorderColor: '#30363d',
        tertiaryColor: '#0d1117',
        tertiaryTextColor: '#8b949e',
        tertiaryBorderColor: '#30363d',
        lineColor: '#8b949e',
        textColor: '#e6edf3',
        nodeTextColor: '#e6edf3',
        clusterBkg: '#0d1117',
        clusterBorder: '#30363d',
        edgeLabelBackground: '#161b22',
        titleColor: '#e6edf3',
        fontSize: '15px'
      };
    }

    return {
      background: 'transparent',
      primaryColor: '#ffffff',
      primaryTextColor: '#24292f',
      primaryBorderColor: '#d0d7de',
      secondaryColor: '#f6f8fa',
      secondaryTextColor: '#57606a',
      secondaryBorderColor: '#d8dee4',
      tertiaryColor: '#f6f8fa',
      tertiaryTextColor: '#57606a',
      tertiaryBorderColor: '#eaeef2',
      lineColor: '#57606a',
      textColor: '#24292f',
      nodeTextColor: '#24292f',
      clusterBkg: '#f6f8fa',
      clusterBorder: '#d8dee4',
      edgeLabelBackground: '#ffffff',
      titleColor: '#24292f',
      fontSize: '15px'
    };
  }

  function getMermaidConfig(isDark, startOnLoad) {
    return {
      startOnLoad: startOnLoad !== false,
      theme: 'base',
      securityLevel: 'loose',
      fontFamily: FONT_STACK,
      themeVariables: getThemeVariables(isDark),
      flowchart: {
        curve: 'linear',
        nodeSpacing: 50,
        rankSpacing: 70,
        padding: 16,
        diagramPadding: 16,
        htmlLabels: true,
        useMaxWidth: true
      },
      sequence: {
        useMaxWidth: true,
        actorMargin: 60,
        boxMargin: 10,
        boxTextMargin: 5,
        noteMargin: 10,
        messageMargin: 35,
        mirrorActors: false
      },
      gantt: { useMaxWidth: true }
    };
  }

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
    mermaid.initialize(getMermaidConfig(isDark));

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
    mermaid.initialize(getMermaidConfig(isDark, false));

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
