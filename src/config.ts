/**
 * Workadu MCP Server — Configuration
 *
 * Reads environment variables and provides typed config.
 * Variables can be set via .env file or passed dynamically per-request via HTTP headers.
 */

export interface WorkaduConfig {
  /** Base URL of the Workadu instance (e.g., https://your-app.workadu.com) */
  apiUrl: string;
  /** API key for authentication (from CompanyUser) */
  apiKey: string;
  /** Dingo API version (default: v2) */
  apiVersion: string;
}

export function loadConfig(overrides?: Partial<WorkaduConfig>): WorkaduConfig {
  const apiUrl = overrides?.apiUrl || process.env.WORKADU_API_URL;
  const apiKey = overrides?.apiKey || process.env.WORKADU_API_KEY;
  const apiVersion = overrides?.apiVersion || process.env.WORKADU_API_VERSION || 'v2';

  if (!apiUrl) {
    throw new Error(
      'WORKADU_API_URL is missing. Please set it in your environment ' +
      'or provide it via the X-Workadu-Api-Url HTTP header.'
    );
  }

  if (!apiKey) {
    throw new Error(
      'WORKADU_API_KEY is missing. Please set it in your environment ' +
      'or provide it via the Authorization (Bearer) HTTP header.'
    );
  }

  return {
    apiUrl: apiUrl.replace(/\/+$/, ''), // Remove trailing slashes
    apiKey,
    apiVersion,
  };
}
