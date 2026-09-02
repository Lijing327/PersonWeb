using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PersonalSite.Api.Data;
using PersonalSite.Api.Models;

namespace PersonalSite.Api.Controllers;

[ApiController]
[Route("api/admin/consultations")]
[Authorize]
public class AdminConsultationsController : ControllerBase
{
    private const string HomeLeadMarker = "[来源: 首页快速咨询]";
    private const string HomeLeadProductName = "官网咨询";

    private readonly AppDbContext _context;
    private readonly ILogger<AdminConsultationsController> _logger;

    public AdminConsultationsController(AppDbContext context, ILogger<AdminConsultationsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<object>>> GetConsultations(
        [FromQuery] int? status = null,
        [FromQuery] string? keyword = null,
        [FromQuery] string? source = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var sourceFilter = source?.Trim().ToLowerInvariant();
            var query = _context.PreSaleConsultations.AsQueryable();

            if (status.HasValue)
            {
                query = query.Where(c => c.Status == status.Value);
            }

            if (!string.IsNullOrWhiteSpace(keyword))
            {
                query = query.Where(c =>
                    c.CustomerName.Contains(keyword) ||
                    c.ProductNameSnapshot.Contains(keyword) ||
                    (c.CustomerPhone != null && c.CustomerPhone.Contains(keyword)) ||
                    (c.CustomerEmail != null && c.CustomerEmail.Contains(keyword)) ||
                    (c.CustomerWeChat != null && c.CustomerWeChat.Contains(keyword)));
            }

            var baseFilteredQuery = query;
            var homeCount = await baseFilteredQuery
                .Where(c =>
                    c.ProductId <= 0 ||
                    c.ProductNameSnapshot == HomeLeadProductName ||
                    c.RequirementDescription.Contains(HomeLeadMarker))
                .CountAsync();
            var productCount = await baseFilteredQuery
                .Where(c =>
                    c.ProductId > 0 &&
                    c.ProductNameSnapshot != HomeLeadProductName &&
                    !c.RequirementDescription.Contains(HomeLeadMarker))
                .CountAsync();

            if (!string.IsNullOrWhiteSpace(sourceFilter))
            {
                if (sourceFilter == "home")
                {
                    query = query.Where(c =>
                        c.ProductId <= 0 ||
                        c.ProductNameSnapshot == HomeLeadProductName ||
                        c.RequirementDescription.Contains(HomeLeadMarker));
                }
                else if (sourceFilter == "product")
                {
                    query = query.Where(c =>
                        c.ProductId > 0 &&
                        c.ProductNameSnapshot != HomeLeadProductName &&
                        !c.RequirementDescription.Contains(HomeLeadMarker));
                }
            }

            var total = await query.CountAsync();
            var consultations = await query
                .OrderByDescending(c => c.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(c => new
                {
                    c.Id,
                    c.ProductId,
                    c.ProductNameSnapshot,
                    c.CustomerName,
                    c.CustomerPhone,
                    c.CustomerWeChat,
                    c.CustomerEmail,
                    c.BudgetRange,
                    c.ExpectedDeadline,
                    c.Status,
                    c.CreatedAt,
                    c.Score,
                    c.Tags,
                    SourceType = (c.ProductId <= 0 || c.ProductNameSnapshot == HomeLeadProductName || c.RequirementDescription.Contains(HomeLeadMarker) ? "home" : "product"),
                    SourceLabel = (c.ProductId <= 0 || c.ProductNameSnapshot == HomeLeadProductName || c.RequirementDescription.Contains(HomeLeadMarker) ? "首页快速咨询" : "商品咨询")
                })
                .ToListAsync();

            return Ok(ApiResponse.Success(new
            {
                Total = total,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling(total / (double)pageSize),
                HomeCount = homeCount,
                ProductCount = productCount,
                List = consultations
            }));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "获取咨询列表失败");
            return StatusCode(500, ApiResponse.Error($"获取咨询列表失败: {ex.Message}", 500));
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<object>>> GetConsultationDetail(long id)
    {
        try
        {
            var consultation = await _context.PreSaleConsultations.FindAsync(id);
            if (consultation == null)
            {
                return NotFound(ApiResponse.Error("咨询不存在", 404));
            }

            var isHomeLead =
                consultation.ProductId <= 0 ||
                consultation.ProductNameSnapshot == HomeLeadProductName ||
                consultation.RequirementDescription.Contains(HomeLeadMarker);

            return Ok(ApiResponse.Success(new
            {
                consultation.Id,
                consultation.ProductId,
                consultation.ProductNameSnapshot,
                consultation.CustomerName,
                consultation.CustomerPhone,
                consultation.CustomerWeChat,
                consultation.CustomerEmail,
                consultation.BudgetRange,
                consultation.ExpectedDeadline,
                consultation.RequirementDescription,
                consultation.Status,
                consultation.InternalNote,
                consultation.CreatedAt,
                consultation.UpdatedAt,
                consultation.Summary,
                consultation.Tags,
                consultation.Score,
                consultation.AiRecommendation,
                SourceType = isHomeLead ? "home" : "product",
                SourceLabel = isHomeLead ? "首页快速咨询" : "商品咨询"
            }));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "获取咨询详情失败");
            return StatusCode(500, ApiResponse.Error($"获取咨询详情失败: {ex.Message}", 500));
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse>> UpdateConsultation(long id, [FromBody] UpdateConsultationRequest request)
    {
        try
        {
            var consultation = await _context.PreSaleConsultations.FindAsync(id);
            if (consultation == null)
            {
                return NotFound(ApiResponse.Error("咨询不存在", 404));
            }

            consultation.Status = request.Status;

            if (!string.IsNullOrWhiteSpace(request.InternalNote))
            {
                if (string.IsNullOrWhiteSpace(consultation.InternalNote))
                {
                    consultation.InternalNote = request.InternalNote;
                }
                else
                {
                    consultation.InternalNote = $"{consultation.InternalNote}\n\n[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] {request.InternalNote}";
                }
            }

            consultation.UpdatedAt = DateTime.Now;
            await _context.SaveChangesAsync();

            return Ok(ApiResponse.Success());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "更新咨询失败");
            return StatusCode(500, ApiResponse.Error($"更新咨询失败: {ex.Message}", 500));
        }
    }

    [HttpPost("{id}/convert-to-order")]
    public async Task<ActionResult<ApiResponse<ConvertToOrderResponse>>> ConvertToOrder(long id)
    {
        try
        {
            var consultation = await _context.PreSaleConsultations.FindAsync(id);
            if (consultation == null)
            {
                return NotFound(ApiResponse<ConvertToOrderResponse>.Error("咨询不存在", 404));
            }

            var orderNo = GenerateOrderNo();

            var order = new Order
            {
                OrderNo = orderNo,
                ProductId = consultation.ProductId,
                ProductNameSnapshot = consultation.ProductNameSnapshot,
                PriceSnapshot = null,
                Quantity = 1,
                TotalAmount = null,
                CustomerName = consultation.CustomerName,
                CustomerPhone = consultation.CustomerPhone,
                CustomerWeChat = consultation.CustomerWeChat,
                CustomerEmail = consultation.CustomerEmail,
                Remark = consultation.RequirementDescription,
                Status = (int)OrderStatus.PendingReview,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            _context.Orders.Add(order);

            consultation.Status = (int)ConsultationStatus.ConvertedToOrder;
            consultation.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();

            return Ok(ApiResponse<ConvertToOrderResponse>.Success(new ConvertToOrderResponse
            {
                OrderId = order.Id,
                OrderNo = order.OrderNo
            }));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "转换咨询为订单失败");
            return StatusCode(500, ApiResponse<ConvertToOrderResponse>.Error($"转换咨询为订单失败: {ex.Message}", 500));
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse>> DeleteConsultation(long id)
    {
        try
        {
            var consultation = await _context.PreSaleConsultations.FindAsync(id);
            if (consultation == null)
            {
                return NotFound(ApiResponse.Error("咨询不存在", 404));
            }

            _context.PreSaleConsultations.Remove(consultation);
            await _context.SaveChangesAsync();

            return Ok(ApiResponse.Success(null, "删除成功"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "删除咨询失败: {Id}", id);
            return StatusCode(500, ApiResponse.Error($"删除咨询失败: {ex.Message}", 500));
        }
    }

    [HttpPost("batch-delete")]
    public async Task<ActionResult<ApiResponse<object>>> BatchDelete([FromBody] BatchDeleteConsultationsRequest request)
    {
        try
        {
            if (request.Ids == null || request.Ids.Count == 0)
            {
                return BadRequest(ApiResponse.Error("请选择要删除的记录", 400));
            }

            var consultations = await _context.PreSaleConsultations
                .Where(c => request.Ids.Contains(c.Id))
                .ToListAsync();

            if (consultations.Count == 0)
            {
                return NotFound(ApiResponse.Error("未找到可删除的记录", 404));
            }

            _context.PreSaleConsultations.RemoveRange(consultations);
            await _context.SaveChangesAsync();

            return Ok(ApiResponse.Success(new { deleted = consultations.Count }, $"已删除 {consultations.Count} 条记录"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "批量删除咨询失败");
            return StatusCode(500, ApiResponse.Error($"批量删除失败: {ex.Message}", 500));
        }
    }

    private string GenerateOrderNo()
    {
        var dateStr = DateTime.Now.ToString("yyyyMMdd");
        var random = new Random();
        var randomStr = random.Next(1000, 9999).ToString();
        return $"{dateStr}-{randomStr}";
    }
}

public class UpdateConsultationRequest
{
    public int Status { get; set; }

    public string? InternalNote { get; set; }
}

public class ConvertToOrderResponse
{
    public long OrderId { get; set; }

    public string OrderNo { get; set; } = string.Empty;
}

public class BatchDeleteConsultationsRequest
{
    public List<long> Ids { get; set; } = new();
}
