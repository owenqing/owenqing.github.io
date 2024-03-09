+++
title = '对 MYSQL 提问'
date = 2024-03-06T21:48:30+08:00
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
    <div>
        <iframe frameborder="no" border="0" marginwidth="0" marginheight="0" width=330 height=86 src="//music.163.com/outchain/player?type=2&id=1472862669&auto=1&height=66"></iframe>
    </div>
    <button id="toggle">点击答案开关</button>
</div>

## 1. 索引

<div class="question">
    <div>
    1. 索引类型？
    </div>
    <div class="answer">
    数据结构: B+ Tree, Hash, Full Text
    </div>
</div>

<div class="question">
    <div>
    2. B+ Tree 数据结构与 hash，B Tree， Binary Tree 对比？
    </div>
    <div class="answer">
        <ul>
            <li>Binary Tree: 树更高磁盘 I/O 次数多</li>
            <li>Hash: 只适合等值查询，不适合范围查询</li>
            <li>B Tree:
                <ul>
                    <li>B+ 树非叶子结点只存索引，相对于 B 树更加的矮胖，磁盘 I/O 少</li>
                    <li>B+ 树有大量的冗余索引节点，插入、删除效率更高。相对于 B 树来说没有复杂的树的变换</li>
                    <li>B+ 树叶子节点通过双向链表连接起来，更适合范围查询。B 树范围查询得做树的遍历</li>
                </ul>
            </li>
        </ul>
    </div>
</div>

<div class="question">
    <div>3. 什么是索引下推？</div>
    <div class="answer">
    Using Index Condition 建立联合索引，提前过滤，避免回表
    </div>
</div>

<div class="question">
    <div>4. 什么是索引区分度？</div>
    <div class="answer">
        <ul>
            <li>count(distinct col) / count(col) , 区分度低于 30% 会忽略索引进行全表扫描。</li>
            <li>建立联合索引，区分度大的放在前面。</li>
        </ul>
    </div>
</div>

<div class="question">
    <div>5. 什么时候不需要创建索引？</div>
    <div class="answer">
        <ul>
            <li>WHERE, ORDER BY，GROUP BY 中用不到的字段不需要索引</li>
            <li>区分度不大的字段不需要索引，区分度过小，MYSQL 会走全表扫描</li>
            <li>经常更新的字段不需要创建索引</li>
        <ul>
    </div>
</div>

<div class="question">
    <div>6. 如何优化索引？</div>
    <div class="answer">
        <ul>
            <li>前缀索引</li>
            <li>覆盖索引</li>
            <li>采用自增 ID</li>
            <li>防止索引失效</li>
        <ul>
    </div>
</div>

<div class="question">
    <div>7. 索引失效的场景有哪些？</div>
    <div class="answer">
        <ul>
            <li>使用左或者左右模糊匹配</li>
            <li>对索引使用函数，表达式，隐式类型转换(varchar -> int)</li>
            <li>联合索引不满足左前缀规则</li>
            <li>WHERE OR 句子，OR 前是索引列，OR 后是非索引列</li>
        <ul>
    </div>
</div>

<div class="question">
    <div>8. like '%xxx' 一定会是全表扫描吗？</div>
    <div class="answer">
        不会，也有可能是全索引扫描 index （当查询的字段都是索引字段时）
    </div>
</div>

<div class="question">
    <div>9. count(*), count(1), count(col) 性能如何？</div>
    <div class="answer">
        <ul>
            <li> count(1): 比 count(col) 少一个步骤更快。</li>
            <li> count(*): count(*) 会被转换为 count(0)。所以 count(*) 与 count(1) 性能差不多 </li>
            <li> count(col): 存在判断字段是否为 NULL </li>
            <li> 性能: count(*) = count(1) > count(主键) > count(col) </li>
            <li> 如果要执行 count(1)、 count(*)、 count(主键字段) 时，尽量在数据表上建立二级索引，这样优化器会自动采用 key_len 最小的二级索引进行扫描，相比于扫描主键索引效率会高一些。</li>
            <li> 不要使用 count(字段) 来统计记录个数，因为它的效率是最差的，会采用全表扫描的方式来统计。如果你非要统计表中该字段不为 NULL 的记录个数，建议给这个字段建立一个二级索引。</li>
        </ul>
    </div>
