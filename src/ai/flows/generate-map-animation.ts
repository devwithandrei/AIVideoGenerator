'use server';

/**
 * @fileOverview Generates an animated map-based video from location or route details.
 *
 * - generateMapAnimation - A function that handles the map animation generation process.
 * - GenerateMapAnimationInput - The input type for the generateMapAnimation function.
 * - GenerateMapAnimationOutput - The return type for the generateMapAnimation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import * as fs from 'fs';
import { Readable } from 'stream';

const GenerateMapAnimationInputSchema = z.object({
  locationDetails: z
    .string()
    .describe('Location or route details for the map animation.'),
});
export type GenerateMapAnimationInput = z.infer<
  typeof GenerateMapAnimationInputSchema
>;

const GenerateMapAnimationOutputSchema = z.object({
  videoDataUri: z
    .string()
    .describe(
      'The generated map animation video as a data URI (video/mp4) that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'      
    ),
});
export type GenerateMapAnimationOutput = z.infer<
  typeof GenerateMapAnimationOutputSchema
>;

export async function generateMapAnimation(
  input: GenerateMapAnimationInput
): Promise<GenerateMapAnimationOutput> {
  return generateMapAnimationFlow(input);
}

const generateMapAnimationFlow = ai.defineFlow(
  {
    name: 'generateMapAnimationFlow',
    inputSchema: GenerateMapAnimationInputSchema,
    outputSchema: GenerateMapAnimationOutputSchema,
  },
  async input => {
    let { operation } = await ai.generate({
      model: googleAI.model('veo-2.0-generate-001'),
      prompt: `Generate a map animation video based on the following details: ${input.locationDetails}`,
      config: {
        durationSeconds: 5,
        aspectRatio: '16:9',
      },
    });

    if (!operation) {
      throw new Error('Expected the model to return an operation');
    }

    // Wait until the operation completes. Note that this may take some time, maybe even up to a minute. Design the UI accordingly.
    while (!operation.done) {
      operation = await ai.checkOperation(operation);
      // Sleep for 5 seconds before checking again.
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    if (operation.error) {
      throw new Error('failed to generate video: ' + operation.error.message);
    }

    const video = operation.output?.message?.content.find(p => !!p.media);
    if (!video) {
      throw new Error('Failed to find the generated video');
    }

    // dummy implementation for demonstration purposes
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
    const buffer = await videoDownloadResponse.arrayBuffer()
    const videoBuffer = Buffer.from(buffer);
    const videoBase64 = videoBuffer.toString('base64');
    const videoDataUri = `data:video/mp4;base64,${videoBase64}`;

    return {videoDataUri};
  }
);
