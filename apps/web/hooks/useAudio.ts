// src/hooks/useAudio.ts
import { useState, useRef, useEffect, useCallback } from 'react';
import { Podcast } from '../types';

interface AudioState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isMuted: boolean;
  volume: number;
}

interface UseAudioReturn {
  currentPodcast: Podcast | null;
  audioRef: React.RefObject<HTMLAudioElement>;
  audioState: AudioState;
  playPodcast: (podcast: Podcast) => void;
  pausePodcast: () => void;
  togglePlay: () => void;
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  skipForward: () => void;
  skipBackward: () => void;
}

export const useAudio = (): UseAudioReturn => {
  const [audioState, setAudioState] = useState<AudioState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    isMuted: false,
    volume: 1,
  });
  
  const [currentPodcast, setCurrentPodcast] = useState<Podcast | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element on client side only
  useEffect(() => {
    if (typeof window !== 'undefined' && !audioRef.current) {
      audioRef.current = new Audio();
    }
  }, []);

  // Audio control functions with proper null checks
  const playPodcast = useCallback((podcast: Podcast) => {
    setCurrentPodcast(prev => prev?.id === podcast.id ? prev : podcast);
    setAudioState(prev => ({ ...prev, isPlaying: true }));
  }, []);

  const pausePodcast = useCallback(() => {
    setAudioState(prev => ({ ...prev, isPlaying: false }));
  }, []);

  const togglePlay = useCallback(() => {
    setAudioState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, []);

  const seekTo = useCallback((time: number) => {
    setAudioState(prev => ({ ...prev, currentTime: time }));
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  }, []);

  const setVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    setAudioState(prev => ({ ...prev, volume: clampedVolume }));
    if (audioRef.current) {
      audioRef.current.volume = clampedVolume;
    }
  }, []);

  const toggleMute = useCallback(() => {
    setAudioState(prev => ({ ...prev, isMuted: !prev.isMuted }));
    if (audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted;
    }
  }, []);

  const skipForward = useCallback(() => {
    const newTime = Math.min(audioState.currentTime + 10, audioState.duration);
    seekTo(newTime);
  }, [audioState.currentTime, audioState.duration, seekTo]);

  const skipBackward = useCallback(() => {
    const newTime = Math.max(audioState.currentTime - 10, 0);
    seekTo(newTime);
  }, [audioState.currentTime, seekTo]);

  // Audio effects
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const eventListeners = {
      timeupdate: () => setAudioState(prev => ({ ...prev, currentTime: audio.currentTime })),
      loadedmetadata: () => setAudioState(prev => ({ ...prev, duration: audio.duration })),
      play: () => setAudioState(prev => ({ ...prev, isPlaying: true })),
      pause: () => setAudioState(prev => ({ ...prev, isPlaying: false })),
      ended: () => setAudioState(prev => ({ ...prev, isPlaying: false })),
    };

    Object.entries(eventListeners).forEach(([event, handler]) => {
      audio.addEventListener(event, handler);
    });

    return () => {
      Object.entries(eventListeners).forEach(([event, handler]) => {
        audio.removeEventListener(event, handler);
      });
    };
  }, []);

  // Handle podcast source changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentPodcast?.audioUrl) return;

    if (audio.src !== currentPodcast.audioUrl) {
      audio.src = currentPodcast.audioUrl;
      audio.currentTime = 0;
    }

    if (audioState.isPlaying) {
      audio.play().catch(error => {
        console.error('Playback failed:', error);
        setAudioState(prev => ({ ...prev, isPlaying: false }));
      });
    }
  }, [currentPodcast, audioState.isPlaying]);

  return {
    currentPodcast,
    audioRef: audioRef as React.RefObject<HTMLAudioElement>, // Type assertion
    audioState,
    playPodcast,
    pausePodcast,
    togglePlay,
    seekTo,
    setVolume,
    toggleMute,
    skipForward,
    skipBackward,
  };
};