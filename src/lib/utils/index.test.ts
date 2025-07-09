// Vitest test suite for utils
import { formatPrice, formatChange, useCloseOnOutsideOrEscape } from './index';
import { vi } from 'vitest';

describe('formatPrice', () => {
  it('formats positive numbers as USD', () => {
    expect(formatPrice(1234.56)).toBe('$1,234.56');
    expect(formatPrice(0)).toBe('$0.00');
  });
  it('formats negative numbers as USD', () => {
    expect(formatPrice(-42)).toBe('-$42.00');
  });
  it('handles large numbers', () => {
    expect(formatPrice(1000000)).toBe('$1,000,000.00');
  });
});

describe('formatChange', () => {
  it('formats positive change and percent', () => {
    expect(formatChange(5, 2.5)).toBe('+$5.00 (+2.50%)');
  });
  it('formats negative change and percent', () => {
    expect(formatChange(-3.5, -1.2)).toBe('-$3.50 (-1.20%)');
  });
  it('formats zero change', () => {
    expect(formatChange(0, 0)).toBe('+$0.00 (+0.00%)');
  });
});

describe('useCloseOnOutsideOrEscape', () => {
  it('calls onClose when clicking outside the node', () => {
    const node = document.createElement('div');
    document.body.appendChild(node);
    const onClose = vi.fn();
    const { destroy } = useCloseOnOutsideOrEscape(node, onClose);
    document.body.click();
    expect(onClose).toHaveBeenCalled();
    destroy();
    document.body.removeChild(node);
  });

  it('does not call onClose when clicking inside the node', () => {
    const node = document.createElement('div');
    document.body.appendChild(node);
    const onClose = vi.fn();
    const { destroy } = useCloseOnOutsideOrEscape(node, onClose);
    node.click();
    expect(onClose).not.toHaveBeenCalled();
    destroy();
    document.body.removeChild(node);
  });

  it('does not call onClose when clicking the buttonRef', () => {
    const node = document.createElement('div');
    const button = document.createElement('button');
    document.body.appendChild(node);
    document.body.appendChild(button);
    const onClose = vi.fn();
    const { destroy } = useCloseOnOutsideOrEscape(node, onClose, button);
    button.click();
    expect(onClose).not.toHaveBeenCalled();
    destroy();
    document.body.removeChild(node);
    document.body.removeChild(button);
  });

  it('calls onClose on Escape keydown', () => {
    const node = document.createElement('div');
    document.body.appendChild(node);
    const onClose = vi.fn();
    const { destroy } = useCloseOnOutsideOrEscape(node, onClose);
    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    window.dispatchEvent(event);
    expect(onClose).toHaveBeenCalled();
    destroy();
    document.body.removeChild(node);
  });
}); 