'use server';

/**
 * @fileOverview Generates a video from an image using the Hailuo (minimax/video-01) model.
 *
 * - generateVideoFromImageHailuo - A function that handles the video generation process.
 * - GenerateVideoFromImageHailuoInput - The input type for the generateVideoFromImageHailuo function.
 * - GenerateVideoFromImageHailuoOutput - The return type for the generateVideoFromImageHailuo function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import Replicate from 'replicate';

const GenerateVideoFromImageHailuoInputSchema = z.object({
  imageDataUri: z.string().describe('The input image as a data URI.'),
  prompt: z.string().optional().describe('Optional text prompt to guide the video generation.'),
  model: z.string().describe('The AI model to use for generation.'),
  aspectRatio: z.string().describe('The aspect ratio of the video.'),
  resolution: z.string().describe('The resolution of the video.'),
  format: z.string().describe('The file format of the video.'),
});
export type GenerateVideoFromImageHailuoInput = z.infer<typeof GenerateVideoFromImageHailuoInputSchema>;

const GenerateVideoFromImageHailuoOutputSchema = z.object({
  videoDataUri: z.string().describe('The generated video as a data URI.'),
});
export type GenerateVideoFromImageHailuoOutput = z.infer<typeof GenerateVideoFromImageHailuoOutputSchema>;

export async function generateVideoFromImageHailuo(input: GenerateVideoFromImageHailuoInput): Promise<GenerateVideoFromImageHailuoOutput> {
  return generateVideoFromImageHailuoFlow(input);
}

const generateVideoFromImageHailuoFlow = ai.defineFlow(
  {
    name: 'generateVideoFromImageHailuoFlow',
    inputSchema: GenerateVideoFromImageHailuoInputSchema,
    outputSchema: GenerateVideoFromImageHailuoOutputSchema,
  },
  async (input) => {
    try {
      // Initialize Replicate client
      const replicate = new Replicate({
        auth: process.env.REPLICATE_API_TOKEN,
      });

      // Convert data URI to buffer
      const base64Data = input.imageDataUri.split(',')[1];
      const imageBuffer = Buffer.from(base64Data, 'base64');

      // Generate video using Hailuo (minimax/video-01) with image input
      const inputParams = {
        image: imageBuffer,
        prompt: input.prompt || "Create a dynamic video from this image",
        // Hailuo specific parameters for better control
        num_frames: 144, // 6 seconds at 24fps
        fps: 24,
        guidance_scale: 7.5,
        seed: Math.floor(Math.random() * 1000000),
        // Note: Hailuo generates videos with sound by default
        // No explicit audio parameter needed
      };
      
      console.log('Hailuo image-to-video API call parameters:', inputParams);
      
      const modelId = "minimax/video-01";
      console.log('Using model ID:', modelId);
      
      // Use the simpler replicate.run() method as shown in documentation
      const output = await replicate.run("minimax/video-01", { input: inputParams });
      
      console.log('Hailuo image-to-video API response:', output);
      console.log('Hailuo image-to-video API response type:', typeof output);
      
      if (!output) {
        throw new Error('Failed to generate video with Hailuo');
      }

      // Handle different response types
      let videoUrl: string;
      
      if (typeof output === 'string') {
        // Direct URL response
        videoUrl = output;
      } else if (output && typeof output === 'object' && 'url' in output) {
        // Object with URL property
        videoUrl = (output as any).url;
      } else if (output && typeof output === 'object' && 'output' in output) {
        // Object with output property
        videoUrl = (output as any).output;
      } else {
        console.error('Unexpected output format:', output);
        throw new Error('Unexpected response format from Hailuo API');
      }
      
      console.log('Extracted video URL:', videoUrl);

      // Download the video and convert to data URI
      const fetch = (await import('node-fetch')).default;
      const videoResponse = await fetch(videoUrl);
      
      if (!videoResponse.ok) {
        throw new Error('Failed to download generated video');
      }

      const videoBuffer = await videoResponse.arrayBuffer();
      const videoBase64 = Buffer.from(videoBuffer).toString('base64');
      const videoDataUri = `data:video/mp4;base64,${videoBase64}`;

      return { videoDataUri };
    } catch (error) {
      console.error('Hailuo image-to-video generation failed:', error);
      
      // Handle specific Replicate payment errors
      if (error instanceof Error && error.message.includes('402 Payment Required')) {
        throw new Error('Replicate free credits exhausted. Please set up billing at https://replicate.com/account/billing to continue using Hailuo model.');
      }
      
      if (error instanceof Error && error.message.includes('Free time limit reached')) {
        throw new Error('Replicate free time limit reached. Please set up billing at https://replicate.com/account/billing to continue using Hailuo model.');
      }
      
      throw new Error(`Video generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
); 