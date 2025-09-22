class APIRateLimiter {
    constructor() {
        this.requests = new Map();
        this.limits = {
            gemini: {
                requestsPerMinute: 60,
                requestsPerHour: 1000,
                requestsPerDay: 5000
            },
            pokemontcg: {
                requestsPerMinute: 30,
                requestsPerHour: 500,
                requestsPerDay: 2000
            },
            vision: {
                requestsPerMinute: 10,
                requestsPerHour: 100,
                requestsPerDay: 500
            },
            general: {
                requestsPerMinute: 100,
                requestsPerHour: 2000,
                requestsPerDay: 10000
            }
        };

        this.backoffTimes = new Map();
        this.retryQueue = [];
    }

    async checkLimit(apiName, userId = 'default') {
        const now = Date.now();
        const key = `${apiName}_${userId}`;

        if (!this.requests.has(key)) {
            this.requests.set(key, []);
        }

        const userRequests = this.requests.get(key);
        const limits = this.limits[apiName] || this.limits.general;

        // Clean old requests (older than 24 hours)
        const oneDayAgo = now - (24 * 60 * 60 * 1000);
        const recentRequests = userRequests.filter(req => req.timestamp > oneDayAgo);

        // Check minute limit
        const oneMinuteAgo = now - (60 * 1000);
        const minuteRequests = recentRequests.filter(req => req.timestamp > oneMinuteAgo);

        // Check hour limit
        const oneHourAgo = now - (60 * 60 * 1000);
        const hourRequests = recentRequests.filter(req => req.timestamp > oneHourAgo);

        // Check day limit
        const dayRequests = recentRequests;

        const result = {
            allowed: true,
            waitTime: 0,
            limits: {
                minute: minuteRequests.length,
                hour: hourRequests.length,
                day: dayRequests.length,
                maxMinute: limits.requestsPerMinute,
                maxHour: limits.requestsPerHour,
                maxDay: limits.requestsPerDay
            }
        };

        // Check if any limit is exceeded
        if (minuteRequests.length >= limits.requestsPerMinute) {
            result.allowed = false;
            result.waitTime = Math.max(result.waitTime, oneMinuteAgo + (60 * 1000) - minuteRequests[0].timestamp);
        }

        if (hourRequests.length >= limits.requestsPerHour) {
            result.allowed = false;
            result.waitTime = Math.max(result.waitTime, oneHourAgo + (60 * 60 * 1000) - hourRequests[0].timestamp);
        }

        if (dayRequests.length >= limits.requestsPerDay) {
            result.allowed = false;
            result.waitTime = Math.max(result.waitTime, oneDayAgo + (24 * 60 * 60 * 1000) - dayRequests[0].timestamp);
        }

        return result;
    }

    async recordRequest(apiName, userId = 'default') {
        const key = `${apiName}_${userId}`;
        const request = {
            timestamp: Date.now(),
            apiName,
            userId
        };

        if (!this.requests.has(key)) {
            this.requests.set(key, []);
        }

        this.requests.get(key).push(request);

        // Clean up old entries periodically (keep only last 1000 per user)
        if (this.requests.get(key).length > 1000) {
            this.requests.set(key, this.requests.get(key).slice(-500));
        }
    }

    async waitForLimit(apiName, userId = 'default', maxWaitTime = 30000) {
        const check = await this.checkLimit(apiName, userId);

        if (check.allowed) {
            await this.recordRequest(apiName, userId);
            return { success: true, waited: 0 };
        }

        if (check.waitTime > maxWaitTime) {
            return {
                success: false,
                waited: 0,
                error: 'Rate limit exceeded, wait time too long',
                waitTime: check.waitTime
            };
        }

        // Wait for the limit
        await new Promise(resolve => setTimeout(resolve, check.waitTime));

        // Record the request after waiting
        await this.recordRequest(apiName, userId);

        return { success: true, waited: check.waitTime };
    }

    async executeWithRetry(apiCall, apiName, userId = 'default', maxRetries = 3) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                // Check rate limit before attempting
                const limitCheck = await this.waitForLimit(apiName, userId);

                if (!limitCheck.success) {
                    throw new Error(`Rate limit exceeded for ${apiName}: ${limitCheck.error}`);
                }

                // Execute the API call
                const result = await apiCall();

                return {
                    success: true,
                    data: result,
                    attempts: attempt,
                    waited: limitCheck.waited
                };

            } catch (error) {
                console.log(`API call attempt ${attempt} failed for ${apiName}:`, error.message);

                if (attempt === maxRetries) {
                    return {
                        success: false,
                        error: error.message,
                        attempts: attempt
                    };
                }

                // Exponential backoff for retries
                const backoffTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
                await new Promise(resolve => setTimeout(resolve, backoffTime));
            }
        }
    }

    // Get current status for monitoring
    getStatus(apiName = null, userId = 'default') {
        const status = {};

        if (apiName) {
            const key = `${apiName}_${userId}`;
            const userRequests = this.requests.get(key) || [];

            const now = Date.now();
            const oneMinuteAgo = now - (60 * 1000);
            const oneHourAgo = now - (60 * 60 * 1000);
            const oneDayAgo = now - (24 * 60 * 60 * 1000);

            status[apiName] = {
                minute: userRequests.filter(req => req.timestamp > oneMinuteAgo).length,
                hour: userRequests.filter(req => req.timestamp > oneHourAgo).length,
                day: userRequests.filter(req => req.timestamp > oneDayAgo).length,
                limits: this.limits[apiName] || this.limits.general
            };
        } else {
            // Get status for all APIs
            for (const api of Object.keys(this.limits)) {
                status[api] = this.getStatus(api, userId)[api];
            }
        }

        return status;
    }

    // Reset limits for a specific user (useful for testing)
    resetLimits(userId = 'default') {
        for (const key of this.requests.keys()) {
            if (key.endsWith(`_${userId}`)) {
                this.requests.delete(key);
            }
        }
    }

    // Set custom limits for an API
    setLimits(apiName, limits) {
        this.limits[apiName] = {
            ...this.limits[apiName],
            ...limits
        };
    }

    // Get recommended wait time for an API
    getRecommendedWaitTime(apiName, userId = 'default') {
        const key = `${apiName}_${userId}`;
        const userRequests = this.requests.get(key) || [];
        const limits = this.limits[apiName] || this.limits.general;

        if (userRequests.length === 0) {
            return 0; // No requests yet, can proceed immediately
        }

        const now = Date.now();
        const oneMinuteAgo = now - (60 * 1000);
        const minuteRequests = userRequests.filter(req => req.timestamp > oneMinuteAgo);

        if (minuteRequests.length >= limits.requestsPerMinute) {
            const oldestRequest = Math.min(...minuteRequests.map(req => req.timestamp));
            return (oneMinuteAgo + (60 * 1000) - oldestRequest);
        }

        return 0;
    }

    // Clean up old request data to prevent memory leaks
    cleanup(maxAge = 24 * 60 * 60 * 1000) { // Default: 24 hours
        const cutoff = Date.now() - maxAge;

        for (const [key, requests] of this.requests.entries()) {
            const recentRequests = requests.filter(req => req.timestamp > cutoff);
            if (recentRequests.length === 0) {
                this.requests.delete(key);
            } else {
                this.requests.set(key, recentRequests);
            }
        }

        // Clean up backoff times
        for (const [key, time] of this.backoffTimes.entries()) {
            if (time < Date.now()) {
                this.backoffTimes.delete(key);
            }
        }
    }

    // Start periodic cleanup
    startCleanup(interval = 60 * 60 * 1000) { // Default: 1 hour
        setInterval(() => {
            this.cleanup();
        }, interval);
    }
}

module.exports = APIRateLimiter;
