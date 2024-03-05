import {SceneLayout} from '@/components/layouts/SceneLayout';
import {NativeBeatScene} from '@/components/scenes/native/NativeBeatScene';
import {NativeOscillatorScene} from '@/components/scenes/native/NativeOscillatorScene';
import {nativeScenes, type NativeScene} from '@/constants';

type Params = {readonly scene: NativeScene};
type Props = {readonly params: Params};

export default function ({params}: Props) {
  const {title, Scene} = getScene(params.scene);
  return (
    <SceneLayout title={title} engine='native'>
      <Scene />
    </SceneLayout>
  );
}

export const generateStaticParams = (): Params[] =>
  nativeScenes.map((scene) => ({scene}));

const getScene = (scene: NativeScene) => {
  switch (scene) {
    case 'beat':
      return {
        title: 'Beat',
        Scene: NativeBeatScene,
      };
    case 'oscillator':
      return {
        title: 'Oscillator',
        Scene: NativeOscillatorScene,
      };
    // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
    default:
      throw new Error(`The scene doesn't exist`);
  }
};
