// AI 助手调试脚本
// 此文件可以在调试完成后删除
console.log('AI 助手调试脚本已加载');
document.addEventListener('DOMContentLoaded', function () {
    // 不再创建调试元素，只保留控制台日志
    console.log('DOM 已加载完成');
    console.log('检查是否在文章页面:', !!document.querySelector('.article-entry'));

    // 检查 AI 助手元素是否存在
    setTimeout(() => {
        const aiTrigger = document.querySelector('.ai-assistant-trigger');
        const aiContainer = document.querySelector('.ai-assistant-container');

        console.log('AI 触发按钮存在:', !!aiTrigger);
        console.log('AI 容器存在:', !!aiContainer);
    }, 1000);

    // 添加调试按钮
    const debugButton = document.createElement('button');
    debugButton.textContent = 'Debug AI';
    debugButton.style.position = 'fixed';
    debugButton.style.bottom = '20px';
    debugButton.style.right = '20px';
    debugButton.style.zIndex = '10001';
    debugButton.style.padding = '8px 12px';
    debugButton.style.backgroundColor = '#f44336';
    debugButton.style.color = 'white';
    debugButton.style.border = 'none';
    debugButton.style.borderRadius = '4px';
    debugButton.style.cursor = 'pointer';

    debugButton.addEventListener('click', function () {
        const container = document.querySelector('.ai-assistant-container');
        if (!container) {
            console.error('AI 助手容器不存在');
            return;
        }

        // 强制显示
        container.style.display = 'flex';
        container.style.visibility = 'visible';
        container.style.opacity = '1';
        container.style.zIndex = '10000';
        container.classList.add('visible');
        container.classList.remove('hidden');

        // 居中显示
        container.style.top = '50%';
        container.style.left = '50%';
        container.style.transform = 'translate(-50%, -50%)';

        console.log('AI 助手已强制显示');
    });

    document.body.appendChild(debugButton);
}); 