// Safe Launch Settings for Reformed Account
// Use these settings for first 2 weeks

module.exports = {
    // WEEK 1 SETTINGS (Days 4-7)
    week1: {
        maxRepliesPerHour: 5,        // Very conservative
        maxRepliesPerDay: 30,         // Total daily limit
        breakEvery: 10,               // Break after 10 replies
        breakDuration: 10 * 60 * 1000,// 10 minute breaks
        hoursPerDay: 4,               // Only run 4 hours/day
        scheduledPosts: false,        // No scheduled posts yet
        conversationChecking: false,  // No conversation monitoring
        
        // Extra safety
        minimumFollowers: 50,         // Only reply to accounts with 50+ followers
        avoidNewAccounts: true,       // Skip accounts < 30 days old
        requireImages: true,          // Only reply to posts with images
        
        // Response settings
        responseVariation: 'maximum', // Maximum variety
        includePrice: true,           // Include prices naturally
        maxResponseLength: 100,       // Shorter responses
    },
    
    // WEEK 2 SETTINGS (Days 8-14)
    week2: {
        maxRepliesPerHour: 10,
        maxRepliesPerDay: 80,
        breakEvery: 20,
        breakDuration: 5 * 60 * 1000,
        hoursPerDay: 8,
        scheduledPosts: true,
        scheduledPostsPerDay: 2,     // Just 2 per day
        conversationChecking: true,
        
        // Slightly relaxed
        minimumFollowers: 30,
        avoidNewAccounts: true,
        requireImages: false,        // Can reply to text posts
        
        // Response settings
        responseVariation: 'high',
        includePrice: true,
        maxResponseLength: 150,
    },
    
    // WEEK 3+ SETTINGS (Day 15+)
    week3: {
        maxRepliesPerHour: 15,       // Full speed
        maxRepliesPerDay: 150,
        breakEvery: 20,
        breakDuration: 5 * 60 * 1000,
        hoursPerDay: 12,
        scheduledPosts: true,
        scheduledPostsPerDay: 4,     // Full schedule
        conversationChecking: true,
        
        // Normal operation
        minimumFollowers: 10,
        avoidNewAccounts: false,
        requireImages: false,
        
        // Response settings
        responseVariation: 'normal',
        includePrice: true,
        maxResponseLength: 280,
    }
};