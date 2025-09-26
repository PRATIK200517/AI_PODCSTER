"use client";
import React, { useEffect, useState, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import {
  Search,
  Filter,
  Grid,
  List,
  Clock,
  Star,
  TrendingUp,
  Heart,
  Share2,
  Bookmark,
  Play,
  Pause,
  User,
  X,
  Minimize2,
  Volume2,
  SkipBack,
  SkipForward,
  Maximize2,
} from "lucide-react";
const BACKEND_URL=process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

// Types
interface Podcast {
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
  is_liked?: boolean;
}

interface UserProfile {
  id: number;
  username: string;
  email: string;
  saved_podcasts: number[];
  liked_podcasts: number[];
}

interface FilterOptions {
  category: string;
  duration: string;
  sortBy: string;
}

// 🎧 Podcast Card Component
const PodcastCard = ({
  podcast,
  onLike,
  onSave,
  onPlay,
  onPause,
  onShare,
  isPlaying = false,
  isSaved = false,
  isLiked = false
}: {
  podcast: Podcast;
  onLike: (id: number) => void;
  onSave: (id: number) => void;
  onPlay: (podcast: Podcast) => void;
  onPause: () => void;
  onShare: (podcast: Podcast) => void;
  isPlaying?: boolean;
  isSaved?: boolean;
  isLiked?: boolean;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLike(podcast.id);
  };

  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSave(podcast.id);
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShare(podcast);
  };

  return (
    <div
      className="bg-gray-800 rounded-xl p-4 shadow-md hover:bg-gray-700 transition cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onPlay(podcast)}
    >
      {/* Thumbnail with play button overlay */}
      <div className="relative w-full h-40 mb-4 group">
        <img
          src={podcast.thumbnail_url || "https://via.placeholder.com/300"}
          alt={podcast.title}
          className="w-full h-full object-cover rounded-lg"
        />

        {/* Play/Pause overlay */}
        {(isHovered || isPlaying) && (
          <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center rounded-lg">
            <button className="bg-green-500 hover:bg-green-400 rounded-full p-3 transition-transform transform hover:scale-105">
              {isPlaying ? (
                <Pause className="h-6 w-6 text-white" />
              ) : (
                <Play className="h-6 w-6 text-white" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Title & Author */}
      <h3 className="font-semibold text-white truncate">{podcast.title}</h3>
      <p className="text-sm text-gray-400 mb-3">by {podcast.author_name}</p>

      {/* Category and duration */}
      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
        <span className="bg-gray-700 px-2 py-1 rounded">{podcast.category}</span>
        {podcast.duration && (
          <span>
            {Math.floor(podcast.duration / 60)}:
            {(podcast.duration % 60).toString().padStart(2, "0")}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between text-gray-400">
        <button
          className={`flex items-center gap-1 transition ${isLiked ? "text-red-500" : "hover:text-red-500"
            }`}
          onClick={handleLikeClick}
        >
          <Heart
            className="h-5 w-5"
            fill={isLiked ? "currentColor" : "none"}
          />
          <span className="text-xs">{podcast.likescount || 0}</span>
        </button>

        <button
          className={`transition ${isSaved ? "text-yellow-400" : "hover:text-yellow-400"
            }`}
          onClick={handleSaveClick}
        >
          <Bookmark className="h-5 w-5" fill={isSaved ? "currentColor" : "none"} />
        </button>

        <button
          className="hover:text-blue-400 transition"
          onClick={handleShareClick}
        >
          <Share2 className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

// Filter Component
const FilterPanel = ({
  filters,
  onFilterChange,
  categories,
}: {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  categories: string[];
}) => {
  return (
    <div className="bg-gray-800 p-4 rounded-lg mb-6">
      <h3 className="text-white font-medium mb-3">Filters</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Category Filter */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">Category</label>
          <select
            value={filters.category}
            onChange={(e) => onFilterChange({ ...filters, category: e.target.value })}
            className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Duration Filter */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">Duration</label>
          <select
            value={filters.duration}
            onChange={(e) => onFilterChange({ ...filters, duration: e.target.value })}
            className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">Any Duration</option>
            <option value="short">Short (0-10 min)</option>
            <option value="medium">Medium (10-30 min)</option>
            <option value="long">Long (30+ min)</option>
          </select>
        </div>

        {/* Sort Filter */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">Sort By</label>
          <select
            value={filters.sortBy}
            onChange={(e) => onFilterChange({ ...filters, sortBy: e.target.value })}
            className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="popular">Most Popular</option>
            <option value="duration">Duration</option>
          </select>
        </div>
      </div>
    </div>
  );
};

// Share Modal Component
const ShareModal = ({
  podcast,
  isOpen,
  onClose,
}: {
  podcast: Podcast | null;
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [shareData, setShareData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    const fetchShareData = async () => {
      if (podcast && isOpen) {
        setLoading(true);
        try {
          const res = await fetch(`${BACKEND_URL}/api/podcasts/${podcast.id}/share`);
          const data = await res.json();
          setShareData(data);
        } catch (err) {
          console.error("Error fetching share data:", err);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchShareData();
  }, [podcast, isOpen]);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSocialShare = (platform: string, url: string) => {
    window.open(url, '_blank', 'width=600,height=400');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Share Podcast</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-6 w-6" />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
            <p className="text-gray-400 mt-2">Loading share options...</p>
          </div>
        ) : shareData ? (
          <div className="space-y-4">
            {/* Social Media Share Buttons */}
            <div>
              <h4 className="text-white font-medium mb-2">Share on social media</h4>
              <div className="flex justify-center space-x-2">
                <button
                  onClick={() => handleSocialShare('twitter', shareData.shareLinks.twitter)}
                  className="bg-blue-400 hover:bg-blue-500 text-white p-2 rounded-full"
                  title="Share on Twitter"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10 10 0 01-3.127 1.195 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleSocialShare('facebook', shareData.shareLinks.facebook)}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full"
                  title="Share on Facebook"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleSocialShare('linkedin', shareData.shareLinks.linkedin)}
                  className="bg-blue-800 hover:bg-blue-900 text-white p-2 rounded-full"
                  title="Share on LinkedIn"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleSocialShare('whatsapp', shareData.shareLinks.whatsapp)}
                  className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-full"
                  title="Share on WhatsApp"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.864 3.488" />
                  </svg>
                </button>
                <button
                  onClick={() => handleSocialShare('reddit', shareData.shareLinks.reddit)}
                  className="bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-full"
                  title="Share on Reddit"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .140-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Direct Audio URL */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Audio URL</label>
              <div className="flex">
                <input
                  type="text"
                  value={shareData.audioUrl}
                  readOnly
                  className="flex-1 bg-gray-700 border border-gray-600 text-white rounded-l-lg px-3 py-2 focus:outline-none text-sm"
                />
                <button
                  onClick={() => copyToClipboard(shareData.audioUrl, 'audio')}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 rounded-r-lg flex items-center"
                >
                  {copiedField === 'audio' ? '✓' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Shareable Link */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Shareable Link</label>
              <div className="flex">
                <input
                  type="text"
                  value={shareData.podcast.shareableUrl}
                  readOnly
                  className="flex-1 bg-gray-700 border border-gray-600 text-white rounded-l-lg px-3 py-2 focus:outline-none text-sm"
                />
                <button
                  onClick={() => copyToClipboard(shareData.podcast.shareableUrl, 'link')}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 rounded-r-lg flex items-center"
                >
                  {copiedField === 'link' ? '✓' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Embed Code */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Embed Code</label>
              <div className="flex">
                <input
                  type="text"
                  value={shareData.embedCode}
                  readOnly
                  className="flex-1 bg-gray-700 border border-gray-600 text-white rounded-l-lg px-3 py-2 focus:outline-none text-sm"
                />
                <button
                  onClick={() => copyToClipboard(shareData.embedCode, 'embed')}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 rounded-r-lg flex items-center"
                >
                  {copiedField === 'embed' ? '✓' : 'Copy'}
                </button>
              </div>
            </div>

            {/* QR Code */}
            <div className="text-center">
              <label className="block text-sm text-gray-400 mb-2">QR Code</label>
              <img
                src={shareData.qrCode}
                alt="QR Code"
                className="mx-auto border border-gray-600 rounded-lg"
              />
              <p className="text-gray-400 text-xs mt-2">Scan to listen</p>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => window.open(shareData.podcast.shareableUrl, '_blank')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                Open Link
              </button>
              <button
                onClick={onClose}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-400">Error loading share data</p>
          </div>
        )}
      </div>
    </div>
  );
};

// 🎧 Full Screen Player Component
const FullScreenPlayer = ({
  podcast,
  isPlaying,
  currentTime,
  duration,
  onPlay,
  onPause,
  onSeek,
  onClose,
  onMinimize,
}: {
  podcast: Podcast;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
  onClose: () => void;
  onMinimize: () => void;
}) => {
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [volume, setVolume] = useState(1);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const seekTime = (clickX / width) * duration;
    
    onSeek(seekTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    // You would typically set the audio volume here
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black bg-opacity-70">
        <button 
          onClick={onMinimize}
          className="text-white hover:bg-white hover:bg-opacity-10 p-2 rounded-full"
        >
          <Minimize2 className="h-6 w-6" />
        </button>
        <h2 className="text-white text-lg font-semibold truncate mx-4">
          {podcast.title}
        </h2>
        <button 
          onClick={onClose}
          className="text-white hover:bg-white hover:bg-opacity-10 p-2 rounded-full"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex flex-col md:flex-row flex-1 p-4 gap-6 overflow-auto">
        {/* Video/Thumbnail Area */}
        <div className="flex-1 flex items-center justify-center">
          <div className="relative w-full max-w-4xl aspect-video bg-gray-900 rounded-lg overflow-hidden">
            <img
              src={podcast.thumbnail_url || "https://via.placeholder.com/800"}
              alt={podcast.title}
              className="w-full h-full object-cover"
            />
            
            {/* Play/Pause overlay button */}
            <div className="absolute inset-0 flex items-center justify-center">
              <button 
                onClick={isPlaying ? onPause : onPlay}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-4 transition-all"
              >
                {isPlaying ? (
                  <Pause className="h-12 w-12 text-white" />
                ) : (
                  <Play className="h-12 w-12 text-white" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Info Panel */}
        <div className="w-full md:w-96 bg-gray-900 bg-opacity-70 rounded-lg p-4 overflow-y-auto">
          <h1 className="text-2xl font-bold text-white mb-2">{podcast.title}</h1>
          <p className="text-gray-300 mb-4">by {podcast.author_name}</p>
          
          <div className="mb-4">
            <span className="bg-purple-600 text-white text-sm px-2 py-1 rounded">
              {podcast.category}
            </span>
          </div>
          
          <div className="mb-6">
            <h3 className="text-white font-medium mb-2">Description</h3>
            <p className={`text-gray-300 ${isDescriptionExpanded ? '' : 'line-clamp-3'}`}>
              {podcast.description}
            </p>
            {podcast.description && podcast.description.length > 150 && (
              <button 
                onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                className="text-purple-400 text-sm mt-1"
              >
                {isDescriptionExpanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
          
          <div className="flex items-center text-sm text-gray-400 mb-2">
            <Clock className="h-4 w-4 mr-1" />
            <span>Uploaded on {new Date(podcast.created_at).toLocaleDateString()}</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-400">
            <Heart className="h-4 w-4 mr-1" />
            <span>{podcast.likescount || 0} likes</span>
          </div>
        </div>
      </div>

      {/* Controls Footer */}
      <div className="bg-black bg-opacity-70 p-4">
        {/* Progress Bar */}
        <div 
          ref={progressBarRef}
          className="w-full h-2 bg-gray-700 rounded-full mb-2 cursor-pointer"
          onClick={handleProgressClick}
        >
          <div 
            className="h-full bg-purple-600 rounded-full"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          ></div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-white text-sm">{formatTime(currentTime)}</span>
          
          <div className="flex items-center space-x-4">
            <button className="text-white hover:text-purple-400">
              <SkipBack className="h-5 w-5" />
            </button>
            
            <button 
              onClick={isPlaying ? onPause : onPlay}
              className="bg-purple-600 hover:bg-purple-700 rounded-full p-2"
            >
              {isPlaying ? (
                <Pause className="h-6 w-6 text-white" />
              ) : (
                <Play className="h-6 w-6 text-white" />
              )}
            </button>
            
            <button className="text-white hover:text-purple-400">
              <SkipForward className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-white text-sm">{formatTime(duration)}</span>
            
            <div className="flex items-center">
              <Volume2 className="h-4 w-4 text-white mr-2" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="w-20"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function DiscoverPage() {
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [savedPodcasts, setSavedPodcasts] = useState<Podcast[]>([]);
  const [likedPodcasts, setLikedPodcasts] = useState<Podcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"discover" | "saved">("discover");
  const [currentPlaying, setCurrentPlaying] = useState<Podcast | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    category: "all",
    duration: "all",
    sortBy: "newest",
  });
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedPodcast, setSelectedPodcast] = useState<Podcast | null>(null);
  const { user, isLoaded } = useUser();
  const categories = Array.from(new Set(podcasts.map(p => p.category)));
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const fetchPodcasts = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/podcasts`);
        const data = await res.json();
        setPodcasts(data);
      } catch (err) {
        console.error("Error fetching podcasts:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPodcasts();
  }, []);
  useEffect(() => {
    if (isLoaded && user) {
      fetchLikedPodcasts();
      fetchSavedPodcasts();
    }
  }, [isLoaded, user]);
  const fetchSavedPodcasts = async () => {
    if (!user) return;

    try {
      const res = await fetch(
        `${BACKEND_URL}/api/profile/saved-podcasts`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: user.id,
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        setSavedPodcasts(data.savedPodcasts || []);
      }
    } catch (err) {
      console.error("Error fetching saved podcasts:", err);
    }
  };
  const fetchLikedPodcasts = async () => {
    if (!user) return;

    try {
      const res = await fetch(
        `${BACKEND_URL}/api/profile/liked-podcasts`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: user.id,
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        setLikedPodcasts(data.likedPodcasts || []);
      }
    } catch (err) {
      console.error("Error fetching liked podcasts:", err);
    }
  };
  const filterPodcasts = (podcasts: Podcast[]) => {
    return podcasts
      .filter((podcast) => {
        const matchesSearch =
          searchQuery === "" ||
          podcast.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          podcast.author_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          podcast.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          podcast.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory =
          filters.category === "all" || podcast.category === filters.category;
        let matchesDuration = true;
        if (filters.duration !== "all" && podcast.duration) {
          if (filters.duration === "short") {
            matchesDuration = podcast.duration < 600; // Less than 10 minutes
          } else if (filters.duration === "medium") {
            matchesDuration = podcast.duration >= 600 && podcast.duration < 1800; // 10-30 minutes
          } else if (filters.duration === "long") {
            matchesDuration = podcast.duration >= 1800; // 30+ minutes
          }
        }

        return matchesSearch && matchesCategory && matchesDuration;
      })
      .sort((a, b) => {
        // Sort filter
        switch (filters.sortBy) {
          case "newest":
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          case "oldest":
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          case "popular":
            return (b.likescount || 0) - (a.likescount || 0);
          case "duration":
            return (a.duration || 0) - (b.duration || 0);
          default:
            return 0;
        }
      });
  };
  const getFilteredPodcasts = () => {
    const sourcePodcasts = activeTab === "discover" ? podcasts : savedPodcasts;
    return filterPodcasts(sourcePodcasts);
  };

  const handleLike = async (id: number) => {
    if (!user) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/podcasts/${id}/like`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.id,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const updatedPodcast = data.podcast;

        // Update podcasts list
        setPodcasts(prev =>
          prev.map(p => p.id === id ? { ...p, ...updatedPodcast } : p)
        );
        setSavedPodcasts(prev =>
          prev.map(p => p.id === id ? { ...p, ...updatedPodcast } : p)
        );
        fetchLikedPodcasts();
      } else {
        console.error("Failed to like podcast");
      }
    } catch (err) {
      console.error("Error liking podcast:", err);
    }
  };
  const handleSave = async (id: number) => {
    if (!user) return;

    setSaving(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/podcasts/${id}/save`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.id,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        setPodcasts(prev =>
          prev.map(p =>
            p.id === id ? { ...p, is_saved: result.is_saved } : p
          )
        );
        fetchSavedPodcasts();
      } else if (res.status === 404) {
  
        await createProfileAndSavePodcast(id);
      }
    } catch (err) {
      console.error("Error saving podcast:", err);
    } finally {
      setSaving(false);
    }
  };
  const createProfileAndSavePodcast = async (podcastId: number) => {
    try {
      const profileRes = await fetch(`${BACKEND_URL}/profile`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bio: "",
          avatar_url: "",
        }),
      });

      if (profileRes.ok) {
        // Now save the podcast
        const saveRes = await fetch(
          `${BACKEND_URL}/api/podcasts/${podcastId}/save`,
          {
            method: "POST",
            credentials: "include",
          }
        );

        if (saveRes.ok) {
          const result = await saveRes.json();
          setPodcasts(prev =>
            prev.map(p =>
              p.id === podcastId ? { ...p, is_saved: result.is_saved } : p
            )
          );
          fetchSavedPodcasts();
        }
      }
    } catch (err) {
      console.error("Error creating profile and saving podcast:", err);
    }
  };
  const handlePlay = (podcast: Podcast) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }

    const newAudio = new Audio(podcast.audio_url);
    newAudio.play();
    
    // Set up event listeners for time updates
    newAudio.addEventListener('timeupdate', () => {
      setCurrentTime(newAudio.currentTime);
    });
    
    newAudio.addEventListener('loadedmetadata', () => {
      setDuration(newAudio.duration);
    });
    
    newAudio.addEventListener('ended', () => {
      setIsPlaying(false);
      setCurrentPlaying(null);
      setIsFullScreen(false);
    });

    audioRef.current = newAudio;
    setCurrentPlaying(podcast);
    setIsPlaying(true);
    setIsFullScreen(true); // Open full screen player
  };
  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };
  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };
  const handleMinimize = () => {
    setIsFullScreen(false);
    // Keep audio playing in background
  };
  const handleClosePlayer = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
    setCurrentPlaying(null);
    setIsFullScreen(false);
    setCurrentTime(0);
  };
  const handleShare = (podcast: Podcast) => {
    setSelectedPodcast(podcast);
    setShareModalOpen(true);
  };
  const isPodcastLiked = (podcastId: number) => {
    return likedPodcasts.some(podcast => podcast.id === podcastId);
  };

  // Check if a podcast is saved
  const isPodcastSaved = (podcastId: number) => {
    return savedPodcasts.some(podcast => podcast.id === podcastId);
  };

  const filteredPodcasts = getFilteredPodcasts();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Discover Podcasts
              </h1>
              <p className="text-gray-400">
                Find your next favorite podcast from thousands of creators
              </p>
            </div>
            <div className="flex-1 max-w-2xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search podcasts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 text-white rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mt-6 gap-4">
            <div className="flex border-b border-gray-700">
              <button
                className={`px-4 py-2 font-medium flex items-center gap-2 ${activeTab === "discover"
                  ? "text-white border-b-2 border-purple-500"
                  : "text-gray-400 hover:text-white"
                  }`}
                onClick={() => setActiveTab("discover")}
              >
                <TrendingUp className="h-5 w-5" />
                Discover
              </button>
              <button
                className={`px-4 py-2 font-medium flex items-center gap-2 ${activeTab === "saved"
                  ? "text-white border-b-2 border-purple-500"
                  : "text-gray-400 hover:text-white"
                  }`}
                onClick={() => setActiveTab("saved")}
              >
                <Bookmark className="h-5 w-5" />
                Saved Podcasts
              </button>
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${showFilters
                ? "bg-purple-600 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
            >
              <Filter className="h-5 w-5" />
              Filters
            </button>
          </div>
        </div>
      </div>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters Panel */}
        {showFilters && (
          <FilterPanel
            filters={filters}
            onFilterChange={setFilters}
            categories={categories}
          />
        )}

        {activeTab === "discover" ? (
          /* All Podcasts */
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <TrendingUp className="h-6 w-6 text-purple-400 mr-3" />
                <h2 className="text-2xl font-bold text-white">
                  All Podcasts ({filteredPodcasts.length})
                </h2>
              </div>
              <p className="text-gray-400 text-sm">
                Showing {filteredPodcasts.length} of {podcasts.length} podcasts
              </p>
            </div>
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-gray-800 rounded-xl p-4 animate-pulse"
                  >
                    <div className="w-full h-40 bg-gray-700 rounded-lg mb-4"></div>
                    <div className="h-4 bg-gray-700 rounded mb-2"></div>
                    <div className="h-3 bg-gray-700 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : filteredPodcasts.length === 0 ? (
              <div className="text-center py-12">
                <Search className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-400 mb-2">
                  No podcasts found
                </h3>
                <p className="text-gray-500">
                  Try adjusting your search or filters
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setFilters({
                      category: "all",
                      duration: "all",
                      sortBy: "newest",
                    });
                  }}
                  className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                {filteredPodcasts.map((p) => (
                  <PodcastCard
                    key={p.id}
                    podcast={p}
                    onLike={handleLike}
                    onSave={handleSave}
                    onPlay={handlePlay}
                    onPause={handlePause}
                    onShare={handleShare}
                    isPlaying={currentPlaying?.id === p.id && isPlaying}
                    isSaved={isPodcastSaved(p.id)}
                    isLiked={isPodcastLiked(p.id)}
                  />
                ))}
              </div>
            )}
          </section>
        ) : (
          /* Saved Podcasts */
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Bookmark className="h-6 w-6 text-yellow-400 mr-3" />
                <h2 className="text-2xl font-bold text-white">
                  Saved Podcasts ({filteredPodcasts.length})
                </h2>
              </div>
              <p className="text-gray-400 text-sm">
                Showing {filteredPodcasts.length} of {savedPodcasts.length} saved podcasts
              </p>
            </div>
            {filteredPodcasts.length === 0 ? (
              <div className="text-center py-12">
                <Bookmark className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-400 mb-2">
                  {savedPodcasts.length === 0 ? "No saved podcasts yet" : "No matching saved podcasts"}
                </h3>
                <p className="text-gray-500">
                  {savedPodcasts.length === 0
                    ? "Start exploring and save podcasts you love"
                    : "Try adjusting your search or filters"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                {filteredPodcasts.map((p) => (
                  <PodcastCard
                    key={p.id}
                    podcast={p}
                    onLike={handleLike}
                    onSave={handleSave}
                    onPlay={handlePlay}
                    onPause={handlePause}
                    onShare={handleShare}
                    isPlaying={currentPlaying?.id === p.id && isPlaying}
                    isSaved={true}
                    isLiked={isPodcastLiked(p.id)}
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </main>
      
      {/* Full Screen Player */}
      {isFullScreen && currentPlaying && (
        <FullScreenPlayer
          podcast={currentPlaying}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          onPlay={() => audioRef.current?.play()}
          onPause={handlePause}
          onSeek={handleSeek}
          onClose={handleClosePlayer}
          onMinimize={handleMinimize}
        />
      )}
      
      {/* Mini Player (at the bottom) */}
      {currentPlaying && !isFullScreen && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src={
                  currentPlaying.thumbnail_url ||
                  "https://via.placeholder.com/60"
                }
                alt={currentPlaying.title}
                className="w-12 h-12 rounded"
              />
              <div>
                <h4 className="text-white font-medium">
                  {currentPlaying.title}
                </h4>
                <p className="text-gray-400 text-sm">
                  {currentPlaying.author_name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={
                  isPlaying
                    ? handlePause
                    : () => handlePlay(currentPlaying)
                }
                className="bg-green-500 hover:bg-green-400 rounded-full p-2"
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5 text-white" />
                ) : (
                  <Play className="h-5 w-5 text-white" />
                )}
              </button>

              <div className="w-64 bg-gray-700 rounded-full h-1">
                <div
                  className="bg-green-500 h-1 rounded-full"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}
      <ShareModal
        podcast={selectedPodcast}
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
      />
    </div>
  );
}