# Samsara vs Ofstar (车队管家) 报表功能对比分析

> 对比对象：
> - **Samsara**：`https://cloud.samsara.com/o/7007185/fleet/reports/index`（8类 48份报表）
> - **Ofstar (车队管家)**：`https://aidriver.ofstar.com/apps/1923256648751644693`（AI Fleet Platform）

---

## 一、平台基本信息对比

| 维度 | Samsara | Ofstar (车队管家) |
|---|---|---|
| 总部 | 美国旧金山（NYSE: IOT） | 新加坡 / 杭州（涂鸦智能旗下，NYSE: TUYA） |
| 连接设备 | 未公开（北美/欧洲大型上市公司） | 200万+ |
| 客户数量 | 20,000+（燃油基准报表数据来源） | 7,600+ |
| 服务地区 | 北美、欧洲为主 | 200+ 国家/地区 |
| 全球数据中心 | 未公开 | 7个 |
| 合规侧重 | FMCSA / ELD / IFTA / EU Tachograph | 中国两客一危 / 北斗 / 国际市场 |
| 核心硬件 | Vehicle Gateway (VG34/VG54) + AI Dash Cam (CM31/CM32) + Asset Tag (AT11) | AI Multicam + GTBOX + GPS定位器 + 超声波油位传感器 + 温度传感器 |
| AI 能力 | AI Dash Cam 视觉识别（9种行为检测） | 360° AI视觉 + ADAS + DMS + Ofstar Assistant（自然语言） |
| 主要行业 | 运输物流、建筑、公共服务 | 运输物流、建筑、网约车、公共交通、快递配送、冷链 |
| 报表总数 | **48 份**（8类 Created by Samsara 预置报表） | **~25-30 份**（估算，含业务运营报表） |

---

## 二、报表分类与数量对比

| 报表类别 | Samsara（48份） | Ofstar 车队管家 | 差异 |
|---|---|---|---|
| 安全类 | **9 份**（Safety Inbox/Score/Harsh Events/Speeding/Coaching/Benchmarks/Nudges/Risk Factors/Resolution） | ~3-4 份（ADAS/DMS告警、超速、驾驶行为） | Samsara +5 |
| 合规类 (HOS/ELD) | **8 份**（HOS/Violations/Daily Logs/Recap/DVIR/Audit/Duty Status Summary/Unassigned） | ~1 份（维保申请替代部分 DVIR） | 市场差异 |
| 燃油能源类 | **5 份**（Fuel Report/Purchases/IFTA/Idling/Fuel Benchmarks） | ~2-3 份（油耗/点火明细/油卡消费） | Samsara +2 |
| 活动行程类 | **5 份**（Activity/Trip/Geofence/After Hours/Driver Assignment） | ~3-4 份（行程/里程/围栏/轨迹） | Samsara +1 |
| 利用率效率类 | **3 份**（Utilization/Driver Efficiency/Vehicle Detail） | ~1 份（趟数统计） | Samsara +2 |
| 维护类 | **6 份**（Service Logs/OBD-II Faults/J1939 Faults/Tell Tale/DVIR Defects/PM Schedule） | ~2-3 份（维保统计/提醒/配件） | Samsara +3 |
| 设备健康类 | **3 份**（Gateway Health/Camera Health/Sensor Health） | ❌ 无对应类别 | Samsara 独有 |
| 文档/自定义/其他 | **9 份**（Documents/Custom/Scheduled/Year Summary/Asset Tags/Tachograph×4） | ~5-6 份（排班/考勤/财务/评价/自定义导出） | 各有侧重 |
| **运营管理类** | ❌ 无对应 | **~7-8 份**（排班/考勤/财务/结算/计价/出勤率/评价/温度） | **Ofstar 独有** |
| **合计** | **48** | **~25-30** | |

---

## 三、逐类详细对比（48 → 逐条映射）

### 3.1 安全类报表（Samsara 9份）

