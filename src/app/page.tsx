import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import BillboardHero from "@/components/billboard-hero"
import FeatureVideosSection from "@/components/feature-videos-section"
import { SignedIn, SignedOut } from '@clerk/nextjs'
import { getBillboardPublicData } from "@/lib/billboard-public"
import { getFeatures } from "@/lib/feature-videos"

export default async function LandingPage() {
  // Fetch billboard + features server-side so the page renders with real data
  // on first paint (no flash of fallback content) and loads faster.
  const [billboardData, featuresData] = await Promise.all([
    getBillboardPublicData(),
    getFeatures().catch(() => []),
  ])

  return (
    <div className="flex flex-col min-h-screen bg-background w-full max-w-none overflow-x-hidden">
      <div className="relative w-full max-w-none">
        <div className="absolute inset-x-0 top-0 z-40 w-full">
          <Header />
        </div>
        <BillboardHero
          initialBillboard={billboardData.billboard}
          initialPlaylist={billboardData.playlist}
          initialSettings={billboardData.settings}
        />
      </div>
      <main className="flex-1">
        <FeatureVideosSection initialFeatures={featuresData} />
         <section className="w-full py-8 sm:py-12 md:py-24 lg:py-32">
          <div className="w-full max-w-none grid items-center justify-center gap-3 sm:gap-4 px-4 sm:px-6 md:px-8 lg:px-10 xl:px-14 text-center">
            <div className="space-y-2 sm:space-y-3">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tighter md:text-4xl/tight font-headline">
                Ready to Forge Your Next Masterpiece?
              </h2>
              <p className="mx-auto max-w-[600px] text-sm sm:text-base text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Jump into the studio and start bringing your vision to life today.
              </p>
            </div>
            <div className="mx-auto w-full max-w-sm space-y-2">
              <SignedOut>
                <Button asChild size="lg" className="w-full" style={{backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))'}}>
                   <Link href="/sign-up" prefetch={false}>
                        Get Started
                      </Link>
                </Button>
              </SignedOut>
              <SignedIn>
                <Button asChild size="lg" className="w-full" style={{backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))'}}>
                   <Link href="/studio" prefetch={false}>
                      Go to Studio
                    </Link>
                </Button>
              </SignedIn>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-4 sm:py-6 w-full shrink-0 items-center px-3 sm:px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} AISNV. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-3 sm:gap-4 md:gap-6">
          <Link href="/terms" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Terms of Service
          </Link>
          <Link href="/privacy" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Privacy Policy
          </Link>
        </nav>
      </footer>
    </div>
  )
}
