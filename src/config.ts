/**
 * Workadu MCP Server — Configuration
 *
 * Reads environment variables and provides typed config.
 * Variables can be set via .env file or passed dynamically per-request via HTTP headers.
 */

export interface WorkaduConfig {
  /** Base URL of the Workadu instance (e.g., https://app.workadu.com) */
  apiUrl: string;
  /** API key for Basic authentication (from CompanyUser) */
  apiKey?: string;
  /** OAuth 2.0 Bearer access token (JWT) */
  accessToken?: string;
  /** Dingo API version (default: v2) */
  apiVersion: string;
}

export function loadConfig(overrides?: Partial<WorkaduConfig>): WorkaduConfig {
  const apiKey = overrides?.apiKey || process.env.WORKADU_API_KEY;
  const accessToken = overrides?.accessToken;
  const apiUrl =
    overrides?.apiUrl ||
    process.env.WORKADU_API_URL ||
    (accessToken ? process.env.WORKADU_OAUTH_URL || 'https://app.workadu.com' : undefined);
  const apiVersion = overrides?.apiVersion || process.env.WORKADU_API_VERSION || 'v2';

  if (!apiUrl) {
    throw new Error(
      'WORKADU_API_URL is missing. Please set it in your environment ' +
      'or provide it via the X-Workadu-Api-Url HTTP header.'
    );
  }

  if (!apiKey && !accessToken) {
    throw new Error(
      'Authentication is missing. Provide a Bearer JWT token via the Authorization header, ' +
      'or set WORKADU_API_KEY / X-Workadu-Api-Key.'
    );
  }

  return {
    apiUrl: apiUrl.replace(/\/+$/, ''), // Remove trailing slashes
    apiKey,
    accessToken,
    apiVersion,
  };
}
