"use client";
import React, { useState, useEffect, useRef } from 'react';
import HeroSection from '../components/HeroSection';
import PodcastCard from '../components/PodcastCard';
import PodcastPlayer from '../components/PodcastPlayer';
import Footer from '@/components/Footer';
import { TrendingUp, Clock, Filter } from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

interface Podcast {
  id: string;
  title: string;
  category: string;
  description: string;
  audioUrl: string;
  thumbnailUrl: string;
  creator: string;
  duration: number;
  createdAt: string;
  likes?: number;
  trending?: boolean;
}

interface ApiPodcast {
  id: number;
  title: string;
  category: string;
  description: string;
  audio_url: string;
  thumbnail_url: string | null;
  author_name: string;
  created_at: string;
  likescount?: number;
  duration?: number;
}

// Skeleton Card Component
const PodcastCardSkeleton = () => (
  <div className="group relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden shadow-lg animate-pulse">
    <div className="relative">
      <div className="w-full h-48 bg-gray-700"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
    </div>
    <div className="p-4">
      <div className="h-5 bg-gray-700 rounded mb-2"></div>
      <div className="h-4 bg-gray-700 rounded w-3/4 mb-3"></div>
      <div className="flex items-center justify-between text-sm mb-3">
        <div className="h-4 bg-gray-700 rounded w-1/4"></div>
        <div className="flex items-center space-x-3">
          <div className="h-4 bg-gray-700 rounded w-10"></div>
          <div className="h-4 bg-gray-700 rounded w-10"></div>
        </div>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-1"></div>
    </div>
  </div>
);

// Category Button Skeleton
const CategoryButtonSkeleton = () => (
  <div className="p-6 rounded-xl bg-gray-800 animate-pulse">
    <div className="h-5 bg-gray-700 rounded mb-2"></div>
    <div className="h-4 bg-gray-700 rounded w-1/2 mx-auto"></div>
  </div>
);

