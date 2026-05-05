'use client';

import { useFormik } from 'formik';
import { Modal } from '@/app/_shared/components/ui/modal/modal';
import { Button } from '@/app/_shared/components/ui/button/button';
import { Input } from '@/app/_shared/components/ui/input/input';
import { useToast } from '@/app/_shared/components/ui/toast/toast';
import { accountsApi } from '@/app/_shared/lib/api/client';
import { openingBalanceSchema, type OpeningBalanceFormValues } from '@/app/_shared/lib/validations/schemas';
import { formatPKR } from '@/app/_shared/lib/utils/currency';
import type { Account } from '@/app/_shared/lib/types/entities';

interface OpeningBalanceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  account: Pick<Account, 'id' | 'name' | 'currentBalance'> | null;
}

export const OpeningBalanceForm = ({ isOpen, onClose, onSuccess, account }: OpeningBalanceFormProps) => {
  const { addToast } = useToast();

  const formik = useFormik<OpeningBalanceFormValues>({
    enableReinitialize: true,
    initialValues: { amount: 0 },
    validationSchema: openingBalanceSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      if (!account) return;
      try {
        await accountsApi.addOpeningBalance(account.id, { amount: values.amount });
        addToast({ title: 'Opening balance set', variant: 'success' });
        resetForm();
        onSuccess();
        onClose();
      } catch {
        addToast({ title: 'Error', description: 'Failed to set opening balance', variant: 'error' });
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleClose = () => {
    formik.resetForm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="sm">
      <Modal.Header title="Set Opening Balance" showClose onClose={handleClose} />
      <form onSubmit={formik.handleSubmit}>
        <Modal.Content>
          <div className="space-y-4">
            {account && (
              <div className="rounded-md bg-(--color-surface-secondary) p-3 text-sm">
                <p className="text-(--color-text-secondary)">Account</p>
                <p className="font-medium text-(--color-text-primary)">{account.name}</p>
                <p className="text-(--color-text-secondary) mt-1">
                  Current Balance: <span className="font-medium text-(--color-text-primary)">{formatPKR(account.currentBalance)}</span>
                </p>
              </div>
            )}
            <Input
              id="amount"
              name="amount"
              type="number"
              label="Opening Balance Amount"
              placeholder="Enter amount"
              value={formik.values.amount}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.amount && formik.errors.amount ? String(formik.errors.amount) : undefined}
              required
            />
          </div>
        </Modal.Content>
        <Modal.Footer>
          <Button variant="outline" type="button" onClick={handleClose} disabled={formik.isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={formik.isSubmitting}>
            Set Balance
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};
