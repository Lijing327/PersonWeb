using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PersonalSite.Api.Data;
using PersonalSite.Api.Models;
using System.Security.Claims;

namespace PersonalSite.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ArticlesController : ControllerBase
{
    private readonly AppDbContext _context;

    public ArticlesController(AppDbContext context)
    {
        _context = context;
    }

    private bool IsAuthenticatedAdmin => User.Identity?.IsAuthenticated == true;

    /// <summary>
    /// 公开读路径：仅已发布的主版本（非 parent 历史快照）
    /// </summary>
    private static IQueryable<Article> ApplyPublicArticleFilter(IQueryable<Article> query) =>
        query.Where(a => a.Status == 1 && a.ParentId == null);

    /// <summary>
    /// 获取文章列表
    /// </summary>
    /// <param name="page">页码</param>
    /// <param name="pageSize">每页数量</param>
    /// <param name="status">状态筛选 (0-草稿 1-已发布 2-下线)</param>
    /// <param name="sourceType">来源类型筛选 (manual/ai_generated/ai_optimized/imported)</param>
    /// <param name="categoryId">分类ID筛选</param>
    /// <param name="keyword">关键词搜索</param>
    /// <returns></returns>
    [HttpGet]
    public async Task<ActionResult<ApiResponse<object>>> GetArticles(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] sbyte? status = null,
        [FromQuery] string? sourceType = null,
        [FromQuery] long? categoryId = null,
        [FromQuery] string? keyword = null)
    {
        var query = _context.Articles.AsQueryable();

        if (!IsAuthenticatedAdmin)
        {
            query = ApplyPublicArticleFilter(query);
        }
        else if (status.HasValue)
        {
            query = query.Where(a => a.Status == status.Value);
        }

        if (!string.IsNullOrEmpty(sourceType))
        {
            query = query.Where(a => a.SourceType == sourceType);
        }

        if (categoryId.HasValue)
        {
            query = query.Where(a => a.CategoryId == categoryId.Value);
        }

        if (!string.IsNullOrEmpty(keyword))
        {
            query = query.Where(a => a.Title.Contains(keyword) || (a.Summary != null && a.Summary.Contains(keyword)));
        }

        var total = await query.CountAsync();
        
        var articles = await query
            .OrderByDescending(a => a.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new
            {
                a.Id,
                a.Title,
                a.Slug,
                a.Summary,
                a.CoverUrl,
                a.Status,
                a.SourceType,
                a.CreatedAt,
                a.PublishTime,
                CategoryName = a.Category != null ? a.Category.Name : null
            })
            .ToListAsync();

        return Ok(ApiResponse.Success(new { Total = total, List = articles }));
    }

    /// <summary>
    /// 获取文章详情
    /// </summary>
    /// <param name="id"></param>
    /// <returns></returns>
    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<Article>>> GetArticle(long id)
    {
        var article = await _context.Articles
            .Include(a => a.Category)
            .Include(a => a.Tags)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (article == null)
        {
            return Ok(ApiResponse<Article>.Error("文章不存在", 404));
        }

        if (!IsAuthenticatedAdmin && (article.Status != 1 || article.ParentId != null))
        {
            return Ok(ApiResponse<Article>.Error("文章不存在", 404));
        }
        
        return Ok(ApiResponse<Article>.Success(article));
    }

    /// <summary>
    /// 根据 Slug 获取文章详情
    /// </summary>
    /// <param name="slug"></param>
    /// <returns></returns>
    [HttpGet("slug/{slug}")]
    public async Task<ActionResult<ApiResponse<Article>>> GetArticleBySlug(string slug)
    {
        var article = await _context.Articles
            .Include(a => a.Category)
            .Include(a => a.Tags)
            .FirstOrDefaultAsync(a => a.Slug == slug);

        if (article == null)
        {
            return Ok(ApiResponse<Article>.Error("文章不存在", 404));
        }

        if (!IsAuthenticatedAdmin && (article.Status != 1 || article.ParentId != null))
        {
            return Ok(ApiResponse<Article>.Error("文章不存在", 404));
        }
        
        return Ok(ApiResponse<Article>.Success(article));
    }

    /// <summary>
    /// 创建/更新文章 — LEGACY_READONLY (Phase 4B-3)。
    /// 正文 SoT 已迁 Git；禁止通过 API 写入 content_md / content_html / status 等内容事实。
    /// </summary>
    [HttpPost]
    [Authorize] 
    [Obsolete("Articles body SoT is Git. Do not write content via this endpoint.")]
    public Task<ActionResult<ApiResponse>> SaveArticle([FromBody] Article article) =>
        Task.FromResult<ActionResult<ApiResponse>>(
            Ok(ApiResponse.Error(
                "文章正文已迁至 Git SoT：禁止通过 POST /Articles 写入正文。请在 content/articles 中维护。",
                403)));

    /// <summary>
    /// 删除文章（运营动作：仍允许，但正式内容删除应同步删 Git 文件）
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize]
    public async Task<ActionResult<ApiResponse>> DeleteArticle(long id)
    {
        var article = await _context.Articles.FindAsync(id);
        if (article == null)
        {
            return Ok(ApiResponse.Error("文章不存在", 404));
        }

        _context.Articles.Remove(article);
        await _context.SaveChangesAsync();

        return Ok(ApiResponse.Success(null, "删除成功"));
    }

    /// <summary>
    /// 获取文章版本历史
    /// </summary>
    [HttpGet("{id}/versions")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<object>>> GetVersions(long id)
    {
        var versions = await _context.Articles
            .Where(a => a.ParentId == id || a.Id == id)
            .OrderByDescending(a => a.Version)
            .Select(a => new
            {
                a.Id,
                a.Version,
                a.Title,
                a.UpdatedAt,
                a.Status
            })
            .ToListAsync();

        return Ok(ApiResponse.Success(versions));
    }

    /// <summary>
    /// 获取指定版本的文章内容
    /// </summary>
    [HttpGet("{id}/versions/{versionId}")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<Article>>> GetVersion(long id, long versionId)
    {
        var version = await _context.Articles
            .Include(a => a.Category)
            .Include(a => a.Tags)
            .FirstOrDefaultAsync(a => a.Id == versionId && (a.ParentId == id || a.Id == id));

        if (version == null)
        {
            return Ok(ApiResponse<Article>.Error("版本不存在", 404));
        }

        return Ok(ApiResponse<Article>.Success(version));
    }

    /// <summary>
    /// 恢复指定版本
    /// </summary>
    /// <summary>
    /// LEGACY_READONLY — 正文版本由 Git history 管理，禁止写回 DB。
    /// </summary>
    [HttpPost("{id}/versions/{versionId}/restore")]
    [Authorize]
    public Task<ActionResult<ApiResponse>> RestoreVersion(long id, long versionId) =>
        Task.FromResult<ActionResult<ApiResponse>>(
            Ok(ApiResponse.Error("版本恢复已退役（LEGACY_READONLY）：请使用 Git history 管理正文", 403)));

    /// <summary>
    /// 内容中枢总览接口
    /// </summary>
    [HttpGet("overview")]
    public async Task<ActionResult<ApiResponse<object>>> GetContentHubOverview()
    {
        try
        {
            // 文章统计
            var articleStats = new
            {
                Total = await _context.Articles.CountAsync(),
                Draft = await _context.Articles.CountAsync(a => a.Status == 0),
                Published = await _context.Articles.CountAsync(a => a.Status == 1),
                Offline = await _context.Articles.CountAsync(a => a.Status == 2),
                AiGenerated = await _context.Articles.CountAsync(a => a.SourceType == "ai_generated"),
                AiOptimized = await _context.Articles.CountAsync(a => a.SourceType == "ai_optimized"),
                Manual = await _context.Articles.CountAsync(a => a.SourceType == "manual")
            };

            // 最近更新的文章（取最新的5条）
            var recentArticles = await _context.Articles
                .Where(a => a.Status != 2) // 排除下线的
                .OrderByDescending(a => a.UpdatedAt)
                .Take(5)
                .Select(a => new
                {
                    a.Id,
                    a.Title,
                    a.Status,
                    a.SourceType,
                    a.UpdatedAt,
                    CategoryName = a.Category != null ? a.Category.Name : null
                })
                .ToListAsync();

            // 处理返回的数据（在内存中进行 switch 操作）
            var processedArticles = recentArticles.Select(a => new
            {
                a.Id,
                a.Title,
                a.Status,
                a.SourceType,
                a.UpdatedAt,
                TypeName = a.CategoryName ?? "未分类",
                SourceTypeName = a.SourceType switch
                {
                    "manual" => "手动创建",
                    "ai_generated" => "AI生成",
                    "ai_optimized" => "AI优化",
                    "imported" => "导入",
                    _ => "未知"
                },
                StatusName = a.Status switch
                {
                    0 => "草稿",
                    1 => "已发布",
                    2 => "下线",
                    _ => "未知"
                }
            }).ToList();

            // 项目统计（Project.Status: Active/Completed/Archived）
            var projectStats = new
            {
                Total = await _context.Projects.CountAsync(),
                Published = await _context.Projects.CountAsync(p => p.Status == "Active" || p.Status == "Completed")
            };

            // 工具统计（Tool.Status: draft/published）
            var toolStats = new
            {
                Total = await _context.Tools.CountAsync(),
                Published = await _context.Tools.CountAsync(t => t.Status == "published")
            };

            // 文档统计（Document.Status: pending/processing/completed/failed）
            var docStats = new
            {
                Total = await _context.Documents.CountAsync(),
                Published = await _context.Documents.CountAsync(d => d.Status == "completed")
            };

            return Ok(ApiResponse.Success(new
            {
                Articles = articleStats,
                RecentArticles = processedArticles,
                Projects = projectStats,
                Tools = toolStats,
                Documents = docStats
            }));
        }
        catch (Exception ex)
        {
            return Ok(ApiResponse.Error($"获取总览数据失败: {ex.Message}"));
        }
    }
}
