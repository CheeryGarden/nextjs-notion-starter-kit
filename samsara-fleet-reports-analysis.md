# Samsara 车队报表完整分析（8类 48份报表）

> 链接：`https://cloud.samsara.com/o/7007185/fleet/reports/index`
>
> 组织 ID：7007185 | 平台：Samsara Cloud Fleet Management
>
> 以下内容基于 Samsara 官方帮助中心（kb.samsara.com）、开发者 API 文档（developers.samsara.com）及产品页面的综合分析整理。

---

## 数据采集硬件与数据源总览

| 数据源 | 采集设备/方式 | 提供的数据类型 | 更新频率 |
|---|---|---|---|
| **Vehicle Gateway (VG34/VG54)** | OBD-II 接口车载网关 | ECU 诊断（车速、RPM、里程表、油耗、冷却液温度、DEF液位、故障码）、引擎状态、加速度计（G力）、GPS定位、电池电压 | 实时（5s GPS / 状态变化触发） |
| **AI Dash Cam (CM31/CM32)** | 前置/双向行车记录仪 | AI视频分析（分心驾驶、跟车距离、滚动停车、碰撞预警、手机使用）、事件视频录像 | 事件触发即时 |
| **Asset Gateway (AG46/AG53)** | 资产追踪网关 | 拖车/设备位置、使用状态、门开关、温度 | 5min–15min |
| **Samsara Driver App (ELD)** | 驾驶员手机 App | HOS 状态（Driving/On Duty/Off Duty/Sleeper Berth）、DVIR检查、文档表单、电子签名 | 实时（驾驶员操作触发） |
| **辅助输入端口 (AUX 1-10)** | 车载网关硬接线 | PTO 状态、灯光信号、附加传感器 | 状态变化即时 |
| **外部集成** | 油卡（WEX/Fleetcor）/ CSV | 燃油采购记录 | 批量导入 |
| **道路限速数据库** | 第三方数据 | 道路限速参考值 | 持续更新 |
| **EPA 排放因子** | 美国环保署公开数据 | 碳排放估算系数 | 年度更新 |

---

## 第一类：安全类报表（Safety Reports）— 9份

---

### 报表 1：Safety Inbox（安全收件箱）

**用途**：集中审查所有安全事件，包含行车记录仪视频回放，支持辅导分派工作流

**数据源**：Vehicle Gateway 加速度计 + AI Dash Cam + GPS

| 字段名 | 类型 | 说明 | 数据来源 |
|---|---|---|---|
| Event ID | string | 事件唯一标识 | 系统生成 |
| Event Time | datetime | 事件发生时间 (ISO 8601) | 网关时钟 |
| Behavior Label | string | 行为标签（Harsh Braking / Mobile Usage / Distracted Driving 等） | 加速度计 / AI 行车记录仪 |
| Driver Name / ID | string | 驾驶员姓名及ID | 驾驶员分配 / NFC / QR |
| Vehicle Name / ID | string | 车辆名称及ID | 车辆配置 |
| Location (Lat/Lng) | float | 事件经纬度 | GPS 定位 |
| Coaching State | enum | 辅导状态：Needs Review / Needs Coaching / Needs Recognition / Dismissed / Archived | 安全管理工作流 |
| Assigned Coach | string | 分配的辅导员 | 管理员分配 |
| Max Acceleration (G-Force) | float | 最大加速度G值 | 加速度计 |
| Forward Video URL | url | 前向行车记录仪视频下载链接 | AI Dash Cam 前置摄像头 |
| Inward Video URL | url | 车内行车记录仪视频下载链接 | AI Dash Cam 车内摄像头 |
| Vehicle Speed | float | 事件时车速 | ECU (优先) / GPS |
| Speed Limit | int | 事件位置道路限速 | 道路限速数据库 |

**筛选条件**：日期范围、标签(Tags)、驾驶员、车辆、行为类型、辅导状态

**API 端点**：`GET /fleet/safety-events`

---

### 报表 2：Safety Score / Scorecards（安全评分 / 记分卡）

**用途**：按驾驶员或车辆显示综合安全评分（0-100），通过颜色分级标识安全水平

**数据源**：Vehicle Gateway 加速度计 + AI Dash Cam + GPS + OBD

| 字段名 | 类型 | 说明 | 数据来源 |
|---|---|---|---|
| Driver / Vehicle | string | 评分对象 | 配置 |
| Safety Score | int (0-100) | 综合安全评分 = 100 - Σ(各行为扣分) | 多事件加权计算 |
| Score Band | enum | 评分等级：Great(90-100) / Average(80-89) / Poor(0-79) | 评分映射 |
| Harsh Acceleration Count | int | 急加速次数 | 加速度计 G力 |
| Harsh Braking Count | int | 急刹车次数 | 加速度计 G力 |
| Harsh Turning Count | int | 急转弯次数 | 加速度计 G力 |
| Crash Count | int | 碰撞事件次数 | 加速度计高G值触发 |
| Speeding Duration (ms) | int | 超速总时长 | ECU车速 vs 道路限速 |
| Distracted Driving Events | int | 分心驾驶事件数 | AI Dash Cam 图像识别 |
| Mobile Usage Events | int | 手机使用事件数 | AI Dash Cam |
| Unsafe Following Distance Events | int | 跟车距离不安全次数 | AI Dash Cam |
| Rolling Stop Events | int | 滚动停车事件数 | AI Dash Cam |
| Total Distance (m) | float | 总行驶里程 | OBD / GPS |
| Total Drive Time (ms) | int | 总驾驶时间 | 引擎状态 |
| Score Impact per Category | float | 各行为类别扣分明细 | 事件数 × 权重 / 里程 |

**评分公式**：`Safety Score = 100 - Σ(Time/Events × Weight / Total Driving Time or Distance × 100)`

**API 端点**：`GET /v1/fleet/drivers/{driverId}/safety/score` | `GET /v1/fleet/vehicles/{vehicleId}/safety/score`

---

### 报表 3：Harsh Event Reports（急操作事件报告）

**用途**：详细列出所有急加速、急刹车、急转弯、碰撞事件

**数据源**：Vehicle Gateway 加速度计 + GPS

| 字段名 | 类型 | 说明 | 数据来源 |
|---|---|---|---|
| Event ID | string | 事件唯一标识 | 系统生成 |
| Event Time | datetime | 事件时间戳 | 网关时钟 |
| Event Type | enum | 事件类型：Harsh Acceleration / Harsh Braking / Harsh Turn / Crash | 加速度计分类 |
| Max G-Force | float | 最大G值 | 加速度计峰值 |
| Driver Name / ID | string | 驾驶员 | 驾驶员分配 |
| Vehicle Name / ID | string | 车辆 | 车辆配置 |
| Location (Lat/Lng) | float | 事件经纬度 | GPS |
| Address | string | 反向地理编码地址 | GPS → 地理编码 |
| Speed at Event (mph) | float | 事件时车速 | ECU / GPS |
| Heading (degrees) | float | 行驶方向角 | GPS |
| Video Available | boolean | 是否有关联视频 | Dash Cam |
| Coaching State | enum | 辅导处理状态 | 安全工作流 |

**API 端点**：`GET /fleet/safety-events`（按 behaviorLabels 过滤）

---

### 报表 4：Speeding Report（超速报告）

**用途**：按驾驶员或车辆汇总超速事件，按严重程度分级

**数据源**：ECU 车速 / GPS 车速 + 道路限速数据库

| 字段名 | 类型 | 说明 | 数据来源 |
|---|---|---|---|
| Driver / Vehicle | string | 超速对象 | 配置 / 分配 |
| Start Time | datetime | 超速开始时间 | ECU / GPS 时间戳 |
| End Time | datetime | 超速结束时间 | ECU / GPS 时间戳 |
| Duration (s) | int | 超速持续时长 | 起止时间差 |
| Vehicle Speed (mph) | float | 实际车速 | ECU（优先）/ GPS |
| Posted Speed Limit (mph) | int | 道路限速 | 道路限速数据库 |
| Speed Over Limit (mph) | float | 超出限速值 | 实际速度 - 限速 |
| Severity Level | enum | 严重程度分级（可配置阈值，如 1-10mph / 10-20mph / 20+ mph） | 速度差值映射 |
| Location (Lat/Lng) | float | 超速发生位置 | GPS |
| Address | string | 地址 | GPS → 地理编码 |
| Distance During Speeding (m) | float | 超速期间行驶距离 | GPS 距离计算 |

**配置**：严重程度阈值可自定义；In-Cab 告警在超速超过可配置时长（默认60s，范围20-180s）后触发

