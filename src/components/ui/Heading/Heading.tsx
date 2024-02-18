import clsx from 'clsx';

export function Heading({
  level,
  children,
}: {
  readonly level: 1 | 2;
  readonly children: string;
}) {
  const Tag = `h${level}` as const;
  return (
    <Tag
      className={clsx(
        level === 1 && 'text-2xl font-bold sm:text-4xl',
        level === 2 && 'text-xl sm:text-2xl',
      )}
    >
      {children}
    </Tag>
  );
}
