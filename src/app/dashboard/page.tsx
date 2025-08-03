import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Film, Image as ImageIcon, Map } from "lucide-react";

const stats = [
  { title: "Projects Created", value: "12", description: "Total projects generated" },
  { title: "Credits Remaining", value: "850", description: "Your available credits" },
  { title: "Current Plan", value: "Pro", description: "Upgraded on 2024-07-01" },
];

const recentProjects = [
  { name: "Summer Trip Recap", type: "Video", date: "2024-07-28", icon: <Film className="h-5 w-5 text-muted-foreground" /> },
  { name: "NYC Skyline", type: "Image", date: "2024-07-27", icon: <ImageIcon className="h-5 w-5 text-muted-foreground" /> },
  { name: "European Roadtrip", type: "Map Animation", date: "2024-07-25", icon: <Map className="h-5 w-5 text-muted-foreground" /> },
  { name: "Product Hunt Launch Video", type: "Video", date: "2024-07-22", icon: <Film className="h-5 w-5 text-muted-foreground" /> },
  { name: "Futuristic Cityscape", type: "Image", date: "2024-07-21", icon: <ImageIcon className="h-5 w-5 text-muted-foreground" /> },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
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
        <h2 className="text-2xl font-bold tracking-tight font-headline">Recent Projects</h2>
        <Card className="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Type</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentProjects.map((project) => (
                <TableRow key={project.name}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {project.icon}
                      <span className="font-medium">{project.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant="outline">{project.type}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{project.date}</TableCell>
                  <TableCell>
                    <Button aria-haspopup="true" size="icon" variant="ghost">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Toggle menu</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
