import React from 'react';
import { Play, Pause, Clock, Users, Heart } from 'lucide-react';
import { Podcast } from '../types';

interface PodcastCardProps {
  podcast: Podcast;
  isPlaying?: boolean;
  onPlay: (podcast: Podcast) => void;
  onPause: () => void;
}

const PodcastCard: React.FC<PodcastCardProps> = ({
  podcast,
  isPlaying = false,
  onPlay,
  onPause,
}) => {
  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying) {
      onPause();
    } else {
      onPlay(podcast);
    }
  };

  const formatListeners = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <div className="group relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer">
      <div className="relative">
        <img
          src={podcast.imageUrl}
          alt={podcast.title}
          className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={handlePlayClick}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-full p-4 shadow-lg transform hover:scale-110 transition-all duration-200"
          >
            {isPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6 ml-1" />
            )}
          </button>
        </div>

        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <span className="bg-purple-600/90 text-white text-xs font-medium px-2 py-1 rounded-full backdrop-blur-sm">
            {podcast.category}
          </span>
        </div>

        {/* Like Button */}
        <div className="absolute top-3 right-3">
          <button className="bg-black/20 backdrop-blur-sm rounded-full p-2 text-white hover:bg-black/40 transition-colors duration-200">
            <Heart className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-white font-semibold text-lg line-clamp-2 mb-2 group-hover:text-purple-300 transition-colors duration-200">
          {podcast.title}
        </h3>
        
        <p className="text-gray-400 text-sm line-clamp-2 mb-3">
          {podcast.description}
        </p>

        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
          <span className="font-medium text-purple-400">{podcast.creator}</span>
          <div className="flex items-center space-x-3">
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              <span>{podcast.duration}</span>
            </div>
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              <span>{formatListeners(podcast.listeners)}</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-700 rounded-full h-1">
          <div className="bg-purple-600 h-1 rounded-full" style={{ width: '0%' }}></div>
        </div>
      </div>

      {/* Glow Effect */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600/0 via-purple-600/0 to-blue-600/0 group-hover:from-purple-600/10 group-hover:via-purple-600/5 group-hover:to-blue-600/10 transition-all duration-300 pointer-events-none" />
    </div>
  );
};

export default PodcastCard;