# openElement 0.42.0-alpha.5 第二轮全面审查报告

- **审查对象**:main @ `1a3a5878`(v0.42.0-alpha.5)
- **审查性质**:只读独立审查;所有结论附文件:行号或可复现命令
- **亲自复现清单**:
  - `deno task test`:971 单测全绿
  - 夹具 e2e:126 passed(18.4s,`--retries` 复核为无重试通过)
  - CI run `30321243918`(commit `d2685b0a`)日志级核查:35 门禁全量,含 `PASS fixture:request-time:gate`(2026-07-28T01:52:41)
  - alpha.4 tag worktree 复现:两个生存 spec `--retries=0` 确定性失败(`Expected: "2" Received: "0"` ×2)——Errata 声称属实

---

## 一、全栈框架评估

### 1.1 定位与参照系

openElement 的 Application Loop 属 **Hotwire/Enhance 谱系**(HTML over the wire + 渐进增强),而非 Remix/SvelteKit 谱系(客户端路由 + loader/action 数据协议):

| 维度       | openElement 0.42                          | 最近参照                         |
| ---------- | ----------------------------------------- | -------------------------------- |
| 提交模型   | 原生 form POST + PRG,增强层 fetch + morph | Hotwire Turbo / Enhance          |
| 无 JS 退化 | 一等公民(协议双通道对称)                  | Enhance(同级)、Remix(有但非重心) |
| 组件模型   | 原生 WC + DSD,零岛默认零 JS               | Enhance(WC)、Astro(islands)      |
| 更新粒度   | region 域内 morph                         | Turbo Frames / htmx `hx-target`  |
| 历史/导航  | pushState + popstate 整页 reload          | 远弱于所有参照(Turbo 有快照缓存) |

### 1.2 闭环自洽性

ADR-0120 七规则 + ADR-0121 十二项加固构成的协议,规范化程度**超过 Hotwire 的非正式约定**。双通道对称性(fetch 404 对称、POST 强转 303、JSON 通道 redirect 用 200 载荷避开 fetch 自动跟随、全响应 no-store)是 Remix 早期踩过的坑,openElement 在 alpha 阶段就以 ADR 钉死,且 126 个夹具 e2e ×3 引擎全绿。**协议设计是本框架最强一环。**

结构性豁口:**morph 客户端是协议的"另一半",却是手写 ~330 行 vanilla JS**(`packages/adapter-vite/src/internal/ssg/entry-generators.ts:340-590`)。本轮 5 个高危全部落在这一半(第三节)。morphdom/idiomorph 十年磨平的边缘情形(键控重定位、跨 shadow 边界、DSD 实例化)正在被重走。

### 1.3 DX

**好**:文件路由 + `definePage` + `fail()`/`redirect()` authoring 面干净,接近 SvelteKit form actions;`?/name` 命名 action 借鉴 SvelteKit 是明智的;夹具应用本身是可跑的活文档。

**弱**:

1. morph 失败静默降级为整页导航,无 dev 模式诊断,region 匹配失败只能靠猜;
2. `hasEnhancedForms` 静态扫描(`route-scanner.ts:247`)使"增强层是否被包含"成为页面源码字面量的函数——共享组件里的表单静默失去增强;
3. 422 后表单值回填要用户手写,Remix/SvelteKit 均有约定。

### 1.4 架构赌注

1. **DSD-first**(ADR-0037/0062):成立——零岛页面真正零 JS,SSR 无需模拟补水。代价:morph 跨 shadow 边界成为全框架最难问题域,当前有洞(H4/H5)。
2. **无客户端路由,popstate 一律 reload**(ADR-0121 §10):诚实但原始;且守卫变量是内存态(H3),连"诚实的 reload"都没做对。
3. **codegen 无运行时依赖客户端**:可审计、体积可控,但 morph 的每个 bug 都要自己发现自己修。
4. **协议以 ADR 冻结**(ADR-0086 AI 协作赌注):从审查可判定性看,赌注在兑现。

### 1.5 缺失基元及影响面

- **session/cookie 签名基元**:无。CSRF 靠 SameSite=Lax 假设 + 文档配方(`www/app/routes/guide/security.tsx:144-157` 的 `sec-fetch-site` 中间件)。0.42 明确决策(§12)可接受,stable 前应把 `csrfGuard` 提升为可导入官方中间件。
- **表单值回填**:422 后手动回填,每个真实应用都要重写一遍。
- **导航缓存/滚动恢复**:无;popstate reload 丢滚动位置。
- **流式渲染**:ADR-0040 有铺垫,与 action loop 未打通。

