// Unified logging module with timestamps and color coding

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
};

/**
 * Format timestamp for logs
 */
function getTimestamp(): string {
  const now = new Date();
  return now.toISOString().replace('T', ' ').slice(0, 19);
}

/**
 * Log info message (green)
 */
export function logInfo(...msg: any[]): void {
  const timestamp = getTimestamp();
  const message = msg.map((m) => (typeof m === 'object' ? JSON.stringify(m) : String(m))).join(' ');
  console.log(`${colors.green}[${timestamp}] INFO${colors.reset}  ${message}`);
}

/**
 * Log warning message (yellow)
 */
export function logWarn(...msg: any[]): void {
  const timestamp = getTimestamp();
  const message = msg.map((m) => (typeof m === 'object' ? JSON.stringify(m) : String(m))).join(' ');
  console.warn(`${colors.yellow}[${timestamp}] WARN${colors.reset}  ${message}`);
}

/**
 * Log error message (red)
 */
export function logError(...msg: any[]): void {
  const timestamp = getTimestamp();
  const message = msg.map((m) => (typeof m === 'object' ? JSON.stringify(m) : String(m))).join(' ');
  console.error(`${colors.red}[${timestamp}] ERROR${colors.reset} ${message}`);
}

