import { asyncHandler } from '../utils/asyncHandler.js';
import { authenticate, registerCitizen } from '../services/authService.js';
import { clearAuthCookie, setAuthCookie, signToken } from '../utils/token.js';

export const register = asyncHandler(async (req, res) => {
  const user = await registerCitizen(req.body);
  setAuthCookie(res, signToken(user));
  res.status(201).json({ success: true, message: 'Registration successful', data: { user } });
});

export const login = asyncHandler(async (req, res) => {
  const user = await authenticate(req.body.email, req.body.password);
  setAuthCookie(res, signToken(user));
  res.json({ success: true, message: 'Login successful', data: { user } });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { user: req.user } });
});

export const logout = asyncHandler(async (_req, res) => {
  clearAuthCookie(res);
  res.json({ success: true, message: 'Logged out' });
});
