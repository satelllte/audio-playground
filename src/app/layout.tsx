import type {Metadata} from 'next';
import './globals.css';
import {Heading} from '@/components/ui/Heading';

export const metadata: Metadata = {
  title: 'Audio playground',
  description: 'Web Audio API playground',
};

export default function RootLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <html lang='en'>
      <head>
        <link rel='preconnect' href='https://rsms.me/' />
        <link rel='stylesheet' href='https://rsms.me/inter/inter.css' />
      </head>
      <body className='bg-black text-white'>
        <div className='p-4 sm:px-8'>
          <Heading level={1}>Audio playground</Heading>
        </div>
        <div className='px-4 sm:px-8'>{children}</div>
      </body>
    </html>
  );
}
