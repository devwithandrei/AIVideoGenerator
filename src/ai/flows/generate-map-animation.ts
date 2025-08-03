'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {Client} from '@googlemaps/google-maps-services-js';
import fetch from 'node-fetch';
import {googleAI} from '@genkit-ai/googleai';

const GenerateMapAnimationInputSchema = z.object({
  locationDetails: z.string(),
  mapStyle: z.string(),
  lineColor: z.string(),
  duration: z.string(),
});
export type GenerateMapAnimationInput = z.infer<
  typeof GenerateMapAnimationInputSchema
>;

const GenerateMapAnimationOutputSchema = z.object({
  videoDataUri: z.string(),
});
export type GenerateMapAnimationOutput = z.infer<
  typeof GenerateMapAnimationOutputSchema
>;

export async function generateMapAnimation(
  input: GenerateMapAnimationInput,
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
    const [origin, destination] = input.locationDetails.split(' to ');
    const client = new Client({});

    // 1. Get directions and encoded polyline
    const directionsResponse = await client.directions({
      params: {
        origin,
        destination,
        key: process.env.GOOGLE_MAPS_API_KEY!,
      },
    });

    const polyline = directionsResponse.data.routes[0].overview_polyline.points;

    // 2. Generate a static map image
    const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?size=640x480&maptype=${
      input.mapStyle
    }&path=weight:3|color:${
      input.lineColor
    }|enc:${polyline}&key=${process.env.GOOGLE_MAPS_API_KEY!}`;

    const staticMapResponse = await fetch(staticMapUrl);
    const imageBuffer = await staticMapResponse.buffer();
    const imageBase64 = imageBuffer.toString('base64');
    const imageDataUri = `data:image/png;base64,${imageBase64}`;

    // 3. Pass to the video generation AI in the correct format
    let {operation} = await ai.generate({
      model: googleAI.model('veo-2.0-generate-001'),
      prompt: [
        {media: { url: imageDataUri, contentType: 'image/png'}},
        {
          text: `Using the provided map image as the background, create a visually appealing animated video that illustrates the route from ${origin} to ${destination}. The animation must draw a clear, glowing line or path on the map, starting from the origin and accurately ending at the destination. The animation style should be clean, modern, and engaging, suitable for a travel vlog or presentation.`,
        },
      ],
      config: {
        durationSeconds: parseInt(input.duration, 10),
        aspectRatio: '16:9',
      },
    });

    if (!operation) {
      throw new Error('Expected the model to return an operation');
    }

    // Wait until the operation completes
    while (!operation.done) {
      operation = await ai.checkOperation(operation);
      await new Promise(resolve => setTimeout(resolve, 5000)); // Sleep for 5 seconds
    }

    if (operation.error) {
      throw new Error('Failed to generate video: ' + operation.error.message);
    }

    const video = operation.output?.message?.content.find(p => !!p.media);
    if (!video) {
      throw new Error('Failed to find the generated video');
    }

    // 4. Download and return the video
    const videoDownloadResponse = await fetch(
      `${video.media!.url}&key=${process.env.GEMINI_API_KEY}`,
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
    const videoDataUri = `data:video/mp4;base64,${base64}`;

    return {
      videoDataUri,
    };
  },
);
