+++
title = '对 Redis 提问'
date = 2024-03-10T13:49:19+08:00
tags = ['提问系列']
draft = false
+++

<style>
#toggle {
    -webkit-transition-duration: 0.4s; /* Safari */
    transition-duration: 0.4s;
    height: 50px;
    border: 1px solid #2fa54e;
    background-color: white;
}

#toggle:hover {
    background-color: #2fa54e; 
    color: white;
}

.answer {
    background-color: #f3f3d1;
    border-radius: 5px;
    padding: 9px 12px;
    margin-bottom: 12px;
    margin-top: 15px;
    font-family: monospace;
    display: block;
}

.question {
    margin-bottom: 35px;
}

.list {
    margin-bottom: 10px;
}

ul {
    margin-bottom: 10px !important;
}
</style>

<script>
    document.addEventListener("DOMContentLoaded", function () {
        // 获取按钮和答案元素
        var toggleButton = document.getElementById("toggle");
        var answerElements = document.querySelectorAll(".answer");
        // 添加点击事件监听器
        toggleButton.addEventListener("click", function () {
            answerElements.forEach(e => {
                // 获取计算后的样式
                var computedStyle = window.getComputedStyle(e);
                // 切换答案的显示状态
                if (computedStyle.display === "none" || computedStyle.display === "") {
                    e.style.display = "block";
                } else {
                    e.style.display = "none";
                }
            }); 
        });
    });
</script>

<div>
    <button id="toggle">点击答案开关</button>
</div>

## 1. 数据结构

<div class="question">
    <div>1. 说一下 Redis 常见数据结构以及底层实现？</div>
    <div class="answer">
        <ul>
            <li><strong>String</strong>: 底层实现了动态字符串 SDS(Simple Dynamic String)</li>
            <li><strong>List</strong>: ziplist 与 双向链表实现。超过 3.2 的版本的由 quicklist 实现</li>
            <li><strong>Hash</strong>: ziplist 与 hash 实现。在 Redis 7.0 中 ziplist 被换成 listpack</li>
            <li><strong>Set</strong>: 整数集合与 hash 实现</li>
            <li><strong>ZSet</strong>: ziplist 与 skiplist 实现。在 Redis 7.0 中 ziplist 被换成了 listpack</li>
            <li><strong>Stream</strong></li>
            <li><strong>BitMap</strong></li>
            <li><strong>HyperLog</strong></li>
            <li><strong>GEO</strong>: 底层是 ZSet</li>
        </ul>
    </div>
</div>

## 2. 持久化

<div class="question">
    <div>1. 说一下 AOF 日志特点？</div>
    <div class="answer">
        <ul>
            <li><strong>风险</strong>:  
                <ul>
                    <li>(1) 可能出现还未写日志服务器就宕机，导致数据丢失</li>
                    <li>(2) AOF 写日志是主线程完成的，如果写入磁盘过慢，会阻塞下一条命令</li>
                </ul> 
            </li>
            <li><strong>刷盘策略</strong>:
                <ul>
                    <li><strong>Always</strong>: 同步写回，性能差，基本不会丢失数据</li>
                    <li><strong>Every Second</strong>: 每秒写回，性能适中，宕机丢失 1s 内的数据</li>
                    <li><strong>No</strong>: 操作系统控制写回，高性能，宕机丢失较多数据</li>
                </ul>
            </li>
            <li><strong>日志重写</strong>: AOF 日志会越来越大，重写可以压缩日志大小。重写是由后台子进程<code>bgrewriteaof</code>完成的。这里 fork 一个子进程，遇到 big key 发生 copy-on-write 用时较久，可能会阻塞主进程。</li>
        </ul>
    </div>
</div>

<div class="question">
    <div>2. 执行 RDB 全量快照的命令是什么？执行过程有什么风险？</div>
    <div class="answer">
        <ul>
            <li><strong>命令</strong>: 
                <ul>
                    <li><code>save</code>: 主进程阻塞</li>
                    <li><code>bgsave</code>: 利用 copy-on-write</li>
                </ul>
            </li>
            <li><strong>风险</strong>:
                <li>不停地快照会导致磁盘 I/O 高，尤其是上一个还没执行完，下一个又开始的情况下</li> 
                <li>fork 会阻塞主线程，主线程内存越大，阻塞时间越长</li>
            </li>
        </ul>
    </div>
