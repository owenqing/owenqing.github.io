// 处理导航项激活状态
let navs = document.querySelectorAll('.nav-menu li');
let pagePath = window.location.pathname;

// 移除所有导航项的激活状态
navs.forEach(nav => nav.classList.remove('active'));

// 根据当前路径激活对应的导航项
let bestMatch = null;
let longestMatchLength = 0;

navs.forEach(nav => {
  const link = nav.querySelector('a');
  if (link) {
    const navPath = link.getAttribute('href');
    
    // 精确匹配是最佳选择
    if (pagePath === navPath) {
      bestMatch = nav;
      longestMatchLength = navPath.length;
      return;
    }

    // 为子页面进行前缀匹配 (例如 /archives/page/2)
    if (navPath !== '/' && pagePath.startsWith(navPath)) {
      if (navPath.length > longestMatchLength) {
        bestMatch = nav;
        longestMatchLength = navPath.length;
      }
    }
  }
});

if (bestMatch) {
  bestMatch.classList.add('active');
} else if (pagePath === '/') {
  // 单独处理首页
  const homeNav = document.querySelector('.nav-menu li a[href="/"]');
  if (homeNav) {
    homeNav.parentElement.classList.add('active');
  }
}
