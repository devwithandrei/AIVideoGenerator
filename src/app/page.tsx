import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clapperboard, Gem, ImageIcon, Map, Rocket } from "lucide-react"
import { Header } from "@/components/header"
import BillboardHero from "@/components/billboard-hero"
import { SignedIn, SignedOut, SignInButton, SignUpButton } from '@clerk/nextjs'

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background w-full max-w-none overflow-x-hidden">
      <div className="relative w-full max-w-none">
        <div className="absolute inset-x-0 top-0 z-40 w-full">
          <Header />
        </div>
        <BillboardHero />
      </div>
      <main className="flex-1">
        <section id="features" className="w-full py-8 sm:py-12 md:py-24 lg:py-32 bg-card">
          <div className="w-full max-w-none px-4 sm:px-6 md:px-8 lg:px-10 xl:px-14">
            <div className="flex flex-col items-center justify-center space-y-3 sm:space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted px-2 sm:px-3 py-1 text-xs sm:text-sm">Key Features</div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tighter lg:text-5xl font-headline">
                  Everything You Need to Create
                </h2>
                <p className="max-w-[900px] text-sm sm:text-base text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  From text prompts to polished final cuts, AISNV provides a seamless, powerful, and intuitive creation experience with realistic results.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-6 sm:gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 mt-8 sm:mt-12">
              <div className="grid gap-1 text-center">
                <Clapperboard className="h-8 w-8 sm:h-10 sm:w-10 mx-auto text-primary" />
                <h3 className="text-base sm:text-lg font-bold font-headline">AI Video Generation</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Bring your ideas to life. Generate high-quality videos from simple text prompts in minutes.
                </p>
              </div>
              <div className="grid gap-1 text-center">
                <ImageIcon className="h-8 w-8 sm:h-10 sm:w-10 mx-auto text-primary" />
                <h3 className="text-base sm:text-lg font-bold font-headline">AI Image Suite</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Create stunning visuals from text or enhance your existing images with our powerful AI editing tools.
                </p>
              </div>
              <div className="grid gap-1 text-center">
                <Map className="h-8 w-8 sm:h-10 sm:w-10 mx-auto text-primary" />
                <h3 className="text-base sm:text-lg font-bold font-headline">Map Animations</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Generate beautiful, animated map routes for your travel vlogs and presentations automatically.
                </p>
              </div>
            </div>
          </div>
        </section>
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
