import React from 'react';
import { TrendingUp, Star, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface HeroSectionProps {
  onSearch?: (query: string) => void;
}

const HeroSection = ({onSearch}:HeroSectionProps) => {
  const router = useRouter();
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-600/20 via-transparent to-transparent"></div>
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 bg-purple-600/20 backdrop-blur-sm border border-purple-500/30 rounded-full text-purple-300 text-sm font-medium mb-8">
            <Zap className="h-4 w-4 mr-2" />
            AI-Powered Podcast Platform
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6">
            Discover Amazing
            <span className="block bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Podcasts
            </span>
          </h1>

          {/* Description */}
          <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Create, discover, and listen to AI-generated podcasts. Transform your ideas into 
            engaging audio content with our cutting-edge technology.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <button className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"onClick={()=>{router.push("/create")}}>
              Start Creating
            </button>
            <button className="px-8 py-4 bg-transparent border-2 border-purple-500 text-purple-300 hover:bg-purple-600 hover:text-white font-semibold rounded-xl transition-all duration-300">
              Explore Podcasts
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="flex flex-col items-center p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-gray-700">
              <TrendingUp className="h-8 w-8 text-purple-400 mb-3" />
              <div className="text-2xl font-bold text-white">10K+</div>
              <div className="text-gray-400">Active Creators</div>
            </div>
            <div className="flex flex-col items-center p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-gray-700">
              <Star className="h-8 w-8 text-blue-400 mb-3" />
              <div className="text-2xl font-bold text-white">50K+</div>
              <div className="text-gray-400">Podcasts Created</div>
            </div>
            <div className="flex flex-col items-center p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-gray-700">
              <Zap className="h-8 w-8 text-green-400 mb-3" />
              <div className="text-2xl font-bold text-white">1M+</div>
              <div className="text-gray-400">Hours Listened</div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-purple-600/20 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-blue-600/20 rounded-full blur-xl animate-pulse delay-1000"></div>
    </section>
  );
};

export default HeroSection;