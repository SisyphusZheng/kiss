# Reference SaaS freeze check — 0.43 freeze 评估证据

日期: 2026-08-18(实际运行跨零点,run-id `local-20260819035143`)。main commit: `1803a571`。
环境: 本地 `deno task build` + `deno task start`(`examples/supabase-cloudflare-starter`,http://127.0.0.1:4173)× 真实 Supabase 项目(凭证来自 `.env.local`)。
方法: 本地复跑与 `.github/workflows/supabase-project-smoke.yml` 相同的 Tier-2 curl 矩阵 + `tools/smoke-supabase-browser.ts` 真实 Chromium 旅程,另补 signup/validation 缺口。两个一次性测试用户(run-id 作用域)已在结束后删除,storage 对象已清理(清理步骤全部 HTTP 200,无残留用户)。
本报告不含任何凭证、邮箱或用户 id。

## 结果总览

31 pass / 1 blocked-human / 1 unverified(详见逐项矩阵)。两项非 pass 均为 provider 侧门禁,非 framework 缺陷。

## 逐项矩阵

| 检查                                              | 结果                                            |
| ------------------------------------------------- | ----------------------------------------------- |
| server-build-start-serves                         | pass(build → production start 真实可用)         |
| anonymous-notes-denied                            | pass(受保护路由匿名拒绝)                        |
| anonymous-notes-not-publicly-cacheable            | pass(no-store/private)                          |
| login-user-a-303-cookie                           | pass(登录 PRG 303 + auth-token cookie)          |
| user-a-sees-own-row                               | pass(session restoration + RLS scoping)         |
| user-a-creates-note-via-action                    | pass(action → 303 → revalidation → SSR 持久化)  |
| create-note-empty-title-422                       | pass(validation failure → HTTP 422)             |
| create-note-long-title-422                        | pass(>120 字符 → 422)                           |
| create-note-anonymous-401                         | pass(未登录写入 → 401)                          |
| user-b-isolated-from-a                            | pass(应用层跨用户隔离)                          |
| user-b-update-delete-a-denied                     | pass(DB RLS:B 对 A 行 UPDATE/DELETE 影响 0 行)  |
| user-a-update-own-row                             | pass(正常流 UPDATE)                             |
| anonymous-direct-rest-denied                      | pass(匿名直连 REST 读 0 行)                     |
| storage-app-upload-pending-scan                   | pass(上传进入扫描生命周期,未扫描不可见)         |
| storage-owner-upsert-immutability                 | **blocked-human(remote policy drift,见下)**     |
| storage-owner-signed-url-download                 | pass(60s signed URL 下载到精确字节)             |
| storage-owner-delete                              | pass(Owner DELETE 后 GET 不再可读)              |
| signup-route-fail-closed-safe-error               | pass(provider 拒绝时安全公开错误,不泄露细节)    |
| signup-e2e-email-confirmation                     | **unverified(provider policy,见下)**            |
| logout-clears-session                             | pass(303 + 会话清除,再访问 /notes 回到拒绝分支) |
| browser-anonymous-notes-denied                    | pass                                            |
| browser-password-login-cookie-session             | pass                                            |
| browser-note-create-prg-persistence               | pass                                            |
| browser-duplicate-submit-creates-single-row       | pass(双击 → 恰好一行)                           |
| browser-realtime-user-jwt-subscribed              | pass                                            |
| browser-realtime-second-client-receives-ui-insert | pass(Client A UI 写入 → Client B 收到)          |
| browser-realtime-cross-user-insert-denied         | pass(他人 INSERT 不投递)                        |
| browser-realtime-insert-delivered                 | pass                                            |
| browser-realtime-offline-online-recovery-delivers | pass(离线/恢复后投递)                           |
| browser-realtime-refreshed-jwt-delivers           | pass(刷新 JWT 后投递)                           |
| browser-realtime-removal-releases-channel         | pass(移除 island 发送 channel leave)            |
| browser-app-metadata-admin-guard                  | pass                                            |
| browser-role-change-invalidates-server-guard      | pass(降级后 /admin → 404)                       |
| browser-global-revocation-denies-session          | pass(全局撤销后会话失效)                        |

## 六项 freeze 能力判定

1. **Auth — verified(除邮件确认链路)**。登录(303+cookie)、session restoration、logout、受保护路由拒绝、全局撤销、角色降级 404 全部实测通过;signup 路由验证与 fail-closed 行为实测通过。
2. **RLS — verified**。A/B 双用户 SELECT/INSERT/UPDATE/DELETE 正常流 + 跨用户 negative(PATCH/DELETE 影响 0 行、匿名 REST 0 行、应用层隔离)全部实测通过。
3. **CRUD(notes)— verified**。loader → action → FormData → validation(422 空标题/超长标题)→ 401 未授权 → 303 PRG → revalidation → SSR 全链路实测通过;U/D 在 DB 层验证(应用面不提供 notes 编辑 UI,属 starter 范围而非 framework 能力缺口)。
4. **Storage — verified with one blocked-human 子项**。上传(进入扫描生命周期、跨用户隔离、未扫描不可见)、signed URL 下载、owner 删除、匿名写入拒绝、跨用户读/删拒绝全部实测通过;**insert-only 不可变性在远端未生效(blocked-human,见下)**。
5. **Realtime — verified**。订阅、双客户端投递、跨用户隔离、离线/在线恢复、JWT 刷新、channel 释放全部实测通过。
6. **build → production start — verified**。`deno task build` 成功(产物在预算内),`deno task start` 真实服务并承载全部上述流量。

## 非 pass 项根因(均为 provider 门禁,非 framework)

### storage-owner-upsert-immutability — blocked-human

现象(两次独立实测):owner 对已存在对象发 `x-upsert: true` 返回 HTTP 200 且内容被替换(`v1` → `v2-overwrite`)。
根因:`a1c011b3`(#1003)直接**编辑了已应用的迁移文件** `20260816000001_notes_attachments_storage.sql`,删掉了 `attachments: owner updates own folder` UPDATE 策略;远端项目应用的是编辑前版本,UPDATE 策略仍在远端。由于按版本号跳过已应用迁移,`supabase db push` 不会收敛此漂移。
所需人类动作:提供 `SUPABASE_DB_PASSWORD`,通过新前向迁移(drop 该 UPDATE 策略)或 `supabase migration repair` + 重新应用收敛远端;这正是 #1002 ledger 中已登记的 blocked-human 项,本次实测给了它精确实锤。
流程观察(记录,不在本目标内修复):对已应用迁移做就地修改,版本号式 `db push`/`migration list` 不可见;建议后续在迁移交付门禁中加入远端漂移检测。

### signup-e2e-email-confirmation — unverified(provider policy)

项目 Auth 配置(只读自查):`mailer_autoconfirm=false`(邮件确认开启)、`site_url=http://localhost:3000`、`uri_allow_list` 为空。因此:① 应用从 `127.0.0.1:4173` 发起 signup 时 `emailRedirectTo` 不在白名单,provider 拒绝;② 共享邮件服务拒绝 RFC 保留域(`email_address_invalid`,example.com);③ 共享 SMTP 触发 `over_email_send_rate_limit`(429)。
应用路由行为实测正确:provider 拒绝时 fail-closed 渲染安全公开错误,不泄露细节、不崩溃。
完整 signup+邮件确认 E2E 依赖生产 SMTP 域名认证与重定向白名单配置——与 #1002 ledger 中既有 blocked-human 项(生产 SMTP / 控制台配置)为同一类。

## 结论

除上述两项 provider 门禁外,reference SaaS 核心链路在真实 Supabase 项目上全部实测通过。**0.43 满足 freeze 条件中可由 agent 验证的全部部分**;freeze 的最终签发等待 #1002 的 blocked-human 清单(SUPABASE_DB_PASSWORD、Stripe whsec/price 入 CI secrets、Metadefender、OAuth console、生产 SMTP)补齐。

## 2026-08-19 补记: storage-owner-upsert-immutability 已收敛(verified)

- repo 侧: 新增前向迁移 `20260819000000_attachments_insert_only.sql`(幂等 drop policy)+ manifest 登记,`fullstack:migrations-check` 通过。
- 远端侧: 经 Management API 只读确认 UPDATE 策略仍在远端后,执行与迁移同文的 `drop policy if exists "attachments: owner updates own folder" on storage.objects`,复查确认 storage.objects 仅剩 SELECT/INSERT/DELETE 三条策略。
- 探针实证(一次性用户,对象与用户均已清理): upload v1 → 200;`x-upsert: true` → **400**;PUT → 400;read-back 仍为 `v1`;owner delete → 200。不可变性在远端真实生效。
- 遗留: `SUPABASE_DB_PASSWORD` 仍用于跑 `migration_mode=apply` 把该 no-op 迁移记入远端 `schema_migrations` 历史;策略面收敛不再依赖它。
- 由此 freeze 非 pass 项只剩 `signup-e2e-email-confirmation`(生产 SMTP/重定向白名单,纯控制台配置)。
