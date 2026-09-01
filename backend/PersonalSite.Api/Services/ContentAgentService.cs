using System.Text;
using System.Text.Json;
using PersonalSite.Api.Data;
using PersonalSite.Api.Models;

namespace PersonalSite.Api.Services;

/// <summary>
/// 内容生成智能体服务
/// 用于生成文章、项目介绍、工具介绍等内容
/// </summary>
public class ContentAgentService : AiAgentService
{
    public ContentAgentService(
        AiServiceClient aiClient,
        AppDbContext dbContext,
        ILogger<ContentAgentService> logger)
        : base(aiClient, dbContext, logger)
    {
    }

    /// <summary>
    /// 生成内容
    /// </summary>
    public async Task<ContentGenerationResult> GenerateContentAsync(
        ContentGenerationRequest request,
        CancellationToken cancellationToken = default)
    {
        // 构建 Prompt
        var prompt = BuildPrompt(request);

        // 调用 AI
        var meta = new Dictionary<string, object>
        {
            ["Type"] = request.Type ?? "",
            ["Title"] = request.Title ?? "",
            ["Tone"] = request.Tone ?? "mature",
            ["TargetAudience"] = request.TargetAudience ?? "",
            ["Length"] = request.Length ?? "medium"
        };

        var aiResponse = await CallAiAsync("Content", prompt, meta, cancellationToken);

        // 记录 AI 响应内容（用于调试）
        Logger.LogInformation("AI 响应内容（前500字符）: {ResponsePreview}", 
            aiResponse.Length > 500 ? aiResponse.Substring(0, 500) : aiResponse);

        // 解析响应（假设 AI 返回 JSON 格式）
        var result = ParseAiResponse(aiResponse, request);
        
        // 记录解析结果
        Logger.LogInformation("解析结果: Success={Success}, HasContent={HasContent}, Title={Title}, BodyLength={BodyLength}",
            result.Success, result.Content != null, result.Content?.Title ?? "null", result.Content?.Body?.Length ?? 0);

        // 如果设置了自动保存草稿，则保存到数据库
        if (request.AutoSaveDraft == true)
        {
            await SaveDraftAsync(result, request, cancellationToken);
        }

        return result;
    }

    /// <summary>
    /// 构建 Prompt
    /// </summary>
    private string BuildPrompt(ContentGenerationRequest request)
    {
        var sb = new StringBuilder();

        // 根据类型设置不同的提示词
        switch (request.Type?.ToLower())
        {
            case "article":
                sb.AppendLine("请生成一篇技术文章，要求如下：");
                break;
            case "project_intro":
                sb.AppendLine("请生成一个项目的介绍文案，要求如下：");
                break;
            case "tool_intro":
                sb.AppendLine("请生成一个工具的介绍文案，要求如下：");
                break;
            default:
                sb.AppendLine("请生成内容，要求如下：");
                break;
        }

        if (!string.IsNullOrEmpty(request.Title))
        {
            sb.AppendLine($"标题：{request.Title}");
        }

        sb.AppendLine($"语气风格：{request.Tone ?? "mature"}（mature=成熟专业，casual=轻松随意，technical=技术导向）");
        sb.AppendLine($"目标受众：{request.TargetAudience ?? "通用"}");
        sb.AppendLine($"字数要求：{request.Length ?? "medium"}（short=500字左右，medium=1000字左右，long=2000字以上）");

        if (!string.IsNullOrEmpty(request.ExtraNotes))
        {
            sb.AppendLine($"额外说明：{request.ExtraNotes}");
        }

        sb.AppendLine();
        sb.AppendLine("请以 JSON 格式返回，包含以下字段：");
        sb.AppendLine("- title: 标题");
        sb.AppendLine("- summary: 摘要（100-200字）");
        sb.AppendLine("- body: 正文内容（Markdown 格式）");

        return sb.ToString();
    }

