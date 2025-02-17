import ffmpeg from 'fluent-ffmpeg';
import { promises as fs } from 'fs';
import path from 'path';

async function getRandomAudioFile() {
    const audioFiles = [];
    for (let i = 1; i <= 5; i++) {
        audioFiles.push(`./assets/${i}.mp3`);
    }
    
    // Randomly select an audio file
    const randomIndex = Math.floor(Math.random() * audioFiles.length);
    const selectedFile = audioFiles[randomIndex];
    
    try {
        await fs.access(selectedFile);
        console.log('Selected audio file:', selectedFile);
        return selectedFile;
    } catch (error) {
        console.error(`Failed to access audio file ${selectedFile}`);
        throw new Error(`Audio file ${selectedFile} not found. Please ensure all audio files (1.mp3 through 5.mp3) are present in the assets directory.`);
    }
}

export async function startStream({ streamKey, streamUrl, videoPath }) {
    console.log('Starting stream with configuration:', {
        streamUrl,
        videoPath,
        // Don't log the full stream key for security
        streamKeyLength: streamKey?.length
    });

    // Get a random audio file
    const audioPath = await getRandomAudioFile();
    
    // Verify that video file exists
    try {
        await fs.access(videoPath);
        console.log('Video file verified:', videoPath);
    } catch (error) {
        console.error(`Failed to access video file: ${videoPath}`);
        throw error;
    }

    const streamDestination = `${streamUrl}/${streamKey}`;

    return new Promise((resolve, reject) => {
        console.log('Initializing FFmpeg stream...');
        
        ffmpeg()
            .input(videoPath)
            .inputOptions(['-stream_loop -1']) // Loop video indefinitely
            .input(audioPath)
            .audioCodec('aac')
            .videoCodec('libx264')
            .outputOptions([
                '-preset veryfast',
                '-maxrate 2500k',
                '-bufsize 5000k',
                '-pix_fmt yuv420p',
                '-g 60', // Keyframe every 2 seconds (assuming 30 fps)
                '-c:a aac',
                '-b:a 128k',
                '-ar 44100',
                '-f flv'
            ])
            .on('start', (command) => {
                console.log('FFmpeg process started with command:', command);
                console.log('Stream started with audio file:', audioPath);
                resolve();
            })
            .on('error', (err, stdout, stderr) => {
                console.error('Streaming error:', err.message);
                console.error('FFmpeg stdout:', stdout);
                console.error('FFmpeg stderr:', stderr);
                reject(err);
            })
            .on('end', () => {
                console.log('Stream ended, restarting with new audio...');
                // Restart stream with a new random audio file
                startStream({ streamKey, streamUrl, videoPath })
                    .catch(err => console.error('Error restarting stream:', err));
            })
            .save(streamDestination);
    });
}