---

### 报表 5：Coaching Effectiveness Report（辅导效果报告）

**用途**：评估驾驶安全辅导项目的效果，追踪行为改善趋势

**数据源**：安全事件数据 + 辅导会话记录 + 里程数据

| 字段名 | 类型 | 说明 | 数据来源 |
|---|---|---|---|
| Time Period (Week) | date range | 统计时间段（按周分组） | 系统 |
| Driver / Vehicle / Tag | string | 分析维度 | 配置 |
| Repeat Behavior Rate | float | 重复行为率（每1,000英里） | 安全事件 ÷ 里程 |
| Total Behavior Rate | float | 总行为率（每1,000英里） | 安全事件 ÷ 里程 |
| Repeat Behaviors Count | int | 重复行为总次数（45天窗口内） | 安全事件匹配 |
| Total Behaviors Count | int | 总行为次数 | 安全事件计数 |
| Coaching Sessions Count | int | 辅导会话总数 | 辅导工作流 |
| Drivers Coached Count | int | 已辅导驾驶员人数 | 辅导工作流 |
| Repeat Risk Factors | grouped | 重复风险因素按行为类型分类（如 Distracted Driving / Speeding） | 事件标签分组 |

**重复行为定义**：同一驾驶员在45天内重复出现的相同行为类别

---

### 报表 6：Fleet Benchmarks Report（车队基准对比报告）

**用途**：将自己车队的安全和效率指标与 Samsara 平台上同行匿名数据进行对比

**数据源**：本车队安全/效率数据 + Samsara 平台匿名聚合数据

| 字段名 | 类型 | 说明 | 数据来源 |
|---|---|---|---|
| Your Fleet Safety Score | int | 本车队平均安全评分 | 安全评分聚合 |
| Peer Benchmark Safety Score | int | 同行基准安全评分 | 平台匿名聚合 |
| Harsh Event Rate (per M miles) | float | 急操作事件率（每百万英里） | 事件数 ÷ 里程 |
| Peer Harsh Event Rate | float | 同行急操作事件率 | 平台聚合 |
| Fuel Efficiency (MPG) | float | 本车队平均燃油效率 | 燃油报告数据 |
| Peer Fuel Efficiency | float | 同行平均燃油效率 | 平台聚合 |
| Crash Rate | float | 碰撞率 | 碰撞事件 ÷ 里程 |
| Improvement Trend | float | 安全改善趋势 | 时间序列比较 |

---

### 报表 7：In-Cab Nudges Report（车内告警/提醒报告）

**用途**：统计车内音频提醒触发次数及驾驶员响应情况

**数据源**：AI Dash Cam + Vehicle Gateway + 车内扬声器反馈

| 字段名 | 类型 | 说明 | 数据来源 |
|---|---|---|---|
| Driver / Vehicle | string | 统计对象 | 配置 / 分配 |
| Alert Type | enum | 告警类型 | 触发来源 |
| — Harsh Event Detected | | "急操作事件检测" | 加速度计 |
| — Reduce Speed | | "减速"超速语音告警 | ECU vs 限速 |
| — Seatbelt Unbuckled | | "安全带未系" | 车载传感器 |
| — Distracted Driving | | 分心驾驶提醒 | AI Dash Cam |
| — Following Distance | | 跟车距离过近提醒 | AI Dash Cam |
| Alert Count | int | 告警触发总次数 | 事件计数 |
| Alert Format | enum | 告警格式：Tone（提示音）/ Voice（语音） | 车队配置 |
| Speed Threshold | int | 超速告警速度阈值 | 车队配置 |
| Duration Threshold (s) | int | 触发最小持续时长（超速默认60s，跟车默认30s） | 车队配置 |
| Driver Response | enum | 驾驶员响应（减速/未响应等） | 后续速度变化分析 |

---

### 报表 8：Safety Risk Factor Reports（安全风险因素报告）

**用途**：按风险因素分类分析安全事件分布，识别主要危险行为

**数据源**：安全事件聚合数据 + 里程数据

| 字段名 | 类型 | 说明 | 数据来源 |
|---|---|---|---|
| Risk Factor Category | enum | 风险类别 | 事件行为标签 |
| — Harsh Acceleration | | 急加速 | 加速度计 |
| — Harsh Braking | | 急刹车 | 加速度计 |
| — Harsh Turning | | 急转弯 | 加速度计 |
| — Speeding | | 超速 | ECU vs 限速 |
| — Distracted Driving | | 分心驾驶 | AI Dash Cam |
| — Mobile Usage | | 手机使用 | AI Dash Cam |
| — Unsafe Following Distance | | 跟车过近 | AI Dash Cam |
| — Rolling Stop | | 滚动停车 | AI Dash Cam |
| — Crash | | 碰撞 | 加速度计高G值 |
| Event Count | int | 各类别事件数量 | 安全事件计数 |
| Rate per 1,000 Miles | float | 每千英里事件率 | 事件数 ÷ 里程 |
| Rate per 1M Miles | float | 每百万英里事件率 | 事件数 ÷ 里程 |
| Trend (vs Prior Period) | float | 与上期对比变化趋势 | 时间序列 |
| Shift Distribution | grouped | 按班次时段分布（班次开始/中间/结束） | 时间戳分析 |

---

### 报表 9：Event Resolution Report（事件处理报告）

**用途**：追踪安全事件的审查处理进度和完成情况

**数据源**：Safety Inbox 工作流状态数据

| 字段名 | 类型 | 说明 | 数据来源 |
|---|---|---|---|
| Total Events | int | 总事件数 | 安全事件计数 |
| Needs Review | int | 待审查事件数 | 工作流状态 |
| Needs Coaching | int | 待辅导事件数 | 工作流状态 |
| Needs Recognition | int | 待表扬事件数 | 工作流状态 |
| Dismissed | int | 已驳回事件数 | 工作流状态 |
| Archived | int | 已归档事件数 | 工作流状态 |
| Resolution Rate (%) | float | 处理完成率 | (已处理 ÷ 总数) × 100 |
| Avg. Resolution Time | duration | 平均处理耗时 | 事件创建到状态变更的时间差 |
| Coach Assignment Rate (%) | float | 辅导事件中已分配辅导员的比例 | 工作流分配状态 |
| Events Without Driver (%) | float | 未分配驾驶员的事件比例 | 驾驶员分配状态 |
| Review Period | date range | 统计时间范围 | 用户选择 |

---

## 第二类：合规类报表（Compliance / HOS / ELD Reports）— 8份

---

### 报表 10：Hours of Service (HOS) Report（工时主报告）

**用途**：实时查看所有驾驶员的 HOS 合规状态和剩余可用时间

**数据源**：Samsara Driver App (ELD) + HOS 规则引擎

| 字段名 | 类型 | 说明 | 数据来源 |
|---|---|---|---|
| Driver Name | string | 驾驶员姓名 | Driver App 登录 |
| Current Duty Status | enum | 当前值勤状态：Driving / On Duty / Off Duty / Sleeper Berth / Personal Conveyance / Yard Move / Disconnected Waiting Time | Driver App 记录 |
| Time in Current Status | duration | 在当前状态的持续时间 | Driver App |
| Vehicle | string | 当前分配车辆 | 驾驶员-车辆分配 |
| Time Until Break | duration | 距下次休息剩余时间 | `timeUntilBreakDurationMs` |
| Drive Remaining | duration | 剩余可驾驶时间 | `driveRemainingDurationMs` |
| Shift Remaining | duration | 剩余轮班时间 | `shiftRemainingDurationMs` |
| Cycle Remaining | duration | 剩余周期时间 | `cycleRemainingDurationMs` |
| Cycle Tomorrow | duration | 明日可用周期时间 | `cycleTomorrowDurationMs` |
| Driving in Violation (Today) | duration | 今日违规驾驶总时长 | HOS 规则计算 |
| Cycle Start Time | datetime | 当前周期起始时间 | `cycleStartedAtTime` |

**筛选条件**：标签、值勤状态、活跃驾驶员

**API 端点**：`GET /fleet/hos/clocks`

---

### 报表 11：HOS Violations Report（工时违规报告）

**用途**：列出所有驾驶员工时违规记录，支持定期自动发送

**数据源**：ELD 数据 + HOS 法规规则引擎

| 字段名 | 类型 | 说明 | 数据来源 |
|---|---|---|---|
| Driver Name / ID | string | 驾驶员 | Driver App |
| Violation Start Time | datetime | 违规开始时间 | HOS 规则引擎 |
| Violation End Time | datetime | 违规结束时间 | HOS 规则引擎 |
| Violation Duration | duration | 违规持续时长 | 起止时间差 |
| Violation Type | enum | 违规类型（18+种） | HOS 规则引擎 |
| Vehicle | string | 关联车辆 | 驾驶员-车辆分配 |

