import { Router, Request, Response } from "express";
import { z } from 'zod';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { Readable } from 'stream';

dotenv.config();
const router = Router();

const thumbnailRequestSchema = z.object({
    prompt: z.string().min(1).max(1000, "Prompt must be between 1 and 1000 characters")
});

const podcastRequestSchema = z.object({
    input: z.string().min(1).max(5000, "Input must be between 1 and 5000 characters"),
    voiceId: z.string().min(1, "Voice ID is required"),
    speed: z.number().min(0.5).max(1.5).optional().default(1.0)
});
router.post("/generate-content-stream", async (req: Request, res: Response) => {
    console.log("triggered");
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string" || prompt.trim() === "") {
        return res.status(400).json({ error: "Missing or invalid 'prompt' in body" });
    }

    try {
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        if (!GEMINI_API_KEY) {
            return res.status(500).json({ error: "GEMINI_API_KEY not set" });
        }

        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        // Enhanced prompt with podcast-specific instructions
        const enhancedPrompt = `You are an expert podcast writer with extensive knowledge of podcast best practices. 
    Generate engaging podcast content based on the following topic/request. 
    
    IMPORTANT INSTRUCTIONS:
    1. Create content suitable for a single speaker podcast (no dialogue or multiple speakers)
    2. Do not include any music cues, sound effect descriptions, or technical directions
    3. Avoid any text formatting (no markdown, asterisks, or special characters)
    4. Focus on creating natural, conversational content that flows well when spoken
    5. Structure the content with a clear introduction, main content, and conclusion
    6. Keep paragraphs concise for better audio delivery
    7. Do not add any meta-commentary about the content itself
    
    Topic/Request: ${prompt}
    
    Now generate the podcast script:`;

        const result = await model.generateContentStream({
            contents: [{ role: "user", parts: [{ text: enhancedPrompt }] }],
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 2048,
            },
        });

        let fullReply = "";

        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
                fullReply += text;
                res.write(`data: ${JSON.stringify({ delta: text })}\n\n`);
            }
        }

        res.write(`event: done\ndata: ${JSON.stringify({ full: fullReply })}\n\n`);
        res.end();
    } catch (error: any) {
        console.error("❌ Streaming error:", error);
        if (!res.writableEnded) {
            res.write(
                `event: error\ndata: ${JSON.stringify({
                    message: "Request failed",
                    detail: error?.message || error,
                })}\n\n`
            );
            res.end();
        }
    }
});

router.post("/generate-description", async (req: Request, res: Response) => {
    console.log("triggered");
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string" || prompt.trim() === "") {
        return res.status(400).json({ error: "Missing or invalid 'prompt' in body" });
    }

    try {
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        if (!GEMINI_API_KEY) {
            return res.status(500).json({ error: "GEMINI_API_KEY not set" });
        }

        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        // Enhanced prompt with podcast-specific instructions
        const enhancedPrompt = `You are an expert podcast writer with extensive knowledge of podcast best practices. 
    Generate engaging podcast description based on the following topic/request. 
    
    IMPORTANT INSTRUCTIONS:
    1. Create description suitable for a single speaker podcast (no dialogue or multiple speakers)
    2. Do not include any music cues, sound effect descriptions, or technical directions
    3. Avoid any text formatting (no markdown, asterisks, or special characters)
    4. Focus on creating natural description that flows well when spoken
    5. Do not add any meta-commentary about the content itself
    6. Keep it of suitable length
    Topic/Request: ${prompt}
    
    Now generate the podcast description:`;

        const result = await model.generateContentStream({
            contents: [{ role: "user", parts: [{ text: enhancedPrompt }] }],
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 2048,
            },
        });

        let fullReply = "";

        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
                fullReply += text;
                res.write(`data: ${JSON.stringify({ delta: text })}\n\n`);
            }
        }

        res.write(`event: done\ndata: ${JSON.stringify({ full: fullReply })}\n\n`);
        res.end();
    } catch (error: any) {
        console.error("❌ Streaming error:", error);
        if (!res.writableEnded) {
            res.write(
                `event: error\ndata: ${JSON.stringify({
                    message: "Request failed",
                    detail: error?.message || error,
                })}\n\n`
            );
            res.end();
        }
    }
});

