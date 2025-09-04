# Pokemon Bot Vision API Setup

## Overview
The bot now has actual image recognition capabilities using Google's Gemini Vision API. This allows it to:
- Identify specific Pokemon cards in images
- Provide accurate responses based on what's actually shown
- Never ask "whatcha find?" when cards are visible

## How It Works

### 1. Image Extraction (`features/image-extractor.js`)
- Extracts image URLs from tweets
- Downloads images and converts to base64
- Caches images to reduce API calls

### 2. Card Recognition (`features/card-recognition.js`)
- Uses Gemini Vision API to identify cards
- Parses card details (name, set, rarity, condition)
- Matches identified cards with internal database

### 3. Visual Analysis (`features/visual-analyzer.js`)
- Orchestrates the image analysis process
- Updates responses with actual card information
- Falls back to text analysis if vision fails

### 4. Response Generation
- Thread-aware responses now include specific card names
- Example: "That Unknown card is 🔥!" (when it actually sees an Unknown card)

## Configuration

### Enable Vision API
```bash
export ENABLE_VISION_API=true
```

### API Key Required
The bot uses the existing `GEMINI_API_KEY` for vision analysis.

## Usage Examples

### With Vision API Enabled
- Bot sees: Image of Charizard
- Bot says: "That Charizard is fire! Base Set hits different!"

### Without Vision API (Default)
- Bot sees: Image exists
- Bot says: "Nice cards! Those look clean!"

## Performance Considerations

1. **API Costs**: Each image analysis uses Gemini API tokens
2. **Latency**: Adds 1-2 seconds per image analyzed
3. **Rate Limits**: Gemini has rate limits on vision requests

## Testing

Run the vision test:
```bash
export GEMINI_API_KEY=your_key_here
export ENABLE_VISION_API=true
node test-vision-simple.js
```

## Future Improvements

1. **Batch Processing**: Analyze multiple images in one API call
2. **Card Database**: Expand the recognized card database
3. **Price Integration**: Automatically quote prices for recognized cards
4. **Grading Analysis**: Assess card condition from images