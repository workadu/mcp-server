/**
 * Workadu MCP Server — OAuth 2.0 Protected Resource & JWT Verification
 *
 * Implements:
 * - RFC 9728 Protected Resource Metadata (/.well-known/oauth-protected-resource)
 * - Incoming Bearer JWT verification against Workadu's JWKS endpoint
 */

import type { Request } from 'express';
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';

export interface OAuthConfig {
  /** Base URL of the Workadu OAuth Authorization Server */
  oauthServerUrl: string;
  /** JWKS endpoint URL for verifying RS256 access tokens */
  jwksUrl: string;
  /** Optional expected JWT issuer */
  issuer?: string;
  /** Optional expected JWT audience */
  audience?: string;
  /** Optional public resource URL override (e.g., https://mcp.workadu.com) */
  resourceUrl?: string;
  /** Optional supported scopes advertised in resource metadata */
  scopesSupported?: string[];
}

export function loadOAuthConfig(): OAuthConfig {
  const oauthServerUrl = (process.env.WORKADU_OAUTH_URL || 'https://app.workadu.com').replace(/\/+$/, '');
  const jwksUrl = process.env.WORKADU_JWKS_URL || `${oauthServerUrl}/.well-known/jwks.json`;
  const issuer = process.env.WORKADU_OAUTH_ISSUER || undefined;
  const audience = process.env.WORKADU_OAUTH_AUDIENCE || undefined;
  const resourceUrl = process.env.MCP_RESOURCE_URL?.replace(/\/+$/, '') || undefined;
  const rawScopes = process.env.WORKADU_OAUTH_SCOPES;
  const scopesSupported = rawScopes
    ? rawScopes.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean)
    : undefined;

  return {
    oauthServerUrl,
    jwksUrl,
    issuer,
    audience,
    resourceUrl,
    scopesSupported,
  };
}

export function resolveResourceUrl(req: Request, configuredUrl?: string): string {
  if (configuredUrl) {
    return configuredUrl;
  }
  const host = req.get('host');
  if (!host) {
    return 'https://mcp.workadu.com';
  }
  return `${req.protocol}://${host}`;
}

export function buildProtectedResourceMetadata(
  resourceUrl: string,
  config: OAuthConfig,
): Record<string, unknown> {
  return {
    resource: resourceUrl,
    authorization_servers: [config.oauthServerUrl],
    bearer_methods_supported: ['header'],
    ...(config.scopesSupported && config.scopesSupported.length > 0
      ? { scopes_supported: config.scopesSupported }
      : {}),
  };
}

export function buildWwwAuthenticateHeader(resourceUrl: string, error?: 'invalid_token'): string {
  const metadataUrl = `${resourceUrl}/.well-known/oauth-protected-resource`;
  if (error) {
    return `Bearer error="${error}", resource_metadata="${metadataUrl}"`;
  }
  return `Bearer resource_metadata="${metadataUrl}"`;
}

export type VerifyJwtFn = (token: string) => Promise<JWTPayload>;

const JWT_COMPACT_REGEX = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

/** Returns true when a Bearer token has the 3-segment Compact JWS (JWT) shape */
export function isJwt(token: string): boolean {
  return JWT_COMPACT_REGEX.test(token);
}

export function createJwtVerifier(config: OAuthConfig): VerifyJwtFn {
  const jwks = createRemoteJWKSet(new URL(config.jwksUrl));

  return async (token: string): Promise<JWTPayload> => {
    const { payload } = await jwtVerify(token, jwks, {
      algorithms: ['RS256'],
      ...(config.issuer ? { issuer: config.issuer } : {}),
      ...(config.audience ? { audience: config.audience } : {}),
    });
    return payload;
  };
}
