import { Fragment, type ReactNode } from 'react';

/**
 * A translated sentence whose `{placeholders}` are React nodes — a link inside
 * "By continuing you agree to our {terms}". Word order differs between EN and PT,
 * so the sentence is translated whole and the links are dropped into it.
 */
export default function Rich({ text, parts }: { text: string; parts: Record<string, ReactNode> }) {
  return (
    <>
      {text.split(/(\{\w+\})/g).map((chunk, i) => {
        const name = /^\{(\w+)\}$/.exec(chunk)?.[1];
        return <Fragment key={i}>{name !== undefined && name in parts ? parts[name] : chunk}</Fragment>;
      })}
    </>
  );
}
