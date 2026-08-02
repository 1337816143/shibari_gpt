import { ChevronLeft, ChevronRight, Lock, Pause, Play, Repeat1, RotateCcw } from 'lucide-react';

interface PlayerControlsProps {
  stepIndex: number;
  stepCount: number;
  progress: number;
  playing: boolean;
  loopStep: boolean;
  speed: number;
  speeds: readonly number[];
  onPrevious: () => void;
  onNext: () => void;
  onPlayToggle: () => void;
  onReplay: () => void;
  onLoopToggle: () => void;
  onProgress: (value: number) => void;
  onSpeed: (value: number) => void;
}

export function PlayerControls(props: PlayerControlsProps) {
  return (
    <section className="player" aria-label="动画播放器">
      <div className="player__row">
        <button className="icon-button" onClick={props.onPrevious} disabled={props.stepIndex === 0} aria-label="上一步">
          <ChevronLeft size={18} />
        </button>
        <button className="play-button" onClick={props.onPlayToggle} aria-label={props.playing ? '暂停' : '播放'}>
          {props.playing ? <Pause size={20} /> : <Play size={20} />}
          {props.playing ? '暂停' : '播放'}
        </button>
        <button className="icon-button" onClick={props.onReplay} aria-label="重新播放">
          <RotateCcw size={18} />
        </button>
        <button className={`icon-button ${props.loopStep ? 'is-active' : ''}`} onClick={props.onLoopToggle} aria-label="单步循环">
          <Repeat1 size={18} />
        </button>
        <button className="icon-button" onClick={props.onNext} disabled={props.stepIndex === props.stepCount - 1} aria-label="下一步">
          <ChevronRight size={18} />
        </button>
        <span className="player__step">步骤 {props.stepIndex + 1}/{props.stepCount}</span>
      </div>
      <input
        className="timeline"
        aria-label="动画时间轴"
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={props.progress}
        onChange={(event) => props.onProgress(Number(event.target.value))}
      />
      <div className="speed-control">
        <Lock size={14} />
        <span>速度</span>
        {props.speeds.map((item) => (
          <button key={item} className={props.speed === item ? 'is-active' : ''} onClick={() => props.onSpeed(item)}>
            {item}×
          </button>
        ))}
      </div>
    </section>
  );
}
