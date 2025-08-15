import { NextRequest, NextResponse } from 'next/server';
import CloudinaryService from '@/lib/cloudinary';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('video') as File;
    const metadata = formData.get('metadata') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No video file provided' },
        { status: 400 }
      );
    }

    // Parse metadata
    const videoMetadata = metadata ? JSON.parse(metadata) : {};
    
    // Generate a unique public_id
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const publicId = `newspaper-animation-${timestamp}-${randomId}`;

    // Upload to Cloudinary
    const uploadResult = await CloudinaryService.uploadVideo(file, {
      folder: 'newspaper-animations',
      public_id: publicId,
      resource_type: 'video',
    });

    // Return the upload result with metadata
    return NextResponse.json({
      success: true,
      video: {
        public_id: uploadResult.public_id,
        url: uploadResult.secure_url,
        format: uploadResult.format,
        bytes: uploadResult.bytes,
        duration: uploadResult.duration,
        created_at: uploadResult.created_at,
        metadata: videoMetadata,
      },
    });
  } catch (error) {
    console.error('Error uploading video:', error);
    return NextResponse.json(
      { error: 'Failed to upload video' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const publicId = searchParams.get('public_id');

    if (!publicId) {
      return NextResponse.json(
        { error: 'No public_id provided' },
        { status: 400 }
      );
    }

    await CloudinaryService.deleteVideo(publicId);

    return NextResponse.json({
      success: true,
      message: 'Video deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting video:', error);
    return NextResponse.json(
      { error: 'Failed to delete video' },
      { status: 500 }
    );
  }
}
