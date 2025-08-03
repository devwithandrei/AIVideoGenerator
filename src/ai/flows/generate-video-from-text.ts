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

const GenerateVideoFromTextInputSchema = z.object({
  prompt: z.string().describe('The text prompt to generate the video from.'),
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

const generateVideoFromTextFlow = ai.defineFlow(
  {
    name: 'generateVideoFromTextFlow',
    inputSchema: GenerateVideoFromTextInputSchema,
    outputSchema: GenerateVideoFromTextOutputSchema,
  },
  async input => {
    let { operation } = await ai.generate({
      model: googleAI.model('veo-2.0-generate-001'),
      prompt: input.prompt,
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
