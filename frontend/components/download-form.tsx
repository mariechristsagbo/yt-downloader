"use client";
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Download, Loader2, Eye } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  url: z
    .string()
    .url("Please enter a valid URL")
    .refine(
      (url) => url.includes("youtube.com") || url.includes("youtu.be"),
      "Please enter a valid YouTube URL"
    ),
  quality: z.enum(["highest", "1080p", "720p", "480p", "360p"], {
    required_error: "Please select a quality option",
  }),
});

const qualities = [
  { value: "highest", label: "Highest Available" },
  { value: "1080p", label: "1080p" },
  { value: "720p", label: "720p" },
  { value: "480p", label: "480p" },
  { value: "360p", label: "360p" },
] as const;

type SingleVideo = {
  title: string;
  thumbnail: string;
  uploader: string;
  duration: number;
  description: string;
};

type PlaylistVideo = {
  title: string;
  url: string;
  thumbnail: string;
  channel_name: string;
  view_count: string | number;
};

type VideoInfo = {
  title: string;
  uploader: string;
  duration?: number;
  thumbnail?: string;
  description?: string;
  videos?: PlaylistVideo[];
} | SingleVideo;

export function DownloadForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [videos, setVideos] = useState<VideoInfo[]>([]);
  const [downloadingVideos, setDownloadingVideos] = useState<{ [key: string]: boolean }>({});
  const [videoProgress, setVideoProgress] = useState<{ [key: string]: number }>({});
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: "",
      quality: "highest",
    },
  });

  async function fetchVideoInfo(url: string) {
    setIsPreviewLoading(true);
    setVideoInfo(null);
    try {
      const response = await fetch("http://localhost:5000/api/video-info", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message);
      }

      const data = await response.json();
      setVideoInfo(data.video_info as VideoInfo);
      console.log('Received video info:', data.video_info);
    } catch (error: any) {
      toast({
        title: "Failed to Fetch Video Info",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsPreviewLoading(false);
    }
  }

  async function downloadSingleVideo(url: string, quality: string, videoTitle: string) {
    const videoKey = url;
    setDownloadingVideos(prev => ({ ...prev, [videoKey]: true }));
    setVideoProgress(prev => ({ ...prev, [videoKey]: 0 }));

    try {
      // Start polling the progress endpoint for this video
      const progressInterval = setInterval(async () => {
        try {
          const response = await fetch("http://localhost:5000/api/download-progress");
          if (response.ok) {
            const progressData = await response.json();
            if (progressData.progress !== undefined) {
              setVideoProgress(prev => ({ ...prev, [videoKey]: progressData.progress }));
            }
          }
        } catch (error) {
          console.error("Error fetching download progress:", error);
        }
      }, 1000);

      const response = await fetch("http://localhost:5000/api/download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url, quality }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      // Utiliser le titre de la vidéo pour le nom du fichier
      link.download = `${videoTitle}.mp4`;
      // Déclencher la boîte de dialogue native du navigateur
      link.click();
      // Nettoyer l'URL
      window.URL.revokeObjectURL(downloadUrl);
      link.remove();

      toast({
        title: "Download Complete",
        description: `${videoTitle} has been successfully downloaded!`,
      });

      clearInterval(progressInterval);
    } catch (error: any) {
      toast({
        title: "Download Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDownloadingVideos(prev => ({ ...prev, [videoKey]: false }));
      setVideoProgress(prev => ({ ...prev, [videoKey]: 0 }));
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setProgress(0);

    try {
      // Start polling the progress endpoint
      const progressInterval = setInterval(async () => {
        try {
          const response = await fetch("http://localhost:5000/api/download-progress");
          if (response.ok) {
            const progressData = await response.json();
            if (progressData.progress !== undefined) {
              setProgress(progressData.progress);
            }
          }
        } catch (error) {
          console.error("Error fetching download progress:", error);
        }
      }, 1000);

      const response = await fetch("http://localhost:5000/api/download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      // Utiliser le titre de la vidéo pour le nom du fichier
      const fileName = videoInfo?.title ? `${videoInfo.title}.mp4` : 'video.mp4';
      link.download = fileName;
      // Déclencher la boîte de dialogue native du navigateur
      link.click();
      // Nettoyer l'URL
      window.URL.revokeObjectURL(downloadUrl);
      link.remove();

      toast({
        title: "Download Complete",
        description: "Your video has been successfully downloaded!",
      });

      clearInterval(progressInterval);
    } catch (error: any) {
      toast({
        title: "Download Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6">
        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>YouTube URL</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://youtube.com/watch?v=..."
                  {...field}
                  disabled={isLoading || isPreviewLoading}
                />
              </FormControl>
              <FormDescription>Enter a YouTube video URL</FormDescription>
              <FormMessage />
              <Button
                type="button"
                className="mt-2"
                onClick={() => fetchVideoInfo(field.value)}
                disabled={isLoading || isPreviewLoading || !field.value}
              >
                {isPreviewLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading Preview...
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    Preview Video
                  </>
                )}
              </Button>
            </FormItem>
          )}
        />
        {videoInfo && (
          <div className="mt-4">
            {'videos' in videoInfo ? (
              // Playlist display
              <div className="space-y-4">
                <h2 className="text-xl font-bold">{videoInfo.title}</h2>
                <p className="text-sm text-muted-foreground">Playlist by {videoInfo.uploader}</p>
                <div className="space-y-4">
                  {videoInfo.videos?.map((video) => (
                    <div key={video.url} className="p-2 border rounded-lg shadow-sm flex flex-col md:flex-row md:items-center gap-4">
                      <div className="md:w-1/3">
                        <Image
                          src={video.thumbnail}
                          alt={video.title}
                          width={320}
                          height={180}
                          className="w-full h-full rounded-md"
                        />
                      </div>
                      <div className="md:w-2/3 space-y-2">
                        <h3 className="text-base font-bold text-ellipsis line-clamp-1">{video.title}</h3>
                        <div className="flex">
                        <p className="text-sm text-muted-foreground w-1/2 text-ellipsis line-clamp-1">{video.channel_name}</p>
                        <p className="text-sm w-1/2 text-ellipsis line-clamp-1">Vues : {video.view_count}</p>
                        </div>
                        <div className="space-y-2">
                          {downloadingVideos[video.url] && (
                            <div className="space-y-1">
                              <Progress value={videoProgress[video.url]} />
                              <p className="text-sm text-muted-foreground text-center">
                                Downloading... {videoProgress[video.url]?.toFixed(1)}%
                              </p>
                            </div>
                          )}
                          <Button
                            onClick={() => downloadSingleVideo(video.url, form.getValues('quality'), video.title)}
                            disabled={downloadingVideos[video.url] || isLoading}
                            className={`w-full md:w-auto py-2 ${downloadingVideos[video.url] || isLoading ? 'hidden' : ''}`}
                          >
                            {downloadingVideos[video.url] ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Downloading...
                              </>
                            ) : (
                              <>
                                <Download className="mr-2 h-4 w-4" />
                                Download
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Bouton de téléchargement de la playlist avec barre de progression */}
                <div className="mt-6 space-y-4">
                  {isLoading && (
                    <div className="space-y-2">
                      <Progress value={progress} className="h-2" />
                      <p className="text-sm text-muted-foreground text-center">
                        Downloading playlist... {progress.toFixed(1)}%
                      </p>
                    </div>
                  )}
                  <Button
                    onClick={() => onSubmit(form.getValues())}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Downloading playlist...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Download Full Playlist
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              // Single video display
              <div className="p-4 border rounded-lg shadow-sm">
                <Image
                  src={videoInfo.thumbnail ?? ''}
                  alt={videoInfo.title}
                  width={640}
                  height={360}
                  className="w-full h-auto mb-4 rounded-md"
                />
                <h3 className="text-xl font-bold">{videoInfo.title}</h3>
                <p className="text-sm text-muted-foreground">{videoInfo.uploader}</p>
                <p className="text-sm mt-2">{videoInfo.description}</p>
                {videoInfo.duration && (
                  <p className="text-sm mt-2">
                    Durée : {Math.floor(videoInfo.duration / 60)}:{(videoInfo.duration % 60).toString().padStart(2, '0')}
                  </p>
                )}
                <div className="mt-4">
                  {isLoading && (
                    <div className="space-y-2 mb-4">
                      <Progress value={progress} />
                      <p className="text-sm text-muted-foreground text-center">
                        Downloading... {progress.toFixed(1)}%
                      </p>
                    </div>
                  )}
                  <Button
                    onClick={() => onSubmit(form.getValues())}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Download Video
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
        <FormField
          control={form.control}
          name="quality"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quality</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select quality" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {qualities.map((quality) => (
                    <SelectItem key={quality.value} value={quality.value}>
                      {quality.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>Choose the quality for your video</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button 
          type="submit" 
          disabled={isLoading || !videoInfo} 
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Downloading...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              {videoInfo && 'videos' in videoInfo ? 'Download Playlist' : 'Download Video'}
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}

export default DownloadForm;