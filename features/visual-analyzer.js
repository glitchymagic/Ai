// Visual Content Analyzer for Images and Videos
class VisualAnalyzer {
    constructor(page) {
        this.page = page;
        
        // Visual cues to look for in images
        this.visualPatterns = {
            // Multiple cards visible
            binder: ['binder', 'pages', 'collection', 'album'],
            spread: ['multiple', 'lot', 'spread', 'bunch', 'stack'],
            
            // Single card focus
            closeup: ['close', 'zoom', 'detail', 'macro'],
            grading: ['slab', 'psa', 'bgs', 'cgc', 'graded'],
            
            // Pack opening
            packOpening: ['pack', 'opening', 'wrapper', 'fresh'],
            sealed: ['sealed', 'box', 'booster', 'etb', 'collection box'],
            
            // Store/retail
            shelf: ['shelf', 'store', 'walmart', 'target', 'retail'],
            haul: ['haul', 'pickup', 'finds', 'mail day'],
            
            // Card condition
            damage: ['damaged', 'bent', 'crease', 'tear'],
            mint: ['mint', 'perfect', 'pristine', 'gem'],
            
            // Special
            error: ['miscut', 'misprint', 'error', 'crimp'],
            custom: ['custom', 'art', 'altered', 'painted'],
            fake: ['fake', 'counterfeit', 'proxy']
        };
        
        // Common visual elements in Pokemon cards
        this.cardElements = {
            shiny: ['holo', 'foil', 'sparkle', 'rainbow', 'shiny'],
            texture: ['texture', 'pattern', 'etched', 'relief'],
            art: ['full art', 'alt art', 'alternate', 'special'],
            gold: ['gold', 'golden', 'secret rare'],
            rainbow: ['rainbow', 'hyper rare'],
            vmax: ['vmax', 'v max', 'dynamax'],
            ex: ['ex', 'gx', 'tag team'],
            trainer: ['trainer', 'supporter', 'stadium']
        };
    }
    
    // Analyze visual content in a post
    async analyzeVisualContent(tweetElement) {
        try {
            const visualData = await tweetElement.evaluate((el) => {
                const data = {
                    hasImage: false,
                    hasVideo: false,
                    imageCount: 0,
                    imageAlt: [],
                    videoDescription: null,
                    visualContext: [],
                    cardCount: 'unknown',
                    displayType: 'unknown'
                };
                
                // Check for images
                const images = el.querySelectorAll('img[alt*="Image"]');
                if (images.length > 0) {
                    data.hasImage = true;
                    data.imageCount = images.length;
                    
                    images.forEach(img => {
                        if (img.alt) {
                            data.imageAlt.push(img.alt);
                        }
                    });
                }
                
                // Check for videos
                const videos = el.querySelectorAll('video, [data-testid="videoPlayer"]');
                if (videos.length > 0) {
                    data.hasVideo = true;
                    // Try to get video context from nearby text
                    const videoContainer = videos[0].closest('div');
                    if (videoContainer) {
                        const nearbyText = videoContainer.innerText;
                        if (nearbyText) {
                            data.videoDescription = nearbyText.substring(0, 100);
                        }
                    }
                }
                
                // Check for media tags
                const mediaTags = el.querySelectorAll('[data-testid="tweetPhoto"], [data-testid="card.layoutLarge.media"]');
                data.mediaCount = mediaTags.length;
                
                // Look for visual indicators in the tweet text
                const tweetText = el.querySelector('[data-testid="tweetText"]');
                if (tweetText) {
                    const text = tweetText.innerText.toLowerCase();
                    
                    // Estimate card count from text
                    if (text.includes('binder') || text.includes('collection')) {
                        data.cardCount = 'many';
                        data.displayType = 'binder';
                    } else if (text.includes('pulls') || text.includes('opened')) {
                        data.cardCount = 'multiple';
                        data.displayType = 'pulls';
                    } else if (text.includes('graded') || text.includes('slab')) {
                        data.cardCount = 'single';
                        data.displayType = 'graded';
                    } else if (text.includes('mail day')) {
                        data.cardCount = 'multiple';
                        data.displayType = 'mailday';
                    }
                    
                    // Check for visual descriptors
                    if (text.includes('close up') || text.includes('closeup')) {
                        data.visualContext.push('closeup');
                    }
                    if (text.includes('front and back')) {
                        data.visualContext.push('both_sides');
                    }
                    if (text.includes('centering')) {
                        data.visualContext.push('condition_focus');
                    }
                }
                
                return data;
            });
            
            // Enhance with additional analysis
            visualData.analysis = this.interpretVisualContent(visualData);
            
            return visualData;
            
        } catch (error) {
            console.log(`   ⚠️ Error analyzing visual content: ${error.message}`);
            return null;
        }
    }
    
