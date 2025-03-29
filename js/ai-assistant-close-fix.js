document.addEventListener('DOMContentLoaded', function () {
    // 确保 DOM 完全加载后再绑定事件

    // 获取关闭按钮和容器
    const closeButton = document.querySelector('.ai-assistant-close');
    const container = document.querySelector('.ai-assistant-container');

    if (closeButton && container) {
        // 移除可能存在的旧事件监听器
        const newCloseButton = closeButton.cloneNode(true);
        closeButton.parentNode.replaceChild(newCloseButton, closeButton);

        // 添加新的事件监听器
        newCloseButton.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            container.classList.add('hidden');
            container.classList.remove('visible');
            console.log('AI Assistant closed');
        });

        // 保留 ESC 键关闭功能
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && !container.classList.contains('hidden')) {
                container.classList.add('hidden');
                container.classList.remove('visible');
                console.log('AI Assistant closed by ESC');
            }
        });
    } else {
        console.error('AI Assistant close button or container not found');
    }
}); 