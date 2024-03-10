import {SceneLayout} from '@/components/layouts/SceneLayout';
import {NativeParamsDemoScene} from '@/components/scenes/native/NativeParamsDemoScene';

export default function () {
  return (
    <SceneLayout title='Params demo' engine='native'>
      <NativeParamsDemoScene />
    </SceneLayout>
  );
}
