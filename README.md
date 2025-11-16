# Mockup Design Tool

A Next.js application for batch compositing designs onto mockups.

## Features

- Upload mockup images (PNG/JPG)
- Define design area on mockup (drag & resize)
- Batch upload design files (PNG with transparent background)
- Automatic compositing of designs onto mockups
- Export results as ZIP with custom naming pattern

## Tech Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- Prisma (SQLite)
- Sharp (image processing)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Setup database:
```bash
npm run db:generate
npm run db:push
```

3. (Optional) Create upload directories manually, or they will be created automatically:
```bash
npm run setup
```

4. Run development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Usage

1. Upload a mockup image
2. Define the design area by dragging and resizing the frame
3. Upload multiple design files
4. Process the batch job
5. Download results as ZIP

