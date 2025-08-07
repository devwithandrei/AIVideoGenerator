'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import Replicate from 'replicate';

const GenerateMapAnimationFromImageInputSchema = z.object({
  prompt: z.string(),
  model: z.string(),
  aspectRatio: z.string(),
  duration: z.string(),
  imageFile: z.any(), // File object from the client
});
export type GenerateMapAnimationFromImageInput = z.infer<
  typeof GenerateMapAnimationFromImageInputSchema
>;

const GenerateMapAnimationFromImageOutputSchema = z.object({
  videoDataUri: z.string(),
});
export type GenerateMapAnimationFromImageOutput = z.infer<
  typeof GenerateMapAnimationFromImageOutputSchema
>;

export async function generateMapAnimationFromImage(
  input: GenerateMapAnimationFromImageInput,
): Promise<GenerateMapAnimationFromImageOutput> {
  return generateMapAnimationFromImageFlow(input);
}

const generateMapAnimationFromImageFlow = ai.defineFlow(
  {
    name: 'generateMapAnimationFromImageFlow',
    inputSchema: GenerateMapAnimationFromImageInputSchema,
    outputSchema: GenerateMapAnimationFromImageOutputSchema,
  },
  async input => {
    try {
      // Force aspect ratio to 16:9 for Hailuo model since it only supports 16:9
      const effectiveAspectRatio = input.model === "hailuo" ? "16:9" : input.aspectRatio;
      
      // Convert the uploaded image to base64
      const arrayBuffer = await input.imageFile.arrayBuffer();
      const imageBuffer = Buffer.from(arrayBuffer);
      const imageBase64 = imageBuffer.toString('base64');
      const imageDataUri = `data:${input.imageFile.type};base64,${imageBase64}`;

      // 3. Pass to the video generation AI in the correct format
      let operation;
      let videoDataUri = '';
      
      if (input.model === "hailuo") {
        // Use Hailuo model via Replicate
        const replicate = new Replicate({
          auth: process.env.REPLICATE_API_TOKEN,
        });

        // Generate a dynamic prompt based on the user's input
        const animationPrompt = `Using the provided image as a reference, create a visually appealing animated video that: ${input.prompt}. The animation should be clean, modern, and engaging, with smooth transitions and professional visual effects. Transform the static image into a dynamic, animated sequence that brings the map or location to life.`;
        
        const inputParams = {
          image: imageBuffer,
          prompt: animationPrompt,
          // Hailuo specific parameters for better control
          num_frames: 144, // 6 seconds at 24fps
          fps: 24,
          guidance_scale: 7.5,
          seed: Math.floor(Math.random() * 1000000),
          // Note: Hailuo generates videos with sound by default
          // No explicit audio parameter needed
        };
        
        console.log('Hailuo map animation from image API call parameters:', inputParams);
        
        const modelId = "minimax/video-01";
        console.log('Using model ID:', modelId);
        
        // Use the simpler replicate.run() method as shown in documentation
        const output = await replicate.run("minimax/video-01", { input: inputParams });
        
        console.log('Hailuo map animation from image API response:', output);
        console.log('Hailuo map animation from image API response type:', typeof output);
        
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
        videoDataUri = `data:video/mp4;base64,${videoBase64}`;

        return { videoDataUri };
      } else {
        // Use Veo2 model
        const animationPrompt = `Using the provided image as a reference, create a visually appealing animated video that: ${input.prompt}. The animation should be clean, modern, and engaging, with smooth transitions and professional visual effects. Transform the static image into a dynamic, animated sequence that brings the map or location to life.`;
        
        const result = await ai.generate({
          model: googleAI.model('veo-2.0-generate-001'),
          prompt: [
            {media: { url: imageDataUri, contentType: input.imageFile.type}},
            {text: animationPrompt}
          ],
          config: { 
            durationSeconds: parseInt(input.duration, 10), 
            aspectRatio: effectiveAspectRatio as "16:9" | "9:16" 
          },
        });
        
        operation = result.operation;
      }

      if (input.model === "hailuo") {
        // Hailuo already returned the video data URI above
        return { videoDataUri };
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

      // Download and return the video
      const fetch = (await import('node-fetch')).default;
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
      videoDataUri = `data:video/mp4;base64,${base64}`;

      return {
        videoDataUri,
      };
    } catch (error) {
      console.error('Map animation from image generation failed:', error);
      
      // Handle specific Replicate payment errors for Hailuo
      if (input.model === "hailuo") {
        if (error instanceof Error && error.message.includes('402 Payment Required')) {
          throw new Error('Replicate free credits exhausted. Please set up billing at https://replicate.com/account/billing to continue using Hailuo model.');
        }
        
        if (error instanceof Error && error.message.includes('Free time limit reached')) {
          throw new Error('Replicate free time limit reached. Please set up billing at https://replicate.com/account/billing to continue using Hailuo model.');
        }
      }
      
      throw new Error(`Map animation from image generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
); 