// Visual Content Analyzer for Images and Videos
class VisualAnalyzer {
    constructor(page) {
        this.page = page;
        this.deterministicSeed = null;
        
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
            fake: ['fake', 'counterfeit', 'proxy'],
            
            // Event/poster detection
            event: ['tournament', 'regionals', 'championship', 'event', 'competition'],
            poster: ['poster', 'flyer', 'announcement', 'schedule', 'bracket'],
            meets: ['meetup', 'gathering', 'artist meet', 'signing', 'convention']
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
    
    // Set the seed for deterministic behavior
    seedFrom(input) {
        const strInput = typeof input === 'string' ? input : JSON.stringify(input);
        this.deterministicSeed = strInput.split('').reduce((acc, char) => {
            return ((acc << 5) - acc + char.charCodeAt(0)) & 0xFFFFFFFF;
        }, 0);
    }
    
    // Pick deterministically from an array based on seed
    pickDeterministic(array) {
        if (!array || array.length === 0) return null;
        if (array.length === 1) return array[0];
        
        // Use the seed or create one from current state
        if (!this.deterministicSeed) {
            this.seedFrom(new Date().toISOString());
        }
        
        // Generate index from seed
        const index = Math.abs(this.deterministicSeed) % array.length;
        
        // Update seed for next pick
        this.deterministicSeed = ((this.deterministicSeed << 5) - this.deterministicSeed + 1) & 0xFFFFFFFF;
        
        return array[index];
    }
    
    // Classify if content is an event poster or artist meet
    classifyEventPoster(text, visualData) {
        const textLower = text.toLowerCase();
        
        // Check for event indicators
        const eventKeywords = [
            'tournament', 'regionals', 'championship', 'event',
            'competition', 'battle', 'qualifier', 'league',
            'tcg event', 'pokemon event', 'vgc', 'ptcg'
        ];
        
        const posterKeywords = [
            'poster', 'flyer', 'announcement', 'schedule',
            'bracket', 'rounds', 'day 1', 'day 2', 'registration'
        ];
        
        const artistKeywords = [
            'artist', 'illustrator', 'signing', 'meetup',
            'meet and greet', 'booth', 'convention', 'con',
            'table', 'commissions', 'prints'
        ];
        
        const hasEventKeyword = eventKeywords.some(keyword => textLower.includes(keyword));
        const hasPosterKeyword = posterKeywords.some(keyword => textLower.includes(keyword));
        const hasArtistKeyword = artistKeywords.some(keyword => textLower.includes(keyword));
        
        // Visual cues for posters/flyers
        const hasMultipleImages = visualData && visualData.imageCount > 1;
        const hasScheduleText = /\d{1,2}[:\.]\d{2}|am|pm|rounds?|day \d/i.test(text);
        const hasDateText = /january|february|march|april|may|june|july|august|september|october|november|december|\d{1,2}\/\d{1,2}/i.test(text);
        
        // Classification logic
        if ((hasEventKeyword || hasPosterKeyword) && (hasScheduleText || hasDateText)) {
            return 'event_poster';
        }
        
        if (hasArtistKeyword && (visualData?.hasImage || hasDateText)) {
            return 'artist_meet';
        }
        
        if (hasEventKeyword && visualData?.hasImage) {
            return 'event_content';
        }
        
        return null;
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
                    displayType: 'unknown',
                    isEventPoster: false,
                    isArtistMeet: false
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
                    
                    // Check for event/poster indicators
                    if (text.includes('tournament') || text.includes('regionals') || 
                        text.includes('championship') || text.includes('event')) {
                        data.visualContext.push('event');
                    }
                    if (text.includes('poster') || text.includes('flyer') || 
                        text.includes('schedule') || text.includes('bracket')) {
                        data.visualContext.push('poster');
                    }
                    if (text.includes('artist') || text.includes('signing') || 
                        text.includes('meet') || text.includes('booth')) {
                        data.visualContext.push('artist_meet');
                    }
                }
                
                return data;
            });
            
            // Get tweet text for event classification
            const tweetText = await tweetElement.evaluate(el => {
                const textEl = el.querySelector('[data-testid="tweetText"]');
                return textEl ? textEl.innerText : '';
            });
            
            // Check if this is an event poster or artist meet
            const eventType = this.classifyEventPoster(tweetText, visualData);
            if (eventType === 'event_poster') {
                visualData.isEventPoster = true;
                visualData.displayType = 'event_poster';
            } else if (eventType === 'artist_meet') {
                visualData.isArtistMeet = true;
                visualData.displayType = 'artist_meet';
            }
            
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
        
        // Check for event posters and artist meets first
        if (visualData.isEventPoster) {
            interpretation.contentType = 'event_poster';
            interpretation.focusArea = 'tournament_info';
            interpretation.suggestedResponse = 'event_interest';
            interpretation.confidence = 'high';
            return interpretation;
        }
        
        if (visualData.isArtistMeet) {
            interpretation.contentType = 'artist_meet';
            interpretation.focusArea = 'artist_event';
            interpretation.suggestedResponse = 'artist_appreciation';
            interpretation.confidence = 'high';
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
        const seed = `${text}|${contentType}|${visualData.imageCount||0}`;
        
        // NEW: event poster specific handling
        if (contentType === 'event_poster' || visualData.isEventPoster) {
            const details = this.extractEventBits(text);
            const options = [
                `Tuesday tourneys? ${details.entry ? '$' + details.entry : '?'} entry is chill — what's the usual turnout?`,
                `Love the flyer — format looks ${details.format || 'Standard'}; start time ${details.time || '?'} still correct?`,
                `${details.venue || 'That spot'} runs weekly? Any prizing details or top cut?`,
                `${details.day || 'Weekly'} events hit different — what's the meta like there?`
            ];
            return this.pickDeterministic(options, seed);
        }
        
        // NEW: artist meet specific handling
        if (contentType === 'artist_meet' || visualData.isArtistMeet) {
            const options = [
                `Meeting the artist is a flex — did you snag a signed print?`,
                `That's a W meet-up. Any sketches/commissions or just vibes?`,
                `Love seeing creators in the wild — fav piece from them?`,
                `Artist meets are elite content — which cards did they illustrate?`
            ];
            return this.pickDeterministic(options, seed);
        }
        
        // Enhanced response templates with more TCG expertise
        const responses = {
            // Single card responses
            grade_comment: [
                "That centering looks 50/50 or better - PSA 10 potential for sure",
                "Clean surface and edges! What grading company you thinking?",
                "Gem mint candidate! CGC has been fast lately if you're grading"
            ],
            condition_comment: [
                "Back corners look sharp! Check under a loupe for surface scratches",
                "Centering looks 55/45 front - within PSA 10 tolerance",
                "Print quality on that one is exceptional - grade it before prices climb"
            ],
            appreciation: [
                "That texture pattern hits different in hand! One of the best from the set",
                "The holo pattern on that era was unmatched - modern just doesn't compare",
                "Underrated art from that set! Prices been climbing on those"
            ],
            
            // Multiple cards responses
            collection_comment: [
                "That's a focused collection! Working on master set or just the hits?",
                "Binder organization on point! Side loading pages protect those corners",
                "Heavy hitters in there! What's the crown jewel of the collection?"
            ],
            pulls_reaction: [
                "Pull rates been rough on that set - you beat the odds!",
                "That's above average for sure! Box or loose packs?",
                "Solid hits! The alt arts from that set are money long-term"
            ],
            mailday_excitement: [
                "Mail day hits different! TCGPlayer or private sale?",
                "Condition looks minty from here! Raw or coming back from grading?",
                "Smart pickups! Those have been trending up last 30 days"
            ],
            favorite_question: [
                "What's the chase from that haul? Market's been moving on some of those",
                "Any going to grading? PSA prices dropped to $15 recently",
                "PC or flipping? Some solid ROI potential in that spread"
            ],
            
            // Video responses
            video_reaction: [
                "Box break or singles? Pull rates vary wildly on that set",
                "Live rips hit different! What's the chase you're after?",
                "Opening videos never get old - especially when you hit!"
            ],
            
            // Event and artist responses
            event_interest: [
                "Tournament meta looking spicy! Who's your pick to top 8?",
                "Regionals always bring heat! Standard or Expanded format?",
                "Competitive scene is heating up! Prize support looking good too",
                "Events are back! Hope everyone pulls their chase from prize packs"
            ],
            artist_appreciation: [
                "Artist signatures add serious value! Getting any cards signed?",
                "Meeting the artists is elite! Their original sketches are grails",
                "Artist events are underrated! Commission prices reasonable?",
                "In-person signatures hit different than the printed autos!"
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
        if (textLower.includes('base set') || textLower.includes('jungle') || textLower.includes('fossil')) {
            return "Vintage cards hit different! Great piece of history";
        }
        if (textLower.includes('vintage') && (textLower.includes('1999') || textLower.includes('base set'))) {
            return "True vintage! Those early sets are special";
        }
        if (textLower.includes('rainbow') || textLower.includes('gold')) {
            return "The rainbow/gold cards are stunning! Great pull";
        }
        
        // Return deterministic response from appropriate category
        return this.pickDeterministic(responseOptions);
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
        return this.pickDeterministic(options);
    }
    
    // Extract event details from text
    extractEventBits(text = '') {
        const t = text.toLowerCase();
        const time = (t.match(/\b\d{1,2}(:\d{2})?\s*(am|pm)\b/i) || [])[0];
        const entry = (t.match(/\$\s?(\d{1,3})/) || [])[1];
        const day = (t.match(/\b(mon|tue|wed|thu|fri|sat|sun)[a-z]*\b/i) || [])[0];
        const venue = (t.match(/\b(mall|plaza|game|shop|center|store)\b/i) || [])[0];
        const format = (t.match(/\b(standard|expanded|glc)\b/i) || [])[0];
        return { time, entry, day, venue, format };
    }
}

module.exports = VisualAnalyzer;