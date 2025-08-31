# Quick Free Tweet Deletion

## Method 1: Browser Console (FASTEST)

1. Go to your Twitter profile
2. Press F12 (or Cmd+Option+I on Mac)
3. Click "Console" tab
4. Paste this code:

```javascript
// Auto-delete tweets from profile
setInterval(() => {
    // Find all menu buttons (three dots)
    document.querySelectorAll('[data-testid="caret"]').forEach(caret => {
        caret.click();
        setTimeout(() => {
            // Click delete option
            const deleteBtn = Array.from(document.querySelectorAll('span')).find(
                el => el.textContent === 'Delete'
            );
            if (deleteBtn) {
                deleteBtn.click();
                setTimeout(() => {
                    // Confirm deletion
                    const confirm = document.querySelector('[data-testid="confirmationSheetConfirm"]');
                    if (confirm) confirm.click();
                }, 500);
            }
        }, 500);
    });
    
    // Scroll for more tweets
    window.scrollBy(0, 500);
}, 3000);
```

5. Let it run (deletes visible tweets every 3 seconds)
6. Press F5 to stop

## Method 2: Run Our Cleanup Script

```bash
cd /Users/jonathan/pokemon-bot-v2
node cleanup-tweets.js
```

## Method 3: Semi-Manual Fast Delete

1. Go to your profile
2. Hold Cmd key
3. Click menu (⋯) on multiple tweets
4. Delete them in batches

## Tips:
- The console method is fastest
- Works on any browser
- Completely free
- No sign-ups needed