// 控制header滚动效果的脚本
document.addEventListener('DOMContentLoaded', function () {
    const header = document.querySelector('.header');
    let lastScrollTop = 0;

    // 监听滚动事件
    window.addEventListener('scroll', function () {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        // 当滚动超过50px时添加scrolled类
        if (scrollTop > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        lastScrollTop = scrollTop;
    });
});