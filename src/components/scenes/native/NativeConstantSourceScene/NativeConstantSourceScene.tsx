'use client';
import {useAudioContextRef} from '@/hooks/useAudioContextRef';
import {Button} from '@/components/ui/Button';
import {useEffect, useRef, useState} from 'react';

export function NativeConstantSourceScene() {
  const [volume, setVolume] = useState<number>(0.75);
  const [playing, setPlaying] = useState<boolean>(false);

  const contextRef = useAudioContextRef();

  const constantRef = useConstantSourceNodeRef(contextRef, {offset: volume});
  const gain1Ref = useGainNodeRef(contextRef, {gain: 0.0});
  const gain2Ref = useGainNodeRef(contextRef, {gain: 0.0});
  const gain3Ref = useGainNodeRef(contextRef, {gain: 0.0});
  const osc1Ref = useOscillatorNodeRef(contextRef, undefined, {skip: true});
  const osc2Ref = useOscillatorNodeRef(contextRef, undefined, {skip: true});
  const osc3Ref = useOscillatorNodeRef(contextRef, undefined, {skip: true});

  useEffect(() => {
    const context = contextRef.current;
    const constant = constantRef.current;
    const gain1 = gain1Ref.current;
    const gain2 = gain2Ref.current;
    const gain3 = gain3Ref.current;
    if (!context) return;
    if (!constant) return;
    if (!gain1) return;
    if (!gain2) return;
    if (!gain3) return;

    constant.start();

    constant.connect(gain1.gain);
    constant.connect(gain2.gain);
    constant.connect(gain3.gain);

    gain1.connect(context.destination);
    gain2.connect(context.destination);
    gain3.connect(context.destination);
  }, [contextRef, constantRef, gain1Ref, gain2Ref, gain3Ref]);

  useEffect(() => {
    const context = contextRef.current;
    const constant = constantRef.current;
    if (!context) return;
    if (!constant) return;

    const now = context.currentTime;

    constant.offset.setValueAtTime(volume, now);
  }, [volume, contextRef, constantRef]);

  const play = async () => {
    const context = contextRef.current;
    if (!context) return;
    if (context.state === 'suspended') {
      await context.resume();
    }

    const gain1 = gain1Ref.current;
    const gain2 = gain2Ref.current;
    const gain3 = gain3Ref.current;
    if (!gain1) return;
    if (!gain2) return;
    if (!gain3) return;

    setPlaying(true);

    const now = context.currentTime;

    osc1Ref.current = new OscillatorNode(context, {frequency: 261.625});
    osc2Ref.current = new OscillatorNode(context, {frequency: 329.628});
    osc3Ref.current = new OscillatorNode(context, {frequency: 391.995});

    const osc1 = osc1Ref.current;
    const osc2 = osc2Ref.current;
    const osc3 = osc3Ref.current;

    osc1.connect(gain1);
    osc2.connect(gain2);
    osc3.connect(gain3);

    osc1.start(now);
    osc2.start(now);
    osc3.start(now);

    osc1.onended = () => {
      osc1Ref.current?.disconnect();
      osc1Ref.current = undefined;
    };

    osc2.onended = () => {
      osc2Ref.current?.disconnect();
      osc2Ref.current = undefined;
    };

    osc3.onended = () => {
      osc3Ref.current?.disconnect();
      osc3Ref.current = undefined;
    };
  };

  const stop = () => {
    setPlaying(false);

    const context = contextRef.current;
    const osc1 = osc1Ref.current;
    const osc2 = osc2Ref.current;
    const osc3 = osc3Ref.current;
    if (!context) return;
    if (!osc1) return;
    if (!osc2) return;
    if (!osc3) return;

    const now = context.currentTime;

    osc1.stop(now);
    osc2.stop(now);
    osc3.stop(now);
  };

  return (
    <div className='flex flex-col gap-2'>
      <Button onClick={playing ? stop : play}>
        {playing ? 'Stop' : 'Play'}
      </Button>
      <input
        type='range'
        min={0}
        max={1}
        step={0.001}
        value={volume}
        onChange={(event) => {
          setVolume(Number(event.target.value));
        }}
      />
    </div>
  );
}

const useConstantSourceNodeRef = (
  contextRef: React.MutableRefObject<BaseAudioContext | undefined>,
  options?: ConstantSourceOptions,
  initOptions?: InitOptions,
): React.MutableRefObject<ConstantSourceNode | undefined> =>
  useAudioNodeRef(
    (...args) => new ConstantSourceNode(...args),
    contextRef,
    options,
    initOptions,
  );

const useGainNodeRef = (
  contextRef: React.MutableRefObject<BaseAudioContext | undefined>,
  options?: GainOptions,
  initOptions?: InitOptions,
): React.MutableRefObject<GainNode | undefined> =>
  useAudioNodeRef(
    (...args) => new GainNode(...args),
    contextRef,
    options,
    initOptions,
  );

const useOscillatorNodeRef = (
  contextRef: React.MutableRefObject<BaseAudioContext | undefined>,
  options?: OscillatorOptions,
  initOptions?: InitOptions,
): React.MutableRefObject<OscillatorNode | undefined> =>
  useAudioNodeRef(
    (...args) => new OscillatorNode(...args),
    contextRef,
    options,
    initOptions,
  );

type InitOptions = {skip: boolean};
const useAudioNodeRef = <
  TNode extends AudioNode, // eslint-disable-line @typescript-eslint/naming-convention
  TOptions extends AudioNodeOptions | ConstantSourceOptions, // eslint-disable-line @typescript-eslint/naming-convention
>(
  constructorFn: (context: BaseAudioContext, options?: TOptions) => TNode,
  contextRef: React.MutableRefObject<BaseAudioContext | undefined>,
  options?: TOptions,
  initOptions?: InitOptions,
): React.MutableRefObject<TNode | undefined> => {
  const constructorFnRef = useRef(constructorFn);
  const nodeRef = useRef<TNode>();
  const optionsRef = useRef<TOptions | undefined>(options);

  const shouldSkipRef = useRef(initOptions?.skip === true);
  const shouldSkip = shouldSkipRef.current;

  useEffect(() => {
    if (shouldSkip) return;

    const context = contextRef.current;
    if (!context) {
      throw new Error('Audio context is not set in contextRef');
    }

    const constructorFn = constructorFnRef.current;
    const options = optionsRef.current;

    nodeRef.current = constructorFn(context, options);

    return () => {
      nodeRef.current?.disconnect();
      nodeRef.current = undefined;
    };
  }, [constructorFnRef, contextRef, shouldSkip]);

  return nodeRef;
};
