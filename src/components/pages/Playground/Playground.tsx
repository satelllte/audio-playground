'use client';
import * as Tone from 'tone';
import {useRef, useState} from 'react';
import {Button} from '@/components/ui/Button';

export function Playground() {
  const bufferRef = useRef<Tone.ToneAudioBuffer>();
  const [bufferReady, setBufferReady] = useState(false);
  const [bufferRendering, setBufferRendering] = useState(false);

  const bufferSourceRef = useRef<Tone.ToneBufferSource>();
  const [bufferSourcePlaying, setBufferSourcePlaying] = useState(false);

  const render = async () => {
    const startMs = performance.now();

    setBufferReady(false);
    setBufferRendering(true);

    bufferRef.current = await renderBuffer();

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

    await Tone.start();

    setBufferSourcePlaying(true);

    const now = Tone.now();
    const source = new Tone.BufferSource(buffer).toDestination();
    bufferSourceRef.current = source;

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

    source.stop(Tone.now());
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

const renderBuffer = async () => {
  const total = 5;
  // eslint-disable-next-line new-cap
  return Tone.Offline(({transport}) => {
    const now = 0;

    const osc = new Tone.Oscillator(
      Math.random() * 220 + 220,
      'sine',
    ).toDestination();

    transport.scheduleRepeat(
      (time) => {
        osc.start(time).stop(time + 0.1);
      },
      total / 10,
      now,
      now + total,
    );
    transport.start(now);
    transport.stop(now + total);
  }, total);
};
