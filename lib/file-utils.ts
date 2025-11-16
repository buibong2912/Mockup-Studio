import path from 'path'

/**
 * Sanitize và rút ngắn tên file để tránh lỗi path quá dài trên Windows
 */
export function sanitizeFilename(filename: string, maxLength: number = 100): string {
  // Lấy extension
  const ext = path.extname(filename)
  const nameWithoutExt = path.basename(filename, ext)
  
  // Sanitize: loại bỏ ký tự đặc biệt, chỉ giữ alphanumeric, space, dash, underscore
  const sanitized = nameWithoutExt
    .replace(/[^a-zA-Z0-9\s\-_]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, maxLength - ext.length - 20) // Reserve space for timestamp and extension
  
  // Tạo tên file ngắn với timestamp
  const timestamp = Date.now()
  const shortName = sanitized || 'file'
  
  return `${timestamp}-${shortName}${ext}`
}

/**
 * Kiểm tra file có tồn tại không
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    const fs = await import('fs/promises')
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}


