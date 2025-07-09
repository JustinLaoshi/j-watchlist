// useCloseOnOutsideOrEscape() is a custom hook that only allows one dropdown to be open at a time.
// This is so that when a user clicks outside of a dropdown, the dropdown closes and
// cannot have multiple dropdowns open overlapping each other.
export function useCloseOnOutsideOrEscape(node: HTMLElement, onClose: () => void, buttonRef?: HTMLElement | null) {
  function handleClick(event: MouseEvent) {
    if (!node || !document.body.contains(node)) return;
    const target = event.target as Node;
    if (buttonRef && buttonRef.contains(target)) return;
    if (!node.contains(target)) {
      onClose();
    }
  }
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      onClose();
    }
  }
  document.addEventListener('click', handleClick, true);
  window.addEventListener('keydown', handleKeydown, true);
  return {
    destroy() {
      document.removeEventListener('click', handleClick, true);
      window.removeEventListener('keydown', handleKeydown, true);
    }
  };
}

// Utility: format a price as USD
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price);
}

// Utility: format a price change and percent
export function formatChange(change: number, changePercent: number): string {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${formatPrice(change)} (${sign}${changePercent.toFixed(2)}%)`;
} 