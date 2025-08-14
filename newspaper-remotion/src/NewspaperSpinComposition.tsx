import React from 'react';
import { useCurrentFrame, useVideoConfig } from '@remotion/renderer';

interface NewspaperSpinCompositionProps {
  name: string;
  theme: 'light' | 'dark';
  aspect: 'landscape' | 'vertical';
  duration: '5s' | '10s' | '15s' | '20s' | '25s' | '30s' | 'auto';
}

const loremIpsumText = `
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.

Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.
`;

export const NewspaperSpinComposition: React.FC<NewspaperSpinCompositionProps> = ({
  name,
  theme,
  aspect,
  duration,
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
      case 'auto': return 5;
      default: return 5;
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

  // Enhanced spin animation (0 to 1.2 seconds)
  const spinProgress = Math.min(progress * 4.2, 1);
  const spinRotation = spinProgress * 720; // 720 degrees with easing

  // Enhanced zoom animation
  const scale = 1 + (progress * 0.15);

  // Enhanced headline fade-in (starts at 0.7 seconds)
  const headlineOpacity = Math.max(0, Math.min(1, (progress - 0.7) * 3.33));

  // Calculate newspaper position and rotation
  const newspaperX = width / 2;
  const newspaperY = height / 2;
  const newspaperWidth = canvasWidth * 0.8;
  const newspaperHeight = canvasHeight * 0.8;

  // Calculate headline position
  const headlineX = width / 2;
  const headlineY = height / 2;
  const headlineWidth = name.length * 40;
  const headlineHeight = 80;

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
      {/* Newspaper Background */}
      <div
        style={{
          position: 'absolute',
          left: newspaperX - newspaperWidth / 2,
          top: newspaperY - newspaperHeight / 2,
          width: newspaperWidth,
          height: newspaperHeight,
          backgroundColor: textColor,
          transform: `rotate(${spinRotation}deg) scale(${scale})`,
          transformOrigin: 'center',
          transition: 'transform 0.1s ease-out',
          display: 'flex',
          flexDirection: 'column',
          padding: '40px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* Newspaper Content */}
        <div
          style={{
            color: backgroundColor,
            fontSize: '14px',
            lineHeight: '1.6',
            fontFamily: 'Georgia, serif',
            textAlign: 'justify',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>
              THE DAILY NEWS
            </h1>
            <p style={{ marginBottom: '15px' }}>
              {loremIpsumText.split('\n\n')[0]}
            </p>
            <p style={{ marginBottom: '15px' }}>
              {loremIpsumText.split('\n\n')[1]}
            </p>
          </div>
          <div>
            <p style={{ marginBottom: '15px' }}>
              {loremIpsumText.split('\n\n')[2]}
            </p>
            <p>
              {loremIpsumText.split('\n\n')[3]}
            </p>
          </div>
        </div>
      </div>

      {/* Headline with Highlight */}
      <div
        style={{
          position: 'absolute',
          left: headlineX - headlineWidth / 2,
          top: headlineY - headlineHeight / 2,
          width: headlineWidth + 100,
          height: headlineHeight + 50,
          backgroundColor: highlightColor,
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: headlineOpacity,
          transform: `scale(${1 + (headlineOpacity * 0.1)})`,
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
    </div>
  );
};
