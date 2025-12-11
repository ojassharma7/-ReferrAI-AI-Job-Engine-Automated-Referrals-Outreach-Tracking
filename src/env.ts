// Environment variable loading and validation

/**
 * Load and validate environment variables
 * Throws clear errors if required variables are missing
 */
export function loadEnv(): void {
  // GEMINI_API_KEY is optional (only needed if USE_GEMINI=true)
  if (process.env.USE_GEMINI === 'true' && !process.env.GEMINI_API_KEY) {
    throw new Error(
      'GEMINI_API_KEY is required when USE_GEMINI=true. Please set it in your environment or .env file.',
    );
  }

  // Set defaults
  if (!process.env.USE_GEMINI) {
    process.env.USE_GEMINI = 'false';
  }

  if (!process.env.GEMINI_MODEL) {
    process.env.GEMINI_MODEL = 'gemini-pro';
  }

  // Google Sheets and contact discovery APIs are optional (will fall back to stubs)
  // No validation needed here - they're checked in their respective modules
}

/**
 * Get environment variable with optional default
 */
export function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${key} is not set and no default provided`);
  }
  return value;
}

