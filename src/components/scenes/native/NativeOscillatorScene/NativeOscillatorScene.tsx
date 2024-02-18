'use client';
import {useEffect, useRef, useState} from 'react';
import {Button} from '@/components/ui/Button';

export function NativeOscillatorScene() {
  const contextRef = useRef<AudioContext>();

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

  const render = async () => {
    const startMs = performance.now();

    setBufferReady(false);
    setBufferRendering(true);

    bufferRef.current = await renderOffline();

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
    </div>
  );
}

const renderOffline = async (): Promise<AudioBuffer> => {
  const duration = 1;
  const offlineContext = new OfflineAudioContext(2, 44100 * duration, 44100);

  const now = offlineContext.currentTime;
  const loopCount = 2;
  const loopDuration = duration / loopCount;
  for (let i = 0; i < loopCount; i++) {
    const _now = now + loopDuration * i;
    const oscillator = new OscillatorNode(offlineContext, {
      frequency: 440,
      type: 'sine',
    });
    oscillator.connect(offlineContext.destination);
    oscillator.start(_now);
    oscillator.stop(_now + loopDuration / 2);
  }

  return offlineContext.startRendering();
};
