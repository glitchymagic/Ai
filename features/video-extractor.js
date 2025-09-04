// Video Frame Extractor - Extracts frames from videos for vision analysis
const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class VideoExtractor {
    constructor() {
        this.videoCache = new Map();
        this.tempDir = path.join(__dirname, '../temp-video-frames');
        this.ensureTempDir();
    }
    
    async ensureTempDir() {
        try {
            await fs.mkdir(this.tempDir, { recursive: true });
        } catch (error) {
            console.log('⚠️ Failed to create temp directory:', error.message);
        }
    }
    
    // Extract video URLs from tweet element
    async extractVideoUrls(tweetElement) {
        try {
            const videoData = await tweetElement.evaluate((el) => {
                const videos = [];
                
                // Find video elements in the tweet
                const videoElements = el.querySelectorAll('video');
                const videoContainers = el.querySelectorAll('[data-testid*="video"], [aria-label*="video"], div[role="button"][aria-label*="Play"]');
                
                // Also check for video thumbnails that might indicate a video
                const videoThumbnails = el.querySelectorAll('img[src*="video_thumb"], img[src*="amplify_video_thumb"]');
                
                videoElements.forEach(video => {
                    videos.push({
                        type: 'video_element',
                        src: video.src || video.currentSrc,
                        poster: video.poster,
                        duration: video.duration
                    });
                });
                
                // Check if there's a play button or video indicator
                const hasPlayButton = el.querySelector('[data-testid="playButton"], [aria-label*="Play video"]') !== null;
                const hasVideoPlayer = el.querySelector('[data-testid="videoPlayer"], [data-testid="tweetVideo"]') !== null;
                
                return {
                    hasVideo: videos.length > 0 || hasPlayButton || hasVideoPlayer || videoThumbnails.length > 0,
                    videos: videos,
                    hasPlayButton: hasPlayButton,
                    hasVideoPlayer: hasVideoPlayer,
                    videoCount: Math.max(videos.length, videoThumbnails.length, hasPlayButton ? 1 : 0)
                };
            });
            
            return videoData;
        } catch (error) {
            console.log('⚠️ Failed to extract videos:', error.message);
            return { hasVideo: false, videos: [], videoCount: 0 };
        }
    }
    
    // Download video from URL
    async downloadVideo(videoUrl, filename) {
        try {
            const response = await fetch(videoUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch video: ${response.status}`);
            }
            
            const buffer = await response.buffer();
            const filepath = path.join(this.tempDir, filename);
            await fs.writeFile(filepath, buffer);
            
            return filepath;
        } catch (error) {
            console.log('⚠️ Failed to download video:', error.message);
            return null;
        }
    }
    
    // Extract frames from video using ffmpeg
    async extractFrames(videoPath, numFrames = 5) {
        try {
            const frames = [];
            const videoName = path.basename(videoPath, path.extname(videoPath));
            
            // Check if ffmpeg is available
            try {
                await execAsync('ffmpeg -version');
            } catch (error) {
                console.log('⚠️ ffmpeg not available, using fallback method');
                return this.extractFramesFallback(videoPath);
            }
            
            // Get video duration
            const durationCmd = `ffmpeg -i "${videoPath}" 2>&1 | grep "Duration" | cut -d ' ' -f 4 | sed s/,//`;
            const { stdout: duration } = await execAsync(durationCmd);
            
            // Extract frames at different timestamps
            // For better coverage, extract more frames from different parts
            const frameTimestamps = [
                '00:00:02',  // 2 seconds in
                '00:00:05',  // 5 seconds in  
                '00:00:08',  // 8 seconds in
                '00:00:12',  // 12 seconds in
                '00:00:15'   // 15 seconds in
            ];
            
            for (let i = 0; i < Math.min(numFrames, frameTimestamps.length); i++) {
                const timestamp = frameTimestamps[i];
                
                const frameFilename = `${videoName}_frame_${i}.jpg`;
                const framePath = path.join(this.tempDir, frameFilename);
                
                // Extract frame using ffmpeg
                const extractCmd = `ffmpeg -ss ${timestamp} -i "${videoPath}" -vframes 1 -q:v 2 "${framePath}" -y`;
                
                try {
                    await execAsync(extractCmd);
                    
                    // Read the frame and convert to base64
                    const frameBuffer = await fs.readFile(framePath);
                    const base64 = frameBuffer.toString('base64');
                    
                    frames.push({
                        base64: base64,
                        timestamp: timestamp,
                        index: i
                    });
                    
                    // Clean up frame file
                    await fs.unlink(framePath).catch(() => {});
                } catch (error) {
                    console.log(`⚠️ Failed to extract frame at ${timestamp}:`, error.message);
                }
            }
            
            // Clean up video file
            await fs.unlink(videoPath).catch(() => {});
            
            return frames;
        } catch (error) {
            console.log('⚠️ Failed to extract frames:', error.message);
            return [];
        }
    }
    
    // Fallback method when ffmpeg is not available
    async extractFramesFallback(videoPath) {
        // For Twitter videos, we can often get thumbnail images
        // This is a simplified fallback that returns empty frames
        console.log('⚠️ Video frame extraction requires ffmpeg');
        return [];
    }
    
    // Process video from tweet
    async processVideoFromTweet(tweetElement) {
        const videoData = await this.extractVideoUrls(tweetElement);
        
        if (!videoData.hasVideo) {
            return {
                hasVideo: false,
                frames: [],
                videoCount: 0
            };
        }
        
        // For Twitter, we often can't directly download videos due to authentication
        // Instead, we'll try to capture screenshots of the video player
        const frames = await this.captureVideoFrames(tweetElement);
        
        return {
            hasVideo: true,
            frames: frames,
            videoCount: videoData.videoCount,
            hasPlayButton: videoData.hasPlayButton
        };
    }
    
    // Capture frames from video player in the browser
    async captureVideoFrames(tweetElement) {
        try {
            const frames = [];
            
            // Try to play the video and capture frames
            const captured = await tweetElement.evaluate(async () => {
                const results = [];
                
                // Find the video element
                const video = document.querySelector('video');
                if (!video) {
                    // Try to click play button if video isn't loaded
                    const playButton = document.querySelector('[data-testid="playButton"], [aria-label*="Play video"]');
                    if (playButton) {
                        playButton.click();
                        // Wait for video to load
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                }
                
                const videoEl = document.querySelector('video');
                if (videoEl && videoEl.readyState >= 2) {
                    // Create canvas to capture frames
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = videoEl.videoWidth;
                    canvas.height = videoEl.videoHeight;
                    
                    // Capture frames at different timestamps
                    // For pack openings, cards often appear in the middle/end
                    const duration = videoEl.duration || 30; // Default to 30 seconds if unknown
                    const timestamps = [
                        Math.min(2, duration * 0.1),    // 10% in (or 2 seconds)
                        Math.min(5, duration * 0.3),    // 30% in (or 5 seconds)
                        Math.min(10, duration * 0.5),   // 50% in (or 10 seconds)
                        Math.min(15, duration * 0.7),   // 70% in (or 15 seconds)
                        Math.min(20, duration * 0.9)    // 90% in (or 20 seconds)
                    ];
                    
                    // Remove duplicates and sort
                    const uniqueTimestamps = [...new Set(timestamps.map(t => Math.floor(t)))].sort((a, b) => a - b);
                    
                    for (const timestamp of uniqueTimestamps) {
                        try {
                            videoEl.currentTime = timestamp;
                            await new Promise(resolve => {
                                videoEl.onseeked = resolve;
                                setTimeout(resolve, 1500); // Slightly longer timeout for seeking
                            });
                            
                            // Wait a bit for frame to stabilize
                            await new Promise(resolve => setTimeout(resolve, 100));
                            
                            ctx.drawImage(videoEl, 0, 0);
                            const dataUrl = canvas.toDataURL('image/jpeg', 0.9); // Higher quality
                            const base64 = dataUrl.split(',')[1];
                            
                            results.push({
                                base64: base64,
                                timestamp: timestamp,
                                width: canvas.width,
                                height: canvas.height
                            });
                            
                            // Limit to 5 frames max to avoid API overload
                            if (results.length >= 5) break;
                        } catch (error) {
                            console.log('Failed to capture frame at', timestamp);
                        }
                    }
                }
                
                return results;
            });
            
            return captured || [];
        } catch (error) {
            console.log('⚠️ Failed to capture video frames:', error.message);
            return [];
        }
    }
    
    // Clear video cache and temp files
    async clearCache() {
        this.videoCache.clear();
        
        // Clean up temp directory
        try {
            const files = await fs.readdir(this.tempDir);
            for (const file of files) {
                await fs.unlink(path.join(this.tempDir, file)).catch(() => {});
            }
        } catch (error) {
            // Ignore errors
        }
        
        console.log('🧹 Video cache cleared');
    }
}

module.exports = VideoExtractor;