**违规类型完整列表**：
- `californiaMealbreakMissed` — 加州误餐
- `cycleHoursOn` — 周期工时超限
- `cycleOffHoursAfterOnDutyHours` — 周期休息不足
- `dailyDrivingHours` — 日驾驶时间超限
- `dailyOnDutyHours` — 日值勤时间超限
- `mandatory24HoursOffDuty` — 强制24小时休息未达标
- `restbreakMissed` — 休息时间缺失
- `shiftDrivingHours` — 轮班驾驶超限
- `shiftOnDutyHours` — 轮班值勤超限
- 以及其他区域性法规违规类型

**API 端点**：`GET /fleet/hos/violations`

---

### 报表 12：HOS Daily Logs（每日值勤日志）

**用途**：汇总每位驾驶员的每日 HOS 活动详情，用于合规审计

**数据源**：Samsara Driver App (ELD) + OBD 里程表

| 字段名 | 类型 | 说明 | 数据来源 |
|---|---|---|---|
| driver.id / driver.name | string | 驾驶员 | Driver App 登录 |
| startTime | datetime | 日志日起始时间（按 `eldDayStartHour` 配置） | Driver App |
| dutyStatusDurations | object | 各值勤状态累计时长 | Driver App |
| — activeDurationMs | int | 活跃状态总时长（毫秒） | 状态记录 |
| — onDutyDurationMs | int | 值勤总时长 | 状态记录 |
| — drivingDurationMs | int | 驾驶总时长 | 状态记录 |
| — offDutyDurationMs | int | 休息总时长 | 状态记录 |
| — sleeperBerthDurationMs | int | 卧铺休息时长 | 状态记录 |
| driveDistanceMeters | float | 驾驶里程 | OBD/GPS |
| personalConveyanceDistanceMeters | float | 个人出行里程 | Driver App 标记 |
| yardMoveDistanceMeters | float | 场内移动里程 | Driver App 标记 |
| certificationStatus | enum | 日志认证状态（已认证 / 未认证） | 驾驶员签名确认 |
| vehicle.id / name / vin / licensePlate | string | 车辆信息（通过 expand=vehicle 展开） | 车辆配置 |
| logMetaData.homeTerminalName | string | 归属终端名称 | 组织配置 |
| logMetaData.homeTerminalFormattedAddress | string | 归属终端地址 | 组织配置 |
| logMetaData.carrierName | string | 承运人名称 | 组织配置 |
| logMetaData.carrierUsDotNumber | string | 美国 DOT 编号 | 组织配置 |
| logMetaData.isUsShortHaulActive | boolean | 是否启用美国短途豁免 | Driver App 配置 |
| logMetaData.bigDayClaimed | boolean | 是否申请大日豁免 | Driver App |
| logMetaData.adverseDrivingClaimed | boolean | 是否申请恶劣天气豁免 | Driver App |
| Trailer Assignments | array | 挂车分配 | Driver App |
| Shipping Doc Assignments | array | 运输单分配 | Driver App |

**API 端点**：`GET /fleet/hos/daily-logs`

---

### 报表 13：Recap Hours Report（剩余工时报告）

**用途**：预测未来7天驾驶员可恢复的工时，辅助调度决策

**数据源**：ELD / HOS 规则引擎

| 字段名 | 类型 | 说明 | 数据来源 |
|---|---|---|---|
| Driver Name | string | 驾驶员名称（可点击查看详情） | Driver App |
| Duty Status | enum | 当前值勤状态 | Driver App |
| Cycle Today | duration | 当天剩余周期时间（如 10:32） | HOS 8天/14天周期计算 |
| Cycle Tomorrow | duration + delta | 明天可用周期时间 + 恢复时数（如 22:55 +12:23） | 旧工时退出周期 |
| Day +2 through Day +7 | duration delta | 后续各天恢复的工时数（如 +9:18） | 周期窗口滑动计算 |

**筛选条件**：标签、值勤状态、活跃驾驶员、车辆分配

---

### 报表 14：DVIR — Driver Vehicle Inspection Reports（车辆检查报告）

**用途**：管理出车前/收车后车辆检查记录及缺陷修复流程

**数据源**：Samsara Driver App（驾驶员）/ Dashboard（维修工）

| 字段名 | 类型 | 说明 | 数据来源 |
|---|---|---|---|
| id | string | DVIR 唯一标识 | 系统生成 |
| safetyStatus | enum | 安全状态：safe / unsafe | 驾驶员判定 |
| type | enum | 检查类型：preTrip / postTrip / mechanic | 提交流程 |
| startTime | datetime | 检查开始时间 | Driver App |
| endTime | datetime | 检查完成时间 | Driver App |
| odometerMeters | int | 里程表读数（米） | OBD |
| licensePlate | string | 车牌号 | 车辆配置 |
| location | string | 检查位置地址 | GPS 反向地理编码 |
| vehicle.id / vehicle.name | string | 车辆信息 | 车辆配置 |
| authorSignature.signatoryUser | object | 创建者签名（驾驶员/维修工 id+name） | Driver App/Dashboard |
| authorSignature.signedAtTime | datetime | 签名时间 | 签名动作时间 |
| authorSignature.type | enum | 签名人类型：driver / mechanic | 提交方式 |
| secondSignature | object | 维修工解决签名（解决缺陷时） | Dashboard |
| thirdSignature | object | 二次确认签名（确认修复后安全） | Driver App |
| vehicleDefects[] | array | 缺陷列表 | 驾驶员勾选 |
| vehicleDefects[].id | string | 缺陷ID | 系统 |
| vehicleDefects[].defectType | string | 缺陷类型（Battery / Tires / Brakes / Lights 等） | 预定义检查项 |
| vehicleDefects[].isResolved | boolean | 是否已修复 | 维修工确认 |
| vehicleDefects[].resolvedBy | object | 修复人员（id + name + type） | Dashboard 用户 |
| vehicleDefects[].resolvedAtTime | datetime | 修复时间 | 维修工操作时间 |
| vehicleDefects[].mechanicNotesUpdatedAtTime | datetime | 维修备注更新时间 | 维修工输入 |

**API 端点**：`GET /fleet/dvirs/history` | `GET /fleet/defects/history`

---

### 报表 15：ELD Audit / Driver HOS Audit Report（ELD 审计报告）

**用途**：生成符合 FMCSA 要求的 ELD 审计文件，用于路检和DOT审查

**数据源**：ELD 数据 + 驾驶员日志编辑记录

| 字段名 | 类型 | 说明 | 数据来源 |
|---|---|---|---|
| Driver Name / ID | string | 驾驶员 | Driver App |
| Date | date | 审计日期 | ELD |
| Total Hours per Status | grouped | 各值勤状态小时数明细 | HOS 日志 |
| Miles Driven | float | 驾驶里程 | OBD/GPS |
| Locations Driven | array | 驾驶位置记录 | GPS |
| Carrier Information | string | 承运人信息（名称/DOT编号/地址） | 组织配置 |
| Vehicle / Trailer Details | string | 车辆/挂车信息 | 配置 |
| Certification Status | enum | 日志认证状态 | 驾驶员签名 |
| Log Edits History | array | 日志编辑历史记录 | 编辑操作日志 |
| Graphical Log View | visual | 图形化日志视图（含违规标记） | HOS 数据可视化 |
| ELD Output File | file | 符合 FMCSA 标准的 ELD 输出文件 | ELD 数据格式化 |
| Unidentified Driving Segments | array | 未分配驾驶员的驾驶段 | ELD 自动记录 |

---

### 报表 16：Duty Status Summary Report（值勤状态汇总报告）

**用途**：按驾驶员汇总每日各值勤状态的时间分布

**数据源**：Samsara Driver App (ELD)

| 字段名 | 类型 | 说明 | 数据来源 |
|---|---|---|---|
| Driver | string | 驾驶员名称 | Driver App |
| Off Duty | duration (h:mm) | 休息状态时长 | Driver App 状态记录 |
| Sleeper Berth | duration (h:mm) | 卧铺休息时长 | Driver App 状态记录 |
| Driving | duration (h:mm) | 驾驶状态时长 | Driver App 状态记录 |
| On Duty | duration (h:mm) | 值勤状态时长 | Driver App 状态记录 |
| Yard Move | duration (h:mm) | 场内移动时长 | Driver App 标记 |
| Personal Conveyance | duration (h:mm) | 个人出行时长 | Driver App 标记 |

