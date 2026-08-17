# 全仓深度体检(v0.43.0-alpha.2,HEAD 80b5f069 + open-layout 重构工作区)

日期:2026-08-17。
方法:5 路并行只读探查(重复实现 / 冗余文件 / 冗余注释 / 核心运行时 bug / 周边包与站点 bug),范围 `packages/*/src`、`www/app`、`www/e2e`、`tools/`、`examples/`,排除 vendor、node_modules、dist、生成物、docs 档案。全部发现经第二遍核实(逐行读码或 deno 实测复现);死代码结论以全仓 Grep(含 deno.json tasks、workflows、e2e、fixtures)双向验证。
去重基准:open issues #37–#1002 + 2026-07-26 起各轮 audit 报告;#723/#892/#907/#980/#987/#988/#990 已跟踪项不重复报告。

历史线索现状核验(已收敛,不再是问题):escapeHtml/escapeAttr 双实现已单源(#633);Fragment 判定已集中为 `isFragment`(#740);空 catch 从 93 处收敛到 3 处且均有注释理由;token 镜像双门禁(check-www-theme-tokens、generate-ui-token-module --check)实测通过。

## 维度 1:重复实现

- [high] **D1-1 catch-all 路由 paramNames 双重推导且规则分叉** — `packages/adapter-vite/src/internal/ssg/entry-descriptor.ts:199` vs `packages/adapter-vite/src/internal/ssg/route-scanner.ts:424-426`
  证据:descriptor 从 path 字符串 `/:([^/]+)/g` 重推导,对 `/docs/:path{.+}` 产出 `['path{.+}']`;scanner 从文件名方括号提取产出正确的 `['path']` 却被忽略。下游三层全断(与 D5-2 同根因):`resolveDynamicRoutePath` 按 `path{.+}` 查 params 抛 "Missing value"(fail 策略下构建失败,warn 下页面静默缺失);生成的 `matchRequestTimeRoute` 查 `groups['path{.+}']` 得 undefined,`decodeURIComponent(undefined)` 产出字符串 `'undefined'`;`ssg-render.test.ts:667` 手工喂 `['path']` 绕开派生,测试从未覆盖。
  建议:descriptor 消费 scanner 的 `params` 字段(唯一实现归 route-scanner),不再从 path 字符串重推导。

- [medium] **D1-2 locale 前缀识别三处两套启发式** — `www/app/islands/open-search.tsx:304-309` vs `www/app/site-ui/open-layout-navigation.ts:100-103`(权威:`packages/app/src/internal/router/i18n.ts:19-25`)
  证据:open-search `_sectionFor` 用 `/^[a-z]{2}$/` 裸正则剥离首段,任何两字母顶层路径(未来 `/ui/`、`/go/`)会被误判为 locale 丢段;`mobileSectionRoot` 用真实 locales 列表判断,是正确做法。同站两套判定。
  建议:site-ui 封装 `stripLocalePrefix(path, locales)`(委托 normalizeLocalePath),open-search 改用它。

- [medium] **D1-3 「JS 属性优先、attribute 兜底」取值器三处两种语义** — `www/app/site-ui/get-str.ts:8-13` vs `www/app/islands/open-layout.tsx:584-589`(`_getBool`)vs `www/app/site-ui/open-reading-shell.tsx:46-49`
  证据:get-str 做 kebab→camel 转换后 `Reflect.get`;open-reading-shell 的 `#value` 直接用带连字符原名 `Reflect.get(this, name)`,SSR 注入 camelCase 属性(如 `previousLabel`)时静默 miss 退回 attribute。
  建议:扩展 get-str.ts 为 getStr/getBool 一族,三处调用点收编。

- [medium] **D1-4 安全属性名校验谓词两处** — `packages/element/src/internal/core/render-ir.ts:129,147` vs `packages/adapter-vite/src/head-injection.ts:133-141`
  证据:同一语义的两种正则写法(`\w` ≡ `[A-Za-z0-9_]`)+ 同样的 `/^on/i` 拒绝,失败策略不同(静默跳过 vs 抛错)可保留,谓词本身应单点。
  建议:`packages/element/src/internal/core/security.ts` 导出 `isSafeAttributeName`,adapter-vite 复用。

- [low] **D1-5 属性列表序列化同文件复制两遍** — `packages/adapter-vite/src/head-injection.ts:259-269` 与 `:297-304`(布尔特例 filter/map/join 逐字相同)。建议:文件内抽 `serializeAttrList`。

- [low] **D1-6 unknown→string 错误格式化多处手写** — `packages/element/src/internal/core/errors.ts:27-38`(权威 `formatError`)vs `packages/adapter-vite/src/cli/build.ts:22`、`cli/start.ts:90`、`build-plan.ts:133`、`build-ssg.ts:475`。建议:CLI/构建错误出口统一走 `formatError`。

合理并存(判断标准:交叉引用注释 + 契约明确不同,抽查 4 组确认):`sanitize.ts:166` vs `html-escape.ts:53` 两个 escapeAttr(两侧注释互指"同名不同契约");`packages/app/src/internal/router/client-router.ts:97-106` vs `ssg-helpers.ts:131-140` routePathToURLPatternPath(生成 server 入口必须自包含的 Twin 拷贝);SSR/水合双渲染平行遍历(架构性);`logo-home.js:16-19` vs open-layout `_homeHref`(public 静态脚本无法 import,注释互指)。

## 维度 2:冗余文件 / 死代码

- [medium] **D2-1 `tools/fullstack-spike-workers.ts` 一次性 spike 无接线** — 无 deno task、无 importer、CI 不调用(全仓 grep 仅 fixture 注释提及);其证明的两条 claim 已被自动化测试覆盖(`nitro-mount.test.ts`、`entry-renderer.test.ts` + fixture 路由)。
  建议:删除;若保留历史价值则归档 `docs/evidence/`。

现状确认(不构成删除项):`open-dialog`/`open-callout`/`open-dropdown`/`open-tabs` 四个 UI 组件仓内零消费但属已发布库 API(public interface snapshot 钉死),保留;`www/public/favicon.svg` 被 README 引用为品牌源文件,保留。

## 维度 3:冗余 / 过时注释

已在 #995 分支修复(不计入转化):open-layout.tsx 头注路径过时、DsdLitElement/DsdElement 死符号、render/@click 与实现矛盾、`mobile-menu.js` 死文件引用,共 4 条。

- [low] **D3-1 `_walkAndBind` 墓碑注释 ×2** — `packages/element/src/open-element-implementation.ts:427` 与 `:520`(`// _walkAndBind DELETED — ...`),该方法 v0.28 已删,代码零命中。
- [low] **D3-2 isr.ts 前置版本锚描述未实现功能** — `packages/element/src/internal/core/isr.ts:4`(`v0.44: Platform adapters (CF Workers KV, Deno KV)`),当前 v0.43.0-alpha.2,文件全文 29 行无任何平台适配器。
- [low] **D3-3 畸形版本锚 ×2 + 死文件引用 ×2** — `packages/element/src/internal/core/island.ts:110` 与 `:223`(`v0.6'` 带游离撇号)、`:17` 与 `:40`(引用已删的 `custom-element.ts`);另 `packages/element/src/internal/core/security.ts:10` 引用已删的 `render-instantiate.ts`。
- [info] TODO/FIXME 范围内仅 2 条(`examples/deno-desktop-reader/app/search.ts:72`、`app/__tests__/routes.test.ts:11`),均被 #980 跟踪;packages/*/src 零 TODO 声称仍成立。

## 维度 4:潜在 bug(核心运行时 packages/element + packages/app)

确定 bug:

- [high] **D4-1 SPA 程序化导航无并发排序,慢 guard 的旧导航后完成者胜出** — `packages/app/src/internal/router/client-router.ts:563` + `:607`
  触发:目标路由带异步 guard,guard pending 窗口内发起第二次导航(双击/快速连点)。
  表现:第二次导航先完成渲染 B,第一次 guard 后 resolve 再次 pushState + rematch,地址栏与渲染回退到较早意图 A,history 顺序与用户操作相反。
  排除防护:仓库只对浏览器驱动导航做了 `browserNavigationQueue`(:657),程序化路径无串行化;guard 测试全是单次导航。
  建议:navigate/replace 纳入与 browserNavigationQueue 同语义的序号/作废机制(latest-wins)。

- [medium] **D4-2 `consumeContext` 在无 DOM 的 SSR 运行时抛 ReferenceError** — `packages/element/src/internal/core/signal-context.ts:75`
  触发:SSR 期间组件调用 `consumeContext(ctx, this)` 且自身/祖先未 provide 该 context;`undefined instanceof ShadowRoot` 需求值 RHS,而 Deno/Node/Workers 无此全局。
  表现:render 内抛错被 render-error 通道捕获降级为裸标签。
  排除防护:`__tests__/signal-context.test.ts:15-18` 用 `withShadowRootStub` 安装替身绕过(注释自证),运行时未修;同仓 `open-element-render.ts:60` 的鸭子类型写法证明正确做法存在。
  建议:改为鸭子类型判断(`'host' in current`)或 `typeof ShadowRoot` 守卫。

- [medium] **D4-3 render-dsd 的 `route`/`source` 诊断属性未转义拼进 SSR HTML** — `packages/element/src/internal/core/render-dsd.ts:323-327`
  触发:`sourceInfo.route`/`source`(派生自路由文件路径)含 `"` 或 `<`(macOS/Linux 文件名允许引号)。
  表现:SSR 属性击穿,HTML 注入到服务端产物;同函数 `ssrPropsAttr` 走 `escapeAttrValue` 形成对照,属遗漏。
  建议:两属性过 `escapeAttr`。

- [medium] **D4-4 预水合点击队列无上限且水合后全量重放** — `packages/element/src/internal/core/pre-hydration-click.ts:121-133` 与 `:145-166`
  触发:idle/visible 策略或慢加载 island 长时间未水合,用户在其 SSR 区域点击 N 次。
  表现:N 个 Event 强引用至水合;水合瞬间处理器连发 N 次——toggle 类 UI 翻转 N 次,open-button 提交的表单 **action 提交 N 次**,产生重复变更。
  建议:队列设上限(如 1,只保留最后一次)或按 host 去重。

- [low] **D4-5 RegExp 回退匹配器误拒含分组的合法自定义正则** — `packages/app/src/internal/router/client-router.ts:192-196`
  触发:手写 SPA 路由 `:name{(?:a|b)+}` + 无 URLPattern 环境(Firefox);`rest.indexOf(')')` 找错结尾 → `createRouter` 构造即崩。另:`routePathToURLPatternPath` 按 `/` split 再转换,正则内含 `/` 的模式同样损坏。
  建议:括号配对扫描替代 indexOf。

- [low] **D4-6 `params` 属性 JSON 解析后不校验形状** — `packages/element/src/open-element-params.ts:40`
  触发:`params="null"`/`"[1,2]"`/`'{"a":1}'` 均通过;`this.params.id` 在 null 上访问抛 TypeError。
  建议:解析后校验 string-map 形状,非法走 warn + 空对象。

疑似(需运行时验证):

- [medium] **D4-7 guard 否决 popstate 后 history 陷阱** — `packages/app/src/internal/router/client-router.ts:638`。被否决条目留在 history,反复 back 形成 `[A, G, B, B', B''…]` 循环,用户永远回不到 A。需 Playwright 实证。
- [low] **D4-8 keyed `<For>` 水合 seed 遇重复 key 产生幽灵 DOM** — `packages/element/src/internal/core/hydration-scope.ts:459-463` + `binding-activation.ts:455-466`。seed 建 map 直接覆盖同 key 前项,被覆盖节点不再被任何清理路径触及;运行时路径(:527-558)有 displaced-entry 清理而 seed 无。
- [low] **D4-9 `update()` 中 render() 抛错留下"外观正常但绑定全失活"的旧 DOM** — `packages/element/src/open-element-render.ts:121-135` + `:144-182`。reset 先于 render,fallback 默认只 log 返回 null,不清空不提示。
- [low] **D4-10 函数/未注册类组件递归不受 SSR 嵌套深度保护** — `packages/element/src/internal/core/render-ir.ts:438-471`。深度守卫只在注册 CE host 处 +1;自递归函数组件以 stack overflow 而非干净 SSR_NESTING_DEPTH_EXCEEDED 收场。
- [low] **D4-11 数据上下文 `_active` 槽位嵌套进入时覆盖而非压栈** — `packages/app/src/internal/router/data-context-store.ts:72-79`。常规管线不可达(故 low),但 `MAX_DATA_CONTEXT_DEPTH` 文案表明递归在考虑范围内而该槽位非递归安全(且该常量实为死代码)。
- [low] **D4-12 `collectPublicProps` 把框架内部字段漏进 props** — `packages/element/src/internal/core/props-utils.ts:30-41`。`signalRegistry`(Map)与 `_internals`(ElementInternals)均为 own enumerable,CSR 下 `{...props}` 展开产出 `signal-registry="[object Map]"` 垃圾属性,SSR/CSR 输出不一致。

## 维度 5:潜在 bug(周边包 / 站点 / 工具)

确定 bug:

- [high] **D5-1 autoflow `assertForwardOnlyTags` 把 `*-prepare.json` 误当已完成发布,永久阻断全量发布** — `tools/autoflow/release.ts:485-493`
  证据:`entry.name.slice(1, -5)` 对 `v0.41.0-alpha.14-prepare.json` 派生幻影版本 `0.41.0-alpha.14-prepare`;prepare 记录 status 恰为 `completed` 且对应 tag 不存在 → 抛 "completed release(s) missing tag"。当前树有 11 个 `*-prepare.json`,`patch-release`/`approved-release` 首次运行即触发(已实测模拟复现)。publish-existing 链路恰好不含此步骤,故现行发布未炸,但 patch-release 是文档化命令。
  建议:枚举时排除 `-prepare.json`(或按 `v<semver>.json` 严格匹配)。

- [high] **D5-2 catch-all 路由(`[...path]`)SSG 预渲染三层连环失效** — `packages/adapter-vite/src/internal/ssg/entry-descriptor.ts:199` + `ssg-helpers.ts:42-46` 与 `:61`(与 D1-1 同根因)
  证据:层 1 paramNames 分叉(见 D1-1,deno 实测 "Missing value");层 2 即使修好参数名,`/[\\/\0]/` 安全校验拒绝 catch-all 值中天然存在的 `/`;层 3 再即使放行,`replace(':path', v)` 不消费 `{.+}` 产出 `/docs/a/b{.+}`。
  建议:与 D1-1 同 issue 修复:paramNames 单源 + 安全校验放行 catch-all 的 `/` + 路径替换消费正则体。

- [medium] **D5-3 blog 内容插件 dev 监听只 full-reload,不重写数据模块** — `packages/adapter-vite/src/internal/content/blog/plugin.ts:59-65`
  证据:`_generated-blog-data.ts` 只在 buildStart 写一次,watcher 回调只 `hot.send({type:'full-reload'})`;dev 下编辑 markdown 永远看到旧内容,日志还误导 "Content changed … reloading"。nav 插件连 watcher 都没有。
  建议:watcher 回调重写数据模块再 full-reload(或走 handleHotUpdate 失效)。

- [medium] **D5-4 路由变量名冲突:`/a-b`、`/a/b`、`/a_b` 生成同一标识符 `Route_A_b`** — `packages/adapter-vite/src/internal/ssg/route-scanner.ts:330-339`
  证据:`pathToVarName` 把 `/`、`-`、`_` 全折叠成 `_`(实测三者同输出);生成虚拟入口重复声明,Rollup 报错且无法定位根因。无冲突检测。
  建议:scanner 产出前校验 varName 唯一性,冲突时报错指出两条源路径。

- [medium] **D5-5 `<open-dialog open>` 初始打开态不走 `showModal()`,modal 语义静默降级** — `packages/ui/src/open-dialog.tsx:138` 与 `:218-231`
  证据:render 把 `open` 落到内层 dialog 属性,`_syncDialogElement` 见 `dialog.open===true` 跳过 `showModal()` → 无 top layer、无 ::backdrop、页面不 inert、无焦点圈禁;测试只覆盖 关→开 路径。
  建议:同步逻辑区分"属性初始态"与"运行时打开",modal 模式初始打开也走 showModal。

- [medium] **D5-6 zh 本地化页面正文内链全部丢失 locale 前缀** — `www/app/routes/blog/index.tsx:241,259`、`www/app/routes/docs/index.tsx:199-227,271`、`www/app/routes/guide/*.tsx` prev/next(如 `getting-started.tsx:51`)
  证据:构建产物 `www/dist/zh/blog/index.html` 中 `href="/zh/blog...` 出现 0 次,全部指向 `/blog/<slug>`;`/zh/docs` 四入口与 guide prev/next 同样无前缀,从 `/zh/...` 点出去即掉回英文树。`blog/[slug].tsx:101`、`404.tsx:149` 做了 locale 感知,证明无统一策略。
  建议:正文内链统一过 localizeLayoutPath(或站点 link 助手),并加构建产物断言。

疑似(需运行时验证):

- [medium] **D5-7 publish-npm 把 E403 一律当"已发布"跳过** — `tools/publish-npm.ts:249-255`。权限/作用域/2FA 类 E403 与 "already published" 混在同一分支,前置 versionExists 查询失败也返回 false → 实际未发布却绿灯。
- [medium] **D5-8 `persistFailedReleaseEvidence` 本地全量发布下证据提交到 main 却 push dev** — `tools/autoflow/release.ts:1030-1059` 与 `:1282`。失败证据不上远端,本地 main 分叉导致下次 resume 的 ff-only merge 卡死。
- [medium] **D5-9 dev 模式新增路由文件不被识别,需重启且无提示** — `packages/adapter-vite/src/plugin.ts:198` 与 `:421-441`。路由扫描只在 buildStart;与 D5-3 同属 dev/build 分歧族。
- [low] **D5-10 open-button 观察 `target`/`type` 但变更不同步内层元素** — `packages/ui/src/open-button.tsx:189-224`(#757 修 href/disabled 时漏网)。
- [low] **D5-11 island-scheduler `observedEls` 只增不减** — `packages/adapter-vite/src/internal/ssg/island-scheduler.ts:111,136-140`。detached 元素滞留;移除再插入的元素因 `indexOf` 命中永不重新观察、island 缺水合。
- [low] **D5-12 `deno task start`/serve.mjs 静态响应零缓存头** — `packages/adapter-vite/src/internal/static-serve.ts:83-87`。与 #987 不同路径。
- [low] **D5-13 npm-specifier 重写不支持带点包名** — `packages/adapter-vite/src/npm-specifier-plugin.ts:6`(`npm:lodash.merge@4` 不重写)。
- [low] **D5-14 SPA route-manifest 裸插值拼代码** — `packages/adapter-vite/src/route-manifest.ts:71`(文件名含 `'` 生成语法错误;同包其余 codegen 统一走 `codegen-literals.ts`)。
- [low] **D5-15 examples/reader:PDF 全文索引用未 trim 的原始 query;`search('')` 有空串死循环隐患** — `examples/deno-desktop-reader/app/host-store.ts:527` + `app/search.ts:68-80`(防护都在调用方,函数级无守卫)。
- [low] **D5-16 nav 扫描默认排除 '404' 是子串匹配** — `packages/adapter-vite/src/internal/content/nav/scanner.ts:92-97,112`(`rfc-4040.tsx` 会被误排除)。
- [low] **D5-17 sitemap `exclude` 前缀误匹配 + 生成文件 mode 0o600** — `packages/adapter-vite/src/internal/content/sitemap/generator.ts:98` 与 `:113,121`。
- [low] **D5-18 open-layout-navigation 两处边界(重构邻接,非回归,行为与重构前一致)** — `www/app/site-ui/open-layout-navigation.ts:62`(mailto/tel 类安全 URL 在非默认 locale 下会被拼成 `/zhmailto:...`,当前调用方均先行规避,属防御缺口)与 `:93`(filterNavSections 对带 `/zh` 前缀的 currentPath 失配回退不过滤,zh 页面侧边栏不按 section 过滤——重构前旧代码同逻辑,非本次引入)。

## 总体判断与统计

主干(element 核心)治理水平高:唯一权威实现惯例(isFragment/camelToKebab/isDangerousKey/formatError)与"跨包 Twin 拷贝必须双向注释"惯例均已形成;资源清理在各退出路径闭环良好;未发现 P0。

系统性热点三处:① adapter-vite SSG「扫描→描述符→代码生成」链上路由元数据靠重推导而非穿线传递(D1-1/D5-2/D5-4 同源区域);② dev/build 分歧族(D5-3/D5-9,生成数据与路由注册 dev 下不重扫);③ 转义/校验的局部遗漏(D4-3/D4-6/D5-14,主路径严密、次要注入点依赖隐式信任)。

统计:high 3(D1-1/D5-2 同根因记 1 项、D4-1、D5-1)、medium 15、low 17、info 1;其中「确定」28、「疑似需运行时验证」9。issue 转化映射见附录(编号已回填,#1022–#1039)。

## 附录:issue 转化映射(去重后,已回填)

| 发现 | 处置 | issue |
|---|---|---|
| D1-1 + D5-2(同根因) | 新建 | #1022 |
| D4-1 | 新建 | #1023 |
| D5-1 | 新建 | #1024 |
| D4-2 | 新建 | #1025 |
| D4-3 | 新建 | #1026 |
| D4-4 | 新建 | #1027 |
| D5-3 + D5-9(dev/build 分歧族) | 新建(合并) | #1028 |
| D5-4 | 新建 | #1029 |
| D5-5 | 新建 | #1030 |
| D5-6 | 新建 | #1031 |
| D1-2 + D1-3(www 小工具收编) | 新建(合并) | #1032 |
| D1-4 | 新建 | #1033 |
| D2-1 | 新建 | #1034 |
| D3-1/D3-2/D3-3(注释卫生) | 新建(合并) | #1035 |
| D4-5/D4-6/D4-7(router 边界三连) | 新建(合并) | #1036 |
| D4-8..D4-12(运行时疑似五项) | 新建(合并,验证型) | #1037 |
| D5-7/D5-8(发布工具疑似两项) | 新建(合并) | #1038 |
| D5-10..D5-17 + D1-5/D1-6(low 批量) | 新建(合并,hygiene sweep) | #1039 |
| D5-15 | 评论补充到 #980(issuecomment-5311257279) | — |
| D5-18 | 评论备注到 #995(issuecomment-5311257414) | — |

统计:high 3(#1022 同根因记 1 项、#1023、#1024)、medium 15、low 17、info 1;「确定」28、「疑似需运行时验证」9。
