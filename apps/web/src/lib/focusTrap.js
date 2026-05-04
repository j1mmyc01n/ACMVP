import { useEffect, useRef } from 'react';

/**
 * Focus management hook for modal dialogs.
 *
 * - Moves focus to the first focusable element (or `initialFocusSelector`) on open.
 * - Traps Tab / Shift+Tab inside the container.
 * - Calls `onEscape` on Escape keypress.
 * - Restores focus to the element that was focused before opening.
 *
 * Returns a ref to attach to the modal container.
 */
export function useFocusTrap({ active = true, onEscape, initialFocusSelector } = {}) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!active) return undefined;
    const container = containerRef.current;
    if (!container) return undefined;

    const previouslyFocused = typeof document !== 'undefined' ? document.activeElement : null;

    const focusableSelector = [
      'a[href]',
      'area[href]',
      'button:not([disabled])',
      'input:not([disabled]):not([type="hidden"])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'iframe',
      'object',
      'embed',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
    ].join(',');

    const getFocusable = () =>
      Array.from(container.querySelectorAll(focusableSelector)).filter(
        (el) => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden') && el.offsetParent !== null,
      );

    // Move initial focus.
    const initialEl = initialFocusSelector
      ? container.querySelector(initialFocusSelector)
      : null;
    const focusables = getFocusable();
    const target = initialEl || focusables[0] || container;
    requestAnimationFrame(() => {
      if (target && typeof target.focus === 'function') target.focus();
    });

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && typeof onEscape === 'function') {
        e.preventDefault();
        onEscape();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = getFocusable();
      if (items.length === 0) {
        e.preventDefault();
        container.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        try { previouslyFocused.focus(); } catch (_) {}
      }
    };
  }, [active, onEscape, initialFocusSelector]);

  return containerRef;
}