**筛选条件**：日期选择器、标签、驾驶状态（Active/Deactivated/All）、驾驶员搜索

**KB 文档**：`kb.samsara.com/hc/en-us/articles/360020951291-Duty-Status-Summary-Report`

---

### 报表 17：Unassigned HOS / Unassigned Driving Report（未分配工时报告）

**用途**：管理 ELD 记录中未关联驾驶员的驾驶时间段

**数据源**：ELD 自动记录（无驾驶员登录时的驾驶数据）

| 字段名 | 类型 | 说明 | 数据来源 |
|---|---|---|---|
| Vehicle Name / ID | string | 发生未分配驾驶的车辆 | 车辆配置 |
| Segment Start Time | datetime | 未分配驾驶段开始时间 | ELD 自动记录 |
| Segment End Time | datetime | 未分配驾驶段结束时间 | ELD |
| Duration | duration | 未分配驾驶持续时长 | 起止时间差 |
| Distance (miles) | float | 未分配驾驶行驶距离 | OBD/GPS |
| Start Location | string | 起始位置 | GPS |
| End Location | string | 结束位置 | GPS |
| Assignment Status | enum | 分配状态：Unassigned / Pending / Assigned to Driver | 管理员操作 |
| Assigned Driver (if reassigned) | string | 重新分配给的驾驶员 | 管理员操作 |
| Edit Notes | string | 编辑/分配备注 | 管理员输入 |

---

## 第三类：燃油与能源类报表（Fuel & Energy Reports）— 5份

---

### 报表 18：Fuel & Energy Report（燃油能源报告）

**用途**：按车辆或驾驶员显示燃油效率和能源使用情况

**数据源**：Vehicle Gateway ECU 油耗 + OBD 里程表 + GPS + EPA排放因子

| 字段名 | 类型 | 说明 | 数据来源 |
|---|---|---|---|
| Vehicle / Driver | string | 统计对象 | 配置 / 分配 |
| Efficiency (MPG / MPGe) | float | 燃油效率（英里/加仑或电动当量） | ECU油耗 ÷ 里程 |
| Fuel Used (gal / L) | float | 耗油量 | ECU `fuelConsumedMilliliters` |
| Energy Used (kWh) | float | 电能消耗（含再生能量扣减，PHEV/EV） | 车载电能监测 |
| Distance (mi / km) | float | 行驶里程（标准化距离） | OBD里程表优先，GPS回退 |
| Idle Time (%) | float | 怠速时间百分比 | `engineStates` |
| Total Engine Run Time | duration | 总引擎运行时间 | `obdEngineSeconds` / `syntheticEngineSeconds` |
| Est. Carbon Emissions (kg CO₂) | float | 预估碳排放量 | EPA GHG排放因子 × 油耗 |
| Est. Cost ($) | float | 预估燃油成本 | 油耗 × 全国平均燃油价格 |
| % Driving Electric | float | 电驱行驶占比（仅 PHEV） | 动力模式监测 |
| Fuel Type | enum | 燃料类型 | 车辆配置 |
| Engine Type | string | 引擎类型 | 车辆配置 |

**筛选条件**：日期范围、车辆属性、标签、燃料类型（fuel/hybrid/electric）、引擎类型

**API 端点**：`GET /fleet/reports/vehicles/fuel-energy` | `GET /fleet/reports/drivers/fuel-energy`

---

### 报表 19：Fuel Purchases Report（燃油采购报告）

**用途**：追踪和管理车队燃油采购记录

**数据源**：油卡集成（WEX / Fleetcor）/ CSV 手动导入

| 字段名 | 类型 | 说明 | 数据来源 |
|---|---|---|---|
| Vehicle Name / ID | string | 加油车辆 | 油卡记录 / CSV |
| Driver Name | string | 加油驾驶员 | 油卡记录 |
| Purchase Date | datetime | 加油日期时间 | 油卡 / CSV |
| Fuel Type | enum | 燃料类型（Diesel / Gasoline / E85 等） | 油卡 / CSV |
| Quantity (gal / L) | float | 加油量 | 油卡 / CSV |
| Unit Price | float | 单价 | 油卡 / CSV |
| Total Cost ($) | float | 加油总金额 | 油卡 / CSV |
| Station / Location | string | 加油站名称/位置 | 油卡 / CSV |
| Jurisdiction (State/Province) | string | 所在辖区（用于 IFTA 关联） | 加油站位置 |
| Verification Status | enum | 验证状态（Verified / Unverified） | 系统校验 |
| Receipt / Invoice | attachment | 发票/收据附件 | 手动上传 |

---

### 报表 20：IFTA Report（国际燃油税报告）

**用途**：生成符合 IFTA 合规要求的跨辖区里程和燃油报告

**数据源**：Vehicle Gateway GPS + OBD 里程表 + 燃油采购记录

**按辖区汇总视图字段**：

| 字段名 | 类型 | 说明 | 数据来源 |
|---|---|---|---|
| Jurisdiction | string | 行政辖区（美国48州 + 加拿大各省） | GPS 轨迹映射 |
| Fuel Type | enum | 燃料类型（16种：Diesel/Gasoline/CNG/LNG/Electricity等） | 车辆配置 / 油卡 |
| Taxable Miles / km | float | 公共道路应税里程 | 标准化距离 |
| Total Miles / km | float | 辖区内总里程 | 标准化距离 |
| Tax Paid Gallons / Litres | float | 已纳税燃油量 | 油卡/CSV导入 |

**IFTA 明细 CSV 字段**：

| 字段名 | 类型 | 说明 | 数据来源 |
|---|---|---|---|
| device_id | int | 车辆 ID | 系统 |
| jurisdiction | string | 段落所在州/省 | GPS 辖区映射 |
| distance_meters | float | 段落行驶距离（米） | 标准化距离 |
| start_ms / end_ms | int | 段落起止时间戳（毫秒） | 网关时钟 |
| start_odo_meters / end_odo_meters | int | 起止里程表读数（米） | OBD |
| start_lat / start_lng | float | 起点经纬度 | GPS |
| end_lat / end_lng | float | 终点经纬度 | GPS |
| start_city / end_city | string | 起止城市 | GPS → 地理编码 |
| toll | boolean | 是否收费路段 | 道路数据 |
| leg_end | boolean | 是否行程末段 | 行程分段逻辑 |

**API 端点**：`GET /fleet/reports/ifta/vehicle` | `GET /fleet/reports/ifta/jurisdiction`

---

### 报表 21：Idling Report（怠速报告）

**用途**：列出所有车辆怠速事件，含持续时长和位置

**数据源**：Vehicle Gateway 引擎状态传感器（`engineStates`）+ GPS

| 字段名 | 类型 | 说明 | 数据来源 |
|---|---|---|---|
| Vehicle Name / ID | string | 怠速车辆 | 车辆配置 |
| Driver Name | string | 当时驾驶员 | 驾驶员分配 |
| Idle Start Time | datetime | 怠速开始时间 | `engineStates = Idle` 状态变化 |
| Idle End Time | datetime | 怠速结束时间 | 状态变回 On / Off |
| Idle Duration | duration | 怠速持续时间 | 起止时间差 |
| Location (Lat/Lng) | float | 怠速位置经纬度 | GPS |
| Address | string | 反向地理编码地址 | GPS → 地理编码 |
| PTO Active | boolean | 是否启用动力输出装置 | AUX 辅助输入端口 |

**筛选条件**：车辆ID、标签、PTO状态（true/false）、最小怠速时长（分钟）

**API 端点**：`GET /fleet/reports/vehicle/idling`

---

### 报表 22：Fuel & Energy Benchmarks Report（燃油效率基准对比报告）

**用途**：将车队车辆的燃油效率与 Samsara 平台同品牌/同车型的匿名同行数据进行对比

**数据源**：ECU 油耗 + OBD 里程 + Samsara 平台 20,000+ 客户匿名聚合数据

| 字段名 | 类型 | 说明 | 数据来源 |
|---|---|---|---|
| Vehicle Name / ID | string | 车辆 | 车辆配置 |
| Make / Model / Year (MMY) | string | 品牌/车型/年份 | 车辆配置 |
| Your Fleet Avg MPG | float | 本车队该车型平均MPG | ECU 油耗 ÷ 里程 |
| Peer Benchmark Avg MPG | float | 同行同车型平均MPG | 平台匿名聚合 |
| Efficiency Gap (%) | float | 效率差距百分比 | 计算字段 |
| Least Efficient Vehicles | ranked list | 效率最低的车辆排名 | MPG 排序 |
| Average MPG by MMY | grouped | 按品牌/车型分组的平均MPG | 聚合计算 |

