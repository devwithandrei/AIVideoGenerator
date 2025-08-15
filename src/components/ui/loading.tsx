import React from 'react';

interface LoadingProps {
  title?: string;
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg';
  showDots?: boolean;
}

export function Loading({ 
  title = "Loading", 
  subtitle = "Please wait...", 
  size = 'md',
  showDots = true 
}: LoadingProps) {
  const sizeClasses = {
    sm: {
      container: 'w-8 h-8',
      border: 'border-2',
      dots: 'w-1 h-1',
      text: 'text-sm'
    },
    md: {
      container: 'w-12 h-12',
      border: 'border-4',
      dots: 'w-2 h-2',
      text: 'text-base'
    },
    lg: {
      container: 'w-16 h-16',
      border: 'border-4',
      dots: 'w-3 h-3',
      text: 'text-lg'
    }
  };

  const classes = sizeClasses[size];

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
      <div className="flex flex-col items-center justify-center space-y-6 p-8 w-full max-w-md">
        {/* Modern Loading Spinner */}
        <div className="relative flex justify-center">
          <div className={`${classes.container} ${classes.border} border-primary/20 rounded-full`}></div>
          <div className={`absolute top-0 left-0 ${classes.container} ${classes.border} border-primary border-t-transparent rounded-full animate-spin`}></div>
        </div>
        
        {/* Loading Text */}
        <div className="text-center space-y-2 w-full">
          <h3 className={`${classes.text} font-semibold text-foreground`}>{title}</h3>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        
        {/* Subtle Animation Dots */}
        {showDots && (
          <div className="flex space-x-1 justify-center w-full">
            <div className={`${classes.dots} bg-primary rounded-full animate-bounce`}></div>
            <div className={`${classes.dots} bg-primary rounded-full animate-bounce`} style={{ animationDelay: '0.1s' }}></div>
            <div className={`${classes.dots} bg-primary rounded-full animate-bounce`} style={{ animationDelay: '0.2s' }}></div>
          </div>
        )}
      </div>
    </div>
  );
}

// Compact loading component for inline use
export function LoadingInline({ size = 'sm' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3'
  };

  return (
    <div className="flex items-center justify-center">
      <div className={`${sizeClasses[size]} border-primary/20 rounded-full relative`}>
        <div className={`absolute top-0 left-0 ${sizeClasses[size]} border-primary border-t-transparent rounded-full animate-spin`}></div>
      </div>
    </div>
  );
}
