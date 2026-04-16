/**
 * Reading Experience Enhancement
 * 阅读体验增强脚本
 */

(function () {
  'use strict';

  /* ========================================
     1. 阅读进度条
  ======================================== */
  function initReadingProgress() {
    const progressBar = document.createElement('div');
    progressBar.className = 'reading-progress';
    progressBar.style.width = '0%';
    document.body.appendChild(progressBar);

    function updateProgress() {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const progress = (scrollTop / docHeight) * 100;
      progressBar.style.width = progress + '%';
    }

    window.addEventListener('scroll', throttle(updateProgress, 50), { passive: true });
    updateProgress();
  }

  /* ========================================
     2. 回到顶部按钮
  ======================================== */
  function initBackToTop() {
    let backToTop = document.querySelector('.back-to-top');

    if (!backToTop) {
      backToTop = document.createElement('button');
      backToTop.className = 'back-to-top';
      backToTop.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 15l-6-6-6 6"/>
        </svg>
      `;
      backToTop.setAttribute('aria-label', '回到顶部');
      document.body.appendChild(backToTop);
    }

    function toggleVisibility() {
      if (window.scrollY > 300) {
        backToTop.classList.add('visible');
      } else {
        backToTop.classList.remove('visible');
      }
    }

    backToTop.addEventListener('click', function () {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });

    window.addEventListener('scroll', throttle(toggleVisibility, 100), { passive: true });
    toggleVisibility();
  }

  /* ========================================
     3. 目录高亮当前章节
  ======================================== */
  function initTocHighlight() {
    const toc = document.querySelector('.post-catalog');
    if (!toc) return;

    const headings = document.querySelectorAll('.markdown-body h1, .markdown-body h2, .markdown-body h3');
    const tocLinks = toc.querySelectorAll('.toc-link');

    if (headings.length === 0 || tocLinks.length === 0) return;

    const headingPositions = [];

    function updateHeadingPositions() {
      headingPositions.length = 0;
      headings.forEach(heading => {
        headingPositions.push({
          element: heading,
          top: heading.offsetTop - 100
        });
      });
    }

    function highlightCurrentHeading() {
      const scrollPos = window.scrollY;
      let currentHeading = null;

      for (let i = headingPositions.length - 1; i >= 0; i--) {
        if (scrollPos >= headingPositions[i].top) {
          currentHeading = headingPositions[i].element;
          break;
        }
      }

      tocLinks.forEach(link => {
        link.classList.remove('active');
        if (currentHeading && link.getAttribute('href') === '#' + currentHeading.id) {
          link.classList.add('active');
        }
      });
    }

    // 更新位置（在图片加载后）
    window.addEventListener('load', updateHeadingPositions);
    updateHeadingPositions();

    window.addEventListener('scroll', throttle(highlightCurrentHeading, 100), { passive: true });
    highlightCurrentHeading();
  }

  /* ========================================
     4. 图片懒加载
  ======================================== */
  function initLazyImages() {
    const images = document.querySelectorAll('.markdown-body img:not([loading])');

    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.loading = 'lazy';
            imageObserver.unobserve(img);
          }
        });
      }, {
        rootMargin: '50px 0px'
      });

      images.forEach(img => imageObserver.observe(img));
    } else {
      // 回退：直接设置懒加载
      images.forEach(img => {
        img.loading = 'lazy';
      });
    }
  }

  /* ========================================
     6. 图片点击放大
  ======================================== */
  function initImageZoom() {
    const images = document.querySelectorAll('.markdown-body img');

    images.forEach(img => {
      if (img.parentElement.tagName === 'A') return;

      img.style.cursor = 'zoom-in';
      img.addEventListener('click', function () {
        // 使用已有的 fancybox 或创建简单的放大效果
        if (window.$.fancybox) {
          $.fancybox.open(img.src);
        }
      });
    });
  }

  /* ========================================
     7. 平滑滚动到锚点
  ======================================== */
  function initSmoothAnchor() {
    document.addEventListener('click', function (e) {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;

      const targetId = link.getAttribute('href').slice(1);
      const target = document.getElementById(targetId);

      if (target) {
        e.preventDefault();
        const offset = 80; // header 高度
        const targetPosition = target.offsetTop - offset;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });

        // 更新 URL 但不跳转
        history.pushState(null, null, '#' + targetId);
      }
    });
  }

  /* ========================================
     8. 键盘快捷键
  ======================================== */
  function initKeyboardShortcuts() {
    document.addEventListener('keydown', function (e) {
      // ESC 关闭搜索
      if (e.key === 'Escape') {
        const searchOverlay = document.querySelector('.search-overlay');
        if (searchOverlay && !searchOverlay.classList.contains('hidden')) {
          searchOverlay.classList.add('hidden');
        }
      }

      // / 打开搜索
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        const searchInput = document.getElementById('search-input');
        if (searchInput && document.activeElement.tagName !== 'INPUT') {
          e.preventDefault();
          searchInput.focus();
        }
      }
    });
  }

  /* ========================================
     9. 阅读时间估计
  ======================================== */
  function initReadingTime() {
    const content = document.querySelector('.markdown-body');
    if (!content) return;

    const text = content.textContent;
    const wordCount = text.trim().split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200); // 假设阅读速度 200 字/分钟

    // 查找或创建阅读时间显示元素
    let readingTimeEl = document.querySelector('.reading-time');
    if (!readingTimeEl) {
      const postAttach = document.querySelector('.post-attach');
      if (postAttach) {
        readingTimeEl = document.createElement('span');
        readingTimeEl.className = 'reading-time';
        postAttach.appendChild(readingTimeEl);
      }
    }

    if (readingTimeEl) {
      readingTimeEl.innerHTML = `<i class="iconfont icon-time"></i> ${readingTime} 分钟阅读`;
    }
  }

  /* ========================================
     工具函数
  ======================================== */
  function throttle(func, limit) {
    let inThrottle;
    return function () {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /* ========================================
     初始化
  ======================================== */
  function init() {
    initReadingProgress();
    initBackToTop();
    initTocHighlight();
    initLazyImages();
    initImageZoom();
    initSmoothAnchor();
    initKeyboardShortcuts();
    initReadingTime();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

