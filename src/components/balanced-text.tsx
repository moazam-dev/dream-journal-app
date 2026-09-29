import { useState } from 'react';
import { Text, type TextProps, type NativeSyntheticEvent, type TextLayoutEventData } from 'react-native';

import { balanceText } from '@/utils/balance';

/** Two goes at re-measuring is plenty; after that the text is left as it lies. */
const MAX_TRIES = 2;

type BalancedTextProps = Omit<TextProps, 'children'> & { children: string };

/**
 * A heading whose words are shared out evenly over its lines, so it never ends on a lone
 * word ("what did you dream about last / night?" rather than ".../ night?"). It is laid out
 * once as usual to see how many lines the words need, then re-broken by hand to that many.
 */
export function BalancedText({ children, onTextLayout, ...rest }: BalancedTextProps) {
  const [measured, setMeasured] = useState({ text: children, lines: 0, tries: 0 });
  // Different words: back to measuring, this render, before anything is drawn.
  const state = measured.text === children ? measured : { text: children, lines: 0, tries: 0 };

  function onLayout(event: NativeSyntheticEvent<TextLayoutEventData>) {
    const count = event.nativeEvent.lines.length;
    // First pass: how many lines these words take. Later passes only step in when the
    // hand-made breaks needed a line more than expected (a long word pushed one over).
    if (state.lines === 0) {
      if (count > 1) setMeasured({ text: children, lines: count, tries: 0 });
    } else if (count > state.lines && state.tries < MAX_TRIES) {
      setMeasured({ text: children, lines: count, tries: state.tries + 1 });
    }
    onTextLayout?.(event);
  }

  return (
    <Text {...rest} onTextLayout={onLayout}>
      {state.lines > 1 ? balanceText(children, state.lines) : children}
    </Text>
  );
}
