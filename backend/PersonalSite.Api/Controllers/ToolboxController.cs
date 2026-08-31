using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PersonalSite.Api.Data;
using PersonalSite.Api.Models;
using PersonalSite.Api.Models.Dto;
using System.Text.Json;
using System.Security.Cryptography;
using System.Text;

namespace PersonalSite.Api.Controllers;

/// <summary>
/// 工具商城控制器
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class ToolboxController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<ToolboxController> _logger;

    public ToolboxController(AppDbContext context, ILogger<ToolboxController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// 获取工具列表（管理后台 - 返回所有状态）
    /// </summary>
    [HttpGet("admin/list")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public async Task<ActionResult<ApiResponse<object>>> GetAdminTools(
        [FromQuery] string? category = null,
        [FromQuery] string? status = null,
        [FromQuery] string? search = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 1000
    )
    {
        try
        {
            var query = _context.Tools
                .Include(t => t.Category)
                .AsQueryable();

            // 状态筛选（管理后台可以查看所有状态）
            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(t => t.Status == status);
            }

            // 分类筛选
            if (!string.IsNullOrEmpty(category))
            {
                query = query.Where(t => t.Category != null && t.Category.Slug == category);
            }

            // 搜索
            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(t => 
                    t.Name.Contains(search) || 
                    (t.Description != null && t.Description.Contains(search)) ||
                    (t.Slug != null && t.Slug.Contains(search)));
            }

            // 排序
            query = query.OrderByDescending(t => t.CreatedAt);

            var total = await query.CountAsync();
            var toolsData = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(t => new
                {
                    t.Id,
                    t.Name,
                    t.Slug,
                    t.Icon,
                    t.Description,
                    t.CoverImage,
                    t.DemoUrl,
                    t.Price,
                    t.OriginalPrice,
                    t.IsFree,
                    t.IsPremium,
                    t.PurchaseCount,
                    t.UseCount,
                    t.Rating,
                    t.RatingCount,
                    t.Status,
                    Category = t.Category != null ? new { t.Category.Id, t.Category.Name, t.Category.Slug, t.Category.Icon } : null,
                    TagsJson = t.Tags,
                    FeaturesJson = t.Features
                })
                .ToListAsync();

            // 在内存中反序列化 JSON 数据
            var tools = toolsData.Select(t => new
            {
                t.Id,
                t.Name,
                t.Slug,
                t.Icon,
                t.Description,
                t.CoverImage,
                t.DemoUrl,
                t.Price,
                t.OriginalPrice,
                t.IsFree,
                t.IsPremium,
                t.PurchaseCount,
                t.UseCount,
                t.Rating,
                t.RatingCount,
                t.Status,
                t.Category,
                Tags = !string.IsNullOrEmpty(t.TagsJson) ? JsonSerializer.Deserialize<string[]>(t.TagsJson) ?? Array.Empty<string>() : Array.Empty<string>(),
                Features = !string.IsNullOrEmpty(t.FeaturesJson) ? JsonSerializer.Deserialize<string[]>(t.FeaturesJson) ?? Array.Empty<string>() : Array.Empty<string>()
            }).ToList();

            return Ok(ApiResponse.Success(new
            {
                Tools = tools,
                Total = total,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling(total / (double)pageSize)
            }));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "获取工具列表失败");
            return StatusCode(500, ApiResponse.Error($"获取工具列表失败: {ex.Message}", 500));
        }
    }

    /// <summary>
    /// 获取工具列表（商城）
    /// </summary>
    [HttpGet("marketplace")]
    public async Task<ActionResult<ApiResponse<object>>> GetMarketplaceTools(
        [FromQuery] string? category = null,
        [FromQuery] bool? isFree = null,
        [FromQuery] bool? isPremium = null,
        [FromQuery] string? search = null,
        [FromQuery] string? sortBy = "popular", // popular, price, rating, newest
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20
    )
    {
        try
        {
            var query = _context.Tools
                .Include(t => t.Category)
                .Where(t => t.Status == "published");

            // 分类筛选
            if (!string.IsNullOrEmpty(category))
            {
                query = query.Where(t => t.Category != null && t.Category.Slug == category);
            }

            // 免费/付费筛选
            if (isFree.HasValue)
            {
                query = query.Where(t => t.IsFree == isFree.Value);
            }

            // 高级工具筛选
            if (isPremium.HasValue)
            {
                query = query.Where(t => t.IsPremium == isPremium.Value);
            }

            // 搜索（支持名称、描述和 slug）
            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(t => 
                    t.Name.Contains(search) || 
                    (t.Description != null && t.Description.Contains(search)) ||
                    (t.Slug != null && t.Slug.Contains(search)));
            }

            // 排序
            query = sortBy switch
            {
                "price" => query.OrderBy(t => t.Price),
                "price_desc" => query.OrderByDescending(t => t.Price),
                "rating" => query.OrderByDescending(t => t.Rating),
                "newest" => query.OrderByDescending(t => t.PublishedAt ?? t.CreatedAt),
                _ => query.OrderByDescending(t => t.PurchaseCount)
            };

            var total = await query.CountAsync();
            // 先查询出基础数据，避免在表达式树中使用可选参数
            var toolsData = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(t => new
                {
                    t.Id,
                    t.Name,
                    t.Slug,
                    t.Icon,
                    t.Description,
                    t.CoverImage,
                    t.DemoUrl,
                    t.Price,
                    t.OriginalPrice,
                    t.IsFree,
                    t.IsPremium,
                    t.PurchaseCount,
                    t.UseCount,
                    t.Rating,
                    t.RatingCount,
                    Category = t.Category != null ? new { t.Category.Name, t.Category.Slug, t.Category.Icon } : null,
                    TagsJson = t.Tags, // 先获取 JSON 字符串
                    FeaturesJson = t.Features // 先获取 JSON 字符串
                })
                .ToListAsync();

            // 在内存中反序列化 JSON 数据
            var tools = toolsData.Select(t => new
            {
                t.Id,
                t.Name,
                t.Slug,
                t.Icon,
                t.Description,
                t.CoverImage,
                t.DemoUrl,
                t.Price,
                t.OriginalPrice,
                t.IsFree,
                t.IsPremium,
                t.PurchaseCount,
                t.UseCount,
                t.Rating,
                t.RatingCount,
                t.Category,
                Tags = !string.IsNullOrEmpty(t.TagsJson) ? JsonSerializer.Deserialize<string[]>(t.TagsJson) ?? Array.Empty<string>() : Array.Empty<string>(),
                Features = !string.IsNullOrEmpty(t.FeaturesJson) ? JsonSerializer.Deserialize<string[]>(t.FeaturesJson) ?? Array.Empty<string>() : Array.Empty<string>()
            }).ToList();

            return Ok(ApiResponse.Success(new
            {
                Tools = tools,
                Total = total,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling(total / (double)pageSize)
            }));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "获取工具列表失败");
            return StatusCode(500, ApiResponse.Error($"获取工具列表失败: {ex.Message}", 500));
        }
    }

    /// <summary>
    /// 按 slug 获取已发布工具详情（公开）
    /// </summary>
    [HttpGet("by-slug/{slug}")]
    public async Task<ActionResult<ApiResponse<object>>> GetToolBySlug(string slug)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(slug))
            {
                return NotFound(ApiResponse.Error("工具不存在", 404));
            }

            var tool = await _context.Tools
                .Include(t => t.Category)
                .FirstOrDefaultAsync(t => t.Slug == slug && t.Status == "published");

            if (tool == null)
            {
                return NotFound(ApiResponse.Error("工具不存在", 404));
            }

            string[] tagsArray = Array.Empty<string>();
            string[] featuresArray = Array.Empty<string>();

            if (!string.IsNullOrEmpty(tool.Tags))
            {
                tagsArray = JsonSerializer.Deserialize<string[]>(tool.Tags) ?? Array.Empty<string>();
            }

            if (!string.IsNullOrEmpty(tool.Features))
            {
                featuresArray = JsonSerializer.Deserialize<string[]>(tool.Features) ?? Array.Empty<string>();
            }

            var result = new
            {
                tool.Id,
                tool.Name,
                tool.Slug,
                tool.Icon,
                tool.Description,
                tool.DetailedDescription,
                tool.CoverImage,
                tool.DemoUrl,
                tool.Price,
                tool.OriginalPrice,
                tool.IsFree,
                tool.IsPremium,
                tool.EnableOnlineOrder,
                tool.PurchaseCount,
                tool.UseCount,
                tool.Rating,
                tool.RatingCount,
                tool.ApiEndpoint,
                tool.ApiDocumentation,
                tool.Requirements,
                tool.FitFor,
                tool.NotFitFor,
                tool.DeliveryType,
                tool.EstimatedDeliveryTime,
                tool.Version,
                tool.Author,
                Category = tool.Category != null ? new { tool.Category.Name, tool.Category.Slug, tool.Category.Icon } : null,
                Tags = tagsArray,
                Features = featuresArray
            };

            return Ok(ApiResponse.Success(result));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "按 slug 获取工具失败");
            return StatusCode(500, ApiResponse.Error($"获取工具失败: {ex.Message}", 500));
        }
    }

    /// <summary>
    /// 获取工具详情
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<object>>> GetTool(long id)
    {
        try
        {
            var tool = await _context.Tools
                .Include(t => t.Category)
                .FirstOrDefaultAsync(t => t.Id == id && t.Status == "published");

            if (tool == null)
            {
                return NotFound(ApiResponse.Error("工具不存在", 404));
            }

            // 在内存中反序列化 JSON 数据（不在表达式树中）
            string[] tagsArray = Array.Empty<string>();
            string[] featuresArray = Array.Empty<string>();
            
            if (!string.IsNullOrEmpty(tool.Tags))
            {
                tagsArray = JsonSerializer.Deserialize<string[]>(tool.Tags) ?? Array.Empty<string>();
            }
            
            if (!string.IsNullOrEmpty(tool.Features))
            {
                featuresArray = JsonSerializer.Deserialize<string[]>(tool.Features) ?? Array.Empty<string>();
            }

            var result = new
            {
                tool.Id,
                tool.Name,
                tool.Slug,
                tool.Icon,
                tool.Description,
                tool.DetailedDescription,
                tool.CoverImage,
                tool.DemoUrl,
                tool.Price,
                tool.OriginalPrice,
                tool.IsFree,
                tool.IsPremium,
                tool.EnableOnlineOrder,
                tool.PurchaseCount,
                tool.UseCount,
                tool.Rating,
                tool.RatingCount,
                tool.ApiEndpoint,
                tool.ApiDocumentation,
                tool.Requirements,
                tool.FitFor,
                tool.NotFitFor,
                tool.DeliveryType,
                tool.EstimatedDeliveryTime,
                tool.Version,
                tool.Author,
                Category = tool.Category != null ? new { tool.Category.Name, tool.Category.Slug, tool.Category.Icon } : null,
                Tags = tagsArray,
                Features = featuresArray
            };

            return Ok(ApiResponse.Success(result));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "获取工具详情失败");
            return StatusCode(500, ApiResponse.Error($"获取工具详情失败: {ex.Message}", 500));
        }
    }

    /// <summary>
    /// 获取工具合集列表
    /// </summary>
    [HttpGet("collections")]
    public async Task<ActionResult<ApiResponse<object>>> GetCollections(
        [FromQuery] bool? featured = null)
    {
        try
        {
            var query = _context.ToolCollections
                .Where(c => c.Status == "published");

            if (featured.HasValue && featured.Value)
            {
                query = query.Where(c => c.IsFeatured);
            }

            var collections = await query
                .OrderByDescending(c => c.IsFeatured)
                .ThenBy(c => c.SortOrder)
                .Select(c => new
                {
                    c.Id,
                    c.Name,
                    c.Slug,
                    c.Description,
                    c.CoverImage,
                    c.Price,
                    c.OriginalPrice,
                    ToolCount = c.ToolCount,
                    c.PurchaseCount,
                    c.IsFeatured
                })
                .ToListAsync();

            return Ok(ApiResponse.Success(collections));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "获取工具合集列表失败");
            return StatusCode(500, ApiResponse.Error($"获取工具合集列表失败: {ex.Message}", 500));
        }
    }

    /// <summary>
    /// 获取工具分类列表
    /// </summary>
    [HttpGet("categories")]
    public async Task<ActionResult<ApiResponse<object>>> GetCategories()
    {
        try
        {
            var categories = await _context.ToolCategories
                .Where(c => c.IsActive)
                .OrderBy(c => c.SortOrder)
                .ThenBy(c => c.Name)
                .Select(c => new
                {
                    c.Id,
                    c.Name,
                    c.Slug,
                    c.Icon,
                    c.Description,
                    ToolCount = _context.Tools.Count(t => t.CategoryId == c.Id && t.Status == "published")
                })
                .ToListAsync();

            return Ok(ApiResponse.Success(categories));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "获取分类列表失败");
            return StatusCode(500, ApiResponse.Error($"获取分类列表失败: {ex.Message}", 500));
        }
    }

    /// <summary>
    /// 购买工具
    /// </summary>
    [HttpPost("purchase")]
    public async Task<ActionResult<ApiResponse<object>>> PurchaseTool([FromBody] PurchaseRequest request)
    {
        try
        {
            if (string.IsNullOrEmpty(request.UserId))
            {
                return BadRequest(ApiResponse.Error("UserId is required", 400));
            }

            var tool = await _context.Tools.FindAsync(request.ToolId);
            if (tool == null)
            {
                return NotFound(ApiResponse.Error("工具不存在", 404));
            }

            // 检查是否已购买
            var existingPurchase = await _context.ToolPurchases
                .FirstOrDefaultAsync(p => 
                    p.ToolId == request.ToolId && 
                    p.UserId == request.UserId && 
                    p.IsActive &&
                    (p.ExpiresAt == null || p.ExpiresAt > DateTime.Now));

            if (existingPurchase != null)
            {
                return Ok(ApiResponse.Success(new
                {
                    Message = "您已拥有此工具",
                    PurchaseId = existingPurchase.Id,
                    ExpiresAt = existingPurchase.ExpiresAt
                }));
            }

            // 创建购买记录
            var purchase = new ToolPurchase
            {
                ToolId = request.ToolId,
                UserId = request.UserId,
                PurchaseType = request.PurchaseType ?? "one_time",
                Price = tool.IsFree ? 0 : tool.Price,
                PaymentMethod = request.PaymentMethod,
                PaymentStatus = tool.IsFree ? "paid" : "pending",
                ExpiresAt = request.PurchaseType == "subscription" 
                    ? DateTime.Now.AddMonths(1) 
                    : null,
                IsActive = true
            };

            _context.ToolPurchases.Add(purchase);

            // 更新工具购买次数
            tool.PurchaseCount++;
            await _context.SaveChangesAsync();

            return Ok(ApiResponse.Success(new
            {
                PurchaseId = purchase.Id,
                Message = tool.IsFree ? "免费工具已添加" : "购买成功，请完成支付",
                PaymentStatus = purchase.PaymentStatus
            }));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "购买工具失败");
            return StatusCode(500, ApiResponse.Error($"购买工具失败: {ex.Message}", 500));
        }
    }

    /// <summary>
    /// 获取我的工具列表
    /// </summary>
    [HttpPost("my-tools")]
    public async Task<ActionResult<ApiResponse<object>>> GetMyTools([FromBody] UserIdRequest request)
    {
        try
        {
            if (string.IsNullOrEmpty(request.UserId))
            {
                return BadRequest(ApiResponse.Error("UserId is required", 400));
            }

            var purchases = await _context.ToolPurchases
                .Include(p => p.Tool)
                .ThenInclude(t => t!.Category)
                .Where(p => 
                    p.UserId == request.UserId && 
                    p.IsActive &&
                    p.PaymentStatus == "paid" &&
                    (p.ExpiresAt == null || p.ExpiresAt > DateTime.Now))
                .Select(p => new
                {
                    p.Id,
                    Tool = new
                    {
                        p.Tool!.Id,
                        p.Tool.Name,
                        p.Tool.Slug,
                        p.Tool.Icon,
                        p.Tool.Description,
                        p.Tool.CoverImage,
                        p.Tool.ApiEndpoint,
                        Category = p.Tool.Category != null ? new { p.Tool.Category.Name, p.Tool.Category.Slug } : null
                    },
                    p.PurchaseType,
                    p.ExpiresAt,
                    p.PurchasedAt
                })
                .ToListAsync();

            return Ok(ApiResponse.Success(purchases));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "获取我的工具失败");
            return StatusCode(500, ApiResponse.Error($"获取我的工具失败: {ex.Message}", 500));
        }
    }

    /// <summary>
    /// 记录工具使用
    /// </summary>
    [HttpPost("usage")]
    public async Task<ActionResult<ApiResponse<object>>> RecordUsage([FromBody] UsageRequest request)
    {
        try
        {
            var tool = await _context.Tools.FindAsync(request.ToolId);
            if (tool == null)
            {
                return NotFound(ApiResponse.Error("工具不存在", 404));
            }

            // 记录使用
            var usage = new ToolUsage
            {
                ToolId = request.ToolId,
                UserId = request.UserId,
                UsageType = request.UsageType ?? "web",
                RequestData = request.RequestData != null 
                    ? JsonSerializer.Serialize(request.RequestData) 
                    : null,
                ResponseData = request.ResponseData != null
                    ? JsonSerializer.Serialize(request.ResponseData)
                    : null,
                ExecutionTime = request.ExecutionTime,
                Status = request.Status ?? "success",
                ErrorMessage = request.ErrorMessage,
                IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
                UserAgent = Request.Headers["User-Agent"].ToString(),
                Referrer = Request.Headers["Referer"].ToString()
            };

            _context.ToolUsages.Add(usage);

            // 更新工具使用次数
            tool.UseCount++;
            await _context.SaveChangesAsync();

            // 更新每日统计
            var today = DateTime.Today;
            var analytics = await _context.ToolAnalytics
                .FirstOrDefaultAsync(a => a.ToolId == request.ToolId && a.Date == today);

            if (analytics == null)
            {
                analytics = new ToolAnalytics
                {
                    ToolId = request.ToolId,
                    Date = today
                };
                _context.ToolAnalytics.Add(analytics);
            }

            analytics.UseCount++;
            if (request.UsageType == "api")
            {
                analytics.ApiCallCount++;
            }
            if (request.Status == "error")
            {
                analytics.ErrorCount++;
            }
            if (request.ExecutionTime.HasValue)
            {
                var totalTime = (analytics.AvgExecutionTime ?? 0) * (analytics.UseCount - 1) + request.ExecutionTime.Value;
                analytics.AvgExecutionTime = totalTime / analytics.UseCount;
            }

            await _context.SaveChangesAsync();

            return Ok(ApiResponse.Success(new { UsageId = usage.Id }));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "记录工具使用失败");
            return StatusCode(500, ApiResponse.Error($"记录工具使用失败: {ex.Message}", 500));
        }
    }

    /// <summary>
    /// 生成API密钥
    /// </summary>
    [HttpPost("api-key")]
    public async Task<ActionResult<ApiResponse<object>>> GenerateApiKey([FromBody] ApiKeyRequest request)
    {
        try
        {
            if (string.IsNullOrEmpty(request.UserId))
            {
                return BadRequest(ApiResponse.Error("UserId is required", 400));
            }

            // 检查是否已购买工具
            var hasPurchase = await _context.ToolPurchases
                .AnyAsync(p => 
                    p.ToolId == request.ToolId && 
                    p.UserId == request.UserId && 
                    p.IsActive &&
                    p.PaymentStatus == "paid" &&
                    (p.ExpiresAt == null || p.ExpiresAt > DateTime.Now));

            if (!hasPurchase)
            {
                return BadRequest(ApiResponse.Error("您尚未购买此工具", 400));
            }

            // 生成API密钥
            var apiKey = GenerateSecureApiKey();
            var hashedKey = HashApiKey(apiKey);

            var keyRecord = new ToolApiKey
            {
                ToolId = request.ToolId,
                UserId = request.UserId,
                ApiKey = hashedKey,
                KeyName = request.KeyName,
                RateLimit = request.RateLimit ?? 1000,
                IsActive = true,
                ExpiresAt = request.ExpiresAt
            };

            _context.ToolApiKeys.Add(keyRecord);
            await _context.SaveChangesAsync();

            // 返回原始密钥（只返回一次）
            return Ok(ApiResponse.Success(new
            {
                ApiKey = apiKey,
                KeyId = keyRecord.Id,
                KeyName = keyRecord.KeyName,
                RateLimit = keyRecord.RateLimit,
                ExpiresAt = keyRecord.ExpiresAt
            }));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "生成API密钥失败");
            return StatusCode(500, ApiResponse.Error($"生成API密钥失败: {ex.Message}", 500));
        }
    }

    /// <summary>
    /// 获取工具使用统计
    /// </summary>
    [HttpPost("analytics")]
    public async Task<ActionResult<ApiResponse<object>>> GetAnalytics([FromBody] AnalyticsRequest request)
    {
        try
        {
            var query = _context.ToolAnalytics
                .Where(a => a.ToolId == request.ToolId);

            if (request.StartDate.HasValue)
            {
                query = query.Where(a => a.Date >= request.StartDate.Value);
            }
            if (request.EndDate.HasValue)
            {
                query = query.Where(a => a.Date <= request.EndDate.Value);
            }

            var analytics = await query
                .OrderBy(a => a.Date)
                .Select(a => new
                {
                    a.Date,
                    a.ViewCount,
                    a.UseCount,
                    a.ApiCallCount,
                    a.PurchaseCount,
                    a.Revenue,
                    a.AvgExecutionTime,
                    a.ErrorCount
                })
                .ToListAsync();

            // 汇总统计
            var summary = new
            {
                TotalViews = analytics.Sum(a => a.ViewCount),
                TotalUses = analytics.Sum(a => a.UseCount),
                TotalApiCalls = analytics.Sum(a => a.ApiCallCount),
                TotalPurchases = analytics.Sum(a => a.PurchaseCount),
                TotalRevenue = analytics.Sum(a => a.Revenue),
                AvgExecutionTime = analytics.Where(a => a.AvgExecutionTime.HasValue)
                    .Select(a => a.AvgExecutionTime!.Value)
                    .DefaultIfEmpty(0)
                    .Average(),
                TotalErrors = analytics.Sum(a => a.ErrorCount)
            };

            return Ok(ApiResponse.Success(new
            {
                Summary = summary,
                Daily = analytics
            }));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "获取统计失败");
            return StatusCode(500, ApiResponse.Error($"获取统计失败: {ex.Message}", 500));
        }
    }

    /// <summary>
    /// 创建工具（管理后台）
    /// </summary>
    [HttpPost]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public async Task<ActionResult<ApiResponse<object>>> CreateTool([FromBody] CreateToolRequest request)
    {
        try
        {
            if (string.IsNullOrEmpty(request.Name))
            {
                return BadRequest(ApiResponse.Error("工具名称不能为空", 400));
            }

            if (string.IsNullOrEmpty(request.Slug))
            {
                return BadRequest(ApiResponse.Error("工具别名不能为空", 400));
            }

            // 检查 slug 是否已存在
            var existingTool = await _context.Tools
                .FirstOrDefaultAsync(t => t.Slug == request.Slug);
            
            if (existingTool != null)
            {
                return BadRequest(ApiResponse.Error("工具别名已存在", 400));
            }

            var tool = new Tool
            {
                Name = request.Name,
                Slug = request.Slug,
                Icon = request.Icon,
                Description = request.Description,
                DemoUrl = request.DemoUrl,
                Price = request.Price ?? 0,
                OriginalPrice = request.OriginalPrice,
                IsFree = request.IsFree ?? false,
                IsPremium = request.IsPremium ?? false,
                Status = request.Status ?? "draft",
                CategoryId = request.CategoryId,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            _context.Tools.Add(tool);
            await _context.SaveChangesAsync();

            return Ok(ApiResponse.Success(new
            {
                tool.Id,
                tool.Name,
                tool.Slug,
                tool.Status
            }));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "创建工具失败");
            return StatusCode(500, ApiResponse.Error($"创建工具失败: {ex.Message}", 500));
        }
    }

    /// <summary>
    /// 更新工具（管理后台）
    /// </summary>
    [HttpPut("{id}")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public async Task<ActionResult<ApiResponse<object>>> UpdateTool(long id, [FromBody] UpdateToolRequest request)
    {
        try
        {
            var tool = await _context.Tools.FindAsync(id);
            if (tool == null)
            {
                return NotFound(ApiResponse.Error("工具不存在", 404));
            }

            // 如果 slug 改变，检查是否冲突
            if (!string.IsNullOrEmpty(request.Slug) && request.Slug != tool.Slug)
            {
                var existingTool = await _context.Tools
                    .FirstOrDefaultAsync(t => t.Slug == request.Slug && t.Id != id);
                
                if (existingTool != null)
                {
                    return BadRequest(ApiResponse.Error("工具别名已存在", 400));
                }
                tool.Slug = request.Slug;
            }

            if (!string.IsNullOrEmpty(request.Name))
            {
                tool.Name = request.Name;
            }
            if (request.Icon != null)
            {
                tool.Icon = request.Icon;
            }
            if (request.Description != null)
            {
                tool.Description = request.Description;
            }
            if (request.DemoUrl != null)
            {
                tool.DemoUrl = request.DemoUrl;
            }
            if (request.Price.HasValue)
            {
                tool.Price = request.Price.Value;
            }
            if (request.OriginalPrice != null)
            {
                tool.OriginalPrice = request.OriginalPrice;
            }
            if (request.IsFree.HasValue)
            {
                tool.IsFree = request.IsFree.Value;
            }
            if (request.IsPremium.HasValue)
            {
                tool.IsPremium = request.IsPremium.Value;
            }
            if (!string.IsNullOrEmpty(request.Status))
            {
                tool.Status = request.Status;
            }
            if (request.CategoryId.HasValue)
            {
                tool.CategoryId = request.CategoryId;
            }

            tool.UpdatedAt = DateTime.Now;
            await _context.SaveChangesAsync();

            return Ok(ApiResponse.Success(new
            {
                tool.Id,
                tool.Name,
                tool.Slug,
                tool.Status
            }));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "更新工具失败");
            return StatusCode(500, ApiResponse.Error($"更新工具失败: {ex.Message}", 500));
        }
    }

    /// <summary>
    /// 删除工具（管理后台）
    /// </summary>
    [HttpDelete("{id}")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public async Task<ActionResult<ApiResponse<object>>> DeleteTool(long id)
    {
        try
        {
            var tool = await _context.Tools.FindAsync(id);
            if (tool == null)
            {
                return NotFound(ApiResponse.Error("工具不存在", 404));
            }

            _context.Tools.Remove(tool);
            await _context.SaveChangesAsync();

            return Ok(ApiResponse.Success(new { Message = "删除成功" }));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "删除工具失败");
            return StatusCode(500, ApiResponse.Error($"删除工具失败: {ex.Message}", 500));
        }
    }

    // 辅助方法：生成安全的API密钥
    private string GenerateSecureApiKey()
    {
        var bytes = new byte[32];
        using (var rng = RandomNumberGenerator.Create())
        {
            rng.GetBytes(bytes);
        }
        return Convert.ToBase64String(bytes).Replace("+", "-").Replace("/", "_").Replace("=", "");
    }

    // 辅助方法：哈希API密钥
    private string HashApiKey(string apiKey)
    {
        using var sha256 = SHA256.Create();
        var hash = sha256.ComputeHash(Encoding.UTF8.GetBytes(apiKey));
        return Convert.ToBase64String(hash);
    }
}

