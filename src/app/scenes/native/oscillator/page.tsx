import {SceneLayout} from '@/components/layouts/SceneLayout';
import {NativeOscillatorScene} from '@/components/scenes/native/NativeOscillatorScene';

export default function () {
  return (
    <SceneLayout title='Oscillator' engine='native'>
      <NativeOscillatorScene />
    </SceneLayout>
  );
}
