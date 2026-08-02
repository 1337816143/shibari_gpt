import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { App } from '../src/App';

vi.mock('../src/components/scene/StudioScene', () => ({
  StudioScene: () => <div data-testid="scene">3D scene</div>,
}));

describe('App', () => {
  it('renders the course and prototype warning', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /单柱基础/ })).toBeInTheDocument();
    expect(screen.getAllByText(/工程原型/).length).toBeGreaterThan(0);
    expect(screen.getByTestId('scene')).toBeInTheDocument();
  });
});
