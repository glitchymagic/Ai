// Ultra Human-Like Response Generator
// Makes responses indistinguishable from real collectors

const ResponseMemory = require('./response-memory');
const ConversationMemory = require('./conversation-memory');
const CardRecognition = require('./card-recognition');

class HumanLikeResponses {
    constructor() {
        // Response memory to avoid repetition
        this.memory = new ResponseMemory();
        // Conversation memory for user context
        this.conversations = new ConversationMemory();
        // Card recognition for image analysis
        this.cardRecognition = new CardRecognition();
        // Real human response patterns with imperfections
        this.responses = {
            // Seeing amazing pulls - genuine excitement
            amazingPull: [
                "brooo that's insane",
                "no wayyyy 😭 congrats",
                "sheeeesh what a pull",
                "thats the one!! huge W",
                "stop it right now that's crazy",
                "YOOO thats heat 🔥",
                "nah you're lying... thats sick",
                "bro said casual pull lmaooo gg",
                "ain't no way... from ONE pack??",
                "ok now im jealous ngl"
            ],
            
            // Good pulls - supportive but casual
            goodPull: [
                "solid pull fr",
                "that cards clean",
                "W pull for sure",
                "love that card ngl", 
                "nice hit 👀",
                "thats a keeper",
                "decent!! centering looks good too",
                "ayy not bad at all",
                "better than my pulls today lol",
                "that art goes hard"
            ],
            
            // Grading questions - helpful but casual
            gradingAdvice: [
                "looks clean enough for a 10 imo",
                "centering might get a 9 but still worth it",
                "id send it.. worst case its a 9",
                "psa been tough lately but worth a shot",
                "if the backs clean then yeah definitely",
                "hard to tell from pics but looks solid",
                "i'd grade it.. that card only going up",
                "cgc might be faster rn just saying",
                "check the corners with a loupe first",
                "surface looks good from here.. send it"
            ],
            
            // Value questions - redirect to actual checking
            valueResponse: [
                "depends on condition, check tcgplayer",
                "market's been moving, worth checking current prices",
                "varies by set and condition tbh",
                "need to check recent sales for accurate price",
                "changes daily, tcgplayer has live pricing",
                "depends which set/version you mean",
                "price varies a lot, what condition is it?",
                "hard to say without seeing condition",
                "market fluctuates, check ebay sold listings",
                "need more details - which set?"
            ],
            
            // Store questions - helpful tips
            storeHelp: [
                "target tues/thurs morning if ur lucky",
                "walmart been dry lately tbh",
                "gamestop sometimes has hidden stuff",
                "check barnes noble.. slept on fr",
                "costco had tins last week",
                "best buy online randomly restocks",
                "target app shows stock sometimes",
                "facebook marketplace sometimes has deals",
                "local card shops might have some",
                "discord groups post restocks usually"
            ],
            
            // Investment questions
            investmentTalk: [
                "evolving skies always a safe bet",
                "sealed is the move long term",
                "crown zenith gonna age well imo",
                "id hold anything with alt arts",
                "modern iffy but ES different",
                "vintage safer but ES has potential",
                "depends how long u can hold",
                "surging sparks might be it tbh",
                "paldean fates giving hidden fates vibes",
                "151 nostalgia factor gonna pay off"
            ],
            
            // Mail day reactions
            mailDay: [
                "mail days undefeated",
                "W mail day fr",
                "solid pickups 🔥",
                "that vintage hittin different",
                "package secured 📦",
                "love a good mail day",
                "those look clean",
                "jealous of that haul ngl",
                "mail day dopamine hit different",
                "solid additions to the collection"
            ],
            
            // Sales posts - brief acknowledgment
            saleResponse: [
                "glws!",
                "good price glws",
                "tempting.. glws",
                "if i had money rn... glws",
                "someone gonna snag that quick",
                "fair price 👍",
                "wish i could.. glws",
                "thats actually decent pricing",
                "gonna move fast at that price",
                "solid deal there"
            ],
            
            // Authenticity checks
            fakeCheck: [
                "texture looks off ngl",
                "font seems sus",
                "colors look right to me",
                "need better pics but seems legit",
                "compare to a real one side by side",
                "holo pattern looks weird",
                "edges seem too clean for vintage",
                "backs usually give fakes away",
                "font kerning is the tell",
                "if it feels smooth its fake"
            ],
            
            // General agreement/conversation
            agreement: [
                "facts",
                "fr fr",
                "100%",
                "exactly",
                "real talk",
                "this^^",
                "couldn't agree more",
                "my thoughts exactly",
                "yup",
                "truth"
            ],
            
            // Asking questions back
            questions: [
                "what set that from?",
                "how much you pay?",
                "where'd you find that?",
                "gonna grade it?",
                "how's the back look?",
                "what else you pull?",
                "is that for trade?",
                "retail or resell?",
                "first time pulling that?",
                "centering looks good?"
            ],
            
            // Bad luck sympathy
            badLuck: [
                "pain.. next box gonna hit tho",
                "brutal.. we all been there",
                "rip.. at least you tried",
                "thats rough buddy",
                "variance sucks sometimes",
                "next one gonna be fire watch",
                "happens to the best of us",
                "L box but karma coming",
                "been there.. hurts every time",
                "oof thats tough"
            ],
            
            // Collection/display posts
            collectionResponse: [
                "collection looking sick",
                "setup is clean",
                "solid display tbh",
                "jealous of that collection",
                "organized af respect",
                "that binder hits different",
                "display game strong",
                "collection goals fr",
                "thats some heat right there",
                "love the organization"
            ],
            
            // Set comparisons
            setComparison: [
                "surging sparks for the pikachu",
                "stellar crown underrated imo",
                "paradox rift if u like trainers",
                "151 for nostalgia easy",
                "crown zenith best pull rates",
                "obsidian flames for zard",
                "lost origin has crazy alt arts",
                "paldean fates basically hidden fates 2",
                "twilight masquerade sleeper set",
                "depends what ur chasing tbh"
            ]
        };
        
        // Typos and shortcuts real humans make
        this.typos = {
            'that': ['taht', 'thats', 'that'],
            'the': ['teh', 'the'],
            'your': ['ur', 'your', 'yr'],
            'you': ['u', 'you'],
            'because': ['bc', 'because', 'cuz'],
            'though': ['tho', 'though'],
            'really': ['rly', 'really'],
            'probably': ['prob', 'probably', 'prolly'],
            'definitely': ['def', 'definitely', 'deff'],
            'going to': ['gonna', 'going to'],
            'want to': ['wanna', 'want to']
        };
        
        // Emoji usage patterns (some people use them, some don't)
        this.emojiPersonality = Math.random() < 0.3; // 30% chance to be emoji user
    }
    