router.post('/generate-thumbnail', async (req: Request, res: Response) => {
    try {
        const { prompt } = thumbnailRequestSchema.parse(req.body);

        // Enhanced prompt for podcast-specific thumbnails
        const enhancedPrompt = `Create a professional podcast thumbnail image that represents: ${prompt}
        
        Style guidelines:
        - Podcast/audio-focused design
        - Clean, modern, and professional appearance
        - Visually engaging with good contrast
        - Suitable for podcast platforms and social media
        - Includes visual elements that represent audio/podcasting
        - Avoid text-heavy designs (podcast titles will be added separately)
        - Use a balanced composition with a clear focal point`;

        const generationResponse = await fetch(
            "https://router.huggingface.co/nebius/v1/images/generations",
            {
                headers: {
                    Authorization: `Bearer ${process.env.HF_TOKEN}`,
                    "Content-Type": "application/json",
                },
                method: "POST",
                body: JSON.stringify({
                    response_format: "url",
                    prompt: enhancedPrompt,
                    model: "black-forest-labs/flux-dev",
                    size: "1024x1024", // Standard square format for thumbnails
                    num_inference_steps: 30, // Higher quality
                    guidance_scale: 7.5 // Balanced creativity vs. prompt adherence
                }),
            }
        );

        if (!generationResponse.ok) {
            const error = await generationResponse.json().catch(() => ({ error: "Unknown error" }));
            throw new Error(typeof error === 'object' && error !== null && 'error' in error
                ? String(error.error)
                : "Failed to generate image");
        }

        const generationResult = await generationResponse.json();
        const imageUrl = generationResult.data?.[0]?.url;

        if (!imageUrl) {
            throw new Error("No image URL received from generation API");
        }

        // Fetch the generated image
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
            throw new Error(`Failed to fetch image from storage: ${imageResponse.statusText}`);
        }

        // Type-safe streaming of the image
        if (!imageResponse.body) {
            throw new Error("No image data received");
        }

        // Set appropriate content type (default to webp if not provided)
        res.setHeader('Content-Type', imageResponse.headers.get('content-type') || 'image/webp');
        res.setHeader('Content-Disposition', 'inline; filename="podcast-thumbnail.webp"');

        // Stream the image data
        const reader = imageResponse.body.getReader();
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                res.write(value);
            }
            res.end();
        } catch (streamError) {
            console.error("Stream error:", streamError);
            if (!res.headersSent) {
                res.status(500).json({
                    error: "Streaming error",
                    details: streamError instanceof Error ? streamError.message : "Unknown streaming error"
                });
            }
        }

    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                error: "Validation failed",
                details: error.errors
            });
        }

        console.error("Error generating thumbnail:", error);

        const errorMessage = error instanceof Error
            ? error.message
            : "Unknown error occurred";

        const statusCode = errorMessage.includes("credentials") ? 401 : 500;

        res.status(statusCode).json({
            error: "Error generating thumbnail",
            details: errorMessage,
            ...(statusCode === 401 ? { solution: "Check your HF_TOKEN configuration" } : {})
        });
    }
});



function readableStreamToNodeStream(readableStream: ReadableStream<Uint8Array>): Readable {
    const reader = readableStream.getReader();

    return new Readable({
        async read() {
            try {
                const { done, value } = await reader.read();
                if (done) {
                    this.push(null);
                } else {
                    this.push(Buffer.from(value));
                }
            } catch (error) {
                this.destroy(error as Error);
            }
        }
    });
}

router.post('/generate-podcast-audio', async (req: Request, res: Response) => {
    try {
        const { input, voiceId, speed } = podcastRequestSchema.parse(req.body);

        // Initialize ElevenLabs client
        const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
        if (!ELEVENLABS_API_KEY) {
            return res.status(500).json({ error: "ELEVENLABS_API_KEY not set" });
        }

        const elevenlabs = new ElevenLabsClient({
            apiKey: ELEVENLABS_API_KEY,
        });

        // Generate audio with ElevenLabs
        const audioStream = await elevenlabs.textToSpeech.convert(
            voiceId,
            {
                text: input,
                modelId: 'eleven_multilingual_v2',
                outputFormat: 'mp3_44100_128',
                voiceSettings: {
                    stability: 0.5,
                    similarityBoost: 0.8,
                    speed: speed,
                }
            }
        );

        // Set appropriate headers for audio streaming
        res.set('Content-Type', 'audio/mpeg');
        res.set('Content-Disposition', 'inline; filename="podcast.mp3"');
        res.set('Cache-Control', 'no-cache');

        // Convert ReadableStream to buffer and send
        const reader = audioStream.getReader();
        const chunks: Uint8Array[] = [];

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
        }

        // Combine all chunks into a single buffer
        const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
        const combinedBuffer = new Uint8Array(totalLength);
        let offset = 0;

        for (const chunk of chunks) {
            combinedBuffer.set(chunk, offset);
            offset += chunk.length;
        }

        // Send the audio buffer
        res.send(Buffer.from(combinedBuffer));

    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                error: "Validation failed",
                details: error.errors
            });
        }

        console.error("Error generating podcast audio:", error);

        res.status(500).json({
            error: "Error generating podcast audio",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
});

router.get('/voices', async (req: Request, res: Response) => {
    try {
        const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
        if (!ELEVENLABS_API_KEY) {
            return res.status(500).json({ error: "ELEVENLABS_API_KEY not set" });
        }

        const elevenlabs = new ElevenLabsClient({
            apiKey: ELEVENLABS_API_KEY,
        });

        const voices = await elevenlabs.voices.getAll();
        res.json(voices);
    } catch (error) {
        console.error("Error fetching voices:", error);
        res.status(500).json({ error: "Error fetching voices" });
    }
});




export default router;