export default function Home() {
  const [isPlayerVisible, setIsPlayerVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [allPodcasts, setAllPodcasts] = useState<Podcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>(['All']);
  
  // Audio state (copied from Discover page)
  const [currentPlaying, setCurrentPlaying] = useState<Podcast | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch podcasts from backend
  useEffect(() => {
    const fetchPodcasts = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${BACKEND_URL}/podcasts`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch podcasts: ${response.status}`);
        }
        
        const data: ApiPodcast[] = await response.json();
        
        // Transform API data to match Podcast type
        const transformedPodcasts: Podcast[] = data.map(podcast => ({
          id: podcast.id.toString(),
          title: podcast.title,
          category: podcast.category,
          description: podcast.description,
          audioUrl: podcast.audio_url,
          thumbnailUrl: podcast.thumbnail_url || '/default-thumbnail.jpg',
          creator: podcast.author_name,
          duration: podcast.duration || 0,
          createdAt: podcast.created_at,
          likes: podcast.likescount || 0,
          trending: true
        }));
        
        setAllPodcasts(transformedPodcasts);
        
        // Extract unique categories
        const uniqueCategories = ['All', ...Array.from(new Set(data.map(p => p.category)))];
        setCategories(uniqueCategories);
        
      } catch (err) {
        console.error('Error fetching podcasts:', err);
        setError(err instanceof Error ? err.message : 'Failed to load podcasts');
      } finally {
        setLoading(false);
      }
    };

    fetchPodcasts();
  }, []);

  const handlePlay = (podcast: Podcast) => {
    // If clicking play on the currently playing podcast, toggle pause/play
    if (currentPlaying?.id === podcast.id) {
      if (isPlaying) {
        handlePause();
      } else {
        if (audioRef.current) {
          audioRef.current.play();
          setIsPlaying(true);
        }
      }
      return;
    }
    
    // If there's already audio playing, pause it
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const newAudio = new Audio(podcast.audioUrl);
    
    // Set up event listeners
    newAudio.addEventListener('timeupdate', () => {
      setCurrentTime(newAudio.currentTime);
    });
    
    newAudio.addEventListener('loadedmetadata', () => {
      setDuration(newAudio.duration);
    });
    
    newAudio.addEventListener('ended', () => {
      setIsPlaying(false);
      setCurrentPlaying(null);
    });

    newAudio.play();
    
    audioRef.current = newAudio;
    setCurrentPlaying(podcast);
    setIsPlaying(true);
    setIsPlayerVisible(true);
  };

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleMinimizePlayer = () => {
    setIsPlayerVisible(false);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Filter podcasts based on category and search query
  const filteredPodcasts = allPodcasts.filter(podcast => {
    const matchesCategory = selectedCategory === 'All' || podcast.category === selectedCategory;
    const matchesSearch = podcast.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      podcast.creator.toLowerCase().includes(searchQuery.toLowerCase()) ||
      podcast.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Get trending podcasts (top 8 by likes)
  const trendingPodcasts = [...filteredPodcasts]
    .sort((a, b) => (b.likes || 0) - (a.likes || 0))
    .slice(0, 8);

  // Get recently added podcasts (latest 4)
  const recentlyAddedPodcasts = [...allPodcasts]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Render content based on state
  const renderContent = () => {
    if (error) {
      return (
        <div className="text-center py-12">
          <div className="text-red-500 text-lg mb-4">Error loading podcasts</div>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      );
    }

    if (loading) {
      return (
        <>
          {/* Trending Section Skeleton */}
          <section className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center">
                <TrendingUp className="h-6 w-6 text-purple-400 mr-3" />
                <h2 className="text-3xl font-bold text-white">Trending Now</h2>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center text-gray-400">
                  <Filter className="h-5 w-5 mr-2" />
                  <span className="text-sm">Filter by:</span>
                </div>
                <div className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm w-32 h-9"></div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <PodcastCardSkeleton key={`trending-skeleton-${i}`} />
              ))}
            </div>
          </section>

          {/* Recently Added Section Skeleton */}
          <section className="mb-16">
            <div className="flex items-center mb-8">
              <Clock className="h-6 w-6 text-blue-400 mr-3" />
              <h2 className="text-3xl font-bold text-white">Recently Added</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <PodcastCardSkeleton key={`recent-skeleton-${i}`} />
              ))}
            </div>
          </section>

          {/* Categories Section Skeleton */}
          <section>
            <h2 className="text-3xl font-bold text-white mb-8">Browse by Category</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <CategoryButtonSkeleton key={`category-skeleton-${i}`} />
              ))}
            </div>
          </section>
        </>
      );
    }

    return (
      <>
        {/* Trending Section */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <TrendingUp className="h-6 w-6 text-purple-400 mr-3" />
              <h2 className="text-3xl font-bold text-white">Trending Now</h2>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-gray-400">
                <Filter className="h-5 w-5 mr-2" />
                <span className="text-sm">Filter by:</span>
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Podcasts Grid - Show only 8 trending podcasts (2 rows) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {trendingPodcasts.length > 0 ? (
              trendingPodcasts.map((podcast) => (
                <PodcastCard
                  key={podcast.id}
                  podcast={podcast}
                  isPlaying={currentPlaying?.id === podcast.id && isPlaying}
                  onPlay={handlePlay}
                  onPause={handlePause}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <div className="text-gray-400 text-lg mb-4">No trending podcasts found</div>
                <p className="text-gray-500">Try adjusting your search or category filter</p>
              </div>
            )}
          </div>
        </section>

        {/* Recently Added Section */}
        <section className="mb-16">
          <div className="flex items-center mb-8">
            <Clock className="h-6 w-6 text-blue-400 mr-3" />
            <h2 className="text-3xl font-bold text-white">Recently Added</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {recentlyAddedPodcasts.map((podcast) => (
              <PodcastCard
                key={`recent-${podcast.id}`}
                podcast={podcast}
                isPlaying={currentPlaying?.id === podcast.id && isPlaying}
                onPlay={handlePlay}
                onPause={handlePause}
              />
            ))}
          </div>
        </section>

        {/* Categories Section */}
        <section>
          <h2 className="text-3xl font-bold text-white mb-8">Browse by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {categories.slice(1).map((category) => {
              const categoryPodcasts = allPodcasts.filter(p => p.category === category);
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`p-6 rounded-xl text-center transition-all duration-300 ${selectedCategory === category
                      ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-lg'
                      : 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white'
                    }`}
                >
                  <div className="font-semibold">{category}</div>
                  <div className="text-sm opacity-75 mt-1">
                    {categoryPodcasts.length} podcast{categoryPodcasts.length !== 1 ? 's' : ''}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </>
    );
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col">
      <HeroSection onSearch={handleSearch} />
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {renderContent()}
      </main>

      {/* Footer Section */}
      <Footer />

      {/* Sticky Podcast Player */}
      <PodcastPlayer
        isVisible={isPlayerVisible}
        onMinimize={handleMinimizePlayer}
      />

      {/* Player Spacer */}
      {isPlayerVisible && <div className="h-20" />}
    </div>
  );
}