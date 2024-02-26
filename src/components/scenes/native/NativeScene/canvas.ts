export const resizeCanvas = ({canvas}: {canvas: HTMLCanvasElement}): void => {
  const {width, height} = canvas.getBoundingClientRect();
  const ratio = Math.max(2, window.devicePixelRatio);
  canvas.width = Math.floor(width * ratio);
  canvas.height = Math.floor(height * ratio);
};

export const clearCanvas = ({ctx}: {ctx: CanvasRenderingContext2D}): void => {
  const {width, height} = ctx.canvas;
  ctx.clearRect(0, 0, width, height);
};

export const drawWaveformOnCanvas = ({
  ctx,
  pointsL,
  pointsR,
}: {
  ctx: CanvasRenderingContext2D;
  pointsL: Float32Array;
  pointsR: Float32Array;
}): void => {
  if (pointsL.length !== pointsR.length) {
    throw new TypeError('left and right channel points length must be equal');
  }

  const startMs = performance.now();

  const {width, height} = ctx.canvas;

  ctx.strokeStyle = '#ffffff';
  const chunkSize = Math.round(pointsL.length / width);
  for (let i = 0; i < width; i++) {
    let minL = 0;
    let maxL = 0;
    let minR = 0;
    let maxR = 0;
    for (let j = i * chunkSize; j < (i + 1) * chunkSize; j++) {
      minL = Math.min(minL, pointsL[j]);
      maxL = Math.max(maxL, pointsL[j]);
      minR = Math.min(minR, pointsR[j]);
      maxR = Math.max(maxR, pointsR[j]);
    }

    minL = Math.max(-1, minL);
    maxL = Math.min(1, maxL);
    minR = Math.max(-1, minR);
    maxR = Math.min(1, maxL);

    ctx.beginPath();
    ctx.moveTo(i, (minL * 0.25 + 0.25) * height);
    ctx.lineTo(i, (maxL * 0.25 + 0.25) * height);
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(i, (minR * 0.25 + 0.75) * height);
    ctx.lineTo(i, (maxR * 0.25 + 0.75) * height);
    ctx.closePath();
    ctx.stroke();
  }

  const diffMs = performance.now() - startMs;
  console.info(
    `[drawWaveformOnCanvas] drew waveform in ${diffMs.toFixed(3)}ms`,
  );
};
