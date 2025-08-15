# Build and Run Instructions

## Overview
This project consists of two main components:
1. **Main Next.js Application** - The primary web application
2. **Newspaper Remotion Project** - A separate Remotion project for video rendering

## Quick Start

### Development Mode (Both Projects)
```bash
# Install all dependencies for both projects
npm run install:all

# Start both projects in development mode
npm run dev
```

This will start:
- Next.js app on `http://localhost:9002`
- Remotion preview server on `http://localhost:3000`

### Production Build
```bash
# Build only the main Next.js application (recommended for production)
npm run build

# Build both projects (if Remotion rendering is needed)
npm run build:all

# Start production servers
npm run start
```

## Available Scripts

### Main Application Scripts
```bash
npm run dev              # Start both projects in development
npm run dev:next         # Start only Next.js in development
npm run build            # Build only Next.js application
npm run build:next       # Build only Next.js application
npm run start            # Start both projects in production
npm run start:next       # Start only Next.js in production
```

### Remotion Project Scripts
```bash
npm run remotion:preview # Start Remotion preview server
npm run remotion:render  # Render a video with Remotion
npm run remotion:build   # Build Remotion project
npm run build:remotion   # Build Remotion project
```

### Combined Scripts
```bash
npm run build:all        # Build both projects simultaneously
npm run install:all      # Install dependencies for both projects
npm run clean            # Clean build artifacts
npm run clean:all        # Clean everything including node_modules
```

## Project Structure

```
MediiaForgeAI/
├── src/                    # Main Next.js application
├── newspaper-remotion/     # Remotion project
│   ├── src/
│   │   ├── index.ts       # Remotion entry point
│   │   ├── Root.tsx       # Remotion compositions
│   │   ├── NewspaperSpinComposition.tsx
│   │   └── NewspaperSearchComposition.tsx
│   ├── package.json
│   └── remotion.config.ts
├── package.json           # Main project package.json
└── .env                   # Environment variables
```

## Development Workflow

### 1. Initial Setup
```bash
# Clone the repository
git clone <repository-url>
cd MediiaForgeAI

# Install all dependencies
npm run install:all
```

### 2. Development
```bash
# Start both projects
npm run dev

# Access the application
# Main app: http://localhost:9002
# Remotion preview: http://localhost:3000
```

### 3. Building for Production
```bash
# Build the main application (recommended)
npm run build

# Or build both projects if needed
npm run build:all

# Start production servers
npm run start
```

## Environment Variables

Create a `.env` file in the root directory:
```env
CLOUDINARY_URL=cloudinary://your-cloudinary-url
# Add other required environment variables
```

## Troubleshooting

### Common Issues

1. **Port Conflicts**
   - Next.js runs on port 9002
   - Remotion runs on port 3000
   - Make sure these ports are available

2. **Build Failures**
   - Clean build artifacts: `npm run clean`
   - Reinstall dependencies: `npm run install:all`
   - Try building separately: `npm run build:next`

3. **Remotion Issues**
   - Remotion requires Chrome/Chromium for rendering
   - Ensure Chrome is installed and accessible
   - Check Remotion configuration in `newspaper-remotion/remotion.config.ts`

### Clean Build
```bash
# Clean everything and start fresh
npm run clean:all
npm run install:all
npm run build
```

## Deployment

### Vercel (Recommended)
```bash
# Deploy to Vercel
vercel

# The main Next.js application will be deployed
# Remotion project is for local development only
```

### Other Platforms
- Deploy only the main Next.js application
- Remotion project is used for local video rendering
- Cloudinary handles video storage and delivery

## Notes

- The Remotion project is primarily for development and testing
- Production video generation uses client-side canvas rendering
- Videos are stored in Cloudinary for better performance
- Both projects can run independently if needed

## Support

For issues related to:
- Main application: Check Next.js documentation
- Remotion project: Check Remotion documentation
- Video rendering: Check Cloudinary documentation