    /// <summary>
    /// 解析 AI 响应
    /// </summary>
    private ContentGenerationResult ParseAiResponse(string aiResponse, ContentGenerationRequest request)
    {
        if (string.IsNullOrWhiteSpace(aiResponse))
        {
            Logger.LogWarning("AI 响应为空");
            return new ContentGenerationResult
            {
                Success = false,
                ErrorMessage = "AI 返回内容为空"
            };
        }

        try
        {
            string? jsonStr = null;
            
            // 方法1: 尝试查找 ```json 代码块（优先使用，更可靠）
            var jsonBlockStart = aiResponse.IndexOf("```json", StringComparison.OrdinalIgnoreCase);
            Logger.LogInformation("查找 ```json 代码块，位置: {Position}", jsonBlockStart);
            
            if (jsonBlockStart >= 0)
            {
                // 找到代码块开始位置，查找内容开始（跳过 ```json 和可能的换行）
                var contentStart = aiResponse.IndexOf('\n', jsonBlockStart);
                if (contentStart < 0) 
                {
                    contentStart = jsonBlockStart + 7; // "```json" 的长度
                }
                else 
                {
                    contentStart++; // 跳过换行符
                }
                
                Logger.LogInformation("JSON 内容开始位置: {ContentStart}", contentStart);
                
                // 查找代码块结束位置（查找下一个 ```，但要从 contentStart 之后开始查找）
                // 注意：不能直接使用 IndexOf("```", contentStart)，因为可能会找到代码块开始标记
                // 应该查找 contentStart 之后的第一个 ```
                var searchStart = contentStart;
                var blockEnd = -1;
                while (true)
                {
                    var nextBacktick = aiResponse.IndexOf("```", searchStart);
                    if (nextBacktick < 0) break;
                    
                    // 检查是否是代码块结束标记（前面应该是换行或空格，后面也应该是换行或字符串结束）
                    var beforeChar = nextBacktick > 0 ? aiResponse[nextBacktick - 1] : '\n';
                    var afterPos = nextBacktick + 3;
                    var afterChar = afterPos < aiResponse.Length ? aiResponse[afterPos] : '\n';
                    
                    // 如果前面是换行或空格，且后面是换行或字符串结束，则认为是结束标记
                    if ((beforeChar == '\n' || beforeChar == '\r' || char.IsWhiteSpace(beforeChar)) &&
                        (afterChar == '\n' || afterChar == '\r' || afterPos >= aiResponse.Length))
                    {
                        blockEnd = nextBacktick;
                        break;
                    }
                    
                    searchStart = nextBacktick + 3; // 继续查找下一个 ```
                }
                
                Logger.LogInformation("查找代码块结束位置，找到: {BlockEnd}", blockEnd);
                
                if (blockEnd > contentStart)
                {
                    jsonStr = aiResponse.Substring(contentStart, blockEnd - contentStart).Trim();
                    Logger.LogInformation("✅ 从 markdown 代码块中提取到 JSON，长度: {Length}, 前100字符: {Preview}", 
                        jsonStr.Length, jsonStr.Length > 100 ? jsonStr.Substring(0, 100) : jsonStr);
                }
                else
                {
                    Logger.LogWarning("未找到代码块结束标记 ```，blockEnd={BlockEnd}, contentStart={ContentStart}", blockEnd, contentStart);
                }
            }
            else
            {
                Logger.LogWarning("未找到 ```json 代码块开始标记");
            }
            
            // 方法2: 如果还没找到，尝试使用正则表达式匹配（处理嵌套大括号的情况）
            if (string.IsNullOrWhiteSpace(jsonStr))
            {
                // 使用正则表达式匹配 ```json ... ``` 代码块
                // 注意：这个正则可能无法正确处理嵌套的大括号，所以优先使用方法1
                var jsonCodeBlockPattern = @"```json\s*(\{.*?\})\s*```";
                var jsonCodeBlockMatch = System.Text.RegularExpressions.Regex.Match(
                    aiResponse, 
                    jsonCodeBlockPattern, 
                    System.Text.RegularExpressions.RegexOptions.Singleline | System.Text.RegularExpressions.RegexOptions.IgnoreCase);
                
                if (jsonCodeBlockMatch.Success && jsonCodeBlockMatch.Groups.Count > 1)
                {
                    jsonStr = jsonCodeBlockMatch.Groups[1].Value;
                    Logger.LogInformation("✅ 从正则表达式匹配中提取到 JSON，长度: {Length}", jsonStr.Length);
                }
            }
            
            // 方法3: 如果还没找到，尝试直接查找 JSON 对象（查找第一个 { 到最后一个 }）
            // 注意：这种方法可能不准确，因为可能有多个 JSON 对象
            if (string.IsNullOrWhiteSpace(jsonStr))
            {
                var jsonStart = aiResponse.IndexOf('{');
                var jsonEnd = aiResponse.LastIndexOf('}');
                
                if (jsonStart >= 0 && jsonEnd > jsonStart)
                {
                    jsonStr = aiResponse.Substring(jsonStart, jsonEnd - jsonStart + 1);
                    Logger.LogInformation("✅ 从文本中直接提取到 JSON，长度: {Length}", jsonStr.Length);
                }
            }
            
            if (!string.IsNullOrWhiteSpace(jsonStr))
            {
                Logger.LogInformation("提取的 JSON 字符串（前300字符）: {JsonPreview}", 
                    jsonStr.Length > 300 ? jsonStr.Substring(0, 300) + "..." : jsonStr);
                
                var jsonDoc = JsonDocument.Parse(jsonStr);
                var root = jsonDoc.RootElement;

                var title = request.Title ?? "未命名";
                var summary = "";
                var body = "";

                // 尝试从 JSON 中提取字段
                if (root.TryGetProperty("title", out var titleElement))
                {
                    var titleValue = titleElement.GetString();
                    if (!string.IsNullOrWhiteSpace(titleValue))
                    {
                        title = titleValue;
                    }
                }
                
                if (root.TryGetProperty("summary", out var summaryElement))
                {
                    summary = summaryElement.GetString() ?? "";
                }
                
                if (root.TryGetProperty("body", out var bodyElement))
                {
                    body = bodyElement.GetString() ?? "";
                }

                // 如果成功解析到 JSON，直接返回解析结果
                // 不再检查内容是否"有效"，因为 AI 可能只返回部分字段
                Logger.LogInformation("✅ 成功解析 JSON: Title={Title}, SummaryLength={SummaryLength}, BodyLength={BodyLength}",
                    title, summary.Length, body.Length);
                
                return new ContentGenerationResult
                {
                    Success = true,
                    Content = new ContentDto
                    {
                        Title = title,
                        Summary = summary,
                        Body = body
                    }
                };
            }
        }
        catch (Exception ex)
        {
            Logger.LogWarning(ex, "解析 AI 响应 JSON 失败: {Error}", ex.Message);
        }

        // 如果解析失败，使用原始文本作为正文
        Logger.LogInformation("JSON 解析失败，使用原始文本作为正文内容");
        return new ContentGenerationResult
        {
            Success = true,
            Content = new ContentDto
            {
                Title = request.Title ?? "未命名",
                Summary = "",
                Body = aiResponse.Trim()
            }
        };
    }

