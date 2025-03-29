// Mermaid 配置 - 科技风格
document.addEventListener('DOMContentLoaded', function () {
  // 检测当前颜色模式
  const isDarkMode = document.documentElement.getAttribute('color-mode') === 'dark';

  // 科技风格配色
  const techColors = {
    light: {
      background: 'transparent',
      nodeBg: '#f0f6ff',
      nodeBorder: '#4b89dc',
      lineColor: '#4b89dc',
      textColor: '#333',
      clusterBg: '#f8fafc',
      clusterBorder: '#c6d2e0',
      accentColor: '#0366d6',
      secondaryColor: '#5a6acf'
    },
    dark: {
      background: 'transparent',
      nodeBg: '#1d232a',
      nodeBorder: '#4b89dc',
      lineColor: '#4b89dc',
      textColor: '#adbac7',
      clusterBg: '#22272e',
      clusterBorder: '#444c56',
      accentColor: '#58a6ff',
      secondaryColor: '#7c84cb'
    }
  };

  // 选择当前模式的配色
  const colors = isDarkMode ? techColors.dark : techColors.light;

  mermaid.initialize({
    startOnLoad: true,
    theme: isDarkMode ? 'dark' : 'default',
    securityLevel: 'loose',
    themeCSS: `
        /* 基础节点样式 - 科技风格 */
        .node rect, .node circle, .node ellipse, .node polygon, .node path {
            fill: ${colors.nodeBg};
            stroke: ${colors.nodeBorder};
            stroke-width: 1.5px;
            rx: 4px;
            ry: 4px;
        }
        
        /* 边线样式 - 科技风格 */
        .edgePath .path {
            stroke: ${colors.lineColor};
            stroke-width: 1.5px;
        }
        
        /* 标签样式 - 科技风格 */
        .label {
            color: ${colors.textColor};
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
            font-weight: 500;
        }
        
        /* 集群样式 - 科技风格 */
        .cluster rect {
            fill: ${colors.clusterBg};
            stroke: ${colors.clusterBorder};
            rx: 6px;
            ry: 6px;
        }
        
        /* 类图样式 - 科技风格 */
        .classLabel .label {
            fill: ${colors.textColor};
            font-weight: 600;
        }
        
        .classTitle {
            font-weight: 600;
            fill: ${colors.accentColor};
        }
        
        /* 状态图样式 - 科技风格 */
        g.stateGroup rect {
            fill: ${colors.nodeBg};
            stroke: ${colors.nodeBorder};
            rx: 4px;
            ry: 4px;
        }
        
        /* 甘特图样式 - 科技风格 */
        .taskText {
            fill: ${colors.textColor};
            font-weight: 500;
        }
        
        .taskTextOutsideRight {
            fill: ${colors.textColor};
            font-weight: 500;
        }
        
        .task {
            fill: ${colors.accentColor};
            stroke: ${colors.accentColor};
        }
        
        /* 序列图样式 - 科技风格 */
        .actor {
            fill: ${colors.nodeBg};
            stroke: ${colors.nodeBorder};
            rx: 4px;
            ry: 4px;
        }
        
        .messageLine0, .messageLine1 {
            stroke: ${colors.lineColor};
        }
        
        .note {
            fill: ${colors.secondaryColor};
            stroke: ${colors.secondaryColor};
            rx: 4px;
            ry: 4px;
        }
        
        .noteText {
            fill: white;
            font-weight: 500;
        }
        `,
    flowchart: {
      htmlLabels: true,
      curve: 'basis',
      useMaxWidth: true
    },
    sequence: {
      diagramMarginX: 50,
      diagramMarginY: 10,
      boxMargin: 10,
      noteMargin: 10,
      messageMargin: 35,
      mirrorActors: false,
      bottomMarginAdj: 10,
      useMaxWidth: true
    },
    gantt: {
      titleTopMargin: 25,
      barHeight: 20,
      barGap: 4,
      topPadding: 50,
      leftPadding: 75,
      gridLineStartPadding: 35,
      fontSize: 11,
      fontFamily: '"Open-Sans", "sans-serif"',
      numberSectionStyles: 4,
      axisFormat: '%Y-%m-%d'
    }
  });

  // 监听颜色模式变化，重新初始化 Mermaid
  const observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      if (mutation.attributeName === 'color-mode') {
        // 重新加载页面以应用新的颜色模式
        location.reload();
      }
    });
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['color-mode']
  });
}); 