import {Heading} from '@/components/ui/Heading';
import {nativeScenes} from '@/constants';
import Link from 'next/link';

export default function () {
  return (
    <>
      <Heading level={2}>Scenes:</Heading>
      <div className='flex flex-col gap-1 pt-2'>
        {nativeScenes.map((scene) => (
          <SceneLink key={scene} path={`/scenes/native/${scene}`} />
        ))}
        <SceneLink path='/scenes/tone/beeps' />
      </div>
    </>
  );
}

function SceneLink({path}: {readonly path: string}) {
  return (
    <div>
      <Link href={path} className='underline'>
        {path}
      </Link>
    </div>
  );
}
