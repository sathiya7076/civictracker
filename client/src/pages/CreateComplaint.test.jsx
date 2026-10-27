import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import CreateComplaint from './CreateComplaint.jsx';
import { createComplaintRequest } from '../api/complaints.js';

vi.mock('../api/complaints.js', () => ({ createComplaintRequest: vi.fn() }));

describe('CreateComplaint page', () => {
  it('shows validation errors and does not call the API for an empty form', async () => {
    render(<MemoryRouter><CreateComplaint /></MemoryRouter>);
    await userEvent.click(screen.getByRole('button', { name: /submit complaint/i }));
    expect(await screen.findByText(/title must be at least 5 characters/i)).toBeInTheDocument();
    expect(screen.getByText(/choose a category/i)).toBeInTheDocument();
    expect(createComplaintRequest).not.toHaveBeenCalled();
  });
});
