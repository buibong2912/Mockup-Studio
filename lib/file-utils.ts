import path from 'path'
import { existsSync } from 'fs'

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

/**
 * Tìm đường dẫn đến thư mục public
 * Hỗ trợ cả development và production (standalone mode)
 */
export function getPublicPath(): string {
  const cwd = process.cwd()
  
  // Các đường dẫn có thể có của thư mục public
  const possiblePaths = [
    path.join(cwd, 'public'), // Normal case
    path.join(cwd, '..', 'public'), // Standalone mode (cwd is .next/standalone)
    path.join(cwd, '../..', 'public'), // Nested standalone
    '/app/public', // Docker container
    path.join(process.env.PUBLIC_DIR || '', 'public'), // Custom env variable
  ]
  
  // Tìm đường dẫn đầu tiên tồn tại
  for (const publicPath of possiblePaths) {
    if (existsSync(publicPath)) {
      return publicPath
    }
  }
  
  // Fallback: trả về đường dẫn mặc định
  return path.join(cwd, 'public')
}

/**
 * Lấy đường dẫn đầy đủ đến file trong thư mục public
 */
export function getPublicFilePath(relativePath: string): string {
  const publicPath = getPublicPath()
  return path.join(publicPath, relativePath)
}


