import "server-only";

import { tweetIdFromUrl } from "@/lib/sources";

type VxMedia = {
  type?: string;
  url?: string;
  thumbnail_url?: string;
};

type VxTweet = {
  media_extended?: VxMedia[];
};

export type TweetMediaPreview = {
  imageUrl: string;
  isVideo: boolean;
};

function xUsername(sourceUrl: string) {
  try {
    const parts = new URL(sourceUrl).pathname.split("/").filter(Boolean);
    const statusIndex = parts.indexOf("status");
    return statusIndex > 0 ? parts[statusIndex - 1] : null;
  } catch {
    return null;
  }
}

function safeTwitterImage(value: string | undefined) {
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "pbs.twimg.com" ? url.toString() : null;
  } catch {
    return null;
  }
}

/**
 * Return the first real media frame from an X post. The feed only uses this
 * as progressive enhancement: a failed lookup leaves a clean text-only card.
 */
export async function getTweetMediaPreview(sourceUrl: string): Promise<TweetMediaPreview | null> {
  const tweetId = tweetIdFromUrl(sourceUrl);
  const username = xUsername(sourceUrl);
  if (!tweetId || !username) return null;

  try {
    const response = await fetch(
      `https://api.vxtwitter.com/${encodeURIComponent(username)}/status/${tweetId}`,
      { next: { revalidate: 86_400 } },
    );
    if (!response.ok) return null;

    const tweet = (await response.json()) as VxTweet;
    const media = tweet.media_extended?.[0];
    const imageUrl = safeTwitterImage(media?.thumbnail_url ?? media?.url);
    if (!media || !imageUrl) return null;

    return { imageUrl, isVideo: media.type === "video" || Boolean(media.thumbnail_url) };
  } catch {
    return null;
  }
}