| # | Samsara 报表 | Ofstar 对应 | 覆盖度 | 说明 |
|---|---|---|---|---|
| 1 | Safety Inbox（安全事件收件箱） | ⚠️ 告警记录查看 | 30% | Ofstar 有告警列表+视频，但缺乏 Needs Review→Coaching→Dismissed→Archived 工作流闭环 |
| 2 | Safety Score（安全评分 0-100） | ⚠️ DMS/ADAS 评分概念 | 20% | Ofstar 有驾驶行为评分，但未公开标准化的0-100分权重体系 |
| 3 | Harsh Event Reports（急操作事件） | ⚠️ ADAS 可检测 | 40% | Ofstar 通过 ADAS 检测急操作，但缺乏 G 力值、独立报表格式 |
| 4 | Speeding Report（超速报告） | ✅ 超速报警 | 70% | 基本对齐——Ofstar 有超速阈值配置+告警记录；Samsara 多了道路限速对比和严重等级分级 |
| 5 | Coaching Effectiveness Report（辅导效果） | ❌ 无 | 0% | Samsara 独有的辅导改善追踪（重复行为率、45天窗口） |
| 6 | Fleet Benchmarks Report（安全基准对比） | ❌ 无 | 0% | Samsara 独有的同行匿名安全数据对比 |
| 7 | In-Cab Nudges Report（车内告警统计） | ⚠️ 有语音告警 | 20% | Ofstar ADAS/DMS 有告警，但无独立触发计数与响应分析报表 |
| 8 | Safety Risk Factor Reports（风险因素） | ⚠️ 有行为数据 | 30% | Ofstar 有驾驶行为数据，但缺乏按风险类别的事件率/趋势/班次分布分析 |
| 9 | Event Resolution Report（事件处理进度） | ❌ 无 | 0% | Samsara 独有的处理率/平均处理时间/Coach分配率追踪 |

### 3.2 合规类报表（Samsara 8份）

| # | Samsara 报表 | Ofstar 对应 | 覆盖度 | 说明 |
|---|---|---|---|---|
| 10 | HOS Report（工时主报告） | ❌ | N/A | 北美 ELD 体系，Ofstar 非目标市场 |
| 11 | HOS Violations Report | ❌ | N/A | 北美 FMCSA 18+ 种违规类型 |
| 12 | HOS Daily Logs | ❌ | N/A | 北美每日值勤日志 |
| 13 | Recap Hours Report | ❌ | N/A | 未来7天工时恢复预测 |
| 14 | DVIR（车辆检查报告） | ⚠️ 维保申请 | 25% | Ofstar 有司机发起维保申请，但无标准化 pre-trip/post-trip 检查+三级签名 |
| 15 | ELD Audit Report | ❌ | N/A | FMCSA 审计文件输出 |
| 16 | Duty Status Summary Report | ❌ | N/A | 各值勤状态(Off Duty/Driving/Sleeper等)时间分布汇总 |
| 17 | Unassigned HOS | ❌ | N/A | 未分配驾驶员的 ELD 驾驶段管理 |
| — | **中国两客一危合规** | ✅ Ofstar 有 | 100% | Samsara ❌ 不支持 |

### 3.3 燃油能源类报表（Samsara 5份）

| # | Samsara 报表 | Ofstar 对应 | 覆盖度 | 说明 |
|---|---|---|---|---|
| 18 | Fuel & Energy Report（燃油能源） | ⚠️ 油耗报表 | 40% | Ofstar 有油耗+点火明细；Samsara 多了 MPG 计算、碳排放估算、EV/PHEV 支持、成本估算 |
| 19 | Fuel Purchases Report（燃油采购） | ✅ 油卡消费明细 | 80% | 基本对齐——均支持油卡同步（Samsara: WEX/Fleetcor；Ofstar: 国内油卡/ETC） |
| 20 | IFTA Report（国际燃油税） | ❌ | N/A | 北美跨州燃油税合规 |
| 21 | Idling Report（怠速报告） | ⚠️ 行程报表内字段 | 30% | Ofstar 行程报表含怠速时长字段；Samsara 有独立报表含位置/PTO状态过滤 |
| 22 | Fuel & Energy Benchmarks Report（燃油基准对比） | ❌ 无 | 0% | Samsara 独有——按品牌/车型与 20,000+ 客户匿名数据对比 |
| — | **点火时间/明细** | ✅ Ofstar 有 | 100% | Samsara ❌ 无独立点火报表 |

