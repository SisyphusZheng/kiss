# 2026-08-19 全仓审计(full-repo audit)

委托背景: 用户明确要求一轮全仓审计(覆盖重复实现 / 冗余文件 / 冗余注释 / 潜在 bug / bad smell),并将发现转化为去重后的 GitHub Issues。本审计为一次性 targeted pass,不开启持续审计循环;修复另行决策,不在本报告内实施。

## 方法

- 10 个只读审计代理并行深扫,分区: element / app / adapter-vite / create+ui / tools / www / examples+e2e / workflows+根配置 / 跨包重复实现专项 / 安全专项。
- 主线程对所有 P1 候选逐行验证(读代码 + esbuild 转译实测 + deno eval 实测 + GitHub API / npm registry 核对),并对将写入 issue 的 P2 证据做抽查;未验证的发现不进入 issue。
- 基线: 审计前本地门禁全绿(`deno task test` 1553 passed / 0 failed,lint/fmt/typecheck/arch:check/repo:hygiene/docs:truth/actions:check-pins 通过)。近期 #1050–#1054 已做过一轮 medium/low 深扫,本审计聚焦漏网项。
- 已知登记项(#907/#892/#723/#862/#861/#980/#615/#612–#614/#624–#628、CodeQL 两条)不重复报告。

## 结果总览

0 P0 / 6 P1 / 6 P2(聚合后 issue 数)/ 35+ P3。全部发现已转化为 13 个去重后 issue:

| Issue                                                            | 级别 | 主题                                                        |
| ---------------------------------------------------------------- | ---- | ----------------------------------------------------------- |
| [#1055](https://github.com/open-element/openelement/issues/1055) | P1   | JSX `<For key={fn}>` 静默退化为 unkeyed 全量重渲染          |
| [#1056](https://github.com/open-element/openelement/issues/1056) | P1   | CSR style 对象 camelCase 键被静默丢弃(SSR/CSR 分歧)         |
| [#1057](https://github.com/open-element/openelement/issues/1057) | P1   | 生成的 serve.mjs 不向 loader 传 process env                 |
| [#1058](https://github.com/open-element/openelement/issues/1058) | P1   | serve.mjs 静态响应缺 #1039 Cache-Control parity             |
| [#1059](https://github.com/open-element/openelement/issues/1059) | P1   | fullstack-boundary 存储策略门禁只扫单个硬编码迁移文件(假绿) |
| [#1060](https://github.com/open-element/openelement/issues/1060) | P1   | starter magic-link/recover/signup 成功路径 fail(200) → 500  |
| [#1061](https://github.com/open-element/openelement/issues/1061) | P2   | ui: disabled open-button 仍可导航;open-dropdown 锚点冲突    |
| [#1062](https://github.com/open-element/openelement/issues/1062) | P2   | dev server 不 watch islandsDir,新增 island 永不 hydrate     |
| [#1063](https://github.com/open-element/openelement/issues/1063) | P2   | 浏览器 guard 重定向可覆盖更新的编程式导航                   |
| [#1064](https://github.com/open-element/openelement/issues/1064) | P2   | reader settings 表单双执行(JSX onSubmit + 路由 action)      |
| [#1065](https://github.com/open-element/openelement/issues/1065) | P2   | action-pins 审计空转 + 15 处注释漂移;tier-3 冒烟累积用户    |
| [#1066](https://github.com/open-element/openelement/issues/1066) | P2   | www blog prev/next 与列表不一致;版本文案自相矛盾且已上线    |
| [#1067](https://github.com/open-element/openelement/issues/1067) | P3   | 35+ 项可维护性发现的分组清单(deferred)                      |

## 与 0.43 freeze 的关系

- 唯一与 freeze 直接相关的是 **#1060**: starter 的 magic-link/recover/signup 成功路径在生产必然 500(邮件已发出、账号已创建)。这是 reference SaaS 的 Auth 链路功能缺口,建议 freeze 前修复(最小改动 + action 测试)。
- **#1059** 属门禁完整性: 正是本轮 Storage 漂移同类面的防护门禁,目前对新迁移文件给假绿,建议随下一次 tools 修复一并收敛。
- **#1055/#1056** 是 framework 对用户的公开契约缺陷(文档承诺的 JSX 写法),不阻塞当前 starter(starter 未用这两个写法),按 P1 排期。
- **#1057/#1058** 只影响 `node dist/server/serve.mjs` 独立生产入口;starter 官方路径是 Nitro/Cloudflare,不受影响,按 P1 排期。
- P2/P3 均不阻塞 freeze,按冲刺纪律默认延期。

## 确认无问题的重点检查项(节选)

- element: `data-eid` SSR/hydration 编号一致;keyed list dup-key 处理无孤儿节点;`isDangerousKey`/`injectPropsSafe` 三路径单源,原型污染面无缺口;render-dsd 错误路径遥测无双报。
- app: 编程式导航 latest-wins(#1023)逻辑正确;`createParamsRecord` Proxy 原型防护三重;查询串严格一次解码;data-context bridge 栈恢复正确。
- adapter-vite: 路由扫描器 varName/catch-all/自遮蔽均正确且有测试 pin;`tryStatic` 路径穿越/畸形编码全部拒绝;多 Set-Cookie 两条链路不丢;CSRF 矩阵 fail-closed。
- 安全专项: Stripe webhook 先验签后解析 + 常数时间比较;`safeInternalNext` 无开放重定向;cookie HttpOnly/SameSite=Lax;scanner-worker 先授权后下载;tools 全部数组参数无 shell 注入面。
- workflows: 7 个第三方 action SHA pin 全部真实有效(错的是人读注释,#1065);supabase-project-smoke 清理链完整;`test:e2e:browser-smoke` 末尾裸 `--project` 是有意设计。
- 跨包重复: html-escape 双实现为刻意契约不同且有双向注释;`routePatternToURLPatternPath` 双胞胎逐字节一致互指;serve.mjs MIME 表内嵌机制有 parity 测试钉住。

## 未做事项(纪律)

- 未修任何发现(审计与修复分离,修复按 P 级另行排期)。
- 未开启新一轮全仓深扫的循环;P3 批次(#1067)默认 deferred。
- 未改动任何 framework 公开契约;issue 中的最小修复方向仅为建议,实施时需按 ADR/现有测试复核。

## 2026-08-19 补记: 修复批次已落地(#1068)

全部 12 个 P1/P2 issue 于同日修复并经 PR #1068 squash-merge 入 main(merge commit `3d727134`),#1055–#1066 全部关闭。每个修复独立提交并带测试;本地门禁 1581 passed / 0 failed,CI(autoflow-ci、CodeQL、dependency-review、Node 20/24 smoke、e2e)全绿。

- 一处 CI 回归及处理: #1066 把 ADR 文移出 prev/next 可见集后,`page-structure.spec.ts` 原目标文章恰为 ADR(type: adr),空 pager 判 hidden 致红;测试改指向日期序中有前后邻的 dispatch 文 `0100-three-audits-later-the-stable-line` 并注释语义,本地 40/40 复跑验证后 CI 转绿。
- #1059 修复要点: 门禁聚合扫描全部迁移文件,operations 去重后与 SELECT/INSERT/DELETE 必需集比对(重述策略放行,新增 UPDATE 或缺失必需操作拦截)。
- #1066 顺带修复同类漏网文案两处(`index/index.tsx:264`、`roadmap.tsx:613`);index 页保留当前 alpha 线锚点(strategic-docs 门禁要求)。
- #1067(P3 批次)保持 deferred,未随本批次实施。
