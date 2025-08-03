import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clapperboard, Gem, ImageIcon, Map, Rocket } from "lucide-react"
import Image from "next/image"
import { Header } from "@/components/header"

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none font-headline">
                    Unleash Your Creativity with <span className="text-primary">MediaForge AI</span>
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    The all-in-one platform for generating and editing stunning videos, images, and map animations with the power of artificial intelligence.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button asChild size="lg" style={{backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))'}}>
                    <Link href="/dashboard" prefetch={false}>
                      Start For Free
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link href="#features" prefetch={false}>
                      Learn More
                    </Link>
                  </Button>
                </div>
              </div>
              <Image
                src="https://placehold.co/600x400.png"
                width="600"
                height="400"
                alt="Hero"
                data-ai-hint="ai generated media"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last lg:aspect-square"
              />
            </div>
          </div>
        </section>
        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-card">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Key Features</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">
                  Everything You Need to Create
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  From text prompts to polished final cuts, MediaForge AI provides a seamless, powerful, and intuitive creation experience.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 mt-12">
              <div className="grid gap-1 text-center">
                <Clapperboard className="h-10 w-10 mx-auto text-primary" />
                <h3 className="text-lg font-bold font-headline">AI Video Generation</h3>
                <p className="text-sm text-muted-foreground">
                  Bring your ideas to life. Generate high-quality videos from simple text prompts in minutes.
                </p>
              </div>
              <div className="grid gap-1 text-center">
                <ImageIcon className="h-10 w-10 mx-auto text-primary" />
                <h3 className="text-lg font-bold font-headline">AI Image Suite</h3>
                <p className="text-sm text-muted-foreground">
                  Create stunning visuals from text or enhance your existing images with our powerful AI editing tools.
                </p>
              </div>
              <div className="grid gap-1 text-center">
                <Map className="h-10 w-10 mx-auto text-primary" />
                <h3 className="text-lg font-bold font-headline">Map Animations</h3>
                <p className="text-sm text-muted-foreground">
                  Generate beautiful, animated map routes for your travel vlogs and presentations automatically.
                </p>
              </div>
            </div>
          </div>
        </section>
         <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight font-headline">
                Ready to Forge Your Next Masterpiece?
              </h2>
              <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Jump into the studio and start bringing your vision to life today.
              </p>
            </div>
            <div className="mx-auto w-full max-w-sm space-y-2">
              <Button asChild size="lg" className="w-full" style={{backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))'}}>
                 <Link href="/dashboard" prefetch={false}>
                      Go to Dashboard
                    </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; 2024 MediaForge AI. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Terms of Service
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  )
}
