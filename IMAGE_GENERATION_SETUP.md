# Image Generation Setup Guide

## Overview
This project now includes a professional image generation system using Stable Diffusion XL via Replicate API, with a fallback to Hugging Face API.

## Features
- **High-quality image generation** using Stable Diffusion XL
- **Customizable parameters** (width, height, steps, guidance scale)
- **Negative prompts** to avoid unwanted elements
- **Fallback system** using Hugging Face API if Replicate fails
- **Error handling** with detailed error messages
- **Data URI output** for immediate use in web applications

## API Keys Required

### 1. Replicate API Token (Primary)
- Sign up at [replicate.com](https://replicate.com)
- Get your API token from the dashboard
- Add to `.env.local`:
```
REPLICATE_API_TOKEN=your_replicate_api_token_here
```

### 2. Hugging Face API Token (Fallback)
- Sign up at [huggingface.co](https://huggingface.co)
- Get your API token from settings
- Add to `.env.local`:
```
HUGGINGFACE_API_TOKEN=your_huggingface_api_token_here
```

## Usage

### Basic Usage
```typescript
import { generateImageFromText } from '@/ai/flows/generate-image-from-text';

const result = await generateImageFromText({
  prompt: "A beautiful sunset over mountains, photorealistic, high quality"
});
```

### Advanced Usage
```typescript
const result = await generateImageFromText({
  prompt: "A cat wearing a spacesuit, photorealistic",
  negative_prompt: "blurry, low quality, distorted, ugly",
  width: 1024,
  height: 1024,
  num_inference_steps: 20,
  guidance_scale: 7.5
});
```

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `prompt` | string | required | Text description of the image to generate |
| `negative_prompt` | string | optional | Text describing what to avoid |
| `width` | number | 1024 | Image width in pixels |
| `height` | number | 1024 | Image height in pixels |
| `num_inference_steps` | number | 20 | Number of generation steps (higher = better quality, slower) |
| `guidance_scale` | number | 7.5 | How closely to follow the prompt (higher = more adherence) |

## Error Handling

The system includes comprehensive error handling:
- **Primary failure**: If Replicate API fails, automatically tries Hugging Face
- **Fallback failure**: If both APIs fail, returns detailed error message
- **Network issues**: Handles download failures gracefully
- **Invalid responses**: Validates API responses before processing

## Testing

1. **Start the development server**:
```bash
npm run dev
```

2. **Navigate to the image editor**:
```
http://localhost:3000/dashboard/image-editor
```

3. **Test with a simple prompt**:
```
"A beautiful sunset over mountains, photorealistic, high quality"
```

## Troubleshooting

### Common Issues

1. **"Image generation failed"**
   - Check your API tokens are correctly set in `.env.local`
   - Verify you have sufficient credits on Replicate
   - Check your internet connection

2. **"Failed to download generated image"**
   - Usually a temporary network issue
   - Try again in a few minutes

3. **"Hugging Face API failed"**
   - The free tier may be rate limited
   - Consider upgrading to a paid plan

### Performance Tips

- **Lower resolution** (512x512) for faster generation
- **Fewer inference steps** (10-15) for quicker results
- **Higher guidance scale** (8-10) for more prompt adherence
- **Use negative prompts** to avoid common issues

## Model Information

### Primary: Stable Diffusion XL (Replicate)
- **Model**: `stability-ai/sdxl`
- **Quality**: High-quality, photorealistic images
- **Speed**: ~10-30 seconds per image
- **Cost**: Pay-per-use

### Fallback: Stable Diffusion v1.5 (Hugging Face)
- **Model**: `runwayml/stable-diffusion-v1-5`
- **Quality**: Good quality images
- **Speed**: ~5-15 seconds per image
- **Cost**: Free tier available

## Security Notes

- API tokens are stored in environment variables
- Never commit API tokens to version control
- Use different tokens for development and production
- Monitor API usage to avoid unexpected charges

## Future Enhancements

- [ ] Add support for image-to-image generation
- [ ] Implement image editing capabilities
- [ ] Add batch generation support
- [ ] Integrate with more AI models
- [ ] Add image style presets 