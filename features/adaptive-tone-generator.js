// Adaptive Tone Generator - Matches response energy to context
class AdaptiveToneGenerator {
    constructor() {
        // Response templates by emotion and context
        this.toneTemplates = {
            excited: {
                tcg: [
                    "{pokemon} PULLS ARE INSANE! that's the one everyone's chasing rn",
                    "YO {action} {pokemon}?? that's actually crazy! huge W",
                    "LETS GOOO! {pokemon} from {set} is such a banger pull",
                    "no wayyyy you {action} that! {pokemon} is straight fire 🔥"
                ],
                videoGame: [
                    "YOOO shiny {pokemon}! that's wild, how many resets?",
                    "{pokemon} shiny is GOATED! the grind paid off fr",
                    "BRO that's insane! shiny hunting {pokemon} is no joke"
                ],
                general: [
                    "this is HYPE! {pokemon} always hits different",
                    "LETS GO! love seeing {pokemon} get the respect",
                    "yo this energy is everything! {pokemon} gang rise up"
                ]
            },
            happy: {
                tcg: [
                    "nice {action}! {pokemon} is such a solid card",
                    "love to see it! {pokemon} from {set} is a great addition",
                    "that's awesome! {pokemon} definitely a keeper",
                    "sweet {action}! {pokemon} looking clean"
                ],
                videoGame: [
                    "nice work! {pokemon} is always a solid choice",
                    "love that team comp! {pokemon} puts in work",
                    "good stuff! {pokemon} gameplay looking smooth"
                ],
                general: [
                    "this is nice! {pokemon} appreciation always welcome",
                    "good vibes! {pokemon} content hits right",
                    "love this! {pokemon} stays winning"
                ]
            },
            curious: {
                tcg: [
                    "interesting! what made you go for {pokemon}? the {set} print is solid",
                    "{pokemon} is a sleeper pick imo. what's your take on the market?",
                    "hmm {pokemon} from {set}... you thinking grade or raw?",
                    "curious about {pokemon} - seeing any movement on prices?"
                ],
                videoGame: [
                    "interesting strat with {pokemon}! what's the moveset?",
                    "{pokemon} is underrated fr. what nature you running?",
                    "ooh {pokemon} choice is spicy! competitive or casual?"
                ],
                general: [
                    "what got you into {pokemon}? always curious about favorites",
                    "interesting take! why {pokemon} specifically?",
                    "{pokemon} hits different for everyone. what's your connection?"
                ]
            },
            disappointed: {
                tcg: [
                    "ah rough, but {pokemon} will bounce back. market's just weird rn",
                    "feel you on that. {pokemon} deserves better tbh",
                    "yeah {set} QC has been rough. but when {pokemon} hits, it hits",
                    "market's sleeping on {pokemon} fr. patience will pay off"
                ],
                videoGame: [
                    "RNG can be brutal with {pokemon}. keep grinding!",
                    "felt that. {pokemon} can be tough but worth it",
                    "yeah {pokemon} battles can go sideways quick. next one!"
                ],
                general: [
                    "i feel you. {pokemon} deserves more love",
                    "yeah that's tough. but {pokemon} community got you",
                    "happens to the best of us. {pokemon} gang stays strong"
                ]
            },
            neutral: {
                tcg: [
                    "{pokemon} from {set} is solid. {product} treating you well?",
                    "nice {pokemon}! how's the {set} pull rates been?",
                    "{action} {pokemon} is always good. centering looking decent?",
                    "{pokemon} is a classic. {set} or base set?"
                ],
                videoGame: [
                    "{pokemon} gameplay looking good! scarlet/violet?",
                    "solid {pokemon} choice. how's the team synergy?",
                    "{pokemon} always reliable. competitive scene?"
                ],
                general: [
                    "{pokemon} content always welcome! what's next?",
                    "nice {pokemon} post! been a fan long?",
                    "{pokemon} stays relevant. what's your history with it?"
                ]
            }
        };
        
        // Energy levels for different contexts
        this.energyLevels = {
            excited: { min: 0.8, max: 1.0, emojis: ['🔥', '🚀', '💯', '⚡'] },
            happy: { min: 0.6, max: 0.8, emojis: ['✨', '💪', '🎯'] },
            curious: { min: 0.4, max: 0.6, emojis: ['🤔', '👀'] },
            disappointed: { min: 0.3, max: 0.5, emojis: ['💭', '🤝'] },
            neutral: { min: 0.5, max: 0.7, emojis: [] }
        };
    }
    
    generateResponse(contextAnalysis, details, strategy) {
        // Determine primary emotion
        const emotion = details.emotions?.[0] || 'neutral';
        const context = contextAnalysis.primary;
        
        // Get appropriate template set
        const templates = this.toneTemplates[emotion]?.[context] || 
                         this.toneTemplates[emotion]?.general ||
                         this.toneTemplates.neutral.general;
        
        // Pick random template
        const template = templates[Math.floor(Math.random() * templates.length)];
        
        // Fill in template variables
        let response = template;
        
        // Replace {pokemon} with actual Pokemon or generic
        if (details.pokemon?.length > 0) {
            response = response.replace('{pokemon}', details.pokemon[0]);
        } else {
            response = response.replace('{pokemon}', 'that');
        }
        
        // Replace {action}
        if (details.actions?.length > 0) {
            response = response.replace('{action}', details.actions[0]);
        } else {
            response = response.replace('{action}', 'got');
        }
        
        // Replace {set}
        if (details.sets?.length > 0) {
            response = response.replace('{set}', details.sets[0]);
        } else {
            response = response.replace('{set}', 'the set');
        }
        
        // Replace {product}
        if (details.products?.length > 0) {
            response = response.replace('{product}', details.products[0]);
        } else {
            response = response.replace('{product}', 'packs');
        }
        
        // Add emoji based on energy level (sometimes)
        const energy = this.energyLevels[emotion];
        if (energy.emojis.length > 0 && Math.random() < 0.3) {
            const emoji = energy.emojis[Math.floor(Math.random() * energy.emojis.length)];
            response = response.replace('🔥', emoji); // Replace placeholder or add
        }
        
        return {
            response,
            tone: emotion,
            energy: (energy.min + energy.max) / 2,
            context: context
        };
    }
    
    // Adjust response length based on context
    adjustResponseLength(response, platform = 'twitter') {
        const maxLengths = {
            twitter: 280,
            reddit: 1000,
            discord: 2000
        };
        
        const maxLength = maxLengths[platform] || 280;
        
        if (response.length <= maxLength) return response;
        
        // Smart truncation - try to end at punctuation
        const truncated = response.substring(0, maxLength - 3);
        const lastPunctuation = Math.max(
            truncated.lastIndexOf('.'),
            truncated.lastIndexOf('!'),
            truncated.lastIndexOf('?')
        );
        
        if (lastPunctuation > maxLength * 0.7) {
            return truncated.substring(0, lastPunctuation + 1);
        }
        
        // Fallback - end at last space
        const lastSpace = truncated.lastIndexOf(' ');
        return truncated.substring(0, lastSpace) + '...';
    }
}

module.exports = AdaptiveToneGenerator;