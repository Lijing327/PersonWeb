using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using PersonalSite.Api.Data;
using PersonalSite.Api.Models;
using PersonalSite.Api.Services;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;

namespace PersonalSite.Api.Controllers;

/// <summary>
/// AI 聊天控制器
/// 前台访客的 AI 智能助手
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class AIController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly HttpClient _httpClient;
    private readonly AiServiceOptions _aiServiceOptions;
    private readonly IWorkContentService _workContentService;
    private readonly IArticlesCatalogService _articlesCatalog;
    private readonly ILogger<AIController> _logger;

    public AIController(
        AppDbContext context,
        IHttpClientFactory httpClientFactory,
        IOptions<AiServiceOptions> aiServiceOptions,
        IWorkContentService workContentService,
        IArticlesCatalogService articlesCatalog,
        ILogger<AIController> logger)
    {
        _context = context;
        _httpClient = httpClientFactory.CreateClient();
        _aiServiceOptions = aiServiceOptions.Value;
        _workContentService = workContentService;
        _articlesCatalog = articlesCatalog;
        _logger = logger;

        // 配置 HttpClient
        _httpClient.BaseAddress = new Uri(_aiServiceOptions.BaseUrl);
        _httpClient.Timeout = TimeSpan.FromSeconds(_aiServiceOptions.TimeoutSeconds);
    }

    /// <summary>
    /// AI 聊天接口
    /// 通过 HTTP 调用 Python AI 服务
    /// </summary>
    [HttpPost("chat")]
    public async Task<ActionResult<ApiResponse<object>>> Chat([FromBody] ChatRequest request)
    {
        try
        {
            _logger.LogInformation("收到前台 AI 聊天请求: MessageLength={Length}, HistoryCount={Count}",
                request.Message?.Length ?? 0, request.History?.Count ?? 0);

            // 构建系统提示词（需要查询数据库获取文章和项目信息）
            var systemPrompt = BuildSystemPrompt();

            // 构建消息列表
            var messages = new List<WebsiteChatMessageDto>
            {
                new WebsiteChatMessageDto { Role = "system", Content = systemPrompt }
            };

            // 添加历史消息
            if (request.History != null && request.History.Count > 0)
            {
                foreach (var msg in request.History)
                {
                    messages.Add(new WebsiteChatMessageDto
                    {
                        Role = msg.Role,
                        Content = msg.Content
                    });
                }
            }

            // 添加当前消息
            messages.Add(new WebsiteChatMessageDto
            {
                Role = "user",
                Content = request.Message ?? string.Empty
            });

            // 构建 Python 服务请求
            var pythonRequest = new WebsiteChatRequestDto
            {
                Messages = messages,
                Scene = "website-chat",
                Extra = new Dictionary<string, object>
                {
                    { "page", "home" } // 可以根据需要传递页面信息
                }
            };

            // 调用 Python AI 服务
            var internalToken = _aiServiceOptions.InternalToken ?? "default-internal-token-change-in-production";
            var baseAddress = _httpClient.BaseAddress?.ToString().TrimEnd('/') ?? _aiServiceOptions.BaseUrl.TrimEnd('/');
            // Python 服务路由: /api/ai/website-chat
            var requestUri = $"{baseAddress}/website-chat";

            _logger.LogDebug("调用 Python AI 服务: URL={Url}", requestUri);

            var requestMessage = new HttpRequestMessage(HttpMethod.Post, requestUri)
            {
                Content = JsonContent.Create(pythonRequest)
            };
            requestMessage.Headers.Add("X-Internal-Token", internalToken);

            var response = await _httpClient.SendAsync(requestMessage);
            response.EnsureSuccessStatusCode();

            // 解析 Python 服务返回的响应
            var result = await response.Content.ReadFromJsonAsync<Services.AiServiceResponse<WebsiteChatResponseDto>>();

            if (result == null || !result.Success)
            {
                _logger.LogError("Python AI 服务返回错误: {ErrorCode} - {Message}",
                    result?.ErrorCode, result?.Message);
                return Ok(ApiResponse.Error(
                    $"AI 服务返回错误: {result?.Message ?? "未知错误"}", 500));
            }

            if (result.Data == null)
            {
                _logger.LogError("Python AI 服务返回数据为空");
                return Ok(ApiResponse.Error("AI 服务返回数据为空", 500));
            }

            _logger.LogInformation("Python AI 服务调用成功: ContentLength={Length}",
                result.Data.Content?.Length ?? 0);

            // 返回格式与前端保持一致
            return Ok(ApiResponse.Success(new { message = result.Data.Content }));
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "调用 Python AI 服务失败（网络错误）");
            return Ok(ApiResponse.Error("AI 服务暂时不可用，请稍后重试", 500));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "AI 聊天接口异常");
            return Ok(ApiResponse.Error($"AI 服务错误: {ex.Message}", 500));
        }
    }

    /// <summary>
    /// 构建系统提示词
    /// </summary>
    private string BuildSystemPrompt()
    {
        // Phase 4B-3: 文章标题来自 Git catalog，不再读 MySQL article 正文/状态
        var articles = _articlesCatalog.GetRecentPublished(10);
        var projects = _context.Projects
            .Where(p => p.Status == "Active" || p.Status == "1")
            .Take(10)
            .ToList();

        var prompt = new StringBuilder();
        prompt.AppendLine(_workContentService.GetSystemAbout());
        prompt.AppendLine();
        prompt.AppendLine("你的任务是帮助访客了解溪午听风，推荐文章和项目，回答问题。");
        prompt.AppendLine();
        
        if (articles.Count > 0)
        {
            prompt.AppendLine("最近的文章：");
            foreach (var article in articles)
            {
                prompt.AppendLine($"- {article.Title} (分类: {article.Category ?? "未分类"}, /blog/{article.Slug})");
            }
            prompt.AppendLine();
        }

        if (projects.Any())
        {
            prompt.AppendLine("推荐的项目：");
            foreach (var project in projects)
            {
                prompt.AppendLine($"- {project.Title}: {project.Description}");
            }
            prompt.AppendLine();
        }

        prompt.AppendLine("请用友好、专业的语气回答问题，保持简洁明了。");

        return prompt.ToString();
    }
}

