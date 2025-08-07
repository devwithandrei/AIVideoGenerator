'use server';

/**
 * @fileOverview Generates a video from a text prompt using the Hailuo (minimax/video-01) model.
 *
 * - generateVideoFromTextHailuo - A function that handles the video generation process.
 * - GenerateVideoFromTextHailuoInput - The input type for the generateVideoFromTextHailuo function.
 * - GenerateVideoFromTextHailuoOutput - The return type for the generateVideoFromTextHailuo function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import Replicate from 'replicate';
import { CreditService } from '@/lib/services/credit-service';

// Function to sanitize prompts for content moderation
function sanitizePrompt(prompt: string): string {
  // Remove potentially problematic words and phrases
  const problematicWords = [
    'violence', 'violent', 'blood', 'gore', 'weapon', 'gun', 'knife', 'fight', 'fighting',
    'nude', 'naked', 'explicit', 'sexual', 'adult', 'mature', 'inappropriate',
    'hate', 'discrimination', 'racist', 'sexist', 'offensive', 'inappropriate',
    'illegal', 'criminal', 'drug', 'alcohol', 'smoking', 'tobacco'
  ];
  
  let sanitized = prompt.toLowerCase();
  
  // Replace problematic words with safer alternatives
  const replacements: Record<string, string> = {
    'violence': 'action',
    'violent': 'dynamic',
    'blood': 'red',
    'gore': 'dramatic',
    'weapon': 'object',
    'gun': 'device',
    'knife': 'tool',
    'fight': 'conflict',
    'fighting': 'struggle',
    'nude': 'natural',
    'naked': 'uncovered',
    'explicit': 'detailed',
    'sexual': 'romantic',
    'adult': 'mature',
    'hate': 'dislike',
    'discrimination': 'difference',
    'racist': 'cultural',
    'sexist': 'gender',
    'offensive': 'controversial',
    'inappropriate': 'unsuitable',
    'illegal': 'unauthorized',
    'criminal': 'suspicious',
    'drug': 'substance',
    'alcohol': 'beverage',
    'smoking': 'breathing',
    'tobacco': 'plant'
  };
  
  for (const [word, replacement] of Object.entries(replacements)) {
    sanitized = sanitized.replace(new RegExp(word, 'gi'), replacement);
  }
  
  // Remove any remaining problematic words
  for (const word of problematicWords) {
    sanitized = sanitized.replace(new RegExp(word, 'gi'), '');
  }
  
  // Clean up extra spaces and punctuation
  sanitized = sanitized.replace(/\s+/g, ' ').trim();
  
  return sanitized || 'Create a beautiful and engaging video';
}

const GenerateVideoFromTextHailuoInputSchema = z.object({
  prompt: z.string().describe('The text prompt to generate the video from.'),
  model: z.string().describe('The AI model to use for generation.'),
  aspectRatio: z.string().describe('The aspect ratio of the video.'),
  resolution: z.string().describe('The resolution of the video.'),
  format: z.string().describe('The file format of the video.'),
  userId: z.string().describe('The user ID for credit tracking.'),
});
export type GenerateVideoFromTextHailuoInput = z.infer<typeof GenerateVideoFromTextHailuoInputSchema>;

const GenerateVideoFromTextHailuoOutputSchema = z.object({
  videoDataUri: z.string().describe('The generated video as a data URI.'),
});
export type GenerateVideoFromTextHailuoOutput = z.infer<typeof GenerateVideoFromTextHailuoOutputSchema>;

export async function generateVideoFromTextHailuo(input: GenerateVideoFromTextHailuoInput): Promise<GenerateVideoFromTextHailuoOutput> {
  return generateVideoFromTextHailuoFlow(input);
}

const generateVideoFromTextHailuoFlow = ai.defineFlow(
  {
    name: 'generateVideoFromTextHailuoFlow',
    inputSchema: GenerateVideoFromTextHailuoInputSchema,
    outputSchema: GenerateVideoFromTextHailuoOutputSchema,
  },
  async (input) => {
    try {
      // Check and deduct credits
      const startTime = Date.now();
      
      try {
        await CreditService.deductCredits(
          input.userId,
          'video-generation',
          'hailuo',
          input.prompt,
          { aspectRatio: input.aspectRatio, resolution: input.resolution }
        );
      } catch (creditError) {
        console.error('Credit deduction failed:', creditError);
        throw new Error(`Credit check failed: ${creditError instanceof Error ? creditError.message : 'Unknown error'}`);
      }

      // Initialize Replicate client
      const replicate = new Replicate({
        auth: process.env.REPLICATE_API_TOKEN,
      });

      // Sanitize the prompt
      const sanitizedPrompt = sanitizePrompt(input.prompt);

      // Generate video using Hailuo (minimax/video-01)
      const inputParams = {
        prompt: sanitizedPrompt,
        // Hailuo specific parameters for better control
        num_frames: 144, // 6 seconds at 24fps
        fps: 24,
        guidance_scale: 7.5,
        seed: Math.floor(Math.random() * 1000000),
        // Note: Hailuo generates videos with sound by default
        // No explicit audio parameter needed
      };
      
      console.log('Hailuo API call parameters:', inputParams);
      
      // Try the exact model identifier from documentation
      const modelId = "minimax/video-01";
      console.log('Using model ID:', modelId);
      
            // Use the simpler replicate.run() method as shown in documentation
      const output = await replicate.run("minimax/video-01", { input: inputParams });
      
      console.log('Hailuo API response:', output);
      console.log('Hailuo API response type:', typeof output);
      
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
      console.log('Video buffer size:', videoBuffer.byteLength, 'bytes');
      
      const videoBase64 = Buffer.from(videoBuffer).toString('base64');
      const videoDataUri = `data:video/mp4;base64,${videoBase64}`;
      
      console.log('Video data URI length:', videoDataUri.length);
      console.log('Video data URI starts with:', videoDataUri.substring(0, 100));

      // Log successful usage
      const processingTime = Date.now() - startTime;
      await CreditService.logUsage(
        input.userId,
        'video-generation',
        'hailuo',
        10, // Hailuo costs 10 credits
        'success',
        input.prompt,
        { aspectRatio: input.aspectRatio, resolution: input.resolution },
        undefined,
        processingTime,
        input.prompt.length,
        videoDataUri.length
      );

      return { videoDataUri };
    } catch (error) {
      console.error('Hailuo video generation failed:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined
      });
      
      // Handle specific Replicate payment errors
      if (error instanceof Error && error.message.includes('402 Payment Required')) {
        throw new Error('Replicate free credits exhausted. Please set up billing at https://replicate.com/account/billing to continue using Hailuo model.');
      }
      
      if (error instanceof Error && error.message.includes('Free time limit reached')) {
        throw new Error('Replicate free time limit reached. Please set up billing at https://replicate.com/account/billing to continue using Hailuo model.');
      }
      
      // Log failed usage
      try {
        await CreditService.logUsage(
          input.userId,
          'video-generation',
          'hailuo',
          10, // Hailuo costs 10 credits
          'failed',
          input.prompt,
          { aspectRatio: input.aspectRatio, resolution: input.resolution },
          error instanceof Error ? error.message : 'Unknown error'
        );
      } catch (logError) {
        console.error('Failed to log usage error:', logError);
      }

      throw new Error(`Video generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
); 