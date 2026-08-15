import React from 'react';
import { render, screen } from '@testing-library/react';
import DoctorPanel from './DoctorPanel';
import { MemoryRouter } from 'react-router-dom';

beforeAll(() => {
  window.localStorage.setItem('user', JSON.stringify({ _id: '1', name: 'Dr. Test', role: 'doctor' }));
});

test('renders Doctor Panel', () => {
  render(<MemoryRouter><DoctorPanel /></MemoryRouter>);
  expect(screen.getByText(/loading doctor panel/i)).toBeInTheDocument();
});
