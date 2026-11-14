import { Image } from 'react-native';

import { RoadSign } from '@/components/RoadSign';
import { FIGURES } from '@/data/figures';
import type { Question } from '@/data/questions';

/** Figura ufficiale della domanda (o, in mancanza, il segnale disegnato). */
export function QuestionImage({ q, size }: { q: Question; size: number }) {
  if (q.figure && FIGURES[q.figure]) {
    return (
      <Image
        source={FIGURES[q.figure]}
        style={{ width: size * 1.6, height: size }}
        resizeMode="contain"
        accessibilityLabel={`Figura ${q.figure}`}
      />
    );
  }
  if (q.sign) return <RoadSign id={q.sign} size={size} />;
  return null;
}

export const hasImage = (q: Question) => !!((q.figure && FIGURES[q.figure]) || q.sign);