**使用场景**：设定燃油效率目标、识别低效车辆、指导车辆采购决策

---

## 第四类：活动与行程类报表（Activity & Trip Reports）— 5份

---

### 报表 23：Activity Report（活动报告）

**用途**：按车辆/驾驶员汇总每日活动概况

**数据源**：Trips 行程数据 + 引擎状态 + GPS + OBD

| 字段名 | 类型 | 说明 | 数据来源 |
|---|---|---|---|
| Vehicle / Driver | string | 统计对象 | 配置 / 分配 |
| Date | date | 统计日期 | 日历 |
| Distance (mi / km) | float | 行驶里程（基于 Trips 数据计算，可能略低于OBD） | GPS / OBD 行程片段 |
| Drive Time | duration | 行驶时间 | `engineStates = On` + 移动检测 |
| Idle Time | duration | 怠速时间 | `engineStates = Idle` |
| Stop Time | duration | 停车时间 | 引擎关闭期间 |
| Number of Trips | int | 行程次数 | Trip 分段计数 |
| Engine Hours | duration | 引擎运行小时数 | OBD / Synthetic |
| Max Speed (mph) | float | 最高车速 | ECU / GPS |
| Fuel Used (gal) | float | 耗油量 | ECU |

**注意**：Distance 字段基于 Trips 片段拼接，可能略低于 OBD 里程表读数。如需更精确里程，建议通过 `obdOdometerMeters` API 获取

---

### 报表 24：Trip History Report（行程历史报告）

**用途**：详细列出每次行程的起止位置、里程、时长等信息

**数据源**：GPS 轨迹 + 引擎状态变化 + OBD 里程表

| 字段名 | 类型 | 说明 | 数据来源 |
|---|---|---|---|
| Vehicle / Driver | string | 行程车辆/驾驶员 | 配置 / 分配 |
| Trip Start Time | datetime | 行程开始时间 | 引擎启动 + 移动检测 |
| Trip End Time | datetime | 行程结束时间 | 引擎关闭 / 长时间静止 |
| Start Location / Address | string | 起点位置/地址 | GPS + 反向地理编码 |
| End Location / Address | string | 终点位置/地址 | GPS + 反向地理编码 |
| Distance (mi / km) | float | 行程距离 | OBD 里程 / GPS 距离 |
| Duration | duration | 行程总时长 | 起止时间差 |
| Drive Time | duration | 行驶时间（移动中） | GPS 速度 > 0 的时段 |
| Idle Duration | duration | 行程中怠速时间 | 引擎On但未移动 |
| Start Odometer (mi) | float | 起始里程表 | OBD |
| End Odometer (mi) | float | 结束里程表 | OBD |
| Max Speed (mph) | float | 行程最高速度 | ECU / GPS |
| Average Speed (mph) | float | 行程平均速度 | 距离 ÷ 行驶时间 |

---

### 报表 25：Geofence Activity Report（地理围栏活动报告）

**用途**：追踪车辆进出地理围栏区域的时间和停留时长

**数据源**：GPS 定位 + 地理围栏配置

| 字段名 | 类型 | 说明 | 数据来源 |
|---|---|---|---|
| Geofence / Address Name | string | 地理围栏名称 | 管理员配置 |
| Geofence ID | string | 围栏标识 | 系统 |
| Geofence Type | enum | 围栏类型：Circle（圆形）/ Polygon（多边形） | 管理员配置 |
| Formatted Address | string | 完整街道地址 | 配置 / 地理编码 |
| Vehicle Name / ID | string | 进出围栏的车辆 | 车辆配置 |
| Vehicle VIN / License Plate | string | 车辆VIN/车牌 | 车辆配置 |
| Driver Name | string | 驾驶员 | 驾驶员分配 |
| Entry Time | datetime | 进入围栏时间 | GPS 位置判定 |
| Exit Time | datetime | 离开围栏时间 | GPS 位置判定 |
| Dwell Duration | duration | 围栏内停留时长 | 出入时间差 |
| Entry/Exit Event Type | enum | 事件类型：GeofenceEntry / GeofenceExit | GPS → 围栏边界判定 |
| Circle Center (Lat/Lng) | float | 圆形围栏中心经纬度 | 围栏配置 |
| Circle Radius (m) | int | 圆形围栏半径 | 围栏配置 |
| Polygon Vertices | array | 多边形围栏顶点列表 | 围栏配置 |

**Webhook 事件**：支持 GeofenceEntry / GeofenceExit 实时推送

---

### 报表 26：After Hours Report（非工作时间使用报告）

**用途**：追踪车辆在指定工作时间以外的使用情况

**数据源**：GPS + 引擎状态 + 工时策略配置

| 字段名 | 类型 | 说明 | 数据来源 |
|---|---|---|---|
| Vehicle Name / ID | string | 非工时使用的车辆 | 车辆配置 |
| Driver Name | string | 驾驶员 | 驾驶员分配 |
| Event Date | date | 事件日期 | 日历 |
| Event Start Time | datetime | 非工时使用开始时间 | 引擎启动 + 移动检测 |
| Event End Time | datetime | 非工时使用结束时间 | 引擎关闭 / 静止 |
| Duration | duration | 非工时使用时长 | 起止时间差 |
| Distance (mi) | float | 非工时行驶里程 | GPS / OBD |
| Start Location | string | 起始位置 | GPS + 地理编码 |
| End Location | string | 结束位置 | GPS + 地理编码 |
| Work Hours Policy | string | 适用的工时策略名称 | 管理员配置 |
| Policy Time Window | time range | 策略定义的工作时间范围 | 管理员配置 |

---

### 报表 27：Driver Assignment Report（驾驶员分配报告）

**用途**：追踪驾驶员与车辆的分配关系及变更历史

**数据源**：驾驶员分配系统（NFC/QR/静态分配/Driver App）

| 字段名 | 类型 | 说明 | 数据来源 |
|---|---|---|---|
| Driver Name / ID | string | 驾驶员 | 驾驶员配置 |
| Vehicle Name / ID | string | 分配的车辆 | 车辆配置 |
| Assignment Start Time | datetime | 分配开始时间 | 分配系统记录 |
| Assignment End Time | datetime | 分配结束时间 | 分配系统记录 |
| Assignment Method | enum | 分配方式：NFC Card / QR Code / Static / Driver App | 分配途径 |
| Hours Driven | duration | 分配期间驾驶时长 | 引擎状态 |
| Distance Driven (mi) | float | 分配期间行驶里程 | OBD / GPS |
| Unassigned Periods | array | 车辆无驾驶员分配的时段 | 分配间隙 |

---

## 第五类：资产利用率与效率类报表（Utilization & Efficiency Reports）— 3份

---

### 报表 28：Utilization Report（资产利用率报告）

**用途**：衡量资产（车辆/拖车/设备）的使用率，支持车队规模优化决策

**数据源**：Vehicle/Asset Gateway 引擎状态 + GPS

| 字段名 | 类型 | 说明 | 数据来源 |
|---|---|---|---|
| Asset Name / ID | string | 资产名称 | 资产配置 |
| Asset Type / Tag | string | 资产类型标签分组（干货拖车/冷藏车/平板/发电机等） | 标签系统 |
| Date Range | date range | 统计日期范围 | 用户选择 |
| Usage Hours | duration | 使用小时数 | 引擎运行时间 |
| Work Day Hours | int | 工作日标准小时数（默认12h） | 管理员配置 |
| Utilization % (by Hours) | float | 利用率百分比（使用时间 ÷ 工作日时间） | 计算字段 |
| Distance Traveled (mi / km) | float | 行驶距离 | GPS / OBD |
| Utilization % (by Distance) | float | 按距离计算的利用率 | 计算字段 |
| Region / Location (Tag) | string | 资产所属区域 | 标签 |

**支持资产类型**：车辆、干货拖车、冷藏拖车、平板车、底盘、发电机、灯塔、施工设备、叉车

**使用场景**：车队规模优化（Right-sizing）、区域间资产调配、利用率趋势分析

---

### 报表 29：Driver Efficiency Report（驾驶员效率报告）

**用途**：按驾驶员汇总燃油效率和驾驶效率指标

**数据源**：ECU 油耗 + OBD 里程 + 引擎状态

