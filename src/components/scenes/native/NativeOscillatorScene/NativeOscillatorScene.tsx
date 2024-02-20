'use client';
import {useEffect, useRef, useState} from 'react';
import {Button} from '@/components/ui/Button';

export function NativeOscillatorScene() {
  const contextRef = useRef<AudioContext>();

  const canvasRef = useRef<React.ElementRef<'canvas'>>(null);

  const bufferRef = useRef<AudioBuffer>();
  const [bufferReady, setBufferReady] = useState(false);
  const [bufferRendering, setBufferRendering] = useState(false);

  const bufferSourceRef = useRef<AudioBufferSourceNode>();
  const [bufferSourcePlaying, setBufferSourcePlaying] = useState(false);

  useEffect(() => {
    contextRef.current = new AudioContext();
    return () => {
      if (!contextRef.current) return;
      void contextRef.current.close();
      contextRef.current = undefined;
    };
  }, []);

  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const {width, height} = canvas.getBoundingClientRect();
      const ratio = Math.max(2, window.devicePixelRatio);
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);

      console.debug('canvas resized to: ', {
        width: canvas.width,
        height: canvas.height,
      });
    };

    resizeCanvas();

    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  const getCanvasContext = () => {
    const canvas = canvasRef.current;
    if (!canvas) throw new TypeError('Canvas ref is not set');

    const ctx2d = canvas.getContext('2d');
    if (!ctx2d) throw new TypeError('Could not get canvas 2d context');

    return ctx2d;
  };

  const clearCanvas = () => {
    const ctx = getCanvasContext();
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  };

  const drawBufferOnCanvas = () => {
    const buffer = bufferRef.current;
    if (!buffer) return;

    clearCanvas();

    const ctx = getCanvasContext();

    ctx.lineWidth = 1;
    ctx.strokeStyle = '#00bb00';

    const {width} = ctx.canvas;
    const {height} = ctx.canvas;

    const heightPadding = Math.round(height * 0.05);

    const points = buffer.getChannelData(0); // Left channel only (for now)

    ctx.beginPath();

    /**
     * NOTE!
     * The draw is not optimized yet, it's just a quick and dirty way to visualize the buffer.
     */
    const sliceWidth = width / points.length;
    let x = 0;
    for (let i = 0; i < points.length; i++) {
      const v = points[i] * 0.5 + 0.5;
      const y = v * (height - heightPadding * 2) + heightPadding;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.lineTo(width, height / 2);
    ctx.stroke();
  };

  const render = async () => {
    const startMs = performance.now();

    setBufferReady(false);
    setBufferRendering(true);

    clearCanvas();

    bufferRef.current = await renderOffline();

    drawBufferOnCanvas();

    setBufferReady(true);
    setBufferRendering(false);

    console.debug(
      `Rendered buffer in ${performance.now() - startMs}ms: `,
      bufferRef.current,
    );
  };

  const play = async () => {
    const buffer = bufferRef.current;
    if (!buffer) return;

    const context = contextRef.current;
    if (!context) return;

    if (context.state === 'suspended') {
      await context.resume();
    }

    setBufferSourcePlaying(true);

    bufferSourceRef.current = new AudioBufferSourceNode(context, {buffer});
    const source = bufferSourceRef.current;
    source.connect(context.destination);

    const now = context.currentTime;
    source.start(now);
    source.stop(now + buffer.duration);
    source.onended = () => {
      source.disconnect(context.destination);
      bufferSourceRef.current = undefined;
      setBufferSourcePlaying(false);
    };
  };

  const stop = () => {
    const source = bufferSourceRef.current;
    if (!source) return;

    const context = contextRef.current;
    if (!context) return;

    const now = context.currentTime;

    source.stop(now);
  };

  return (
    <div className='flex flex-col gap-2'>
      <Button
        disabled={bufferRendering || bufferSourcePlaying}
        onClick={render}
      >
        Render
      </Button>
      <Button disabled={bufferSourcePlaying || !bufferReady} onClick={play}>
        Play
      </Button>
      <Button disabled={!bufferSourcePlaying} onClick={stop}>
        Stop
      </Button>
      <canvas
        ref={canvasRef}
        className='border border-gray-400'
        width={400}
        height={200}
      />
    </div>
  );
}

const renderOffline = async (): Promise<AudioBuffer> => {
  const duration = 1;
  const offlineContext = new OfflineAudioContext(2, 44100 * duration, 44100);
  const now = offlineContext.currentTime;
  const loopCount = 2;
  const loopDuration = duration / loopCount;
  const adsrAttackTime = 0.05;
  const adsrDecayTime = 0.1;
  const adsrSustainLevel = 0.8;
  const adsrReleaseTime = 0.1;
  for (let i = 0; i < loopCount; i++) {
    const _now = now + loopDuration * i;
    const _duration = loopDuration / 2;

    const oscillator = new OscillatorNode(offlineContext, {
      frequency: 110,
      type: 'sine',
    });
    const gain = new GainNode(offlineContext, {gain: 1});
    const adsr = new ADSREnvelope({
      attackTime: adsrAttackTime,
      decayTime: adsrDecayTime,
      sustainLevel: adsrSustainLevel,
      releaseTime: adsrReleaseTime,
    });

    oscillator.connect(gain);
    gain.connect(offlineContext.destination);

    oscillator.start(_now);
    oscillator.stop(_now + _duration + adsrReleaseTime);
    adsr.run({startTime: _now, duration: _duration, param: gain.gain});

    oscillator.onended = () => {
      oscillator.disconnect(gain);
      gain.disconnect(offlineContext.destination);
    };
  }

  return offlineContext.startRendering();
};

// eslint-disable-next-line @typescript-eslint/naming-convention
class ADSREnvelope {
  private readonly _attackTime: number;
  private readonly _decayTime: number;
  private readonly _sustainLevel: number;
  private readonly _releaseTime: number;

  constructor({
    attackTime,
    decayTime,
    sustainLevel,
    releaseTime,
  }: {
    attackTime: number;
    decayTime: number;
    sustainLevel: number;
    releaseTime: number;
  }) {
    this._attackTime = attackTime;
    this._decayTime = decayTime;
    this._sustainLevel = sustainLevel;
    this._releaseTime = releaseTime;
  }

  run({
    startTime,
    duration,
    param,
  }: {
    startTime: number;
    duration: number;
    param: AudioParam;
  }) {
    param.setValueAtTime(0, startTime);
    param.linearRampToValueAtTime(1, startTime + this._attackTime);
    param.linearRampToValueAtTime(
      this._sustainLevel,
      startTime + this._attackTime + this._decayTime,
    );
    param.setValueAtTime(this._sustainLevel, startTime + duration);
    param.exponentialRampToValueAtTime(
      0.001,
      startTime + duration + this._releaseTime,
    );
  }
}
