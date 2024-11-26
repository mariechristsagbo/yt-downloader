import { CheckCircle2, Download, List, Youtube } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const features = [
  {
    title: "Playlist Support",
    description: "Download entire YouTube playlists with a single click",
    icon: List,
  },
  {
    title: "High Quality",
    description: "Choose from various quality options for your downloads",
    icon: Youtube,
  },
  {
    title: "Fast Downloads",
    description: "Optimized for speed with parallel downloading",
    icon: Download,
  },
  {
    title: "Easy to Use",
    description: "Simple interface for hassle-free downloads",
    icon: CheckCircle2,
  },
];

export function Features() {
  return (
    <section className="container space-y-6 py-8 md:py-12 lg:py-16">
      <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
        <h2 className="font-bold text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
          Features
        </h2>
        <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
          Download your favorite YouTube playlists quickly and easily
        </p>
      </div>
      <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-4">
        {features.map((feature) => (
          <Card key={feature.title} className="flex flex-col">
            <CardHeader>
              <feature.icon className="h-10 w-10" />
              <CardTitle className="text-xl">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <CardDescription>{feature.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}