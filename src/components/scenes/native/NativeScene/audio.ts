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