// 请求模型
public class PurchaseRequest
{
    public long ToolId { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string? PurchaseType { get; set; }
    public string? PaymentMethod { get; set; }
}

// 使用统一的请求模型（已在 CommonRequests.cs 中定义）

public class UsageRequest
{
    public long ToolId { get; set; }
    public string? UserId { get; set; }
    public string? UsageType { get; set; }
    public Dictionary<string, object>? RequestData { get; set; }
    public Dictionary<string, object>? ResponseData { get; set; }
    public int? ExecutionTime { get; set; }
    public string? Status { get; set; }
    public string? ErrorMessage { get; set; }
}

public class ApiKeyRequest
{
    public long ToolId { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string? KeyName { get; set; }
    public int? RateLimit { get; set; }
    public DateTime? ExpiresAt { get; set; }
}

public class AnalyticsRequest
{
    public long ToolId { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}

public class CreateToolRequest
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Icon { get; set; }
    public string? Description { get; set; }
    public string? DemoUrl { get; set; }
    public decimal? Price { get; set; }
    public decimal? OriginalPrice { get; set; }
    public bool? IsFree { get; set; }
    public bool? IsPremium { get; set; }
    public string? Status { get; set; }
    public long? CategoryId { get; set; }
}

public class UpdateToolRequest
{
    public string? Name { get; set; }
    public string? Slug { get; set; }
    public string? Icon { get; set; }
    public string? Description { get; set; }
    public string? DemoUrl { get; set; }
    public decimal? Price { get; set; }
    public decimal? OriginalPrice { get; set; }
    public bool? IsFree { get; set; }
    public bool? IsPremium { get; set; }
    public string? Status { get; set; }
    public long? CategoryId { get; set; }
}