</div>

<div class="question">
    <div>10. 如何统计大表的记录数</div>
    <div class="answer">
        <ul>
            <li>explain 查看 rows 近似估计</li>
            <li>在业务内维护一个状态进行统计</li>
        </ul>
    </div>
<div>

## 2. 事务

<div class="question">
    <div>1. 事务的特性有哪些？MYSQL 通过什么保证这些特性？</div>
    <div class="answer">
        <li>ACID: 原子性，一致性，隔离性，持久性</li>
        <li>原子性是通过 undo log 保证的</li>
        <li>隔离性是通过 MVCC 与 锁机制共同保证的</li>
        <li>持久性是通过 redo log 保证的</li>
        <li>一致性是通过原子性、隔离性、持久性共同保证的</li>
    </div>
</div>

<div class="question">
    <div>2. 谈一谈事务隔离级别？</div>
    <div class="answer">
        <ul>
            <li>未提交读 < 已提交读 < 可重复读 < 可串行化</li>
            <li>在事务 A, B 下看脏读、不可重复读、幻读
                <ul>
                    <li>脏读: A 读到了 B 的数据，但是 B 过一会儿回滚了</li>
                    <li>不可重复读: A 中对同一数据的查询前后不一致 (侧重 update delete )</li>
                    <li>幻读: A 看到某个查询的数据条数，前后不一致 (侧重 insert)</li>
                </ul>
            </li>
            <li>不同隔离级别下的问题
                <li>未提交读会产生脏读、不可重复读、幻读</li>
                <li>已提交读解决了脏读问题，还存在不可重复读与幻读</li>
                <li>可重复读解决了不可重复读的问题，但是任然存在幻读</li>
            </li>
        </ul>
    </div>
</div>

<div class="question">
    <div>3. 谈一谈 MVCC 实现原理？</div>
    <div class="answer">
        <ul>
            <li>Read View => (create_trx_id, m_ids, min_trx_id, max_trx_id) 分别为创建事务的 id，活跃事务 id 的集合，创建 read view 是活跃的最小事务 id, 创建 read view 时应给下一个事务的 id
            </li>
            <li>每一条记录包含了两个隐含列 => (trx_id, roll_pointer -> undo log) undo log 中包含了一连串版本数据</li>
            <li>可见性判断
                <ul>
                    <li>如果 trx_id < min_trx_id, 可见</li>
                    <li>如果 trx_id >= max_trx_id, 不可见</li>
                    <li>如果 trx_id >= min_trx_id && trx_id < max_trx_id, 在 m_ids 则不可见，不在 m_ids 则可见</li>
                </ul>
            </li>
        </ul>
    </div>
</div>

<div class="question">
    <div>4. MySQL RR 隔离级别下幻读被完全解决了吗？</div>
    <div class="answer">
        RR 隔离级别并没有完全解决幻读
        <ul>
            <li>场景1: 对于一个事务，先进行快照读，在进行 select * from t for update 当前读，前后可能会不一致</li>
            <li>场景2: 事务 A 更新事务 B 新插入的记录，由于该记录未加锁，会在 A update 时加速，A 继续 select 就能看见这条记录了</li>
            <li>尽可能避免幻读，可以在进入事务时就执行 select ... for update 当前读语句</li>
        </ul>
    </div>
</div>

## 3. 锁

<div class="question">
    <div>1. MySQL 有哪些锁？</div>
    <div class="answer">
        <ul>
            <li>全局锁
                <ul>
                    <li><code>flush table with read lock</code></li>
                    <li><code>unlock tables</code></li>
                    <li>全局锁会造成业务停止。如果需要整库备份 mysqldump 加上 `-single-transaction` 执行是会创建 ReadView</li>
                </ul>
            </li>
            <li>表级锁
                <ul>
                    <li>表锁
                        <ul>
                            <li><code>lock tables t read</code></li>
                            <li><code>lock tables t write</code></li>
                            <li>尽量不要使用表锁。shell 中会话退出后表锁会释放</li>
                        </ul>
                    </li>
                    <li>元数据锁 (MDL)
                        <ul>
                            <li>不需要显示的使用，表结构变更时 MySQL 会自动加上</li>
                            <li>CURD 时加读锁</li>
                            <li>表结构变更加写锁</li>
                            <li>写锁优先级高于读锁。表结构变更时需要查看是否有长事务，要先 kill 掉在进行变更</li>
                            <li>优雅变更表结构: Online DDL (pt online)</li>
                        </ul>
                    </li>
                    <li>意向锁
                        <ul>
                            <li>快速判断表里是否有行锁</li>
                            <li>意向锁和行级锁之间不会发生冲突，而且意向锁之间也不会发生冲突。只有表级别锁会发生冲突</li>
                        </ul>
                    </li>
                    <li>AUTO-INC 锁</li>
                </ul>
            </li>
            <li>行锁
                <ul>
                    <li>记录锁</li>
                    <li>间隙锁</li>
                    <li>Next-Key 锁</li>
                    <li>插入意向锁</li>
                </ul>
            </li>
        </ul>
    </div>
