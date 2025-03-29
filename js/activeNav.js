// 处理导航项激活状态
let navs = document.querySelectorAll('.nav-menu li');
let pagePath = window.location.pathname;

// 处理首页的特殊情况
if (pagePath === '/') {
  // 首页不激活任何导航项
  navs.forEach(nav => nav.classList.remove('active'));
} else {
  // 其他页面根据路径激活对应的导航项
  navs.forEach(nav => {
    let navPath = nav.querySelector('a').getAttribute('href');
    if (pagePath.includes(navPath) && navPath !== '/') {
      nav.classList.add('active');
    } else {
      nav.classList.remove('active');
    }
  });
}

// 注释掉这部分代码
/*
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
*/
