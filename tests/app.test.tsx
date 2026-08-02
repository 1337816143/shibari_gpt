import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { App } from '../src/App';

describe('App', () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => cleanup());

  it('requires acknowledgement and falls back when WebGL is unavailable', async () => {
    render(<App />);
    expect(screen.getByText(/第四阶段 PoC/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('link', { name: '进入 3D 练习室' }));
    expect(screen.getByText(/本课程是工程原型/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '我已了解' }));
    expect(await screen.findByRole('img', { name: /简化二维绳路图/ })).toBeInTheDocument();
  });

  it('stores favorites and offers the diagram fallback', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: '收藏课程' }));
    expect(screen.getByRole('button', { name: '取消收藏课程' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '简化图' }));
    expect(screen.getByRole('img', { name: /简化二维绳路图/ })).toBeInTheDocument();
  });

  it('exposes provenance, release gates and a clearly labelled QA asset switch', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /看得见资产状态/ })).toBeInTheDocument();
    expect(screen.getByText(/尚无独立审核记录/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '0/6 项通过' })).toBeInTheDocument();
    expect(screen.getByText(/门禁由课程与审核数据实时计算/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /加载技术 QA 模型/ }));
    expect(screen.getByText('Khronos RiggedFigure · 技术 QA')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /返回课程占位模型/ })).toBeInTheDocument();
  });
});
