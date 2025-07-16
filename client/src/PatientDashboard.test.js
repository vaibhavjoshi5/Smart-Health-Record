import React from 'react';
import { render, screen } from '@testing-library/react';
import PatientDashboard from './PatientDashboard';

beforeAll(() => {
  window.localStorage.setItem('user', JSON.stringify({ _id: '1', name: 'Test', role: 'patient' }));
});

test('renders Patient Dashboard', () => {
  render(<PatientDashboard />);
  expect(screen.getByText(/loading your dashboard/i)).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /smart health record/i })).toBeInTheDocument();
  // expect(screen.getByText(/medical timeline/i)).toBeInTheDocument();
  // expect(screen.getByText(/search records/i)).toBeInTheDocument();
  // expect(screen.getByText(/health graphs data/i)).toBeInTheDocument();
  // expect(screen.getByRole('heading', { name: /emergency contact/i })).toBeInTheDocument();
}); 