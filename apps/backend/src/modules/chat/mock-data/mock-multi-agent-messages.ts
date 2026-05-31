/**
 * 多智能体协同排查 mock 数据 — 匹配真实后端 all-ag-ui-tk.js workflow
 *
 * 流程概述（总分总模式）:
 * Phase 1: sre_plan_agent Round 1 — 思考 + 派发 3 个并行子任务
 * Phase 2: k8s_status_analysis / metrics_analysis / log_analysis 并行执行（真实工具名）
 * Phase 3: sre_plan_agent Round 2 — view_subtasks → finish_subtask ×3 → 派发 fault_summary
 * Phase 4: fault_summary — 汇总排查数据，生成排查总结
 * Phase 5: sre_plan_agent Round 3 — finish_subtask(3) → finish_plan → 综合总结 + SUGGESTED_ACTION
 *
 * 工具名列表（来源 all-ag-ui-tk.js 真实事件流）：
 * - sre_plan_agent: update_subtask_state, call_*, view_subtasks, finish_subtask, finish_plan
 * - k8s_status_analysis: k8s_describe_pod, k8s_get_events, k8s_get_deployment, k8s_pod_logs, k8s_top_pods
 * - metrics_analysis: prometheus_query_range, prometheus_query, prometheus_targets
 * - log_analysis: execute_python_code, execute_shell_command, view_text_file
 * - fault_summary: execute_shell_command, view_text_file, write_text_file
 *
 * 依赖关系字段:
 * - depId: 当前消息的唯一标识
 * - depOn: 依赖的 depId 数组，消息会等待所有依赖完成后才开始
 * - resolveOnOutput: 仅对 toolCall 生效，true 时 depId 在 TOOL_CALL_RESULT 推送后才解析
 */

