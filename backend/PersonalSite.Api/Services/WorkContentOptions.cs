namespace PersonalSite.Api.Services;

/// <summary>
/// Work 内容文件路径配置。AiYamlPath 为空时使用构建同步产物或仓库相对路径。
/// </summary>
public class WorkContentOptions
{
    public const string SectionName = "WorkContent";

    /// <summary>
    /// 可选：显式指定 content/work/ai.yml 绝对路径（生产覆盖用）。
    /// </summary>
    public string? AiYamlPath { get; set; }
}
