import React from 'react';
import { render, screen } from '@testing-library/react';
import FileUpload from './FileUpload';

beforeAll(() => {
  window.localStorage.setItem('user', JSON.stringify({ _id: '1', name: 'Test', role: 'patient' }));
});

test('renders FileUpload component', () => {
  render(<FileUpload isDoctor={false} />);
  expect(screen.getByRole('heading', { name: /upload medical record/i })).toBeInTheDocument();
  expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/symptoms/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/diagnosis/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/file/i)).toBeInTheDocument();
}); 