/**
 * Centralized API helper for authenticated requests.
 * Tokens are validated server-side via httpOnly cookies (primary)
 * with sessionStorage fallback for SPA compatibility.
 *
 * NEVER store sensitive tokens in localStorage — prefer httpOnly cookies.
 */

const TOKEN_KEY = 'admin_token';

export function getStoredToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
}

/**
 * Make an authenticated fetch request.
 * The httpOnly cookie is sent automatically by the browser.
 * The Authorization header is a fallback for environments where cookies are not supported.
 */
export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Include credentials so httpOnly cookies are sent
  return fetch(url, {
    ...options,
    headers,
    credentials: 'same-origin',
  });
}
