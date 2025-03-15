// which nav has active
let navs = document.querySelectorAll('.nav-item');
let pagePath = window.location.pathname;
for (let nav of navs) {
  let navPath = nav.getAttribute("data-path");
  if (navPath && navPath === pagePath) {
    nav.className = "nav-item active";
  }
}

// Scroll effect for header
const header = document.querySelector('.header');
let lastScroll = 0;

window.addEventListener('scroll', () => {
  const currentScroll = window.pageYOffset;

  if (currentScroll > 50) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }

  lastScroll = currentScroll;
});
