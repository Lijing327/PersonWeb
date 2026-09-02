-- 访客留言：支持访客自填备注姓名
ALTER TABLE `visitor_message`
  ADD COLUMN IF NOT EXISTS `visitor_name` VARCHAR(50) DEFAULT NULL COMMENT '访客备注姓名' AFTER `visitor_id`;
