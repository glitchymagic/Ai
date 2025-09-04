// Narrative Detector - Correlates signals from Reddit and Twitter KOLs
// Identifies emerging narratives and market movements

const fs = require('fs').promises;
const path = require('path');

class NarrativeDetector {
    constructor(redditMonitor, kolMonitor) {
        this.redditMonitor = redditMonitor;
        this.kolMonitor = kolMonitor;
        this.dataPath = path.join(__dirname, '../data');
        
        // Narrative strength thresholds
        this.thresholds = {
            weak: 0.3,
            moderate: 0.5,
            strong: 0.7,
            critical: 0.85
        };
        
        // Cross-platform correlation weights
        this.correlationWeights = {
            redditOnly: 0.6,
            kolOnly: 0.7,
            both: 1.5,  // Multiplier when both platforms agree
            timing: 0.2  // Bonus for temporal correlation
        };
        
        // Narrative types and their market implications
        this.narrativeTypes = {
            accumulation: {
                signals: ['undervalued', 'marketSentiment', 'fomo'],
                action: 'bullish',
                confidence: 0.8
            },
            supply_shock: {
                signals: ['supplyShock', 'supplyNews', 'sold out'],
                action: 'urgent',
                confidence: 0.9
            },
            price_discovery: {
                signals: ['priceMovement', 'priceDiscovery', 'worth'],
                action: 'volatile',
                confidence: 0.7
            },
            quality_focus: {
                signals: ['grading', 'psa 10', 'population'],
                action: 'premium',
                confidence: 0.75
            },
            tournament_meta: {
                signals: ['tournament', 'competitive', 'meta'],
                action: 'gameplay',
                confidence: 0.65
            },
            bearish_turn: {
                signals: ['bearish', 'overvalued', 'bubble'],
                action: 'caution',
                confidence: 0.7
            }
        };
        
        // Historical narrative performance
        this.narrativeHistory = new Map();
        this.predictionAccuracy = new Map();
    }
    
    // Detect narratives by correlating Reddit and KOL signals
    async detectNarratives() {
        console.log('🔍 Detecting cross-platform narratives...');
        
        try {
            // Get latest signals from both platforms
            const redditNarratives = await this.redditMonitor.getTopNarratives(20);
            const kolSignals = this.kolMonitor ? await this.kolMonitor.getRecentSignals(20) : [];
            
            // Convert to maps for easier correlation
            const redditMap = this.createCardMap(redditNarratives, 'reddit');
            const kolMap = this.createCardMap(kolSignals, 'kol');
            
            // Find correlations
            const correlatedNarratives = this.correlateSignals(redditMap, kolMap);
            
            // Classify narrative types
            const classifiedNarratives = this.classifyNarratives(correlatedNarratives);
            
            // Generate actionable insights
            const insights = this.generateInsights(classifiedNarratives);
            
            // Save narratives
            await this.saveNarratives(insights);
            
            return insights;
            
        } catch (error) {
            console.error('Error detecting narratives:', error);
            return [];
        }
    }
    
    // Create card-based map from signals
    createCardMap(signals, source) {
        const map = new Map();
        
        for (const signal of signals) {
            const cards = source === 'reddit' ? [signal.card] : signal.cards;
            
            for (const card of cards) {
                if (!map.has(card)) {
                    map.set(card, {
                        card,
                        sources: {},
                        patterns: new Map(),
                        strength: 0,
                        firstSeen: Date.now(),
                        mentions: 0
                    });
                }
                
                const entry = map.get(card);
                entry.sources[source] = signal;
                entry.strength += signal.totalStrength || signal.strength || 0;
                entry.mentions += 1;
                
                // Aggregate patterns
                const patterns = source === 'reddit' 
                    ? signal.patterns 
                    : signal.patterns.map(p => ({ type: p.type, strength: p.strength }));
                    
                if (patterns) {
                    for (const [pattern, strength] of Object.entries(patterns)) {
                        const current = entry.patterns.get(pattern) || 0;
                        entry.patterns.set(pattern, current + (strength || 1));
                    }
                }
            }
        }
        
        return map;
    }
    
