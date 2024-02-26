import {SceneLayout} from '@/components/layouts/SceneLayout';
import {NativeBeatScene} from '@/components/scenes/native/NativeBeatScene';

export default function () {
  return (
    <SceneLayout title='Beat' engine='native'>
      <NativeBeatScene />
    </SceneLayout>
  );
}