    /// <summary>
    /// 保存草稿到数据库 — LEGACY 已退役（Phase 4B-3）。
    /// 文章正文 SoT = Git；AI 生成结果请导出到 content/articles，禁止写 DB body。
    /// </summary>
    private Task SaveDraftAsync(
        ContentGenerationResult result,
        ContentGenerationRequest request,
        CancellationToken cancellationToken)
    {
        Logger.LogWarning(
            "Skip SaveDraftAsync: Articles body SoT is Git. Do not write ContentMd to MySQL. Type={Type}",
            request.Type);
        return Task.CompletedTask;
    }
}

/// <summary>
/// 内容生成请求 DTO
/// </summary>
public class ContentGenerationRequest
{
    /// <summary>
    /// 内容类型：article（文章）、project_intro（项目介绍）、tool_intro（工具介绍）
    /// </summary>
    public string? Type { get; set; }

    /// <summary>
    /// 标题（可选）
    /// </summary>
    public string? Title { get; set; }

    /// <summary>
    /// 语气：mature（成熟专业）、casual（轻松随意）、technical（技术导向）
    /// </summary>
    public string? Tone { get; set; }

    /// <summary>
    /// 目标受众
    /// </summary>
    public string? TargetAudience { get; set; }

    /// <summary>
    /// 字数：short（500字左右）、medium（1000字左右）、long（2000字以上）
    /// </summary>
    public string? Length { get; set; }

    /// <summary>
    /// 额外说明
    /// </summary>
    public string? ExtraNotes { get; set; }

    /// <summary>
    /// 是否自动保存为草稿
    /// </summary>
    public bool? AutoSaveDraft { get; set; }
}

/// <summary>
/// 内容生成响应 DTO
/// </summary>
public class ContentGenerationResult
{
    [System.Text.Json.Serialization.JsonPropertyName("success")]
    public bool Success { get; set; }
    
    [System.Text.Json.Serialization.JsonPropertyName("content")]
    public ContentDto? Content { get; set; }
    
    [System.Text.Json.Serialization.JsonPropertyName("errorMessage")]
    public string? ErrorMessage { get; set; }
}

/// <summary>
/// 生成的内容 DTO
/// </summary>
public class ContentDto
{
    [System.Text.Json.Serialization.JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;
    
    [System.Text.Json.Serialization.JsonPropertyName("summary")]
    public string Summary { get; set; } = string.Empty;
    
    [System.Text.Json.Serialization.JsonPropertyName("body")]
    public string Body { get; set; } = string.Empty; // Markdown 格式
}

