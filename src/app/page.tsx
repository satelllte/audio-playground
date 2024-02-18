import {Playground} from '@/components/pages/Playground';

export default function () {
  return (
    <div>
      <h1 className='p-4 text-2xl font-bold sm:p-8 sm:text-4xl'>
        Audio playground
      </h1>
      <div className='px-4 sm:px-8'>
        <Playground />
      </div>
    </div>
  );
}