| 字段名 | 类型 | 说明 | 数据来源 |
|---|---|---|---|
| Driver Name / ID | string | 驾驶员 | 驾驶员配置 |
| Driver Tags | array | 驾驶员标签 | 标签系统 |
| Fuel Efficiency (MPG) | float | 燃油效率 | ECU 油耗 ÷ 里程 |
| Total Distance (mi) | float | 总行驶里程 | OBD / GPS |
| Total Fuel Used (gal) | float | 总油耗 | ECU |
| Idle Time | duration | 怠速时间 | 引擎状态 |
| Idle Time % | float | 怠速时间占比 | 怠速时间 ÷ 总引擎时间 |
| Engine Run Time | duration | 引擎运行时间 | OBD / Synthetic |
| Associated Vehicles | array | 时段内关联的车辆列表 | 驾驶员-车辆分配 |
| Est. Fuel Cost ($) | float | 预估燃油成本 | 油耗 × 平均油价 |

**API 端点**：`GET /fleet/driver-efficiency/drivers`

---

### 报表 30：Vehicle Utilization Detail Report（车辆利用率明细报告）

**用途**：按单个车辆维度细化利用率分析

**数据源**：Vehicle Gateway 引擎状态 + GPS + OBD

| 字段名 | 类型 | 说明 | 数据来源 |
|---|---|---|---|
| Vehicle Name / ID | string | 车辆 | 车辆配置 |
| Date | date | 统计日期 | 日历 |
| Engine On Duration | duration | 引擎开启时长 | `engineStates` |
| Driving Duration | duration | 行驶时长（移动中） | GPS速度 > 0 |
| Idle Duration | duration | 怠速时长 | `engineStates = Idle` |
| Off Duration | duration | 引擎关闭时长 | `engineStates = Off` |
| Distance (mi) | float | 行驶距离 | OBD / GPS |
| Number of Trips | int | 行程次数 | 行程分段计数 |
| Utilization % | float | 日利用率 | 使用时间 ÷ 标准工作时间 |
| Location Summary | string | 主要活动位置 | GPS 聚合 |

---

## 第六类：维护类报表（Maintenance Reports）— 6份

---

### 报表 31：Service Logs Report（维修服务日志报告）

**用途**：记录和追踪所有车辆维修服务活动

**数据源**：Dashboard 手动录入 / 预防性维护自动生成 / 外部维修系统集成

| 字段名 | 类型 | 说明 | 数据来源 |
|---|---|---|---|
| Service Date | datetime | 维修日期 | 维修工/管理员录入 |
| Asset / Vehicle Name | string | 维修的资产/车辆 | 车辆配置 |
| Service Type | string | 服务类型（油液更换/轮胎/刹车/PM等） | 手动选择 |
| Logged By | string | 记录人（维修工/管理员） | Dashboard 用户 |
| Maintenance Notes | text | 维修详情说明 | 手动输入 |
| Odometer (mi) | float | 维修时里程表读数 | OBD / 手动 |
| Engine Hours | duration | 维修时引擎运行小时数 | OBD / Synthetic |
| Cost ($) | float | 维修费用 | 手动输入 / AI发票识别 |
| Cost Category | string | 费用类别（Parts / Labor / External Vendor） | 分类选择 |
| Attachments | array | 发票/缺陷照片/文档附件 | 手动上传 |
| Related DVIR | reference | 关联的 DVIR 缺陷报告 | 自动关联 |
| PM Schedule Resolved | boolean | 是否关闭预防性维护项 | 维修工确认 |

---

### 报表 32：Fault Codes Report — OBD-II（乘用车故障码报告）

**用途**：监控和追踪车辆 OBD-II 诊断故障码

**数据源**：Vehicle Gateway ECU → OBD-II 总线

| 字段名 | 类型 | 说明 | 数据来源 |
|---|---|---|---|
| Vehicle Name / ID | string | 故障车辆 | 车辆配置 |
| Time | datetime | 故障码读取时间 | 网关时钟 |
| canBusType | string | CAN 总线类型（如 CANBUS_PASSENGER_15765_11_500） | ECU |
| checkEngineLightIsOn | boolean | 检查引擎灯是否亮起 | ECU |
| confirmedDtcs[] | array | 已确认故障码列表 | ECU 控制模块 |
| confirmedDtcs[].dtcShortCode | string | 故障短码（如 P0087） | ECU |
| confirmedDtcs[].dtcId | int | 故障码数字ID | ECU |
| confirmedDtcs[].dtcDescription | string | 故障描述（如 "Fuel Rail/System Pressure - Too Low Bank 1"） | 故障码数据库 |
| pendingDtcs[] | array | 待定故障码列表（未触发检查灯） | ECU |
| permanentDtcs[] | array | 永久故障码列表（需修复后才消除） | ECU |
| txId | int | 传输器/控制模块ID | ECU |
| ignitionType | enum | 点火类型：spark / compression | ECU |
| milStatus | boolean | 是否触发 MIL（故障指示灯） | ECU |
| monitorStatus | object | 排放监测系统状态（R=Ready/N=NotReady/U=Unsupported） | ECU |
| monitorStatus.notReadyCount | int | 未就绪监测器计数 | ECU |

**API 端点**：`GET /fleet/vehicles/stats?types=faultCodes` | `/stats/history` | `/stats/feed`

---

### 报表 33：Fault Codes Report — J1939（重型车故障码报告）

**用途**：监控重型商用车辆 J1939 标准诊断故障码

**数据源**：Vehicle Gateway ECU → J1939 CAN 总线

| 字段名 | 类型 | 说明 | 数据来源 |
|---|---|---|---|
| Vehicle Name / ID | string | 故障车辆 | 车辆配置 |
| Time | datetime | 故障码读取时间 | 网关时钟 |
| canBusType | string | CAN 总线类型（如 CANBUS_J1939_250） | ECU |
| checkEngineLights.emissionsIsOn | boolean | 排放灯是否亮 | ECU |
| checkEngineLights.protectIsOn | boolean | 保护灯是否亮 | ECU |
| checkEngineLights.stopIsOn | boolean | 停车灯是否亮 | ECU |
| checkEngineLights.warningIsOn | boolean | 警告灯是否亮 | ECU |
| diagnosticTroubleCodes[].spnId | int | SPN 可疑参数编号 | ECU |
| diagnosticTroubleCodes[].spnDescription | string | SPN 描述（如 "Sensor supply voltage 2"） | J1939 数据库 |
| diagnosticTroubleCodes[].fmiId | int | FMI 故障模式标识 | ECU |
| diagnosticTroubleCodes[].fmiDescription | string | FMI 描述（如 "Voltage Below Normal"） | J1939 数据库 |
| diagnosticTroubleCodes[].occurrenceCount | int | 故障出现次数 | ECU 累计 |
| diagnosticTroubleCodes[].milStatus | int | MIL 状态 | ECU |
| diagnosticTroubleCodes[].txId | int | 传输器ID / 源地址 | ECU |
| diagnosticTroubleCodes[].sourceAddressName | string | 源地址名称（如 "Engine #2"） | J1939 数据库 |

---

### 报表 34：Tell Tale Status Report（仪表盘警告灯状态报告）

**用途**：监控车辆仪表盘上的警告指示灯状态

**数据源**：Vehicle Gateway → 车辆仪表总线

| 字段名 | 类型 | 说明 | 数据来源 |
|---|---|---|---|
| Vehicle Name / ID | string | 车辆 | 车辆配置 |
| Time | datetime | 状态读取时间 | 网关时钟 |
| Tell Tale Name | string | 警告灯名称（如 Engine Failure / Engine Oil Level / Transmission Failure / Battery Warning） | 车辆仪表总线 |
| Condition | enum | 严重程度：Yellow（警告）/ Red（严重/停车） | 车辆仪表总线 |

**与 Fault Codes 的区别**：Tell Tale 反映仪表盘警告灯的当前状态，Fault Codes 提供具体的 ECU 诊断故障码

**API 端点**：`GET /fleet/vehicles/stats?types=tellTales` | `/stats/history` | `/stats/feed`

---

### 报表 35：DVIR Defects Report（车辆检查缺陷报告）

**用途**：追踪所有 DVIR 中报告的缺陷及其修复状态

**数据源**：Samsara Driver App DVIR + Dashboard 维修操作

| 字段名 | 类型 | 说明 | 数据来源 |
|---|---|---|---|
| Defect ID | string | 缺陷唯一标识 | 系统 |
| Defect Type | string | 缺陷类型（Battery / Tires / Brakes / Lights 等） | 驾驶员勾选 |
| Vehicle Name / ID | string | 相关车辆 | 车辆配置 |
| Created At Time | datetime | 缺陷创建时间 | Driver App 提交 |
| Created By (Driver) | string | 报告缺陷的驾驶员 | Driver App |
| Is Resolved | boolean | 是否已修复 | 维修工操作 |
| Resolved At Time | datetime | 修复时间 | 维修工确认 |
| Resolved By | object | 修复人员（id + name + type=mechanic） | Dashboard 用户 |
| Mechanic Notes | text | 维修备注 | 维修工输入 |
| Mechanic Notes Updated At | datetime | 备注更新时间 | 系统 |
| Associated DVIR ID | string | 关联的 DVIR 报告ID | 系统关联 |
| Days Open | int | 缺陷未修复天数 | 当前时间 - 创建时间 |

