'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {Client} from '@googlemaps/google-maps-services-js';
import fetch from 'node-fetch';
import {googleAI} from '@genkit-ai/googleai';

const GenerateMapAnimationInputSchema = z.object({
  prompt: z.string(),
  model: z.string(),
  aspectRatio: z.string(),
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
    try {
      // Force aspect ratio to 16:9 for Hailuo model since it only supports 16:9
      const effectiveAspectRatio = input.model === "hailuo" ? "16:9" : input.aspectRatio;
      
      // Parse the prompt to extract location information
      // The prompt can be in various formats, so we'll try to extract meaningful locations
      const prompt = input.prompt.toLowerCase();
      
      // Try to extract locations from common patterns
      let origin = '';
      let destination = '';
      let mapCenter = '';
      let mapZoom = 10;
      
      // Check for "from X to Y" pattern
      const fromToMatch = prompt.match(/from\s+([^to]+)\s+to\s+([^\s,]+)/);
      if (fromToMatch) {
        origin = fromToMatch[1].trim();
        destination = fromToMatch[2].trim();
      }
      
      // Check for "X to Y" pattern
      const toMatch = prompt.match(/([^to]+)\s+to\s+([^\s,]+)/);
      if (toMatch && !origin) {
        origin = toMatch[1].trim();
        destination = toMatch[2].trim();
      }
      
      // Check for country/city names
      const countries = ['france', 'germany', 'italy', 'spain', 'japan', 'china', 'usa', 'united states', 'canada', 'australia', 'brazil', 'india', 'russia', 'uk', 'united kingdom'];
      const cities = ['paris', 'london', 'tokyo', 'new york', 'rome', 'madrid', 'berlin', 'moscow', 'beijing', 'sydney', 'rio de janeiro', 'mumbai', 'toronto'];
      
      for (const country of countries) {
        if (prompt.includes(country)) {
          mapCenter = country;
          mapZoom = 6; // Country level zoom
          break;
        }
      }
      
      for (const city of cities) {
        if (prompt.includes(city)) {
          mapCenter = city;
          mapZoom = 12; // City level zoom
          break;
        }
      }
      
      // If no specific locations found, use a default
      if (!origin && !destination && !mapCenter) {
        mapCenter = 'world';
        mapZoom = 2;
      }
      
      const client = new Client({});
      
      let staticMapUrl = '';
      
      if (origin && destination) {
        // Route-based map
        const directionsResponse = await client.directions({
          params: {
            origin,
            destination,
            key: process.env.GOOGLE_MAPS_API_KEY!,
          },
        });

        const polyline = directionsResponse.data.routes[0].overview_polyline.points;
        
        // 2. Generate a static map image with appropriate size based on aspect ratio
        const aspectRatioMap = {
          '16:9': '1280x720',
          '9:16': '720x1280', 
          '1:1': '800x800',
          '4:3': '1024x768',
          '21:9': '1680x720'
        };
        
        const mapSize = aspectRatioMap[effectiveAspectRatio as keyof typeof aspectRatioMap] || '1280x720';
        
        staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?size=${mapSize}&maptype=${
          input.mapStyle
        }&path=weight:3|color:${
          input.lineColor
        }|enc:${polyline}&key=${process.env.GOOGLE_MAPS_API_KEY!}`;
      } else {
        // Location-based map
        const aspectRatioMap = {
          '16:9': '1280x720',
          '9:16': '720x1280', 
          '1:1': '800x800',
          '4:3': '1024x768',
          '21:9': '1680x720'
        };
        
        const mapSize = aspectRatioMap[effectiveAspectRatio as keyof typeof aspectRatioMap] || '1280x720';
        
        staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?size=${mapSize}&maptype=${
          input.mapStyle
        }&center=${mapCenter}&zoom=${mapZoom}&key=${process.env.GOOGLE_MAPS_API_KEY!}`;
      }

    const staticMapResponse = await fetch(staticMapUrl);
    const imageBuffer = await staticMapResponse.buffer();
    const imageBase64 = imageBuffer.toString('base64');
    const imageDataUri = `data:image/png;base64,${imageBase64}`;

    // 3. Pass to the video generation AI in the correct format
    let operation;
    
    if (input.model === "hailuo") {
      // Use Hailuo model via Replicate
      const Replicate = (await import('replicate')).default;
      const replicate = new Replicate({
        auth: process.env.REPLICATE_API_TOKEN,
      });

      // Generate a dynamic prompt based on the user's input
      let animationPrompt = input.prompt;
      
      // If the user provided a route, enhance the prompt
      if (origin && destination) {
        animationPrompt = `Using the provided map image as the background, create a visually appealing animated video that illustrates the route from ${origin} to ${destination}. ${input.prompt}. The animation must draw a clear, glowing line or path on the map, starting from the origin and accurately ending at the destination. The animation style should be clean, modern, and engaging, suitable for a travel vlog or presentation.`;
      } else {
        // For location-based animations, use the user's prompt directly
        animationPrompt = `Using the provided map image as the background, create a visually appealing animated video that: ${input.prompt}. The animation should be clean, modern, and engaging, with smooth transitions and professional visual effects.`;
      }
      
      const inputParams = {
        image: Buffer.from(imageDataUri.split(',')[1], 'base64'),
        prompt: animationPrompt,
        // Hailuo specific parameters for better control
        num_frames: 144, // 6 seconds at 24fps
        fps: 24,
        guidance_scale: 7.5,
        seed: Math.floor(Math.random() * 1000000),
        // Note: Hailuo generates videos with sound by default
        // No explicit audio parameter needed
      };
      
      console.log('Hailuo map animation API call parameters:', inputParams);
      
      const modelId = "minimax/video-01";
      console.log('Using model ID:', modelId);
      
      // Use the simpler replicate.run() method as shown in documentation
      const output = await replicate.run("minimax/video-01", { input: inputParams });
      
      console.log('Hailuo map animation API response:', output);
      console.log('Hailuo map animation API response type:', typeof output);
      
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
    } else {
      // Use Veo2 model
      const result = await ai.generate({
        model: googleAI.model('veo-2.0-generate-001'),
        prompt: [
          {media: { url: imageDataUri, contentType: 'image/png'}},
          {
            text: animationPrompt,
          },
        ],
        config: {
          durationSeconds: parseInt(input.duration, 10),
          aspectRatio: effectiveAspectRatio as "16:9" | "9:16",
        },
      });
      
      operation = result.operation;
    }

    if (input.model === "hailuo") {
      // Hailuo already returned the video data URI above
      return { videoDataUri: videoDataUri };
    }

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
  } catch (error) {
    console.error('Map animation generation failed:', error);
    
    // Handle specific Replicate payment errors for Hailuo
    if (input.model === "hailuo") {
      if (error instanceof Error && error.message.includes('402 Payment Required')) {
        throw new Error('Replicate free credits exhausted. Please set up billing at https://replicate.com/account/billing to continue using Hailuo model.');
      }
      
      if (error instanceof Error && error.message.includes('Free time limit reached')) {
        throw new Error('Replicate free time limit reached. Please set up billing at https://replicate.com/account/billing to continue using Hailuo model.');
      }
    }
    
    throw new Error(`Map animation generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
},
);
