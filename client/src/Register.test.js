import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Register from './Register';

// Mock useNavigate
const mockedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedNavigate,
}));

describe('Register Component (API)', () => {
  beforeEach(() => {
    mockedNavigate.mockReset();
    window.localStorage.clear();
  });

  it('registers user and shows success message', async () => {
    jest.useFakeTimers();
    // Mock fetch
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: 'Registration successful!' }),
      })
    );
    render(<BrowserRouter><Register /></BrowserRouter>);
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/account type/i), { target: { value: 'patient' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    // Success message
    expect(await screen.findByText(/registration successful/i)).toBeInTheDocument();

    // Fast-forward timers to trigger navigation
    jest.runAllTimers();
    await waitFor(() => expect(mockedNavigate).toHaveBeenCalledWith('/login'));

    global.fetch.mockRestore();
    jest.useRealTimers();
  });
});

describe('Register Component (Validation)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('shows validation errors for empty fields', async () => {
    render(<BrowserRouter><Register /></BrowserRouter>);
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
  });

  it('shows validation error for invalid email', async () => {
    render(<BrowserRouter><Register /></BrowserRouter>);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'invalidemail' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    expect(await screen.findByText(/invalid email/i)).toBeInTheDocument();
  });

  it('shows validation error for short password', async () => {
    render(<BrowserRouter><Register /></BrowserRouter>);
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    expect(await screen.findByText(/password must be at least/i)).toBeInTheDocument();
  });
});

describe('Register Component (API Error)', () => {
  beforeEach(() => {
    mockedNavigate.mockReset();
    window.localStorage.clear();
  });

  it('shows error message on API failure', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ message: 'Email already exists' }),
      })
    );
    render(<BrowserRouter><Register /></BrowserRouter>);
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/account type/i), { target: { value: 'patient' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    expect(await screen.findByText(/email already exists/i)).toBeInTheDocument();
    global.fetch.mockRestore();
  });
});

describe('Register Component (Loading State)', () => {
  beforeEach(() => {
    mockedNavigate.mockReset();
    window.localStorage.clear();
  });

  it('disables button while loading', async () => {
    jest.useFakeTimers();
    let resolveFetch;
    global.fetch = jest.fn(() => new Promise((resolve) => { resolveFetch = resolve; }));
    render(<BrowserRouter><Register /></BrowserRouter>);
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/account type/i), { target: { value: 'patient' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    expect(screen.getByRole('button', { name: /creating account/i })).toBeDisabled();
    // Finish fetch
    resolveFetch({ ok: true, json: () => Promise.resolve({ message: 'Registration successful!' }) });
    // Wait for the success message to appear (fetch resolved, timer scheduled)
    await screen.findByText(/registration successful/i);
    // Fast-forward timers to trigger navigation
    jest.runAllTimers();
    await waitFor(() => expect(mockedNavigate).toHaveBeenCalled());
    global.fetch.mockRestore();
    jest.useRealTimers();
  });
});

test('renders Register form', () => {
  render(<BrowserRouter><Register /></BrowserRouter>);
  expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
  expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/account type/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
}); 