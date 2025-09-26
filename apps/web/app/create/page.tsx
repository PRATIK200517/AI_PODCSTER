"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Upload, Mic, Image, Sparkles, Type, Wand2, X, Play, Pause } from 'lucide-react';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { useUser } from "@clerk/nextjs";
interface Voice {
  voice_id: string;
  name: string;
  category: string;
  preview_url?: string;
}

const CreatePodcast = () => {
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    aiPrompt: '',
    thumbnailPrompt: '',
    aiGenerated: ''
  });

  const [thumbnailOption, setThumbnailOption] = useState<'ai' | 'upload'>('ai');
  const [descriptionOption, setDescriptionOption] = useState<'manual' | 'ai'>('manual');
  const [contentOption, setContentOption] = useState<'manual' | 'ai'>('manual');
  const [generatedThumbnail, setGeneratedThumbnail] = useState<string | null>(null);
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
  const [thumbnailError, setThumbnailError] = useState<string | null>(null);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [voices, setVoices] = useState<any[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [previewAudioUrl, setPreviewAudioUrl] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [generatedAudioBlob, setGeneratedAudioBlob] = useState<Blob | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const contentControllerRef = useRef<AbortController | null>(null);

  const categories = [
    'Technology',
    'Business',
    'Education',
    'Entertainment',
    'News',
    'Sports',
    'Health',
    'Arts',
    'Science',
    'Comedy'
  ];


  const { user } = useUser();

  // Fetch available voices
  useEffect(() => {
    const fetchVoices = async () => {
      try {
        const elevenlabs = new ElevenLabsClient({
          apiKey: 'sk_4d0029d145b08b7bb7f35e54c1eb4ed98ccfb46f15df0b92',
        });

        const result = await elevenlabs.voices.getAll();
        console.log(result);


        setVoices(result.voices || []);
      } catch (err) {
        console.error("Error fetching voices:", err);
      } finally {
        setIsLoadingVoices(false);
      }
    };

    fetchVoices();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    let { name, value } = e.target;
    if (name === "aiContentPrompt") name = "aiPrompt"; // alias it
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const generateThumbnail = async () => {
    if (!formData.thumbnailPrompt.trim()) {
      setThumbnailError('Please enter a prompt for the thumbnail');
      return;
    }

    setIsGeneratingThumbnail(true);
    setThumbnailError(null);

    try {
      const response = await fetch('http://localhost:5000/generate-thumbnail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: formData.thumbnailPrompt
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate thumbnail');
      }

      // Convert the image stream to a blob URL
      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);
      setGeneratedThumbnail(imageUrl);
    } catch (error) {
      console.error('Thumbnail generation error:', error);
      setThumbnailError(error instanceof Error ? error.message : 'Failed to generate thumbnail');
    } finally {
      setIsGeneratingThumbnail(false);
    }
  };

  const generateContent = async () => {
    if (!formData.aiPrompt.trim()) return;

    contentControllerRef.current?.abort();
    const controller = new AbortController();
    contentControllerRef.current = controller;

    setIsGeneratingContent(true);
    setFormData(f => ({ ...f, aiGenerated: "" }));

    try {
      const res = await fetch("http://localhost:5000/generate-content-stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: formData.aiPrompt }),
        credentials: "include"
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const processSSEChunk = (chunk: string) => {
        buffer += chunk;
        let parts = buffer.split("\n\n");
        buffer = parts.pop() || "";

        for (const part of parts) {
          const lines = part.split("\n").filter(Boolean);
          let eventType = "message";
          let dataStr = "";

          for (const line of lines) {
            if (line.startsWith("event:")) {
              eventType = line.replace(/^event:\s*/, "").trim();
            } else if (line.startsWith("data:")) {
              dataStr += line.replace(/^data:\s*/, "");
            }
          }

          try {
            const payload = JSON.parse(dataStr);
            if (eventType === "message" || eventType === "") {
              if (payload.delta) {
                setFormData(f => ({ ...f, aiGenerated: f.aiGenerated + payload.delta }));
              }
            } else if (eventType === "done") {
              if (payload.full) {
                setFormData(f => ({ ...f, aiGenerated: payload.full }));
              }
            } else if (eventType === "error") {
              console.error("Stream error:", payload);
            }
          } catch (e) {
            console.warn("Failed to parse SSE payload:", dataStr);
          }
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunkStr = decoder.decode(value, { stream: true });
        processSSEChunk(chunkStr);
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Generation failed:", err);
      }
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const generateDescription = async () => {
    if (!formData.description.trim()) return;

    setIsGeneratingContent(true);
    setFormData(f => ({ ...f, description: "" }));

    try {
      const res = await fetch("http://localhost:5000/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: formData.description })
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const processSSEChunk = (chunk: string) => {
        buffer += chunk;
        let parts = buffer.split("\n\n");
        buffer = parts.pop() || "";

        for (const part of parts) {
          const lines = part.split("\n").filter(Boolean);
          let eventType = "message";
          let dataStr = "";

          for (const line of lines) {
            if (line.startsWith("event:")) eventType = line.replace(/^event:\s*/, "").trim();
            else if (line.startsWith("data:")) dataStr += line.replace(/^data:\s*/, "");
          }

          try {
            const payload = JSON.parse(dataStr);
            if (eventType === "message" && payload.delta) {
              setFormData(f => ({ ...f, description: f.description + payload.delta }));
            }
          } catch (e) {
            console.warn("Failed to parse SSE payload:", dataStr);
          }
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunkStr = decoder.decode(value, { stream: true });
        processSSEChunk(chunkStr);
      }
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const generatePreview = async () => {
    const content = contentOption === 'manual' ? formData.aiPrompt : formData.aiGenerated;

    if (!content.trim()) {
      alert('Please provide podcast content first');
      return;
    }

    if (!selectedVoice) {
      alert('Please select a voice');
      return;
    }

    setIsGeneratingPreview(true);
    try {
      const response = await fetch('http://localhost:5000/generate-podcast-audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: content,
          voiceId: selectedVoice,
          speed: 1.0
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate preview');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setGeneratedAudioBlob(blob);
      setPreviewAudioUrl(url);
      setShowPreview(true);
    } catch (error) {
      console.error('Error generating preview:', error);
      alert('Error generating preview. Please try again.');
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setSubmitError('You must be logged in to create a podcast');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const formDataToSend = new FormData();

      // Append all text data
      formDataToSend.append('title', formData.title);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('content', contentOption === 'manual' ? formData.aiPrompt : formData.aiGenerated);
      formDataToSend.append('voiceId', selectedVoice);
      formDataToSend.append('authorId', user.id);
      formDataToSend.append('authorName', user.fullName || user.username || user.emailAddresses[0]?.emailAddress || 'Unknown');
      formDataToSend.append('thumbnailOption', thumbnailOption);
      formDataToSend.append('thumbnailPrompt', formData.thumbnailPrompt);

      // Handle thumbnail upload
      if (thumbnailOption === 'upload' && generatedThumbnail) {
        const fileInput = document.getElementById('thumbnail-upload') as HTMLInputElement;
        if (fileInput && fileInput.files && fileInput.files[0]) {
          formDataToSend.append('thumbnail', fileInput.files[0]);
        }
      } else if (thumbnailOption === 'ai' && generatedThumbnail) {
        // Convert data URL to blob with proper MIME type
        const response = await fetch(generatedThumbnail);
        const blob = await response.blob();

        // Create a file from the blob with proper MIME type
        const file = new File([blob], 'thumbnail.png', { type: 'image/png' });
        formDataToSend.append('thumbnail', file);
      }

      // Handle audio upload
      if (generatedAudioBlob) {
        // Create a proper File object with correct MIME type
        const audioFile = new File([generatedAudioBlob], 'audio.mp3', { type: 'audio/mpeg' });
        formDataToSend.append('audio', audioFile);
      }

      for (let [key, value] of formDataToSend.entries()) {
        console.log(key, value);
      }

      const response = await fetch('http://localhost:5000/api/podcasts', {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create podcast');
      }

      const result = await response.json();
      console.log('Podcast created successfully:', result);
      setSubmitSuccess(true);

      // Reset form
      setFormData({
        title: '',
        category: '',
        description: '',
        aiPrompt: '',
        thumbnailPrompt: '',
        aiGenerated: ''
      });
      setGeneratedThumbnail(null);
      setSelectedVoice('');
      setGeneratedAudioBlob(null);
      setPreviewAudioUrl('');

    } catch (error) {
      console.error('Error submitting podcast:', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to create podcast');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Create a Podcast</h1>
            <p className="text-gray-400">Share your voice with the world</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Podcast Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
                Podcast title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="The AI Podcast"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-2">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                required
              >
                <option value="" disabled className="text-gray-400">
                  Select category
                </option>
                {categories.map((category) => (
                  <option key={category} value={category} className="text-white">
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Manual Description */}
                <button
                  type="button"
                  onClick={() => setDescriptionOption('manual')}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${descriptionOption === 'manual'
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                    }`}
                >
                  <div className="flex flex-col items-center text-center">
                    <Type className={`h-6 w-6 mb-2 ${descriptionOption === 'manual' ? 'text-blue-400' : 'text-gray-400'
                      }`} />
                    <span className={`font-medium text-sm ${descriptionOption === 'manual' ? 'text-blue-300' : 'text-gray-300'
                      }`}>
                      Write manually
                    </span>
                  </div>
                </button>

                {/* AI Generate Description */}
                <button
                  type="button"
                  onClick={() => setDescriptionOption('ai')}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${descriptionOption === 'ai'
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                    }`}
                >
                  <div className="flex flex-col items-center text-center">
                    <Wand2 className={`h-6 w-6 mb-2 ${descriptionOption === 'ai' ? 'text-purple-400' : 'text-gray-400'
                      }`} />
                    <span className={`font-medium text-sm ${descriptionOption === 'ai' ? 'text-purple-300' : 'text-gray-300'
                      }`}>
                      Generate with AI
                    </span>
                  </div>
                </button>
              </div>

              {descriptionOption === 'manual' ? (
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Write a short description about the podcast"
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                  required
                />
              ) : (
                <div className="space-y-3">
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Write a short description about the podcast"
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={generateDescription}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200 text-sm font-medium"
                  >
                    {isGeneratingContent ? "Generating..." : "Generate Description"}
                  </button>
                </div>
              )}
            </div>

            {/* Voice Selection */}
            <div>
              <label htmlFor="voice" className="block text-sm font-medium text-gray-300 mb-2">
                Voice
              </label>
              {isLoadingVoices ? (
                <div className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-400">
                  Loading voices...
                </div>
              ) : (
                <select
                  id="voice"
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                >
                  {voices.map((voice, index) => (
                    <option key={voice.voice_id || index} value={voice.voiceId}>
                      {voice.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-4">
                Podcast Content
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

                <button
                  type="button"
                  onClick={() => setContentOption('manual')}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${contentOption === 'manual'
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                    }`}
                >
                  <div className="flex flex-col items-center text-center">
                    <Type className={`h-6 w-6 mb-2 ${contentOption === 'manual' ? 'text-green-400' : 'text-gray-400'
                      }`} />
                    <span className={`font-medium text-sm ${contentOption === 'manual' ? 'text-green-300' : 'text-gray-300'
                      }`}>
                      Provide text
                    </span>
                  </div>
                </button>


                <button
                  type="button"
                  onClick={() => setContentOption('ai')}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${contentOption === 'ai'
                    ? 'border-orange-500 bg-orange-500/10'
                    : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                    }`}
                >
                  <div className="flex flex-col items-center text-center">
                    <Wand2 className={`h-6 w-6 mb-2 ${contentOption === 'ai' ? 'text-orange-400' : 'text-gray-400'
                      }`} />
                    <span className={`font-medium text-sm ${contentOption === 'ai' ? 'text-orange-300' : 'text-gray-300'
                      }`}>
                      Generate with AI
                    </span>
                  </div>
                </button>
              </div>

              {contentOption === 'manual' ? (
                <textarea
                  id="aiPrompt"
                  name="aiPrompt"
                  value={formData.aiPrompt}
                  onChange={handleInputChange}
                  placeholder="Provide the text content for your podcast..."
                  rows={6}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 resize-none"
                  required
                />
              ) : (
                <div className="space-y-3">
                  <textarea
                    id="aiContentPrompt"
                    name="aiContentPrompt"
                    value={formData.aiPrompt}
                    onChange={handleInputChange}
                    placeholder="Describe the topic, style, and key points you want AI to generate content about..."
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={isGeneratingContent}
                      onClick={generateContent}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors duration-200 text-sm font-medium flex items-center"
                    >
                      {isGeneratingContent ? "Generating..." : "Generate Content"}
                    </button>
                    {isGeneratingContent && (
                      <button
                        type="button"
                        onClick={() => {
                          contentControllerRef.current?.abort();
                          setIsGeneratingContent(false);
                        }}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                  <textarea
                    name="aiGenerated"
                    onChange={handleInputChange}
                    value={formData.aiGenerated}
                    placeholder="AI generated content will stream here..."
                    rows={8}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none transition-all duration-200 resize-none"
                  />
                </div>
              )}
            </div>

            {/* Preview Button */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={generatePreview}
                disabled={isGeneratingPreview || !formData.aiGenerated}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors duration-200 font-medium flex items-center gap-2"
              >
                {isGeneratingPreview ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Generating Preview...
                  </>
                ) : (
                  <>
                    <Play size={16} />
                    Preview Podcast
                  </>
                )}
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-4">
                Podcast Thumbnail
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* AI Thumbnail Option */}
                <button
                  type="button"
                  onClick={() => setThumbnailOption('ai')}
                  className={`p-6 rounded-lg border-2 transition-all duration-200 ${thumbnailOption === 'ai'
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                    }`}
                >
                  <div className="flex flex-col items-center text-center">
                    <Sparkles
                      className={`h-8 w-8 mb-3 ${thumbnailOption === 'ai' ? 'text-purple-400' : 'text-gray-400'
                        }`}
                    />
                    <span
                      className={`font-medium ${thumbnailOption === 'ai' ? 'text-purple-300' : 'text-gray-300'
                        }`}
                    >
                      AI prompt to generate thumbnail
                    </span>
                  </div>
                </button>

                {/* Upload Custom Image Option */}
                <button
                  type="button"
                  onClick={() => setThumbnailOption('upload')}
                  className={`p-6 rounded-lg border-2 transition-all duration-200 ${thumbnailOption === 'upload'
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                    }`}
                >
                  <div className="flex flex-col items-center text-center">
                    <Upload
                      className={`h-8 w-8 mb-3 ${thumbnailOption === 'upload' ? 'text-blue-400' : 'text-gray-400'
                        }`}
                    />
                    <span
                      className={`font-medium ${thumbnailOption === 'upload' ? 'text-blue-300' : 'text-gray-300'
                        }`}
                    >
                      Upload custom image
                    </span>
                  </div>
                </button>
              </div>

              {/* Upload Area */}
              {thumbnailOption === 'upload' && (
                <div className="mt-4">
                  <input
                    type="file"
                    id="thumbnail-upload"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        // Check file size (max 10MB)
                        if (file.size > 10 * 1024 * 1024) {
                          setThumbnailError('File size must be less than 10MB');
                          return;
                        }

                        // Check file type
                        if (!file.type.startsWith('image/')) {
                          setThumbnailError('Please upload an image file');
                          return;
                        }

                        setThumbnailError(null);

                        // Create a URL for the uploaded image
                        const imageUrl = URL.createObjectURL(file);
                        setGeneratedThumbnail(imageUrl);
                      }
                    }}
                  />
                  <label
                    htmlFor="thumbnail-upload"
                    className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-gray-500 transition-colors duration-200 cursor-pointer block"
                  >
                    <Image className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400 mb-2">
                      <span className="font-medium text-blue-400 hover:text-blue-300">
                        Click to upload
                      </span>{' '}
                      or drag and drop
                    </p>
                    <p className="text-sm text-gray-500">
                      SVG, PNG, JPG or GIF (max. 10MB)
                    </p>
                  </label>

                  {/* Show uploaded image preview */}
                  {generatedThumbnail && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-300 mb-2">Uploaded Thumbnail:</p>
                      <div className="relative group">
                        <img
                          src={generatedThumbnail}
                          alt="Uploaded thumbnail"
                          className="rounded-lg w-full max-w-md border border-gray-600"
                        />
                        <button
                          onClick={() => {
                            setGeneratedThumbnail(null);
                            // Reset the file input
                            const fileInput = document.getElementById(
                              'thumbnail-upload'
                            ) as HTMLInputElement;
                            if (fileInput) fileInput.value = '';
                          }}
                          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 
                     8.586l4.293-4.293a1 1 0 111.414 
                     1.414L11.414 10l4.293 4.293a1 1 
                     0 01-1.414 1.414L10 11.414l-4.293 
                     4.293a1 1 0 01-1.414-1.414L8.586 
                     10 4.293 5.707a1 1 0 
                     010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Show error message if any */}
                  {thumbnailError && (
                    <p className="text-red-400 text-sm mt-2">{thumbnailError}</p>
                  )}
                </div>
              )}

              {/* AI Thumbnail Prompt */}
              {thumbnailOption === 'ai' && (
                <div className="mt-4 space-y-3">
                  <textarea
                    name="thumbnailPrompt"
                    value={formData.thumbnailPrompt}
                    onChange={handleInputChange}
                    placeholder="Describe the thumbnail you want AI to generate..."
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 resize-none"
                  />
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={generateThumbnail}
                      disabled={isGeneratingThumbnail}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGeneratingThumbnail ? 'Generating...' : 'Generate Thumbnail'}
                    </button>
                    {thumbnailError && (
                      <p className="text-red-400 text-sm">{thumbnailError}</p>
                    )}
                  </div>

                  {/* Preview Generated Thumbnail */}
                  {generatedThumbnail && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-300 mb-2">Generated Thumbnail:</p>
                      <div className="relative group">
                        <img
                          src={generatedThumbnail}
                          alt="Generated thumbnail"
                          className="rounded-lg w-full max-w-md border border-gray-600"
                        />
                        <button
                          onClick={() => setGeneratedThumbnail(null)}
                          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 
                     0L10 8.586l4.293-4.293a1 1 
                     0 111.414 1.414L11.414 10l4.293 
                     4.293a1 1 0 01-1.414 
                     1.414L10 11.414l-4.293 
                     4.293a1 1 0 01-1.414-1.414L8.586 
                     10 4.293 5.707a1 1 0 
                     010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>


            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                onClick={handleSubmit}
              >
                <div className="flex items-center justify-center">
                  <Mic className="h-5 w-5 mr-2" />
                  Submit & publish podcast
                </div>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Podcast Preview</h3>
              <button
                onClick={() => {
                  setShowPreview(false);
                  setIsPlaying(false);
                  if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current.currentTime = 0;
                  }
                }}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="bg-gray-900 p-4 rounded-lg mb-4">
              <div className="flex items-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center mr-4">
                  <Mic className="text-white" size={24} />
                </div>
                <div>
                  <h4 className="text-white font-semibold">{formData.title || "Untitled Podcast"}</h4>
                  <p className="text-gray-400 text-sm">{formData.category || "No category"}</p>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <button
                  onClick={togglePlayback}
                  className="bg-white rounded-full p-3 hover:bg-gray-100 transition-colors"
                >
                  {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} className="ml-1" />}
                </button>

                <audio
                  ref={audioRef}
                  src={previewAudioUrl}
                  onEnded={() => setIsPlaying(false)}
                  onPause={() => setIsPlaying(false)}
                  onPlay={() => setIsPlaying(true)}
                />

                <div className="ml-4 flex-1 bg-gray-700 h-1 rounded-full overflow-hidden">
                  <div
                    className="bg-white h-full transition-all duration-300"
                    style={{ width: audioRef.current ? `${(audioRef.current.currentTime / audioRef.current.duration) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => {
                  setShowPreview(false);
                  setIsPlaying(false);
                  if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current.currentTime = 0;
                  }
                }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatePodcast;