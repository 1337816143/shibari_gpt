import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../src/App';

vi.mock('../src/components/scene/StudioScene', () => ({
  StudioScene: () => <div data-testid="scene">3D scene</div>,
}));

describe('App', () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => cleanup());

  it('requires safety consent before loading the 3D studio', async () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /只发布完成审核的课程/ })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { name: /单柱基础/ }).length).toBeGreaterThan(0);
    expect(screen.getByText(/第二阶段 PoC/)).toBeInTheDocument();
    expect(screen.queryByTestId('scene')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('link', { name: '进入 3D 练习室' }));
    expect(screen.getByText(/本课程是工程原型/)).toBeInTheDocument();
    expect(screen.queryByTestId('scene')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '我已了解' }));
    expect(await screen.findByTestId('scene')).toBeInTheDocument();
  });

  it('stores course favorites and offers the diagram fallback', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: '收藏课程' }));
    expect(screen.getByRole('button', { name: '取消收藏课程' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '简化图' }));
    expect(screen.getByRole('img', { name: /简化二维绳路图/ })).toBeInTheDocument();
  });
});
