// Natural Response Generator - More human-like and specific responses
class NaturalResponseGenerator {
    constructor() {
        // Response templates that sound more natural
        this.templates = {
            grading: {
                goodCentering: [
                    "That centering looks solid for a PSA 10! Maybe 55/45 at worst",
                    "Definitely worth grading! Centering's within PSA 10 range",
                    "Send it to PSA! That's easy 9-10 material from what I can see"
                ],
                questionable: [
                    "Centering might be borderline for a 10, but def a 9",
                    "Looks like 60/40 centering, still gradeable but might cap at 9",
                    "Worth grading if the corners are mint. Centering's a bit off"
                ]
            },
            
            pulls: {
                amazing: [
                    "Insane pull! That's the chase card right there",
                    "You hit the jackpot! That's worth {value} easy",
                    "No way! That's one of the best pulls from {set}"
                ],
                good: [
                    "Solid hit! Love the artwork on that one",
                    "Nice! That's a keeper for sure",
                    "Great pull! That card's been climbing in value"
                ],
                acknowledging: [
                    "The luck is real! Congrats on the hit",
                    "Pack magic at work! Beautiful card",
                    "Love to see it! That's why we rip packs"
                ]
            },
            
            stores: {
                target: [
                    "Target restocks Tuesday/Thursday mornings usually. Check around 8am",
                    "Try Target early Tuesday mornings. Also check the electronics section",
                    "Target's been getting stock Tuesdays. Use Brickseek to check first"
                ],
                walmart: [
                    "Walmart's hit or miss. Wednesday/Friday mornings are best",
                    "Check Walmart's trading card section near self-checkout too",
                    "Walmart varies by location but mornings after vendor visits work"
                ],
                general: [
                    "GameStop's been getting allocations. Barnes & Noble sleeper spot",
                    "Try Costco for collection boxes. Usually $10-20 under retail",
                    "Best Buy online has been restocking randomly. Set alerts"
                ]
            },
            
            values: {
                specific: [
                    "Last sold for {price} on TCGPlayer. eBay showing {range}",
                    "Current market is {price}. Been trending {direction}",
                    "Raw goes for {raw}, PSA 10 hitting {graded}"
                ],
                general: [
                    "Check TCGPlayer for latest. Prices been moving lately",
                    "Market's all over. TCGPlayer most accurate for raw",
                    "Depends on condition but {range} is typical"
                ]
            },
            
            investment: {
                good: [
                    "Sealed {set} is solid long-term. Alt arts driving demand",
                    "Can't go wrong with sealed Evolving Skies or Crown Zenith",
                    "{set} has legs. The chase cards alone justify holding"
                ],
                risky: [
                    "Modern's risky but {set} has potential with those alt arts",
                    "Sealed vintage safer bet, but {set} could pop off",
                    "If you can hold 3-5 years, {set} should appreciate"
                ]
            },
            
            authenticity: [
                "Check the texture - real cards have that grainy feel. Fakes are smooth",
                "Font kerning is the giveaway. Look at the 'e' in Pokemon",
                "Rip test a energy card from same era. Compare the layers",
                "The holo pattern should shift. Fakes have static holos usually"
            ],
            
            deals: {
                good: [
                    "That's a steal! Retail is {msrp}, you saved {savings}",
                    "Great find! Those are going for {higher} everywhere else",
                    "Jump on that! Haven't seen prices that low in months"
                ],
                average: [
                    "Not bad! About market price but at least it's available",
                    "Fair price. Seen them for {range} recently",
                    "Decent if you need it. Not a steal but not overpriced"
                ]
            },
            
            mailDay: [
                "Mail days hit different! What's the favorite from this haul?",
                "Solid additions! That {card} is especially nice",
                "Love the variety! Vintage and modern is the way",
                "Package secured! The {card} alone made it worth it"
            ],
            
            conversation: [
                "Facts! The hobby's been wild lately",
                "For real, prices have been all over",
                "Totally agree. The market's been interesting",
                "100%! Been thinking the same thing"
            ]
        };

        // Dynamic values to insert
        this.marketData = {
            'charizard ex': { raw: '$80-120', graded: '$300+', set: 'Obsidian Flames' },
            'moonbreon': { raw: '$400-500', graded: '$800+', set: 'Evolving Skies' },
            'giratina v alt': { raw: '$200-300', graded: '$500+', set: 'Lost Origin' },
            'lugia v alt': { raw: '$150-250', graded: '$400+', set: 'Silver Tempest' },
            'pikachu vmax': { raw: '$200-300', graded: '$600+', set: 'Vivid Voltage' }
        };
    }

