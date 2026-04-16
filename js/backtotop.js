/**
 * Back to Top Button
 * 回到顶部按钮
 */

(function () {
  'use strict';

  const backToTopBtn = document.querySelector('.back-to-top');
  if (!backToTopBtn) return;

  const SHOW_THRESHOLD = 300;

  /**
   * Toggle button visibility based on scroll position
   */
  function toggleVisibility() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    backToTopBtn.classList.toggle('hidden', scrollTop <= SHOW_THRESHOLD);
  }

  /**
   * Smooth scroll to top
   */
  function scrollToTop() {
    // Use native smooth scroll if supported
    if ('scrollBehavior' in document.documentElement.style) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } else {
      // Fallback for older browsers
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const duration = 300;
      const startTime = performance.now();

      function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3); // easeOutCubic

        const currentScroll = scrollTop * (1 - easeProgress);
        window.scrollTo(0, currentScroll);

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      }

      requestAnimationFrame(animate);
    }
  }

  /**
   * Throttle function
   */
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

  // Initialize
  toggleVisibility();

  // Use passive event listener for better scroll performance
  window.addEventListener('scroll', throttle(toggleVisibility, 100), { passive: true });

  // Click event
  backToTopBtn.addEventListener('click', scrollToTop);

  // Keyboard accessibility
  backToTopBtn.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      scrollToTop();
    }
  });
})();
