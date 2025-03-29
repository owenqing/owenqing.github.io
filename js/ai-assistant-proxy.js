// AI 助手 CORS 代理
(function () {
    // 创建代理函数
    window.createCorsProxy = function () {
        // 检查是否已经创建了代理
        if (window.corsProxyFrame) {
            return window.corsProxyFrame;
        }

        // 创建一个隐藏的 iframe 作为代理
        const proxyFrame = document.createElement('iframe');
        proxyFrame.style.display = 'none';
        proxyFrame.src = 'about:blank';
        document.body.appendChild(proxyFrame);

        // 初始化代理
        const proxyDoc = proxyFrame.contentDocument || proxyFrame.contentWindow.document;
        proxyDoc.open();
        proxyDoc.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <script>
                    // 代理请求处理函数
                    window.proxyFetch = function(url, options, callbackId) {
                        fetch(url, options)
                            .then(response => {
                                // 处理流式响应
                                if (options.stream) {
                                    const reader = response.body.getReader();
                                    
                                    function readStream() {
                                        reader.read().then(({ done, value }) => {
                                            if (done) {
                                                // 通知父窗口流结束
                                                window.parent.postMessage({
                                                    type: 'proxyStreamEnd',
                                                    callbackId: callbackId
                                                }, '*');
                                                return;
                                            }
                                            
                                            // 将数据发送到父窗口
                                            const chunk = new Uint8Array(value);
                                            window.parent.postMessage({
                                                type: 'proxyStreamChunk',
                                                callbackId: callbackId,
                                                chunk: Array.from(chunk)
                                            }, '*');
                                            
                                            // 继续读取
                                            readStream();
                                        }).catch(error => {
                                            // 发送错误到父窗口
                                            window.parent.postMessage({
                                                type: 'proxyError',
                                                callbackId: callbackId,
                                                error: error.message
                                            }, '*');
                                        });
                                    }
                                    
                                    readStream();
                                } else {
                                    // 处理普通响应
                                    response.text().then(text => {
                                        window.parent.postMessage({
                                            type: 'proxyResponse',
                                            callbackId: callbackId,
                                            status: response.status,
                                            statusText: response.statusText,
                                            headers: Object.fromEntries(response.headers.entries()),
                                            body: text
                                        }, '*');
                                    }).catch(error => {
                                        window.parent.postMessage({
                                            type: 'proxyError',
                                            callbackId: callbackId,
                                            error: error.message
                                        }, '*');
                                    });
                                }
                            })
                            .catch(error => {
                                window.parent.postMessage({
                                    type: 'proxyError',
                                    callbackId: callbackId,
                                    error: error.message
                                }, '*');
                            });
                    };
                    
                    // 监听来自父窗口的消息
                    window.addEventListener('message', function(event) {
                        if (event.source === window.parent && event.data.type === 'proxyRequest') {
                            window.proxyFetch(
                                event.data.url,
                                event.data.options,
                                event.data.callbackId
                            );
                        }
                    });
                </script>
            </head>
            <body>CORS Proxy Frame</body>
            </html>
        `);
        proxyDoc.close();

        // 保存代理引用
        window.corsProxyFrame = proxyFrame;

        // 初始化回调存储
        window.corsProxyCallbacks = {};
        window.corsProxyStreamCallbacks = {};
        window.corsProxyCallbackId = 0;

        // 监听来自代理的消息
        window.addEventListener('message', function (event) {
            if (event.source === proxyFrame.contentWindow) {
                const data = event.data;

                if (data.type === 'proxyResponse') {
                    // 处理普通响应
                    const callback = window.corsProxyCallbacks[data.callbackId];
                    if (callback) {
                        const response = new Response(data.body, {
                            status: data.status,
                            statusText: data.statusText,
                            headers: data.headers
                        });
                        callback.resolve(response);
                        delete window.corsProxyCallbacks[data.callbackId];
                    }
                } else if (data.type === 'proxyStreamChunk') {
                    // 处理流式响应块
                    const callback = window.corsProxyStreamCallbacks[data.callbackId];
                    if (callback && callback.onChunk) {
                        const chunk = new Uint8Array(data.chunk);
                        callback.onChunk(chunk);
                    }
                } else if (data.type === 'proxyStreamEnd') {
                    // 处理流结束
                    const callback = window.corsProxyStreamCallbacks[data.callbackId];
                    if (callback && callback.onDone) {
                        callback.onDone();
                    }
                    delete window.corsProxyStreamCallbacks[data.callbackId];
                } else if (data.type === 'proxyError') {
                    // 处理错误
                    const callback = window.corsProxyCallbacks[data.callbackId] ||
                        window.corsProxyStreamCallbacks[data.callbackId];
                    if (callback) {
                        if (callback.reject) {
                            callback.reject(new Error(data.error));
                            delete window.corsProxyCallbacks[data.callbackId];
                        } else if (callback.onError) {
                            callback.onError(new Error(data.error));
                            delete window.corsProxyStreamCallbacks[data.callbackId];
                        }
                    }
                }
            }
        });

        return proxyFrame;
    };

    // 代理 fetch 函数
    window.proxyFetch = function (url, options = {}) {
        // 创建代理 iframe
        createCorsProxy();

        // 生成回调 ID
        const callbackId = window.corsProxyCallbackId++;

        // 处理流式响应
        if (options.stream) {
            return new Promise((resolve, reject) => {
                // 创建自定义 ReadableStream
                const stream = new ReadableStream({
                    start(controller) {
                        // 存储流回调
                        window.corsProxyStreamCallbacks[callbackId] = {
                            onChunk: (chunk) => {
                                controller.enqueue(chunk);
                            },
                            onDone: () => {
                                controller.close();
                            },
                            onError: (error) => {
                                controller.error(error);
                                reject(error);
                            }
                        };

                        // 发送请求到代理
                        window.corsProxyFrame.contentWindow.postMessage({
                            type: 'proxyRequest',
                            url: url,
                            options: {
                                method: options.method || 'GET',
                                headers: options.headers || {},
                                body: options.body,
                                stream: true
                            },
                            callbackId: callbackId
                        }, '*');
                    }
                });

                // 创建自定义响应对象
                const response = new Response(stream, {
                    headers: new Headers({
                        'Content-Type': 'application/json'
                    })
                });

                resolve(response);
            });
        } else {
            // 处理普通响应
            return new Promise((resolve, reject) => {
                // 存储回调
                window.corsProxyCallbacks[callbackId] = { resolve, reject };

                // 发送请求到代理
                window.corsProxyFrame.contentWindow.postMessage({
                    type: 'proxyRequest',
                    url: url,
                    options: {
                        method: options.method || 'GET',
                        headers: options.headers || {},
                        body: options.body
                    },
                    callbackId: callbackId
                }, '*');
            });
        }
    };
})(); 