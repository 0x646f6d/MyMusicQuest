import { readJson, remove, writeJson } from '../storage';

const CLIENT_ID: string = import.meta.env.VITE_SPOTIFY_CLIENT_ID ?? '';
const SCOPES = ['user-read-playback-state', 'user-modify-playback-state'];
const TOKEN_KEY = 'mmq.spotify.token';
const VERIFIER_KEY = 'mmq.spotify.verifier';
const STATE_KEY = 'mmq.spotify.state';

interface StoredToken {
  accessToken: string;
  refreshToken: string;
  /** epoch ms */
  expiresAt: number;
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

export const isSpotifyConfigured = (): boolean => CLIENT_ID.length > 0;

/** The app's base URL; must be registered as redirect URI in the Spotify dashboard. */
export const redirectUri = (): string => window.location.origin + import.meta.env.BASE_URL;

function randomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values, (v) => chars[v % chars.length]).join('');
}

async function codeChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/** Redirects to Spotify's login page (PKCE flow). */
export async function login(): Promise<void> {
  const verifier = randomString(64);
  const state = randomString(16);
  // localStorage (not sessionStorage): on iOS the redirect may come back in another context
  writeJson(VERIFIER_KEY, verifier);
  writeJson(STATE_KEY, state);
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    scope: SCOPES.join(' '),
    code_challenge_method: 'S256',
    code_challenge: await codeChallenge(verifier),
    redirect_uri: redirectUri(),
    state,
  });
  window.location.assign(`https://accounts.spotify.com/authorize?${params}`);
}

export function logout(): void {
  remove(TOKEN_KEY);
}

async function requestToken(body: Record<string, string>): Promise<StoredToken> {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: CLIENT_ID, ...body }),
  });
  if (!response.ok) throw new Error(`Spotify-Login fehlgeschlagen (${response.status})`);
  const data = (await response.json()) as TokenResponse;
  const previous = readJson<StoredToken>(TOKEN_KEY);
  const token: StoredToken = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? previous?.refreshToken ?? '',
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  writeJson(TOKEN_KEY, token);
  return token;
}

/**
 * Call once on app start: completes the login if we just came back from Spotify.
 * Returns an error message if the login failed.
 */
export async function handleRedirect(): Promise<string | null> {
  const url = new URL(window.location.href);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  if (!code && !error) return null;

  const state = url.searchParams.get('state');
  window.history.replaceState(null, '', url.pathname);
  if (error) return `Spotify-Login abgebrochen (${error})`;

  const verifier = readJson<string>(VERIFIER_KEY);
  const expectedState = readJson<string>(STATE_KEY);
  remove(VERIFIER_KEY);
  remove(STATE_KEY);
  if (!verifier || state !== expectedState) return 'Spotify-Login ungültig, bitte erneut versuchen';

  try {
    await requestToken({
      grant_type: 'authorization_code',
      code: code!,
      redirect_uri: redirectUri(),
      code_verifier: verifier,
    });
    return null;
  } catch (e) {
    return (e as Error).message;
  }
}

export const isLoggedIn = (): boolean => readJson<StoredToken>(TOKEN_KEY) !== null;

/** Returns a valid access token, refreshing it if needed; null if not logged in. */
export async function getAccessToken(forceRefresh = false): Promise<string | null> {
  const token = readJson<StoredToken>(TOKEN_KEY);
  if (!token) return null;
  if (!forceRefresh && token.expiresAt - 60_000 > Date.now()) return token.accessToken;
  try {
    const refreshed = await requestToken({
      grant_type: 'refresh_token',
      refresh_token: token.refreshToken,
    });
    return refreshed.accessToken;
  } catch {
    logout();
    return null;
  }
}
