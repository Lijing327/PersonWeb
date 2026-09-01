using System.Net.Http.Headers;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using PersonalSite.Api.Models;

namespace PersonalSite.Api.Controllers;

/// <summary>
/// GitHub 公开数据代理（供前台案例页图表等使用）
/// 路径与 useApi 约定一致：GET /api/GitHub/stats?repo=owner/name&amp;type=activity
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class GitHubController : ControllerBase
{
    private static readonly Regex RepoPattern = new(
        @"^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$",
        RegexOptions.Compiled);

    private static readonly TimeSpan CacheTtl = TimeSpan.FromHours(1);

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IMemoryCache _memoryCache;
    private readonly IConfiguration _configuration;
    private readonly ILogger<GitHubController> _logger;

    public GitHubController(
        IHttpClientFactory httpClientFactory,
        IMemoryCache memoryCache,
        IConfiguration configuration,
        ILogger<GitHubController> logger)
    {
        _httpClientFactory = httpClientFactory;
        _memoryCache = memoryCache;
        _configuration = configuration;
        _logger = logger;
    }

    /// <summary>
    /// 获取仓库统计。type: activity（默认提交活跃度）| languages | contributions
    /// </summary>
    [HttpGet("stats")]
    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public async Task<ActionResult<ApiResponse<object>>> GetStats(
        [FromQuery] string? repo,
        [FromQuery] string type = "activity",
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(repo) || !RepoPattern.IsMatch(repo))
        {
            return Ok(ApiResponse.Error("Repo is required and must be owner/name", 400));
        }

        string normalizedType = string.IsNullOrWhiteSpace(type) ? "activity" : type.Trim().ToLowerInvariant();
        if (normalizedType != "activity" && normalizedType != "languages" && normalizedType != "contributions")
        {
            return Ok(ApiResponse.Error("type must be activity, languages, or contributions", 400));
        }

        string cacheKey = $"github:stats:{repo}:{normalizedType}";
        if (_memoryCache.TryGetValue(cacheKey, out object? cached) && cached != null)
        {
            return Ok(ApiResponse.Success(cached));
        }

        object result;
        try
        {
            result = await FetchFromGitHubAsync(repo, normalizedType, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "GitHub API 请求失败: {Repo} type={Type}", repo, normalizedType);
            result = CreateEmptyResult(normalizedType);
        }

        _memoryCache.Set(cacheKey, result, CacheTtl);
        return Ok(ApiResponse.Success(result));
    }

    private async Task<object> FetchFromGitHubAsync(
        string repo,
        string type,
        CancellationToken cancellationToken)
    {
        HttpClient httpClient = _httpClientFactory.CreateClient();
        using HttpRequestMessage request = BuildGitHubRequest(repo, type);

        using HttpResponseMessage response = await httpClient.SendAsync(request, cancellationToken);
        string body = await response.Content.ReadAsStringAsync(cancellationToken);

        // GitHub stats 在计算中时可能返回 202，按空结果处理
        if ((int)response.StatusCode == 202)
        {
            return CreateEmptyResult(type);
        }

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning(
                "GitHub API HTTP {StatusCode} for {Repo} type={Type}: {Body}",
                (int)response.StatusCode,
                repo,
                type,
                Truncate(body, 200));
            return CreateEmptyResult(type);
        }

        if (type == "languages")
        {
            return ParseLanguages(body);
        }

        if (type == "contributions")
        {
            return ParseContributions(body);
        }

        List<GitHubCommitActivityWeek>? weeks = JsonSerializer.Deserialize<List<GitHubCommitActivityWeek>>(
            body,
            JsonOptions());
        return weeks ?? new List<GitHubCommitActivityWeek>();
    }

    private HttpRequestMessage BuildGitHubRequest(string repo, string type)
    {
        string path = type switch
        {
            "languages" => $"repos/{repo}/languages",
            "contributions" => $"repos/{repo}",
            _ => $"repos/{repo}/stats/commit_activity"
        };

        HttpRequestMessage request = new HttpRequestMessage(
            HttpMethod.Get,
            $"https://api.github.com/{path}");

        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/vnd.github+json"));
        request.Headers.TryAddWithoutValidation("X-GitHub-Api-Version", "2022-11-28");
        request.Headers.UserAgent.ParseAdd("PersonalSite.Api");

        string? token = _configuration["GitHub:Token"]
            ?? _configuration["GITHUB_TOKEN"]
            ?? Environment.GetEnvironmentVariable("GITHUB_TOKEN");

        if (!string.IsNullOrWhiteSpace(token))
        {
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        }

        return request;
    }

    private static object CreateEmptyResult(string type)
    {
        if (type == "languages")
        {
            return new List<GitHubLanguageStat>();
        }

        if (type == "contributions")
        {
            return new GitHubRepoContributions();
        }

        return new List<GitHubCommitActivityWeek>();
    }

    private static List<GitHubLanguageStat> ParseLanguages(string body)
    {
        Dictionary<string, long>? map = JsonSerializer.Deserialize<Dictionary<string, long>>(body, JsonOptions());
        if (map == null || map.Count == 0)
        {
            return new List<GitHubLanguageStat>();
        }

        long total = 0;
        foreach (KeyValuePair<string, long> pair in map)
        {
            total += pair.Value;
        }

        if (total <= 0)
        {
            return new List<GitHubLanguageStat>();
        }

        List<GitHubLanguageStat> list = new List<GitHubLanguageStat>();
        foreach (KeyValuePair<string, long> pair in map)
        {
            list.Add(new GitHubLanguageStat
            {
                Language = pair.Key,
                Bytes = pair.Value,
                Percentage = ((pair.Value * 100.0) / total).ToString("0.00")
            });
        }

        list.Sort(static (GitHubLanguageStat a, GitHubLanguageStat b) => b.Bytes.CompareTo(a.Bytes));
        return list;
    }

    private static GitHubRepoContributions ParseContributions(string body)
    {
        using JsonDocument document = JsonDocument.Parse(body);
        JsonElement root = document.RootElement;

        return new GitHubRepoContributions
        {
            Stars = ReadInt(root, "stargazers_count"),
            Forks = ReadInt(root, "forks_count"),
            Watchers = ReadInt(root, "watchers_count"),
            OpenIssues = ReadInt(root, "open_issues_count"),
            Size = ReadInt(root, "size"),
            CreatedAt = ReadString(root, "created_at"),
            UpdatedAt = ReadString(root, "updated_at")
        };
    }

    private static int ReadInt(JsonElement root, string name)
    {
        if (root.TryGetProperty(name, out JsonElement value) && value.TryGetInt32(out int number))
        {
            return number;
        }

        return 0;
    }

    private static string? ReadString(JsonElement root, string name)
    {
        if (root.TryGetProperty(name, out JsonElement value) && value.ValueKind == JsonValueKind.String)
        {
            return value.GetString();
        }

        return null;
    }

    private static JsonSerializerOptions JsonOptions()
    {
        return new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };
    }

    private static string Truncate(string text, int maxLength)
    {
        if (string.IsNullOrEmpty(text) || text.Length <= maxLength)
        {
            return text;
        }

        return text.Substring(0, maxLength);
    }
}

/// <summary>GitHub commit_activity 周统计</summary>
public class GitHubCommitActivityWeek
{
    public int Total { get; set; }
    public long Week { get; set; }
    public int[] Days { get; set; } = Array.Empty<int>();
}

/// <summary>语言占比</summary>
public class GitHubLanguageStat
{
    public string Language { get; set; } = string.Empty;
    public long Bytes { get; set; }
    public string Percentage { get; set; } = "0.00";
}

/// <summary>仓库贡献摘要</summary>
public class GitHubRepoContributions
{
    public int Stars { get; set; }
    public int Forks { get; set; }
    public int Watchers { get; set; }
    public int OpenIssues { get; set; }
    public int Size { get; set; }
    public string? CreatedAt { get; set; }
    public string? UpdatedAt { get; set; }
}
