// Add 'active' class to currently selected tag
document.addEventListener('DOMContentLoaded', function () {
    // Get the current URL path
    const currentPath = window.location.pathname;

    // Check if we're on a tag page
    if (currentPath.includes('/tags/')) {
        // Get the tag name from the URL
        const tagName = currentPath.split('/tags/')[1].replace(/\/$/, '');

        // Find all tag links
        const tagLinks = document.querySelectorAll('.tag-list-link');

        // Loop through each tag link
        tagLinks.forEach(link => {
            // Get the tag from the href
            const linkPath = link.getAttribute('href');
            const linkTagName = linkPath.split('/tags/')[1].replace(/\/$/, '');

            // If this is the current tag, add the active class
            if (decodeURIComponent(linkTagName) === decodeURIComponent(tagName)) {
                link.classList.add('active');
            }
        });
    }
}); 