    // Correlate signals from different platforms
    correlateSignals(redditMap, kolMap) {
        const correlated = [];
        const allCards = new Set([...redditMap.keys(), ...kolMap.keys()]);
        
        for (const card of allCards) {
            const reddit = redditMap.get(card);
            const kol = kolMap.get(card);
            
            let narrative = {
                card,
                platforms: [],
                totalStrength: 0,
                correlation: 1.0,
                patterns: new Map(),
                evidence: []
            };
            
            // Calculate platform presence and correlation
            if (reddit && kol) {
                // Both platforms - strong correlation
                narrative.platforms = ['reddit', 'twitter'];
                narrative.totalStrength = (reddit.strength + kol.strength) * this.correlationWeights.both;
                narrative.correlation = this.correlationWeights.both;
                
                // Check temporal correlation (how close in time)
                const timeDiff = Math.abs(
                    (reddit.sources.reddit.detectedAt || Date.now()) - 
                    (kol.sources.kol.detectedAt || Date.now())
                );
                const hoursDiff = timeDiff / (1000 * 60 * 60);
                
                if (hoursDiff < 24) {
                    narrative.totalStrength *= (1 + this.correlationWeights.timing);
                    narrative.correlation += this.correlationWeights.timing;
                }
                
                // Combine patterns
                for (const [pattern, strength] of reddit.patterns) {
                    narrative.patterns.set(pattern, strength);
                }
                for (const [pattern, strength] of kol.patterns) {
                    const current = narrative.patterns.get(pattern) || 0;
                    narrative.patterns.set(pattern, current + strength);
                }
                
                // Add evidence
                narrative.evidence.push({
                    type: 'reddit',
                    posts: reddit.sources.reddit.posts?.length || 1,
                    momentum: reddit.sources.reddit.momentum || 0
                });
                narrative.evidence.push({
                    type: 'twitter',
                    kols: kol.sources.kol.kolCount || 1,
                    influence: kol.sources.kol.avgStrength || 0
                });
                
            } else if (reddit) {
                // Reddit only
                narrative.platforms = ['reddit'];
                narrative.totalStrength = reddit.strength * this.correlationWeights.redditOnly;
                narrative.correlation = this.correlationWeights.redditOnly;
                narrative.patterns = reddit.patterns;
                narrative.evidence.push({
                    type: 'reddit',
                    posts: reddit.sources.reddit.posts?.length || 1,
                    momentum: reddit.sources.reddit.momentum || 0
                });
                
            } else if (kol) {
                // Twitter KOL only
                narrative.platforms = ['twitter'];
                narrative.totalStrength = kol.strength * this.correlationWeights.kolOnly;
                narrative.correlation = this.correlationWeights.kolOnly;
                narrative.patterns = kol.patterns;
                narrative.evidence.push({
                    type: 'twitter',
                    kols: kol.sources.kol.kolCount || 1,
                    influence: kol.sources.kol.avgStrength || 0
                });
            }
            
            // Normalize strength
            narrative.totalStrength = Math.min(narrative.totalStrength, 1.0);
            
            correlated.push(narrative);
        }
        
        // Sort by total strength
        return correlated.sort((a, b) => b.totalStrength - a.totalStrength);
    }
    
    // Classify narratives into actionable types
    classifyNarratives(narratives) {
        const classified = [];
        
        for (const narrative of narratives) {
            let bestMatch = null;
            let bestScore = 0;
            
            // Check each narrative type
            for (const [typeName, typeConfig] of Object.entries(this.narrativeTypes)) {
                let score = 0;
                let matchedSignals = [];
                
                // Check how many signals match
                for (const signal of typeConfig.signals) {
                    if (narrative.patterns.has(signal)) {
                        score += narrative.patterns.get(signal);
                        matchedSignals.push(signal);
                    }
                }
                
                // Weight by confidence
                score *= typeConfig.confidence;
                
                if (score > bestScore) {
                    bestScore = score;
                    bestMatch = {
                        type: typeName,
                        action: typeConfig.action,
                        confidence: typeConfig.confidence,
                        matchedSignals
                    };
                }
            }
            
            // Add classification
            classified.push({
                ...narrative,
                classification: bestMatch,
                actionability: this.calculateActionability(narrative, bestMatch)
            });
        }
        
        return classified;
    }
    