    async generateHumanResponse(text, context = {}) {
        const textLower = text.toLowerCase();
        let response = null;
        
        // Check for card recognition first if image is present
        if (context.hasImage && (this.detectActualPull(textLower) || this.detectCollection(textLower))) {
            try {
                const recognition = await this.cardRecognition.identifyCard(context.imageUrl, text);
                if (recognition.identified || recognition.confidence > 0.5) {
                    const cardResponse = await this.cardRecognition.generateCardResponse(recognition, {
                        mentionsGrading: text.includes('grade') || text.includes('psa')
                    });
                    if (cardResponse && cardResponse !== "nice card") {
                        console.log(`   🎯 [Card ID] Recognized card in image`);
                        response = cardResponse;
                        // Apply human touch and continue with memory
                        response = this.addHumanTouch(response, text.includes('!'));
                        this.memory.rememberResponse(response);
                        if (context.username) {
                            this.conversations.rememberInteraction(context.username, text, response, context);
                        }
                        return response;
                    }
                }
            } catch (error) {
                // Fall through to normal response generation
            }
        }
        
        // Check for conversation context if username provided
        if (context.username) {
            const contextualResponse = this.conversations.getContextualResponse(context.username, text);
            if (contextualResponse) {
                console.log(`   🧠 [Context] Using conversation memory for @${context.username}`);
                response = contextualResponse;
                // Still apply human touch and memory
                response = this.addHumanTouch(response, text.includes('!'));
                this.memory.rememberResponse(response);
                this.conversations.rememberInteraction(context.username, text, response, context);
                return response;
            }
        }
        
        // Match the energy level
        const hasExcitement = text.includes('!') || text.includes('🔥') || text.includes('😭');
        const isQuestion = text.includes('?');
        
        // IMPORTANT: Check specific questions first to give helpful answers
        if (isQuestion) {
            // Specific question types need specific answers
            if (this.detectGradingQuestion(textLower)) {
                response = this.pickRandom(this.responses.gradingAdvice);
            }
            else if (this.detectValueQuestion(textLower)) {
                response = this.pickRandom(this.responses.valueResponse);
            }
            else if (this.detectStoreQuestion(textLower)) {
                response = this.pickRandom(this.responses.storeHelp);
            }
            else if (this.detectInvestmentQuestion(textLower)) {
                response = this.pickRandom(this.responses.investmentTalk);
            }
            else if (this.detectAuthenticity(textLower)) {
                response = this.pickRandom(this.responses.fakeCheck);
            }
            else if (textLower.includes('pull rate') || 
                     (textLower.includes('rate') && textLower.includes('alt')) ||
                     (textLower.includes("what's the") && textLower.includes('rate'))) {
                response = "crown zenith is like 1:150ish for alt arts";
            }
            else if (this.detectSetComparison(textLower)) {
                response = this.pickRandom(this.responses.setComparison);
            }
            else if (this.detectCollectionQuestion(textLower)) {
                response = this.pickRandom(this.responses.collectionResponse);
            }
            else if ((textLower.includes('what set') && textLower.includes('first')) || 
                     (textLower.includes('starting') && textLower.includes('what set'))) {
                response = "151 or crown zenith good starter sets";
            }
            else if (textLower.includes('good deal')) {
                response = "thats actually decent yeah";
            }
            else {
                // Generic question - ask back or give agreement
                if (Math.random() < 0.6) {
                    response = this.pickRandom(this.responses.questions);
                } else {
                    response = this.pickRandom(this.responses.agreement);
                }
            }
        }
        // Then check for statements/exclamations - BE MORE SPECIFIC
        else if (this.detectAmazingPull(textLower)) {
            response = this.pickRandom(this.responses.amazingPull);
        }
        else if (this.detectActualPull(textLower)) {
            response = this.pickRandom(this.responses.goodPull);
        }
        else if (this.detectCollection(textLower)) {
            response = this.pickRandom(this.responses.collectionResponse);
        }
        else if (this.detectMailDay(textLower)) {
            response = this.pickRandom(this.responses.mailDay);
        }
        else if (this.detectSale(textLower)) {
            response = this.pickRandom(this.responses.saleResponse);
        }
        else if (this.detectBadLuck(textLower)) {
            response = this.pickRandom(this.responses.badLuck);
        }
        else {
            // Default reactions - be more conservative
            if (hasExcitement && this.detectActualPull(textLower)) {
                response = this.pickRandom(this.responses.goodPull);
            } else if (hasExcitement) {
                response = this.pickRandom(this.responses.agreement);
            } else {
                // Safe default responses
                const safeResponses = [...this.responses.agreement, ...this.responses.questions];
                response = this.pickRandom(safeResponses);
            }
        }
        
        // Apply human imperfections
        if (response) {
            response = this.addHumanTouch(response, hasExcitement);
            
            // Check for repetition and get alternative if needed
            if (this.memory.isResponseTooSimilar(response)) {
                const categoryResponses = this.getCategoryResponses(textLower, isQuestion);
                response = this.memory.getAlternativeResponse(response, categoryResponses);
            }
            
            // Remember this response
            this.memory.rememberResponse(response);
            
            // Remember the conversation if username provided
            if (context.username) {
                this.conversations.rememberInteraction(context.username, text, response, context);
            }
        }
        
        return response || "nice";
    }
    
