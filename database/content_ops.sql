-- Phase 4B: Operations registry for Git content (Articles / Projects)
-- Git = content facts; content_ops = metrics + operational overrides
-- Do NOT store title/body/summary here.

CREATE TABLE IF NOT EXISTS `content_ops` (
    `entity_type` ENUM('article', 'project') NOT NULL COMMENT '实体类型',
    `slug` VARCHAR(255) NOT NULL COMMENT 'Git canonical slug',
    `legacy_id` VARCHAR(64) NOT NULL COMMENT 'Article: numeric id; Project: GUID',
    `view_count` INT NOT NULL DEFAULT 0 COMMENT '浏览次数（迁移时保留，禁止 reset）',
    `featured` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '运营置顶',
    `sort_order` INT NULL COMMENT '运营排序（可选）',
    `takedown` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '紧急下架 override，不修改 Git status',
    `source_type` VARCHAR(50) NULL COMMENT 'Articles: manual/ai_generated/...',
    `content_hash` CHAR(64) NULL COMMENT 'Git 内容 SHA256，用于 sync 校验',
    `synced_at` DATETIME NULL COMMENT '最后一次与 Git 对齐时间',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`entity_type`, `slug`),
    UNIQUE KEY `uk_entity_legacy` (`entity_type`, `legacy_id`),
    INDEX `idx_takedown` (`takedown`),
    INDEX `idx_featured` (`featured`),
    INDEX `idx_view_count` (`view_count`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Git 内容运营注册表';