### 3.4 活动行程类报表（Samsara 5份）

| # | Samsara 报表 | Ofstar 对应 | 覆盖度 | 说明 |
|---|---|---|---|---|
| 23 | Activity Report（活动报告） | ⚠️ 行程报表 | 50% | Ofstar 行程报表含任务里程/怠速时长；Samsara 更完整（行驶/怠速/停车分项+行程次数+油耗） |
| 24 | Trip History Report（行程历史） | ✅ 行程报表+轨迹回放 | 75% | 基本对齐——均有起止位置/里程/时速；Samsara 多了里程表读数和平均速度 |
| 25 | Geofence Activity Report（地理围栏） | ✅ 电子围栏报警 | 70% | 基本对齐——均支持围栏进出告警；Samsara 多了停留时长计算和 Webhook 实时推送 |
| 26 | After Hours Report（非工时使用） | ❌ 无 | 0% | Samsara 独有——工作时间策略外的车辆使用追踪 |
| 27 | Driver Assignment Report（驾驶员分配） | ⚠️ 排班中分配 | 30% | Ofstar 通过排班实现司机-车辆分配；Samsara 有独立报表含 NFC/QR 分配方式和变更历史 |
| — | **里程报表（按车辆日期）** | ✅ Ofstar 有 | — | Samsara 通过 Activity Report 覆盖 |
| — | **趟数统计** | ✅ Ofstar 有 | — | Samsara ❌ 无独立趟数统计 |

### 3.5 利用率效率类报表（Samsara 3份）

| # | Samsara 报表 | Ofstar 对应 | 覆盖度 | 说明 |
|---|---|---|---|---|
| 28 | Utilization Report（资产利用率） | ⚠️ 趟数统计 | 20% | Samsara 按小时/距离计算百分比利用率；Ofstar 仅有趟数统计 |
| 29 | Driver Efficiency Report（驾驶员效率） | ❌ 无 | 0% | Samsara 独有——按驾驶员的 MPG/怠速占比排名 |
| 30 | Vehicle Utilization Detail（车辆利用率明细） | ❌ 无 | 0% | Samsara 独有——逐日/逐车引擎运行/行驶/怠速时间分布 |

### 3.6 维护类报表（Samsara 6份）

| # | Samsara 报表 | Ofstar 对应 | 覆盖度 | 说明 |
|---|---|---|---|---|
| 31 | Service Logs Report（维修日志） | ✅ 维保统计 | 70% | 基本对齐——均有维修记录/费用/厂商管理；Samsara 多了 AI 发票识别和 DVIR 自动关联 |
| 32 | Fault Codes — OBD-II（乘用车故障码） | ⚠️ GTBOX 基础诊断 | 25% | Samsara 有结构化 DTC (确认/待定/永久)+检查灯+排放监测状态；Ofstar 仅基础 OBD |
| 33 | Fault Codes — J1939（重型车故障码） | ❌ 无 | 0% | Samsara 独有——SPN/FMI/灯状态/出现次数/源地址 |
| 34 | Tell Tale Status Report（仪表警告灯） | ⚠️ 电压显示 | 10% | Samsara 有完整警告灯名称+Yellow/Red严重度；Ofstar 仅监控页面显示电压 |
| 35 | DVIR Defects Report（缺陷追踪） | ⚠️ 维保审批 | 25% | Ofstar 维保申请+审批可部分替代；Samsara 有缺陷类型/未修复天数/维修备注 |
| 36 | Preventive Maintenance Schedule | ✅ 到期提醒 | 60% | Ofstar 有年检/保养/保险到期提醒；Samsara 多了里程/引擎小时双触发条件 |
| — | **配件报表** | ✅ Ofstar 有 | — | Samsara ❌ 无独立配件报表 |
| — | **事故管理** | ✅ Ofstar 有独立模块 | — | Samsara ⚠️ 通过 Safety Events + Dash Cam 视频覆盖 |

