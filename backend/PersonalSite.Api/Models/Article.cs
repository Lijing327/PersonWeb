using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PersonalSite.Api.Models;

/// <summary>
/// 文章表 — 正文字段 LEGACY_READONLY（Phase 4B-3）。
/// 内容事实 SoT = content/articles/*.md；本表保留用于 rollback 核对与历史。
/// 禁止新代码写入 ContentMd / ContentHtml / Status 等内容事实字段。
/// 运营指标见 content_ops。
/// </summary>
[Table("article")]
public class Article
{
    [Key]
    [Column("id")]
    public long Id { get; set; }

    [Required]
    [MaxLength(255)]
    [Column("title")]
    public string Title { get; set; } = string.Empty;

    [MaxLength(255)]
    [Column("slug")]
    public string? Slug { get; set; }

    [MaxLength(500)]
    [Column("summary")]
    public string? Summary { get; set; }

    [Column("content_md", TypeName = "longtext")]
    public string? ContentMd { get; set; }

    [Column("content_html", TypeName = "longtext")]
    public string? ContentHtml { get; set; }

    [MaxLength(500)]
    [Column("cover_url")]
    public string? CoverUrl { get; set; }

    [Column("category_id")]
    public long? CategoryId { get; set; }

    /// <summary>
    /// 状态：0-草稿 1-已发布 2-下线
    /// </summary>
    [Column("status")]
    public sbyte Status { get; set; } = 1;

    /// <summary>
    /// 来源类型：manual（手动创建）、ai_generated（AI生成）、ai_optimized（AI优化）、imported（导入）
    /// </summary>
    [Column("source_type")]
    [MaxLength(50)]
    public string? SourceType { get; set; } = "manual";

    [Column("author_id")]
    public long? AuthorId { get; set; }

    [Column("publish_time")]
    public DateTime? PublishTime { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.Now;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.Now;

    // 导航属性
    public Category? Category { get; set; }
    
    [ForeignKey("AuthorId")]
    public User? Author { get; set; }
    
    public List<Tag> Tags { get; set; } = new();
    
    [Column("view_count")]
    public int ViewCount { get; set; } = 0;

    [Column("version")]
    public int Version { get; set; } = 1;

    [Column("parent_id")]
    public long? ParentId { get; set; } // 版本历史关联
}
