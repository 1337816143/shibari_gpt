import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { App } from '../src/App';

vi.mock('../src/components/scene/StudioScene', () => ({
  StudioScene: () => <div data-testid="scene">3D scene</div>,
}));

describe('App', () => {
  it('renders the course and loads the 3D studio on demand', async () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /单柱基础/ })).toBeInTheDocument();
    expect(screen.getByText(/技术 PoC/)).toBeInTheDocument();
    expect(screen.queryByTestId('scene')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: '进入 3D 练习室' }));
    expect(await screen.findByTestId('scene')).toBeInTheDocument();
    expect(screen.getByText(/本课程是工程原型/)).toBeInTheDocument();
  });
});