    generateNaturalResponse(text, context) {
        const textLower = text.toLowerCase();
        
        // Grading questions
        if (textLower.includes('grade') || textLower.includes('psa') || textLower.includes('bgs')) {
            if (textLower.includes('worth')) {
                const responses = textLower.includes('centering') && textLower.includes('55/45') 
                    ? this.templates.grading.goodCentering
                    : this.templates.grading.questionable;
                return this.pickRandom(responses);
            }
        }

        // Questions should be answered first
        if (text.includes('?')) {
            // Handle specific question types
            if (textLower.includes('which') && textLower.includes('better')) {
                if (textLower.includes('psa') || textLower.includes('bgs')) {
                    return "PSA is most popular for Pokemon. BGS for high-end cards. CGC cheapest with subgrades";
                }
                if (textLower.includes('surging sparks') || textLower.includes('stellar crown')) {
                    return "Surging Sparks has better chase cards IMO. Pikachu ex driving the value";
                }
            }
            
            if (textLower.includes('what') && textLower.includes('pull rate')) {
                return "Alt arts roughly 1:200 packs in most sets. Crown Zenith slightly better rates";
            }
            
            if (textLower.includes('what set') && textLower.includes('buy')) {
                return "Start with 151 for nostalgia or Crown Zenith for pull rates. Both hold value";
            }
            
            if (textLower.includes('psa 10') && textLower.includes('possible')) {
                if (textLower.includes('55/45')) {
                    return "55/45 centering is solid for PSA 10! Check corners and surface under light";
                }
            }
        }
        
        // Pull reactions
        if (textLower.includes('pulled') || textLower.includes('pull') || (textLower.includes('got') && !textLower.includes('got back'))) {
            if (textLower.includes('charizard') || textLower.includes('moonbreon')) {
                let response = this.pickRandom(this.templates.pulls.amazing);
                // Insert actual values
                if (textLower.includes('charizard')) {
                    response = response.replace('{value}', '$100+').replace('{set}', 'Obsidian Flames');
                } else if (textLower.includes('moonbreon')) {
                    response = response.replace('{value}', '$400+').replace('{set}', 'Evolving Skies');
                }
                return response;
            }
            return this.pickRandom(this.templates.pulls.good);
        }

        // Store questions
        if (textLower.includes('where') || textLower.includes('find') || textLower.includes('stock')) {
            if (textLower.includes('target')) {
                return this.pickRandom(this.templates.stores.target);
            } else if (textLower.includes('walmart')) {
                return this.pickRandom(this.templates.stores.walmart);
            }
            return this.pickRandom(this.templates.stores.general);
        }

        // Value questions
        if (textLower.includes('worth') || textLower.includes('value') || textLower.includes('price')) {
            // Check for specific cards
            for (const [card, data] of Object.entries(this.marketData)) {
                if (textLower.includes(card.split(' ')[0])) {
                    let response = this.pickRandom(this.templates.values.specific);
                    response = response
                        .replace('{price}', data.raw)
                        .replace('{raw}', data.raw)
                        .replace('{graded}', data.graded)
                        .replace('{range}', data.raw)
                        .replace('{direction}', 'up');
                    return response;
                }
            }
            return this.pickRandom(this.templates.values.general).replace('{range}', '$50-200');
        }

        // Investment questions
        if (textLower.includes('invest') || textLower.includes('hold') || textLower.includes('sealed')) {
            const response = this.pickRandom(this.templates.investment.good);
            const set = this.extractSet(textLower) || 'Evolving Skies';
            return response.replace(/\{set\}/g, set);
        }

        // Authenticity checks
        if (textLower.includes('fake') || textLower.includes('real') || textLower.includes('authentic')) {
            return this.pickRandom(this.templates.authenticity);
        }

        // Deal evaluation
        if ((textLower.includes('deal') || textLower.includes('good')) && textLower.includes('$')) {
            const priceMatch = text.match(/\$(\d+)/);
            if (priceMatch) {
                const price = parseInt(priceMatch[1]);
                if (price < 40) {
                    let response = this.pickRandom(this.templates.deals.good);
                    response = response
                        .replace('{msrp}', '$50')
                        .replace('{savings}', '$10+')
                        .replace('{higher}', '$45-50');
                    return response;
                }
            }
            return this.pickRandom(this.templates.deals.average).replace('{range}', '$35-45');
        }

        // Mail day
        if (textLower.includes('mail day') || textLower.includes('mailday')) {
            const response = this.pickRandom(this.templates.mailDay);
            const card = this.extractCard(textLower) || 'vintage card';
            return response.replace(/\{card\}/g, card);
        }

        // Sales posts - acknowledge briefly
        if (textLower.includes('wts') || textLower.includes('for sale') || textLower.includes('fs')) {
            const priceMatch = text.match(/\$(\d+)/);
            if (priceMatch) {
                const price = parseInt(priceMatch[1]);
                return `GLWS! $${price} is fair for current market`;
            }
            return "GLWS! Price looks reasonable";
        }

        // Generic conversation
        if (textLower.includes('?')) {
            return this.pickRandom(this.templates.conversation);
        }

        return null;
    }

    pickRandom(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    extractSet(text) {
        const sets = ['evolving skies', 'crown zenith', 'lost origin', 'obsidian flames', 
                      'paradox rift', 'paldean fates', 'surging sparks', 'stellar crown'];
        for (const set of sets) {
            if (text.includes(set)) {
                return set.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            }
        }
        return null;
    }

    extractCard(text) {
        if (text.includes('charizard')) return 'Charizard';
        if (text.includes('pikachu')) return 'Pikachu';
        if (text.includes('umbreon') || text.includes('moonbreon')) return 'Umbreon';
        if (text.includes('lugia')) return 'Lugia';
        if (text.includes('giratina')) return 'Giratina';
        if (text.includes('gengar')) return 'Gengar';
        return null;
    }
}

module.exports = NaturalResponseGenerator;