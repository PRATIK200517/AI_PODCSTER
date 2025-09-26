import { Podcast } from '../types';

export const trendingPodcasts: Podcast[] = [
  {
    id: '1',
    title: 'The Future of AI Technology',
    description: 'Exploring the latest developments in artificial intelligence and machine learning.',
    creator: 'Tech Insights',
    imageUrl: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=300',
    audioUrl: 'https://www.soundjay.com/misc/sounds/click-01.wav',
    duration: '45:32',
    listeners: 12400,
    category: 'Technology',
    createdAt: '2024-01-15',
    transcript: 'In today\'s episode, we dive deep into the fascinating world of artificial intelligence...'
  },
  {
    id: '2',
    title: 'Mindful Living in Modern Times',
    description: 'Practical tips for maintaining mental wellness in our fast-paced world.',
    creator: 'Wellness Journey',
    imageUrl: 'https://images.pexels.com/photos/3760069/pexels-photo-3760069.jpeg?auto=compress&cs=tinysrgb&w=300',
    audioUrl: 'https://www.soundjay.com/misc/sounds/click-01.wav',
    duration: '32:18',
    listeners: 8600,
    category: 'Health & Wellness',
    createdAt: '2024-01-14',
    transcript: 'Welcome to another episode where we explore mindfulness practices...'
  },
  {
    id: '3',
    title: 'Startup Success Stories',
    description: 'Interviews with successful entrepreneurs sharing their journey.',
    creator: 'Business Minds',
    imageUrl: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=300',
    audioUrl: 'https://www.soundjay.com/misc/sounds/click-01.wav',
    duration: '56:45',
    listeners: 15200,
    category: 'Business',
    createdAt: '2024-01-13',
    transcript: 'Today we have an incredible entrepreneur who built a million-dollar company...'
  },
  {
    id: '4',
    title: 'Creative Writing Workshop',
    description: 'Learn the art of storytelling from published authors.',
    creator: 'Literary Circle',
    imageUrl: 'https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg?auto=compress&cs=tinysrgb&w=300',
    audioUrl: 'https://www.soundjay.com/misc/sounds/click-01.wav',
    duration: '41:22',
    listeners: 6800,
    category: 'Education',
    createdAt: '2024-01-12',
    transcript: 'Writing is a craft that requires both inspiration and technique...'
  },
  {
    id: '5',
    title: 'Climate Change Solutions',
    description: 'Innovative approaches to environmental challenges.',
    creator: 'Green Future',
    imageUrl: 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=300',
    audioUrl: 'https://www.soundjay.com/misc/sounds/click-01.wav',
    duration: '38:56',
    listeners: 9200,
    category: 'Environment',
    createdAt: '2024-01-11',
    transcript: 'Climate change presents one of our greatest challenges...'
  },
  {
    id: '6',
    title: 'Hollywood Insider',
    description: 'Behind-the-scenes stories from the entertainment industry.',
    creator: 'Entertainment Weekly',
    imageUrl: 'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=300',
    audioUrl: 'https://www.soundjay.com/misc/sounds/click-01.wav',
    duration: '52:10',
    listeners: 11200,
    category: 'Entertainment',
    createdAt: '2024-01-10',
    transcript: 'Today we talk with a famous director about their latest blockbuster...'
  },
  {
    id: '7',
    title: 'Quantum Physics Explained',
    description: 'Making complex scientific concepts accessible to everyone.',
    creator: 'Science Today',
    imageUrl: 'https://images.pexels.com/photos/414860/pexels-photo-414860.jpeg?auto=compress&cs=tinysrgb&w=300',
    audioUrl: 'https://www.soundjay.com/misc/sounds/click-01.wav',
    duration: '49:25',
    listeners: 7800,
    category: 'Science',
    createdAt: '2024-01-09',
    transcript: 'Quantum mechanics might seem mysterious, but let us break it down...'
  }
];

export const categories = [
  'All',
  'Technology',
  'Health & Wellness',
  'Business',
  'Education',
  'Environment',
  'Entertainment',
  'Science',
];