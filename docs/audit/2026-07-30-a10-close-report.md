# alpha.10 里程碑收尾报告（2026-07-30）

里程碑 `v0.42.0-alpha.10`（#17）的全部 **8 个 issue（#646–#653）已逐项解决、验证并关闭**，改动已推送 `origin/main`（`c5e817a6..2543b445`，8 个提交）。

## 最终验证结果

| 验证项                                                    | 结果                                 |
| --------------------------------------------------------- | ------------------------------------ |
| 全量单元测试（`deno task test`）                          | **993 passed / 0 failed**            |
| `deno task release:evidence:check`                        | **passed**（含新 version-hole 守卫） |
| 证据一致性测试（7 个，含 3 个新回归）                     | 7/7 passed                           |
| 新 E2E + spa-action 回归（chromium）                      | 2/2 passed                           |
| `docs:check-version-anchors`                              | passed                               |
| `gh issue list --milestone v0.42.0-alpha.10 --state open` | 空（清零）                           |

## 逐项处置

| Issue               | 处置                                                                                                                                                                                                                                                                                                                                                   | 提交                             |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------- |
| #646 事实修正       | CHANGELOG + release note 改为「α9 已发布 npm（dist-tag alpha）」，note 记录双证据路径                                                                                                                                                                                                                                                                  | `ddfc10e0` `97587db5`            |
| #647 证据链（核心） | ① α9 证据重写为真实 publish run `30553856284`（含 publish/verify/smoke 6 步），closure 指向新证据提交 `4acb56f2`；② `release.ts` 失败路径新增 `persistFailedReleaseEvidence`（catch 中 commit+push，杜绝 α8 重演）；③ 校验器新增 version-hole 守卫：prerelease 的 release 类证据缺 npm publish 步骤即 fail，并认可 `release→publish-existing` 两阶段流 | `1c04c270` `4acb56f2` `97587db5` |
| #648 ISR            | Option B 降级：`revalidate`/`renderIsrResponse`/`MemoryIsrCache`/`CacheAdapter` 等 7 个符号标 `@experimental`，VERSION_PLAN 加「ISR status (0.42)」声明（接线目标 0.44）                                                                                                                                                                               | `9e233bdf`                       |
| #649 CHANGELOG 空洞 | 补 α7、α8 条目（α8 标注 incomplete / npm version hole）                                                                                                                                                                                                                                                                                                | `ddfc10e0`                       |
| #650 E2E 缺口       | 新增 `www/e2e/nested-open-button-submit.spec.ts`：打包**真实** OpenButton + spa.ts 源码，`<open-button type=submit>` 嵌套在另一 WC 的 shadow root（3 层边界），断言 composed submit → root 监听器 → composedPath 找回 form → action 收到 FormData → loader 重跑 → 无原生导航                                                                           | `09705e1b`                       |
| #651 静默吞错       | 8 处空 catch 补日志/rethrow-with-cause（adapter-vite ×5 文件 + data-context-store）                                                                                                                                                                                                                                                                    | `899906ba`                       |
| #652 KV 适配器      | 按 #648 决策降为文档：新增 `docs/current/ISR_KV_ADAPTER.md`（CacheAdapter 契约 + DenoKvIsrCache 参考实现 + 边缘部署前提）                                                                                                                                                                                                                              | `9e233bdf`                       |
| #653 Release 标注   | α8/α9 GitHub Release 已标 prerelease（isPrerelease=true 已验证）；STATUS/VERSION_PLAN 标注 α8 版本空洞                                                                                                                                                                                                                                                 | `ddfc10e0`                       |

## 过程中额外修复

- **`www/e2e/browser-bundle.ts` 潜伏缺陷**：Vite alias 对象形式会让 `@openelement/element` 前缀劫持 `@openelement/element/jsx-runtime`，任何含 JSX 的源码打包必炸（UNLOADABLE_DEPENDENCY）。已改数组形式 + 精确正则匹配——这是 #650 得以用真实组件源码测试的前提。

## 后续建议

- α8 的 npm 空洞不可回填（严格校验读 tag 树），保持现状标注即可；新守卫已确保同类事故未来会被 `release:evidence:check` 拦截。
- ISR 真正接线（`renderIsrResponse` 进请求时渲染 + KV 适配器实装）按计划归入 0.44。

---

## 引用时效复核（自动生成）

> 本附录由 `tools/check-audit-citations.ts` 生成。基线：当前工作树。
> 引用总数：0；漂移：0。

全部引用均能在基线中解析，无行号漂移。
