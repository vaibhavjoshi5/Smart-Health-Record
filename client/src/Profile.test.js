import React from 'react';
import { render, screen } from '@testing-library/react';
import Profile from './Profile';

beforeAll(() => {
  window.localStorage.setItem('user', JSON.stringify({ _id: '1', name: 'Test', role: 'patient' }));
});

test('renders Profile component', async () => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve({
        name: 'Test',
        email: 'test@example.com',
        bloodGroup: 'A+',
        allergies: ['pollen'],
        chronicDiseases: ['asthma'],
        emergencyContact: { name: 'Mom', phone: '123', relation: 'Mother' }
      })
    })
  );
  render(<Profile />);
  expect(await screen.findByRole('heading', { name: /profile/i })).toBeInTheDocument();
  expect(await screen.findByText(/name:/i)).toBeInTheDocument();
  expect(await screen.findByText(/email:/i)).toBeInTheDocument();
  global.fetch.mockRestore();
}); 