    // Calculate how actionable a narrative is
    calculateActionability(narrative, classification) {
        let score = narrative.totalStrength;
        
        // Platform correlation bonus
        if (narrative.platforms.length > 1) {
            score *= 1.2;
        }
        
        // Evidence quality
        const redditEvidence = narrative.evidence.find(e => e.type === 'reddit');
        const twitterEvidence = narrative.evidence.find(e => e.type === 'twitter');
        
        if (redditEvidence && redditEvidence.momentum > 0.2) {
            score *= 1.1;
        }
        
        if (twitterEvidence && twitterEvidence.kols > 2) {
            score *= 1.15;
        }
        
        // Classification confidence
        if (classification) {
            score *= classification.confidence;
        }
        
        // Determine tier
        if (score >= this.thresholds.critical) return 'critical';
        if (score >= this.thresholds.strong) return 'strong';
        if (score >= this.thresholds.moderate) return 'moderate';
        return 'weak';
    }
    
    // Generate actionable insights from narratives
    generateInsights(narratives) {
        const insights = [];
        const timestamp = Date.now();
        
        // Only include actionable narratives
        const actionable = narratives.filter(n => 
            n.actionability === 'strong' || n.actionability === 'critical'
        );
        
        for (const narrative of actionable) {
            const insight = {
                id: `NARR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                timestamp,
                card: narrative.card,
                strength: narrative.totalStrength,
                actionability: narrative.actionability,
                platforms: narrative.platforms,
                classification: narrative.classification,
                
                // Generate human-readable summary
                summary: this.generateSummary(narrative),
                
                // Suggested bot action
                suggestedAction: this.suggestAction(narrative),
                
                // Evidence for transparency
                evidence: narrative.evidence,
                
                // Track for accuracy
                prediction: this.generatePrediction(narrative)
            };
            
            insights.push(insight);
        }
        
        return insights;
    }
    
    // Generate human-readable summary
    generateSummary(narrative) {
        const { card, platforms, classification, totalStrength } = narrative;
        
        let summary = `${card}: `;
        
        // Platform description
        if (platforms.length > 1) {
            summary += 'Cross-platform narrative detected. ';
        } else {
            summary += `${platforms[0] === 'reddit' ? 'Reddit community' : 'Twitter influencers'} discussing. `;
        }
        
        // Classification description
        if (classification) {
            switch (classification.type) {
                case 'accumulation':
                    summary += 'Smart money appears to be accumulating. Undervaluation narrative building.';
                    break;
                case 'supply_shock':
                    summary += 'Supply shortage reported. FOMO potential high.';
                    break;
                case 'price_discovery':
                    summary += 'Active price discovery phase. Volatility expected.';
                    break;
                case 'quality_focus':
                    summary += 'Grading/quality discussion intensifying. Premium prices for PSA 10s.';
                    break;
                case 'tournament_meta':
                    summary += 'Tournament play driving interest. Competitive demand increasing.';
                    break;
                case 'bearish_turn':
                    summary += 'Bearish sentiment emerging. Potential correction ahead.';
                    break;
                default:
                    summary += 'Significant discussion and interest building.';
            }
        }
        
        // Strength indicator
        summary += ` Signal strength: ${(totalStrength * 100).toFixed(0)}%`;
        
        return summary;
    }
    
    // Suggest action for the bot
    suggestAction(narrative) {
        const { classification, actionability, platforms } = narrative;
        
        const action = {
            type: 'monitor', // monitor, engage, alert, post
            priority: actionability,
            targets: []
        };
        
        // Determine action type
        if (actionability === 'critical') {
            action.type = 'alert';
            action.message = `🚨 CRITICAL SIGNAL: ${narrative.card}`;
        } else if (actionability === 'strong') {
            action.type = 'engage';
            action.message = `Strong narrative building around ${narrative.card}`;
        }
        
        // Add platform-specific targets
        if (platforms.includes('twitter')) {
            action.targets.push({
                platform: 'twitter',
                action: 'reply_to_discussions',
                keywords: [narrative.card.toLowerCase()]
            });
        }
        
        if (platforms.includes('reddit')) {
            action.targets.push({
                platform: 'reddit',
                action: 'monitor_threads',
                subreddits: ['PokemonTCG', 'PokeInvesting']
            });
        }
        
        return action;
    }
    
    // Generate trackable prediction
    generatePrediction(narrative) {
        const { card, classification, totalStrength } = narrative;
        
        const prediction = {
            id: `PRED-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            card,
            type: classification?.action || 'neutral',
            confidence: totalStrength,
            madeAt: Date.now(),
            timeframe: '72h'
        };
        
        // Make specific predictions based on narrative type
        if (classification) {
            switch (classification.action) {
                case 'bullish':
                    prediction.target = 'price_increase';
                    prediction.range = `${(5 * totalStrength).toFixed(0)}-${(15 * totalStrength).toFixed(0)}%`;
                    break;
                case 'urgent':
                    prediction.target = 'supply_exhaustion';
                    prediction.range = 'within 48h';
                    break;
                case 'volatile':
                    prediction.target = 'high_volume';
                    prediction.range = '2x normal volume';
                    break;
                case 'bearish':
                    prediction.target = 'price_decrease';
                    prediction.range = `${(5 * totalStrength).toFixed(0)}-${(10 * totalStrength).toFixed(0)}%`;
                    break;
            }
        }
        
        // Store for accuracy tracking
        this.predictionAccuracy.set(prediction.id, prediction);
        
        return prediction;
    }
    
    // Save narratives to disk
    async saveNarratives(insights) {
        const filePath = path.join(this.dataPath, 'detected-narratives.json');
        
        try {
            // Load existing if any
            let existing = { narratives: [], history: [] };
            try {
                const data = await fs.readFile(filePath, 'utf8');
                existing = JSON.parse(data);
            } catch (e) {
                // File doesn't exist yet
            }
            
            // Add new narratives
            existing.narratives = insights;
            existing.lastUpdate = new Date().toISOString();
            
            // Keep history (last 100)
            existing.history.push(...insights.map(i => ({
                id: i.id,
                card: i.card,
                timestamp: i.timestamp,
                strength: i.strength,
                prediction: i.prediction
            })));
            
            if (existing.history.length > 100) {
                existing.history = existing.history.slice(-100);
            }
            
            await fs.writeFile(filePath, JSON.stringify(existing, null, 2));
            console.log(`✅ Saved ${insights.length} narratives`);
            
        } catch (error) {
            console.error('Error saving narratives:', error);
        }
    }
    
    // Get current narratives for bot to use
    async getCurrentNarratives(minActionability = 'moderate') {
        const filePath = path.join(this.dataPath, 'detected-narratives.json');
        
        try {
            const data = await fs.readFile(filePath, 'utf8');
            const parsed = JSON.parse(data);
            
            // Filter by actionability threshold
            const thresholdValue = this.thresholds[minActionability] || 0.5;
            
            return parsed.narratives.filter(n => 
                n.strength >= thresholdValue
            );
            
        } catch (error) {
            return [];
        }
    }
    
    // Generate alert for strong narratives
    generateAlert(narrative) {
        const { card, summary, classification, platforms, strength } = narrative;
        
        let alert = `🎯 NARRATIVE ALERT: ${card}\n\n`;
        alert += `📊 Strength: ${(strength * 100).toFixed(0)}%\n`;
        alert += `🌐 Platforms: ${platforms.join(' + ')}\n`;
        
        if (classification) {
            const emoji = {
                bullish: '📈',
                urgent: '⚡',
                volatile: '🌊',
                premium: '💎',
                gameplay: '🎮',
                caution: '⚠️'
            }[classification.action] || '📊';
            
            alert += `${emoji} Type: ${classification.type.replace('_', ' ')}\n`;
        }
        
        alert += `\n💬 ${summary}`;
        
        return alert;
    }
    
    // Check prediction accuracy (for learning)
    async checkPredictionAccuracy(predictionId) {
        // This would check actual market data against predictions
        // For now, return placeholder
        return {
            accurate: true,
            actual: 'price increased 8%',
            predicted: '5-10% increase',
            score: 0.8
        };
    }
}

module.exports = NarrativeDetector;