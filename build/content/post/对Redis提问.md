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

- 哨兵是运行在特定模式下的 Redis 实例，只不过它并不服务请求操作，只是完成监控、选主和通知任务。
- 哨兵进程会使用 PING 命令检测自己与主、从节点的网络连接情况，用来判断实例的状态。如果哨兵发现主库或从库对 PING 命令的响应超时了，那么，哨兵就会先把它标记为主观下线.
    - 如果检测的时从库，哨兵简单标记未主观下线就行了，因为从库的影响一般不太大。
    - 如果检测的时主库，需要多个哨兵节点进行投票判断是否客观下线(最少要有 N/2 + 1 个实例判断主观下线才下线)

<div class="question">
    <div>1. 说一说哨兵模式的故障转移过程？</div>
    <div class="answer">
        <ul>
            <li>第一轮投票: 判断 Master 是否下线</li>
            <li>第二轮投票: 选出哨兵 Leader (quorum 设置为哨兵个数的 N/2 + 1)</li>
            <li>由哨兵 Leader 执行故障转移</li>
        </ul>
    </div>
</div>

<div class="question">
    <div>2. 选主原则是什么?</div>
    <div class="answer">
        <ul>
            <li><strong>排除已下线的从库</strong>: 并检查从库的网络连接状态(down-after-milliseconds 主从断连的超时时间。考察断连次数，如果超过 10 次，直接踢出)</li>
            <li><strong>评分</strong>: 按从库优先级、从库复制进度、从库 ID 号进行三次赛选
                <ul>
                    <li>从库优先级高的胜出</li>
                    <li>复制进度靠前的胜出</li>
                    <li>ID 号小的优先</li>
                </ul>
            </li>
        </ul>
    </div>
</div>



### 3.3 切片集群

<div class="mermaid">
graph LR
    subgraph "Redis Cluster"
        direction TB
        subgraph "Node A (Shard 1)"
            A_Master((Master A))
            A_Slave1((Slave A-1))
            A_Slave2((Slave A-2))
            A_Master -->|Replication| A_Slave1
            A_Master -->|Replication| A_Slave2
        end
        subgraph "Node B (Shard 2)"
            B_Master((Master B))
            B_Slave1((Slave B-1))
            B_Master -->|Replication| B_Slave1
        end
        subgraph "Node C (Shard 3)"
            C_Master((Master C))
            C_Slave1((Slave C-1))
            C_Master -->|Replication| C_Slave1
        end
    end
    subgraph "Client Request Flow"
        Client(Client) -->|GET key1| A_Master
        A_Master -.->|MOVED redirect| B_Master
        Client -.->|Redirected to B| B_Master
        B_Master -.->|ASK redirect| C_Master
        Client -.->|Redirected to C ASKING| C_Master
        Client -->|Finally GET key1 from C| C_Master
    end
    %% Styling for nodes
    classDef master fill:#f9f,stroke:#333,stroke-width:4px;
    classDef slave fill:#ccf,stroke:#333,stroke-width:2px;
    classDef client fill:#f9c,stroke:#333,stroke-width:4px;
    classDef redirect fill:#fdd,stroke:#333,stroke-width:2px;
    classDef dashedLine stroke:#333,stroke-dasharray: 5,5;
    %% Apply styles
    class A_Master,B_Master,C_Master master;
    class A_Slave1,A_Slave2,B_Slave1,C_Slave1 slave;
    class Client client;
    class MR,AR redirect;
    linkStyle 4 stroke:#f66,stroke-width:2px,stroke-dasharray: 5,5;
    linkStyle 5 stroke:#f66,stroke-width:2px,stroke-dasharray: 5,5;
    linkStyle 6 stroke:#66f,stroke-width:2px,stroke-dasharray: 5,5;
    linkStyle 7 stroke:#66f,stroke-width:2px,stroke-dasharray: 5,5;
</div>

- Hash Slot: redis 集群没有使用一致性 hash 而是使用的 Slot 机制。集群一共定义了 16384 个 slot
  - 每个key通过CRC16校验后对16383取模来决定放置哪个槽
- Keys Hash Tag 
  - 可以根据 hash tag 将数据 key by 到某一个节点 set testkey{tag1} val
  - multi-key 操作的基础
- Cluster Bus: gossip 协议通信，用来故障检测、配置更新、故障转移
- Moved重定向: 去中心化，请求 Moved 重定向
- Ask重定向: 扩缩容，slot 迁移，请求如果遇到正在迁移的 slot,并且没有找到数据，可以 Ask 重定向到新的机器上去找
- 故障转移: Master 投票，进行故障转移
- 节点握手：meet ping pong 新加入节点

<div class="question">
    <div>1. 为什么 Redis Cluster 一共 16384 个 Hash Slot?</div>
    <div class="answer">
        <ul>
            <li>保证负载均衡的同时避免更多的通信开销。</li>
        </ul>
    </div>
</div>

## 4. 应用

<div class="question">
    <div>1. 说一下有哪些缓存异常？如何解决?</div>
    <div class="answer">
        <ul>
            <li><strong>缓存雪崩</strong>: 同时间有大量 key 过期，或者缓存数据库异常。解决方法: 过期时间增加一个随机值(1-3min)。服务器需要进行过载保护，如: 服务熔断、降级、限流等</li>
            <li><strong>缓存击穿</strong>: hot key 过期，大量请求打在数据库上。解决方法: hot key 不设置过期时间</li>
            <li><strong>缓存穿透</strong>: 请求不存在的 key，导致每次请求直接打到数据库上。解决方法: 缓存一个空值或者使用布隆过滤器，并且做好请求参数校验</li>
            <li><strong>缓存污染</strong>: 缓存了数据，但是数据访问频率低，不是热数据。高效的缓存应该只缓存热数据
                <ul>
                    <li><strong>LRU</strong></li>
                    <li><strong>LFU</strong>: 同时考虑访问时间与访问频率。先根据访问次数 counter 排序，再根据时间排序进行内存淘汰</li>
                </ul>
            </li>
        </ul>
    </div>
