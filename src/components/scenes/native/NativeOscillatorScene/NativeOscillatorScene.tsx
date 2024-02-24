'use client';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {Button} from '@/components/ui/Button';
import {downsample, renderAudio} from './audio';
import {clearCanvas, drawWaveformOnCanvas, resizeCanvas} from './canvas';

export function NativeOscillatorScene() {
  const contextRef = useAudioContextRef();

  const canvasRef = useRef<React.ElementRef<'canvas'>>(null);

  const bufferRef = useRef<AudioBuffer>();
  const [bufferReady, setBufferReady] = useState(false);
  const [bufferRendering, setBufferRendering] = useState(false);

  const bufferSourceRef = useRef<AudioBufferSourceNode>();
  const [bufferSourcePlaying, setBufferSourcePlaying] = useState(false);

  const getCanvasContext = () => {
    const canvas = canvasRef.current;
    if (!canvas) throw new TypeError('Canvas ref is not set');

    const ctx2d = canvas.getContext('2d');
    if (!ctx2d) throw new TypeError('Could not get canvas 2d context');

    return ctx2d;
  };

  const drawWaveform = async () => {
    const buffer = bufferRef.current;
    if (!buffer) return;

    const ctx = getCanvasContext();
    clearCanvas({ctx});

    const downsampledBuffer = await downsample({buffer});
    drawWaveformOnCanvas({
      ctx,
      pointsL: downsampledBuffer.getChannelData(0),
      pointsR: downsampledBuffer.getChannelData(1),
    });
  };

  const render = async () => {
    setBufferReady(false);
    setBufferRendering(true);

    const ctx = getCanvasContext();
    clearCanvas({ctx});

    const buffer = await renderAudio();
    bufferRef.current = buffer;

    await drawWaveform();

    setBufferReady(true);
    setBufferRendering(false);
  };

  const play = async () => {
    const buffer = bufferRef.current;
    if (!buffer) return;

    const context = contextRef.current;
    if (!context) return;

    if (context.state === 'suspended') {
      await context.resume();
    }

    setBufferSourcePlaying(true);

    bufferSourceRef.current = new AudioBufferSourceNode(context, {buffer});
    const source = bufferSourceRef.current;
    source.connect(context.destination);

    const now = context.currentTime;
    source.start(now);
    source.stop(now + buffer.duration);
    source.onended = () => {
      source.disconnect(context.destination);
      bufferSourceRef.current = undefined;
      setBufferSourcePlaying(false);
    };
  };

  const stop = () => {
    const source = bufferSourceRef.current;
    if (!source) return;

    const context = contextRef.current;
    if (!context) return;

    const now = context.currentTime;

    source.stop(now);
  };

  return (
    <div className='flex flex-col gap-2'>
      <Button
        disabled={bufferRendering || bufferSourcePlaying}
        onClick={render}
      >
        Render
      </Button>
      <Button disabled={bufferSourcePlaying || !bufferReady} onClick={play}>
        Play
      </Button>
      <Button disabled={!bufferSourcePlaying} onClick={stop}>
        Stop
      </Button>
      <div className='relative box-border h-48 w-full border-2 border-white/50'>
        <Canvas ref={canvasRef} />
      </div>
    </div>
  );
}

const useAudioContextRef = () => {
  const contextRef = useRef<AudioContext>();

  useEffect(() => {
    contextRef.current = new AudioContext();
    return () => {
      if (!contextRef.current) return;
      void contextRef.current.close();
      contextRef.current = undefined;
    };
  }, []);

  return contextRef;
};

type NativeCanvasProps = React.ComponentProps<'canvas'>;
type CanvasProps = Omit<NativeCanvasProps, 'className' | 'width' | 'height'>;
const Canvas = forwardRef<HTMLCanvasElement, CanvasProps>(
  (props, forwardedRef) => {
    const ref = useRef<React.ElementRef<'canvas'>>(null);

    useImperativeHandle(forwardedRef, () => {
      const canvas = ref.current;
      if (!canvas) throw new TypeError('Canvas ref is not set');
      return canvas;
    });

    useEffect(() => {
      const _resizeCanvas = () => {
        const canvas = ref.current;
        if (!canvas) return;
        resizeCanvas({canvas});
      };

      _resizeCanvas();

      window.addEventListener('resize', _resizeCanvas);

      return () => {
        window.removeEventListener('resize', _resizeCanvas);
      };
    }, []);

    return (
      <canvas ref={ref} className='absolute inset-0 size-full' {...props} />
    );
  },
);
