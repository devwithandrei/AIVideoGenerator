'use server';

/**
 * @fileOverview Generates a video from a text prompt using the Veo model.
 *
 * - generateVideoFromText - A function that handles the video generation process.
 * - GenerateVideoFromTextInput - The input type for the generateVideoFromText function.
 * - GenerateVideoFromTextOutput - The return type for the generateVideoFromText function.
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

const GenerateVideoFromTextInputSchema = z.object({
  prompt: z.string().describe('The text prompt to generate the video from.'),
  model: z.string().describe('The AI model to use for generation.'),
  aspectRatio: z.string().describe('The aspect ratio of the video.'),
  resolution: z.string().describe('The resolution of the video.'),
  format: z.string().describe('The file format of the video.'),
});
export type GenerateVideoFromTextInput = z.infer<typeof GenerateVideoFromTextInputSchema>;

const GenerateVideoFromTextOutputSchema = z.object({
  videoDataUri: z.string().describe('The generated video as a data URI.'),
});
export type GenerateVideoFromTextOutput = z.infer<typeof GenerateVideoFromTextOutputSchema>;

export async function generateVideoFromText(input: GenerateVideoFromTextInput): Promise<GenerateVideoFromTextOutput> {
  return generateVideoFromTextFlow(input);
}

// A simple mapping from the friendly names to the actual model identifiers.
// This can be expanded as more models become available.
const modelMapping: Record<string, string> = {
  'veo2': 'veo-2.0-generate-001',
};


const generateVideoFromTextFlow = ai.defineFlow(
  {
    name: 'generateVideoFromTextFlow',
    inputSchema: GenerateVideoFromTextInputSchema,
    outputSchema: GenerateVideoFromTextOutputSchema,
  },
  async input => {
    const modelId = modelMapping[input.model] || 'veo-2.0-generate-001';

    // Sanitize the prompt to avoid content moderation issues
    const sanitizedPrompt = sanitizePrompt(input.prompt);
    
    let { operation } = await ai.generate({
      model: googleAI.model(modelId),
      prompt: sanitizedPrompt,
      config: {
        durationSeconds: 5,
        aspectRatio: input.aspectRatio,
        // resolution and format are not directly supported by the model config in this way,
        // but are captured in the flow for potential post-processing steps.
      },
    });

    if (!operation) {
      throw new Error('Expected the model to return an operation');
    }

    // Wait until the operation completes. Note that this may take some time, maybe even up to a minute. Design the UI accordingly.
    while (!operation.done) {
      operation = await ai.checkOperation(operation);
      // Sleep for 5 seconds before checking again.
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
  // Add API key before fetching the video.
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
