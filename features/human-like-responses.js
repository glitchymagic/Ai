// Ultra Human-Like Response Generator
// Makes responses indistinguishable from real collectors

class HumanLikeResponses {
    constructor() {
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
            
            // Value questions - rough estimates
            valueResponse: [
                "last i checked like $80-100ish",
                "seen em go for around 150 recently",
                "depends but prob 200+ raw",
                "tcgplayer has it at like $75",
                "fluctuates but 100-120 range",
                "raw? maybe 50.. graded way more",
                "market been weird but id say 80ish",
                "checked yesterday was like $90",
                "trending up.. saw one sell for 140",
                "60-80 depending on condition"
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
    
    generateHumanResponse(text, context = {}) {
        const textLower = text.toLowerCase();
        let response = null;
        
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
            else if (this.detectSetComparison(textLower)) {
                response = this.pickRandom(this.responses.setComparison);
            }
            else if (textLower.includes('pull rate')) {
                response = "crown zenith is like 1:150ish for alt arts";
            }
            else if (textLower.includes('what set') && textLower.includes('first')) {
                response = "151 or crown zenith good starter sets";
            }
            else if (textLower.includes('good deal')) {
                response = "thats actually decent yeah";
            }
            else {
                // Generic question - sometimes answer, sometimes ask back
                if (Math.random() < 0.5) {
                    response = this.pickRandom(this.responses.questions);
                } else {
                    response = this.pickRandom(this.responses.agreement);
                }
            }
        }
        // Then check for statements/exclamations
        else if (this.detectAmazingPull(textLower)) {
            response = this.pickRandom(this.responses.amazingPull);
        }
        else if (this.detectPull(textLower)) {
            response = this.pickRandom(this.responses.goodPull);
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
            // Default reactions
            if (hasExcitement) {
                response = this.pickRandom([...this.responses.amazingPull, ...this.responses.goodPull]);
            } else {
                // Mix of reactions and questions
                if (Math.random() < 0.3) {
                    response = this.pickRandom(this.responses.questions);
                } else {
                    response = this.pickRandom([...this.responses.goodPull, ...this.responses.agreement]);
                }
            }
        }
        
        // Apply human imperfections
        if (response) {
            response = this.addHumanTouch(response, hasExcitement);
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
    
    detectPull(text) {
        return text.includes('pull') || text.includes('got') || text.includes('hit') || 
               text.includes('opened') || text.includes('pack');
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
               text.includes('arrived') || text.includes('came in');
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
}

module.exports = HumanLikeResponses;