### 3.7 设备健康类报表（Samsara 3份 — Ofstar 无对应类别）

| # | Samsara 报表 | Ofstar 对应 | 覆盖度 | 说明 |
|---|---|---|---|---|
| 37 | Gateway Health Report（网关健康） | ❌ 无 | 0% | 网关在线状态/蜂窝连接/电池/最后位置+修复建议 |
| 38 | Camera Health Report（摄像头健康） | ❌ 无 | 0% | 摄像头连接状态/录制状态/断连原因+修复建议 |
| 39 | Sensor Health Report（传感器健康） | ❌ 无 | 0% | 传感器类型/电池/信号/最后读数时间 |

### 3.8 文档/自定义/其他（Samsara 9份）

| # | Samsara 报表 | Ofstar 对应 | 覆盖度 | 说明 |
|---|---|---|---|---|
| 40 | Documents Report（文档表单） | ⚠️ 申请表单 | 25% | Ofstar 有费用/请假/维保申请；Samsara 有6种字段类型的通用文档模板系统 |
| 41 | Custom Reports（自定义报表） | ⚠️ 自定义导出 | 15% | Samsara 80+字段拖拽构建器；Ofstar 仅排班报表支持自定义导出 |
| 42 | Scheduled Reports（定时报表） | ❌ 无 | 0% | Samsara 独有——每日/周/月自动邮件发送 |
| 43 | Year Summary Report（年度总结） | ❌ 无 | 0% | Samsara 独有——全年运营回顾+社区基准 |
| 44 | Samsara Network Activity Report for Asset Tags | ❌ 无 | 0% | Samsara 独有——BLE 资产标签网络检测/可见性报表 |
| 45 | Tachograph — Live Driver's Hours（仅EU） | ❌ | N/A | EU 行驶记录仪实时合规 |
| 46 | Tachograph — Historical Driver's Hours | ❌ | N/A | EU 行驶记录仪历史记录 |
| 47 | Tachograph — Unassigned Driving | ❌ | N/A | EU 未分配驾驶 |
| 48 | Tachograph — Infringement Reports | ❌ | N/A | EU 驾驶时间违规 |

### 3.9 运营管理类报表（Ofstar 独有 ~7-8份）

| # | Ofstar 报表 | Samsara 对应 | 说明 |
|---|---|---|---|
| O1 | 排班报表（含分组/打印/出勤率） | ❌ 无 | 完整排班系统+多维度出勤率统计（按司机/按天） |
| O2 | 考勤报表（打卡明细导出） | ❌ 无 | 司机考勤打卡+绩效考核 |
| O3 | 财务报表（每日更新+挂账统计） | ❌ 无 | PC首页财务数据+收支分析 |
| O4 | 财务结算（计价/报销/对账） | ❌ 无 | 自动计算任务费用+报销凭证+油卡ETC同步 |
| O5 | 评价报表 | ❌ 无 | 司机/服务质量评价统计 |
| O6 | 智能计价报表 | ❌ 无 | 自定义字段+多公式自动运费/里程补贴计算 |
| O7 | 司机出勤率报表 | ❌ 无 | 按司机/按天两个维度 |
| O8 | 温度监控报表（冷链） | ❌ 无 | 温度曲线+过高/过低报警（冷链场景） |

---

## 四、综合对比矩阵

> ✅ = 完整支持 | ⚠️ = 部分支持 | ❌ = 不支持 | N/A = 不适用（市场差异）

