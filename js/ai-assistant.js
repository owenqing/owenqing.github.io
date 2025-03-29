// 在文件开头添加调试模式配置
const aiAssistantConfig = {
    enable: true,
    defaultModel: "llama3",
    triggerIcon: "AI",
    title: "AI 阅读助手",
    debug: true, // 启用调试模式
    shortcut: {
        enable: true,
        key: "l",  // 快捷键为 Command/Ctrl + L
        modifiers: {
            metaKey: true,  // Command 键 (Mac) 或 Windows 键
            ctrlKey: true   // Ctrl 键 (Windows/Linux)
        }
    }
};

// 调试日志函数
function log(message, ...args) {
    console.log(`[AI助手] ${message}`, ...args);
}

// AI 阅读助手
document.addEventListener('DOMContentLoaded', function () {
    // 检查是否在文章页面 - 使用更宽松的检测
    const isContentPage = document.querySelector('.article-entry, .post-content, article, .content, .post, .page');

    if (!isContentPage) {
        return;
    }

    // 存储当前可用的 Ollama 端点
    let ollamaEndpoint = '/api/ollama';  // 默认使用代理

    // 创建 AI 助手悬浮球
    const floatBall = document.createElement('div');
    floatBall.className = 'ai-float-ball';
    floatBall.innerHTML = `<span class="ai-float-ball-icon">${aiAssistantConfig.triggerIcon}</span>`;
    document.body.appendChild(floatBall);

    // 创建 AI 助手容器
    const container = document.createElement('div');
    container.className = 'ai-assistant-container';
    container.innerHTML = `
    <div class="ai-assistant-header">
      <div class="ai-assistant-title">
        <div class="ai-assistant-title-icon">${aiAssistantConfig.triggerIcon}</div>
        ${aiAssistantConfig.title}
      </div>
      <div class="ai-assistant-controls">
        <select class="ai-assistant-model-select">
          <option value="checking">检测中...</option>
        </select>
        <button class="ai-assistant-close">×</button>
      </div>
    </div>
    <div class="ai-assistant-content">
      <div class="ai-assistant-selected-text"></div>
      <div class="ai-assistant-conversation"></div>
    </div>
    <div class="ai-assistant-input-container">
      <textarea class="ai-assistant-input" placeholder="输入问题..." rows="1"></textarea>
      <button class="ai-assistant-send" disabled>发送</button>
    </div>
  `;
    document.body.appendChild(container);

    // 获取元素引用
    const selectedTextEl = container.querySelector('.ai-assistant-selected-text');
    const conversationEl = container.querySelector('.ai-assistant-conversation');
    const inputEl = container.querySelector('.ai-assistant-input');
    const sendButton = container.querySelector('.ai-assistant-send');
    const modelSelect = container.querySelector('.ai-assistant-model-select');
    const closeButton = container.querySelector('.ai-assistant-close');

    // 当前选中的文本
    let selectedText = '';
    // 当前会话历史
    let conversation = [];
    // 当前选择的模型
    let currentModel = '';
    // 是否正在等待响应
    let isWaiting = false;

    // 添加模拟模式
    let simulationMode = false;

    // 初始化
    setupDraggableFloatBall();
    setupDraggableContainer();
    setupTextSelection();
    setupShortcut();
    setupOllamaRetryCheck();
    checkOllamaAvailability();

    // 点击悬浮球 - 完全重写事件处理
    floatBall.addEventListener('click', function (e) {
        console.log('悬浮球被点击');

        // 重置拖动状态
        floatBall.isDragging = false;

        // 调试信息
        console.log('容器状态(点击前):', {
            display: window.getComputedStyle(container).display,
            opacity: window.getComputedStyle(container).opacity,
            visibility: window.getComputedStyle(container).visibility,
            zIndex: window.getComputedStyle(container).zIndex,
            classList: Array.from(container.classList)
        });

        // 显示助手对话框 - 直接设置样式而不是调用函数
        console.log('显示助手对话框');

        // 设置位置
        setDefaultPosition();

        // 直接设置样式确保可见
        container.style.display = 'flex';
        container.style.visibility = 'visible';
        container.style.opacity = '1';
        container.style.zIndex = '10000';
        container.classList.add('visible');
        container.classList.remove('hidden');

        // 处理选中文本
        if (selectedText) {
            selectedTextEl.textContent = selectedText;
            selectedTextEl.style.display = 'block';
        } else {
            selectedTextEl.style.display = 'none';
        }

        // 聚焦到输入框
        setTimeout(() => {
            inputEl.focus();

            // 再次检查状态
            console.log('容器状态(显示后):', {
                display: window.getComputedStyle(container).display,
                opacity: window.getComputedStyle(container).opacity,
                visibility: window.getComputedStyle(container).visibility,
                zIndex: window.getComputedStyle(container).zIndex,
                classList: Array.from(container.classList)
            });
        }, 100);
    });

    // 辅助函数：设置默认居中位置
    function setDefaultPosition() {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // 计算居中位置
        const containerWidth = 500; // 默认宽度
        const containerHeight = 400; // 估计高度

        container.style.left = `${Math.max(0, (viewportWidth - containerWidth) / 2)}px`;
        container.style.top = `${Math.max(0, (viewportHeight - containerHeight) / 2)}px`;
    }

    // 模型选择变化
    modelSelect.addEventListener('change', function () {
        currentModel = this.value;
    });

    // 自动调整输入框高度
    inputEl.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';

        // 启用/禁用发送按钮
        sendButton.disabled = this.value.trim().length === 0 || currentModel === 'unavailable' || isWaiting;
    });

    // 按下 Enter 发送消息
    inputEl.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!sendButton.disabled) {
                sendMessage();
            }
        }
    });

    // 发送按钮点击
    sendButton.addEventListener('click', sendMessage);

    // 确保 ESC 键关闭功能仍然有效
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !container.classList.contains('hidden')) {
            container.classList.add('hidden');
            container.classList.remove('visible');
            console.log('ESC 关闭对话框');
        }
    });

    // 窗口大小变化时调整位置
    window.addEventListener('resize', function () {
        if (container.classList.contains('visible')) {
            // 重新计算位置，确保在视口内
            const rect = container.getBoundingClientRect();

            if (rect.right > window.innerWidth) {
                container.style.left = `${window.innerWidth - rect.width - 20}px`;
            }

            if (rect.bottom > window.innerHeight) {
                container.style.top = `${window.innerHeight - rect.height - 20}px`;
            }
        }

        // 确保悬浮球在视口内
        const ballRect = floatBall.getBoundingClientRect();
        if (ballRect.right > window.innerWidth) {
            floatBall.style.left = `${window.innerWidth - ballRect.width - 20}px`;
            floatBall.style.right = 'auto';
        }
        if (ballRect.bottom > window.innerHeight) {
            floatBall.style.top = `${window.innerHeight - ballRect.height - 20}px`;
            floatBall.style.bottom = 'auto';
        }
    });

    // 设置可拖动悬浮球
    function setupDraggableFloatBall() {
        let isDragging = false;
        let startX, startY, startLeft, startTop;

        floatBall.addEventListener('mousedown', function (e) {
            // 只有在按下左键时才开始拖动
            if (e.button !== 0) return;

            isDragging = true;
            floatBall.isDragging = false; // 重置点击检测标志

            startX = e.clientX;
            startY = e.clientY;

            const rect = floatBall.getBoundingClientRect();
            startLeft = rect.left;
            startTop = rect.top;

            floatBall.classList.add('dragging');

            e.preventDefault(); // 防止选中文本
        });

        document.addEventListener('mousemove', function (e) {
            if (!isDragging) return;

            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;

            // 如果移动超过 3px，标记为拖动而不是点击
            if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
                floatBall.isDragging = true;
            }

            floatBall.style.left = `${startLeft + deltaX}px`;
            floatBall.style.top = `${startTop + deltaY}px`;
            floatBall.style.right = 'auto';
            floatBall.style.bottom = 'auto';
        });

        document.addEventListener('mouseup', function () {
            if (!isDragging) return;

            isDragging = false;
            floatBall.classList.remove('dragging');

            // 延迟重置拖动标志，以便点击事件可以检查它
            setTimeout(() => {
                if (floatBall.isDragging) {
                    floatBall.isDragging = false;
                }
            }, 100);
        });
    }

    // 优化文本选择处理
    function setupTextSelection() {
        let selectionTimeout;
        let isSelecting = false;

        // 监听选择开始事件
        document.addEventListener('selectstart', function () {
            isSelecting = true;
            // 清除之前的超时
            if (selectionTimeout) {
                clearTimeout(selectionTimeout);
            }
        });

        // 监听选择变化事件
        document.addEventListener('selectionchange', function () {
            // 只有在选择模式下才处理
            if (!isSelecting) return;

            // 清除之前的超时
            if (selectionTimeout) {
                clearTimeout(selectionTimeout);
            }

            // 设置新的超时，避免频繁触发
            selectionTimeout = setTimeout(function () {
                const selection = window.getSelection();
                const newSelectedText = selection.toString().trim();

                // 更新选中文本
                selectedText = newSelectedText;

                // 如果对话框已经显示，更新选中文本显示
                if (container.classList.contains('visible')) {
                    if (selectedText) {
                        selectedTextEl.textContent = selectedText;
                        selectedTextEl.style.display = 'block';
                    } else {
                        // 如果没有选中文本，隐藏选中文本区域
                        selectedTextEl.style.display = 'none';
                    }
                }

                // 添加或移除选择激活样式
                if (selectedText) {
                    floatBall.classList.add('selection-active');
                } else {
                    floatBall.classList.remove('selection-active');
                }
            }, 200); // 200ms 延迟，使体验更丝滑
        });

        // 监听选择结束事件
        document.addEventListener('mouseup', function () {
            // 延迟一点时间再重置选择状态，以便处理点击事件
            setTimeout(() => {
                isSelecting = false;
            }, 100);
        });
    }

    // 修复快捷键功能
    function setupShortcut() {
        if (aiAssistantConfig.shortcut && aiAssistantConfig.shortcut.enable) {
            console.log('设置快捷键:', aiAssistantConfig.shortcut.key);

            window.addEventListener('keydown', function (e) {
                // 检查是否匹配配置的快捷键
                const isMetaKeyMatch = aiAssistantConfig.shortcut.modifiers.metaKey && e.metaKey;
                const isCtrlKeyMatch = aiAssistantConfig.shortcut.modifiers.ctrlKey && e.ctrlKey;
                const isKeyMatch = e.key.toLowerCase() === aiAssistantConfig.shortcut.key.toLowerCase();

                if (isKeyMatch && (isMetaKeyMatch || isCtrlKeyMatch)) {
                    console.log('快捷键触发!', container.classList.contains('visible'));
                    e.preventDefault(); // 阻止默认行为

                    // 切换显示/隐藏
                    if (container.classList.contains('visible') || !container.classList.contains('hidden')) {
                        console.log('关闭对话框');
                        container.classList.remove('visible');
                        container.classList.add('hidden');
                    } else {
                        console.log('打开对话框');
                        // 使用快捷键模式显示
                        container.classList.remove('hidden');
                        showAssistant({
                            mode: 'default'
                        });
                    }
                }

                // 添加 Escape 键关闭功能
                if (e.key === 'Escape' && container.classList.contains('visible')) {
                    console.log('ESC 关闭对话框');
                    container.classList.remove('visible');
                    container.classList.add('hidden');
                }
            });
        }
    }

    // 显示助手的函数 - 确保正确显示
    function showAssistant(options = {}) {
        // 默认选项
        const defaults = {
            mode: 'default'
        };

        const settings = { ...defaults, ...options };

        // 根据模式确定位置
        if (settings.mode === 'default') {
            // 始终使用居中位置
            setDefaultPosition();
        }

        // 显示容器 - 确保可见性
        container.style.display = 'flex'; // 确保显示
        container.style.opacity = '0';
        container.classList.add('visible');
        container.classList.remove('hidden');

        // 强制重绘，确保过渡效果正常
        setTimeout(() => {
            container.style.opacity = '1';
        }, 10);

        // 处理选中文本
        if (selectedText) {
            // 更新选中文本显示
            selectedTextEl.textContent = selectedText;
            selectedTextEl.style.display = 'block';

            // 其他处理...
        } else {
            selectedTextEl.style.display = 'none';
        }

        // 聚焦到输入框
        setTimeout(() => {
            inputEl.focus();
        }, 100);
    }

    // 检查 Ollama 可用性
    function checkOllamaAvailability() {
        log('检查 Ollama 可用性...');

        // 清空模型选择器
        modelSelect.innerHTML = '<option value="checking">检测中...</option>';

        // 尝试多个可能的 Ollama API 端点
        const endpoints = [
            '/api/ollama/tags',  // 代理服务器路径
            'http://localhost:11434/api/tags'  // 本地直连路径
        ];

        // 依次尝试每个端点，而不是使用 Promise.any
        tryNextEndpoint(endpoints, 0);
    }

    // 递归尝试下一个端点
    function tryNextEndpoint(endpoints, index) {
        if (index >= endpoints.length) {
            // 所有端点都失败了
            handleOllamaUnavailable(new Error("所有连接尝试都失败了"));
            return;
        }

        const endpoint = endpoints[index];
        log(`尝试连接到 Ollama 端点: ${endpoint}`);

        // 对于本地端点，先尝试直接访问，如果失败再使用探测方法
        if (endpoint.includes('localhost')) {
            try {
                // 尝试直接访问本地端点
                fetch(endpoint, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    signal: AbortSignal.timeout(3000) // 3秒超时
                })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }
                        // 记录成功的端点
                        ollamaEndpoint = endpoint.replace('/tags', '');
                        log(`成功直接连接到本地端点: ${ollamaEndpoint}`);
                        return response.json();
                    })
                    .then(data => {
                        handleOllamaAvailable(data);
                    })
                    .catch(error => {
                        log(`直接访问本地端点失败，尝试探测方法: ${error.message}`);
                        // 如果直接访问失败，尝试探测方法
                        probeLocalEndpoint(endpoints, index);
                    });
            } catch (error) {
                // 如果 fetch 本身抛出错误（如 CORS），尝试探测方法
                log(`直接访问本地端点出错，尝试探测方法: ${error.message}`);
                probeLocalEndpoint(endpoints, index);
            }
            return;
        }

        // 对于非本地端点，使用正常的 fetch
        fetch(endpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            signal: AbortSignal.timeout(5000) // 5秒超时
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                // 记录成功的端点
                ollamaEndpoint = endpoint.replace('/tags', '');
                log(`成功连接到端点: ${ollamaEndpoint}`);
                return response.json();
            })
            .then(data => {
                handleOllamaAvailable(data);
            })
            .catch(error => {
                log(`端点 ${endpoint} 连接失败: ${error.message}`);
                // 尝试下一个端点
                tryNextEndpoint(endpoints, index + 1);
            });
    }

    // 使用图片探测本地端点
    function probeLocalEndpoint(endpoints, index) {
        const baseUrl = endpoints[index].replace('/api/tags', '');

        // 使用 Image 对象探测本地服务是否可用
        const probeImg = new Image();
        const probeTimeout = setTimeout(() => {
            log('本地 Ollama 探测超时');
            probeImg.onload = probeImg.onerror = null;
            tryNextEndpoint(endpoints, index + 1);
        }, 2000);

        probeImg.onload = function () {
            clearTimeout(probeTimeout);
            log('本地 Ollama 可能可用，尝试通过代理访问');
            // 如果图片加载成功，说明本地服务可能在运行
            // 我们仍然使用代理路径，但知道本地服务是可用的
            ollamaEndpoint = '/api/ollama';
            fetchOllamaModels(ollamaEndpoint + '/tags');
        };

        probeImg.onerror = function () {
            clearTimeout(probeTimeout);
            log('本地 Ollama 探测失败，尝试下一个端点');
            tryNextEndpoint(endpoints, index + 1);
        };

        // 尝试加载一个小图片或图标，这通常会快速失败如果服务不可用
        probeImg.src = `${baseUrl}/favicon.ico?` + new Date().getTime();
    }

    // 新增函数：通过代理获取 Ollama 模型
    function fetchOllamaModels(endpoint) {
        fetch(endpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                handleOllamaAvailable(data);
            })
            .catch(error => {
                log(`通过代理获取模型失败: ${error.message}`);
                handleOllamaUnavailable(error);
            });
    }

    // 处理 Ollama 可用的情况
    function handleOllamaAvailable(data) {
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
    }

    // 处理 Ollama 不可用的情况
    function handleOllamaUnavailable(error) {
        log('Ollama 不可用，启用模拟模式:', error);
        simulationMode = true;

        // 设置为模拟模式
        modelSelect.innerHTML = '<option value="simulation">模拟模式</option>';
        currentModel = 'simulation';

        // 添加模拟模式提示
        addStatusMessage('Ollama 服务不可用，已启用模拟模式。请确保 Ollama 已安装并运行。', 'error', 'https://ollama.ai');
    }

    // 添加状态消息
    function addStatusMessage(message, type = 'info', link = null) {
        const statusMessage = document.createElement('div');
        statusMessage.className = 'ai-status-message';

        if (type === 'error') {
            statusMessage.classList.add('ai-status-error');
        } else if (type === 'warning') {
            statusMessage.classList.add('ai-status-warning');
        }

        let messageHTML = `<p>${message}</p>`;

        if (link) {
            messageHTML += `<p><a href="${link}" target="_blank" rel="noopener">了解更多</a></p>`;
        }

        statusMessage.innerHTML = messageHTML;
        conversationEl.appendChild(statusMessage);
    }

    // 添加上下文消息
    function addContextMessage(text) {
        const contextEl = document.createElement('div');
        contextEl.className = 'ai-context-message';
        contextEl.innerHTML = `
        <div class="ai-context-header">
            <div class="ai-context-icon">📄</div>
            <div class="ai-context-title">选中内容</div>
        </div>
        <div class="ai-context-content">${text}</div>
    `;

        conversationEl.appendChild(contextEl);
        conversationEl.scrollTop = conversationEl.scrollHeight;
    }

    // 发送消息
    function sendMessage() {
        const message = inputEl.value.trim();
        if (!message || isWaiting) return;

        // 添加用户消息
        addMessage('user', message);

        // 构建请求内容
        let prompt = message;

        // 如果有选中文本，将其作为上下文
        if (selectedText) {
            prompt = `以下是文章的一部分内容：\n\n${selectedText}\n\n${message}`;
        }

        // 更新会话历史
        conversation.push({ role: 'user', content: prompt });

        // 清空输入框
        inputEl.value = '';
        inputEl.style.height = 'auto';

        // 禁用发送按钮
        isWaiting = true;
        sendButton.disabled = true;

        // 创建助手消息元素
        const messageEl = document.createElement('div');
        messageEl.className = 'ai-message';

        const headerEl = document.createElement('div');
        headerEl.className = 'ai-message-header';

        const avatarEl = document.createElement('div');
        avatarEl.className = 'ai-message-avatar assistant';
        avatarEl.textContent = 'AI';

        const nameEl = document.createElement('div');
        nameEl.className = 'ai-message-name';
        nameEl.textContent = 'AI 助手';

        headerEl.appendChild(avatarEl);
        headerEl.appendChild(nameEl);

        const contentEl = document.createElement('div');
        contentEl.className = 'ai-message-content';
        contentEl.innerHTML = '<p><span class="ai-cursor"></span></p>';

        messageEl.appendChild(headerEl);
        messageEl.appendChild(contentEl);

        conversationEl.appendChild(messageEl);
        conversationEl.scrollTop = conversationEl.scrollHeight;

        // 检查是否使用模拟模式
        if (simulationMode) {
            // 模拟流式响应
            simulateStreamingResponse(contentEl);
        } else {
            // 发送请求到 Ollama
            sendToOllama(contentEl);
        }
    }

    // 模拟流式响应
    function simulateStreamingResponse(contentEl) {
        const simulatedResponses = [
            "我是一个模拟的 AI 助手，目前 Ollama 服务不可用。",
            "我可以帮助你理解文章内容，但现在是模拟模式。",
            "你可以尝试安装并运行 Ollama 来获得真实的 AI 体验。",
            "模拟模式下，我的回答是预设的，不会根据你的问题变化。",
            "这是一个 **Markdown** 格式的回答示例，支持 `代码` 和其他格式。\n\n```javascript\nconsole.log('Hello World');\n```\n\n- 列表项 1\n- 列表项 2"
        ];

        const randomResponse = simulatedResponses[Math.floor(Math.random() * simulatedResponses.length)];
        let currentText = '';
        let index = 0;

        // 模拟打字效果
        const typingInterval = setInterval(() => {
            if (index < randomResponse.length) {
                currentText += randomResponse[index];
                updateStreamingContent(contentEl, currentText);
                index++;
            } else {
                clearInterval(typingInterval);
                finishResponse(randomResponse, contentEl);
            }
        }, 30);
    }

    // 发送请求到 Ollama
    function sendToOllama(contentEl) {
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

        // 使用当前可用的 Ollama 端点
        fetch(`${ollamaEndpoint}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok: ' + response.status);
                }

                // 处理流式响应
                let fullResponse = '';

                const reader = response.body.getReader();

                function processStream() {
                    return reader.read().then(({ done, value }) => {
                        if (done) {
                            // 完成响应
                            finishResponse(fullResponse, contentEl);
                            return;
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

                        // 继续处理流
                        return processStream();
                    });
                }

                return processStream();
            })
            .catch(error => {
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
                }
            });
    }

    // 更新流式内容
    function updateStreamingContent(contentEl, text) {
        // 使用改进的 Markdown 渲染
        contentEl.innerHTML = renderMarkdown(text) + '<span class="ai-cursor"></span>';

        // 滚动到底部
        conversationEl.scrollTop = conversationEl.scrollHeight;

        // 如果有代码块，添加语法高亮
        if (contentEl.querySelector('pre.code-block')) {
            highlightCodeBlocks(contentEl);
        }
    }

    // 完成响应
    function finishResponse(text, contentEl) {
        log('完成响应', text);

        // 更新会话历史
        conversation.push({ role: 'assistant', content: text });

        // 最终更新 UI，移除光标
        contentEl.innerHTML = renderMarkdown(text);

        // 如果有代码块，添加语法高亮
        if (contentEl.querySelector('pre.code-block')) {
            highlightCodeBlocks(contentEl);
        }

        // 重置状态
        isWaiting = false;
        sendButton.disabled = inputEl.value.trim().length === 0;
    }

    // 代码块语法高亮
    function highlightCodeBlocks(container) {
        // 如果页面上已经有 highlight.js，使用它来高亮代码
        if (window.hljs) {
            container.querySelectorAll('pre.code-block code').forEach(block => {
                window.hljs.highlightElement(block);
            });
        }
    }

    // 添加消息
    function addMessage(role, content) {
        const messageEl = document.createElement('div');
        messageEl.className = 'ai-message';

        const headerEl = document.createElement('div');
        headerEl.className = 'ai-message-header';

        const avatarEl = document.createElement('div');
        avatarEl.className = `ai-message-avatar ${role}`;
        avatarEl.textContent = role === 'user' ? 'U' : 'AI';

        const nameEl = document.createElement('div');
        nameEl.className = 'ai-message-name';
        nameEl.textContent = role === 'user' ? '你' : 'AI 助手';

        headerEl.appendChild(avatarEl);
        headerEl.appendChild(nameEl);

        const contentEl = document.createElement('div');
        contentEl.className = 'ai-message-content';

        // 使用改进的 Markdown 渲染
        contentEl.innerHTML = renderMarkdown(content);

        messageEl.appendChild(headerEl);
        messageEl.appendChild(contentEl);

        conversationEl.appendChild(messageEl);

        // 滚动到底部
        conversationEl.scrollTop = conversationEl.scrollHeight;
    }

    // 添加更强大的 Markdown 渲染函数
    function renderMarkdown(text) {
        // 代码块 (```code```)
        text = text.replace(/```([\s\S]*?)```/g, function (match, code) {
            // 检测语言
            const languageMatch = code.match(/^([a-zA-Z0-9_+-]+)\n/);
            let language = '';

            if (languageMatch) {
                language = languageMatch[1];
                code = code.substring(languageMatch[0].length);
            }

            return `<pre class="code-block${language ? ' language-' + language : ''}"><code>${escapeHtml(code.trim())}</code></pre>`;
        });

        // 行内代码 (`code`)
        text = text.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

        // 标题 (## Heading)
        text = text.replace(/^### (.*$)/gm, '<h3>$1</h3>');
        text = text.replace(/^## (.*$)/gm, '<h2>$1</h2>');
        text = text.replace(/^# (.*$)/gm, '<h1>$1</h1>');

        // 粗体 (**text**)
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // 斜体 (*text*)
        text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');

        // 链接 ([text](url))
        text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

        // 无序列表 (- item)
        text = text.replace(/^\s*-\s+(.*)/gm, '<li>$1</li>');
        text = text.replace(/<li>(.*)<\/li>\s*<li>/g, '<li>$1</li><li>');
        text = text.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

        // 有序列表 (1. item)
        text = text.replace(/^\s*\d+\.\s+(.*)/gm, '<li>$1</li>');
        text = text.replace(/<li>(.*)<\/li>\s*<li>/g, '<li>$1</li><li>');
        text = text.replace(/(<li>.*<\/li>)/s, '<ol>$1</ol>');

        // 段落和换行
        text = text.replace(/\n\n/g, '</p><p>');
        text = text.replace(/\n/g, '<br>');

        // 包装在段落中
        if (!text.startsWith('<h') && !text.startsWith('<ul') && !text.startsWith('<ol') && !text.startsWith('<p>')) {
            text = '<p>' + text + '</p>';
        }

        return text;
    }

    // HTML 转义函数
    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // 设置对话框可拖动
    function setupDraggableContainer() {
        let isDragging = false;
        let startX, startY;
        let startLeft, startTop;

        // 获取对话框头部作为拖动区域
        const header = container.querySelector('.ai-assistant-header');

        // 从本地存储加载位置
        const savedPosition = localStorage.getItem('aiAssistantPosition');
        if (savedPosition) {
            try {
                const position = JSON.parse(savedPosition);
                container.style.left = position.left;
                container.style.top = position.top;
            } catch (e) {
                console.error('加载对话框位置出错', e);
            }
        }

        // 鼠标按下
        header.addEventListener('mousedown', function (e) {
            // 只响应鼠标左键，且不在控制区域
            if (e.button !== 0 || e.target.closest('.ai-assistant-controls')) return;

            isDragging = true;
            container.classList.add('dragging');

            // 记录初始位置
            startX = e.clientX;
            startY = e.clientY;

            const rect = container.getBoundingClientRect();
            startLeft = rect.left;
            startTop = rect.top;

            // 防止文本选择
            e.preventDefault();
        });

        // 鼠标移动
        document.addEventListener('mousemove', function (e) {
            if (!isDragging) return;

            // 计算新位置
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;

            const newLeft = startLeft + deltaX;
            const newTop = startTop + deltaY;

            // 确保不超出视口
            const containerWidth = container.offsetWidth;
            const containerHeight = container.offsetHeight;

            const maxLeft = window.innerWidth - containerWidth;
            const maxTop = window.innerHeight - containerHeight;

            container.style.left = `${Math.max(0, Math.min(newLeft, maxLeft))}px`;
            container.style.top = `${Math.max(0, Math.min(newTop, maxTop))}px`;
        });

        // 鼠标释放
        document.addEventListener('mouseup', function () {
            if (isDragging) {
                isDragging = false;
                container.classList.remove('dragging');

                // 保存位置到本地存储
                const position = {
                    left: container.style.left,
                    top: container.style.top
                };
                localStorage.setItem('aiAssistantPosition', JSON.stringify(position));
            }
        });
    }

    // 添加调试开关
    document.addEventListener('keydown', function (e) {
        // Alt+Shift+D 切换调试模式
        if (e.altKey && e.shiftKey && e.key === 'D') {
            aiAssistantConfig.debug = !aiAssistantConfig.debug;
            console.log(`[AI助手] 调试模式: ${aiAssistantConfig.debug ? '开启' : '关闭'}`);

            // 显示提示
            const debugNotice = document.createElement('div');
            debugNotice.style.position = 'fixed';
            debugNotice.style.bottom = '20px';
            debugNotice.style.left = '20px';
            debugNotice.style.padding = '10px 15px';
            debugNotice.style.backgroundColor = aiAssistantConfig.debug ? '#4caf50' : '#f44336';
            debugNotice.style.color = 'white';
            debugNotice.style.borderRadius = '4px';
            debugNotice.style.zIndex = '10000';
            debugNotice.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
            debugNotice.textContent = `AI助手调试模式: ${aiAssistantConfig.debug ? '开启' : '关闭'}`;

            document.body.appendChild(debugNotice);

            setTimeout(() => {
                document.body.removeChild(debugNotice);
            }, 2000);
        }
    });

    // 检测 Ollama API 版本
    function detectOllamaApiVersion() {
        fetch(`${ollamaEndpoint}/version`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                log('Ollama 版本:', data);

                // 根据版本调整 API 请求格式
                if (data.version) {
                    const versionParts = data.version.split('.');
                    const majorVersion = parseInt(versionParts[0]);
                    const minorVersion = parseInt(versionParts[1]);

                    // 0.1.x 使用旧 API，0.2.x+ 使用新 API
                    useNewApi = (majorVersion > 0 || minorVersion >= 2);
                    log('使用新 API:', useNewApi);
                }
            })
            .catch(error => {
                log('无法检测 Ollama 版本，使用旧 API:', error);
                useNewApi = false;
            });
    }

    // 添加关闭按钮事件监听
    closeButton.addEventListener('click', function (e) {
        e.stopPropagation(); // 防止事件冒泡
        container.classList.add('hidden');
        container.classList.remove('visible');
        console.log('关闭对话框');
    });

    // 添加自动重试检测 Ollama 可用性的功能
    function setupOllamaRetryCheck() {
        // 初始检查
        checkOllamaAvailability();

        // 如果在模拟模式下，每 30 秒尝试重新连接一次
        setInterval(() => {
            if (simulationMode) {
                log('尝试重新连接到 Ollama...');
                checkOllamaAvailability();
            }
        }, 30000); // 30秒
    }
}); 