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
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's a summary of your account.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="text-2xl font-bold tracking-tight font-headline">Get Started</h2>
        <Card className="mt-4">
          <CardContent className="p-6 text-center">
            <div className="flex flex-col items-center justify-center h-full gap-4">
               <div className="bg-primary/10 p-4 rounded-full">
                <PlusCircle className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mt-2">Create Your First Project</h3>
              <p className="text-muted-foreground max-w-md">
                You haven't created any media yet. Choose one of the AI tools from the sidebar to generate your first video, image, or map animation.
              </p>
              <Button asChild className="mt-4" style={{backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))'}}>
                <Link href="/dashboard/video-generator">Create New Video</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
