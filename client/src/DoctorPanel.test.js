import React from 'react';
import { render, screen } from '@testing-library/react';
import DoctorPanel from './DoctorPanel';

beforeAll(() => {
  window.localStorage.setItem('user', JSON.stringify({ _id: '1', name: 'Dr. Test', role: 'doctor' }));
});

test('renders Doctor Panel', () => {
  render(<DoctorPanel />);
  expect(screen.getByRole('heading', { name: /smart health record/i })).toBeInTheDocument();
  expect(screen.getByText(/assigned patients/i)).toBeInTheDocument();
  expect(screen.getByText(/add medical entry/i)).toBeInTheDocument();
  expect(screen.getByText(/download patient summary/i)).toBeInTheDocument();
  expect(screen.getByText(/manage appointments/i)).toBeInTheDocument();
}); 