| 能力维度 | Samsara | Ofstar |
|---|---|---|
| **安全事件管理** | ✅ 完整闭环（Inbox→Review→Coach→Archive） | ⚠️ 告警记录+视频，无闭环工作流 |
| **安全评分体系** | ✅ 0-100 可配置权重+颜色分级 | ⚠️ 有评分概念，未标准化 |
| **辅导效果追踪** | ✅ 重复行为率+辅导会话+改善曲线 | ❌ |
| **ADAS/DMS** | ✅ 前置+车内 AI 检测 | ✅ 360° AI + ADAS + DMS |
| **行车记录仪视频** | ✅ 自动事件触发+回放 | ✅ 最多 6 路摄像头+视频下载 |
| **超速管理** | ✅ 含道路限速对比+严重等级 | ✅ 超速报警+阈值配置 |
| **同行基准对比** | ✅ 安全+燃油双维度 | ❌ |
| **北美合规 (ELD/HOS/IFTA)** | ✅ 8份合规报表 | N/A |
| **欧盟合规 (Tachograph)** | ✅ 4份报表 | N/A |
| **中国合规 (两客一危/北斗)** | N/A | ✅ 完整 |
| **燃油效率分析** | ✅ MPG+碳排放+EV/PHEV+基准对比 | ⚠️ 油耗+点火明细（基础） |
| **油卡集成** | ✅ WEX/Fleetcor | ✅ 油卡/ETC 自动同步 |
| **电子围栏** | ✅ Webhook 实时推送+停留时长 | ✅ 围栏+偏离路径报警 |
| **行程/轨迹** | ✅ 完整行程历史 | ✅ 行程报表+轨迹回放 |
| **怠速分析** | ✅ 独立报表（含 PTO 过滤） | ⚠️ 行程报表内字段 |
| **资产利用率** | ✅ 多类型+百分比 | ⚠️ 趟数统计部分替代 |
| **故障码诊断** | ✅ OBD-II + J1939 结构化 | ⚠️ OBD 基础诊断 |
| **仪表盘警告灯** | ✅ 名称+严重度 | ⚠️ 电压显示 |
| **设备健康监控** | ✅ 网关+摄像头+传感器 3份报表 | ❌ |
| **资产标签追踪** | ✅ BLE 网络活动报表 | ❌ |
| **车辆检查 (DVIR)** | ✅ 标准化三级签名 | ⚠️ 维保申请替代 |
| **预防性维护** | ✅ 里程/引擎小时触发 | ✅ 到期提醒 |
| **自定义报表** | ✅ 80+ 字段拖拽构建 | ⚠️ 排班自定义导出 |
| **定时报表邮件** | ✅ Daily/Weekly/Monthly | ❌ |
| **开放 API** | ✅ 完整 REST API 文档 | ⚠️ 有 API，公开文档有限 |
| **排班管理** | ❌ | ✅ 完整排班系统 |
| **考勤管理** | ❌ | ✅ 打卡+明细导出 |
| **财务管理** | ❌ | ✅ 计价/结算/报销 |
| **审批流** | ❌ | ✅ 多级分权审批 |
| **调度系统** | ❌ | ✅ 智能调度+抢单+路径规划 |
| **冷链温度** | ❌ | ✅ 温度监控+报警 |
| **趟数统计** | ❌ | ✅ 自动趟次统计 |
| **事故管理** | ⚠️ Safety Events 覆盖 | ✅ 独立模块 |
| **AI 自然语言助手** | ❌ | ✅ Ofstar Assistant |

---

## 五、产品定位差异

| 维度 | Samsara | Ofstar (车队管家) |
|---|---|---|
| **核心定位** | **遥测+安全+合规平台**（以设备数据为中心） | **运营管理平台**（以业务流程为中心） |
| **最强板块** | 安全管理闭环、合规体系、数据精度、设备健康 | 排班调度、财务结算、考勤、运营管理 |
| **数据深度** | 极深（ECU级故障码、G力值、Tell Tale、排放监测） | 中等（GPS+视频+油耗+OBD基础） |
| **业务覆盖** | 车辆→安全→合规→维护→设备健康 | 车辆→排班→调度→财务→考勤→维保 |
| **报表风格** | 细粒度遥测+安全数据报表 | 业务运营管理报表 |
| **目标用户** | 安全合规驱动型车队（北美/欧洲） | 运营效率驱动型车队（中国及全球新兴市场） |

