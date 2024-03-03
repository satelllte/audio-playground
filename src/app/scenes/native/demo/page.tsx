import {SceneLayout} from '@/components/layouts/SceneLayout';
import {NativeDemoScene} from '@/components/scenes/native/NativeDemoScene';

export default function () {
  return (
    <SceneLayout title='Demo' engine='native'>
      <NativeDemoScene />
    </SceneLayout>
  );
}
