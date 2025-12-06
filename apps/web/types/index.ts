export interface Podcast {
  id: string;
  title: string;
  category: string;
  description: string;
  audioUrl: string;
  thumbnailUrl: string;  // Fixed: using thumbnailUrl consistently
  creator: string;
  duration: number;
  createdAt: string;
  likes?: number;  // This exists
  trending?: boolean;
  // Remove imageUrl since we're using thumbnailUrl
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  podcastsCreated: number;
}

export interface PlayerState {
  isPlaying: boolean;
  currentPodcast: Podcast | null;
  currentTime: number;
  duration: number;
  isMuted: boolean;
}