**API 端点**：`GET /fleet/defects/history`

---

### 报表 36：Preventive Maintenance Schedule Report（预防性维护计划报告）

**用途**：基于里程或引擎运行小时数追踪预防性维护计划执行情况

**数据源**：OBD 里程表 + 引擎小时数 + 维护计划配置

| 字段名 | 类型 | 说明 | 数据来源 |
|---|---|---|---|
| Vehicle Name / ID | string | 车辆 | 车辆配置 |
| PM Item Name | string | 维护项名称（如 Oil Change / Tire Rotation） | 管理员配置 |
| Trigger Type | enum | 触发类型：Odometer（里程）/ Engine Hours（引擎小时） | 配置 |
| Trigger Interval | int | 触发间隔（如 every 5,000 mi / every 500 hrs） | 配置 |
| Current Odometer (mi) | float | 当前里程表 | `obdOdometerMeters` / `gpsOdometerMeters` |
| Current Engine Hours | float | 当前引擎小时数 | `obdEngineSeconds` / `syntheticEngineSeconds` |
| Last Service Odometer | float | 上次维护时里程 | 维护记录 |
| Last Service Engine Hours | float | 上次维护时引擎小时 | 维护记录 |
| Next Due Odometer | float | 下次应维护里程 | 计算字段 |
| Next Due Engine Hours | float | 下次应维护引擎小时 | 计算字段 |
| Status | enum | 状态：OK / Due Soon / Overdue | 阈值判定 |
| Last Service Date | date | 上次维护日期 | 维护记录 |

---

## 第七类：设备健康类报表（Device Health Reports）— 3份

---

### 报表 37：Gateway Health Report（网关设备健康报告）

**用途**：监控车辆网关设备的在线状态、连接状态和健康状况

**数据源**：Vehicle Gateway / Asset Gateway 设备遥测

| 字段名 | 类型 | 说明 | 数据来源 |
|---|---|---|---|
| Vehicle / Asset Name | string | 关联的车辆或资产 | 配置 |
| Gateway Serial | string | 网关设备序列号 | 设备配置 |
| Gateway Model | string | 网关型号（VG34/VG54/AG46等） | 设备配置 |
| Health Status | enum | 健康状态：Healthy / Needs Attention / Not Installed | 综合判定 |
| Last Known Location | string | 设备最后已知位置 | GPS |
| Last Connected Time | datetime | 设备最后连接时间 | 设备心跳 |
| Cell Connectivity Status | enum | 蜂窝网络连接状态 | 通信模块 |
| Vehicle Battery Level | float | 车辆电池电压 | `batteryMilliVolts` |
| Gateway Battery Level | float | 网关设备电池电压 | 设备遥测 |
| Recommended Action | string | 建议的修复措施 | 系统诊断 |

**KB 文档**：`kb.samsara.com/hc/en-us/articles/33583268473997-Device-Health-Reports`

---

### 报表 38：Camera Health Report（摄像头健康报告）

**用途**：监控 AI Dash Cam 的在线状态、连接状态和录制健康

**数据源**：AI Dash Cam (CM31/CM32) 设备遥测

| 字段名 | 类型 | 说明 | 数据来源 |
|---|---|---|---|
| Vehicle Name | string | 关联车辆 | 车辆配置 |
| Camera Serial | string | 摄像头序列号 | 设备配置 |
| Camera Model | string | 摄像头型号（CM31/CM32） | 设备配置 |
| Health Status | enum | 健康状态：Healthy / Needs Attention / Not Installed | 综合判定 |
| Camera Last Connected | datetime | 摄像头最后连接时间 | 设备心跳 |
| VG Last Connected | datetime | 关联网关最后连接时间 | 网关心跳 |
| Recording Status | enum | 录制状态 | 摄像头遥测 |
| Disconnection Reason | string | 断连原因分析 | 系统诊断 |
| Recommended Action | string | 建议的修复措施 | 系统诊断 |

---

### 报表 39：Sensor Health Report（传感器健康报告）

**用途**：监控连接到网关的各类传感器的健康状态

**数据源**：连接到 Vehicle/Asset Gateway 的传感器设备遥测

| 字段名 | 类型 | 说明 | 数据来源 |
|---|---|---|---|
| Vehicle / Asset Name | string | 关联的车辆或资产 | 配置 |
| Sensor Type | string | 传感器类型（温度/门开关/胎压/油位等） | 设备配置 |
| Sensor ID | string | 传感器标识 | 设备配置 |
| Health Status | enum | 健康状态 | 综合判定 |
| Last Reading Time | datetime | 最后一次读数时间 | 传感器遥测 |
| Battery Status | enum | 传感器电池状态 | 传感器遥测 |
| Signal Quality | enum | 信号质量 | 通信模块 |

---

## 第八类：文档、自定义及其他报表（Documents, Custom & Other Reports）— 9份

---

### 报表 40：Documents Report（文档表单报告）

**用途**：管理驾驶员通过 Driver App 提交的各种文档表单

**数据源**：Samsara Driver App

| 字段名 | 类型 | 说明 | 数据来源 |
|---|---|---|---|
| Document ID | string | 文档唯一标识 | 系统 |
| Document Type | string | 文档类型名称（Accident / Bill of Lading / Citation 等） | 管理员定义模板 |
| Document Name | string | 驾驶员为文档提供的名称 | Driver App 输入 |
| Driver ID / Name | string | 提交驾驶员 | Driver App 登录 |
| Vehicle ID | string | 提交时选择的车辆 | Driver App |
| State | enum | 状态：Required / Submitted / Archived | 工作流 |
| Driver Created At | datetime | 驾驶员创建时间 | Driver App |
| Server Created At | datetime | 上传到服务器时间 | 系统 |
| Server Updated At | datetime | 最后更新时间 | 系统 |
| Dispatch Job ID | string | 关联的调度路线停靠点ID | 路线系统 |
| fields[] — 动态字段 | array | 模板定义的表单字段列表 | 模板 + 驾驶员填写 |

**动态字段类型**：

| 字段类型 | 类型标识 | 说明 |
|---|---|---|
| 文本 | ValueType_String | 如 Load # |
| 数字 | ValueType_Number | 如件数（可配置小数位） |
| 多选 | ValueType_MultipleChoice | 如 Yes/No 选项 |
| 日期时间 | ValueType_DateTime | UTC毫秒时间戳 |
| 照片 | ValueType_Photo | 驾驶员拍摄上传（URL有效期1h） |
| 签名 | ValueType_Signature | 电子签名（含签名人姓名、时间、签名图片URL） |

**API 端点**：`GET /fleet/drivers/documents` | `GET /v1/fleet/drivers/document_types`

---

### 报表 41：Custom Reports（自定义报表）

**用途**：通过拖拽式报表构建器创建个性化报表

**数据源**：平台所有遥测数据的 80+ 字段组合

| 配置项 | 说明 |
|---|---|
| 可用字段数 | 80+ 数据字段 |
| 最大列数 | 每份报表最多 16 列 |
| 构建方式 | 拖拽式报表构建器 |
| 数据维度 | 可选 Drivers / Vehicles / Assets |
| 日期范围 | 任意自定义日期范围 |
| 列操作 | 重命名、重排序列 |
| 数据导出 | CSV 导出 |
| 数据范围涵盖 | 安全、效率、合规、维护、资产利用率等多维度 |

**常见使用场景**：
- 关联油耗与维护/活动数据
- 导出自定义工资单报表
- 按更细粒度事件类型分解安全趋势

---

### 报表 42：Scheduled Reports（定时报表）

**用途**：自动定时发送报表至指定邮箱

**数据源**：复用其他报表的数据源

| 配置项 | 说明 |
|---|---|
| Report Type | 可调度的报表类型（HOS Violations / Activity / 等） |
| Frequency | 发送频率：Daily（每日）/ Weekly（每周）/ Monthly（每月） |
| Recipients | 收件人邮箱列表（可配置多个） |
| Format | 报表格式（PDF / CSV / Email 内嵌） |
| Filters | 报表筛选条件（标签、车辆组等） |
| Time Zone | 报表生成的时区 |
| Active Status | 调度启用/禁用状态 |

