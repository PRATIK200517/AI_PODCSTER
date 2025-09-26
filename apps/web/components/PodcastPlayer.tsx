import React from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  Maximize2,
  MinusCircle
} from 'lucide-react';
import { useAudio } from '../hooks/useAudio';

interface PodcastPlayerProps {
  isVisible: boolean;
  onMinimize: () => void;
}

const PodcastPlayer: React.FC<PodcastPlayerProps> = ({ isVisible, onMinimize }) => {
  const {
    audioRef,
    currentPodcast,
    audioState,
    togglePlay,
    seekTo,
    setVolume,
    toggleMute,
    skipForward,
    skipBackward,
  } = useAudio();

  if (!isVisible || !currentPodcast) return null;

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    seekTo(time);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const volume = parseFloat(e.target.value);
    setVolume(volume);
  };

  return (
    <>
      <audio ref={audioRef} />
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-md border-t border-gray-700 z-40 transform transition-transform duration-300">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Current Podcast Info */}
            <div className="flex items-center space-x-4 flex-1 min-w-0">
              <img
                src={currentPodcast.imageUrl}
                alt={currentPodcast.title}
                className="h-12 w-12 rounded-lg object-cover"
              />
              <div className="min-w-0 flex-1">
                <h4 className="text-white font-medium truncate">{currentPodcast.title}</h4>
                <p className="text-gray-400 text-sm truncate">{currentPodcast.creator}</p>
              </div>
            </div>

            {/* Player Controls */}
            <div className="flex flex-col items-center space-y-2 flex-1">
              <div className="flex items-center space-x-4">
                <button
                  onClick={skipBackward}
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  <SkipBack className="h-5 w-5" />
                </button>
                
                <button
                  onClick={togglePlay}
                  className="bg-purple-600 hover:bg-purple-700 text-white rounded-full p-2 transition-colors duration-200"
                >
                  {audioState.isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5 ml-0.5" />
                  )}
                </button>
                
                <button
                  onClick={skipForward}
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  <SkipForward className="h-5 w-5" />
                </button>
              </div>

              {/* Progress Bar */}
              <div className="flex items-center space-x-2 w-full max-w-md">
                <span className="text-xs text-gray-400 min-w-[35px]">
                  {formatTime(audioState.currentTime)}
                </span>
                <input
                  type="range"
                  min="0"
                  max={audioState.duration || 0}
                  value={audioState.currentTime}
                  onChange={handleSeek}
                  className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
                <span className="text-xs text-gray-400 min-w-[35px]">
                  {formatTime(audioState.duration)}
                </span>
              </div>
            </div>

            {/* Volume Controls and Actions */}
            <div className="flex items-center space-x-4 flex-1 justify-end">
              <div className="hidden md:flex items-center space-x-2">
                <button
                  onClick={toggleMute}
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  {audioState.isMuted ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={audioState.isMuted ? 0 : audioState.volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>
              
              <button className="text-gray-400 hover:text-white transition-colors duration-200">
                <Maximize2 className="h-5 w-5" />
              </button>
              
              <button
                onClick={onMinimize}
                className="text-gray-400 hover:text-white transition-colors duration-200"
              >
                <MinusCircle className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PodcastPlayer;