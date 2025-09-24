// Mermaid 配置 - 科技风格（仅浅色主题）
document.addEventListener('DOMContentLoaded', function() {
  // 定义科技风格配色方案（仅浅色）
  const techColors = {
    light: {
      nodeBg: '#ffffff',
      nodeBorder: '#6B7280',
      lineColor: '#6B7280',
      textColor: '#1F2937',
      clusterBg: '#F9FAFB',
      clusterBorder: '#E5E7EB',
      accentColor: '#3B82F6',
      secondaryColor: '#10B981'
    }
  };

  // 固定使用浅色模式
  const colors = techColors.light;

  mermaid.initialize({
    startOnLoad: true,
    theme: 'default',
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
});