</div>

<div class="question">
    <div>3. 说一下 RDB + AOF 增量快照如何实现？</div>
    <!-- <div class="answer"></div> -->
</div>

## 3. 高可用

### 3.1 主从复制

<div class="mermaid"> 
flowchart TB  
A[Master Node]  
B[Slave Node 1]  
C[Slave Node 2]  
D[Slave Node 3]  
E[Client]  
A -->|Replication| B  
A -->|Replication| C  
A -->|Replication| D  
E -->|Read/Write| A  
E -->|Read Only| B  
E -->|Read Only| C  
E -->|Read Only| D  
style A fill:#f9f,stroke:#333,stroke-width:2px  
style B fill:#ccf,stroke:#f66,stroke-width:2px  
style C fill:#ccf,stroke:#f66,stroke-width:2px  
style D fill:#ccf,stroke:#f66,stroke-width:2px  
style E fill:#ccf,stroke:#333,stroke-width:2px
</div>

- **读操作**: 主库、从库都可以接受
- **写操作**: 首先到主库执行，然后，主库将写操作同步给从库
- **读写分离的原因**: 保障数据一致性

### 3.2 哨兵模式

<div class="mermaid">
graph TB
subgraph Sentinel Cluster
    S1(Sentinel 1) -->|监控| master
    S2(Sentinel 2) -->|监控| master
    S3(Sentinel 3) -->|监控| master
    S1 -->|监控| slave1
    S2 -->|监控| slave1
    S3 -->|监控| slave1
    S1 -->|监控| slave2
    S2 -->|监控| slave2
    S3 -->|监控| slave2
end
subgraph Redis Cluster
    master(Redis Master) -->|复制| slave1
    master -->|复制| slave2
end
%% 通信
S1 <-->|通信| S2
S2 <-->|通信| S3
S3 <-->|通信| S1
%% 文档链接
click master "http://redis.io/topics/sentinel" "Redis Sentinel Documentation"
click slave1 "http://redis.io/topics/sentinel" "Redis Sentinel Documentation"
click slave2 "http://redis.io/topics/sentinel" "Redis Sentinel Documentation"
click S1 "http://redis.io/topics/sentinel" "Redis Sentinel Documentation"
click S2 "http://redis.io/topics/sentinel" "Redis Sentinel Documentation"
click S3 "http://redis.io/topics/sentinel" "Redis Sentinel Documentation"
%% 应用风格
style master fill:#f9f,stroke:#f66,stroke-width:2px;
style slave1 fill:#ccf,stroke:#f66,stroke-width:2px;
style slave2 fill:#ccf,stroke:#f66,stroke-width:2px;
style S1 fill:#ccf,stroke:#333,stroke-width:2px;
style S2 fill:#ccf,stroke:#333,stroke-width:2px;
style S3 fill:#ccf,stroke:#333,stroke-width:2px;
</div>

### 3.3 切片集群

<div class="mermaid">
graph LR
subgraph "Client"
C(Client)
end
C --> |"Key 1"| R1M
C --> |"Key 2"| R2M
C --> |"Key N"| R3M
subgraph "Shard 1"
R1M(Master 1) --> R1S1(Slave 1-1)
R1M --> R1S2(Slave 1-2)
end
subgraph "Shard 2"
R2M(Master 2) --> R2S1(Slave 2-1)
R2M --> R2S2(Slave 2-2)
end
subgraph "Shard 3"
R3M(Master 3) --> R3S1(Slave 3-1)
R3M --> R3S2(Slave 3-2)
end
%% 应用风格
style C fill:#ccf,stroke:#333,stroke-width:2px;
style R1M fill:#f9f,stroke:#f66,stroke-width:2px;
style R2M fill:#f9f,stroke:#f66,stroke-width:2px;
style R3M fill:#f9f,stroke:#f66,stroke-width:2px;
style R1S1 fill:#ccf,stroke:#f66,stroke-width:2px;
style R1S2 fill:#ccf,stroke:#f66,stroke-width:2px;
style R2S1 fill:#ccf,stroke:#f66,stroke-width:2px;
style R2S2 fill:#ccf,stroke:#f66,stroke-width:2px;
style R3S1 fill:#ccf,stroke:#f66,stroke-width:2px;
style R3S2 fill:#ccf,stroke:#f66,stroke-width:2px;
</div>

## 4. 缓存应用
