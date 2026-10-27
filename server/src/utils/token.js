import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const COOKIE_NAME = 'token';
export const TOKEN_TTL_SECONDS = 60 * 60; // short-lived: 1 hour, then the user logs in again

export const signToken = (user) =>
  jwt.sign({ sub: user._id.toString(), role: user.role }, env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: TOKEN_TTL_SECONDS,
  });

const isProd = env.NODE_ENV === 'production';
// Cross-site deployment (Vercel frontend + separate API host) needs SameSite=None; Secure.
const baseCookie = { httpOnly: true, secure: isProd, sameSite: isProd ? 'none' : 'lax', path: '/' };

export const setAuthCookie = (res, token) =>
  res.cookie(COOKIE_NAME, token, { ...baseCookie, maxAge: TOKEN_TTL_SECONDS * 1000 });

export const clearAuthCookie = (res) => res.clearCookie(COOKIE_NAME, baseCookie);
