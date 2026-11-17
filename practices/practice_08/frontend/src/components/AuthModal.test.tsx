import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthModal } from './AuthModal';
import { apiService } from '../services/api';

describe('AuthModal Component', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(
      <AuthModal isOpen={false} onClose={vi.fn()} onSuccess={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders sign in modal by default when isOpen is true', () => {
    render(<AuthModal isOpen={true} onClose={vi.fn()} onSuccess={vi.fn()} />);

    expect(screen.getByRole('heading', { name: /Sign in to AlgoPlace/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. andbelP')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
  });

  it('can toggle between Sign In and Register modes', () => {
    render(<AuthModal isOpen={true} onClose={vi.fn()} onSuccess={vi.fn()} />);

    const registerSwitchBtn = screen.getByRole('button', { name: 'Register' });
    fireEvent.click(registerSwitchBtn);

    expect(screen.getByRole('heading', { name: /Create an Account/i })).toBeInTheDocument();

    const signInSwitchBtn = screen.getByRole('button', { name: 'Sign In' });
    fireEvent.click(signInSwitchBtn);

    expect(screen.getByRole('heading', { name: /Sign in to AlgoPlace/i })).toBeInTheDocument();
  });

  it('submits login form and calls onSuccess with user', async () => {
    const mockUser = { id: 1, username: 'testuser', role: 'user', createdAt: '2026-01-01' } as const;
    vi.spyOn(apiService, 'login').mockResolvedValueOnce({
      token: 'jwt-token',
      user: mockUser,
    });

    const handleSuccess = vi.fn();
    const handleClose = vi.fn();

    render(<AuthModal isOpen={true} onClose={handleClose} onSuccess={handleSuccess} />);

    fireEvent.change(screen.getByPlaceholderText('e.g. andbelP'), {
      target: { value: 'testuser' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(handleSuccess).toHaveBeenCalledWith(mockUser);
      expect(handleClose).toHaveBeenCalled();
    });
  });

  it('displays error message when login fails', async () => {
    vi.spyOn(apiService, 'login').mockRejectedValueOnce(new Error('Invalid username or password'));

    render(<AuthModal isOpen={true} onClose={vi.fn()} onSuccess={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText('e.g. andbelP'), {
      target: { value: 'wronguser' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'wrongpass' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(screen.getByText('Invalid username or password')).toBeInTheDocument();
    });
  });

  it('submits registration form and calls onSuccess', async () => {
    const mockUser = { id: 2, username: 'newuser', role: 'user', createdAt: '2026-01-01' } as const;
    vi.spyOn(apiService, 'register').mockResolvedValueOnce({
      token: 'new-jwt',
      user: mockUser,
    });

    const handleSuccess = vi.fn();
    const handleClose = vi.fn();

    render(<AuthModal isOpen={true} onClose={handleClose} onSuccess={handleSuccess} initialMode="register" />);

    fireEvent.change(screen.getByPlaceholderText('e.g. andbelP'), {
      target: { value: 'newuser' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'newpass' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Register' }));

    await waitFor(() => {
      expect(handleSuccess).toHaveBeenCalledWith(mockUser);
      expect(handleClose).toHaveBeenCalled();
    });
  });
});
