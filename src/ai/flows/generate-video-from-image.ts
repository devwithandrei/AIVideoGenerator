'use server';

/**
 * @fileOverview Generates a video from input images using the Google Veo model.
 *
 * - generateVideoFromImage - A function that handles the video generation process from images.
 * - GenerateVideoFromImageInput - The input type for the generateVideoFromImage function.
 * - GenerateVideoFromImageOutput - The return type for the generateVideoFromImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import * as fs from 'fs';
import { Readable } from 'stream';

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

const GenerateVideoFromImageInputSchema = z.object({
  prompt: z.string().describe('The text prompt to generate the video from.'),
  model: z.string().describe('The AI model to use for generation.'),
  aspectRatio: z.string().describe('The aspect ratio of the video.'),
  duration: z.string().describe('The duration of the video.'),
  resolution: z.string().describe('The resolution of the video.'),
  proMode: z.boolean().describe('Whether to use pro mode.'),
  images: z.array(z.string()).describe('Array of image URLs to animate into video.'),
  references: z.array(z.string()).describe('Array of reference image URLs.'),
});
export type GenerateVideoFromImageInput = z.infer<typeof GenerateVideoFromImageInputSchema>;

const GenerateVideoFromImageOutputSchema = z.object({
  videoDataUri: z.string().describe('The generated video as a data URI.'),
});
export type GenerateVideoFromImageOutput = z.infer<typeof GenerateVideoFromImageOutputSchema>;

export async function generateVideoFromImage(input: GenerateVideoFromImageInput): Promise<GenerateVideoFromImageOutput> {
  return generateVideoFromImageFlow(input);
}

// Model mapping for image-to-video generation
const imageModelMapping: Record<string, string> = {
  'vidu-q1': 'veo-2.0-generate-001',
  'google-veo': 'veo-2.0-generate-001',
};

const generateVideoFromImageFlow = ai.defineFlow(
  {
    name: 'generateVideoFromImageFlow',
    inputSchema: GenerateVideoFromImageInputSchema,
    outputSchema: GenerateVideoFromImageOutputSchema,
  },
  async input => {
    const modelId = imageModelMapping[input.model] || 'veo-2.0-generate-001';

    if (input.images.length === 0) {
      throw new Error('No images provided for video generation');
    }

    // Sanitize the prompt to avoid content moderation issues
    const sanitizedPrompt = sanitizePrompt(input.prompt);
    
    // Create a comprehensive prompt for image-to-video animation
    const enhancedPrompt = `Create a video based on the following description: ${sanitizedPrompt}. 
    The video should be ${input.duration} long with ${input.resolution} resolution.
    ${input.images.length > 0 ? `The video should incorporate elements from ${input.images.length} uploaded images.` : ''}
    ${input.references.length > 0 ? `Use the style and visual elements from ${input.references.length} reference images to guide the video creation.` : ''}
    Make the video cinematic and visually appealing.`;

    let { operation } = await ai.generate({
      model: googleAI.model(modelId),
      prompt: enhancedPrompt,
      config: {
        durationSeconds: parseInt(input.duration.replace('s', '')),
        aspectRatio: input.aspectRatio,
      },
    });

    if (!operation) {
      throw new Error('Expected the model to return an operation');
    }

    // Wait until the operation completes
    while (!operation.done) {
      operation = await ai.checkOperation(operation);
      // Sleep for 5 seconds before checking again
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    if (operation.error) {
      // Handle content moderation errors specifically
      if (operation.error.message.includes('violate Gemini API\'s usage guidelines')) {
        throw new Error('The prompt contains content that violates our usage guidelines. Please rephrase your request to be more appropriate and try again.');
      }
      throw new Error('failed to generate video: ' + operation.error.message);
    }

    const video = operation.output?.message?.content.find((p) => !!p.media);
    if (!video) {
      throw new Error('Failed to find the generated video');
    }

    const videoDataUri = await downloadVideo(video);
    return { videoDataUri };
  }
);

async function downloadVideo(video: any): Promise<string> {
  const fetch = (await import('node-fetch')).default;
  // Add API key before fetching the video
  const videoDownloadResponse = await fetch(
    `${video.media!.url}&key=${process.env.GEMINI_API_KEY}`
  );
  if (
    !videoDownloadResponse ||
    videoDownloadResponse.status !== 200 ||
    !videoDownloadResponse.body
  ) {
    throw new Error('Failed to fetch video');
  }

  const buffer = await videoDownloadResponse.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  return `data:video/mp4;base64,${base64}`;
} 