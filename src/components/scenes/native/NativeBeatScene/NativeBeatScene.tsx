'use client';
import {NativeScene} from '../NativeScene';

export function NativeBeatScene() {
  return <NativeScene downloadFileName='beat.wav' renderAudio={renderAudio} />;
}

const renderAudio = async (): Promise<AudioBuffer> => {
  const startMs = performance.now();

  const duration = 1;
  const offlineContext = new OfflineAudioContext(2, 44100 * duration, 44100);
  const now = offlineContext.currentTime;

  const oscillator = new OscillatorNode(offlineContext, {
    frequency: 110,
    type: 'sine',
  });

  oscillator.connect(offlineContext.destination);

  oscillator.start(now);
  oscillator.stop(now + duration);

  oscillator.onended = () => {
    oscillator.disconnect(offlineContext.destination);
  };

  const buffer = await offlineContext.startRendering();
  const diffMs = performance.now() - startMs;
  console.info(
    `[renderAudio] rendered buffer in ${diffMs.toFixed(3)}ms: `,
    buffer,
  );
  return buffer;
};
