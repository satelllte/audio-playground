'use client';
import {type Unpromisify} from '@/utils/types';
import {NativeScene} from '../NativeScene';

export function NativeBeatScene() {
  return <NativeScene downloadFileName='beat.wav' renderAudio={renderAudio} />;
}

const renderAudio = async (sampleRate: number): Promise<AudioBuffer> => {
  const tempo = 154;
  const barsCount = 8;

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
      duration: barDuration,
      samples,
    });
  }

  for (let barIndex = 0; barIndex < barsCount; barIndex += 4) {
    loop4({
      context,
      startAt: now + barDuration * barIndex,
      duration: barDuration * 4,
      samples,
    });
  }

  return context.startRendering();
};

const loop = ({
  context,
  startAt,
  duration,
  samples,
}: {
  context: BaseAudioContext;
  startAt: number;
  duration: number;
  samples: Unpromisify<ReturnType<typeof fetchSamples>>;
}): void => {
  const durationHalf = duration / 2;
  const durationEighth = duration / 8;

  // Hi-hat
  [0, 1, 2, 3, 4, 5, 6, 7].forEach((i) => {
    playSample({
      context,
      buffer: samples.hiHat,
      startAt: startAt + durationEighth * i,
      duration: samples.hiHat.duration,
      gain: i % 2 ? 0.25 : 1.0,
    });
  });

  // Snare
  playSample({
    context,
    buffer: samples.snare1,
    startAt: startAt + durationHalf,
    duration: samples.snare1.duration,
  });
  playSample({
    context,
    buffer: samples.snare2,
    startAt: startAt + durationHalf,
    duration: samples.snare2.duration,
  });
};

const loop4 = ({
  context,
  startAt,
  duration,
  samples,
}: {
  context: BaseAudioContext;
  startAt: number;
  duration: number;
  samples: Unpromisify<ReturnType<typeof fetchSamples>>;
}): void => {
  // Melody
  playSample({
    context,
    buffer: samples.melodyLoop,
    startAt,
    duration,
  });
};

const playSample = ({
  context,
  buffer,
  startAt,
  duration,
  gain = 1.0,
}: {
  context: BaseAudioContext;
  buffer: AudioBuffer;
  startAt: number;
  duration: number;
  gain?: number;
}): AudioBufferSourceNode => {
  const source = new AudioBufferSourceNode(context, {buffer});
  const gainNode = new GainNode(context, {gain});

  source.connect(gainNode);
  gainNode.connect(context.destination);

  source.start(startAt, 0, duration);
  source.onended = () => {
    source.disconnect();
  };

  return source;
};

const fetchSamples = async (context: BaseAudioContext) => {
  const basePath = '/static/samples';
  const [hiHat, melodyLoop, snare1, snare2] = await Promise.all([
    fetchAudioFile({path: `${basePath}/hi_hat_1.wav`, context}),
    fetchAudioFile({path: `${basePath}/melody_loop_1.wav`, context}),
    fetchAudioFile({path: `${basePath}/snare_1.wav`, context}),
    fetchAudioFile({path: `${basePath}/snare_2.wav`, context}),
  ]);
  return {hiHat, melodyLoop, snare1, snare2};
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
