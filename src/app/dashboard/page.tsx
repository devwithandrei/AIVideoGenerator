import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";

const stats = [
  { title: "Projects Created", value: "0", description: "Get started below!" },
  { title: "Credits Remaining", value: "100", description: "Based on your current plan" },
  { title: "Current Plan", value: "Free", description: "Upgrade for more features" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-3 sm:space-y-4 p-2 sm:p-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-headline">Dashboard</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">Welcome back! Here's a summary of your account.</p>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title} className="p-3 sm:p-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
              <CardTitle className="text-xs sm:text-sm font-medium">{stat.title}</CardTitle>
            </CardHeader>
            <CardContent className="p-0 pt-2">
              <div className="text-xl sm:text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight font-headline">Get Started</h2>
        <Card className="mt-3 sm:mt-4">
          <CardContent className="p-4 sm:p-6 text-center">
            <div className="flex flex-col items-center justify-center h-full gap-3 sm:gap-4">
               <div className="bg-primary/10 p-3 sm:p-4 rounded-full">
                <PlusCircle className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mt-1 sm:mt-2">Create Your First Project</h3>
              <p className="text-sm sm:text-base text-muted-foreground max-w-md">
                You haven't created any media yet. Choose one of the AI tools from the sidebar to generate your first video, image, or map animation.
              </p>
              <Button asChild className="mt-3 sm:mt-4 w-full sm:w-auto" style={{backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))'}}>
                <Link href="/dashboard/video-generator">Create New Video</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
