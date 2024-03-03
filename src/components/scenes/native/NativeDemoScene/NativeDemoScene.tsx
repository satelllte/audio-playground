'use client';

import {Button} from '@/components/ui/Button';
import {useEffect, useRef} from 'react';

export function NativeDemoScene() {
  const audioContextRef = useRef<AudioContext>();

  useEffect(() => {
    audioContextRef.current = new AudioContext();

    return () => {
      void audioContextRef.current?.close();
      audioContextRef.current = undefined;
    };
  }, []);

  const play = async () => {
    const ctx = audioContextRef.current;
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    const now = ctx.currentTime;
    const oscillator = new OscillatorNode(ctx, {frequency: 440});
    oscillator.start(now);
    oscillator.stop(now + 5.0);

    oscillator.connect(ctx.destination);
  };

  return (
    <div>
      <Button onClick={play}>Play</Button>
    </div>
  );
}
