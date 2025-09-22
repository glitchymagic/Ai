// Safe Launch Settings for Reformed Account
// Use these settings for first 2 weeks

module.exports = {
    // WEEK 1 SETTINGS (Days 4-7)
    week1: {
        maxRepliesPerHour: 12,       // Increase for higher engagement
        maxRepliesPerDay: 80,        // Raise daily ceiling
        breakEvery: 10,               // Break after 10 replies
        breakDuration: 2 * 60 * 1000, // 2 minute breaks
        hoursPerDay: 10,              // Run longer
        scheduledPosts: false,        // No scheduled posts yet
        conversationChecking: false,  // No conversation monitoring
        
        // Extra safety
        minimumFollowers: 0,          // Engage broadly
        avoidNewAccounts: false,      // Allow new accounts
        requireImages: false,         // Allow text-only posts
        
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