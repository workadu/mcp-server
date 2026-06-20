/**
 * Workadu API HTTP Client
 *
 * Wrapper around fetch for the Workadu Dingo API.
 * Handles authentication (Basic Auth with api_key), Dingo version headers,
 * pagination, and error handling.
 */

import { WorkaduConfig } from '../config.js';

/** API error with structured information */
export class WorkaduApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly statusText: string,
    public readonly body: string,
    public readonly endpoint: string,
  ) {
    super(`Workadu API error ${statusCode} (${statusText}) on ${endpoint}: ${body}`);
    this.name = 'WorkaduApiError';
  }
}

/** Query parameters for API requests */
export type QueryParams = Record<string, string | number | boolean | undefined>;

export class WorkaduClient {
  private readonly baseUrl: string;
  private readonly authHeader: string;
  private readonly acceptHeader: string;

  constructor(private readonly config: WorkaduConfig) {
    this.baseUrl = config.apiUrl;
    // Dingo API uses Basic Auth: api_key as username, empty password
    this.authHeader = `Basic ${Buffer.from(config.apiKey + ':').toString('base64')}`;
    // Dingo version header
    this.acceptHeader = `application/vnd.rengine.${config.apiVersion}+json`;
  }

  /** Build headers for API requests */
  private getHeaders(extra?: Record<string, string>): Record<string, string> {
    return {
      'Accept': this.acceptHeader,
      'Authorization': this.authHeader,
      'Content-Type': 'application/json',
      ...extra,
    };
  }

  /** Build URL with query parameters */
  private buildUrl(path: string, params?: QueryParams): string {
    const url = new URL(`/api${path}`, this.baseUrl);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.set(key, String(value));
        }
      }
    }
    return url.toString();
  }

  /** Make an API request */
  private async request<T>(
    method: string,
    path: string,
    options?: {
      params?: QueryParams;
      body?: unknown;
    },
  ): Promise<T> {
    const url = this.buildUrl(path, options?.params);
    const fetchOptions: RequestInit = {
      method,
      headers: this.getHeaders(),
    };

    if (options?.body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      fetchOptions.body = JSON.stringify(options.body);
    }

    const response = await fetch(url, fetchOptions);

    // Handle empty responses (204 No Content, some DELETEs)
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return {} as T;
    }

    const responseText = await response.text();

    if (!response.ok) {
      throw new WorkaduApiError(
        response.status,
        response.statusText,
        responseText,
        `${method} ${path}`,
      );
    }

    try {
      return JSON.parse(responseText) as T;
    } catch {
      // If response isn't JSON, return as-is wrapped
      return { data: responseText } as T;
    }
  }

  /** GET request */
  async get<T>(path: string, params?: QueryParams): Promise<T> {
    return this.request<T>('GET', path, { params });
  }

  /** POST request */
  async post<T>(path: string, body?: unknown, params?: QueryParams): Promise<T> {
    return this.request<T>('POST', path, { body, params });
  }

  /** PUT request */
  async put<T>(path: string, body?: unknown, params?: QueryParams): Promise<T> {
    return this.request<T>('PUT', path, { body, params });
  }

  /** PATCH request */
  async patch<T>(path: string, body?: unknown, params?: QueryParams): Promise<T> {
    return this.request<T>('PATCH', path, { body, params });
  }

  /** DELETE request */
  async delete<T>(path: string, params?: QueryParams): Promise<T> {
    return this.request<T>('DELETE', path, { params });
  }
}
