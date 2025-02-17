import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { startStream } from './streamer.js';

config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check endpoint for Railway
app.get('/', (req, res) => {
    res.json({ status: 'healthy', message: 'YouTube Audio Streamer is running' });
});

app.post('/start-stream', async (req, res) => {
    const { streamKey } = req.body;
    
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
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
});
