import {SceneLayout} from '@/components/layouts/SceneLayout';
import {ToneBeepsScene} from '@/components/scenes/tone/ToneBeepsScene';

export default function () {
  return (
    <SceneLayout title='Beeps' engine='tone'>
      <ToneBeepsScene />
    </SceneLayout>
  );
}
