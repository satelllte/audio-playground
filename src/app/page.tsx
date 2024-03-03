import {Heading} from '@/components/ui/Heading';
import Link from 'next/link';

export default function () {
  return (
    <>
      <Heading level={2}>Scenes:</Heading>
      <div className='flex flex-col gap-1 pt-2'>
        <SceneLink path='/scenes/native/beat' />
        <SceneLink path='/scenes/native/demo' />
        <SceneLink path='/scenes/native/oscillator' />
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
