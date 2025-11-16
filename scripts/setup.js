const fs = require('fs')
const path = require('path')

const directories = [
  'public/uploads/mockups',
  'public/uploads/designs',
  'public/outputs'
]

directories.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir)
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true })
    console.log(`Created directory: ${dir}`)
  } else {
    console.log(`Directory already exists: ${dir}`)
  }
})

console.log('Setup complete!')


