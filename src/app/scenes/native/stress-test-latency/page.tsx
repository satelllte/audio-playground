import {SceneLayout} from '@/components/layouts/SceneLayout';
import {NativeStressTestLatencyScene} from '@/components/scenes/native/NativeStressTestLatencyScene';

export default function () {
  return (
    <SceneLayout title='Stress test of latency' engine='native'>
      <NativeStressTestLatencyScene />
    </SceneLayout>
  );
}
