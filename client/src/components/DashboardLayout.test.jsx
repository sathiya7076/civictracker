import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import DashboardLayout from './DashboardLayout.jsx';

const mockUseAuth = vi.fn();
vi.mock('../context/AuthContext.jsx', () => ({ useAuth: () => mockUseAuth() }));

const renderLayout = () => render(<MemoryRouter><DashboardLayout /></MemoryRouter>);

describe('DashboardLayout navigation', () => {
  it('shows citizen links', () => {
    mockUseAuth.mockReturnValue({ user: { role: 'citizen' } });
    renderLayout();
    expect(screen.getByRole('link', { name: 'New complaint' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Staff' })).not.toBeInTheDocument();
  });

  it('shows staff links', () => {
    mockUseAuth.mockReturnValue({ user: { role: 'staff' } });
    renderLayout();
    expect(screen.getByRole('link', { name: 'Assigned complaints' })).toBeInTheDocument();
  });

  it('shows admin links', () => {
    mockUseAuth.mockReturnValue({ user: { role: 'admin' } });
    renderLayout();
    expect(screen.getByRole('link', { name: 'All complaints' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Staff' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Users' })).toBeInTheDocument();
  });
});