export const multiAgentMessages = [
  // ============================================================
  // Phase 1: sre_plan_agent Round 1 — 思考 + 派发任务
  // ============================================================

  // P1-1: 思考与计划（真实 workflow: THINKING 而非 TEXT）
  {
    type: "thinking",
    role: "assistant",
    name: "sre_plan_agent",
    depId: "p1-think",
    text: "根据系统提示，当前计划有 3 个无依赖的子任务可以并行执行：\n- K8s 状态分析 (id=0) -> call_k8s_status_analysis\n- 监控指标分析 (id=1) -> call_metrics_analysis\n- 应用日志分析 (id=2) -> call_log_analysis\n\n我需要将这 3 个子任务都标记为 'in_progress'，并同时调用对应的 agent 工具。\n\n让我先更新这 3 个子任务的状态，然后并行调用对应的工具。",
  },

  // P1-2 ~ P1-4: update_subtask_state 设置三个任务为 in_progress
  {
    type: "toolCall",
    toolCallId: "call_plan_update_0",
    toolCallName: "update_subtask_state",
    role: "assistant",
    name: "sre_plan_agent",
    depId: "p1-upd0",
    depOn: ["p1-think"],
    args: { subtask_idx: 0, state: "in_progress" },
    output: "Subtask at index 0, named 'K8s 状态分析' is marked as 'in_progress' successfully. The plan state has been updated to 'in_progress'.",
    syncOutput: false,
    outputDelay: [200, 500],
  },
  {
    type: "toolCall",
    toolCallId: "call_plan_update_1",
    toolCallName: "update_subtask_state",
    role: "assistant",
    name: "sre_plan_agent",
    depId: "p1-upd1",
    depOn: ["p1-upd0"],
    args: { subtask_idx: 1, state: "in_progress" },
    output: "Subtask at index 1, named '监控指标分析' is marked as 'in_progress' successfully.",
    syncOutput: false,
    outputDelay: [200, 500],
  },
  {
    type: "toolCall",
    toolCallId: "call_plan_update_2",
    toolCallName: "update_subtask_state",
    role: "assistant",
    name: "sre_plan_agent",
    depId: "p1-upd2",
    depOn: ["p1-upd1"],
    args: { subtask_idx: 2, state: "in_progress" },
    output: "Subtask at index 2, named '应用日志分析' is marked as 'in_progress' successfully.",
    syncOutput: false,
    outputDelay: [200, 500],
  },

  // P1-5 ~ P1-7: 顺序调用三个智能体（真实 workflow: 使用 { task: "..." } 参数）
  // dispatch 的 TOOL_CALL_RESULT 在真实数据中异步返回（sub-agent 执行完才返回），设置长 outputDelay 模拟
  {
    type: "toolCall",
    toolCallId: "call_dispatch_k8s",
    toolCallName: "call_k8s_status_analysis",
    role: "assistant",
    name: "sre_plan_agent",
    depId: "p1-dispatch-k8s",
    depOn: ["p1-upd2"],
    args: { task: "分析 ops-stack 命名空间中 fineract-server-7cf8f97dcd-7pqnz Pod 的 OOM Killed 事件，查询该 Pod 的详细信息、事件记录、资源限制配置、重启历史等，确认 OOM Kill 的具体原因和时间点。" },
    output: "k8s_status_analysis agent completed. Report: Pod OOMKilled 3 times, JVM -Xmx1G + native memory approaching 2Gi container limit.",
    syncOutput: false,
    outputDelay: [12000, 20000],
  },
  {
    type: "toolCall",
    toolCallId: "call_dispatch_metrics",
    toolCallName: "call_metrics_analysis",
    role: "assistant",
    name: "sre_plan_agent",
    depId: "p1-dispatch-met",
    depOn: ["p1-dispatch-k8s"],
    args: { task: "查询 fineract-server-7cf8f97dcd-7pqnz Pod 在 OOM Kill 发生前后的内存使用指标，包括容器内存使用量、内存限制、内存使用率趋势，分析是否存在内存泄漏或突增情况。" },
    output: "metrics_analysis agent completed. Report: working_set 暴涨 1.30Gi→1.87Gi, Full GC storm, memory leak confirmed.",
    syncOutput: false,
    outputDelay: [15000, 24000],
  },
  {
    type: "toolCall",
    toolCallId: "call_dispatch_log",
    toolCallName: "call_log_analysis",
    role: "assistant",
    name: "sre_plan_agent",
    depId: "p1-dispatch-log",
    depOn: ["p1-dispatch-met"],
    args: { task: "查询 fineract-server-7cf8f97dcd-7pqnz Pod 在 OOM Kill 发生前后的应用日志，重点关注内存相关错误、GC 日志、大对象分配、内存溢出警告等信息，分析应用层面的内存使用情况。" },
    output: "log_analysis agent completed. Report: Two code-level root causes — unpaginated loan query (52847 records) and batch processing memory accumulation (30000 entries).",
    syncOutput: false,
    outputDelay: [18000, 28000],
  },

  // ============================================================
  // Phase 2: 三个智能体并行执行
  // 各自 depOn 自己的 dispatch（真实 workflow: sub-agent 在 dispatch TOOL_CALL_END 后启动）
  // ============================================================

  // ---------- k8s_status_analysis ----------
  // 真实工具名：k8s_describe_pod, k8s_get_events, k8s_get_deployment, k8s_pod_logs, k8s_top_pods
  {
    type: "thinking",
    role: "assistant",
    name: "k8s_status_analysis",
    depId: "k8s-think1",
    depOn: ["p1-dispatch-k8s"],
    text: "用户要求分析 ops-stack 命名空间中特定 Pod (fineract-server-7cf8f97dcd-7pqnz) 的 OOM Killed 事件。需要获取 Pod 详细信息、事件记录和 Deployment 配置。使用 k8s_describe_pod 获取 Pod 详情，k8s_get_events 获取事件记录，k8s_get_deployment 获取 Deployment 配置。",
  },
  // k8s 并行调用 3 个工具（真实 workflow: 同一轮思考后并行发起）
  {
    type: "toolCall",
    toolCallId: "call_k8s_describe",
    toolCallName: "k8s_describe_pod",
    role: "assistant",
    name: "k8s_status_analysis",
    depId: "k8s-describe",
    depOn: ["k8s-think1"],
    resolveOnOutput: true,
    args: { pod_name: "fineract-server-7cf8f97dcd-7pqnz", namespace: "ops-stack" },
    output: 'Name: fineract-server-7cf8f97dcd-7pqnz\nNamespace: ops-stack\nNode: node-10-1-80-22/10.1.80.22\nStatus: Running\nIP: 10.244.3.125\nControlled By: ReplicaSet/fineract-server-7cf8f97dcd\nContainers:\n  fineract-server:\n    Image: docker.m.daocloud.io/apache/fineract:latest\n    Limits: memory=2Gi, cpu=2\n    Requests: memory=512Mi, cpu=250m\n    Environment:\n      JAVA_TOOL_OPTIONS: -javaagent:/skywalking/agent/skywalking-agent.jar -Xmx1G -XX:MaxMetaspaceSize=256m\n    State: Running\n    Last State: Terminated (Reason: OOMKilled, Exit Code: 137, Finished: 2026-03-31T08:09:14Z)\n    Restart Count: 3\n    Ready: True\nQoS Class: Burstable',
    syncOutput: false,
    outputDelay: [800, 1500],
  },
  {
    type: "toolCall",
    toolCallId: "call_k8s_events",
    toolCallName: "k8s_get_events",
    role: "assistant",
    name: "k8s_status_analysis",
    depId: "k8s-events",
    depOn: ["k8s-think1"],
    resolveOnOutput: true,
    args: { namespace: "ops-stack" },
    output: 'LAST SEEN   TYPE      REASON     OBJECT                              MESSAGE\n7m19s       Normal    Pulled     pod/fineract-server-7cf8f97dcd-7pqnz   Container image pulled successfully\n5m03s       Warning   OOMKilling pod/fineract-server-7cf8f97dcd-7pqnz   Memory cgroup out of memory: Killed process 1234 (java)\n5m01s       Normal    Created    pod/fineract-server-7cf8f97dcd-7pqnz   Created container fineract-server\n5m00s       Normal    Started    pod/fineract-server-7cf8f97dcd-7pqnz   Started container fineract-server',
    syncOutput: false,
    outputDelay: [600, 1200],
  },
  {
    type: "toolCall",
    toolCallId: "call_k8s_deploy",
    toolCallName: "k8s_get_deployment",
    role: "assistant",
    name: "k8s_status_analysis",
    depId: "k8s-deploy",
    depOn: ["k8s-think1"],
    resolveOnOutput: true,
    args: { deployment_name: "fineract-server", namespace: "ops-stack" },
    output: 'apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: fineract-server\n  namespace: ops-stack\nspec:\n  replicas: 1\n  strategy: Recreate\n  template:\n    spec:\n      containers:\n      - name: fineract-server\n        image: docker.m.daocloud.io/apache/fineract:latest\n        resources:\n          limits: {memory: "2Gi", cpu: "2"}\n          requests: {memory: "512Mi", cpu: "250m"}\n        env:\n        - name: JAVA_TOOL_OPTIONS\n          value: "-javaagent:/skywalking/agent/skywalking-agent.jar -Xmx1G -XX:MaxMetaspaceSize=256m"',
    syncOutput: false,
    outputDelay: [700, 1300],
  },
  // k8s 思考第二轮
  {
    type: "thinking",
    role: "assistant",
    name: "k8s_status_analysis",
    depId: "k8s-think2",
    depOn: ["k8s-describe", "k8s-events", "k8s-deploy"],
    text: "从 Pod 描述和事件中可以确认：\n1. Pod 已重启 3 次，上次终止原因为 OOMKilled（退出码 137）\n2. JVM 参数设置了 -Xmx1G，但容器 limits 为 2Gi — 容器 memory limit 足够但 JVM 配置可能有问题\n3. QoS 为 Burstable，节点内存紧张时容易被优先 OOM Kill\n\n继续获取 Pod 日志和节点资源使用情况，分析 OOM 发生的具体模式。",
  },
  // k8s 并行调用 2 个工具
  {
    type: "toolCall",
    toolCallId: "call_k8s_logs",
    toolCallName: "k8s_pod_logs",
    role: "assistant",
    name: "k8s_status_analysis",
    depId: "k8s-logs",
    depOn: ["k8s-think2"],
    resolveOnOutput: true,
    args: { pod_name: "fineract-server-7cf8f97dcd-7pqnz", namespace: "ops-stack", tail_lines: 50 },
    output: '2026-03-31 07:48:00.075 - INFO [default] --- [duler1_Worker-2] o.s.b.c.l.s.TaskExecutorJobLauncher : Job: [SimpleJob: [name=SEND_ASYNCHRONOUS_EVENTS]] launched\n2026-03-31 07:48:00.123 - INFO [default] --- [duler1_Worker-2] o.s.b.c.l.s.TaskExecutorJobLauncher : Job completed [COMPLETED] in 42ms\n2026-03-31 08:08:55.201 - WARN [default] --- [scheduling-1] o.a.f.accounting.GLClosureWritePlatformServiceImpl : Large batch processing 30000 entries\n2026-03-31 08:09:10.442 - ERROR [default] --- [http-nio-8443-exec-15] o.a.f.portfolio.loanaccount.LoanReadPlatformServiceImpl : java.lang.OutOfMemoryError: Java heap space\n2026-03-31 08:09:14.001 - ERROR [default] --- [main] o.s.boot.SpringApplication : Application run failed: java.lang.OutOfMemoryError: GC overhead limit exceeded',
    syncOutput: false,
    outputDelay: [600, 1200],
  },
  {
    type: "toolCall",
    toolCallId: "call_k8s_top",
    toolCallName: "k8s_top_pods",
    role: "assistant",
    name: "k8s_status_analysis",
    depId: "k8s-top",
    depOn: ["k8s-think2"],
    resolveOnOutput: true,
    args: { namespace: "ops-stack", sort_by: "memory" },
    output: 'NAME                                    CPU(cores)   MEMORY(bytes)\nelasticsearch-0                         153m         1810Mi\nfineract-server-7cf8f97dcd-7pqnz        169m         1345Mi\nawx-web-59cc8796d6-9gcz4                10m          1258Mi\nawx-task-5b4cdf49cd-jvmdg               34m          1242Mi\nskywalking-oap-7db7979456-hs4rs         116m         1027Mi\nprometheus-prometheus-0                 15m          406Mi\nkibana-5c5db6d57d-7hpjg                 36m          351Mi\nfineractmysql-9658d5b6d-rvcsb           52m          245Mi',
    syncOutput: false,
    outputDelay: [500, 1000],
  },
  // k8s 思考第三轮
  {
    type: "thinking",
    role: "assistant",
    name: "k8s_status_analysis",
    depId: "k8s-think3",
    depOn: ["k8s-logs", "k8s-top"],
    text: "综合分析结果：\n\n1. Pod 当前内存使用 1345Mi，JVM 配置 -Xmx1G 加上 non-heap（metaspace 256m + native memory）实际可能占用 1.5Gi+\n2. 日志显示 08:09:10 发生 OutOfMemoryError: Java heap space，08:09:14 GC overhead limit exceeded\n3. 热点线程：scheduling-1 处理 30000 条批量数据，http-nio-exec-15 执行贷款查询\n4. 节点上 fineract-server 是内存第 2 大消耗者（1345Mi）\n\n结论已形成，准备输出分析报告。",
  },
  // k8s 结论输出
  {
    type: "text",
    messageId: "msg-k8s-conclusion",
    role: "assistant",
    name: "k8s_status_analysis",
    depId: "k8s-text",
    depOn: ["k8s-think3"],
    text: "## K8s 状态分析结论\n\n**Pod 状态**: Running，已重启 3 次，上次终止原因 `OOMKilled`（退出码 137，时间 2026-03-31T08:09:14Z）\n\n**关键发现**:\n- 容器 memory limits 2Gi，但 JVM 配置 `-Xmx1G -XX:MaxMetaspaceSize=256m`\n- 实际内存占用 1345Mi（含 native memory），接近 JVM 超出容器限制的阈值\n- OOM 前日志显示 `LoanReadPlatformServiceImpl` 抛出 `OutOfMemoryError: Java heap space`\n- 批处理任务 `GLClosureWritePlatformServiceImpl` 处理 30000 条记录加剧内存压力\n- 节点 `node-10-1-80-22` 上该 Pod 为内存消耗第 2 名\n- QoS 级别为 Burstable，OOM Killer 优先选中\n\n**建议**: 调整 JVM 参数 `-Xmx` 降至 `768m`，预留足够 non-heap 空间；或提升容器 limits 至 3Gi。同时排查代码级内存泄漏。",
  },

  // ---------- metrics_analysis ----------
  // 真实工具名：prometheus_query_range, prometheus_query, prometheus_targets
  {
    type: "thinking",
    role: "assistant",
    name: "metrics_analysis",
    depId: "met-think1",
    depOn: ["p1-dispatch-met"],
    text: "用户要求查询特定 Pod (fineract-server-7cf8f97dcd-7pqnz) 在 OOM Kill 发生前后的内存使用指标。我需要使用 Prometheus 查询容器内存使用量、内存限制和 CPU 使用率的时间序列数据。先并行查询三个关键指标。",
  },
  // metrics 并行查询 3 个 prometheus 指标（真实 workflow: 同一轮并行发起）
  {
    type: "toolCall",
    toolCallId: "call_met_mem_usage",
    toolCallName: "prometheus_query_range",
    role: "assistant",
    name: "metrics_analysis",
    depId: "met-prom1",
    depOn: ["met-think1"],
    resolveOnOutput: true,
    args: { query: "container_memory_usage_bytes{pod='fineract-server-7cf8f97dcd-7pqnz',container='fineract-server'}", start: "2026-03-31T07:09:14Z", end: "2026-03-31T08:09:14Z", step: "60s" },
    output: '{"status":"success","data":{"resultType":"matrix","result":[{"metric":{"pod":"fineract-server-7cf8f97dcd-7pqnz","container":"fineract-server","namespace":"ops-stack"},"values":[[1774952254,"1408299008"],[1774952554,"1408401408"],[1774952854,"1408536576"],[1774953154,"1409163264"],[1774953454,"1410252800"],[1774953754,"1411604480"],[1774954054,"1413316608"]]}]}}',
    syncOutput: false,
    outputDelay: [800, 1400],
  },
  {
    type: "toolCall",
    toolCallId: "call_met_mem_limit",
    toolCallName: "prometheus_query_range",
    role: "assistant",
    name: "metrics_analysis",
    depId: "met-prom2",
    depOn: ["met-think1"],
    resolveOnOutput: true,
    args: { query: "kube_pod_container_resource_limits{pod='fineract-server-7cf8f97dcd-7pqnz',resource='memory'}", start: "2026-03-31T07:09:14Z", end: "2026-03-31T08:09:14Z", step: "60s" },
    output: '{"status":"success","data":{"resultType":"matrix","result":[{"metric":{"pod":"fineract-server-7cf8f97dcd-7pqnz","resource":"memory"},"values":[[1774952254,"2147483648"],[1774952554,"2147483648"],[1774952854,"2147483648"],[1774953154,"2147483648"],[1774953454,"2147483648"],[1774953754,"2147483648"],[1774954054,"2147483648"]]}]}}',
    syncOutput: false,
    outputDelay: [700, 1200],
  },
  {
    type: "toolCall",
    toolCallId: "call_met_cpu",
    toolCallName: "prometheus_query_range",
    role: "assistant",
    name: "metrics_analysis",
    depId: "met-prom3",
    depOn: ["met-think1"],
    resolveOnOutput: true,
    args: { query: "rate(container_cpu_usage_seconds_total{pod='fineract-server-7cf8f97dcd-7pqnz',container='fineract-server'}[5m])", start: "2026-03-31T07:09:14Z", end: "2026-03-31T08:09:14Z", step: "60s" },
    output: '{"status":"success","data":{"resultType":"matrix","result":[{"metric":{"pod":"fineract-server-7cf8f97dcd-7pqnz","container":"fineract-server"},"values":[[1774952262,"0.014"],[1774952562,"0.009"],[1774952862,"0.016"],[1774953162,"0.049"],[1774953462,"0.082"],[1774953762,"0.156"],[1774954062,"0.289"]]}]}}',
    syncOutput: false,
    outputDelay: [900, 1500],
  },
  // metrics 思考第二轮
  {
    type: "thinking",
    role: "assistant",
    name: "metrics_analysis",
    depId: "met-think2",
    depOn: ["met-prom1", "met-prom2", "met-prom3"],
    text: "从 Prometheus 数据可以看出：\n\n1. **内存使用量**：从 1.31Gi（1408299008 bytes）逐步增长到 1.32Gi（1413316608 bytes），1 小时内持续增长约 5MB — 增幅看似不大但持续\n2. **内存限制**：2Gi（2147483648 bytes），当前使用率约 65%\n3. **CPU 使用率**：从 0.014 核急剧上升到 0.289 核，最后阶段 CPU 暴涨 — 典型的 GC 风暴特征\n\nPrometheus 的 container_memory_usage_bytes 包含文件缓存，需要进一步查询 working_set 和 RSS 指标来确认真实内存压力。同时查看 CPU limit 判断是否存在 CPU 节流。",
  },
  // metrics 第二批查询（并行）
  {
    type: "toolCall",
    toolCallId: "call_met_working_set",
    toolCallName: "prometheus_query_range",
    role: "assistant",
    name: "metrics_analysis",
    depId: "met-prom4",
    depOn: ["met-think2"],
    resolveOnOutput: true,
    args: { query: "container_memory_working_set_bytes{pod='fineract-server-7cf8f97dcd-7pqnz',container='fineract-server'}", start: "2026-03-31T07:39:14Z", end: "2026-03-31T08:09:14Z", step: "30s" },
    output: '{"status":"success","data":{"resultType":"matrix","result":[{"metric":{"pod":"fineract-server-7cf8f97dcd-7pqnz"},"values":[[1774953554,"1398000000"],[1774953614,"1402000000"],[1774953674,"1410000000"],[1774953734,"1425000000"],[1774953794,"1448000000"],[1774953854,"1489000000"],[1774953914,"1562000000"],[1774953974,"1689000000"],[1774954034,"1856000000"],[1774954054,"2012000000"]]}]}}',
    syncOutput: false,
    outputDelay: [600, 1100],
  },
  {
    type: "toolCall",
    toolCallId: "call_met_cpu_limit",
    toolCallName: "prometheus_query_range",
    role: "assistant",
    name: "metrics_analysis",
    depId: "met-prom5",
    depOn: ["met-think2"],
    resolveOnOutput: true,
    args: { query: "kube_pod_container_resource_limits{pod='fineract-server-7cf8f97dcd-7pqnz',resource='cpu'}", start: "2026-03-31T07:09:14Z", end: "2026-03-31T08:09:14Z", step: "60s" },
    output: '{"status":"success","data":{"resultType":"matrix","result":[{"metric":{"pod":"fineract-server-7cf8f97dcd-7pqnz","resource":"cpu"},"values":[[1774952262,"2"],[1774952562,"2"],[1774952862,"2"],[1774953162,"2"],[1774953462,"2"],[1774953762,"2"],[1774954062,"2"]]}]}}',
    syncOutput: false,
    outputDelay: [500, 1000],
  },
  // metrics 思考第三轮
  {
    type: "thinking",
    role: "assistant",
    name: "metrics_analysis",
    depId: "met-think3",
    depOn: ["met-prom4", "met-prom5"],
    text: "working_set_bytes 数据揭示了真相：\n\n最后 30 分钟 working_set 从 1.30Gi 暴涨到 1.87Gi，最终前一刻达到 2012000000 bytes ≈ 1.87Gi，接近 2Gi limit！\n\n关键时间线：\n- 07:39 ~ 07:59：稳定在 1.30-1.31Gi\n- 08:00 ~ 08:05：快速增长到 1.39Gi（+80MB/5min）\n- 08:05 ~ 08:09：暴涨到 1.87Gi（+480MB/4min）— 触发 OOM Kill\n\nCPU 同样在最后 5 分钟暴涨（0.049 → 0.289），这是典型的 Full GC 风暴。CPU limit 为 2 核，虽然未被节流但 GC 占用了大部分 CPU。\n\n结论：存在严重的内存泄漏，JVM -Xmx1G 配置加上 native memory 在峰值时突破 2Gi 容器限制。",
  },
  // metrics 结论输出
  {
    type: "text",
    messageId: "msg-met-conclusion",
    role: "assistant",
    name: "metrics_analysis",
    depId: "met-text",
    depOn: ["met-think3"],
    text: "## 监控指标分析结论\n\n**内存趋势**: container_memory_working_set_bytes 在 OOM 前 30 分钟内从 1.30Gi 暴涨至 1.87Gi，触及 2Gi limit\n\n**关键发现**:\n- JVM 配置 `-Xmx1G`，但 working_set 峰值达 1.87Gi — 说明 non-heap + native memory 额外占用约 870Mi\n- 最后 4 分钟内存增速 120MB/min，远超正常水平\n- CPU 使用率从 0.049 核暴涨至 0.289 核 — Full GC 风暴特征\n- container_memory_usage_bytes 增长平缓（含文件缓存），working_set_bytes 暴涨才是真实内存压力\n- CPU limit 2 核未被节流，排除 CPU throttling 因素\n\n**建议**: 调整 JVM 参数 `-Xmx768m`，确保 JVM 总内存（heap + metaspace + direct buffer + native）不超过容器 limits 的 80%。同时排查大对象分配热点（最后 4 分钟 +480MB 暴涨不正常）。",
  },

  // ---------- log_analysis ----------
  // 真实工具名：execute_python_code, execute_shell_command, view_text_file
  {
    type: "thinking",
    role: "assistant",
    name: "log_analysis",
    depId: "log-think1",
    depOn: ["p1-dispatch-log"],
    text: "用户要求我查询特定 Pod (fineract-server-7cf8f97dcd-7pqnz) 在 OOM Kill 发生前后的应用日志，重点关注内存相关的错误和异常。\n\n根据我的职责，我需要使用 Elasticsearch 检索日志。先执行 es_search_errors 搜索 ERROR 级别日志。",
  },
  // log 工具调用 1: es_search_errors（真实 workflow: 通过 execute_python_code 调用 ES 工具）
  {
    type: "toolCall",
    toolCallId: "call_log_es_search",
    toolCallName: "execute_python_code",
    role: "assistant",
    name: "log_analysis",
    depId: "log-tool1",
    depOn: ["log-think1"],
    resolveOnOutput: true,
    args: { code: "# es_search_errors\nimport json\nresult = es_search_errors(pod_pattern='fineract-server-7cf8f97dcd-7pqnz', size=50, duration='30m', namespace='ops-stack')\nprint(json.dumps(result, indent=2, ensure_ascii=False))" },
    output: '<returncode>0</returncode><stdout>{\n  "total_hits": 47,\n  "errors": [\n    {"@timestamp": "2026-03-31T08:09:10.442Z", "level": "ERROR", "logger": "LoanReadPlatformServiceImpl", "message": "java.lang.OutOfMemoryError: Java heap space", "thread": "http-nio-8443-exec-15"},\n    {"@timestamp": "2026-03-31T08:09:12.118Z", "level": "ERROR", "logger": "GLClosureWritePlatformServiceImpl", "message": "java.lang.OutOfMemoryError: GC overhead limit exceeded", "thread": "scheduling-1"},\n    {"@timestamp": "2026-03-31T08:09:13.505Z", "level": "ERROR", "logger": "HikariPool", "message": "Connection is not available, request timed out after 30000ms", "thread": "http-nio-8443-exec-8"},\n    {"@timestamp": "2026-03-31T08:09:14.001Z", "level": "ERROR", "logger": "SpringApplication", "message": "Application run failed: java.lang.OutOfMemoryError"}\n  ]\n}\n</stdout><stderr></stderr>',
    syncOutput: false,
    outputDelay: [900, 1600],
  },
  // log 思考 2
  {
    type: "thinking",
    role: "assistant",
    name: "log_analysis",
    depId: "log-think2",
    depOn: ["log-tool1"],
    text: "找到 47 条 ERROR 日志。关键错误：\n1. OutOfMemoryError: Java heap space (LoanReadPlatformServiceImpl) — 贷款查询接口导致 heap 溢出\n2. OutOfMemoryError: GC overhead limit exceeded (GLClosureWritePlatformServiceImpl) — 会计结转批处理\n3. HikariPool 连接超时 — OOM 的连锁反应\n\n继续执行 es_agg_errors 按消息类型聚合，确认各错误类型的出现频次。",
  },
  // log 工具调用 2: es_agg_errors
  {
    type: "toolCall",
    toolCallId: "call_log_es_agg",
    toolCallName: "execute_python_code",
    role: "assistant",
    name: "log_analysis",
    depId: "log-tool2",
    depOn: ["log-think2"],
    resolveOnOutput: true,
    args: { code: "# es_agg_errors\nimport json\nresult = es_agg_errors(pod_pattern='fineract-server-7cf8f97dcd-7pqnz', duration='30m', namespace='ops-stack', top_n=10)\nprint(json.dumps(result, indent=2, ensure_ascii=False))" },
    output: '<returncode>0</returncode><stdout>{\n  "total_errors": 47,\n  "aggregations": [\n    {"message_pattern": "Connection is not available, request timed out", "count": 18, "percentage": 38.3},\n    {"message_pattern": "java.lang.OutOfMemoryError: Java heap space", "count": 5, "percentage": 10.6},\n    {"message_pattern": "java.lang.OutOfMemoryError: GC overhead limit exceeded", "count": 3, "percentage": 6.4},\n    {"message_pattern": "JDBCConnectionException: unable to obtain connection", "count": 12, "percentage": 25.5},\n    {"message_pattern": "CannotCreateTransactionException", "count": 9, "percentage": 19.1}\n  ]\n}\n</stdout><stderr></stderr>',
    syncOutput: false,
    outputDelay: [700, 1300],
  },
  // log 思考 3
  {
    type: "thinking",
    role: "assistant",
    name: "log_analysis",
    depId: "log-think3",
    depOn: ["log-tool2"],
    text: "聚合分析结果：\n- 连接超时占 38.3%（18 次） — OOM 后连接池无法正常工作的连锁反应\n- OOM heap space 5 次 (10.6%)\n- GC overhead 3 次 (6.4%)\n- JDBC 连接异常 12 次 (25.5%) + 事务创建失败 9 次 (19.1%) — 均为 OOM 的次生影响\n\n真正的根因是 OOM (5+3=8 次），其余 39 次错误均为连锁反应。继续搜索 OOM 前的关键日志以定位内存泄漏源。",
  },
  // log 工具调用 3: es_keyword_search（真实 workflow: 继续用 execute_python_code）
  {
    type: "toolCall",
    toolCallId: "call_log_es_keyword",
    toolCallName: "execute_python_code",
    role: "assistant",
    name: "log_analysis",
    depId: "log-tool3",
    depOn: ["log-think3"],
    resolveOnOutput: true,
    args: { code: "# es_keyword_search for OOM context\nimport json\nresult = es_keyword_search(pod_pattern='fineract-server-7cf8f97dcd-7pqnz', keywords=['OutOfMemoryError', 'heap space', 'GC overhead', 'large batch'], duration='30m', namespace='ops-stack', size=20)\nprint(json.dumps(result, indent=2, ensure_ascii=False))" },
    output: '<returncode>0</returncode><stdout>{\n  "total_hits": 15,\n  "results": [\n    {"@timestamp": "2026-03-31T08:05:33Z", "message": "Starting batch processing for GL closures, entries: 30000", "thread": "scheduling-1"},\n    {"@timestamp": "2026-03-31T08:07:41Z", "message": "LoanReadPlatformServiceImpl.retrieveAll() loading 52847 loan records without pagination", "thread": "http-nio-8443-exec-15"},\n    {"@timestamp": "2026-03-31T08:08:55Z", "message": "[GC (Allocation Failure) Full GC — before: 745MB, after: 710MB, duration: 285ms]", "thread": "GC Thread"},\n    {"@timestamp": "2026-03-31T08:09:02Z", "message": "[GC (Allocation Failure) Full GC — before: 738MB, after: 725MB, duration: 310ms]", "thread": "GC Thread"},\n    {"@timestamp": "2026-03-31T08:09:08Z", "message": "[GC (Allocation Failure) Full GC — before: 752MB, after: 748MB, duration: 345ms — reclaim only 4MB]", "thread": "GC Thread"},\n    {"@timestamp": "2026-03-31T08:09:10Z", "message": "java.lang.OutOfMemoryError: Java heap space at LoanReadPlatformServiceImpl.retrieveAll:342", "thread": "http-nio-8443-exec-15"}\n  ]\n}\n</stdout><stderr></stderr>',
    syncOutput: false,
    outputDelay: [800, 1400],
  },
  // log 思考 4
  {
    type: "thinking",
    role: "assistant",
    name: "log_analysis",
    depId: "log-think4",
    depOn: ["log-tool3"],
    text: "找到完整的 OOM 时间线：\n\n08:05:33 — scheduling-1 启动 GL 结转批处理（30000 条）\n08:07:41 — http-nio-exec-15 执行 retrieveAll() 加载 52847 条贷款记录（无分页！）\n08:08:55 — Full GC #1: 回收 35MB (745→710)\n08:09:02 — Full GC #2: 回收 13MB (738→725) — 回收量下降\n08:09:08 — Full GC #3: 仅回收 4MB (752→748) — 几乎无法回收\n08:09:10 — OutOfMemoryError at LoanReadPlatformServiceImpl.retrieveAll:342\n\nFull GC 回收量骤降（35MB→13MB→4MB）是经典的内存泄漏特征。两个并发热点同时消耗大量内存：\n1. 贷款查询一次加载 52847 条完整 Loan 实体 — 预估 ArrayList<Loan> 占用 200-300MB\n2. GL 结转批处理累积 30000 条对象引用不释放 — 预估额外占用 100-150MB\n\n结论已完整，可以输出报告。",
  },
  // log 结论输出
  {
    type: "text",
    messageId: "msg-log-conclusion",
    role: "assistant",
    name: "log_analysis",
    depId: "log-text",
    depOn: ["log-think4"],
    text: "## 应用日志分析结论\n\n**OOM 直接原因**: `java.lang.OutOfMemoryError: Java heap space`（5 次）+ `GC overhead limit exceeded`（3 次）\n\n**OOM 时间线还原**:\n| 时间 | 事件 |\n|------|------|\n| 08:05:33 | `scheduling-1` 启动 GL 结转批处理（30000 条） |\n| 08:07:41 | `http-nio-exec-15` 执行 `retrieveAll()` 加载 52847 条贷款记录（**无分页**） |\n| 08:08:55 | Full GC #1: 回收 35MB（745→710MB） |\n| 08:09:02 | Full GC #2: 回收 13MB（738→725MB）— 回收量下降 |\n| 08:09:08 | Full GC #3: 仅回收 4MB（752→748MB）— 几乎无法回收 |\n| 08:09:10 | **OOM** at `LoanReadPlatformServiceImpl.retrieveAll:342` |\n| 08:09:12 | GC overhead limit exceeded at `GLClosureWritePlatformServiceImpl` |\n| 08:09:13~14 | 连锁反应：HikariPool 连接超时 ×18、JDBC 异常 ×12、事务失败 ×9 |\n\n**根因定位**:\n1. `LoanReadPlatformServiceImpl.retrieveAll()` — 一次性加载 52847 条贷款记录到内存，ArrayList\\<Loan\\> 预估占用 200-300MB\n2. `GLClosureWritePlatformServiceImpl.execute()` — 批处理累积 30000 条对象引用，预估额外占用 100-150MB\n\n**内存泄漏证据**: Full GC 回收量骤降 35MB → 13MB → 4MB\n\n**建议**: 对贷款查询接口增加分页限制（pageSize ≤ 1000），批处理任务改为分批提交并及时释放引用。",
  },

  // ============================================================
  // Phase 3: sre_plan_agent Round 2
  // 真实 workflow: view_subtasks → finish_subtask ×3 → update_subtask_state(3) + call_fault_summary
  // ============================================================
  {
    type: "thinking",
    role: "assistant",
    name: "sre_plan_agent",
    depId: "p3-think1",
    depOn: ["k8s-text", "met-text", "log-text"],
    text: "三个子任务的 call agent 调用结果已经返回。所有子智能体都完成了各自的分析。现在需要：\n1. 先查看各子任务的详细结果\n2. 然后将三个子任务标记为完成\n3. 启动排查总结子任务\n\n先调用 view_subtasks 查看结果。",
  },
  // 真实 workflow: view_subtasks 而非 query_agent_results
  {
    type: "toolCall",
    toolCallId: "call_p3_view_subtasks",
    toolCallName: "view_subtasks",
    role: "assistant",
    name: "sre_plan_agent",
    depId: "p3-view",
    depOn: ["p3-think1"],
    resolveOnOutput: true,
    args: { subtask_idx: [0, 1, 2] },
    output: '{"subtasks":[{"index":0,"name":"K8s 状态分析","state":"in_progress","agent":"k8s_status_analysis","result_summary":"Pod OOMKilled 3 times, JVM -Xmx1G + native memory approaching 2Gi container limit"},{"index":1,"name":"监控指标分析","state":"in_progress","agent":"metrics_analysis","result_summary":"working_set 从 1.30Gi 暴涨至 1.87Gi，Full GC 风暴，CPU 暴涨至 0.289 核"},{"index":2,"name":"应用日志分析","state":"in_progress","agent":"log_analysis","result_summary":"OOM at LoanReadPlatformServiceImpl.retrieveAll:342, 52847 records without pagination + batch processing 30000 entries"}]}',
    syncOutput: false,
    outputDelay: [500, 1000],
  },
  {
    type: "thinking",
    role: "assistant",
    name: "sre_plan_agent",
    depId: "p3-think2",
    depOn: ["p3-view"],
    text: "三个子任务的分析结果已确认：\n- K8s: Pod OOMKilled，JVM 配置 + native memory 接近容器限制\n- Metrics: working_set 暴涨至 1.87Gi，Full GC 风暴\n- Log: 贷款查询 52847 条无分页 + 批处理 30000 条累积对象\n\n需要先完成这三个子任务，然后启动排查总结子任务让 fault_summary 智能体汇总生成最终报告。",
  },
  // 真实 workflow: finish_subtask 而非 update_subtask_state(completed)
  {
    type: "toolCall",
    toolCallId: "call_p3_finish_0",
    toolCallName: "finish_subtask",
    role: "assistant",
    name: "sre_plan_agent",
    depId: "p3-finish0",
    depOn: ["p3-think2"],
    resolveOnOutput: true,
    args: { subtask_idx: 0, output: "K8s 状态分析完成 — Pod OOMKilled 3 次，JVM 内存配置 + native memory 占用接近 2Gi 容器限制" },
    output: "Subtask at index 0, named 'K8s 状态分析' is marked as done successfully.",
    syncOutput: false,
    outputDelay: [300, 700],
  },
  {
    type: "toolCall",
    toolCallId: "call_p3_finish_1",
    toolCallName: "finish_subtask",
    role: "assistant",
    name: "sre_plan_agent",
    depId: "p3-finish1",
    depOn: ["p3-finish0"],
    resolveOnOutput: true,
    args: { subtask_idx: 1, output: "监控指标分析完成 — working_set_bytes OOM 前暴涨至 1.87Gi，Full GC 风暴特征明显" },
    output: "Subtask at index 1, named '监控指标分析' is marked as done successfully.",
    syncOutput: false,
    outputDelay: [300, 700],
  },
  {
    type: "toolCall",
    toolCallId: "call_p3_finish_2",
    toolCallName: "finish_subtask",
    role: "assistant",
    name: "sre_plan_agent",
    depId: "p3-finish2",
    depOn: ["p3-finish1"],
    resolveOnOutput: true,
    args: { subtask_idx: 2, output: "应用日志分析完成 — 两个代码级根因定位：无分页贷款查询 + 批处理内存累积" },
    output: "Subtask at index 2, named '应用日志分析' is marked as done successfully.",
    syncOutput: false,
    outputDelay: [300, 700],
  },
  {
    type: "thinking",
    role: "assistant",
    name: "sre_plan_agent",
    depId: "p3-think3",
    depOn: ["p3-finish2"],
    text: "三个排查子任务都已完成。现在需要执行排查总结子任务，调用 fault_summary 智能体来汇总所有排查数据，生成综合排查结论。先更新子任务 3（排查总结）状态为 in_progress，然后调用 fault_summary。",
  },
  {
    type: "toolCall",
    toolCallId: "call_p3_upd3",
    toolCallName: "update_subtask_state",
    role: "assistant",
    name: "sre_plan_agent",
    depId: "p3-upd3",
    depOn: ["p3-think3"],
    args: { subtask_idx: 3, state: "in_progress" },
    output: "Subtask at index 3, named '排查总结' is marked as 'in_progress' successfully.",
    syncOutput: false,
    outputDelay: [200, 500],
  },
  // 真实 workflow: call_fault_summary（dispatch 结果异步返回）
  {
    type: "toolCall",
    toolCallId: "call_p3_dispatch_fs",
    toolCallName: "call_fault_summary",
    role: "assistant",
    name: "sre_plan_agent",
    depId: "p3-dispatch-fs",
    depOn: ["p3-upd3"],
    args: { task: "汇总 K8s 状态分析、监控指标分析、应用日志分析三个子任务的排查结果，生成综合排查结论，输出排查总体结论。" },
    output: "fault_summary agent completed. 排查总结已生成并保存至 ./investigation_summary.md。",
    syncOutput: false,
    outputDelay: [15000, 25000],
  },

  // ============================================================
  // Phase 4: fault_summary — 汇总排查数据
  // 真实工具名：execute_shell_command, view_text_file, write_text_file
  // ============================================================
  {
    type: "thinking",
    role: "assistant",
    name: "fault_summary",
    depId: "fs-think1",
    depOn: ["p3-dispatch-fs"],
    text: "收到汇总任务。需要综合 K8s 状态分析、监控指标分析、应用日志分析三方面的排查结果，生成排查总体结论。先查找环境中的相关文件和排查配置。",
  },
  {
    type: "toolCall",
    toolCallId: "call_fs_find_files",
    toolCallName: "execute_shell_command",
    role: "assistant",
    name: "fault_summary",
    depId: "fs-tool1",
    depOn: ["fs-think1"],
    resolveOnOutput: true,
    args: { command: "find . -name 'incident_data.json' -o -name 'SKILL.md' | head -20" },
    output: '<returncode>0</returncode><stdout>./app/api/incident_data.json\n./app/prodline/skills/sre/k8s_status_analysis/k8s_status_analysis/SKILL.md\n./app/prodline/skills/sre/log_analysis/log_analysis/SKILL.md\n./app/prodline/skills/sre/metrics_analysis/metrics_analysis/SKILL.md\n./app/prodline/skills/sre/root_cause_analysis/root_cause_analysis/SKILL.md\n./app/prodline/skills/sre/sre_plan_agent/investigation-planning/SKILL.md\n</stdout><stderr></stderr>',
    syncOutput: false,
    outputDelay: [500, 1000],
  },
  {
    type: "thinking",
    role: "assistant",
    name: "fault_summary",
    depId: "fs-think2",
    depOn: ["fs-tool1"],
    text: "找到 incident_data.json 和各个 SKILL 文件。先读取 incident 数据来获取告警信息的上下文，以便与排查结果关联。",
  },
  {
    type: "toolCall",
    toolCallId: "call_fs_read_incident",
    toolCallName: "view_text_file",
    role: "assistant",
    name: "fault_summary",
    depId: "fs-tool2",
    depOn: ["fs-think2"],
    resolveOnOutput: true,
    args: { file_path: "./app/api/incident_data.json" },
    output: '{"incidentInfo":{"id":"INC-20260331-OOM","title":"fineract-server Pod OOMKilled 重复重启","severity":"P1","status":"排查中","time":"2026-03-31 08:09:14"},"target":{"pod":"fineract-server-7cf8f97dcd-7pqnz","namespace":"ops-stack","node":"node-10-1-80-22"}}',
    syncOutput: false,
    outputDelay: [400, 800],
  },
  {
    type: "thinking",
    role: "assistant",
    name: "fault_summary",
    depId: "fs-think3",
    depOn: ["fs-tool2"],
    text: "已获取告警上下文：P1 级别，fineract-server Pod OOMKilled 重复重启。\n\n现在综合三个子任务的排查结论：\n\n1. **K8s 状态**: Pod 重启 3 次，JVM -Xmx1G + native memory 接近 2Gi 容器限制，QoS Burstable\n2. **监控指标**: working_set 暴涨 1.30Gi→1.87Gi，Full GC 风暴（CPU 0.049→0.289），GC 回收量骤降\n3. **应用日志**: OOM 根因定位到两个代码热点 — retrieveAll() 加载 52847 条无分页 + 批处理累积 30000 条\n\n可以生成排查总结报告了。先输出中间结论，然后写入文件。",
  },
  // fault_summary 第一段文本输出
  {
    type: "text",
    messageId: "msg-fs-text1",
    role: "assistant",
    name: "fault_summary",
    depId: "fs-text1",
    depOn: ["fs-think3"],
    text: "【排查总体结论】\n\n## 1. 概述\n\n基于 K8s 状态分析、监控指标分析、应用日志分析三个维度的综合排查，本次故障确认为 **fineract-server JVM 堆内存溢出导致容器 OOMKilled**，核心诱因是两个并发代码热点同时消耗大量内存。\n\n## 2. 故障定界\n\n**故障层级**: 应用层（JVM 内存管理）→ 容器层传导\n**故障本质**: JVM heap 溢出 + native memory 累积突破容器 memory limit\n**排除方向**: 排除网络故障、排除存储问题、排除节点异常",
  },
  // fault_summary 写入文件（真实 workflow: write_text_file）
  {
    type: "toolCall",
    toolCallId: "call_fs_write_summary",
    toolCallName: "write_text_file",
    role: "assistant",
    name: "fault_summary",
    depId: "fs-tool3",
    depOn: ["fs-text1"],
    resolveOnOutput: true,
    args: { file_path: "./investigation_summary.md", content: "# fineract-server OOMKilled 综合排查报告 ..." },
    output: "Create and write ./investigation_summary.md successfully.",
    syncOutput: false,
    outputDelay: [400, 800],
  },
  {
    type: "thinking",
    role: "assistant",
    name: "fault_summary",
    depId: "fs-think4",
    depOn: ["fs-tool3"],
    text: "排查报告文件已保存。现在输出完整的排查结论，包括各维度摘要、影响范围和修复建议。",
  },
  // fault_summary 最终结论（真实 workflow: fault_summary 输出两段 TEXT）
  {
    type: "text",
    messageId: "msg-fs-final",
    role: "assistant",
    name: "fault_summary",
    depId: "fs-text2",
    depOn: ["fs-think4"],
    text: "## 3. 各维度排查摘要\n\n### 3.1 K8s 状态分析\n**置信度**: 0.92\n- Pod 已重启 3 次，终止原因 OOMKilled（退出码 137）\n- 容器 limits 2Gi，JVM 配置 -Xmx1G + MaxMetaspaceSize 256m\n- 实际内存占用 1345Mi（含 native memory），QoS 为 Burstable\n\n### 3.2 监控指标分析\n**置信度**: 0.95\n- container_memory_working_set_bytes 在 OOM 前 30min 从 1.30Gi 暴涨至 1.87Gi\n- CPU 使用率从 0.049 暴涨至 0.289 核 — Full GC 风暴\n- Full GC 回收量骤降 35MB→13MB→4MB，确认内存泄漏\n\n### 3.3 应用日志分析\n**置信度**: 0.98\n- `LoanReadPlatformServiceImpl.retrieveAll()` 一次加载 52847 条贷款记录（无分页限制）\n- `GLClosureWritePlatformServiceImpl.execute()` 批处理累积 30000 条对象引用\n- OOM 时间线：批处理启动(08:05) → 大查询触发(08:07) → Full GC 风暴(08:08~09) → OOM(08:09:10)\n\n## 4. 修复建议\n\n| 优先级 | 措施 | 预期效果 |\n|--------|------|----------|\n| P0 | 调整 JVM 参数 `-Xmx768m`，确保总内存不超容器 limits 80% | 避免容器级 OOM |\n| P0 | `LoanReadPlatformServiceImpl.retrieveAll()` 增加分页（pageSize ≤ 1000） | 减少单次内存占用 200-300MB |\n| P1 | `GLClosureWritePlatformServiceImpl` 批处理改为分批提交（batchSize=500） | 避免对象累积 |\n| P2 | 考虑将容器 memory limits 提升至 3Gi 留足余量 | 缓解内存压力 |\n\n排查报告已保存至: `./investigation_summary.md`",
  },

  // ============================================================
  // Phase 5: sre_plan_agent Round 3
  // 真实 workflow: finish_subtask(3) → finish_plan → TEXT 综合总结 → CUSTOM SUGGESTED_ACTION
  // ============================================================
  {
    type: "thinking",
    role: "assistant",
    name: "sre_plan_agent",
    depId: "p5-think1",
    depOn: ["fs-text2"],
    text: "fault_summary 智能体已完成排查总结。排查总结子任务（index 3）已完成，需要标记 finish 然后完成整体计划。调用 finish_subtask 标记子任务 3 完成。",
  },
  // 真实 workflow: finish_subtask(3)
  {
    type: "toolCall",
    toolCallId: "call_p5_finish_3",
    toolCallName: "finish_subtask",
    role: "assistant",
    name: "sre_plan_agent",
    depId: "p5-finish3",
    depOn: ["p5-think1"],
    resolveOnOutput: true,
    args: { subtask_idx: 3, output: "排查总结完成 — 综合排查报告已生成并保存至 ./investigation_summary.md" },
    output: "Subtask (at index 3) named '排查总结' is marked as done successfully. All subtasks are completed. Plan is now marked as 'done'.",
    syncOutput: false,
    outputDelay: [300, 700],
  },
  {
    type: "thinking",
    role: "assistant",
    name: "sre_plan_agent",
    depId: "p5-think2",
    depOn: ["p5-finish3"],
    text: "所有 4 个子任务都已完成。计划已自动标记为 done。需要调用 finish_plan 正式结束计划。",
  },
  // 真实 workflow: finish_plan
  {
    type: "toolCall",
    toolCallId: "call_p5_finish_plan",
    toolCallName: "finish_plan",
    role: "assistant",
    name: "sre_plan_agent",
    depId: "p5-finish-plan",
    depOn: ["p5-think2"],
    resolveOnOutput: true,
    args: { outcome: "fineract-server OOMKilled 根因已定位：JVM 内存泄漏 + 代码级大对象分配。修复建议已输出。", state: "done" },
    output: "The current plan is finished successfully as 'done'.",
    syncOutput: false,
    outputDelay: [300, 700],
  },
  {
    type: "thinking",
    role: "assistant",
    name: "sre_plan_agent",
    depId: "p5-think3",
    depOn: ["p5-finish-plan"],
    text: "计划已完成。现在输出最终的综合排查总结给用户，并附上建议的后续操作供用户选择。\n\n排查关键结论：\n- Pod OOMKilled 根因：JVM heap 溢出\n- 两个代码热点：无分页贷款查询 + 批处理内存累积\n- 修复方向：JVM 参数调优 + 代码修复分页 + 批处理优化\n\n需要给出后续建议动作：进行处置恢复 或 重新排查。",
  },
  // 最终综合总结（真实 workflow: TEXT_MESSAGE 输出）
  {
    type: "text",
    messageId: "msg-plan-final",
    role: "assistant",
    name: "sre_plan_agent",
    depId: "p5-text",
    depOn: ["p5-think3"],
    text: "## 综合排查总结\n\n**目标 Pod**: `fineract-server-7cf8f97dcd-7pqnz`（namespace: ops-stack, node: node-10-1-80-22）\n\n### 排查任务执行概览\n\n| 子任务 | 智能体 | 状态 | 关键结论 |\n|--------|--------|------|----------|\n| K8s 状态分析 | k8s_status_analysis | ✅ 完成 | Pod OOMKilled 3 次，JVM -Xmx1G + native memory 接近 2Gi limit |\n| 监控指标分析 | metrics_analysis | ✅ 完成 | working_set 暴涨 1.30→1.87Gi，Full GC 风暴，CPU 暴涨 |\n| 应用日志分析 | log_analysis | ✅ 完成 | OOM 根因：52847 条无分页查询 + 30000 条批处理累积 |\n| 排查总结 | fault_summary | ✅ 完成 | 综合报告已生成 |\n\n### 根因分析\n\nPod 因 **OOMKilled** 重复重启，根本原因链路：\n\n```\n批处理启动(08:05) → 大查询触发(08:07) → 内存飙升 → Full GC 风暴(08:08~09) → GC 回收失效 → OOMKilled(08:09:14)\n```\n\n1. **代码级内存泄漏**:\n   - `LoanReadPlatformServiceImpl.retrieveAll()` 一次性加载 52847 条记录（~250MB）\n   - `GLClosureWritePlatformServiceImpl.execute()` 批处理累积 30000 条对象（~120MB）\n2. **JVM 配置不当**: `-Xmx1G` + MetaspaceSize 256m + native memory，总占用可达 1.5Gi+\n3. **GC 无法自救**: Full GC 回收量 35MB→13MB→4MB，泄漏对象无法被回收\n\n### 修复建议\n\n| 优先级 | 措施 | 预期效果 |\n|--------|------|----------|\n| P0 | 调整 JVM `-Xmx768m -Xms512m`，确保总内存 < limits×80% | 避免 OOM |\n| P0 | 贷款查询接口增加分页（pageSize ≤ 1000） | 减少 250MB 内存占用 |\n| P1 | 批处理改为分批提交（batchSize=500）+ 及时释放引用 | 避免 120MB 对象累积 |\n| P2 | 添加 JVM 监控告警（heap usage > 80% 触发） | 提前预警 |\n\n排查报告已保存至: `./investigation_summary.md`\n\n此轮诊断完毕。",
  },
  // 真实 workflow: CUSTOM SUGGESTED_ACTION（供用户选择下一步操作）
  {
    type: "CUSTOM",
    typeName: "SUGGESTED_ACTION",
    name: "sre_plan_agent",
    depOn: ["p5-text"],
    text: { suggested_action: ["进行处置恢复", "基于聚合告警的结论，重新排查故障"], next_action_description: "我已完成多维度排查。根据收集到的证据，诊断结论已输出。请确认排查结果。", next_action_query: "进行处置恢复" },
  },
];
