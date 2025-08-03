'use server';

/**
 * @fileOverview Generates an image from a text prompt using the Imagen 2 model.
 *
 * - generateImageFromText - A function that handles the image generation process.
 * - GenerateImageFromTextInput - The input type for the generateImageFromText function.
 * - GenerateImageFromTextOutput - The return type for the generateImageFromText function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import {vertexAI} from '@genkit-ai/vertexai';

const GenerateImageFromTextInputSchema = z.object({
  prompt: z.string().describe('The text prompt to generate the image from.'),
});
export type GenerateImageFromTextInput = z.infer<typeof GenerateImageFromTextInputSchema>;

const GenerateImageFromTextOutputSchema = z.object({
  imageDataUri: z.string().describe('The generated image as a data URI.'),
});
export type GenerateImageFromTextOutput = z.infer<typeof GenerateImageFromTextOutputSchema>;

export async function generateImageFromText(input: GenerateImageFromTextInput): Promise<GenerateImageFromTextOutput> {
  return generateImageFromTextFlow(input);
}

const generateImageFromTextFlow = ai.defineFlow(
  {
    name: 'generateImageFromTextFlow',
    inputSchema: GenerateImageFromTextInputSchema,
    outputSchema: GenerateImageFromTextOutputSchema,
  },
  async (input) => {
    const imageResponse = await ai.generate({
      model: vertexAI.model('imagen2'),
      prompt: input.prompt,
    });

    const imagePart = imageResponse.candidates[0]?.content.find(
      (part) => !!part.media
    );

    if (!imagePart?.media?.url) {
      throw new Error('No image was generated.');
    }
    const media = imagePart.media;

    // Download the image and convert to a data URI.
    const fetch = (await import('node-fetch')).default;
    const imageDownloadResponse = await fetch(
        `${media.url}&key=${process.env.GEMINI_API_KEY}`
    );
    if (
      !imageDownloadResponse ||
      imageDownloadResponse.status !== 200 ||
      !imageDownloadResponse.body
    ) {
      throw new Error('Failed to fetch image');
    }

    const buffer = await imageDownloadResponse.arrayBuffer();
    const imageBase64 = Buffer.from(buffer).toString('base64');
    const mimeType = media.contentType || 'image/png';
    const imageDataUri = `data:${mimeType};base64,${imageBase64}`;

    return { imageDataUri };
  }
);