    // Interpret what the visual content likely shows
    interpretVisualContent(visualData) {
        const interpretation = {
            contentType: 'unknown',
            focusArea: null,
            suggestedResponse: null,
            confidence: 'low'
        };
        
        if (!visualData.hasImage && !visualData.hasVideo) {
            return interpretation;
        }
        
        // Video content
        if (visualData.hasVideo) {
            interpretation.contentType = 'video';
            interpretation.focusArea = 'pack_opening'; // Most Pokemon videos are pack openings
            interpretation.suggestedResponse = 'video_reaction';
            interpretation.confidence = 'medium';
            return interpretation;
        }
        
        // Image content based on count and context
        if (visualData.imageCount === 1) {
            interpretation.contentType = 'single_card';
            
            if (visualData.displayType === 'graded') {
                interpretation.focusArea = 'graded_card';
                interpretation.suggestedResponse = 'grade_comment';
            } else if (visualData.visualContext.includes('closeup')) {
                interpretation.focusArea = 'card_detail';
                interpretation.suggestedResponse = 'condition_comment';
            } else {
                interpretation.focusArea = 'showcase';
                interpretation.suggestedResponse = 'appreciation';
            }
            interpretation.confidence = 'high';
            
        } else if (visualData.imageCount > 1) {
            interpretation.contentType = 'multiple_cards';
            
            if (visualData.displayType === 'binder') {
                interpretation.focusArea = 'collection';
                interpretation.suggestedResponse = 'collection_comment';
            } else if (visualData.displayType === 'pulls') {
                interpretation.focusArea = 'pack_pulls';
                interpretation.suggestedResponse = 'pulls_reaction';
            } else if (visualData.displayType === 'mailday') {
                interpretation.focusArea = 'new_cards';
                interpretation.suggestedResponse = 'mailday_excitement';
            } else {
                interpretation.focusArea = 'multiple_showcase';
                interpretation.suggestedResponse = 'favorite_question';
            }
            interpretation.confidence = 'medium';
        }
        
        return interpretation;
    }
    
    // Generate response based on visual content
    generateVisualResponse(text, visualData) {
        if (!visualData || !visualData.analysis) {
            return null;
        }
        
        const { contentType, focusArea, suggestedResponse } = visualData.analysis;
        const textLower = text.toLowerCase();
        
        // Response templates based on visual content type
        const responses = {
            // Single card responses
            grade_comment: [
                "That grade looks well deserved! Centering is on point",
                "Beautiful slab! PSA got it right on that one",
                "Gem mint for sure! Congrats on the grade"
            ],
            condition_comment: [
                "The condition looks incredible from here",
                "Centering and corners look perfect",
                "That's grading worthy for sure"
            ],
            appreciation: [
                "That card photographs so well!",
                "The artwork really pops in that lighting",
                "Beautiful card! One of my favorites from the set"
            ],
            
            // Multiple cards responses
            collection_comment: [
                "Solid collection! Love the organization",
                "Your binder is looking stacked!",
                "Great collection! What's your favorite page?"
            ],
            pulls_reaction: [
                "Those are some solid pulls!",
                "Nice hits! Which pack had the best pulls?",
                "Great pulls! That's a win for sure"
            ],
            mailday_excitement: [
                "Mail days are the best! Nice additions",
                "Awesome mail day! Which one's your favorite?",
                "Great pickups! The condition looks solid"
            ],
            favorite_question: [
                "Nice cards! Which one's your favorite?",
                "Great spread! What's the chase card there?",
                "Awesome variety! Any of these for the PC?"
            ],
            
            // Video responses
            video_reaction: [
                "Love watching pack openings! Any big hits?",
                "Hope you pulled something good!",
                "Pack opening videos never get old"
            ]
        };
        
        // Get appropriate response based on visual analysis
        let responseOptions = responses[suggestedResponse] || responses.appreciation;
        
        // Add specific card mentions if detected in text
        if (textLower.includes('charizard')) {
            return "That Charizard looks incredible! Amazing condition";
        }
        if (textLower.includes('moonbreon') || textLower.includes('umbreon')) {
            return "Moonbreon is the ultimate chase! Beautiful card";
        }
        if (textLower.includes('pikachu')) {
            return "Can't go wrong with Pikachu! Classic card";
        }
        
        // Check for specific visual contexts
        if (textLower.includes('miscut') || textLower.includes('error')) {
            return "That's a unique error! Collectors love those";
        }
        if (textLower.includes('vintage') || textLower.includes('base set')) {
            return "Vintage cards hit different! Great piece of history";
        }
        if (textLower.includes('rainbow') || textLower.includes('gold')) {
            return "The rainbow/gold cards are stunning! Great pull";
        }
        
        // Return random response from appropriate category
        return responseOptions[Math.floor(Math.random() * responseOptions.length)];
    }
    
    // Analyze if image likely shows good or bad pulls
    assessPullQuality(text, visualData) {
        const textLower = text.toLowerCase();
        
        // Positive indicators
        const positiveWords = ['hit', 'chase', 'fire', 'amazing', 'insane', 'pulled', 'finally', 'grail'];
        const hasPositive = positiveWords.some(word => textLower.includes(word));
        
        // Negative indicators
        const negativeWords = ['bulk', 'nothing', 'bad', 'worst', 'no hits', 'terrible', 'unlucky'];
        const hasNegative = negativeWords.some(word => textLower.includes(word));
        
        if (hasPositive && !hasNegative) {
            return 'good';
        } else if (hasNegative && !hasPositive) {
            return 'bad';
        }
        
        return 'neutral';
    }
    
    // Generate response based on pull quality
    generatePullResponse(quality) {
        const responses = {
            good: [
                "Incredible pulls! That's what we love to see",
                "Fire pulls! You definitely beat the odds",
                "Those are some serious hits! Congrats"
            ],
            bad: [
                "Better luck next time! We all have those boxes",
                "Rough pulls, but the next one will be better",
                "That's how it goes sometimes. Keep hunting!"
            ],
            neutral: [
                "Nice cards! Any keepers for the collection?",
                "Solid opens! What set is that from?",
                "Cool pulls! Hope you got what you were chasing"
            ]
        };
        
        const options = responses[quality] || responses.neutral;
        return options[Math.floor(Math.random() * options.length)];
    }
}

module.exports = VisualAnalyzer;