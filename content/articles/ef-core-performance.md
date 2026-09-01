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

## 常见性能问题

- N+1 查询问题
- 过度加载数据
- 缺少索引

## 优化方法

### 1. 使用 Include 预加载

```csharp
var blogs = context.Blogs
    .Include(b => b.Posts)
    .ToList();
```

### 2. 使用 AsNoTracking

对于只读查询，使用 `AsNoTracking()` 可以提升性能。

### 3. 批量操作

使用 `AddRange` 和 `SaveChanges` 批量插入数据。
