# Manual Cleanup Guide

## Current Progress
- **634 retweets** have been cleaned so far
- Progress is saved in `cleanup-progress.txt`

## Manual Steps to Continue

1. **Open Chrome** (if not already open)
   - Go to https://x.com/GlitchyGrade

2. **Clean Retweets Manually**
   - Look for posts that say "You reposted"
   - Click the green retweet button
   - Click "Undo repost"
   - Repeat for each retweet

3. **Track Your Progress**
   After cleaning some retweets, update the count:
   ```bash
   # If you cleaned 20 more retweets:
   node manual-progress.js add 20
   
   # To see current total:
   node manual-progress.js
   ```

## Alternative: Browser Console Script

You can also paste this in the browser console (F12) to help:

```javascript
// Count visible retweets
let count = 0;
document.querySelectorAll('article[data-testid="tweet"]').forEach(t => {
    if (t.innerText.includes('You reposted')) count++;
});
console.log('Visible retweets:', count);

// Auto-click first retweet (run multiple times)
const tweet = [...document.querySelectorAll('article[data-testid="tweet"]')]
    .find(t => t.innerText.includes('You reposted'));
if (tweet) {
    const btn = tweet.querySelector('button svg path[d*="M4.75"]')?.closest('button');
    if (btn) {
        btn.click();
        setTimeout(() => {
            const undo = [...document.querySelectorAll('*')]
                .find(el => el.textContent === 'Undo repost');
            if (undo) undo.click();
        }, 1000);
    }
}
```

## When You're Done
Once all retweets are cleaned, we'll move to:
1. Update bio to Pokemon theme
2. Post 3 manual Pokemon tweets
3. Wait 72 hours before running the bot