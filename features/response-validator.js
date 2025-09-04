// Response Validator - Ensures bot responses match vision analysis results
class ResponseValidator {
    constructor() {
        this.cardMentionPatterns = [
            /\b(that|this|the)\s+card/i,
            /\bnice\s+card/i,
            /\bsick\s+card/i,
            /\bcard['']s\s+(fire|sick|amazing)/i,
            /\b(pulled|got)\s+a?\s*\w*\s*card/i
        ];
    }
    
    // Validate response against vision results
    validateResponse(response, visualData) {
        const issues = [];
        const visionResult = visualData?.visionAnalysis;
        
        if (!visionResult?.analyzed) {
            // No vision analysis, can't validate
            return { valid: true, issues: [], suggestions: [] };
        }
        
        // Check if response mentions cards when none were detected
        if (visionResult.cards?.length === 0 && !visionResult.isEventPoster) {
            const mentionsCard = this.cardMentionPatterns.some(pattern => pattern.test(response));
            
            if (mentionsCard) {
                issues.push({
                    type: 'FALSE_CARD_MENTION',
                    message: 'Response mentions cards but none were detected in image',
                    severity: 'high'
                });
            }
        }
        
        // Check if response mentions the specific cards that were detected
        if (visionResult.cards?.length > 0) {
            const detectedCards = visionResult.cards.map(c => c.name.toLowerCase());
            const responseLower = response.toLowerCase();
            
            const mentionedCards = detectedCards.filter(cardName => {
                // Check for exact or partial matches
                const parts = cardName.split(/[&\s]+/);
                return parts.some(part => part.length > 3 && responseLower.includes(part.toLowerCase()));
            });
            
            if (mentionedCards.length === 0) {
                issues.push({
                    type: 'MISSING_CARD_MENTION',
                    message: `Response doesn't mention detected cards: ${detectedCards.join(', ')}`,
                    severity: 'high',
                    detectedCards
                });
            }
        }
        
        // Check event poster responses
        if (visionResult.isEventPoster) {
            const mentionsCard = this.cardMentionPatterns.some(pattern => pattern.test(response));
            
            if (mentionsCard) {
                issues.push({
                    type: 'CARD_MENTION_IN_EVENT',
                    message: 'Response mentions cards for an event poster',
                    severity: 'medium'
                });
            }
        }
        
        return {
            valid: issues.length === 0,
            issues,
            suggestions: this.generateSuggestions(issues, visionResult)
        };
    }
    
    // Generate suggestions to fix issues
    generateSuggestions(issues, visionResult) {
        const suggestions = [];
        
        issues.forEach(issue => {
            if (issue.type === 'FALSE_CARD_MENTION') {
                suggestions.push({
                    type: 'REMOVE_CARD_MENTION',
                    suggestion: 'Remove mentions of cards and focus on the actual content shown'
                });
            } else if (issue.type === 'MISSING_CARD_MENTION') {
                suggestions.push({
                    type: 'ADD_CARD_MENTION',
                    suggestion: `Mention the specific cards: ${issue.detectedCards.join(', ')}`,
                    cards: issue.detectedCards
                });
            } else if (issue.type === 'CARD_MENTION_IN_EVENT') {
                suggestions.push({
                    type: 'FOCUS_ON_EVENT',
                    suggestion: 'Focus on the tournament/event details instead of cards'
                });
            }
        });
        
        return suggestions;
    }
    
    // Attempt to fix a response based on validation issues
    fixResponse(response, issues, visionResult) {
        let fixedResponse = response;
        
        issues.forEach(issue => {
            if (issue.type === 'FALSE_CARD_MENTION') {
                // Remove generic card mentions
                this.cardMentionPatterns.forEach(pattern => {
                    fixedResponse = fixedResponse.replace(pattern, 'that');
                });
                // Clean up
                fixedResponse = fixedResponse.replace(/\bthat\s+is/, 'that\'s');
                fixedResponse = fixedResponse.replace(/\bthat\s+🔥/, 'that\'s 🔥');
            } else if (issue.type === 'MISSING_CARD_MENTION' && issue.detectedCards?.length > 0) {
                // Try to add the card name
                const cardName = issue.detectedCards[0];
                if (fixedResponse.includes('that')) {
                    fixedResponse = fixedResponse.replace(/\bthat\b/, `that ${cardName}`);
                } else if (fixedResponse.includes('card')) {
                    fixedResponse = fixedResponse.replace(/\bcard\b/, cardName);
                }
            }
        });
        
        return fixedResponse;
    }
}

module.exports = ResponseValidator;