// Rate limiting utility for email sending

import { logInfo, logWarn } from './logger';

export interface RateLimiterConfig {
  maxEmailsPerMinute: number;
  maxEmailsPerHour: number;
  maxEmailsPerDay: number;
  delayBetweenEmails: number; // milliseconds
}

const DEFAULT_CONFIG: RateLimiterConfig = {
  maxEmailsPerMinute: 5,
  maxEmailsPerHour: 50,
  maxEmailsPerDay: 500,
  delayBetweenEmails: 2000, // 2 seconds between emails
};

class RateLimiter {
  private config: RateLimiterConfig;
  private sentEmails: Array<{ timestamp: number; domain?: string }> = [];

  constructor(config: Partial<RateLimiterConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Check if we can send an email now
   */
  canSend(domain?: string): boolean {
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;
    const oneHourAgo = now - 60 * 60 * 1000;
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    // Filter by domain if provided (to limit per company)
    const relevantEmails = domain
      ? this.sentEmails.filter((e) => e.domain === domain)
      : this.sentEmails;

    const recentMinute = relevantEmails.filter((e) => e.timestamp > oneMinuteAgo).length;
    const recentHour = relevantEmails.filter((e) => e.timestamp > oneHourAgo).length;
    const recentDay = relevantEmails.filter((e) => e.timestamp > oneDayAgo).length;

    if (recentMinute >= this.config.maxEmailsPerMinute) {
      logWarn(`Rate limit: ${recentMinute} emails sent in last minute (max: ${this.config.maxEmailsPerMinute})`);
      return false;
    }

    if (recentHour >= this.config.maxEmailsPerHour) {
      logWarn(`Rate limit: ${recentHour} emails sent in last hour (max: ${this.config.maxEmailsPerHour})`);
      return false;
    }

    if (recentDay >= this.config.maxEmailsPerDay) {
      logWarn(`Rate limit: ${recentDay} emails sent in last day (max: ${this.config.maxEmailsPerDay})`);
      return false;
    }

    return true;
  }

  /**
   * Record that an email was sent
   */
  recordSent(domain?: string): void {
    this.sentEmails.push({ timestamp: Date.now(), domain });
    // Clean up old records (older than 24 hours)
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    this.sentEmails = this.sentEmails.filter((e) => e.timestamp > oneDayAgo);
  }

  /**
   * Get delay needed before next email can be sent
   */
  getDelayNeeded(domain?: string): number {
    if (this.canSend(domain)) {
      return 0;
    }

    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;
    const relevantEmails = domain
      ? this.sentEmails.filter((e) => e.domain === domain)
      : this.sentEmails;

    const recentMinute = relevantEmails.filter((e) => e.timestamp > oneMinuteAgo);
    if (recentMinute.length > 0) {
      const oldestRecent = Math.min(...recentMinute.map((e) => e.timestamp));
      const waitTime = oneMinuteAgo + 60 * 1000 - oldestRecent;
      return Math.max(waitTime, this.config.delayBetweenEmails);
    }

    return this.config.delayBetweenEmails;
  }

  /**
   * Wait until we can send an email
   */
  async waitUntilCanSend(domain?: string): Promise<void> {
    while (!this.canSend(domain)) {
      const delay = this.getDelayNeeded(domain);
      logInfo(`Rate limiting: waiting ${Math.ceil(delay / 1000)}s before next email...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

// Global rate limiter instance
let globalRateLimiter: RateLimiter | null = null;

/**
 * Get or create global rate limiter
 */
export function getRateLimiter(config?: Partial<RateLimiterConfig>): RateLimiter {
  if (!globalRateLimiter) {
    globalRateLimiter = new RateLimiter(config);
  }
  return globalRateLimiter;
}

/**
 * Reset global rate limiter (useful for testing)
 */
export function resetRateLimiter(): void {
  globalRateLimiter = null;
}

