// Image Extractor - Downloads images from tweets for vision analysis
const fetch = require('node-fetch');

class ImageExtractor {
    constructor() {
        this.imageCache = new Map();
    }
    
    // Extract image URLs from tweet element
    async extractImageUrls(tweetElement) {
        try {
            const imageData = await tweetElement.evaluate((el) => {
                const images = [];
                
                // Find all image elements in the tweet
                // Look for Twitter images or any image in our test environment
                const imgElements = el.querySelectorAll('img[src*="pbs.twimg.com"], img[src*="http"], img[src*="data:"]');
                
                imgElements.forEach(img => {
                    let src = img.src;
                    
                    // Skip profile pictures and other non-content images
                    if (src.includes('profile_images') || 
                        src.includes('emoji') || 
                        src.includes('card_img')) {
                        return;
                    }
                    
                    // Twitter serves different sizes, get the large version
                    if (src.includes('&name=')) {
                        src = src.replace(/&name=\w+/, '&name=large');
                    } else if (src.includes('?format=')) {
                        src = src.replace(/\?format=(\w+)&name=\w+/, '?format=$1&name=large');
                    }
                    
                    images.push({
                        url: src,
                        alt: img.alt || 'Pokemon card image',
                        width: img.naturalWidth || img.width,
                        height: img.naturalHeight || img.height
                    });
                });
                
                return images;
            });
            
            return imageData;
        } catch (error) {
            console.log('⚠️ Failed to extract images:', error.message);
            return [];
        }
    }
    
    // Convert image URL to base64 for Gemini API
    async imageUrlToBase64(imageUrl) {
        try {
            // Check cache first
            if (this.imageCache.has(imageUrl)) {
                return this.imageCache.get(imageUrl);
            }
            
            // Fetch the image
            const response = await fetch(imageUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch image: ${response.status}`);
            }
            
            // Convert to buffer
            const buffer = await response.buffer();
            
            // Convert to base64
            const base64 = buffer.toString('base64');
            
            // Cache for future use (with size limit)
            if (this.imageCache.size < 50) {
                this.imageCache.set(imageUrl, base64);
            } else {
                // Clear old entries if cache is full
                const firstKey = this.imageCache.keys().next().value;
                this.imageCache.delete(firstKey);
                this.imageCache.set(imageUrl, base64);
            }
            
            return base64;
        } catch (error) {
            console.log('⚠️ Failed to convert image to base64:', error.message);
            return null;
        }
    }
    
    // Process multiple images from a tweet
    async processImagesFromTweet(tweetElement) {
        const imageUrls = await this.extractImageUrls(tweetElement);
        const processedImages = [];
        
        // Process up to 4 images (API limit consideration)
        const limit = Math.min(imageUrls.length, 4);
        
        for (let i = 0; i < limit; i++) {
            const imageInfo = imageUrls[i];
            const base64 = await this.imageUrlToBase64(imageInfo.url);
            
            if (base64) {
                processedImages.push({
                    base64: base64,
                    url: imageInfo.url,
                    alt: imageInfo.alt,
                    index: i
                });
            }
        }
        
        return {
            count: imageUrls.length,
            processed: processedImages,
            hasMultiple: imageUrls.length > 1
        };
    }
    
    // Clear image cache
    clearCache() {
        this.imageCache.clear();
        console.log('🧹 Image cache cleared');
    }
    
    // Get cache stats
    getCacheStats() {
        return {
            size: this.imageCache.size,
            urls: Array.from(this.imageCache.keys())
        };
    }
}

module.exports = ImageExtractor;