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

    const {width} = ctx.canvas;
    const {height} = ctx.canvas;

    const paddingY = Math.round(height * 0.05);

    ctx.lineWidth = 1;
    ctx.strokeStyle = '#bb0000';
    ctx.beginPath();
    ctx.moveTo(0, paddingY);
    ctx.lineTo(width, paddingY);
    ctx.moveTo(0, height - paddingY);
    ctx.lineTo(width, height - paddingY);
    ctx.closePath();
    ctx.stroke();

    const points = buffer.getChannelData(0); // Left channel only (for now)

    ctx.strokeStyle = '#00bb00';
    ctx.beginPath();
    for (let i = 0; i < width; i++) {
      const v = points[Math.floor((i / width) * points.length)] * 0.5 + 0.5;
      const y = v * (height - paddingY * 2) + paddingY;
      if (i === 0) ctx.moveTo(i, y);
      else ctx.lineTo(i, y);
    }

    ctx.closePath();
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
  const duration = 2;
  const offlineContext = new OfflineAudioContext(2, 44100 * duration, 44100);

  const now = offlineContext.currentTime;
  const loopCount = Math.round(Math.random() * 9) + 1;
  const loopDuration = duration / loopCount;
  for (let i = 0; i < loopCount; i++) {
    const _now = now + loopDuration * i;
    const oscillator = new OscillatorNode(offlineContext, {
      frequency: 110,
      type: 'sine',
    });
    oscillator.connect(offlineContext.destination);
    oscillator.start(_now);
    oscillator.stop(_now + loopDuration / 2);
  }

  return offlineContext.startRendering();
};
