/**
 * Workadu MCP Server — Configuration
 *
 * Reads environment variables and provides typed config.
 * Variables can be set via .env file or passed through MCP client config.
 */

export interface WorkaduConfig {
  /** Base URL of the Workadu instance (e.g., https://your-app.workadu.com) */
  apiUrl: string;
  /** API key for authentication (from CompanyUser) */
  apiKey: string;
  /** Dingo API version (default: v2) */
  apiVersion: string;
}

export function loadConfig(): WorkaduConfig {
  const apiUrl = process.env.WORKADU_API_URL;
  const apiKey = process.env.WORKADU_API_KEY;
  const apiVersion = process.env.WORKADU_API_VERSION ?? 'v2';

  if (!apiUrl) {
    throw new Error(
      'WORKADU_API_URL environment variable is required. ' +
      'Set it to your Workadu instance URL (e.g., https://your-app.workadu.com)'
    );
  }

  if (!apiKey) {
    throw new Error(
      'WORKADU_API_KEY environment variable is required. ' +
      'Set it to your Workadu API key (from CompanyUser settings)'
    );
  }

  return {
    apiUrl: apiUrl.replace(/\/+$/, ''), // Remove trailing slashes
    apiKey,
    apiVersion,
  };
}
