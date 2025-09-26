import express, { Request, Response, Router } from 'express';
import { Pool } from 'pg';

const profileRouter: Router = express.Router();

interface CloudinaryUploadResponse {
  secure_url: string;
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const stream = require('stream');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// async function createProfilesTable() {
//   const query = `
//     CREATE TABLE IF NOT EXISTS profiles (
//       id SERIAL PRIMARY KEY,
//       user_id VARCHAR(100) NOT NULL UNIQUE,
//       username VARCHAR(255) NOT NULL,
//       email VARCHAR(255) NOT NULL,
//       bio TEXT,
//       avatar_url TEXT,
//       saved_podcasts INTEGER[] DEFAULT '{}',
//       liked_podcasts INTEGER[] DEFAULT '{}',
//       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//     );
//   `;
//   await pool.query(query);
//   console.log('✅ Profiles table ensured to exist');
// }
// createProfilesTable().catch(console.error);

//
// ========================= Profile Routes =============================
//

// Get profile by userId
profileRouter.get('/api/profile/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;

    const result = await pool.query('SELECT * FROM profiles WHERE user_id = $1', [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({ profile: result.rows[0] });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create or update profile
profileRouter.post('/api/profile', async (req: Request, res: Response) => {
  try {
    const { user_id, username, email, bio, avatar_url } = req.body;

    if (!user_id || !username || !email) {
      return res.status(400).json({ error: 'User ID, username, and email are required' });
    }

    const existingProfile = await pool.query('SELECT * FROM profiles WHERE user_id = $1', [user_id]);

    let result;
    if (existingProfile.rows.length > 0) {
      result = await pool.query(
        `UPDATE profiles 
         SET username = COALESCE($1, username), 
             email = COALESCE($2, email), 
             bio = COALESCE($3, bio), 
             avatar_url = COALESCE($4, avatar_url), 
             updated_at = NOW()
         WHERE user_id = $5 
         RETURNING *`,
        [username, email, bio, avatar_url, user_id]
      );
    } else {
      result = await pool.query(
        `INSERT INTO profiles (user_id, username, email, bio, avatar_url, saved_podcasts, liked_podcasts)
         VALUES ($1, $2, $3, $4, $5, '{}', '{}')
         RETURNING *`,
        [user_id, username, email, bio || "Welcome to my podcast profile!", avatar_url]
      );
    }

    res.json({
      message: existingProfile.rows.length > 0 ? 'Profile updated successfully' : 'Profile created successfully',
      profile: result.rows[0]
    });
  } catch (error) {
    console.error('Error saving profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update profile by userId
profileRouter.put('/api/profile/:id', async (req: Request, res: Response) => {
  try {
    console.log("update in process ...")
    const userId = req.params.id;
    const { username, email, bio, avatar_url } = req.body;

    const existingProfile = await pool.query('SELECT * FROM profiles WHERE user_id = $1', [userId]);

    if (existingProfile.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const result = await pool.query(
      `UPDATE profiles 
       SET username = COALESCE($1, username), 
           email = COALESCE($2, email), 
           bio = COALESCE($3, bio), 
           avatar_url = COALESCE($4, avatar_url), 
           updated_at = NOW()
       WHERE user_id = $5 
       RETURNING *`,
      [username, email, bio, avatar_url, userId]
    );

    res.json({ message: 'Profile updated successfully', profile: result.rows[0] });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//
// ========================= Podcast Interaction Routes =============================
//

// Get podcasts created by user
profileRouter.get('/api/profile/:id/podcasts', async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;

    const result = await pool.query(
      `SELECT * FROM podcasts WHERE author_id = $1 ORDER BY created_at DESC`,
      [userId]
    );

    res.json({ myPodcasts: result.rows });
  } catch (error) {
    console.error('Error fetching user podcasts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Save or unsave a podcast
profileRouter.post('/api/podcasts/:id/save', async (req: Request, res: Response) => {
  try {
    const { user_id } = req.body;
    const podcastId = parseInt(req.params.id);

    if (!user_id) return res.status(400).json({ error: 'user_id is required' });
    if (isNaN(podcastId)) return res.status(400).json({ error: 'Invalid podcast ID' });

    const profileResult = await pool.query('SELECT * FROM profiles WHERE user_id = $1', [user_id]);
    if (profileResult.rows.length === 0) return res.status(404).json({ error: 'Profile not found' });

    const profile = profileResult.rows[0];
    const isAlreadySaved = profile.saved_podcasts.includes(podcastId);

    const updatedSavedPodcasts = isAlreadySaved
      ? profile.saved_podcasts.filter((id: number) => id !== podcastId)
      : [...profile.saved_podcasts, podcastId];

    const updateResult = await pool.query(
      `UPDATE profiles SET saved_podcasts = $1, updated_at = NOW() WHERE user_id = $2 RETURNING *`,
      [updatedSavedPodcasts, user_id]
    );

    res.json({
      message: isAlreadySaved ? 'Podcast removed from saved list' : 'Podcast saved successfully',
      is_saved: !isAlreadySaved,
      profile: updateResult.rows[0]
    });
  } catch (error) {
    console.error('Error saving podcast:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Like or unlike a podcast
profileRouter.post('/api/podcasts/:id/like', async (req: Request, res: Response) => {
  try {
    const { user_id } = req.body;
    const podcastId = parseInt(req.params.id);

    if (!user_id) return res.status(400).json({ error: 'user_id is required' });
    if (isNaN(podcastId)) return res.status(400).json({ error: 'Invalid podcast ID' });

    const profileResult = await pool.query('SELECT * FROM profiles WHERE user_id = $1', [user_id]);
    if (profileResult.rows.length === 0) return res.status(404).json({ error: 'Profile not found' });

    const profile = profileResult.rows[0];

    const podcastResult = await pool.query('SELECT * FROM podcasts WHERE id = $1', [podcastId]);
    if (podcastResult.rows.length === 0) return res.status(404).json({ error: 'Podcast not found' });

    const podcast = podcastResult.rows[0];
    const isAlreadyLiked = profile.liked_podcasts.includes(podcastId);

    const updatedLikedPodcasts = isAlreadyLiked
      ? profile.liked_podcasts.filter((id: number) => id !== podcastId)
      : [...profile.liked_podcasts, podcastId];

    const profileUpdateResult = await pool.query(
      `UPDATE profiles SET liked_podcasts = $1, updated_at = NOW() WHERE user_id = $2 RETURNING *`,
      [updatedLikedPodcasts, user_id]
    );

    const newLikesCount = isAlreadyLiked
      ? (podcast.likescount || 0) - 1
      : (podcast.likescount || 0) + 1;

    const podcastUpdateResult = await pool.query(
      `UPDATE podcasts SET likescount = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [newLikesCount, podcastId]
    );

    res.json({
      message: isAlreadyLiked ? 'Podcast unliked' : 'Podcast liked successfully',
      is_liked: !isAlreadyLiked,
      profile: profileUpdateResult.rows[0],
      podcast: podcastUpdateResult.rows[0]
    });
  } catch (error) {
    console.error('Error liking podcast:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get saved podcasts for a user
profileRouter.post('/api/profile/saved-podcasts', async (req: Request, res: Response) => {
  try {
    const { user_id } = req.body;

    const profileResult = await pool.query('SELECT * FROM profiles WHERE user_id = $1', [user_id]);
    if (profileResult.rows.length === 0) return res.status(404).json({ error: 'Profile not found' });

    const profile = profileResult.rows[0];
    const savedPodcasts: number[] = profile.saved_podcasts || [];

    if (savedPodcasts.length === 0) return res.json({ savedPodcasts: [] });

    const result = await pool.query(
      `SELECT * FROM podcasts WHERE id = ANY($1) ORDER BY created_at DESC`,
      [savedPodcasts]
    );

    res.json({ savedPodcasts: result.rows });
  } catch (error) {
    console.error('Error fetching saved podcasts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get liked podcasts for a user
profileRouter.post('/api/profile/liked-podcasts', async (req: Request, res: Response) => {
  try {
    const { user_id } = req.body;

    const profileResult = await pool.query('SELECT * FROM profiles WHERE user_id = $1', [user_id]);
    if (profileResult.rows.length === 0) return res.status(404).json({ error: 'Profile not found' });

    const profile = profileResult.rows[0];
    if (!profile.liked_podcasts || profile.liked_podcasts.length === 0) {
      return res.json({ likedPodcasts: [] });
    }

    const result = await pool.query(
      `SELECT * FROM podcasts WHERE id = ANY($1) ORDER BY created_at DESC`,
      [profile.liked_podcasts]
    );

    res.json({ likedPodcasts: result.rows });
  } catch (error) {
    console.error('Error fetching liked podcasts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Update profile by userId with image upload support
profileRouter.put('/api/profile/:id', upload.single('avatar'), async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const { username, email, bio } = req.body;
    let avatar_url = req.body.avatar_url;

    // If a new image was uploaded, process it
    if (req.file) {
      try {

        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'podcast-profiles' },
          (error: Error, result: CloudinaryUploadResponse) => {
            if (error) {
              console.error('Cloudinary upload error:', error);
              return res.status(500).json({ error: 'Image upload failed' });
            }

            avatar_url = result.secure_url;
            updateProfile();
          }
        );

        // Create a buffer stream from the file buffer
        const bufferStream = new stream.PassThrough();
        bufferStream.end(req.file.buffer);
        bufferStream.pipe(uploadStream);
      } catch (uploadError) {
        console.error('Image processing error:', uploadError);
        return res.status(500).json({ error: 'Image processing failed' });
      }
    } else {
      // No new image, just update the profile
      updateProfile();
    }

    function updateProfile() {
      pool.query(
        `UPDATE profiles 
         SET username = COALESCE($1, username), 
             email = COALESCE($2, email), 
             bio = COALESCE($3, bio), 
             avatar_url = COALESCE($4, avatar_url), 
             updated_at = NOW()
         WHERE user_id = $5 
         RETURNING *`,
        [username, email, bio, avatar_url, userId],
        (error, result) => {
          if (error) {
            console.error('Error updating profile:', error);
            return res.status(500).json({ error: 'Internal server error' });
          }

          if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Profile not found' });
          }

          res.json({ message: 'Profile updated successfully', profile: result.rows[0] });
        }
      );
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default profileRouter;
