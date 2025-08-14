import React from 'react';
import { useCurrentFrame, useVideoConfig } from '@remotion/renderer';

interface NewspaperSearchCompositionProps {
  name: string;
  theme: 'light' | 'dark';
  aspect: 'landscape' | 'vertical';
  duration: '5s' | '10s' | '15s' | '20s' | '25s' | '30s' | 'auto';
  newspaperImage: string | null;
}

export const NewspaperSearchComposition: React.FC<NewspaperSearchCompositionProps> = ({
  name,
  theme,
  aspect,
  duration,
  newspaperImage,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Calculate dimensions based on aspect ratio
  const isVertical = aspect === 'vertical';
  const canvasWidth = isVertical ? 1080 : 1920;
  const canvasHeight = isVertical ? 1920 : 1080;

  // Calculate duration based on selection
  const getDurationSeconds = () => {
    switch (duration) {
      case '5s': return 5;
      case '10s': return 10;
      case '15s': return 15;
      case '20s': return 20;
      case '25s': return 25;
      case '30s': return 30;
      case 'auto': return 8;
      default: return 8;
    }
  };

  const durationSeconds = getDurationSeconds();
  const totalFrames = fps * durationSeconds;

  // Colors based on theme
  const backgroundColor = theme === 'light' ? '#ffffff' : '#000000';
  const textColor = theme === 'light' ? '#000000' : '#ffffff';
  const highlightColor = '#ff6b35';

  // Calculate animation progress (0 to 1)
  const progress = frame / totalFrames;

  // Animation phases
  const phase1 = progress < 0.2; // Initial zoom (0-20%)
  const phase2 = progress >= 0.2 && progress < 0.4; // Pan across (20-40%)
  const phase3 = progress >= 0.4 && progress < 0.6; // Search rectangle (40-60%)
  const phase4 = progress >= 0.6 && progress < 0.8; // Magnifying glass (60-80%)
  const phase5 = progress >= 0.8; // Name highlight (80-100%)

  // Calculate zoom and pan
  const initialZoom = 0.3;
  const finalZoom = 1.2;
  const zoom = initialZoom + (progress * (finalZoom - initialZoom));

  // Calculate pan position
  const panX = phase2 ? (progress - 0.2) * 0.4 * width : 0;
  const panY = phase2 ? Math.sin((progress - 0.2) * 10) * 50 : 0;

  // Search rectangle animation
  const searchRectOpacity = phase3 ? (progress - 0.4) * 5 : phase4 ? 1 : 0;
  const searchRectScale = phase3 ? (progress - 0.4) * 5 : 1;

  // Magnifying glass animation
  const magnifierOpacity = phase4 ? (progress - 0.6) * 5 : phase5 ? 1 : 0;
  const magnifierScale = phase4 ? (progress - 0.6) * 5 : 1;

  // Name highlight animation
  const nameOpacity = phase5 ? (progress - 0.8) * 5 : 0;
  const nameScale = phase5 ? 1 + ((progress - 0.8) * 0.2) : 1;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Newspaper Image Background */}
      <div
        style={{
          position: 'absolute',
          width: canvasWidth,
          height: canvasHeight,
          transform: `scale(${zoom}) translate(${panX}px, ${panY}px)`,
          transformOrigin: 'center',
          transition: 'transform 0.1s ease-out',
        }}
      >
        {newspaperImage ? (
          <img
            src={newspaperImage}
            alt="Newspaper"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: textColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: backgroundColor,
              fontSize: '24px',
              fontFamily: 'Georgia, serif',
            }}
          >
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>THE DAILY NEWS</h1>
              <p style={{ fontSize: '18px', lineHeight: '1.6' }}>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
              </p>
              <p style={{ fontSize: '18px', lineHeight: '1.6', marginTop: '20px' }}>
                Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Search Rectangle */}
      {searchRectOpacity > 0 && (
        <div
          style={{
            position: 'absolute',
            left: width * 0.3,
            top: height * 0.4,
            width: 200 * searchRectScale,
            height: 60 * searchRectScale,
            border: `3px solid ${highlightColor}`,
            borderRadius: '5px',
            opacity: searchRectOpacity,
            transform: `scale(${searchRectScale})`,
            transition: 'all 0.3s ease-out',
          }}
        />
      )}

      {/* Magnifying Glass */}
      {magnifierOpacity > 0 && (
        <div
          style={{
            position: 'absolute',
            left: width * 0.6,
            top: height * 0.3,
            width: 80 * magnifierScale,
            height: 80 * magnifierScale,
            border: `4px solid ${highlightColor}`,
            borderRadius: '50%',
            opacity: magnifierOpacity,
            transform: `scale(${magnifierScale})`,
            transition: 'all 0.3s ease-out',
          }}
        >
          <div
            style={{
              position: 'absolute',
              bottom: '-20px',
              right: '-20px',
              width: '40px',
              height: '4px',
              backgroundColor: highlightColor,
              transform: 'rotate(45deg)',
            }}
          />
        </div>
      )}

      {/* Name Highlight */}
      {nameOpacity > 0 && (
        <div
          style={{
            position: 'absolute',
            left: width / 2 - 200,
            top: height / 2 - 50,
            width: 400,
            height: 100,
            backgroundColor: highlightColor,
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: nameOpacity,
            transform: `scale(${nameScale})`,
            transition: 'all 0.3s ease-out',
            boxShadow: '0 5px 15px rgba(255, 107, 53, 0.3)',
          }}
        >
          <h1
            style={{
              color: '#ffffff',
              fontSize: '48px',
              fontWeight: 'bold',
              textAlign: 'center',
              margin: 0,
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)',
              fontFamily: 'Arial, sans-serif',
              letterSpacing: '2px',
            }}
          >
            {name.toUpperCase()}
          </h1>
        </div>
      )}
    </div>
  );
};
