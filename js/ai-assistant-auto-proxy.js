// 添加到 ai-assistant.js 文件中

// 公共 CORS 代理列表
const publicProxies = [
    "https://corsproxy.io/?",
    "https://cors.sh/?",
    "https://cors-anywhere.azm.workers.dev/",
    "https://api.allorigins.win/raw?url=",
    "https://crossorigin.me/",
    "https://thingproxy.freeboard.io/fetch/"
];

// 自动测试并选择可用的代理
async function findWorkingProxy() {
    log('正在测试可用代理...');

    // 从本地存储获取之前找到的可用代理
    const cachedProxy = localStorage.getItem('aiAssistantWorkingProxy');
    if (cachedProxy) {
        log('使用缓存的代理:', cachedProxy);
        return cachedProxy;
    }

    // 测试所有代理
    for (const proxy of publicProxies) {
        try {
            log('测试代理:', proxy);
            const testUrl = proxy + 'http://localhost:11434/api/version';

            const response = await fetch(testUrl, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                signal: AbortSignal.timeout(3000) // 3秒超时
            });

            if (response.ok) {
                log('找到可用代理:', proxy);
                // 缓存可用代理
                localStorage.setItem('aiAssistantWorkingProxy', proxy);
                return proxy;
            }
        } catch (error) {
            log('代理不可用:', proxy, error);
        }
    }

    log('没有找到可用代理');
    return null;
}

// 修改 getOllamaApiUrl 函数
async function getOllamaApiUrlAsync(endpoint) {
    const baseUrl = 'http://localhost:11434/';
    const fullUrl = baseUrl + endpoint;

    // 检查是否在 GitHub Pages 环境
    const isGitHubPages = window.location.hostname.includes('github.io') ||
        window.location.protocol === 'https:';

    if (!isGitHubPages) {
        return fullUrl; // 本地环境直接访问
    }

    // 自动查找可用代理
    const workingProxy = await findWorkingProxy();
    if (workingProxy) {
        return workingProxy + fullUrl;
    }

    // 如果没有可用代理，返回原始URL（会失败，但至少有错误处理）
    return fullUrl;
}

