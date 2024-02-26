'use client';
import {type Unpromisify} from '@/utils/types';
import {NativeScene} from '../NativeScene';

export function NativeBeatScene() {
  return <NativeScene downloadFileName='beat.wav' renderAudio={renderAudio} />;
}

const renderAudio = async (sampleRate: number): Promise<AudioBuffer> => {
  const tempo = 145;
  const barsCount = 2;

  const beatDuration = 60 / tempo;
  const barDuration = beatDuration * 4; // 4/4 time signature
  const duration = barsCount * barDuration;

  const context = new OfflineAudioContext(2, sampleRate * duration, sampleRate);
  const samples = await fetchSamples(context);

  const now = context.currentTime;

  for (let barIndex = 0; barIndex < barsCount; barIndex++) {
    loop({
      context,
      startAt: now + barDuration * barIndex,
      barDuration,
      samples,
    });
  }

  return context.startRendering();
};

const loop = ({
  context,
  startAt,
  barDuration,
  samples,
}: {
  context: BaseAudioContext;
  startAt: number;
  barDuration: number;
  samples: Unpromisify<ReturnType<typeof fetchSamples>>;
}): void => {
  const durationEighth = barDuration / 8;

  // Kick
  [0, 1].forEach((i) => {
    playSample({
      context,
      buffer: samples.kick,
      startAt: startAt + durationEighth * i,
      duration: samples.kick.duration,
    });
  });

  // Snare
  [4].forEach((i) => {
    playSample({
      context,
      buffer: samples.snare,
      startAt: startAt + durationEighth * i,
      duration: samples.snare.duration,
    });
  });

  // Hi-hat
  [0, 1, 2, 3, 4, 4.5, 5, 6, 7].forEach((i) => {
    playSample({
      context,
      buffer: samples.hiHat,
      startAt: startAt + durationEighth * i,
      duration: samples.hiHat.duration,
    });
  });
};

const playSample = ({
  context,
  buffer,
  startAt,
  duration,
}: {
  context: BaseAudioContext;
  buffer: AudioBuffer;
  startAt: number;
  duration: number;
}): AudioBufferSourceNode => {
  const source = new AudioBufferSourceNode(context, {buffer});
  source.connect(context.destination);
  source.start(startAt, 0, duration);
  source.onended = () => {
    source.disconnect();
  };

  return source;
};

const fetchSamples = async (context: BaseAudioContext) => {
  const basePath = '/static/samples';
  const [hiHat, kick, snare] = await Promise.all([
    fetchAudioFile({path: `${basePath}/hi_hat_1.wav`, context}),
    fetchAudioFile({path: `${basePath}/kick_1.wav`, context}),
    fetchAudioFile({path: `${basePath}/snare_1.wav`, context}),
  ]);
  return {hiHat, kick, snare};
};

const fetchAudioFile = async ({
  path,
  context,
}: {
  path: string;
  context: BaseAudioContext;
}): Promise<AudioBuffer> => {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to fetch audio file from: "${path}"`);

  const arrayBuffer = await res.arrayBuffer();
  return context.decodeAudioData(arrayBuffer);
};
