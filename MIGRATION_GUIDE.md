# Migration Guide - Multi Mockup Support

## Database Schema Changes

The schema has been updated to support multiple mockups per job. You need to migrate the database.

### Option 1: Reset Database (Development - Data will be lost)

```bash
# Delete existing database
rm prisma/dev.db

# Create new database with updated schema
npx prisma db push
npx prisma generate
```

### Option 2: Manual Migration (Preserve Data)

If you have important data, you'll need to:

1. Backup your data
2. Run migration:
```bash
npx prisma db push
npx prisma generate
```

**Note:** The old `Job.mockupId` field has been removed. Each `JobDesign` now has its own `mockupId` to support multiple mockups per job.

## What Changed

- `Job` model: Removed `mockupId` field
- `JobDesign` model: Added `mockupId` field
- `Mockup` model: Now relates to `JobDesign` instead of `Job`
- API: Now accepts `mockupIds` array instead of single `mockupId`

## New Features

- Select multiple mockups in Step 4
- Generate all combinations: mockups × designs
- Preview shows mockup name for each output
- ZIP export includes all combinations


