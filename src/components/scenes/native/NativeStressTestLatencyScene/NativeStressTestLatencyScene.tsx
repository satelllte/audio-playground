'use client';
import {useEffect, useRef, useState} from 'react';
import {Button} from '@/components/ui/Button';

export function NativeStressTestLatencyScene() {
  const contextRef = useAudioContextRef();
  const intervalMs = 100;

  const [baseLatency, setBaseLatency] = useState<number | undefined>();
  const [outputLatency, setOutputLatency] = useState<number | undefined>();

  useEffect(() => {
    const intervalHandle = setInterval(() => {
      const context = contextRef.current;
      if (!context) return;

      setBaseLatency(context.baseLatency);
      setOutputLatency(context.outputLatency);
    }, intervalMs);

    return () => {
      clearInterval(intervalHandle);
    };
  }, [contextRef]);

  const play = async () => {
    const context = contextRef.current;
    if (!context) return;

    if (context.state === 'suspended') {
      await context.resume();
    }

    new Array(32).fill(null).forEach((_, index) => {
      const oscillator = new OscillatorNode(context, {
        type: 'triangle',
        frequency: (110 + Math.random() * 220) * (index + 1),
      });
      const gain = new GainNode(context, {gain: 0.25});
      const lfo = new OscillatorNode(context, {frequency: 10.0});
      const lfoGain = new GainNode(context, {gain: 110 * (index + 1)});
      const filter = new BiquadFilterNode(context, {
        type: 'lowpass',
        frequency: 750,
        Q: 1,
      });
      const delay = new DelayNode(context, {delayTime: 0.5});
      const delayFeedback = new GainNode(context, {gain: 0.75});
      const gainDry = new GainNode(context, {gain: 1.0});
      const gainWet = new GainNode(context, {gain: 0.75});

      lfo.connect(lfoGain);
      lfoGain.connect(oscillator.frequency);

      oscillator.connect(gain);
      gain.connect(filter);
      filter.connect(gainDry);
      gainDry.connect(context.destination);

      filter.connect(delay);
      delay.connect(delayFeedback);
      delayFeedback.connect(delay);
      delay.connect(gainWet);
      gainWet.connect(context.destination);

      const now = context.currentTime;
      const startAt = now + 0.1 * index;
      const stopAt = startAt + 0.2;

      lfo.start(startAt);
      lfo.stop(stopAt);
      oscillator.start(startAt);
      oscillator.stop(stopAt);
    });
  };

  return (
    <div>
      <p className='pb-2 text-sm'>
        <i>The values below are being updated each {`${intervalMs}ms`}</i>
      </p>
      <p>
        Base latency:{' '}
        {baseLatency === undefined ? '-' : `${baseLatency.toFixed(3)}s`}
      </p>
      <p className='pb-2'>
        Output latency:{' '}
        {outputLatency === undefined ? '-' : `${outputLatency.toFixed(3)}s`}
      </p>
      <Button onClick={play}>Play</Button>
    </div>
  );
}

const useAudioContextRef = () => {
  const contextRef = useRef<AudioContext>();

  useEffect(() => {
    contextRef.current = new AudioContext();
    return () => {
      if (!contextRef.current) return;
      void contextRef.current.close();
      contextRef.current = undefined;
    };
  }, []);

  return contextRef;
};
