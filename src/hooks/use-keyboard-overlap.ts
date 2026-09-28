import { useEffect, useState, type RefObject } from 'react';
import { Keyboard, Platform, type View } from 'react-native';

/**
 * How far the on-screen keyboard reaches up into `view` (0 when hidden or clear of it),
 * so something at the bottom of the view can sit just above the keyboard.
 */
export function useKeyboardOverlap(view: RefObject<View | null>) {
  const [overlap, setOverlap] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, (event) => {
      view.current?.measureInWindow((_x, y, _width, height) => setOverlap(Math.max(0, y + height - event.endCoordinates.screenY)));
    });
    const hide = Keyboard.addListener(hideEvent, () => setOverlap(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, [view]);

  return overlap;
}
