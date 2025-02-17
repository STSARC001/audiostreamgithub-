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
        return selectedFile;
    } catch (error) {
        throw new Error(`Audio file ${selectedFile} not found. Please ensure all audio files (1.mp3 through 5.mp3) are present in the assets directory.`);
    }
}

export async function startStream({ streamKey, streamUrl, videoPath }) {
    // Get a random audio file
    const audioPath = await getRandomAudioFile();
    
    // Verify that video file exists
    await fs.access(videoPath);

    const streamDestination = `${streamUrl}/${streamKey}`;

    return new Promise((resolve, reject) => {
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
            .on('start', () => {
                console.log('Stream started with audio file:', audioPath);
                resolve();
            })
            .on('error', (err) => {
                console.error('Streaming error:', err);
                reject(err);
            })
            .on('end', () => {
                console.log('Stream ended');
                // Restart stream with a new random audio file
                startStream({ streamKey, streamUrl, videoPath })
                    .catch(err => console.error('Error restarting stream:', err));
            })
            .save(streamDestination);
    });
}
