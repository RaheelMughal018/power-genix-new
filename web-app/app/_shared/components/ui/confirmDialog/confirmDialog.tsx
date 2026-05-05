'use client';

import { Modal } from '@/app/_shared/components/ui/modal/modal';
import { Button } from '@/app/_shared/components/ui/button/button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  variant?: 'danger' | 'warning';
}

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Delete',
  message = 'Are you sure you want to delete this? This action cannot be undone.',
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  isLoading = false,
  variant = 'danger',
}: ConfirmDialogProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <Modal.Header title={title} showClose onClose={onClose} />
      <Modal.Content>
        <p className="text-sm text-(--color-text-secondary)">{message}</p>
      </Modal.Content>
      <Modal.Footer>
        <Button variant="outline" onClick={onClose} disabled={isLoading}>
          {cancelLabel}
        </Button>
        <Button variant={variant === 'warning' ? 'primary' : 'danger'} onClick={onConfirm} isLoading={isLoading}>
          {confirmLabel}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
