import express, { Request, Response, Router } from 'express';
import multer, { FileFilterCallback } from 'multer';
import { Pool } from 'pg';
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';

// Create a router
const router2: Router = express.Router();

// Interface for podcast data
interface PodcastData {
  title: string;
  category: string;
  description: string;
  content: string;
  voiceId: string;
  authorId: string;
  authorName: string;
  thumbnailOption: string;
  thumbnailPrompt: string;
}

// Interface for podcast record
interface Podcast {
  id: number;
  title: string;
  category: string;
  description: string;
  content: string;
  voice_id: string;
  author_id: string;
  author_name: string;
  thumbnail_url: string | null;
  audio_url: string | null;
  thumbnail_public_id: string | null;
  audio_public_id: string | null;
  thumbnail_prompt: string | null;
  likesCount: number;
  created_at: Date;
  updated_at: Date;
}

// Extend the Request interface to include files
interface MulterRequest extends Request {
  files: {
    [fieldname: string]: Express.Multer.File[];
  };
}

// Cloudinary upload result interface
interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  duration?: number;
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Initialize NeonDB (PostgreSQL) connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (file.fieldname === 'thumbnail') {
      if (file.mimetype.startsWith('image/')) cb(null, true);
      else cb(new Error('Only image files are allowed for thumbnails'));
    } else if (file.fieldname === 'audio') {
      const allowedAudioTypes = [
        'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg',
        'audio/aac', 'audio/flac', 'audio/webm', 'audio/m4a'
      ];
      if (allowedAudioTypes.includes(file.mimetype)) cb(null, true);
      else cb(new Error('Unsupported audio format. Please use MP3, WAV, OGG, AAC, FLAC, WebM, or M4A'));
    } else cb(new Error('Unexpected field'));
  }
});

// Helper function to upload to Cloudinary
const uploadToCloudinary = (
  buffer: Buffer,
  fileName: string,
  folder: string,
  resourceType: 'image' | 'video' | 'auto' = 'auto'
): Promise<CloudinaryUploadResult> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        public_id: fileName.replace(/\.[^/.]+$/, ""),
        overwrite: false,
        unique_filename: true
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result as CloudinaryUploadResult);
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

// Helper function to delete from Cloudinary
const deleteFromCloudinary = async (
  publicId: string,
  resourceType: 'image' | 'video' | 'auto' = 'auto'
): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
};

// Ensure podcasts table
// async function createPodcastsTable() {
//   try {
//     const query = `
//       ALTER TABLE podcasts
//       ADD COLUMN IF NOT EXISTS likescount INTEGER DEFAULT 0;
//     `;
//     await pool.query(query);
//     console.log('✅ Podcasts table ensured to exist');
//   } catch (error) {
//     console.error('Error creating podcasts table:', error);
//     throw error;
//   }
// }

// createPodcastsTable().catch(console.error);

// ========================= Routes =============================

