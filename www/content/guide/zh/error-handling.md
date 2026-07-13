---
title: '错误处理'
section: '生产'
label: '错误处理'
order: 30
---

# 错误处理

openElement 区分 build-time framework errors、route render errors、server response errors 和 browser island
failures。

## 构建错误

构建期错误应该明确失败。缺失 optional package 可以降级，但已经存在的包如果 import 时报错，必须在诊断里可见。

## Route render errors

SSG 和 SSR route render failure 会记录 route path。生产响应不泄漏内部 stack trace。

## Server response errors

server routes 使用标准 `Response` 的 status 与 message 语义。业务性错误应带清晰 HTTP status
和 message；编程错误应让 build 或 server route 失败。

## Browser errors

Island upgrade failure 应限制在 island 内，并能通过浏览器日志和 e2e 测试诊断。
