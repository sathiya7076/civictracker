import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import ProtectedRoute from './ProtectedRoute.jsx';

const mockUseAuth = vi.fn();
vi.mock('../context/AuthContext.jsx', () => ({ useAuth: () => mockUseAuth() }));

const renderAt = (path) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<p>Login page</p>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<p>Secret dashboard</p>} />
        </Route>
        <Route element={<ProtectedRoute roles={['admin']} />}>
          <Route path="/admin" element={<p>Admin area</p>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );

describe('ProtectedRoute', () => {
  it('redirects anonymous users to /login', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false });
    renderAt('/dashboard');
    expect(screen.getByText('Login page')).toBeInTheDocument();
  });

  it('lets a logged-in user through', () => {
    mockUseAuth.mockReturnValue({ user: { role: 'citizen' }, loading: false });
    renderAt('/dashboard');
    expect(screen.getByText('Secret dashboard')).toBeInTheDocument();
  });

  it('blocks a citizen from an admin-only route', () => {
    mockUseAuth.mockReturnValue({ user: { role: 'citizen' }, loading: false });
    renderAt('/admin');
    expect(screen.getByText('Secret dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Admin area')).not.toBeInTheDocument();
  });
});
