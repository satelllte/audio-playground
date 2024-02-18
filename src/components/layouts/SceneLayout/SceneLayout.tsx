import {Heading} from '@/components/ui/Heading';
import Link from 'next/link';

export function SceneLayout({
  title,
  engine,
  children,
}: {
  readonly title: string;
  readonly engine: 'native' | 'tone';
  readonly children: React.ReactNode;
}) {
  return (
    <>
      <div className='pb-8'>
        <div className='flex gap-2'>
          <Link className='text-lg sm:bottom-8 sm:left-8' href='/'>
            &lt;-
          </Link>
          <Heading level={2}>{`Scene: "${title}"`}</Heading>
        </div>
        <span className='text-red-500'>
          {engine === 'tone' ? 'Tone.js' : 'Native'}
        </span>
      </div>
      {children}
    </>
  );
}
