"use client"

import { useUser } from "@clerk/nextjs"
import { useEffect, useState, useRef } from "react"
import Image from "next/image"
import { Play, Pause, Edit3, Save, X, Music, User, Mail, Calendar, Upload, Camera } from "lucide-react"

interface Profile {
  user_id: string
  username: string
  email: string
  bio: string
  avatar_url: string
  created_at?: string
}

interface Podcast {
  id: number
  title: string
  description: string
  created_at: string
  thumbnail_url?: string
  audio_url: string
  duration?: number
  category: string
}

export default function ProfilePage() {
  const { user, isLoaded } = useUser()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [podcasts, setPodcasts] = useState<Podcast[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [editedUsername, setEditedUsername] = useState("")
  const [editedBio, setEditedBio] = useState("")
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [currentPlaying, setCurrentPlaying] = useState<Podcast | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user && isLoaded) {
      const fetchProfileAndPodcasts = async () => {
        try {
          setLoading(true)
          // Fetch profile info
          const profileRes = await fetch(`http://localhost:5000/api/profile/${user.id}`)
          if (profileRes.ok) {
            const profileData = await profileRes.json()
            setProfile(profileData.profile || profileData)
            setEditedUsername(profileData.profile?.username || profileData.username || "")
            setEditedBio(profileData.profile?.bio || profileData.bio || "")
          }

          // Fetch user podcasts
          const podcastsRes = await fetch(`http://localhost:5000/api/profile/${user.id}/podcasts`)
          if (podcastsRes.ok) {
            const podcastsData = await podcastsRes.json()
            setPodcasts(podcastsData.myPodcasts || podcastsData || [])
          }
        } catch (err) {
          console.error("Error fetching profile or podcasts:", err)
        } finally {
          setLoading(false)
        }
      }

      fetchProfileAndPodcasts()
    }
  }, [user, isLoaded])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveProfile = async () => {
    if (!user || !profile) return

    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('username', editedUsername)
      formData.append('bio', editedBio)
      formData.append('email', profile.email)

      if (selectedImage) {
        formData.append('avatar', selectedImage)
        setUploadingImage(true)
      }

      const res = await fetch(`http://localhost:5000/api/profile/${user.id}`, {
        method: "PUT",
        body:formData,
      })

      if (res.ok) {
        const updatedProfile = await res.json()
        setProfile(updatedProfile.profile || updatedProfile)
        setIsEditing(false)
        setSelectedImage(null)
        setImagePreview(null)
      }
    } catch (err) {
      console.error("Error updating profile:", err)
    } finally {
      setSaving(false)
      setUploadingImage(false)
    }
  }

  const handlePlay = (podcast: Podcast) => {
    if (audioRef.current) {
      // If clicking the same podcast, toggle play/pause
      if (currentPlaying?.id === podcast.id) {
        if (isPlaying) {
          audioRef.current.pause()
          setIsPlaying(false)
        } else {
          audioRef.current.play()
          setIsPlaying(true)
        }
        return
      }

      // Otherwise, pause current and play new
      audioRef.current.pause()
    }

    // Create new audio element
    const newAudio = new Audio(podcast.audio_url)
    newAudio.play()
    audioRef.current = newAudio
    setCurrentPlaying(podcast)
    setIsPlaying(true)

    newAudio.onended = () => {
      setIsPlaying(false)
      setCurrentPlaying(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatDuration = (seconds: number | undefined) => {
    if (!seconds) return "0:00"
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-white text-xl">Please sign in to view your profile</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white pb-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 mb-8 border border-gray-700/50">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="relative">
              <div className="relative">
                <Image
                  src={imagePreview || profile?.avatar_url || user.imageUrl}
                  alt="Profile"
                  width={120}
                  height={120}
                  className="rounded-full object-cover border-4 border-purple-500/30"
                />
                {isEditing && (
                  <>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 hover:opacity-100 transition-opacity"
                    >
                      <Camera className="h-6 w-6 text-white" />
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageSelect}
                      accept="image/*"
                      className="hidden"
                    />
                  </>
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-purple-600 rounded-full p-2">
                <User className="h-5 w-5" />
              </div>
            </div>

            <div className="flex-1 text-center md:text-left">
              {isEditing ? (
                <input
                  type="text"
                  value={editedUsername}
                  onChange={(e) => setEditedUsername(e.target.value)}
                  className="text-3xl font-bold bg-transparent border-b border-purple-500 focus:outline-none focus:border-purple-300 text-center md:text-left"
                />
              ) : (
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {profile?.username || user.fullName || user.username}
                </h1>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-2 text-gray-300">
                <div className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  <span>{profile?.email || user.primaryEmailAddress?.emailAddress}</span>
                </div>

                {profile?.created_at && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Joined {formatDate(profile.created_at)}</span>
                  </div>
                )}
              </div>

              {isEditing ? (
                <div className="mt-4">
                  <textarea
                    value={editedBio}
                    onChange={(e) => setEditedBio(e.target.value)}
                    className="w-full bg-gray-700/50 border border-gray-600/50 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    rows={4}
                    placeholder="Tell us about yourself..."
                  />
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving || uploadingImage}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                      {uploadingImage ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          {saving ? "Saving..." : "Save Changes"}
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false)
                        setSelectedImage(null)
                        setImagePreview(null)
                        setEditedUsername(profile?.username || "")
                        setEditedBio(profile?.bio || "")
                      }}
                      className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-4">
                  <p className="text-gray-300 leading-relaxed">
                    {profile?.bio || "No bio yet. Tell us about yourself!"}
                  </p>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="mt-4 bg-gray-700/50 hover:bg-gray-600/50 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors border border-gray-600/50"
                  >
                    <Edit3 className="h-4 w-4" />
                    Edit Profile
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* User's Podcasts */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Music className="h-6 w-6 text-purple-400" />
              My Podcasts <span className="text-purple-400">({podcasts.length})</span>
            </h2>
          </div>

          {podcasts.length === 0 ? (
            <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 text-center border border-gray-700/50">
              <Music className="h-16 w-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-400 mb-2">No podcasts yet</h3>
              <p className="text-gray-500">Create your first podcast to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {podcasts.map((podcast) => (
                <div
                  key={podcast.id}
                  className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-5 border border-gray-700/50 hover:border-purple-500/30 transition-all duration-300"
                >
                  <div className="flex gap-4">
                    <div className="relative">
                      <Image
                        src={podcast.thumbnail_url || "/api/placeholder/100/100"}
                        alt={podcast.title}
                        width={80}
                        height={80}
                        className="rounded-lg object-cover"
                      />
                      <button
                        onClick={() => handlePlay(podcast)}
                        className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg opacity-0 hover:opacity-100 transition-opacity"
                      >
                        {currentPlaying?.id === podcast.id && isPlaying ? (
                          <Pause className="h-6 w-6 text-white" />
                        ) : (
                          <Play className="h-6 w-6 text-white" />
                        )}
                      </button>
                    </div>

                    <div className="flex-1">
                      <h3 className="font-semibold text-white line-clamp-1">{podcast.title}</h3>
                      <p className="text-sm text-purple-400 mt-1">{podcast.category}</p>
                      <p className="text-sm text-gray-400 mt-2 line-clamp-2">{podcast.description}</p>

                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-gray-500">
                          {formatDate(podcast.created_at)}
                        </span>
                        {podcast.duration && (
                          <span className="text-xs text-gray-500">
                            {formatDuration(podcast.duration)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {currentPlaying?.id === podcast.id && (
                    <div className="mt-4 flex items-center">
                      <div className="flex-1 bg-gray-700/50 rounded-full h-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: '30%' }} // This would be dynamic in a real player
                        ></div>
                      </div>
                      <span className="text-xs text-gray-400 ml-3">
                        {formatDuration(podcast.duration)}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}