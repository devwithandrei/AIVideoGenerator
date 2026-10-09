# Cloudinary Integration Setup

## Overview
This project now uses Cloudinary for video storage instead of localStorage, providing:
- Unlimited video storage
- Better performance
- Cloud-based accessibility
- Automatic video optimization

## Configuration

### Environment Variables
Add the following to your `.env` file:
```
CLOUDINARY_URL=cloudinary://119662683177767:chNo55LSZTA0VjJusd2xAEneI6Y@dfqrcm0il
```

### Cloudinary Account Details
- **Cloud Name**: dfqrcm0il
- **API Key**: 119662683177767
- **API Secret**: chNo55LSZTA0VjJusd2xAEneI6Y

## Features

### Video Upload
- Videos are automatically uploaded to Cloudinary when generated
- Stored in the `newspaper-animations` folder
- Unique public IDs generated for each video
- Metadata stored with each upload

### Video Management
- Videos can be downloaded directly from Cloudinary URLs
- Automatic deletion from Cloudinary when removed locally
- Fallback to local storage if Cloudinary upload fails

### API Endpoints

#### POST /api/upload-video
Uploads a video to Cloudinary
- **Body**: FormData with `video` (File) and `metadata` (JSON string)
- **Returns**: Cloudinary upload result with public_id and URL

#### DELETE /api/upload-video?public_id={id}
Deletes a video from Cloudinary
- **Query**: `public_id` - Cloudinary public ID
- **Returns**: Success confirmation

## Usage

### In the Newspaper Animator
1. Generate a video as usual
2. Video is automatically uploaded to Cloudinary
3. Cloudinary URL is stored in localStorage (metadata only)
4. Videos can be downloaded or deleted with cloud sync

### Benefits
- No more storage quota issues
- Videos persist across sessions
- Better performance with CDN delivery
- Automatic video optimization
- Professional cloud storage solution

## Error Handling
- If Cloudinary upload fails, video is saved locally as fallback
- Graceful degradation ensures app continues to work
- Error messages inform users of upload status

## Security
- API keys are stored in environment variables
- Videos are stored in a dedicated folder
- Public IDs are unique and non-guessable
- Automatic cleanup of deleted videos
