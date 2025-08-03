'use server';

/**
 * @fileOverview Generates an animated map-based video from location or route details.
 * This is a two-step process:
 * 1. Generate a static map image of the specified region.
 * 2. Use that image as a reference to generate an animated video with the route.
 *
 * - generateMapAnimation - A function that handles the map animation generation process.
 * - GenerateMapAnimationInput - The input type for the generateMapAnimation function.
 * - GenerateMapAnimationOutput - The return type for the generateMapAnimation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

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
    // Step 1: Generate a static map image for the route.
    const {media: mapImage} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: `Generate a clean, modern, and visually appealing satellite-style map image for a travel vlog. The map must accurately show the geographical region for the route: "${input.locationDetails}". Do not draw any lines, paths, or text on this map. The map should be clear and ready for a route animation to be overlaid.`,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!mapImage.url) {
      throw new Error('Failed to generate the base map image.');
    }

    // Step 2: Use the generated map to create the animated video.
    let {operation} = await ai.generate({
      model: googleAI.model('veo-2.0-generate-001'),
      prompt: [
        {
          media: {url: mapImage.url},
        },
        {
          text: `Using the provided map image as the background, create a visually appealing animated video that illustrates the route: "${input.locationDetails}".
The animation must draw a clear, glowing line or path on the map, starting from the origin and accurately ending at the destination.
Prominently display the names of the start and end locations on the map at their correct geographical points.
The animation style should be clean, modern, and engaging, suitable for a travel vlog or presentation. The map itself should remain static, only the route line and labels should be animated.`,
        },
      ],
      config: {
        durationSeconds: 8,
        aspectRatio: '16:9',
      },
    });

    if (!operation) {
      throw new Error('Expected the model to return an operation');
    }

    // Wait until the operation completes.
    while (!operation.done) {
      operation = await ai.checkOperation(operation);
      await new Promise(resolve => setTimeout(resolve, 5000)); // Sleep for 5 seconds.
    }

    if (operation.error) {
      throw new Error('Failed to generate video: ' + operation.error.message);
    }

    const video = operation.output?.message?.content.find(p => !!p.media);
    if (!video || !video.media?.url) {
      throw new Error('Failed to find the generated video');
    }

    // Download the video and convert to a data URI.
    const fetch = (await import('node-fetch')).default;
    const videoDownloadResponse = await fetch(
      `${video.media.url}&key=${process.env.GEMINI_API_KEY}`
    );
    if (
      !videoDownloadResponse ||
      videoDownloadResponse.status !== 200 ||
      !videoDownloadResponse.body
    ) {
      throw new Error('Failed to fetch video');
    }

    const buffer = await videoDownloadResponse.arrayBuffer();
    const videoBase64 = Buffer.from(buffer).toString('base64');
    const videoDataUri = `data:video/mp4;base64,${videoBase64}`;

    return {videoDataUri};
  }
);
