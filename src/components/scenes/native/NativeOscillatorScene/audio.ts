export const renderAudio = async (): Promise<AudioBuffer> => {
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
      type: 'sine',
    });
    oscillator.connect(offlineContext.destination);
    oscillator.start(_now);
    oscillator.stop(_now + loopDuration / 2);
    oscillator.onended = () => {
      oscillator.disconnect(offlineContext.destination);
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

export const downsample = async ({
  buffer,
}: {
  buffer: AudioBuffer;
}): Promise<AudioBuffer> => {
  const targetSampleRate = 11025;
  if (buffer.sampleRate <= targetSampleRate) {
    return buffer;
  }

  const startMs = performance.now();

  const {numberOfChannels, duration} = buffer;
  const offlineContext = new OfflineAudioContext(
    numberOfChannels,
    targetSampleRate * duration,
    targetSampleRate,
  );

  const bufferSource = new AudioBufferSourceNode(offlineContext, {buffer});
  bufferSource.connect(offlineContext.destination);

  const now = offlineContext.currentTime;
  bufferSource.start(now);
  bufferSource.stop(now + duration);

  const downsampledBuffer = await offlineContext.startRendering();
  const diffMs = performance.now() - startMs;
  console.info(
    `[downsample] rendered buffer in ${diffMs.toFixed(3)}ms: `,
    downsampledBuffer,
  );
  return downsampledBuffer;
};
