// Test script for image generation
const { generateImageFromText } = require('./src/ai/flows/generate-image-from-text.ts');

async function testImageGeneration() {
  try {
    console.log('Testing image generation...');
    
    const result = await generateImageFromText({
      prompt: "A beautiful sunset over mountains, photorealistic, high quality",
      width: 1024,
      height: 1024,
      num_inference_steps: 20,
      guidance_scale: 7.5
    });
    
    console.log('✅ Image generation successful!');
    console.log('Image data URI length:', result.imageDataUri.length);
    console.log('Image data URI starts with:', result.imageDataUri.substring(0, 50) + '...');
    
  } catch (error) {
    console.error('❌ Image generation failed:', error.message);
  }
}

testImageGeneration(); 