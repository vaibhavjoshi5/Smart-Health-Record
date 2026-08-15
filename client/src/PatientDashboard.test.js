import React from 'react';
import { render, screen } from '@testing-library/react';
import PatientDashboard from './PatientDashboard';
import { MemoryRouter } from 'react-router-dom';

beforeAll(() => {
  window.localStorage.setItem('user', JSON.stringify({ _id: '1', name: 'Test', role: 'patient' }));
});

test('renders Patient Dashboard', () => {
  render(<MemoryRouter><PatientDashboard /></MemoryRouter>);
  expect(screen.getByRole('heading', { name: /patient dashboard/i })).toBeInTheDocument();
  // expect(screen.getByText(/medical timeline/i)).toBeInTheDocument();
  // expect(screen.getByText(/search records/i)).toBeInTheDocument();
  // expect(screen.getByText(/health graphs data/i)).toBeInTheDocument();
  // expect(screen.getByRole('heading', { name: /emergency contact/i })).toBeInTheDocument();
});