    // Detection methods
    detectAmazingPull(text) {
        const amazingCards = ['charizard', 'moonbreon', 'umbreon vmax', 'lugia alt', 'giratina alt'];
        const amazingWords = ['insane', 'crazy', 'holy', 'omg', 'chase', 'grail'];
        
        return amazingCards.some(card => text.includes(card)) || 
               amazingWords.some(word => text.includes(word));
    }
    
    detectActualPull(text) {
        // Only true pulls, not general statements
        const pullWords = ['pulled', 'pull this', 'pack pulled', 'hit this', 'opened and got'];
        const packWords = ['pack', 'booster', 'box'];
        
        const hasPullWord = pullWords.some(word => text.includes(word));
        const hasPackContext = packWords.some(word => text.includes(word)) && 
                              (text.includes('from') || text.includes('got'));
        
        return hasPullWord || hasPackContext;
    }
    
    detectCollection(text) {
        const collectionWords = ['my collection', 'my setup', 'my display', 'my binder', 'completed', 
                               'look at my', 'check out my', 'rate my'];
        return collectionWords.some(word => text.includes(word)) && 
               !this.detectMailDay(text) && !this.detectActualPull(text);
    }
    
    detectCollectionQuestion(text) {
        return this.detectCollection(text) && text.includes('?');
    }
    
    detectGradingQuestion(text) {
        return (text.includes('grad') || text.includes('psa') || text.includes('bgs') || 
                text.includes('cgc')) && text.includes('?');
    }
    
    detectValueQuestion(text) {
        return (text.includes('worth') || text.includes('value') || text.includes('price') || 
                text.includes('how much')) && text.includes('?');
    }
    
    detectStoreQuestion(text) {
        return (text.includes('where') || text.includes('find') || text.includes('stock') || 
                text.includes('store')) && text.includes('?');
    }
    
    detectInvestmentQuestion(text) {
        return text.includes('invest') || text.includes('hold') || 
               (text.includes('sealed') && text.includes('?'));
    }
    