</div>

<div class="question">
    <div>2. 说一下 MySQL 死锁场景？</div>
    <div class="answer">
        <ul>
            <li>两个事务对同一个 Gap, 加 Gap Lock。Gap Lock 之间是兼容的。然后这两个事务继续等待获取插入意向锁。不同事务之间的插入意向锁与 Gap Lock 是不兼容的，这个时候就发生了死锁。</li>
        </ul>
    </div>
</div>

<div class="question">
    <div>3. 说一下 MySQL 的乐观锁与悲观锁？</div>
    <div class="answer">
        <ul>
            <li>悲观锁: <code>select ... for update</code></li>
            <li>乐观锁：用于读多写少的情况，需要一个控制版本的字段
                <ul>
                    <li>sql1: 查询出 <code>version</code> 值</li>
                    <li>sql2: <code>update t set v = 'new_value', version = version + 1 where id = 1 and version = #{old_version}</code></li>
                </ul>
            </li>
        </ul>
    </div>
</div>

<div class="question">
    <div>4. MySQL 是如何加行级锁的？</div>
    <div class="answer">
        <ul>
            <li>加锁的对象是索引，加锁的基本单位是 next-key lock。next-key lock 是前开后闭的。间隙锁是前开后开的。</li>
            <li>在使用间隙锁或者记录锁能避免幻读的场景下，next-key lock 会退化成间隙锁或者记录锁</li>
        </ul>
    </div>
</div>



   ## 4. 日志

