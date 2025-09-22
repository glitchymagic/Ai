class ContentVerifier {
    constructor() {
        this.verificationRules = {
            pokemon_related: {
                required: ['pokemon', 'card', 'tcg', 'trading'],
                blocked: ['spam', 'scam', 'fake', 'bot']
            },
            card_content: {
                allowedFormats: ['jpg', 'jpeg', 'png', 'gif'],
                maxFileSize: 10 * 1024 * 1024, // 10MB
                minResolution: { width: 200, height: 200 }
            },
            text_content: {
                minLength: 5,
                maxLength: 500,
                blockedWords: ['spam', 'scam', 'fake', 'bot', 'hack', 'cheat']
            }
        };

        this.confidenceThresholds = {
            high: 0.8,
            medium: 0.6,
            low: 0.4
        };
    }

    async verifyContent(content, contentType = 'text') {
        const result = {
            isValid: true,
            confidence: 1.0,
            issues: [],
            recommendations: [],
            metadata: {}
        };

        try {
            switch (contentType) {
                case 'text':
                    return await this.verifyTextContent(content);
                case 'image':
                    return await this.verifyImageContent(content);
                case 'video':
                    return await this.verifyVideoContent(content);
                case 'mixed':
                    return await this.verifyMixedContent(content);
                default:
                    result.isValid = false;
                    result.issues.push('Unsupported content type');
                    return result;
            }
        } catch (error) {
            result.isValid = false;
            result.issues.push(`Verification error: ${error.message}`);
            result.confidence = 0.0;
            return result;
        }
    }

    async verifyTextContent(text) {
        const result = {
            isValid: true,
            confidence: 1.0,
            issues: [],
            recommendations: [],
            metadata: {
                wordCount: 0,
                hasPokemonReference: false,
                sentiment: 'neutral'
            }
        };

        if (!text || typeof text !== 'string') {
            result.isValid = false;
            result.issues.push('Invalid text content');
            return result;
        }

        const cleanText = text.trim();
        result.metadata.wordCount = cleanText.split(/\s+/).length;

        // Check length requirements
        if (cleanText.length < this.verificationRules.text_content.minLength) {
            result.isValid = false;
            result.issues.push(`Text too short (minimum ${this.verificationRules.text_content.minLength} characters)`);
            result.confidence -= 0.3;
        }

        if (cleanText.length > this.verificationRules.text_content.maxLength) {
            result.issues.push(`Text too long (maximum ${this.verificationRules.text_content.maxLength} characters)`);
            result.confidence -= 0.1;
        }

        // Check for blocked words
        const blockedWords = this.verificationRules.text_content.blockedWords;
        for (const word of blockedWords) {
            if (cleanText.toLowerCase().includes(word)) {
                result.isValid = false;
                result.issues.push(`Contains blocked word: ${word}`);
                result.confidence -= 0.5;
            }
        }

        // Check for Pokemon TCG relevance
        const pokemonKeywords = this.verificationRules.pokemon_related.required;
        const hasPokemonReference = pokemonKeywords.some(keyword =>
            cleanText.toLowerCase().includes(keyword)
        );
        result.metadata.hasPokemonReference = hasPokemonReference;

        if (!hasPokemonReference) {
            result.confidence -= 0.2;
            result.recommendations.push('Consider adding Pokemon TCG related keywords');
        }

        // Analyze sentiment
        result.metadata.sentiment = this.analyzeSentiment(cleanText);

        // Calculate final confidence
        result.confidence = Math.max(0, Math.min(1, result.confidence));

        return result;
    }

    async verifyImageContent(imageData) {
        const result = {
            isValid: true,
            confidence: 0.8,
            issues: [],
            recommendations: [],
            metadata: {
                format: null,
                size: 0,
                dimensions: null,
                hasCardContent: false
            }
        };

        try {
            // Check file format
            const allowedFormats = this.verificationRules.card_content.allowedFormats;
            if (imageData.format && !allowedFormats.includes(imageData.format.toLowerCase())) {
                result.isValid = false;
                result.issues.push(`Unsupported image format: ${imageData.format}`);
                result.confidence -= 0.3;
            }

            // Check file size
            if (imageData.size && imageData.size > this.verificationRules.card_content.maxFileSize) {
                result.isValid = false;
                result.issues.push(`Image too large: ${(imageData.size / 1024 / 1024).toFixed(1)}MB`);
                result.confidence -= 0.2;
            }

            // Check dimensions
            if (imageData.dimensions) {
                const { width, height } = imageData.dimensions;
                const minRes = this.verificationRules.card_content.minResolution;

                if (width < minRes.width || height < minRes.height) {
                    result.isValid = false;
                    result.issues.push(`Image resolution too low: ${width}x${height}`);
                    result.confidence -= 0.2;
                }

                result.metadata.dimensions = { width, height };
            }

            // Check for card content (this would typically use vision analysis)
            if (imageData.visionAnalysis) {
                result.metadata.hasCardContent = imageData.visionAnalysis.cards &&
                                                imageData.visionAnalysis.cards.length > 0;
                if (result.metadata.hasCardContent) {
                    result.confidence += 0.2;
                }
            }

            result.metadata.format = imageData.format;
            result.metadata.size = imageData.size;

        } catch (error) {
            result.isValid = false;
            result.issues.push(`Image verification error: ${error.message}`);
            result.confidence = 0.0;
        }

        result.confidence = Math.max(0, Math.min(1, result.confidence));
        return result;
    }

    async verifyVideoContent(videoData) {
        const result = {
            isValid: true,
            confidence: 0.7,
            issues: [],
            recommendations: [],
            metadata: {
                duration: 0,
                format: null,
                size: 0,
                hasCardContent: false
            }
        };

        try {
            // Basic video validation
            if (videoData.duration && videoData.duration > 300) { // 5 minutes max
                result.issues.push('Video too long (maximum 5 minutes)');
                result.confidence -= 0.1;
            }

            if (videoData.size && videoData.size > 50 * 1024 * 1024) { // 50MB max
                result.isValid = false;
                result.issues.push('Video file too large');
                result.confidence -= 0.3;
            }

            result.metadata = {
                duration: videoData.duration || 0,
                format: videoData.format || null,
                size: videoData.size || 0,
                hasCardContent: videoData.visionAnalysis?.cards?.length > 0 || false
            };

        } catch (error) {
            result.isValid = false;
            result.issues.push(`Video verification error: ${error.message}`);
            result.confidence = 0.0;
        }

        result.confidence = Math.max(0, Math.min(1, result.confidence));
        return result;
    }

    async verifyMixedContent(content) {
        const result = {
            isValid: true,
            confidence: 0.8,
            issues: [],
            recommendations: [],
            metadata: {
                textValid: false,
                mediaValid: false,
                overallScore: 0
            }
        };

        // Verify text component
        if (content.text) {
            const textResult = await this.verifyTextContent(content.text);
            result.metadata.textValid = textResult.isValid;
            if (!textResult.isValid) {
                result.isValid = false;
                result.issues.push(...textResult.issues);
            }
            result.confidence = (result.confidence + textResult.confidence) / 2;
        }

        // Verify media component
        if (content.media) {
            let mediaResult;
            if (content.media.type === 'image') {
                mediaResult = await this.verifyImageContent(content.media);
            } else if (content.media.type === 'video') {
                mediaResult = await this.verifyVideoContent(content.media);
            }

            if (mediaResult) {
                result.metadata.mediaValid = mediaResult.isValid;
                if (!mediaResult.isValid) {
                    result.isValid = false;
                    result.issues.push(...mediaResult.issues);
                }
                result.confidence = (result.confidence + mediaResult.confidence) / 2;
            }
        }

        result.metadata.overallScore = result.confidence;
        return result;
    }

    analyzeSentiment(text) {
        const positiveWords = ['amazing', 'awesome', 'great', 'love', 'excited', 'happy', 'nice', 'cool', 'fire'];
        const negativeWords = ['disappointed', 'bad', 'terrible', 'hate', 'sad', 'angry', 'trash'];

        let positive = 0, negative = 0;

        const words = text.toLowerCase().split(/\s+/);
        for (const word of words) {
            if (positiveWords.some(pw => word.includes(pw))) positive++;
            if (negativeWords.some(nw => word.includes(nw))) negative++;
        }

        if (positive > negative) return 'positive';
        if (negative > positive) return 'negative';
        return 'neutral';
    }

    getConfidenceLevel(confidence) {
        if (confidence >= this.confidenceThresholds.high) return 'high';
        if (confidence >= this.confidenceThresholds.medium) return 'medium';
        if (confidence >= this.confidenceThresholds.low) return 'low';
        return 'very_low';
    }

    shouldProcessContent(verificationResult) {
        if (!verificationResult.isValid) {
            return false;
        }

        const confidenceLevel = this.getConfidenceLevel(verificationResult.confidence);
        return confidenceLevel !== 'very_low';
    }

    getProcessingPriority(verificationResult) {
        const confidenceLevel = this.getConfidenceLevel(verificationResult.confidence);

        switch (confidenceLevel) {
            case 'high': return 'high';
            case 'medium': return 'normal';
            case 'low': return 'low';
            default: return 'very_low';
        }
    }

    // Batch verification for multiple content items
    async verifyBatch(contents) {
        const results = [];

        for (const content of contents) {
            const result = await this.verifyContent(content.content, content.type);
            results.push({
                id: content.id,
                result,
                priority: this.getProcessingPriority(result),
                shouldProcess: this.shouldProcessContent(result)
            });
        }

        return results;
    }

    // Update verification rules dynamically
    updateRules(newRules) {
        this.verificationRules = {
            ...this.verificationRules,
            ...newRules
        };
    }

    // Get verification statistics
    getStats() {
        return {
            rules: this.verificationRules,
            thresholds: this.confidenceThresholds,
            supportedContentTypes: ['text', 'image', 'video', 'mixed']
        };
    }
}

module.exports = ContentVerifier;
