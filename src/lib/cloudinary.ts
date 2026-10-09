import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: 'dfqrcm0il',
  api_key: '119662683177767',
  api_secret: 'chNo55LSZTA0VjJusd2xAEneI6Y',
});

export interface CloudinaryUploadResult {
  public_id: string;
  url: string;
  secure_url: string;
  format: string;
  resource_type: string;
  created_at: string;
  bytes: number;
  duration?: number;
}

export class CloudinaryService {
  /**
   * Upload a video to Cloudinary
   */
  static async uploadVideo(
    file: File | Blob | Buffer,
    options: {
      folder?: string;
      public_id?: string;
      resource_type?: 'video' | 'image';
    } = {}
  ): Promise<CloudinaryUploadResult> {
    try {
      const uploadOptions = {
        folder: options.folder || 'newspaper-animations',
        public_id: options.public_id,
        resource_type: options.resource_type || 'video',
        format: 'mp4',
        quality: 'auto',
        fetch_format: 'auto',
      };

      return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) {
              console.error('Cloudinary upload error:', error);
              reject(error);
            } else if (result) {
              resolve(result as CloudinaryUploadResult);
            } else {
              reject(new Error('Upload failed - no result returned'));
            }
          }
        ).end(file);
      });
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      throw error;
    }
  }

  /**
   * Delete a video from Cloudinary
   */
  static async deleteVideo(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId, {
        resource_type: 'video',
      });
    } catch (error) {
      console.error('Error deleting from Cloudinary:', error);
      throw error;
    }
  }

  /**
   * Get video information from Cloudinary
   */
  static async getVideoInfo(publicId: string): Promise<any> {
    try {
      const result = await cloudinary.api.resource(publicId, {
        resource_type: 'video',
      });
      return result;
    } catch (error) {
      console.error('Error getting video info from Cloudinary:', error);
      throw error;
    }
  }



  /**
   * Generate a Cloudinary URL with transformations
   */
  static getVideoUrl(publicId: string, options: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string;
    format?: string;
  } = {}): string {
    const transformations = [];
    
    if (options.width) transformations.push(`w_${options.width}`);
    if (options.height) transformations.push(`h_${options.height}`);
    if (options.crop) transformations.push(`c_${options.crop}`);
    if (options.quality) transformations.push(`q_${options.quality}`);
    if (options.format) transformations.push(`f_${options.format}`);

    const transformString = transformations.length > 0 ? transformations.join(',') + '/' : '';
    
    return `https://res.cloudinary.com/dfqrcm0il/video/upload/${transformString}${publicId}`;
  }
}

export default CloudinaryService;
