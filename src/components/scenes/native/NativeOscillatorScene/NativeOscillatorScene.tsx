'use client';
import {NativeScene} from '../NativeScene';

export function NativeOscillatorScene() {
  return (
    <NativeScene downloadFileName='oscillator.wav' renderAudio={renderAudio} />
  );
}

const renderAudio = async (): Promise<AudioBuffer> => {
  const startMs = performance.now();

  const duration = 2;
  const offlineContext = new OfflineAudioContext(2, 44100 * duration, 44100);
  const now = offlineContext.currentTime;
  const loopCount = 2;
  const loopDuration = duration / loopCount;
  for (let i = 0; i < loopCount; i++) {
    const _now = now + loopDuration * i;

    const oscillator = new OscillatorNode(offlineContext, {
      frequency: 110,
      type: 'triangle',
    });
    const filter = new BiquadFilterNode(offlineContext, {
      type: 'lowpass',
      frequency: 110,
    });

    oscillator.connect(filter);
    filter.connect(offlineContext.destination);

    oscillator.start(_now);
    oscillator.stop(_now + loopDuration / 2);
    filter.frequency.setValueAtTime(110, _now);
    filter.frequency.exponentialRampToValueAtTime(
      110 * 32,
      _now + loopDuration / 4,
    );
    filter.frequency.exponentialRampToValueAtTime(110, _now + loopDuration / 2);

    oscillator.onended = () => {
      oscillator.disconnect(filter);
      filter.disconnect(offlineContext.destination);
    };
  }

  const buffer = await offlineContext.startRendering();
  const diffMs = performance.now() - startMs;
  console.info(
    `[renderAudio] rendered buffer in ${diffMs.toFixed(3)}ms: `,
    buffer,
  );
  return buffer;
};