/// <summary>
/// 聊天请求 DTO（前端请求格式，保持不变）
/// </summary>
public class ChatRequest
{
    public string Message { get; set; } = string.Empty;
    public List<ChatMessage>? History { get; set; }
}

/// <summary>
/// 聊天消息 DTO（前端请求格式，保持不变）
/// </summary>
public class ChatMessage
{
    public string Role { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
}

/// <summary>
/// 网站聊天请求 DTO（发送给 Python 服务）
/// </summary>
internal class WebsiteChatRequestDto
{
    public List<WebsiteChatMessageDto> Messages { get; set; } = new();
    public string Scene { get; set; } = "website-chat";
    public Dictionary<string, object>? Extra { get; set; }
}

/// <summary>
/// 网站聊天消息 DTO（发送给 Python 服务）
/// </summary>
internal class WebsiteChatMessageDto
{
    public string Role { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
}

/// <summary>
/// 网站聊天响应 DTO（Python 服务返回）
/// </summary>
internal class WebsiteChatResponseDto
{
    public string Content { get; set; } = string.Empty;
    public TokenUsageDto? Usage { get; set; }
}

/// <summary>
/// Token 使用量 DTO（Python 服务返回格式，使用 camelCase）
/// </summary>
internal class TokenUsageDto
{
    [System.Text.Json.Serialization.JsonPropertyName("promptTokens")]
    public int PromptTokens { get; set; }
    
    [System.Text.Json.Serialization.JsonPropertyName("completionTokens")]
    public int CompletionTokens { get; set; }
    
    [System.Text.Json.Serialization.JsonPropertyName("totalTokens")]
    public int TotalTokens { get; set; }
}


