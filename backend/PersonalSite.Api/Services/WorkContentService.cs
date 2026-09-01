using Microsoft.Extensions.Options;
using YamlDotNet.Serialization;
using YamlDotNet.Serialization.NamingConventions;

namespace PersonalSite.Api.Services;

public interface IWorkContentService
{
    string GetSystemAbout();
}

/// <summary>
/// 从 content/work/ai.yml 读取 assistant.chat.system_about（唯一身份事实 SoT）。
/// 构建时通过 csproj 将 ai.yml 同步到输出目录 content-sync/work/ai.yml。
/// </summary>
public class WorkContentService : IWorkContentService
{
    private readonly WorkContentOptions _options;
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<WorkContentService> _logger;
    private readonly object _cacheLock = new();
    private string? _cachedSystemAbout;
    private DateTime _cachedWriteTimeUtc = DateTime.MinValue;

    public WorkContentService(
        IOptions<WorkContentOptions> options,
        IWebHostEnvironment environment,
        ILogger<WorkContentService> logger)
    {
        _options = options.Value;
        _environment = environment;
        _logger = logger;
    }

    public string GetSystemAbout()
    {
        var path = ResolveAiYamlPath();
        if (!File.Exists(path))
        {
            _logger.LogWarning("Work ai.yml 未找到: {Path}", path);
            return GetFallbackSystemAbout();
        }

        var writeTime = File.GetLastWriteTimeUtc(path);
        lock (_cacheLock)
        {
            if (_cachedSystemAbout != null && writeTime == _cachedWriteTimeUtc)
            {
                return _cachedSystemAbout;
            }
        }

        try
        {
            var yaml = File.ReadAllText(path);
            var deserializer = new DeserializerBuilder()
                .WithNamingConvention(UnderscoredNamingConvention.Instance)
                .IgnoreUnmatchedProperties()
                .Build();

            var root = deserializer.Deserialize<Dictionary<string, object>>(yaml);
            var systemAbout = ExtractSystemAbout(root);

            if (string.IsNullOrWhiteSpace(systemAbout))
            {
                _logger.LogWarning("ai.yml 中 assistant.chat.system_about 为空: {Path}", path);
                return GetFallbackSystemAbout();
            }

            lock (_cacheLock)
            {
                _cachedSystemAbout = systemAbout.Trim();
                _cachedWriteTimeUtc = writeTime;
            }

            return _cachedSystemAbout;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "解析 Work ai.yml 失败: {Path}", path);
            return GetFallbackSystemAbout();
        }
    }

    private string ResolveAiYamlPath()
    {
        if (!string.IsNullOrWhiteSpace(_options.AiYamlPath) && File.Exists(_options.AiYamlPath))
        {
            return _options.AiYamlPath;
        }

        var synced = Path.Combine(AppContext.BaseDirectory, "content-sync", "work", "ai.yml");
        if (File.Exists(synced))
        {
            return synced;
        }

        var contentRoot = _environment.ContentRootPath;
        var repoRelative = Path.GetFullPath(Path.Combine(contentRoot, "..", "..", "content", "work", "ai.yml"));
        if (File.Exists(repoRelative))
        {
            return repoRelative;
        }

        return synced;
    }

    private static string ExtractSystemAbout(Dictionary<string, object>? root)
    {
        if (root == null) return string.Empty;

        var assistant = AsStringDict(root.GetValueOrDefault("assistant"));
        var chat = assistant == null ? null : AsStringDict(assistant.GetValueOrDefault("chat"));
        if (chat == null || !chat.TryGetValue("system_about", out var aboutObj))
        {
            return string.Empty;
        }

        return aboutObj?.ToString()?.Trim() ?? string.Empty;
    }

    private static Dictionary<string, object>? AsStringDict(object? value)
    {
        if (value is Dictionary<string, object> stringDict)
        {
            return stringDict;
        }

        if (value is IDictionary<object, object> objectDict)
        {
            return objectDict.ToDictionary(
                pair => pair.Key?.ToString() ?? string.Empty,
                pair => pair.Value!);
        }

        return null;
    }

    private static string GetFallbackSystemAbout() =>
        "你是「溪午听风」个人站点的助手。回答应简洁、专业，不确定时引导访客前往站内项目、产品或联系页面。";
}