    detectMailDay(text) {
        return text.includes('mail day') || text.includes('mailday') || 
               (text.includes('arrived') && !text.includes('?')) || 
               text.includes('came in') || text.includes('package');
    }
    
    detectSale(text) {
        return text.includes('wts') || text.includes('for sale') || 
               text.includes('fs') || text.includes('selling');
    }
    
    detectAuthenticity(text) {
        return (text.includes('fake') || text.includes('real') || 
                text.includes('legit')) && text.includes('?');
    }
    
    detectBadLuck(text) {
        return text.includes('worst') || text.includes('terrible') || 
               text.includes('no hits') || text.includes('bad') || text.includes('bulk');
    }
    
    detectSetComparison(text) {
        const sets = ['surging sparks', 'stellar crown', 'paradox rift', 'crown zenith', 
                      'evolving skies', '151', 'obsidian flames'];
        const compareWords = ['which', 'better', 'vs', 'or'];
        
        const hasSet = sets.some(set => text.includes(set));
        const hasCompare = compareWords.some(word => text.includes(word));
        
        return hasSet && hasCompare;
    }
    
    // Add human imperfections
    addHumanTouch(response, matchEnergy = false) {
        // Sometimes make typos (20% chance)
        if (Math.random() < 0.2) {
            response = this.addTypo(response);
        }
        
        // Sometimes double punctuation when excited
        if (matchEnergy && Math.random() < 0.5) {
            if (!response.includes('!') && !response.includes('?')) {
                response += '!!';
            }
        }
        
        // Sometimes no punctuation at all (30% chance)
        if (Math.random() < 0.3 && !response.includes('?')) {
            response = response.replace(/[.!]+$/, '');
        }
        
        // Add emoji if this personality uses them
        if (this.emojiPersonality && Math.random() < 0.3) {
            const emojis = ['🔥', '👀', '😭', '💯', '📈', '🎯', '✨'];
            response += ' ' + this.pickRandom(emojis);
        }
        
        return response;
    }
    
    addTypo(text) {
        const words = text.split(' ');
        if (words.length > 3 && Math.random() < 0.3) {
            // Replace one word with common shortcut
            const wordIndex = Math.floor(Math.random() * words.length);
            const word = words[wordIndex].toLowerCase();
            
            if (this.typos[word]) {
                words[wordIndex] = this.pickRandom(this.typos[word]);
            }
        }
        return words.join(' ');
    }
    
    pickRandom(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
    
    // Get responses from the appropriate category for alternatives
    getCategoryResponses(textLower, isQuestion) {
        if (isQuestion) {
            if (this.detectGradingQuestion(textLower)) {
                return this.responses.gradingAdvice;
            }
            if (this.detectValueQuestion(textLower)) {
                return this.responses.valueResponse;
            }
            if (this.detectStoreQuestion(textLower)) {
                return this.responses.storeHelp;
            }
            if (this.detectInvestmentQuestion(textLower)) {
                return this.responses.investmentTalk;
            }
            if (this.detectAuthenticity(textLower)) {
                return this.responses.fakeCheck;
            }
            if (this.detectSetComparison(textLower)) {
                return this.responses.setComparison;
            }
            if (this.detectCollectionQuestion(textLower)) {
                return this.responses.collectionResponse;
            }
            return [...this.responses.questions, ...this.responses.agreement];
        } else {
            if (this.detectAmazingPull(textLower)) {
                return this.responses.amazingPull;
            }
            if (this.detectActualPull(textLower)) {
                return this.responses.goodPull;
            }
            if (this.detectCollection(textLower)) {
                return this.responses.collectionResponse;
            }
            if (this.detectMailDay(textLower)) {
                return this.responses.mailDay;
            }
            if (this.detectSale(textLower)) {
                return this.responses.saleResponse;
            }
            if (this.detectBadLuck(textLower)) {
                return this.responses.badLuck;
            }
            return [...this.responses.agreement, ...this.responses.questions];
        }
    }
    
    // Get memory stats for debugging
    getMemoryStats() {
        return this.memory.getStats();
    }
    
    // Get conversation stats
    getConversationStats() {
        return this.conversations.getStats();
    }
    
    // Check if we've met a user before
    hasMetUser(username) {
        return this.conversations.hasMetUser(username);
    }
    
    // Get card recognition stats
    getCardStats() {
        return this.cardRecognition.getStats();
    }
    
    // Synchronous wrapper for compatibility
    generateHumanResponseSync(text, context = {}) {
        // For backward compatibility when async is not needed
        return this.generateHumanResponse(text, context);
    }
}

module.exports = HumanLikeResponses;