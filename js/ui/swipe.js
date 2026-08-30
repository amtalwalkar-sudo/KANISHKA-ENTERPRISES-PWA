const DEFAULT_THRESHOLD = 72;
const DEFAULT_AXIS_RATIO = 1.25;
const LOCAL_GESTURE_SELECTOR = [
  '[data-action="trip"]',
  '.quick-fuel-zone',
  'button',
  'input',
  'textarea',
  'select',
  'a',
  '[contenteditable="true"]',
].join(',');

function isLocalGestureTarget(target) {
  return target instanceof Element && Boolean(target.closest(LOCAL_GESTURE_SELECTOR));
}

export function axisLockedDirection(dx, dy, { threshold = DEFAULT_THRESHOLD, axisRatio = DEFAULT_AXIS_RATIO } = {}) {
  const x = Number(dx) || 0;
  const y = Number(dy) || 0;
  const distance = Math.hypot(x, y);
  if (distance < threshold) return 'NONE';
  if (Math.abs(x) < Math.abs(y) * axisRatio) return 'NONE';
  return x > 0 ? 'RIGHT' : 'LEFT';
}

export function createHorizontalSwipeEngine({
  element,
  onSwipe = () => {},
  threshold = DEFAULT_THRESHOLD,
  axisRatio = DEFAULT_AXIS_RATIO,
} = {}) {
  if (!element) return () => {};
  let startX = 0;
  let startY = 0;
  let tracking = false;

  const onPointerDown = (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (isLocalGestureTarget(event.target)) {
      tracking = false;
      return;
    }
    startX = event.clientX;
    startY = event.clientY;
    tracking = true;
  };
  const onPointerUp = (event) => {
    if (!tracking) return;
    tracking = false;
    const direction = axisLockedDirection(event.clientX - startX, event.clientY - startY, { threshold, axisRatio });
    if (direction !== 'NONE') onSwipe(direction);
  };
  const onPointerCancel = () => { tracking = false; };

  element.addEventListener('pointerdown', onPointerDown, { passive: true });
  element.addEventListener('pointerup', onPointerUp, { passive: true });
  element.addEventListener('pointercancel', onPointerCancel, { passive: true });
  return () => {
    element.removeEventListener('pointerdown', onPointerDown);
    element.removeEventListener('pointerup', onPointerUp);
    element.removeEventListener('pointercancel', onPointerCancel);
  };
}