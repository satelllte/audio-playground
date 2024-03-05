import {useEffect, useRef} from 'react';

export const useAudioContextRef = () => {
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
