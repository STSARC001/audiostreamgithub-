import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { startStream } from './streamer.js';

config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Validate environment variables
const requiredEnvVars = ['YOUTUBE_STREAM_URL', 'YOUTUBE_STREAM_KEY', 'DEFAULT_VIDEO_PATH'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
    console.error('Missing required environment variables:', missingEnvVars);
    process.exit(1);
}

// Health check endpoint for Railway
app.get('/', (req, res) => {
    res.json({ status: 'healthy', message: 'YouTube Audio Streamer is running' });
});

app.post('/start-stream', async (req, res) => {
    const { streamKey = process.env.YOUTUBE_STREAM_KEY } = req.body;
    
    if (!streamKey) {
        return res.status(400).json({ error: 'Missing stream key' });
    }

    try {
        await startStream({
            streamKey,
            streamUrl: process.env.YOUTUBE_STREAM_URL,
            videoPath: process.env.DEFAULT_VIDEO_PATH
        });
        res.json({ message: 'Stream started successfully' });
    } catch (error) {
        console.error('Streaming error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({ error: 'Something broke!' });
});

// Start the server and initialize the stream
app.listen(port, '0.0.0.0', async () => {
    console.log(`Server running on port ${port}`);
    
    try {
        console.log('Starting automatic stream...');
        await startStream({
            streamKey: process.env.YOUTUBE_STREAM_KEY,
            streamUrl: process.env.YOUTUBE_STREAM_URL,
            videoPath: process.env.DEFAULT_VIDEO_PATH
        });
        console.log('Automatic stream started successfully');
    } catch (error) {
        console.error('Failed to start automatic stream:', error);
    }
});
