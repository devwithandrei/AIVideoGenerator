# Newspaper Animator - Remotion Integration

This folder contains the Remotion project for high-quality video rendering of newspaper animations.

## 🎬 Features

- **Classic Spin Animation**: Traditional newspaper spinning intro effect
- **Documentary Search Animation**: Professional search and highlight effect
- **Multiple Durations**: 5s, 10s, 15s, 20s, 25s, 30s, or Auto
- **Theme Support**: Light and dark themes
- **Aspect Ratios**: Landscape and vertical orientations
- **High Quality**: 60fps rendering with H.264 codec

## 📁 Project Structure

```
newspaper-remotion/
├── src/
│   ├── index.ts                 # Main entry point
│   ├── Root.tsx                 # Root component with compositions
│   ├── NewspaperSpinComposition.tsx    # Spin animation
│   └── NewspaperSearchComposition.tsx  # Search animation
├── package.json                 # Remotion dependencies
└── README.md                    # This file
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Remotion CLI installed globally: `npm install -g @remotion/cli`

### Installation

1. Install dependencies:
```bash
cd newspaper-remotion
npm install
```

2. Start the preview server:
```bash
npm run preview
```

3. Open http://localhost:3000 to preview animations

## 📝 Usage

### Preview Animations

```bash
npm run preview
```

### Render Videos

```bash
npm run render
```

### Build for Production

```bash
npm run build
```

## 🔧 API Integration

The Remotion project integrates with the Next.js API route `/api/render-video`:

### Request Format

```json
{
  "name": "Your Text",
  "theme": "light" | "dark",
  "aspect": "landscape" | "vertical", 
  "duration": "5s" | "10s" | "15s" | "20s" | "25s" | "30s" | "auto",
  "effectType": "spin" | "search",
  "newspaperImage": "base64_image_data" // Optional for search effect
}
```

### Response Format

```json
{
  "success": true,
  "videoUrl": "/videos/newspaper-spin-1234567890.mp4",
  "filename": "newspaper-spin-1234567890.mp4"
}
```

## 🎨 Animation Details

### Classic Spin Animation
- **Duration**: 5 seconds (default)
- **Effect**: 720° rotation with zoom and fade-in
- **Features**: 
  - Newspaper background with Lorem Ipsum text
  - Spinning animation with easing
  - Zoom effect from 1.0x to 1.15x
  - Headline fade-in at 70% progress

### Documentary Search Animation  
- **Duration**: 8 seconds (default)
- **Effect**: Zoom, pan, search rectangle, magnifying glass, highlight
- **Features**:
  - Phase 1 (0-20%): Initial zoom
  - Phase 2 (20-40%): Pan across newspaper
  - Phase 3 (40-60%): Search rectangle appears
  - Phase 4 (60-80%): Magnifying glass effect
  - Phase 5 (80-100%): Name highlight with glow

## 🛠️ Development

### Adding New Animations

1. Create a new composition component in `src/`
2. Add it to `Root.tsx` with proper props
3. Update the API route to handle the new composition
4. Test with the preview server

### Customizing Animations

- Modify timing in the composition components
- Adjust colors, fonts, and effects
- Change animation curves and easing
- Add new visual elements

## 🚀 Deployment

### Local Development

1. Start Next.js server: `npm run dev`
2. Start Remotion preview: `npm run remotion:preview`
3. Both servers run independently

### Production Deployment

1. Build Remotion project: `npm run remotion:build`
2. Deploy Next.js with Remotion integration
3. Ensure video output directory is writable
4. Configure proper file permissions

### Serverless Deployment

For serverless environments (Vercel, Netlify):

1. Use Remotion Lambda for rendering
2. Configure environment variables
3. Set up proper timeout limits
4. Handle large file uploads

## 🔍 Troubleshooting

### Common Issues

1. **Build Errors**: Check TypeScript compilation
2. **Rendering Failures**: Verify file permissions
3. **Memory Issues**: Reduce video quality or duration
4. **Timeout Errors**: Increase server timeout limits

### Performance Tips

- Use lower resolutions for testing
- Reduce frame rate for faster rendering
- Optimize image assets
- Use hardware acceleration when available

## 📚 Resources

- [Remotion Documentation](https://www.remotion.dev/)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is part of the MediaForge AI application.
