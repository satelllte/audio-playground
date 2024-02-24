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
  points,
}: {
  ctx: CanvasRenderingContext2D;
  points: Float32Array;
}): void => {
  const startMs = performance.now();

  const {width, height} = ctx.canvas;

  const paddingY = Math.round(height * 0.05);

  ctx.lineWidth = 1;
  ctx.strokeStyle = '#bb0000';
  ctx.beginPath();
  ctx.moveTo(0, paddingY);
  ctx.lineTo(width, paddingY);
  ctx.moveTo(0, height - paddingY);
  ctx.lineTo(width, height - paddingY);
  ctx.closePath();
  ctx.stroke();

  ctx.strokeStyle = '#ffffff';
  const chunkSize = Math.round(points.length / width);
  for (let i = 0; i < width; i++) {
    let min = 0;
    let max = 0;
    for (let j = i * chunkSize; j < (i + 1) * chunkSize; j++) {
      min = Math.min(min, points[j]);
      max = Math.max(max, points[j]);
    }

    ctx.beginPath();
    ctx.moveTo(i, (min * 0.5 + 0.5) * (height - paddingY * 2) + paddingY);
    ctx.lineTo(i, (max * 0.5 + 0.5) * (height - paddingY * 2) + paddingY);
    ctx.closePath();
    ctx.stroke();
  }

  const diffMs = performance.now() - startMs;
  console.info(
    `[drawWaveformOnCanvas] drew waveform in ${diffMs.toFixed(3)}ms`,
  );
};
