"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { parseMediaUrl } from "@/lib/media-parser";
import { ExternalLink, Download, X } from "lucide-react";

interface MediaLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  media: {
    url: string;
    title?: string;
    type?: "image" | "video" | "youtube" | "vimeo" | "link";
  } | null;
}

export function MediaLightboxModal({
  isOpen,
  onClose,
  media,
}: MediaLightboxModalProps) {
  if (!media || !media.url) return null;

  const parsed = parseMediaUrl(media.url);
  const mediaType = media.type || parsed?.type || "image";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-card/95 backdrop-blur-md border-border/80 shadow-2xl">
        <DialogHeader className="p-4 pb-2 flex flex-row items-center justify-between border-b border-border/60 space-y-0">
          <DialogTitle className="text-sm font-semibold truncate pr-4 text-foreground">
            {media.title || "Media Preview"}
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-8 px-2.5 text-xs gap-1.5"
            >
              <a href={media.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Open Original</span>
              </a>
            </Button>
          </div>
        </DialogHeader>

        {/* Media Container */}
        <div className="relative flex items-center justify-center bg-black/40 min-h-[300px] max-h-[75vh] overflow-hidden p-2">
          {mediaType === "youtube" && parsed?.embedUrl ? (
            <div className="w-full aspect-video max-w-3xl rounded-lg overflow-hidden shadow-lg">
              <iframe
                src={parsed.embedUrl}
                title={media.title || "YouTube video"}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>
          ) : mediaType === "vimeo" && parsed?.embedUrl ? (
            <div className="w-full aspect-video max-w-3xl rounded-lg overflow-hidden shadow-lg">
              <iframe
                src={parsed.embedUrl}
                title={media.title || "Vimeo video"}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>
          ) : mediaType === "video" ? (
            <video
              src={media.url}
              controls
              autoPlay
              className="max-h-[70vh] max-w-full rounded-lg object-contain"
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            /* Image Preview */
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={media.url}
              alt={media.title || "Attached Image"}
              className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-lg"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
