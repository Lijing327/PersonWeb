using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PersonalSite.Api.Models;

[Table("visitor_message")]
public class VisitorMessage
{
    [Key]
    [Column("id")]
    public long Id { get; set; }

    [Required]
    [MaxLength(100)]
    [Column("visitor_id")]
    public string VisitorId { get; set; } = string.Empty;

    [MaxLength(50)]
    [Column("visitor_name")]
    public string? VisitorName { get; set; }

    [Required]
    [MaxLength(20)]
    [Column("message_type")]
    public string MessageType { get; set; } = "message"; // message, mood, blessing

    [Required]
    [Column("content", TypeName = "TEXT")]
    public string Content { get; set; } = string.Empty;

    [MaxLength(10)]
    [Column("emoji")]
    public string? Emoji { get; set; }

    [MaxLength(20)]
    [Column("color")]
    public string? Color { get; set; }

    [MaxLength(20)]
    [Column("status")]
    public string Status { get; set; } = "pending"; // pending, approved, rejected

    [MaxLength(50)]
    [Column("ip")]
    public string? Ip { get; set; }

    [MaxLength(100)]
    [Column("location")]
    public string? Location { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.Now;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.Now;

    [Column("approved_at")]
    public DateTime? ApprovedAt { get; set; }
}

