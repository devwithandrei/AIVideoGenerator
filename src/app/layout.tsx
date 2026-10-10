import type {Metadata} from 'next';
import './globals.css';
import { cn } from "@/lib/utils"
import { Toaster } from "@/components/ui/toaster"
import { SidebarProvider } from '@/components/ui/sidebar';
import { ClerkProvider } from '@clerk/nextjs';
import PresenceHeartbeat from '@/components/presence-heartbeat';


export const metadata: Metadata = {
  title: 'AISNV',
  description: 'AI-powered media creation and editing studio.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark w-screen h-screen max-w-none overflow-hidden m-0 p-0" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=Source+Code+Pro:wght@400;500;600&display=swap" rel="stylesheet" />
        <style>{`
          /* Kill viewport-level native scrollbar entirely (eliminates asymmetric right gap) */
          html,
          body,
          :root {
            width: 100vw !important;
            height: 100vh !important;
            max-width: none !important;
            overflow: hidden !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* All scrolling happens on the inner full-bleed app shell, not the viewport.
             Semi-transparent slim scrollbars, consistent everywhere. */
          * {
            scrollbar-width: thin;
            scrollbar-color: rgba(255,255,255,0.24) rgba(255,255,255,0.04);
            box-sizing: border-box;
          }

          ::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }
          ::-webkit-scrollbar-track {
            background: transparent !important;
          }
          ::-webkit-scrollbar-thumb {
            background-color: rgba(255,255,255,0.24);
            border-radius: 9999px;
            border: none;
          }
          ::-webkit-scrollbar-thumb:hover {
            background-color: rgba(255,255,255,0.42);
          }
          ::-webkit-scrollbar-corner {
            background: transparent;
          }

          /* First descendant of root body: full-bleed app shell scroll container.
             Applies to: the SidebarProvider div, admin layout flex container, page wrappers. */
          body > *:first-child,
          body > *:first-child > * {
            width: 100vw !important;
            height: 100vh !important;
            max-width: none !important;
            max-height: none !important;
            overflow-y: auto !important;
            overflow-x: hidden !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        `}</style>
      </head>
      <body className={cn("font-body antialiased bg-background font-sans w-screen h-screen max-w-none overflow-hidden m-0 p-0")} suppressHydrationWarning>
        <ClerkProvider>
          <PresenceHeartbeat />
          <SidebarProvider className="w-screen h-screen max-w-none max-h-none !overflow-x-hidden !overflow-y-auto min-h-0 m-0 p-0">
            <div className="w-screen h-screen max-w-none max-h-none m-0 p-0 !overflow-x-hidden overflow-y-auto">
              {children}
            </div>
          </SidebarProvider>
          <Toaster />
        </ClerkProvider>
      </body>
    </html>
  );
}