</div>

<div class="question">
    <div>2. 谈一下缓存设计模式?</div>
    <div class="answer">
        <ul>
            <li>Cache Aside (旁路缓存，适合读多，少写)
                <ul> 
                    <li>读: 命中缓存直接返回，否则查询数据库然后更新缓存</li>
                    <li>写: 更新数据库，然后删除缓存</li>
                </ul>
            </li>
            <li>Read/Write Through (读写穿透，适合写多的情况)
                <ul> 
                    <li>写: 缓存不存在，则只更新 DB。缓存存在，更新 DB，然后更新缓存 (同步)</li>
                    <li>读: 数据不存在，从 DB 加载到 Cache, 在返回</li>
                    <li>存储服务封装了所有的数据处理细节(代理)，业务应用端代码只用关注业务逻辑本身，系统的隔离性更佳。另外，进行写操作时，如果 cache 中没有数据则不更新，有缓存数据才更新，内存效率更高</li>
                </ul> 
            </li>
            <li>Write Behind Caching (又称为 Write Back (异步写入) 适合写非常多的情况)
                <ul>
                    <li>异步刷盘，高性能。有数据不一直的风险。写入原理与操作系统 page cache 差不多</li>
                </ul>
            </li>
        </ul>
    </div>
</div>

<div class="question">
    <div>3. 谈一谈如何保证数据库缓存一致性?</div>
    <div class="answer">
        <ul>
            <li><strong>强一致性</strong>: 操作资源时加锁</li>
            <li><strong>最终一致性</strong>: 延时双删、消息队列补偿、flink cdc 做只读缓存。这些都需要靠<strong>过期时间兜底，避免长时间不一致</strong></li>
        </ul>
    </div>
</div>

<div class="question">
    <div>4. Redis 过期策略?</div>
    <div class="answer">
        <ul>
            <li>惰性过期</li>
            <li>定期过期</li>
        </ul>
    </div>
</div>

<div class="question">
    <div>5. Redis 内存淘汰策略?</div>
    <div class="answer">
        <ul>
            <li>noeviction</li>
            <li>allkeys-lru</li>
            <li>allkeys-random</li>
            <li>allkeys-lru</li>
            <li>volatile-lru</li>
            <li>volatile-random</li>
            <li>volatile-ttl 设置了过期时间的键中，有更早时间的键优先移除</li>
            <li>volatile-lfu Redis 4.0 中有的</li>
        </ul>
    </div>
</div>

<div class="question">
    <div>6. 遇到热点 key 如何处理</div>
    <div class="answer">
    加前缀打散，让他们分布到不同节点上
    </div>
</div>

<div class="question">
    <div>7. big key 有什么危害? 如何删除 big key?</div>
    <div class="answer">
        <ul>
            <li><strong>危害</strong>:
                <ul>
                    <li>占用更多的带宽</li>
                    <li>AOF 重写时发生 copy-on-write 耗时较久可能阻塞主线程</li>
                    <li>导致数据倾斜</li>
                </ul>
            </li>
            <li><strong>删除 big key</strong>:
                <ul>
                    <li>redis 4.0 以上的版本可以用 unlink 命令</li>
                    <li>传统是先 scan 再一点一点的删除</li>
                </ul>
            </li>
        </ul>
    </div>
</div>

<div class="question">
    <div>8. 主从复制有哪些问题？</div>
    <div class="answer">
        <ul>
            <li><strong>数据不一致</strong>: 由于 AOF 日志是异步复制到从库。所以可能会出现主从不一致的情况</li>
            <li><strong>读到过期数据</strong>: 
                <ul>
                    <li>因为主从同步是异步进行的 expire 在从节点上生效的时间会晚于主节点<li>
                    <li>从节点不会主动进行过期清理，如果主节点的命令还未到，则从节点的数据任然存在。在早期版本的 redis 中会直接读取到过期数据。目前的新版本，读取到过期数据，会返回一个空值。<li>
                    <li>解决办法: 
                        <ul>
                            <li>使用 expireat 填写具体过期的时间戳</li>
                            <li>升级 redis 版本</li>
                        </ul>
                    <li>
                </ul>
            </li>
        </ul>
    </div>
</div>

<div class="question">
    <div>9. 如何构建分布式锁?</div>
    <div class="answer">
        <ul>
            <li>互斥</li>
            <li>高性能</li>
            <li>高可用: 有故障转移能力</li>
            <li>安全性: 客户端生成一个 UUID, 加锁时存入 VALUE。解锁时判断客户端传来的 ID 是否相等。(判断，删除使用 LUA 脚本实现，保证原子性)</li>
            <li>过期机制: 防止客户端线程挂了，不能释放锁</li>
            <li>避免锁过期: watch dog 机制，自动续存活时间</li>
            <li>可重入 (同一个线程能多次获得锁)</li>
        </ul>
    </div>
</div>

```lua
--  nx 不存在则设置
--  ex 过期时间 100s, 如果是 px 则是 ms
set key nx ex 100
set key nx px 100000

--  释放锁，请使用 lua 脚本进行原子操作
if redis.call("get", KEYS[1]) == ARGV[1]) then
	return redis.call("del", KEYS[1])
else 
	return 0
end

-- 锁续命,注意先验证 value 值是否相同
expire key 100
```