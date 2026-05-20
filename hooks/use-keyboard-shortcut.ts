'use client';

import { useEffect } from 'react';

export interface ShortcutDescriptor {
  /** Required key — checked against `event.key` lowercase. */
  key: string;
  /** Require ⌘ on macOS / Ctrl elsewhere. */
  meta?: boolean;
  /** Require Shift. */
  shift?: boolean;
  /** Require Alt/Option. */
  alt?: boolean;
}

/**
 * Window-level keyboard shortcut. Returns nothing — the caller passes a
 * stable callback. Modifier matching:
 *  - `meta: true` matches ⌘ on macOS, Ctrl elsewhere.
 *  - Other modifiers are matched literally.
 */
export function useKeyboardShortcut(
  descriptor: ShortcutDescriptor,
  handler: (event: KeyboardEvent) => void,
): void {
  useEffect(() => {
    function listener(event: KeyboardEvent) {
      const isMac =
        typeof navigator !== 'undefined' &&
        /Mac|iPhone|iPad/.test(navigator.platform);
      const wantsMeta = descriptor.meta === true;
      const metaPressed = isMac ? event.metaKey : event.ctrlKey;

      if (wantsMeta !== metaPressed) return;
      if ((descriptor.shift ?? false) !== event.shiftKey) return;
      if ((descriptor.alt ?? false) !== event.altKey) return;
      if (event.key.toLowerCase() !== descriptor.key.toLowerCase()) return;

      handler(event);
    }
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [descriptor.key, descriptor.meta, descriptor.shift, descriptor.alt, handler]);
}