---

## 六、功能互补 Checklist

### Checklist A：Ofstar 对标 Samsara 需补齐（按优先级）

#### P0 — 核心差距（安全管理闭环 + 平台能力）

| # | 待补齐能力 | 对标 Samsara 报表 | 说明 |
|---|---|---|---|
| 1 | ☐ 安全事件收件箱工作流 | #1 Safety Inbox | Needs Review→Coaching→Dismissed→Archived 完整闭环 |
| 2 | ☐ 安全评分体系 (0-100) | #2 Safety Score | 多行为加权、可配置权重、颜色分级、历史趋势 |
| 3 | ☐ 辅导效果追踪报表 | #5 Coaching Effectiveness | 重复行为率、辅导会话数、45天窗口、改善曲线 |
| 4 | ☐ 自定义报表构建器 | #41 Custom Reports | 80+字段、拖拽组装、最多16列、Driver/Vehicle维度 |
| 5 | ☐ 开放 API 文档化 | 全平台 | 完整 REST API + Webhook 事件推送文档 |
| 6 | ☐ 设备健康报表（网关+摄像头+传感器） | #37-#39 Device Health | 在线状态/电池/连接/修复建议的结构化报表 |

#### P1 — 重要差距（数据深度 + 分析能力）

| # | 待补齐能力 | 对标 Samsara 报表 | 说明 |
|---|---|---|---|
| 7 | ☐ OBD-II 故障码结构化报表 | #32 Fault Codes OBD-II | 确认/待定/永久 DTC + 检查灯 + 控制模块 + 排放监测 |
| 8 | ☐ J1939 故障码报表 | #33 Fault Codes J1939 | SPN/FMI + 4类灯状态 + 出现次数（重型车） |
| 9 | ☐ Tell Tale 仪表警告灯报表 | #34 Tell Tale Status | 警告灯名称 + Yellow/Red 严重度 |
| 10 | ☐ 独立怠速报表 | #21 Idling Report | 怠速事件列表（位置、时长、PTO 状态过滤） |
| 11 | ☐ DVIR 标准化检查报表 | #14 DVIR | 预定义检查项、三级签名、缺陷修复追踪 |
| 12 | ☐ 驾驶员效率排名报表 | #29 Driver Efficiency | 按驾驶员的 MPG/怠速占比排名 |
| 13 | ☐ 资产利用率报表 | #28 Utilization Report | 按小时/距离计算百分比、跨资产类型 |
| 14 | ☐ 燃油效率基准对比 | #22 Fuel Benchmarks | 按品牌/车型与平台同行匿名数据对比 |
| 15 | ☐ 安全风险因素分析报表 | #8 Risk Factors | 按行为分类事件率 + 趋势 + 班次分布 |
| 16 | ☐ 资产标签网络活动报表 | #44 Asset Tags | BLE 标签检测/可见性/围栏事件 |

#### P2 — 市场扩展（合规能力）

| # | 待补齐能力 | 对标 Samsara 报表 | 说明 |
|---|---|---|---|
| 17 | ☐ HOS/ELD 合规体系 | #10-#13,#15-#17 | 进入北美市场必需（8份报表） |
| 18 | ☐ IFTA 报表 | #20 | 北美跨州燃油税合规 |
| 19 | ☐ EU Tachograph 报表 | #45-#48 | 进入欧洲市场必需（4份报表） |

#### P3 — 体验提升

| # | 待补齐能力 | 对标 Samsara 报表 | 说明 |
|---|---|---|---|
| 20 | ☐ In-Cab Nudges 统计报表 | #7 | 车内告警触发计数与驾驶员响应分析 |
| 21 | ☐ 事件处理进度报表 | #9 Event Resolution | 处理率、平均处理时间 |
| 22 | ☐ 车队安全基准对比 | #6 Fleet Benchmarks | 与平台同行匿名安全数据对比 |
| 23 | ☐ 定时报表邮件发送 | #42 Scheduled Reports | Daily/Weekly/Monthly 自动推送 |
| 24 | ☐ 非工时使用报表 | #26 After Hours | 工作时间策略外的车辆使用追踪 |
| 25 | ☐ 年度总结报表 | #43 Year Summary | 年度运营指标回顾 + 社区基准 |
| 26 | ☐ 通用文档模板系统 | #40 Documents | 6种字段类型、模板自定义 |

