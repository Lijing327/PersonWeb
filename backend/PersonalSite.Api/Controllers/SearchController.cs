using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PersonalSite.Api.Data;
using PersonalSite.Api.Models;

namespace PersonalSite.Api.Controllers;

/// <summary>
/// 全文搜索控制器
/// 使用 MySQL 全文索引进行搜索
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class SearchController : ControllerBase
{
    private readonly AppDbContext _context;

    public SearchController(AppDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// 全文搜索
    /// </summary>
    /// <param name="keyword">搜索关键词</param>
    /// <param name="type">搜索类型：all/articles/projects/knowledge/tools/themes</param>
    /// <param name="page">页码</param>
    /// <param name="pageSize">每页数量</param>
    /// <param name="sort">排序方式：relevance（相关性）/time（时间）</param>
    /// <returns></returns>
    [HttpGet]
    public async Task<ActionResult<ApiResponse<object>>> Search(
        [FromQuery] string keyword,
        [FromQuery] string type = "all",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string sort = "relevance")
    {
        if (string.IsNullOrWhiteSpace(keyword))
        {
            return Ok(ApiResponse.Error("搜索关键词不能为空", 400));
        }

        // 转义特殊字符，防止 SQL 注入
        var escapedKeyword = keyword.Replace("'", "''").Replace("\\", "\\\\");

        var results = new SearchResults
        {
            Keyword = keyword,
            Type = type,
            Total = 0,
            Articles = new List<SearchResultItem>(),
            Projects = new List<SearchResultItem>(),
            KnowledgeBases = new List<SearchResultItem>(),
            Tools = new List<SearchResultItem>(),
            Themes = new List<SearchResultItem>()
        };

        // 使用 LIKE 搜索（兼容性更好，全文索引需要特殊配置）
        // 搜索文章
        // Phase 4B-3: 正文 SoT 已迁 Git。此处仅保留 title/summary 作为 LEGACY 降级；
        // 正式文章全文检索走 Nitro /api/search（Git index），禁止再读 content_md。
        if (type == "all" || type == "articles")
        {
            var articleQuery = _context.Articles
                .Where(a => a.Status == 1 && a.ParentId == null)
                .Where(a => a.Title.Contains(keyword) ||
                           (a.Summary != null && a.Summary.Contains(keyword)));

            var articleTotal = await articleQuery.CountAsync();
            
            // 根据排序方式排序
            IQueryable<Article> sortedArticleQuery = sort == "time" 
                ? articleQuery.OrderByDescending(a => a.CreatedAt)
                : articleQuery.OrderByDescending(a => 
                    (a.Title.Contains(keyword) ? 3 : 0) + 
                    (a.Summary != null && a.Summary.Contains(keyword) ? 2 : 0))
                    .ThenByDescending(a => a.CreatedAt);
            
            var articles = await sortedArticleQuery
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Include(a => a.Category)
                .Select(a => new SearchResultItem
                {
                    Id = a.Id.ToString(),
                    Title = a.Title,
                    Summary = a.Summary ?? "",
                    Content = a.Summary ?? "",
                    Type = "article",
                    Url = $"/blog/{a.Slug ?? a.Id.ToString()}",
                    CreatedAt = a.CreatedAt,
                    Category = a.Category != null ? a.Category.Name : null
                })
                .ToListAsync();

            results.Articles = articles;
            results.Total += articleTotal;
        }

        // 搜索项目
        if (type == "all" || type == "projects")
        {
            var projectQuery = _context.Projects
                .Where(p => p.Title.Contains(keyword) ||
                           (p.Description != null && p.Description.Contains(keyword)) ||
                           (p.Content != null && p.Content.Contains(keyword)));

            var projectTotal = await projectQuery.CountAsync();
            
            // 根据排序方式排序
            IQueryable<Project> sortedProjectQuery = sort == "time"
                ? projectQuery.OrderByDescending(p => p.CreatedAt)
                : projectQuery.OrderByDescending(p =>
                    (p.Title.Contains(keyword) ? 3 : 0) +
                    (p.Description != null && p.Description.Contains(keyword) ? 2 : 0) +
                    (p.Content != null && p.Content.Contains(keyword) ? 1 : 0))
                    .ThenByDescending(p => p.CreatedAt);
            
            var projects = await sortedProjectQuery
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(p => new SearchResultItem
                {
                    Id = p.Id.ToString(),
                    Title = p.Title,
                    Summary = p.Description ?? "",
                    Content = p.Content ?? "",
                    Type = "project",
                    Url = $"/projects/detail-{p.Id}",
                    CreatedAt = p.CreatedAt
                })
                .ToListAsync();

            results.Projects = projects;
            results.Total += projectTotal;
        }

        // 搜索知识库
        if (type == "all" || type == "knowledge")
        {
            var knowledgeQuery = _context.KnowledgeBases
                .Where(k => k.Status == 1) // 只搜索已发布的知识库
                .Where(k => k.Title.Contains(keyword) ||
                           (k.Content != null && k.Content.Contains(keyword)));

            var knowledgeTotal = await knowledgeQuery.CountAsync();
            
            // 根据排序方式排序
            IQueryable<KnowledgeBase> sortedKnowledgeQuery = sort == "time"
                ? knowledgeQuery.OrderByDescending(k => k.CreatedAt)
                : knowledgeQuery.OrderByDescending(k =>
                    (k.Title.Contains(keyword) ? 2 : 0) +
                    (k.Content != null && k.Content.Contains(keyword) ? 1 : 0))
                    .ThenByDescending(k => k.CreatedAt);
            
            var knowledgeBases = await sortedKnowledgeQuery
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(k => new SearchResultItem
                {
                    Id = k.Id.ToString(),
                    Title = k.Title,
                    Summary = "",
                    Content = k.Content ?? "",
                    Type = "knowledge",
                    Url = $"/knowledge/{k.Id}",
                    CreatedAt = k.CreatedAt,
                    Category = k.Category
                })
                .ToListAsync();

            results.KnowledgeBases = knowledgeBases;
            results.Total += knowledgeTotal;
        }

        // 搜索工具
        if (type == "all" || type == "tools")
        {
            var toolQuery = _context.Tools
                .Where(t => t.Status == "published") // 只搜索已发布的工具
                .Where(t => t.Name.Contains(keyword) ||
                           (t.Description != null && t.Description.Contains(keyword)) ||
                           (t.DetailedDescription != null && t.DetailedDescription.Contains(keyword)));

            var toolTotal = await toolQuery.CountAsync();
            
            // 根据排序方式排序
            IQueryable<Tool> sortedToolQuery = sort == "time"
                ? toolQuery.OrderByDescending(t => t.CreatedAt)
                : toolQuery.OrderByDescending(t =>
                    (t.Name.Contains(keyword) ? 3 : 0) +
                    (t.Description != null && t.Description.Contains(keyword) ? 2 : 0) +
                    (t.DetailedDescription != null && t.DetailedDescription.Contains(keyword) ? 1 : 0))
                    .ThenByDescending(t => t.CreatedAt);
            
            var tools = await sortedToolQuery
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Include(t => t.Category)
                .Select(t => new SearchResultItem
                {
                    Id = t.Id.ToString(),
                    Title = t.Name,
                    Summary = t.Description ?? "",
                    Content = t.DetailedDescription ?? "",
                    Type = "tool",
                    Url = $"/tools/{t.Slug ?? t.Id.ToString()}",
                    CreatedAt = t.CreatedAt,
                    Category = t.Category != null ? t.Category.Name : null
                })
                .ToListAsync();

            results.Tools = tools;
            results.Total += toolTotal;
        }

        // 搜索主题
        if (type == "all" || type == "themes")
        {
            var themeQuery = _context.ThemeStores
                .Where(t => t.Status == "published") // 只搜索已发布的主题
                .Where(t => t.Name.Contains(keyword) ||
                           (t.Description != null && t.Description.Contains(keyword)));

            var themeTotal = await themeQuery.CountAsync();
            
            // 根据排序方式排序
            IQueryable<ThemeStore> sortedThemeQuery = sort == "time"
                ? themeQuery.OrderByDescending(t => t.CreatedAt)
                : themeQuery.OrderByDescending(t =>
                    (t.Name.Contains(keyword) ? 2 : 0) +
                    (t.Description != null && t.Description.Contains(keyword) ? 1 : 0))
                    .ThenByDescending(t => t.CreatedAt);
            
            var themes = await sortedThemeQuery
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(t => new SearchResultItem
                {
                    Id = t.Id.ToString(),
                    Title = t.Name,
                    Summary = t.Description ?? "",
                    Content = "",
                    Type = "theme",
                    Url = $"/themes/{t.Slug ?? t.Id.ToString()}",
                    CreatedAt = t.CreatedAt,
                    Category = t.Category
                })
                .ToListAsync();

            results.Themes = themes;
            results.Total += themeTotal;
        }

        return Ok(ApiResponse.Success(results));
    }
}

/// <summary>
/// 搜索结果
/// </summary>
public class SearchResults
{
    public string Keyword { get; set; } = string.Empty;
    public string Type { get; set; } = "all";
    public int Total { get; set; }
    public List<SearchResultItem> Articles { get; set; } = new();
    public List<SearchResultItem> Projects { get; set; } = new();
    public List<SearchResultItem> KnowledgeBases { get; set; } = new();
    public List<SearchResultItem> Tools { get; set; } = new();
    public List<SearchResultItem> Themes { get; set; } = new();
}

/// <summary>
/// 搜索结果项
/// </summary>
public class SearchResultItem
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public string? Category { get; set; }
}