这些缺失不否定 0.42 定位(只做 loop),但决定它当前"够写内容站 + 轻表单应用",不够写"真实业务后台"。

### 1.6 0.42.0 stable 独立判断

**不建议现在切 stable。** 5 个新高危全部位于本版本核心交付物(morph/增强层),其中 H1(formAction fallback)破坏 `<form action>` 基础 HTML 语义——主路径 bug,非边缘情形。协议层已够格冻结;实现层需再一轮修复 + 补测试。**建议:alpha.6 修 5 高危 + 补第七节三个测试 → beta → stable 顺延。**

---

## 二、第一轮修复复核:16 项中 14 项真实修复,2 项修复不足

逐项核查代码 + 回归测试双证据(注:任务书 issue 编号与仓库编号存在系统性错位,按仓库语义描述):

**真实修复(14 项)**,代表性举证:

- action 返回 Response → 500:实现 + 单测 + e2e 齐全
- POST redirect 强转 303、JSON 通道 200 载荷、PRG 剥 `?/` 前缀键、fetch 404 对称:均有夹具 e2e(live.spec.ts 126 用例)
- `?/constructor` 原型污染:`hasOwnProperty` 封死(处理链 + live.spec.ts:217-222)
- morph 岛生存:alpha.4 上两个生存 spec 确定性失败(亲自 worktree 复现),alpha.5 上 126/126——修复真实且 Errata 诚实

**修复不足(2 项)**:

1. **redirect() 构造期校验无单测**(authoring.ts:50-70):3xx 白名单代码在,非法 status 抛错路径零测试。类别:测试缺口。
2. **405 handler 漏 no-store**(entry-render-helpers.ts:439-443):违反 ADR-0121 §7"全响应 no-store"。类别:协议缺陷。

---

## 三、新发现 issue list

### 高危(5 项)

