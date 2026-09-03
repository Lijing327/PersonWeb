---
title: Entity Framework Core 性能优化技巧
slug: ef-core-performance
status: published
legacyId: 53
summary: 分享在使用 Entity Framework Core 时提升查询性能的实用技巧，包括查询优化、批量操作、缓存策略等。
date: 2024-11-20
publishAt: 2024-11-20T03:30:00.000Z
category: tech
source: manual
---

# Entity Framework Core 性能优化技巧

本站后端是 .NET 8 + EF Core。业务不复杂时也容易写出「看起来正常、数据库很累」的查询。下面是我实际排查时最常改的几类问题。

## 常见性能杀手

1. **N+1**：循环里再查关联表
2. **过度 Include**：一次拉整棵对象树
3. **缺索引**：按 slug、时间、状态过滤却无索引
4. **跟踪开销**：只读列表仍走默认 change tracker

## 1. 处理好关联加载

需要关联时一次性 Include，或用投影只要用到的字段：

```csharp
List<BlogDto> list = await context.Blogs
    .AsNoTracking()
    .Where(b => b.Status == "published")
    .OrderByDescending(b => b.PublishAt)
    .Select(b => new BlogDto
    {
        Id = b.Id,
        Title = b.Title,
        Slug = b.Slug,
        PostCount = b.Posts.Count
    })
    .ToListAsync();
```

投影通常比大 `Include` 更省。

## 2. 只读查询用 AsNoTracking

```csharp
Article? article = await context.Articles
    .AsNoTracking()
    .FirstOrDefaultAsync(a => a.Slug == slug);
```

后台写操作再走跟踪实体；公开列表、详情默认 NoTracking。

## 3. 分页与过滤下推数据库

```csharp
IQueryable<Article> query = context.Articles.AsNoTracking()
    .Where(a => a.Status == status);

int total = await query.CountAsync();
List<Article> items = await query
    .OrderByDescending(a => a.Date)
    .Skip((page - 1) * pageSize)
    .Take(pageSize)
    .ToListAsync();
```

不要 `ToList()` 后再在内存里 Skip/Take。

## 4. 批量写

```csharp
context.Articles.AddRange(entities);
await context.SaveChangesAsync();
```

大量插入可考虑 `ExecuteUpdate` / 批量扩展或原生 SQL；小批量 `AddRange` + 一次 `SaveChanges` 通常够用。

## 5. 索引与 SQL 验证

- 高频条件列：`slug`、`status`、`publish_at`
- 开发时打开敏感日志或用 `ToQueryString()` 看真实 SQL
- 怀疑慢查询时用 MySQL `EXPLAIN`

## 6. 其他实用点

| 技巧 | 说明 |
| --- | --- |
| 编译查询 | 极热路径可考虑 EF 编译查询 |
| 连接池 | 连接字符串合理配置 Max Pool Size |
| 避免懒加载陷阱 | 生产环境慎开懒加载，防止隐式 N+1 |
| 超时 | 长报表单独设 CommandTimeout |

## 小结

EF Core 慢，多半不是框架「天生慢」，而是 **查多了、查大了、没索引、还在跟踪**。先 AsNoTracking + 投影 + 分页，再盯 SQL 与索引，通常就能回到正常水位。
