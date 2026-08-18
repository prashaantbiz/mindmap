export interface ParsedMedia {
  type: "image" | "youtube" | "vimeo" | "video" | "link";
  url: string;
  embedUrl?: string;
  thumbnailUrl?: string;
}

export function parseMediaUrl(url: string | null | undefined): ParsedMedia | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // 1. YouTube
  // e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ or https://youtu.be/dQw4w9WgXcQ
  const ytMatch = trimmed.match(
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i
  );
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    return {
      type: "youtube",
      url: trimmed,
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    };
  }

  // 2. Vimeo
  // e.g. https://vimeo.com/123456789
  const vimeoMatch = trimmed.match(/(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)/i);
  if (vimeoMatch && vimeoMatch[3]) {
    const videoId = vimeoMatch[3];
    return {
      type: "vimeo",
      url: trimmed,
      embedUrl: `https://player.vimeo.com/video/${videoId}`,
    };
  }

  // 3. Direct Video file (.mp4, .webm, .ogg, .mov)
  if (/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(trimmed)) {
    return {
      type: "video",
      url: trimmed,
      embedUrl: trimmed,
    };
  }

  // 4. Image (.png, .jpg, .jpeg, .gif, .webp, .svg or data:image)
  if (
    /\.(png|jpe?g|gif|webp|svg|bmp)(\?.*)?$/i.test(trimmed) ||
    trimmed.startsWith("data:image/") ||
    trimmed.includes("/uploads/")
  ) {
    return {
      type: "image",
      url: trimmed,
      thumbnailUrl: trimmed,
    };
  }

  // 5. Generic Link
  return {
    type: "link",
    url: trimmed,
  };
}
