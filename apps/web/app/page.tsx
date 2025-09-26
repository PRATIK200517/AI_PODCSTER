"use client";
import React, { useState } from 'react';
import HeroSection from '../components/HeroSection';
import PodcastCard from '../components/PodcastCard';
import PodcastPlayer from '../components/PodcastPlayer';
import { useAudio } from '../hooks/useAudio';
import { trendingPodcasts, categories } from '../data/mockData';
import { Podcast } from '../types';
import { TrendingUp, Clock, Filter } from 'lucide-react';
export default function Home() {
  const { currentPodcast, audioState, playPodcast, pausePodcast } = useAudio();
  const [isPlayerVisible, setIsPlayerVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const handlePlayPodcast = (podcast: Podcast) => {
    playPodcast(podcast);
    setIsPlayerVisible(true);
  };

  const handlePausePodcast = () => {
    pausePodcast();
  };

  const handleMinimizePlayer = () => {
    setIsPlayerVisible(false);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Filter podcasts based on category and search query
  const filteredPodcasts = trendingPodcasts.filter(podcast => {
    const matchesCategory = selectedCategory === 'All' || podcast.category === selectedCategory;
    const matchesSearch = podcast.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      podcast.creator.toLowerCase().includes(searchQuery.toLowerCase()) ||
      podcast.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  return (
    <div>
      <HeroSection></HeroSection>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Trending Section */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <TrendingUp className="h-6 w-6 text-purple-400 mr-3" />
              <h2 className="text-3xl font-bold text-black">Trending Now</h2>
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

          {/* Podcasts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPodcasts.map((podcast) => (
              <PodcastCard
                key={podcast.id}
                podcast={podcast}
                isPlaying={currentPodcast?.id === podcast.id && audioState.isPlaying}
                onPlay={handlePlayPodcast}
                onPause={handlePausePodcast}
              />
            ))}
          </div>

          {filteredPodcasts.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-4">No podcasts found</div>
              <p className="text-gray-500">Try adjusting your search or category filter</p>
            </div>
          )}
        </section>

        {/* Recently Added Section */}
        <section className="mb-16">
          <div className="flex items-center mb-8">
            <Clock className="h-6 w-6 text-blue-400 mr-3" />
            <h2 className="text-3xl font-bold text-black">Recently Added</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {trendingPodcasts.slice(0, 4).map((podcast) => (
              <PodcastCard
                key={`recent-${podcast.id}`}
                podcast={podcast}
                isPlaying={currentPodcast?.id === podcast.id && audioState.isPlaying}
                onPlay={handlePlayPodcast}
                onPause={handlePausePodcast}
              />
            ))}
          </div>
        </section>

        {/* Categories Section */}
        <section>
          <h2 className="text-3xl font-bold text-black mb-8">Browse by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {categories.slice(1).map((category) => (
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
                  {trendingPodcasts.filter(p => p.category === category).length} podcasts
                </div>
              </button>
            ))}
          </div>
        </section>
      </main>

      {/* Sticky Podcast Player */}
      <PodcastPlayer
        isVisible={isPlayerVisible}
        onMinimize={handleMinimizePlayer}
      />

      {/* Player Spacer */}
      {isPlayerVisible && <div className="h-20" />}
    </div>
  )
}