<div class="question">
    <div>1. 谈一下 redo log, undo log, binlog 的作用？</div>
    <div class="answer">
        <ul>
            <li>redo log 重做日志，保证持久性，采用 WAL 方式保证 MYSQL 的崩溃恢复能力 (环状，将写磁盘随机 I/O 优化为顺序 I/O）</li>
            <li>undo log 实现原子性和 MVCC</li>
            <li>binlog 由 Server 层生成，用于备份与主从复制</li>
        </ul>
    </div>
</div>

<div class="question">
    <div>2. 说一下 redo log 的刷盘策略？</div>
    <div class="answer">
        <ul>
            <li>MYSQL 正常关闭时</li>
            <li>redo log buffer 达到最大空间的一半时</li>
            <li>InnoDB 的后台线程每隔 1s 刷盘</li>
            <li>事务提交时 (由 <code>innodb_flush_log_at_trx_commit</code> 参数控制)
                <ul>
                    <li>参数为 0， 数据停留在 buffer 中</li>
                    <li>参数为 1，写入 page cache , 并刷盘</li>
                    <li>参数为 2 , 写入 page cache</li>
                </ul>
            </li>
        </ul>
    </div>
</div>

<div class="question">
    <div>3. 说一下 binlog 刷盘策略</div>
    <div class="answer">
        <ul>
            <li><code>sync_binlog</code> 参数控制 binlog 刷写策略</li>
            <li>参数为 0，每次提交事务只 write, 不进行 fsync</li>
            <li>参数为 1，每次提交事务会进行 write 与 fsync</li>
            <li>参数为 N (N > 1), 表示每次提交事务都 write, 等到积累了 N 个事务之后才进行 fsync</li>
        </ul>
    </div>
</div>

<div class="question">
    <div>4. MYSQL 主从复制有哪些模型</div>
    <div class="answer">
        <ul>
            <li>同步复制: 主库提交事务需要所有从库都成功接收。这种方式性能较差，生产环境一般不会选择</li>
            <li>异步复制: 主题提交的事务，不会等待 binlog 同步到从库。主库宕机可能会丢失数据</li>
            <li>半同步复制: 主库提交事务至少有一个从库接收。主库宕机至少有一个从库有完整数据，不存在数据丢失的风险</li>
        </ul>
    </div>
</div>

<div class="question">
    <div>5. 为什么需要两阶段提交</div>
    <img src="https://mermaid.ink/svg/pako:eNqFkstOwkAUhl9lMmt4gS5IKGUHicrOdDOhIzbSTh2KCSEkXqIihEsCGFwZTI24kLBQFwXfhhl0xSs4YSiCos6qmf87X8-cnCJMEwNDBebwYR7baayZKEORBYBuA3EcRF0zbTrIdkEUoBzQIfPb03Z_2q8yv6HDTaAqwWQhtZ0AKUyPMN0MxiS4gw0CEiSzGdIkpJp29jckvujsqctO-2zc4a16AEo4Go5EVAWw8TF7qE78Kqv0gkgVUUxEFzfs_B4ErczG5S2KxT8w-Oi-8sHLbHwVVMTC0jbtDd4H3qJwxaYtbbLnv1zaP664AnijOfE92TQrD1cfKcwxYlmm-1McXxNLx5dYZFEFSKfMeLnJKrerM8sS4gD2_Mj9M35yx7xaEKxMbTKqL0cGJMU7Q14bfGc1ycqBrJHiSSJhfouXr5l3ORm9BbXYNmAIWphayDTEihbnvUF3H1tYh4r4NBA90KFulwSH8i5JFew0VFyaxyGYdwzkBuscXGLDdAlNypWfb34Iig3aJUQgeyibw6VPMgdAmA"></img>
    <div class="answer">
        <ul>
            <li>事务提交时，需要将 redo log 与 binlog 持久化到磁盘，而这两者的逻辑又是独立的。如果不做任何协调，就可能导致半成功转态，最终导致两份日志之间逻辑不一致</li>
            <li>Prepare 阶段: 将 XID (内部 XA 事务 ID) 写入到 redo log, 同时将 redo log 对应的事务状态设置为 prepare</li>
            <li>Commit 阶段: 把 XID 写入到 binlog, 然后将 binlog 持久化到磁盘，接着调佣引擎提交事务的接口，将 redo log 转态设置为 commit。此时该转态并不需要持久化到磁盘，只需要 write 到文件系统的 page cache，因为只要 binlog 写磁盘成功，就算是 redo log 的状态还是 prepare 也没有关系，一样会被认为事务执行成功</li>
        </ul>
    </div>
</div>

<div class="question">
    <div>5. 两阶段提交有什么性能问题？</div>
    <div class="answer">
        <ul>
            <li><strong>磁盘 I/O 次数高</strong>。如果将 innodb_flush_log_at_trx_commit, sync_binlog 都设置为 1。每个事务提交都会有两次刷盘。</li>
            <li><strong>锁竞争激烈</strong>。两阶段提交虽然能保证单事务两个日志内容一致。但是在多事务场景下，确不能保证两者的提交顺序一致。因此，在两阶段提交的基础上需要加一个锁来保证提交的原子性，从而保证多事务的情况下，两个日志的提交顺序一致。</li>
        </ul>
    </div>
</div>

<div class="question">
    <div>6. MYSQL 如何优化两阶段提交？</div>
    <div class="answer">
        <ul>
            <li><strong>binlog 组提交</strong>。分为三个阶段，为了保证顺序，每个阶段都有队列与锁的保护。
                <ul>
                    <li><strong>flush 阶段</strong>:多个事务按顺序将 binlog 写入到 cache。</li>
                    <li><strong>sync 阶段</strong>: 对多个事务的 binlog 合并刷盘</li>
                    <li><strong>commit 阶段</strong>: 各个事务按顺序做 InnoDB commit 操作。</li>
                </ul> 
            </li>
            <li>MYSQL 在 5.7 只有加上了组提交。在 prepare 阶段 redo log 不在执行刷盘操作，而是延迟到flush 阶段。通过延迟稍安，对 redo log 做了一次组提交</li>
        </ul>
    </div>
</div>
