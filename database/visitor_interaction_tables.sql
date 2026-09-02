-- 访客互动系统数据库表结构

-- ============================================
-- 1. VisitorMessage 表 - 访客留言/弹幕
-- ============================================
CREATE TABLE IF NOT EXISTS `visitor_message` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '留言ID',
    `visitor_id` VARCHAR(100) NOT NULL COMMENT '访客ID',
    `visitor_name` VARCHAR(50) DEFAULT NULL COMMENT '访客备注姓名',
    `message_type` VARCHAR(20) NOT NULL DEFAULT 'message' COMMENT '消息类型：message-留言, mood-心情, blessing-祝福',
    `content` TEXT NOT NULL COMMENT '消息内容',
    `emoji` VARCHAR(10) DEFAULT NULL COMMENT '表情符号',
    `color` VARCHAR(20) DEFAULT NULL COMMENT '显示颜色（HEX格式）',
    `status` VARCHAR(20) DEFAULT 'pending' COMMENT '状态：pending-待审核, approved-已通过, rejected-已拒绝',
    `ip` VARCHAR(50) DEFAULT NULL COMMENT 'IP地址',
    `location` VARCHAR(100) DEFAULT NULL COMMENT '地理位置（如：杭州）',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `approved_at` DATETIME DEFAULT NULL COMMENT '审核通过时间',
    PRIMARY KEY (`id`),
    INDEX `idx_visitor_id` (`visitor_id`),
    INDEX `idx_status` (`status`),
    INDEX `idx_message_type` (`message_type`),
    INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='访客留言表';

-- ============================================
-- 2. VisitorFootprint 表 - 访客足迹
-- ============================================
CREATE TABLE IF NOT EXISTS `visitor_footprint` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '足迹ID',
    `visitor_id` VARCHAR(100) NOT NULL COMMENT '访客ID',
    `emoji` VARCHAR(10) NOT NULL COMMENT '表情符号或图标',
    `icon_type` VARCHAR(20) DEFAULT 'emoji' COMMENT '图标类型：emoji-表情, icon-图标',
    `message` VARCHAR(200) DEFAULT NULL COMMENT '留言（可选）',
    `x_position` DECIMAL(5,2) DEFAULT NULL COMMENT 'X坐标位置（百分比 0-100）',
    `y_position` DECIMAL(5,2) DEFAULT NULL COMMENT 'Y坐标位置（百分比 0-100）',
    `ip` VARCHAR(50) DEFAULT NULL COMMENT 'IP地址',
    `location` VARCHAR(100) DEFAULT NULL COMMENT '地理位置',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    INDEX `idx_visitor_id` (`visitor_id`),
    INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='访客足迹表';

-- ============================================
-- 3. VisitorBubble 表 - 访客气泡记录
-- ============================================
CREATE TABLE IF NOT EXISTS `visitor_bubble` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '气泡ID',
    `visitor_id` VARCHAR(100) NOT NULL COMMENT '访客ID',
    `avatar_url` VARCHAR(255) DEFAULT NULL COMMENT '头像URL（可选）',
    `location` VARCHAR(100) DEFAULT NULL COMMENT '地理位置',
    `display_text` VARCHAR(100) DEFAULT NULL COMMENT '显示文本（如：一位来自杭州的访客进入了网站）',
    `displayed_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '显示时间',
    PRIMARY KEY (`id`),
    INDEX `idx_visitor_id` (`visitor_id`),
    INDEX `idx_displayed_at` (`displayed_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='访客气泡记录表';

