export interface Podcast {
  id: string;
  title: string;
  description: string;
  creator: string;
  imageUrl: string;
  audioUrl: string;
  duration: string;
  listeners: number;
  category: string;
  createdAt: string;
  transcript?: string;
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