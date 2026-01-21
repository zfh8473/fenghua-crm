/**
 * Customer Timeline Modal Component
 * 
 * Modal for displaying customer timeline (all interactions for a customer) with role-based filtering
 * All custom code is proprietary and not open source.
 */

import { useEffect, useRef } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { CustomerTimeline } from './CustomerTimeline';

interface CustomerTimelineModalProps {
  customerId: string;
  isOpen: boolean;
  onClose: () => void;
  onInteractionChange?: () => void;
}

/**
 * Customer Timeline Modal Component
 * 
 * Displays customer timeline in a modal dialog
 */
export const CustomerTimelineModal: React.FC<CustomerTimelineModalProps> = ({
  customerId,
  isOpen,
  onClose,
  onInteractionChange,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Handle ESC key to close modal and focus trap
  useEffect(() => {
    if (!isOpen) return;

    // Store previous focus
    previousFocusRef.current = document.activeElement as HTMLElement;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      // Focus trap: prevent tabbing outside modal
      if (event.key === 'Tab') {
        const modal = modalRef.current;
        if (!modal) return;

        const focusableElements = modal.querySelectorAll<HTMLElement>(
          'button:not([tabindex="-1"]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement || document.activeElement === modal) {
            event.preventDefault();
            lastElement?.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    // Focus close button when modal opens
    setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 0);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Restore focus to previous element
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-monday-4"
      role="presentation"
    >
      {/* Clickable overlay to close modal */}
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 w-full h-full cursor-default"
        aria-label="关闭"
        tabIndex={-1}
      />
      <div
        ref={modalRef}
        className="relative max-w-6xl max-h-[90vh] w-full bg-monday-surface rounded-monday-lg shadow-monday-lg overflow-hidden z-10 flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label="客户时间线"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-monday-4 border-b border-gray-200">
          <h2 className="text-monday-xl font-semibold text-monday-text">客户时间线</h2>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="p-monday-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="关闭"
            tabIndex={0}
          >
            <span className="text-monday-xl">✕</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-monday-4">
          <CustomerTimeline 
            customerId={customerId}
            onInteractionChange={onInteractionChange}
          />
        </div>
      </div>
    </div>
  );
};
