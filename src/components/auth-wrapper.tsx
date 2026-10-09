"use client";




export function AuthWrapper({ children }: { children: React.ReactNode }) {
  // Bypass all loading - return children immediately
  return <>{children}</>;
} 