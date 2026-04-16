/**
 * Fancybox Image Gallery
 * Wraps images in markdown body for fancybox lightbox
 */

(function() {
  'use strict';

  function initFancybox() {
    if (typeof window.$ === 'undefined') {
      console.warn('jQuery not loaded, fancybox initialization skipped');
      return;
    }

    $(document).ready(function() {
      $(".markdown-body img").each(function () {
        // Skip images already wrapped in links
        if ($(this).parent().get(0).tagName.toLowerCase() === "a") {
          return;
        }

        var $link = $("<a>", {
          "data-fancybox": "gallery",
          "href": $(this).attr("data-original") || $(this).attr("src"),
          "css": {
            "text-decoration": "none",
            "outline": "none",
            "border": "0px none transparent"
          }
        });

        $(this).wrap($link);
      });
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFancybox);
  } else {
    initFancybox();
  }
})();
