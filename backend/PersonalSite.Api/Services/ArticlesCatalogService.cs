using System.Text.Json;
using Microsoft.Extensions.Options;

namespace PersonalSite.Api.Services;

public interface IArticlesCatalogService
{
    IReadOnlyList<ArticleCatalogItem> GetRecentPublished(int take = 10);
}

public sealed class ArticleCatalogItem
{
    public string Slug { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Category { get; set; }
}

public sealed class ArticlesCatalogOptions
{
    public const string SectionName = "ArticlesCatalog";
    public string? CatalogPath { get; set; }
}

/// <summary>
/// Phase 4B-3: AI 文章上下文从 Git 导出的 _catalog.json 读取（仅标题，无正文）。
/// </summary>
public class ArticlesCatalogService : IArticlesCatalogService
{
    private readonly ArticlesCatalogOptions _options;
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<ArticlesCatalogService> _logger;
    private readonly object _lock = new();
    private List<ArticleCatalogItem>? _cache;
    private DateTime _cacheWriteUtc = DateTime.MinValue;

    public ArticlesCatalogService(
        IOptions<ArticlesCatalogOptions> options,
        IWebHostEnvironment environment,
        ILogger<ArticlesCatalogService> logger)
    {
        _options = options.Value;
        _environment = environment;
        _logger = logger;
    }

    public IReadOnlyList<ArticleCatalogItem> GetRecentPublished(int take = 10)
    {
        var path = ResolveCatalogPath();
        if (path == null || !File.Exists(path))
        {
            _logger.LogWarning("Articles catalog 未找到，AI 文章上下文为空");
            return Array.Empty<ArticleCatalogItem>();
        }

        var writeTime = File.GetLastWriteTimeUtc(path);
        lock (_lock)
        {
            if (_cache != null && writeTime == _cacheWriteUtc)
            {
                return _cache.Take(take).ToList();
            }
        }

        try
        {
            var json = File.ReadAllText(path);
            using var doc = JsonDocument.Parse(json);
            var articles = new List<ArticleCatalogItem>();
            if (doc.RootElement.TryGetProperty("articles", out var arr) && arr.ValueKind == JsonValueKind.Array)
            {
                foreach (var item in arr.EnumerateArray())
                {
                    var title = item.TryGetProperty("title", out var t) ? t.GetString() : null;
                    var slug = item.TryGetProperty("slug", out var s) ? s.GetString() : null;
                    if (string.IsNullOrWhiteSpace(title) || string.IsNullOrWhiteSpace(slug)) continue;
                    articles.Add(new ArticleCatalogItem
                    {
                        Title = title!,
                        Slug = slug!,
                        Category = item.TryGetProperty("category", out var c) ? c.GetString() : null,
                    });
                }
            }

            lock (_lock)
            {
                _cache = articles;
                _cacheWriteUtc = writeTime;
            }

            return articles.Take(take).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "读取 Articles catalog 失败: {Path}", path);
            return Array.Empty<ArticleCatalogItem>();
        }
    }

    private string? ResolveCatalogPath()
    {
        if (!string.IsNullOrWhiteSpace(_options.CatalogPath) && File.Exists(_options.CatalogPath))
        {
            return _options.CatalogPath;
        }

        var synced = Path.Combine(AppContext.BaseDirectory, "content-sync", "articles", "_catalog.json");
        if (File.Exists(synced)) return synced;

        var repoRelative = Path.GetFullPath(
            Path.Combine(_environment.ContentRootPath, "..", "..", "content", "articles", "_catalog.json"));
        return File.Exists(repoRelative) ? repoRelative : null;
    }
}