| #  | 位置                             | 问题                                                                                                                            | 类别         |
| -- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| H1 | entry-generators.ts:517          | `(submitter && submitter.formAction)                                                                                            |              |
| H2 | route-scanner.ts:247-249         | `hasEnhancedForms` 正则扫页面源码字面量;表单在共享组件(import 引入)时漏报 → 增强层静默省略,退化整页 POST 且无告警               | 框架设计问题 |
| H3 | entry-generators.ts:503, 588-590 | popstate 守卫 `__enhancedNav` 是内存变量;增强导航→刷新(复位)→back/forward→守卫失效不 reload,URL 与内容不一致,违背 §10 自身承诺  | 实现 bug     |
| H4 | entry-generators.ts:390, 397     | `insertBefore`/`appendChild` 插入含 `template[shadowrootmode]` 的新节点时 DSD 不实例化(DSD 只在解析期生效),morph 新增的岛是死的 | 实现 bug     |
| H5 | entry-generators.ts:377-397      | id 键控节点从不重定位:配对节点原地 morph,新中间节点全部 `appendChild` 追加尾部(L397),列表重排序时 DOM 顺序错误                  | 实现 bug     |

### 中危(8 项确证)

1. `formData()` 解析失败落 500 而非 400/415——恶意 content-type 制造 500 噪音。类别:协议缺陷。
2. `__islandIntact` 对嵌套 DSD 恒判"已变更"(entry-generators.ts:340-344 `outerHTML` 逐子比较)→ 已补水岛被无谓 replace、状态重置。类别:实现 bug。
3. `isOpenElementRedirect` 鸭子类型不校验 status 白名单——伪造形状对象可携带任意 status 进 redirect 通道(开放重定向面)。类别:协议缺陷。
4. 前瞻窗口硬编码 4(entry-generators.ts:386)且 MORPH_CONTRACT 未载明——连续插入 >4 兄弟节点时旧节点被误删重建。类别:框架设计问题。
5. idle/visible 懒补水岛首次提交漏增强——补水前 shadow root 不存在,`__scanSubmitRoots` 扫不到;补水完成无重扫钩子(仅 morph 后重扫 L560)。类别:实现 bug。
6. parity 测试仅 6 组状态码——§8 的矩阵不含 401/403/405/redirect-chain。类别:测试缺口。
7. catch → `window.location.reload()`(entry-generators.ts:575-578)——网络瞬断静默 reload 丢全部表单输入,不派发 `open:action-failure`。类别:框架设计问题。
8. 405 无 no-store(同第二节 #2,计入缺陷面)。

> 注:第一轮子代理共报 12 项中危,其余 4 项细节因上下文压缩且 transcript 不存在而无法恢复;以上 8 项均经代码定点复核确证,不掺推测。

### 低危(4 项定点确证)

1. entry-generators.ts:467 — `CSS.escape` 缺失时裸拼 region name 进选择器,region 名含引号时选择器损坏(仅古董引擎)。
2. entry-generators.ts:482-486 — `__submitRoots` 只增不减,morph 掉的 shadow root 引用滞留(小量级内存泄漏)。
3. entry-generators.ts:410-415 — script 节点 morph 时 src 变更有意留旧(有注释,属已文档化取舍,但 MORPH_CONTRACT 应载明)。
4. entry-generators.ts:566 — `target.hash` 存在时直接丢弃本地 hash,与 #565 注释语义有细微出入。

---

## 四、ADR-0121 十二项决策符合性

| §  | 决策                                                    | 结论    | 证据                                                         |
| -- | ------------------------------------------------------- | ------- | ------------------------------------------------------------ |
| 1  | 统一头 `x-openelement-action: true\|enhance`            | ✅      | 客户端 L526 发 `enhance`;服务端判别有 e2e                    |
| 2  | 禁 Response 返回 → 500                                  | ✅      | 代码+单测+e2e                                                |
| 3  | redirect 3xx 校验 + POST 强转 303                       | ⚠️ 部分 | 实现在;构造期校验无单测                                      |
| 4  | JSON 通道 redirect 用 200 载荷                          | ✅      | e2e                                                          |
| 5  | PRG 剥 `?/` 前缀键                                      | ✅      | e2e                                                          |
| 6  | fetch 404 对称                                          | ✅      | e2e                                                          |
| 7  | 全响应 no-store                                         | ⚠️ 部分 | 405 分支漏(entry-render-helpers.ts:439-443)                  |
| 8  | POST/GET 错误边界 parity                                | ⚠️ 部分 | 实现在;parity 测试仅 6 组状态码                              |
| 9  | region 语义(scope 缺失→整页导航)                        | ✅      | entry-generators.ts:456-479(L475 `return false` → L574 导航) |
| 10 | shadow root 级 submit + id 键控 morph + popstate reload | ❌      | 监听✅(L483-500);id 键控不重定位(H5);popstate 守卫失效(H3)   |
| 11 | `open:action-failure` cancelable                        | ✅      | L551-557                                                     |
| 12 | CSRF SameSite=Lax 假设 + 文档配方                       | ✅      | security.tsx:144-157                                         |

**结论:9 项符合;§3/§7/§8 部分符合;§10 不符合(且为本版本核心交付项)。**

---

## 五、证据与流程诚实度复核

**总判定:发布证据链真实,无造假;3 处强度虚标,2 处未回溯勘误。**

**真实(日志级/复现级核实)**:

- alpha.5 走 publish-existing(run 30321687103),门禁语义为 `verifyMainCiSuccessForHead()`(tools/autoflow/release.ts:506-535)核对 HEAD=`d2685b0a` 的主 CI;主 CI run 30321243918 日志确认 35 门禁全量 + `PASS fixture:request-time:gate`——证据链闭合。
- fixture 门禁真进 ci+release tier(tools/autoflow/policy.ts:241-245)。
- alpha.4 Errata 亲自复现属实。
- 本地 126/126 无重试、971 单测全绿。

**强度虚标(3 处)**:

1. 静态输出冻结:release 门禁只跑 `--self-check`(policy.ts:253-257),对 v0.41.2 字节级基线对比是手动工具,不在自动门禁——"静态输出不变"声称强度被高估。类别:文档失信(轻度)。
2. 0.41 冻结面:interface snapshot 在 alpha.2 已 re-baseline,"no frozen export changed"是 prose 声称;check-public-interface-snapshot.ts:16-20 只抓行首 export 声明,类型形状/重导出语义变更不设防——冻结面无机械守卫。类别:架构回流风险。
3. playwright 本地 retries=1(CI=2):可能掩盖 flaky;本轮 `--retries=0` 复跑通过,当前无实际掩盖,但配置是坏味道。

**未回溯勘误(2 处)**:alpha.1"12/12"、alpha.2"33/33"在生存 spec 问题曝光后未回溯 Errata(alpha.4 出了,前两个没有)。

---

## 六、TP-6 准出判断与补项清单(按 ROI 排序)

**判断:TP-6 未就绪。** 协议层(ADR 文本 + 服务端实现)已达冻结质量;客户端增强层(morph/history/检测)是阻塞项。

| 序 | 补项                                                                        | ROI 依据                     |
| -- | --------------------------------------------------------------------------- | ---------------------------- |
| 1  | 修 H1(改 `submitter.hasAttribute('formaction')`,一行)+ e2e                  | 一行消除主路径双通道不对称   |
| 2  | 修 H2 检测策略:任一 route 含 enhance 即全局包含增强层,或构建期告警          | 消除最难排查的"静默降级"故障 |
| 3  | 修 H3:popstate 守卫改 `sessionStorage`                                      | 一行级,兑现 §10 承诺         |
| 4  | 修 H4:morph 插入后对新子树扫 `template[shadowrootmode]` 手动 `attachShadow` | 补生存矩阵空白格             |
| 5  | H5 + 前瞻窗口:实现重定位,或 MORPH_CONTRACT 载明"不保证重排序"               | 契约诚实优先于功能完备       |
| 6  | 收尾:405 no-store + redirect() 构造校验单测                                 | 关掉"已修复"清单尾巴         |
| 7  | 公共接口冻结改机械守卫(如 `deno doc --json` diff)                           | 防冻结面无声漂移             |
| 8  | 补 alpha.1/2 勘误;静态输出基线对比进 release 门禁或降级措辞                 | 诚实度一致性,成本≈0          |
| 9  | parity 矩阵扩全状态码族;本地 retries 归零                                   | 测试强度对齐声称强度         |

---

## 七、最值得立刻补的三个测试

1. **e2e:`<form action="/other-route" data-open-enhance>` + 无 formaction 的 submitter → 断言 POST 命中 `/other-route`。**
   命中 H1,今天就会红;永久钉死 ADR-0120 规则 2 的双通道 URL 对称性。

2. **e2e:增强表单只存在于被 import 的共享组件(页面源码无 `data-open-enhance` 字面量)→ 断言增强层存在且提交走 fetch。**
   命中 H2,今天就会红;是"框架隐式行为"类 bug 的唯一防线。

3. **e2e:morph 后新插入的岛节点(响应 HTML 多一个带 `template[shadowrootmode]` 的岛)→ 断言 shadowRoot 存在且补水后可交互。**
   命中 H4,把 MORPH_CONTRACT"morph 新增岛"空白格变成受测契约——alpha.4 事故已证明这类空白格会真实爆炸。

(候补:redirect() 非法 status 构造期抛错单测,一并关掉第二节 #1。)

---

## 附:全栈框架成熟度记分卡(独立评估)

以"生产级全栈框架"为满分基准(参照 Remix/SvelteKit/Astro 的 1.0 水位):

| 维度                | 成熟度 | 说明                                                          |
| ------------------- | ------ | ------------------------------------------------------------- |
| 协议/契约设计       | ★★★★★  | ADR-0120/0121 规范化程度超过多数 1.0 框架的同期水平           |
| 服务端 action 实现  | ★★★★☆  | 14/16 修复真实,余 2 项小尾巴                                  |
| 客户端增强层(morph) | ★★☆☆☆  | 5 高危全在此;核心交付物但质量最低                             |
| 路由/渲染(SSG+DSD)  | ★★★★☆  | 0.41 冻结面,稳定;缺流式与 loop 打通                           |
| 数据/状态基元       | ★★☆☆☆  | 无 session/CSRF 基元/回填约定,靠配方                          |
| 测试与门禁工程      | ★★★★☆  | 971+126×3 引擎+35 门禁全量;缺口在 parity 矩阵与冻结面机械守卫 |
| 流程诚实度          | ★★★★☆  | 证据链真实;3 处强度虚标、2 处未勘误                           |
| DX/诊断             | ★★★☆☆  | authoring 面好;morph 静默降级无诊断                           |
| 生态/文档           | ★★★☆☆  | ADR 极佳;面向使用者的指南薄                                   |

**综合:约相当于同类框架的 0.4~0.5 水位(恰与版本号一致)。** 定位清晰、协议扎实、工程纪律罕见地好;短板集中且明确——客户端增强层一轮加固后,0.42 stable 即可站得住。适用边界:今天可用于内容站+轻表单应用;真实业务后台需等 session/CSRF/回填基元落地(0.43+ 范围)。
