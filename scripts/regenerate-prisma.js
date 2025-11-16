const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('Regenerating Prisma Client...')

try {
  // Remove .prisma cache
  const prismaCachePath = path.join(process.cwd(), 'node_modules', '.prisma')
  if (fs.existsSync(prismaCachePath)) {
    console.log('Removing Prisma cache...')
    fs.rmSync(prismaCachePath, { recursive: true, force: true })
  }

  // Generate Prisma Client
  console.log('Generating Prisma Client...')
  execSync('npx prisma generate', { stdio: 'inherit' })

  console.log('✅ Prisma Client regenerated successfully!')
  console.log('⚠️  Please restart your dev server for changes to take effect.')
} catch (error) {
  console.error('Error regenerating Prisma Client:', error)
  process.exit(1)
}