---

### Checklist B：Samsara 对标 Ofstar 需补齐

| # | 待补齐能力 | 对标 Ofstar 报表 | 说明 |
|---|---|---|---|
| 1 | ☐ 排班管理系统 | O1 排班报表 | 多维度排班+出勤率统计+批量打印+分组查看 |
| 2 | ☐ 考勤打卡系统 | O2 考勤报表 | 司机考勤+明细导出+绩效考核 |
| 3 | ☐ 财务管理 | O3-O4 财务报表+结算 | 计价/结算/报销/挂账+油卡ETC同步 |
| 4 | ☐ 审批流 | — | 多级分权审批（用车/财务/维保）+"或"签 |
| 5 | ☐ 智能调度 | — | 抢单/一键调度/防冲突+路径规划生成排班 |
| 6 | ☐ 冷链温度监控 | O8 温度报表 | 温度曲线+报警+历史数据 |
| 7 | ☐ 趟数统计 | — | 作业用车趟次自动统计 |
| 8 | ☐ 评价体系 | O5 评价报表 | 司机/服务评价 |
| 9 | ☐ AI 自然语言助手 | — | 自然语言查询运营数据 |
| 10 | ☐ 中国合规 | — | 北斗/两客一危/部标平台入网 |
| 11 | ☐ 配件报表 | — | 独立配件消耗统计 |
| 12 | ☐ 点火时间/明细报表 | — | 独立的点火/熄火记录 |

---

## 七、量化差异统计

| 指标 | 数值 |
|---|---|
| Samsara 总报表数 | **48 份** |
| Ofstar 总报表数（估算） | **~25-30 份** |
| Samsara 有而 Ofstar 需补齐 | **26 项**（P0: 6 / P1: 10 / P2: 3 / P3: 7） |
| Ofstar 有而 Samsara 需补齐 | **12 项** |
| 两者基本对齐的能力 | **~10 项**（超速/油卡/围栏/行程/维修日志/PM提醒/视频/ADAS-DMS等） |
| 因市场差异不可比的 | **~12 份**（北美 ELD/IFTA 8份 + EU Tachograph 4份 vs 中国两客一危） |
| Samsara 独有类别 | 设备健康（3份）、资产标签网络活动 |
| Ofstar 独有类别 | 运营管理（排班/考勤/财务/计价/出勤率/温度/评价 ~8份） |

---

> **核心结论**：
>
> **Samsara** 在安全管理深度（评分→事件→辅导→效果追踪完整闭环）、诊断数据精度（ECU级故障码/仪表灯/排放监测）、法规合规（ELD/IFTA/Tachograph）和设备运维（Gateway/Camera/Sensor 健康监控）方面具有系统性优势，共 48 份报表形成了"数据采集→安全分析→合规保障→维护预测→设备健康"的完整闭环。
>
> **Ofstar** 在运营管理全链路（排班→调度→考勤→财务结算→评价→审批的完整业务闭环）和本地化业务适配（冷链温控、智能计价、趟数统计、中国合规、AI自然语言助手）方面更具优势，面向"怎么管好车队日常运营"的需求更加完整。
>
> 两者差异的本质是 **"安全合规驱动"（Samsara，以设备遥测数据为核心）** vs **"运营效率驱动"（Ofstar，以业务流程为核心）** 两种产品哲学的体现。如果 Ofstar 要对标 Samsara，优先补齐的是 P0 的 6 项安全管理闭环能力；如果 Samsara 要对标 Ofstar，优先补齐的是排班/考勤/财务三大运营模块。