**支持定时发送的报表**：HOS Violations Report, Activity Report, Fuel & Energy Report 等

---

### 报表 43：Year Summary Report（年度总结报告）

**用途**：全年度运营指标回顾，对比 Samsara 社区基准

**数据源**：全年 Trip History + Safety + Fuel + Dashboard 使用数据

| 字段名 | 类型 | 说明 | 数据来源 |
|---|---|---|---|
| Total Trips | int | 全年总行程数 | Trip History |
| Total Distance (mi) | float | 全年总里程（仅VG数据） | Trip History |
| Safety Performance Summary | object | 安全表现摘要 | 安全评分聚合 |
| Fuel Efficiency (MPG) | float | 全年平均燃油效率 | Fuel & Energy |
| Dashboard Usage Metrics | object | Dashboard 使用指标 | 平台使用日志 |
| API Usage Metrics | object | API 使用指标 | API 调用日志 |
| Community Comparison | object | 与 Samsara 社区对比数据 | 平台匿名聚合 |
| Year | int | 报表年份 | 系统 |

**访问条件**：Full Admin 或 Standard Admin（全组织权限）；至少3个VG网关安装且年度行驶 ≥1,000 英里

**访问路径**：Reports > Activity > Year Review

---

### 报表 44：Samsara Network Activity Report for Asset Tags（资产标签网络活动报告）

**用途**：追踪 Samsara Asset Tags (AT) 的网络检测活动和可见性

**数据源**：Samsara Asset Tag BLE 广播 + Samsara 网络网关检测

| 字段名 | 类型 | 说明 | 数据来源 |
|---|---|---|---|
| Asset Tag Name / ID | string | 资产标签名称和标识 | 资产配置 |
| Asset Tag Model | string | 标签型号（AT11/AT11X/AT XS） | 设备配置 |
| Last Detected Time | datetime | 最后一次被网关检测到的时间 | BLE 检测 |
| Last Known Location | string | 最后已知位置（通过附近网关 GPS 近似定位） | 网关 GPS → BLE 近似 |
| Detection Count | int | 时段内被检测到的次数 | BLE 广播计数 |
| Detecting Gateways | array | 检测到此标签的网关列表 | 网关设备 |
| Battery Status | enum | 标签电池状态 | 标签遥测 |
| Geofence Events | array | 进出围栏事件 | GPS 近似 + 围栏判定 |

**KB 文档**：`kb.samsara.com/hc/en-us/articles/39172839729037-Samsara-Network-Activity-Report-for-Asset-Tags-ATs`

---

### 报表 45：Tachograph Reports — Live Driver's Hours（行驶记录仪实时工时报告，仅EU）

**用途**：实时查看 EU 驾驶员的行驶记录仪活动状态

**数据源**：Vehicle Gateway → 车辆行驶记录仪设备

| 字段名 | 类型 | 说明 | 数据来源 |
|---|---|---|---|
| Driver Name / ID | string | 驾驶员 | Driver Card 识别 |
| Card Number | string | 驾驶员卡号（如 DB12345678901234） | Driver Card |
| Current State | enum | 当前活动状态：BREAK/REST / WORK / DRIVING / AVAILABILITY | 行驶记录仪解析 |
| State Start Time | datetime | 当前状态开始时间 | 行驶记录仪 |
| Total Driving Today | duration | 当日累计驾驶时间 | 行驶记录仪活动汇总 |
| Total Work Today | duration | 当日累计工作时间 | 行驶记录仪活动汇总 |
| Total Rest Today | duration | 当日累计休息时间 | 行驶记录仪活动汇总 |
| Vehicle Name / ID | string | 当前车辆 | 车辆配置 |

---

### 报表 46：Tachograph Reports — Historical Driver's Hours（行驶记录仪历史工时报告，仅EU）

**用途**：查看 EU 驾驶员过去一段时间的行驶记录仪活动记录

**数据源**：Vehicle Gateway → 行驶记录仪 .ddd 文件解析

| 字段名 | 类型 | 说明 | 数据来源 |
|---|---|---|---|
| Driver Name / ID | string | 驾驶员 | Driver Card |
| Activity Start Time | datetime | 活动段起始时间 | .ddd 解析 |
| Activity End Time | datetime | 活动段结束时间 | .ddd 解析 |
| State | enum | 活动状态：BREAK/REST / WORK / DRIVING / AVAILABILITY | .ddd 解析 |
| Is Manual Entry | boolean | 是否手动录入条目 | .ddd 标记 |
| Card Number | string | 驾驶员卡号 | Driver Card |
| .ddd File URL | url | 原始 .ddd 文件下载链接 | S3 存储 |
| File Created At | datetime | 文件创建时间（网关下载时间） | 网关时钟 |
| Vehicle Name / VIN | string | 关联车辆 / VIN | .ddd 文件 / 车辆配置 |

**API 端点**：
- 驾驶员文件：`GET /fleet/drivers/tachograph-files/history`
- 车辆文件：`GET /fleet/vehicles/tachograph-files/history`
- 解析活动：`GET /fleet/drivers/tachograph-activity/history`

---

### 报表 47：Tachograph — Unassigned Driving Report（行驶记录仪未分配驾驶报告，仅EU）

**用途**：追踪行驶记录仪中未关联驾驶员卡的驾驶时段

**数据源**：Vehicle Gateway → 行驶记录仪

| 字段名 | 类型 | 说明 | 数据来源 |
|---|---|---|---|
| Vehicle Name / ID | string | 发生未分配驾驶的车辆 | 车辆配置 |
| Segment Start Time | datetime | 未分配驾驶开始时间 | 行驶记录仪 |
| Segment End Time | datetime | 未分配驾驶结束时间 | 行驶记录仪 |
| Duration | duration | 未分配驾驶时长 | 起止时间差 |
| Distance (km) | float | 未分配驾驶距离 | 行驶记录仪 / GPS |
| Assignment Status | enum | 后续分配状态 | 管理员操作 |

---

### 报表 48：Tachograph — Infringement Reports（行驶记录仪违规报告，仅EU）

**用途**：列出 EU 行驶记录仪法规下的驾驶时间违规

**数据源**：行驶记录仪活动解析 + EU 驾驶时间法规引擎

| 字段名 | 类型 | 说明 | 数据来源 |
|---|---|---|---|
| Driver Name / ID | string | 违规驾驶员 | Driver Card |
| Infringement Type | string | 违规类型（如连续驾驶超4.5h / 每日驾驶超9h / 每周休息不足等） | EU法规引擎 |
| Infringement Start Time | datetime | 违规开始时间 | 活动解析 |
| Infringement End Time | datetime | 违规结束时间 | 活动解析 |
| Duration | duration | 违规持续时长 | 起止时间差 |
| Severity | enum | 严重程度 | EU法规分级 |
| Vehicle | string | 关联车辆 | 车辆配置 |
| Regulation Reference | string | 对应法规条款引用 | EU法规数据库 |

---

## 报表分类汇总

| 类别 | 报表数量 | 报表编号 |
|---|---|---|
| 安全类（Safety） | 9 | #1–#9 |
| 合规类（Compliance/HOS/ELD） | 8 | #10–#17 |
| 燃油能源类（Fuel & Energy） | 5 | #18–#22 |
| 活动行程类（Activity & Trip） | 5 | #23–#27 |
| 利用率效率类（Utilization & Efficiency） | 3 | #28–#30 |
| 维护类（Maintenance） | 6 | #31–#36 |
| 设备健康类（Device Health） | 3 | #37–#39 |
| 文档/自定义/其他（Documents/Custom/Other） | 9 | #40–#48 |
| **合计** | **48** | |

---

## 权限要求

| 权限级别 | 可访问报表 |
|---|---|
| Full Admin | 所有报表 |
| Standard Admin（全组织） | 大部分报表（含 Year Summary） |
| Custom Role — Read Safety Events & Scores | 安全类报表 |
| Custom Role — Read Fuel & Energy | 燃油能源类 + 怠速报告 |
| Custom Role — Read ELD Compliance Settings | HOS/合规类报表 |
| Custom Role — Read IFTA (US) | IFTA 报告 |
| Custom Role — Read Vehicle Statistics | 遥测/活动/利用率报表 |

---

> **免责声明**：以上内容基于 Samsara 公开文档和 API 文档整理，实际 Dashboard 中可见的报表可能因订阅级别、地区（US/EU/CA）和组织配置不同而有所差异。部分字段可能在不同产品版本中有变动。如需确认精确信息，请登录该组织的 Samsara Dashboard 查看或联系 Samsara 客户支持。
