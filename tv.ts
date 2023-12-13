import os from 'os';
import { z } from 'zod';

const TV_DOMAIN = 'https://www.tradingview.com';
const SIGN_IN = TV_DOMAIN + '/accounts/signin/';
const TV_COINS = TV_DOMAIN + '/tvcoins/details/';

export const signInPayloadSchema = z.object({
  username: z.string(),
  password: z.string(),
  remember: z.boolean().optional(),
});

export type SignInPayload = z.infer<typeof signInPayloadSchema>;

type Session = { userId: string; session: string };

export const tradingViewSignIn = async ({
  username,
  password,
  remember = true,
}: SignInPayload): Promise<Session> => {
  console.log('[tradingViewSignIn] Starting sign in to TradingView ...');

  let body = `username=${username}&password=${password}`;

  if (remember) body += '&remember=on';

  const UA = 'TWAPI/3.0';

  const response = await fetch(SIGN_IN, {
    method: 'POST',
    body,
    headers: {
      referer: 'https://www.tradingview.com',
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-agent': `${UA} (${os.version()}; ${os.platform()}; ${os.arch()})`,
    },
  });

  const responseData = await response.json();

  if (!response.ok) throw new Error(responseData.error);

  console.log('[tradingViewSignIn] Checking cookies from response ...');

  const rawCookies = response?.headers?.get('set-cookie');

  if (!rawCookies) throw new Error('NO_COOKIES');

  const cookies = rawCookies.split(';');
  const sessionCookie = cookies.find((c) => c.includes('sessionid='));

  if (!sessionCookie) throw new Error('NO_SESSION_ID');

  const session = (sessionCookie.match(/sessionid=(.*)/) ?? [])[1];

  const userId = responseData.user.id;

  console.log('[tradingViewSignIn] Got session');

  return { userId, session };
};

const isValidTradingViewSession = async ({ session }: Session) => {
  console.log('[isValidTradingViewSession] Testing session');

  const response = await fetch(TV_COINS, {
    headers: { cookie: `sessionid=${session}` },
  });

  if (response.ok) {
    console.log('[isValidTradingViewSession] The provided session works');
    return true;
  }

  console.log('[isValidTradingViewSession] Bad or expired session');
  return false;
};

// tries to sign in
export const getTradingViewSession = async (
  username: string,
  password: string
): Promise<Session | null> => {
  console.log('[getTradingViewSession] No session yet, trying to login ...');

  const newSession = await tradingViewSignIn({ username, password });

  const success = await isValidTradingViewSession(newSession);

  if (success) return newSession;

  console.log('[getTradingViewSession] Could not get a valid session');

  return null;
};
