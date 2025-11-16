const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function migrate() {
  console.log('Starting migration...')

  try {
    // Get all existing jobs with their mockupId
    const oldJobs = await prisma.$queryRaw`
      SELECT id, "mockupId" FROM "Job" WHERE "mockupId" IS NOT NULL
    `

    console.log(`Found ${oldJobs.length} jobs to migrate`)

    for (const job of oldJobs) {
      // Get all jobDesigns for this job
      const jobDesigns = await prisma.$queryRaw`
        SELECT id FROM "JobDesign" WHERE "jobId" = ${job.jobId}
      `

      // Update each jobDesign to have the mockupId
      for (const jd of jobDesigns) {
        await prisma.$executeRaw`
          UPDATE "JobDesign" 
          SET "mockupId" = ${job.mockupId}
          WHERE id = ${jd.id}
        `
      }
    }

    console.log('Migration completed successfully!')
  } catch (error) {
    console.error('Migration error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

migrate()


