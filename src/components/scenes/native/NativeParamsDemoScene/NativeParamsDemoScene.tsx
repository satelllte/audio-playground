'use client';
import {useAudioContextRef} from '@/hooks/useAudioContextRef';
import {Button} from '@/components/ui/Button';
import {NativeScene} from '../NativeScene';

export function NativeParamsDemoScene() {
  const contextRef = useAudioContextRef();

  const play = async () => {
    const context = contextRef.current;
    if (!context) throw new Error('Context was not initialized properly');

    if (context.state === 'suspended') {
      await context.resume();
    }

    schedule({context});
  };

  return (
    <div>
      <Button onClick={play}>Play (realtime)</Button>
      <div className='py-4' />
      <NativeScene
        downloadFileName='params-demo.wav'
        renderAudio={renderAudio}
      />
    </div>
  );
}

const duration = 2;

const schedule = ({context}: {context: BaseAudioContext}): void => {
  console.debug('schedule | context: ', context);
  console.debug('schedule | context.currentTime: ', context.currentTime);

  const start = context.currentTime;

  const oscillator = new OscillatorNode(context, {
    frequency: 110,
    type: 'square',
  });
  const filter = new BiquadFilterNode(context, {
    type: 'lowpass',
    frequency: 100,
  });

  oscillator.connect(filter);
  filter.connect(context.destination);

  oscillator.start(start);
  oscillator.stop(start + duration);

  /// 1
  // gain.gain.linearRampToValueAtTime(0, start + duration * 0.5);
  // gain.gain.linearRampToValueAtTime(0.5, start + duration);

  /// 2
  // gain.gain.setValueCurveAtTime(
  //   [1.0, 0.0, 1.0, 0.0, 1.0, 0.0],
  //   start,
  //   duration,
  // );

  /// 3
  // const lfo = new OscillatorNode(context, {frequency: 10}); // Low-frequency oscillator

  // lfo.connect(gain.gain);

  // lfo.start(start);
  // lfo.stop(start + duration);

  // lfo.onended = () => {
  //   lfo.disconnect();
  // };

  /// 4
  const lfo = new OscillatorNode(context, {frequency: 2.5});
  const lfoGain = new GainNode(context, {gain: 100});

  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);

  lfo.start(start);
  lfo.stop(start + duration);

  lfo.onended = () => {
    lfo.disconnect();
    lfoGain.disconnect();
  };

  oscillator.onended = () => {
    oscillator.disconnect();
    filter.disconnect();
  };
};

const renderAudio = async (sampleRate: number): Promise<AudioBuffer> => {
  const context = new OfflineAudioContext(2, sampleRate * duration, sampleRate);

  schedule({context});

  const buffer = await context.startRendering();
  return buffer;
};
