// Simple test of Gemini Vision API with a base64 image
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fetch = require('node-fetch');

async function testVisionAPI() {
    console.log("🧪 Testing Gemini Vision API Directly\n");
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: {
            maxOutputTokens: 200,
            temperature: 0.3,
        }
    });
    
    try {
        // Test with a Pokemon card image
        const imageUrl = "https://images.pokemontcg.io/base1/4_hires.png";
        console.log(`📸 Testing with image: ${imageUrl}`);
        
        // Fetch and convert to base64
        const response = await fetch(imageUrl);
        const buffer = await response.buffer();
        const base64 = buffer.toString('base64');
        
        console.log(`✅ Image fetched, size: ${buffer.length} bytes`);
        
        const prompt = `You are a Pokemon TCG expert. Analyze this image and identify the Pokemon card shown.

Provide ONLY this information in this exact format:
CARD: [Pokemon name] [type if special like ex, V, VMAX, etc]
SET: [Set name if visible]
NUMBER: [Card number if visible like 051/185]
RARITY: [Rarity like Rare, Ultra Rare, etc]
CONDITION: [Mint, Near Mint, etc based on visible condition]
SPECIAL: [Alt Art, Rainbow Rare, Full Art, etc if applicable]`;
        
        const imageParts = [{
            inlineData: {
                data: base64,
                mimeType: "image/png"
            }
        }];
        
        console.log(`\n🔍 Sending to Gemini Vision API...`);
        const result = await model.generateContent([prompt, ...imageParts]);
        const text = result.response.text();
        
        console.log(`\n📊 API Response:`);
        console.log(text);
        
    } catch (error) {
        console.log(`\n❌ Error: ${error.message}`);
        if (error.response) {
            console.log(`Status: ${error.response.status}`);
            console.log(`Details: ${JSON.stringify(error.response.data)}`);
        }
    }
}

testVisionAPI().catch(console.error);