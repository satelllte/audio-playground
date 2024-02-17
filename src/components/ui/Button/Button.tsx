import {forwardRef} from 'react';

type NativeButtonProps = React.ComponentProps<'button'>;
type NativeButtonPropsToExtend = Omit<NativeButtonProps, 'type' | 'className'>;
type ButtonProps = NativeButtonPropsToExtend;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (props, forwardedRef) => (
    <button
      ref={forwardedRef}
      type='button'
      className='cursor-auto select-none border-2 bg-black px-4 py-2 hover:bg-slate-800 active:bg-slate-700 disabled:opacity-50'
      {...props}
    />
  ),
);
