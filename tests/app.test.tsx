import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../src/App';

vi.mock('../src/components/scene/StudioScene', () => ({
  StudioScene: () => {
    throw new Error('Deterministic scene initialization failure');
  },
}));

describe('App', () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => cleanup());

  it('requires acknowledgement and falls back when the scene cannot initialize', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    try {
      render(<App />);
      expect(screen.getByText(/第四阶段 PoC/)).toBeInTheDocument();

      fireEvent.click(screen.getByRole('link', { name: '进入 3D 练习室' }));
      expect(screen.getByText(/本课程是工程原型/)).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: '我已了解' }));
      expect(await screen.findByRole('img', { name: /简化二维绳路图/ })).toBeInTheDocument();
      expect(screen.getByText(/3D 场景无法初始化/)).toBeInTheDocument();
      expect(consoleError).toHaveBeenCalled();
    } finally {
      consoleError.mockRestore();
    }
  });

  it('stores favorites and offers the diagram fallback', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: '收藏课程' }));
    expect(screen.getByRole('button', { name: '取消收藏课程' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '简化图' }));
    expect(screen.getByRole('img', { name: /简化二维绳路图/ })).toBeInTheDocument();
  });


  it('persists the selected model candidate across reloads', () => {
    const firstRender = render(<App />);
    fireEvent.click(screen.getByRole('button', { name: '选择 MPFB 成年女性 · 运动装原始质量' }));
    expect(screen.getByRole('button', { name: '已选择 MPFB 成年女性 · 运动装原始质量' })).toHaveAttribute('aria-pressed', 'true');
    firstRender.unmount();

    render(<App />);
    expect(screen.getByRole('button', { name: '已选择 MPFB 成年女性 · 运动装原始质量' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('exposes provenance, release gates and every selectable model candidate', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /所有可用候选都保留/ })).toBeInTheDocument();
    expect(screen.getByText(/尚无独立审核记录/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '0/6 项通过' })).toBeInTheDocument();
    expect(screen.getByText(/正式课程发布仍由独立门禁控制/)).toBeInTheDocument();

    expect(screen.getAllByText('MPFB 成年女性 · 休闲装移动版').length).toBeGreaterThan(0);
    expect(screen.getByText('MPFB 成年女性 · 休闲装原始质量')).toBeInTheDocument();
    expect(screen.getByText('MPFB 成年女性 · 运动装原始质量')).toBeInTheDocument();
    expect(screen.getByText('Khronos RiggedFigure · 技术 QA')).toBeInTheDocument();

    expect(screen.getByRole('button', { name: '已选择 MPFB 成年女性 · 休闲装移动版' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getAllByText(/11\.6 MB/).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: '选择 MPFB 成年女性 · 运动装原始质量' }));
    expect(screen.getByRole('button', { name: '已选择 MPFB 成年女性 · 运动装原始质量' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(/腹部露出；这是明确保留的技术候选/)).toBeInTheDocument();
  });
});
