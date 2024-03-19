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
  samples: Samples;
}): void => {
  const duration2 = duration / 2;
  const duration8 = duration / 8;

  // Hi-hat
  [0, 1, 2, 3, 4, 5, 6, 7].forEach((i) => {
    playSample({
      context,
      buffer: samples.hiHat,
      startAt: startAt + duration8 * i,
      duration: samples.hiHat.duration,
      gain: i % 2 ? 0.25 : 1.0,
    });
  });

  // Snare
  playSample({
    context,
    buffer: samples.snare1,
    startAt: startAt + duration2,
    duration: samples.snare1.duration,
  });
  playSample({
    context,
    buffer: samples.snare2,
    startAt: startAt + duration2,
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
  samples: Samples;
}): void => {
  const duration32 = duration / 32;

  // Melody
  playSample({
    context,
    buffer: samples.melodyLoop,
    startAt,
    duration,
  });

  // Kick
  // prettier-ignore
  [ 0+0,  0+1,  0+6,  0+7,  0+10,
    16+0, 16+1, 16+6, 16+7, 16+10, 16+13].forEach(
     (i) => {
       playSample({
         context,
         buffer: samples.kick,
         startAt: startAt + duration32 * i,
         duration: samples.kick.duration * 0.5,
         gain: 0.875,
       });
     },
   );
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

type Samples = Unpromisify<ReturnType<typeof fetchSamples>>;

const fetchSamples = async (context: BaseAudioContext) => {
  const basePath = '/static/samples';
  const [hiHat, kick, melodyLoop, snare1, snare2] = await Promise.all([
    fetchAudioFile({path: `${basePath}/hi_hat_1.wav`, context}),
    fetchAudioFile({path: `${basePath}/kick_1.wav`, context}),
    fetchAudioFile({path: `${basePath}/melody_loop_1.wav`, context}),
    fetchAudioFile({path: `${basePath}/snare_1.wav`, context}),
    fetchAudioFile({path: `${basePath}/snare_2.wav`, context}),
  ]);
  return {hiHat, kick, melodyLoop, snare1, snare2};
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