// Create podcast
router2.post('/api/podcasts', upload.fields([{ name: 'thumbnail' }, { name: 'audio' }]), async (req: Request, res: Response) => {
  let thumbnailUrl: string | null = null;
  let thumbnailPublicId: string | null = null;
  let audioUrl: string | null = null;
  let audioPublicId: string | null = null;

  try {
    // await createPodcastsTable();
    const files = (req as MulterRequest).files;

    const { title, category, description, content, voiceId, authorId, authorName, thumbnailPrompt } = req.body;

    if (!title || !category || !description || !content || !authorId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (!files || !files['audio'] || files['audio'].length === 0) {
      return res.status(400).json({ error: 'Audio file is required' });
    }

    // Upload thumbnail
    if (files['thumbnail'] && files['thumbnail'].length > 0) {
      const thumbnailFile = files['thumbnail'][0];
      const thumbnailResult = await uploadToCloudinary(
        thumbnailFile.buffer,
        `thumbnail_${Date.now()}_${thumbnailFile.originalname}`,
        'podcast-thumbnails',
        'image'
      );
      thumbnailUrl = thumbnailResult.secure_url;
      thumbnailPublicId = thumbnailResult.public_id;
    }

    // Upload audio
    const audioFile = files['audio'][0];
    const audioResult = await uploadToCloudinary(
      audioFile.buffer,
      `audio_${Date.now()}_${audioFile.originalname}`,
      'podcast-audio',
      'video'
    );
    audioUrl = audioResult.secure_url;
    audioPublicId = audioResult.public_id;

    // Insert into DB
    const query = `
      INSERT INTO podcasts (
        title, category, description, content,
        voice_id, author_id, author_name,
        thumbnail_url, audio_url,
        thumbnail_public_id, audio_public_id, thumbnail_prompt, likesCount,
        created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,0,NOW(),NOW())
      RETURNING *;
    `;
    const values = [title, category, description, content, voiceId, authorId, authorName,
      thumbnailUrl, audioUrl, thumbnailPublicId, audioPublicId, thumbnailPrompt];

    const result = await pool.query(query, values);
    res.status(201).json({ message: 'Podcast created successfully', podcast: result.rows[0] });

  } catch (error) {
    console.error('Error creating podcast:', error);
    if (audioPublicId) await deleteFromCloudinary(audioPublicId, 'video').catch(() => { });
    if (thumbnailPublicId) await deleteFromCloudinary(thumbnailPublicId, 'image').catch(() => { });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete podcast
router2.delete('/podcasts/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const podcastResult = await pool.query(
      'SELECT audio_public_id, thumbnail_public_id FROM podcasts WHERE id = $1',
      [id]
    );
    if (podcastResult.rows.length === 0) {
      return res.status(404).json({ error: 'Podcast not found' });
    }
    const { audio_public_id, thumbnail_public_id } = podcastResult.rows[0];
    const deletes: Promise<void>[] = [];
    if (audio_public_id) deletes.push(deleteFromCloudinary(audio_public_id, 'video'));
    if (thumbnail_public_id) deletes.push(deleteFromCloudinary(thumbnail_public_id, 'image'));
    await Promise.allSettled(deletes);

    await pool.query('DELETE FROM podcasts WHERE id = $1', [id]);
    res.json({ message: 'Podcast deleted successfully' });
  } catch (error) {
    console.error('Error deleting podcast:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all podcasts
router2.get('/podcasts', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM podcasts ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching podcasts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single podcast
router2.get('/podcasts/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM podcasts WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Podcast not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching podcast:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add this route to your backend
router2.get('/api/podcasts/:id/share', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Get the podcast from the database
    const result = await pool.query('SELECT * FROM podcasts WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Podcast not found' });
    }
    
    const podcast = result.rows[0];
    
    // Generate a shareable URL (using your frontend URL)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const shareableUrl = `${frontendUrl}/podcast/${id}`;
    
    // Generate an embed code for the audio
    const embedCode = `<div style="background: #f5f5f5; padding: 20px; border-radius: 10px; max-width: 400px;">
  <h3 style="margin: 0 0 10px 0; color: #333;">${podcast.title}</h3>
  <p style="margin: 0 0 15px 0; color: #666; font-size: 14px;">By ${podcast.author_name}</p>
  <audio controls style="width: 100%; margin-bottom: 15px;">
    <source src="${podcast.audio_url}" type="audio/mpeg">
    Your browser does not support the audio element.
  </audio>
  <p style="margin: 0; font-size: 12px; color: #999;">
    Listen to more podcasts on <a href="${frontendUrl}" style="color: #6366f1; text-decoration: none;">PodcastAI</a>
  </p>
</div>`;

    // Generate social media share links
    const shareLinks = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out this podcast: ${podcast.title}`)}&url=${encodeURIComponent(shareableUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareableUrl)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareableUrl)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`Check out this podcast: ${podcast.title} ${shareableUrl}`)}`,
      reddit: `https://reddit.com/submit?url=${encodeURIComponent(shareableUrl)}&title=${encodeURIComponent(podcast.title)}`
    };

    res.json({
      podcast: {
        ...podcast,
        shareableUrl
      },
      audioUrl: podcast.audio_url,
      embedCode,
      shareLinks,
      qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareableUrl)}`
    });
  } catch (error) {
    console.error('Error generating share link:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      // details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});



export default router2;