// 由于 getOllamaApiUrl 现在是异步的，我们需要修改调用它的函数
// 修改 checkOllamaAvailability 函数
async function checkOllamaAvailability() {
    log('检查 Ollama 可用性...');

    // 清空模型选择器
    modelSelect.innerHTML = '<option value="checking">检测中...</option>';

    // 检查是否在 GitHub Pages 环境
    const isGitHubPages = window.location.hostname.includes('github.io') ||
        window.location.protocol === 'https:';

    try {
        // 获取 Ollama API URL (直接或通过代理)
        const ollamaUrl = await getOllamaApiUrlAsync('api/tags');

        log('使用 API URL:', ollamaUrl);

        // 请求 Ollama API 获取可用模型
        const response = await fetch(ollamaUrl, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(5000)
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        log('Ollama 可用，模型列表:', data);
        simulationMode = false;

        // 清空选择器
        modelSelect.innerHTML = '';

        // 添加模型选项
        if (data.models && data.models.length > 0) {
            data.models.forEach(model => {
                const option = document.createElement('option');
                option.value = model.name;
                option.textContent = model.name;
                modelSelect.appendChild(option);
            });

            // 设置默认模型
            currentModel = aiAssistantConfig.defaultModel || data.models[0].name;

            // 检查默认模型是否在列表中
            const modelExists = Array.from(modelSelect.options).some(opt => opt.value === currentModel);
            if (!modelExists && data.models.length > 0) {
                currentModel = data.models[0].name;
            }

            modelSelect.value = currentModel;

            // 添加成功连接提示
            if (isGitHubPages) {
                addStatusMessage('已成功连接到本地 Ollama 服务', 'success');
            }
        } else {
            // 没有可用模型
            const option = document.createElement('option');
            option.value = 'no-models';
            option.textContent = '没有可用模型';
            modelSelect.appendChild(option);
            currentModel = 'no-models';

            // 添加提示消息
            addStatusMessage('未检测到可用模型，请先安装模型', 'warning');
        }
    } catch (error) {
        log('Ollama 不可用，启用模拟模式:', error);
        simulationMode = true;

        // 设置为模拟模式
        modelSelect.innerHTML = '<option value="simulation">模拟模式</option>';
        currentModel = 'simulation';

        // 添加模拟模式提示
        if (isGitHubPages) {
            addStatusMessage('无法连接到本地 Ollama 服务。请确保：<br>1. 本地 Ollama 服务正在运行<br>2. 允许跨域请求', 'error');

            // 添加自动重试按钮
            addRetryButton();
        } else {
            addStatusMessage('Ollama 服务不可用，已启用模拟模式。请确保 Ollama 已安装并运行。', 'error', 'https://ollama.ai');
        }
    }
}

// 添加重试按钮
function addRetryButton() {
    const retryContainer = document.createElement('div');
    retryContainer.className = 'ai-retry-container';
    retryContainer.innerHTML = `
    <button class="ai-retry-button">重新尝试连接</button>
    <p class="ai-retry-tip">确保 Ollama 正在本地运行 (http://localhost:11434)</p>
  `;

    conversationEl.appendChild(retryContainer);

    // 添加重试按钮事件
    const retryButton = retryContainer.querySelector('.ai-retry-button');
    retryButton.addEventListener('click', function () {
        // 清除缓存的代理
        localStorage.removeItem('aiAssistantWorkingProxy');

        // 显示正在重试消息
        addStatusMessage('正在重新尝试连接...', 'info');

        // 重新检查连接
        checkOllamaAvailability();
    });
}

// 修改 sendToOllama 函数
async function sendToOllama(contentEl) {
    log('发送请求到 Ollama', currentModel, conversation);

    // 检查模型是否有效
    if (currentModel === 'no-models' || currentModel === 'checking') {
        contentEl.innerHTML = '<p class="ai-error">请先安装 Ollama 模型</p>';
        isWaiting = false;
        sendButton.disabled = inputEl.value.trim().length === 0;
        return;
    }

    // 构建请求体
    const requestBody = {
        model: currentModel,
        messages: conversation,
        stream: true
    };

    log('请求体:', JSON.stringify(requestBody));

    try {
        // 获取 API URL (直接或通过代理)
        const ollamaUrl = await getOllamaApiUrlAsync('api/chat');

        const response = await fetch(ollamaUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.status);
        }

        // 处理流式响应
        let fullResponse = '';
        const reader = response.body.getReader();

        while (true) {
            const { done, value } = await reader.read();

            if (done) {
                // 完成响应
                finishResponse(fullResponse, contentEl);
                break;
            }

            // 解码响应块
            const chunk = new TextDecoder().decode(value);
            log('收到响应块', chunk);

            // 处理 JSON 行
            const lines = chunk.split('\n');
            for (const line of lines) {
                if (line.trim() === '') continue;

                try {
                    const data = JSON.parse(line);
                    if (data.message && data.message.content) {
                        // 新版 Ollama API 格式
                        fullResponse += data.message.content;
                        updateStreamingContent(contentEl, fullResponse);
                    } else if (data.response) {
                        // 旧版 Ollama API 格式
                        fullResponse += data.response;
                        updateStreamingContent(contentEl, fullResponse);
                    } else if (data.done) {
                        // 响应完成
                        finishResponse(fullResponse, contentEl);
                        return;
                    }
                } catch (e) {
                    console.error('Error parsing JSON:', e, line);
                }
            }
        }
    } catch (error) {
        console.error('Error:', error);

        // 添加错误消息
        contentEl.innerHTML = `<p class="ai-error">请求失败: ${error.message}。请检查 Ollama 服务是否正常运行。</p>`;

        // 重置状态
        isWaiting = false;
        sendButton.disabled = inputEl.value.trim().length === 0;

        // 如果连接失败，切换到模拟模式
        if (!simulationMode) {
            log('连接失败，切换到模拟模式');
            simulationMode = true;
            modelSelect.innerHTML = '<option value="simulation">模拟模式</option>';
            currentModel = 'simulation';

            // 添加模拟模式提示
            contentEl.innerHTML += `<p>已自动切换到模拟模式，你可以继续使用 AI 助手</p>`;

            // 添加重试按钮
            addRetryButton();
        }
    }
}

// 修改 sendMessage 函数，使用异步版本
async function sendMessage() {
    if (isWaiting || inputEl.value.trim().length === 0) {
        return;
    }

    const userMessage = inputEl.value.trim();
    inputEl.value = '';
    inputEl.style.height = 'auto';

    // 添加用户消息到会话
    addMessage('user', userMessage);

    // 更新会话历史
    conversation.push({ role: 'user', content: userMessage });

    // 添加 AI 消息占位符
    const aiMessageEl = document.createElement('div');
    aiMessageEl.className = 'ai-message';

    const aiHeaderEl = document.createElement('div');
    aiHeaderEl.className = 'ai-message-header';

    const aiAvatarEl = document.createElement('div');
    aiAvatarEl.className = 'ai-message-avatar assistant';
    aiAvatarEl.textContent = 'AI';

    const aiNameEl = document.createElement('div');
    aiNameEl.className = 'ai-message-name';
    aiNameEl.textContent = 'AI 助手';

    aiHeaderEl.appendChild(aiAvatarEl);
    aiHeaderEl.appendChild(aiNameEl);

    const aiContentEl = document.createElement('div');
    aiContentEl.className = 'ai-message-content';
    aiContentEl.innerHTML = '<span class="ai-cursor"></span>';

    aiMessageEl.appendChild(aiHeaderEl);
    aiMessageEl.appendChild(aiContentEl);

    conversationEl.appendChild(aiMessageEl);
    conversationEl.scrollTop = conversationEl.scrollHeight;

    // 设置等待状态
    isWaiting = true;
    sendButton.disabled = true;

    // 根据模式发送请求
    if (simulationMode) {
        simulateResponse(aiContentEl);
    } else {
        await sendToOllama(aiContentEl);
    }
}

// 初始化时调用异步版本
document.addEventListener('DOMContentLoaded', function () {
    // ... 现有代码 ...

    // 替换 checkOllamaAvailability() 调用
    checkOllamaAvailability();

    // ... 现有代码 ...
}); 