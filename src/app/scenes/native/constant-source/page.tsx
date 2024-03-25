import {SceneLayout} from '@/components/layouts/SceneLayout';
import {NativeConstantSourceScene} from '@/components/scenes/native/NativeConstantSourceScene';

export default function () {
  return (
    <SceneLayout title='Constant source' engine='native'>
      <NativeConstantSourceScene />
    </SceneLayout>
  );
}
