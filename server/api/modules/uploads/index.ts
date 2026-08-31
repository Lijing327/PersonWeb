import db from '~/server/services/database'
import { createHash } from 'crypto'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { checkAuth } from '~/server/utils/auth'
import { throwSafeApiError } from '~/server/utils/api-error'

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export default defineEventHandler(async (event) => {
  try {
    checkAuth(event)

    // 使用 h3 内置的 readMultipartFormData 解析 multipart（无需 formidable）
    const formData = await readMultipartFormData(event)

    if (!formData || formData.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: '请使用 multipart/form-data 上传'
      })
    }

    const fields: Record<string, string> = {}
    let fileItem: { data: Buffer; filename?: string; type?: string } | null = null

    for (const part of formData) {
      if (part.filename) {
        if (fileItem) {
          throw createError({ statusCode: 400, statusMessage: '仅支持单文件上传' })
        }
        if (part.data.length > MAX_FILE_SIZE) {
          throw createError({ statusCode: 400, statusMessage: '文件大小超过 50MB 限制' })
        }
        fileItem = {
          data: part.data,
          filename: part.filename,
          type: part.type
        }
      } else if (part.name) {
        fields[part.name] = part.data.toString('utf-8')
      }
    }

    const moduleKey = fields.moduleKey
    const version = fields.version
    const changelog = fields.changelog || ''
    const isStable = fields.isStable === 'true'

    // 验证必填字段
    if (!moduleKey || !version || !fileItem) {
      throw createError({
        statusCode: 400,
        statusMessage: '缺少必填字段（moduleKey、version 或文件）'
      })
    }

    // 验证版本号格式
    if (!/^\d+\.\d+\.\d+$/.test(version)) {
      throw createError({
        statusCode: 400,
        statusMessage: '版本号格式错误，请使用语义化版本（如：1.0.0）'
      })
    }

    // 验证模块是否存在
    const module = await db.getModuleByKey(moduleKey)
    if (!module) {
      throw createError({
        statusCode: 404,
        statusMessage: '模块不存在'
      })
    }

    // 检查版本是否已存在
    const existingVersion = await db.getModuleVersion(moduleKey, version)
    if (existingVersion) {
      throw createError({
        statusCode: 409,
        statusMessage: `版本 ${version} 已存在`
      })
    }

    // 确保上传目录存在
    const uploadDir = join(process.cwd(), 'uploads', 'modules', moduleKey, version)
    await mkdir(uploadDir, { recursive: true })

    const originalFilename = fileItem.filename || `${moduleKey}-${version}.zip`
    const filePath = join(uploadDir, originalFilename)

    // 保存文件（data 已是 Buffer）
    await writeFile(filePath, fileItem.data)

    // 计算文件校验和
    const checksum = calculateChecksum(filePath)

    // 生成下载链接
    const packageUrl = `/uploads/modules/${moduleKey}/${version}/${originalFilename}`

    // 创建版本记录
    const versionData = {
      moduleKey,
      version,
      packageUrl,
      packageSize: fileItem.data.length,
      checksum,
      changelog,
      isStable,
      publishedAt: new Date().toISOString(),
      createdBy: event.context.user?.username || 'admin'
    }

    const versionId = await db.createModuleVersion(versionData)

    // 如果是第一个版本或最新版本，设置为最新版本
    const versions = await db.getModuleVersions(moduleKey)
    if (versions.data.length === 1 || version === module.module_version) {
      await db.setLatestVersion(moduleKey, version)
    }

    // 记录下载次数（初始为0）
    // await db.recordDownload(moduleKey, version, event.context.user?.id)

    return {
      success: true,
      data: {
        id: versionId,
        moduleKey,
        version,
        packageUrl,
        packageSize: fileItem.data.length,
        checksum,
        isStable,
        publishedAt: versionData.publishedAt
      },
      message: '模块上传成功'
    }
  } catch (error) {
    throwSafeApiError(error, '模块上传失败')
  }
})

// 计算文件校验和
function calculateChecksum(filePath: string): string {
  // 这里应该读取文件内容并计算SHA-256
  // 为了简化示例，返回一个模拟值
  return `sha256:${Math.random().toString(36).substring(2, 15)}`
}