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

  for (let barIndex = 0; barIndex < barsCount; barIndex += 2) {
    loop2({
      context,
      startAt: now + barDuration * barIndex,
      duration: barDuration * 2,
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
      process(source) {
        const gain = new GainNode(context, {gain: i % 2 ? 0.25 : 1.0});
        source.connect(gain);
        gain.connect(context.destination);
      },
    });
  });

  // Snare
  playSample({
    context,
    buffer: samples.snare1,
    startAt: startAt + duration2,
    duration: samples.snare1.duration,
    process(source) {
      const highPass = new BiquadFilterNode(context, {
        type: 'highpass',
        frequency: 150,
      });
      source.connect(highPass);
      highPass.connect(context.destination);
    },
  });
  playSample({
    context,
    buffer: samples.snare2,
    startAt: startAt + duration2,
    duration: samples.snare2.duration,
    process(source) {
      const highPass = new BiquadFilterNode(context, {
        type: 'highpass',
        frequency: 150,
      });
      source.connect(highPass);
      highPass.connect(context.destination);
    },
  });
};

const loop2 = ({
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
  const duration16 = duration / 16;

  // Snare (extra)
  [9].forEach((i) => {
    playSample({
      context,
      buffer: samples.snareExtra1,
      startAt: startAt + duration16 * i,
      duration: samples.snareExtra1.duration,
      process(source) {
        source.connect(context.destination);
      },
    });
    playSample({
      context,
      buffer: samples.snareExtra2,
      startAt: startAt + duration16 * i,
      duration: samples.snareExtra2.duration,
      process(source) {
        source.connect(context.destination);
      },
    });
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
    process(source) {
      const highPass = new BiquadFilterNode(context, {
        type: 'highpass',
        frequency: 475,
      });
      source.connect(highPass);
      highPass.connect(context.destination);
    },
  });

  // Kick
  [0, 1, 6, 7, 10, 16, 17, 22, 23, 26, 29].forEach((i) => {
    const _startAt = startAt + duration32 * i;
    const _duration = Math.min(samples.kick.duration, 0.4);
    playSample({
      context,
      buffer: samples.kick,
      startAt: _startAt,
      duration: _duration,
      process(source) {
        const gain = new GainNode(context, {gain: 0.8});

        gain.gain.setValueAtTime(0.8, _startAt + _duration * 0.9);
        gain.gain.linearRampToValueAtTime(0.0, _startAt + _duration);

        source.connect(gain);
        gain.connect(context.destination);
      },
    });
  });

  // Bass
  [
    {i: 0, durationIndexes: 1, pitchShiftSemitones: 2},
    {i: 1, durationIndexes: 5, pitchShiftSemitones: 2},
    {i: 6, durationIndexes: 1, pitchShiftSemitones: 2},
    {i: 7, durationIndexes: 9, pitchShiftSemitones: 2},
    {i: 16, durationIndexes: 1, pitchShiftSemitones: 2},
    {i: 17, durationIndexes: 5, pitchShiftSemitones: 2},
    {i: 22, durationIndexes: 1, pitchShiftSemitones: 2},
    {i: 23, durationIndexes: 6, pitchShiftSemitones: 2},
    {i: 29, durationIndexes: 3, pitchShiftSemitones: 14},
  ].forEach(({i, durationIndexes, pitchShiftSemitones}) => {
    const playbackRate = 2 ** (pitchShiftSemitones / 12); // Shifting the note from C3 by X semitones
    const _startAt = startAt + duration32 * i;
    const _duration =
      playbackRate *
      Math.min(duration32 * durationIndexes, samples.bass.duration);
    playSample({
      context,
      buffer: samples.bass,
      startAt: _startAt,
      offset: 0.11,
      duration: _duration,
      process(source) {
        const gain = new GainNode(context);
        source.playbackRate.value = playbackRate; // Shifting the note from C3 by X semitones

        const sidechainLength = 0.05;
        const gainMin = 0.0001;
        const gainMax = 0.75;
        gain.gain.setValueAtTime(gainMin, _startAt);
        gain.gain.exponentialRampToValueAtTime(
          gainMax,
          _startAt + sidechainLength,
        );
        gain.gain.setValueAtTime(gainMax, _startAt + _duration * 0.9);
        gain.gain.linearRampToValueAtTime(gainMin, _startAt + _duration);

        source.connect(gain);
        gain.connect(context.destination);
      },
    });
  });
};

const playSample = ({
  context,
  buffer,
  startAt,
  offset = 0,
  duration,
  process,
}: {
  context: BaseAudioContext;
  buffer: AudioBuffer;
  startAt: number;
  offset?: number;
  duration: number;
  process: (source: AudioBufferSourceNode) => void;
}): AudioBufferSourceNode => {
  const source = new AudioBufferSourceNode(context, {buffer});
  process(source);
  source.start(startAt, offset, duration);

  return source;
};

type Samples = Unpromisify<ReturnType<typeof fetchSamples>>;

const fetchSamples = async (context: BaseAudioContext) => {
  const basePath = '/static/samples';
  const [
    bass,
    hiHat,
    kick,
    melodyLoop,
    snare1,
    snare2,
    snareExtra1,
    snareExtra2,
  ] = await Promise.all([
    fetchAudioFile({path: `${basePath}/bass_1.wav`, context}),
    fetchAudioFile({path: `${basePath}/hi_hat_1.wav`, context}),
    fetchAudioFile({path: `${basePath}/kick_1.wav`, context}),
    fetchAudioFile({path: `${basePath}/melody_loop_1.wav`, context}),
    fetchAudioFile({path: `${basePath}/snare_1.wav`, context}),
    fetchAudioFile({path: `${basePath}/snare_2.wav`, context}),
    fetchAudioFile({path: `${basePath}/snare_extra_1.wav`, context}),
    fetchAudioFile({path: `${basePath}/snare_extra_2.wav`, context}),
  ]);
  return {
    bass,
    hiHat,
    kick,
    melodyLoop,
    snare1,
    snare2,
    snareExtra1,
    snareExtra2,
  };
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
