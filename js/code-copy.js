/**
 * Code Block Copy Button - Notion Style
 * 代码块复制按钮
 */

(function () {
  'use strict';

  const INIT_MARK = 'data-copy-initialized';

  // 语言映射表
  const langMap = {
    'js': 'JavaScript',
    'javascript': 'JavaScript',
    'ts': 'TypeScript',
    'typescript': 'TypeScript',
    'py': 'Python',
    'python': 'Python',
    'go': 'Go',
    'golang': 'Go',
    'rs': 'Rust',
    'rust': 'Rust',
    'java': 'Java',
    'cpp': 'C++',
    'c++': 'C++',
    'c': 'C',
    'rb': 'Ruby',
    'ruby': 'Ruby',
    'php': 'PHP',
    'swift': 'Swift',
    'kt': 'Kotlin',
    'kotlin': 'Kotlin',
    'scala': 'Scala',
    'r': 'R',
    'md': 'Markdown',
    'markdown': 'Markdown',
    'json': 'JSON',
    'yaml': 'YAML',
    'yml': 'YAML',
    'xml': 'XML',
    'html': 'HTML',
    'css': 'CSS',
    'scss': 'SCSS',
    'sass': 'Sass',
    'less': 'Less',
    'sql': 'SQL',
    'sh': 'Shell',
    'bash': 'Shell',
    'shell': 'Shell',
    'zsh': 'Zsh',
    'ps': 'PowerShell',
    'dockerfile': 'Docker',
    'docker': 'Docker',
    'vim': 'Vim',
    'lua': 'Lua',
    'perl': 'Perl',
    'haskell': 'Haskell',
    'clojure': 'Clojure',
    'erlang': 'Erlang',
    'elixir': 'Elixir',
    'dart': 'Dart',
    'julia': 'Julia',
    'groovy': 'Groovy',
    'matlab': 'MATLAB',
    'tex': 'LaTeX',
    'latex': 'LaTeX',
    'diff': 'Diff',
    'patch': 'Patch'
  };

  function getLanguage(element) {
    const classes = element.className.split(' ');
    for (const cls of classes) {
      if (langMap[cls]) {
        return langMap[cls];
      }
    }
    // 返回第一个非 highlight 的 class
    const lang = classes.find(c => c && c !== 'highlight');
    return lang || 'code';
  }

  function initCodeCopy() {
    // 新结构: <pre><code class="highlight python">...</code></pre>
    // 给 pre 元素设置 data-lang，用于 CSS ::before 显示语言标签
    const codeElements = document.querySelectorAll('code.highlight:not([' + INIT_MARK + '])');

    codeElements.forEach(codeBlock => {
      const preBlock = codeBlock.parentElement;
      if (!preBlock || preBlock.tagName !== 'PRE') {
        return;
      }

      if (preBlock.querySelector('.copy-btn')) {
        codeBlock.setAttribute(INIT_MARK, 'true');
        return;
      }

      // 设置语言标签到 pre 元素（用于 CSS ::before 显示）
      const lang = getLanguage(codeBlock);
      preBlock.setAttribute('data-lang', lang);

      // 获取代码内容
      const codeContent = codeBlock.textContent;
      if (!codeContent || !codeContent.trim()) {
        return;
      }

      // 创建复制按钮（添加到 pre 元素）
      const copyBtn = document.createElement('button');
      copyBtn.className = 'copy-btn';
      copyBtn.setAttribute('type', 'button');
      copyBtn.setAttribute('aria-label', '复制代码');
      copyBtn.textContent = 'Copy';

      copyBtn.addEventListener('click', async function (e) {
        e.stopPropagation();

        try {
          await navigator.clipboard.writeText(codeContent);
          copyBtn.textContent = 'Copied!';
          copyBtn.classList.add('copied');

          setTimeout(() => {
            copyBtn.textContent = 'Copy';
            copyBtn.classList.remove('copied');
          }, 2000);
        } catch (err) {
          console.error('复制失败:', err);
          copyBtn.textContent = 'Failed';
          setTimeout(() => {
            copyBtn.textContent = 'Copy';
          }, 2000);
        }
      });

      preBlock.appendChild(copyBtn);
      codeBlock.setAttribute(INIT_MARK, 'true');
    });
  }

  function cleanupDuplicateButtons() {
    const pres = document.querySelectorAll('pre:has(> code.highlight)');
    pres.forEach(pre => {
      const buttons = pre.querySelectorAll('.copy-btn');
      if (buttons.length > 1) {
        for (let i = 1; i < buttons.length; i++) {
          buttons[i].remove();
        }
      }
    });
  }

  function observeNewCodeBlocks() {
    const observer = new MutationObserver(function (mutations) {
      let shouldInit = false;

      mutations.forEach(function (mutation) {
        mutation.addedNodes.forEach(function (node) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.classList && node.classList.contains('highlight')) {
              shouldInit = true;
            } else if (node.querySelector && node.querySelector('.highlight')) {
              shouldInit = true;
            }
          }
        });
      });

      if (shouldInit) {
        setTimeout(function () {
          initCodeCopy();
          cleanupDuplicateButtons();
        }, 100);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  function init() {
    cleanupDuplicateButtons();
    initCodeCopy();
    observeNewCodeBlocks();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 0);
  }
})();
