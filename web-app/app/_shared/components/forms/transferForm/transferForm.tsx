'use client';

import { useFormik } from 'formik';
import { Modal } from '@/app/_shared/components/ui/modal/modal';
import { Button } from '@/app/_shared/components/ui/button/button';
import { Input } from '@/app/_shared/components/ui/input/input';
import { TextArea } from '@/app/_shared/components/ui/textArea/textArea';
import { useToast } from '@/app/_shared/components/ui/toast/toast';
import { accountsApi } from '@/app/_shared/lib/api/client';
import { transferSchema, type TransferFormValues } from '@/app/_shared/lib/validations/schemas';
import { formatPKR } from '@/app/_shared/lib/utils/currency';

interface AccountOption {
  id: number;
  name: string;
  type: string;
  currentBalance: number;
}

interface TransferFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  accounts: AccountOption[];
}

export const TransferForm = ({ isOpen, onClose, onSuccess, accounts }: TransferFormProps) => {
  const { addToast } = useToast();

  const formik = useFormik<TransferFormValues>({
    enableReinitialize: true,
    initialValues: {
      fromAccountId: accounts[0]?.id ?? 0,
      toAccountId: accounts[1]?.id ?? 0,
      amount: 0,
      notes: '',
    },
    validationSchema: transferSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        await accountsApi.transfer({
          fromAccountId: values.fromAccountId,
          toAccountId: values.toAccountId,
          amount: values.amount,
          notes: values.notes || undefined,
        });
        addToast({ title: 'Transfer completed', variant: 'success' });
        resetForm();
        onSuccess();
        onClose();
      } catch {
        addToast({ title: 'Error', description: 'Failed to complete transfer', variant: 'error' });
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleClose = () => {
    formik.resetForm();
    onClose();
  };

  const toAccountOptions = accounts.filter((a) => a.id !== Number(formik.values.fromAccountId));
  const fromAccountOptions = accounts.filter((a) => a.id !== Number(formik.values.toAccountId));

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="sm">
      <Modal.Header title="Transfer Between Accounts" showClose onClose={handleClose} />
      <form onSubmit={formik.handleSubmit}>
        <Modal.Content>
          <div className="space-y-4">
            <div>
              <label htmlFor="fromAccountId" className="block text-sm font-medium text-(--color-text-primary) mb-1">
                From Account <span className="text-(--color-danger)">*</span>
              </label>
              <select
                id="fromAccountId"
                name="fromAccountId"
                value={formik.values.fromAccountId}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full rounded-md border border-(--color-border) bg-(--color-surface) text-(--color-text-primary) px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-(--color-primary)"
              >
                {fromAccountOptions.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} — {formatPKR(a.currentBalance)}
                  </option>
                ))}
              </select>
              {formik.touched.fromAccountId && formik.errors.fromAccountId && (
                <span className="text-xs text-(--color-danger) mt-1 block">{formik.errors.fromAccountId}</span>
              )}
            </div>

            <div>
              <label htmlFor="toAccountId" className="block text-sm font-medium text-(--color-text-primary) mb-1">
                To Account <span className="text-(--color-danger)">*</span>
              </label>
              <select
                id="toAccountId"
                name="toAccountId"
                value={formik.values.toAccountId}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full rounded-md border border-(--color-border) bg-(--color-surface) text-(--color-text-primary) px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-(--color-primary)"
              >
                {toAccountOptions.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} — {formatPKR(a.currentBalance)}
                  </option>
                ))}
              </select>
              {formik.touched.toAccountId && formik.errors.toAccountId && (
                <span className="text-xs text-(--color-danger) mt-1 block">{formik.errors.toAccountId}</span>
              )}
            </div>

            <Input
              id="amount"
              name="amount"
              type="number"
              label="Amount"
              placeholder="Enter transfer amount"
              value={formik.values.amount}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.amount && formik.errors.amount ? String(formik.errors.amount) : undefined}
              required
            />

            <TextArea
              id="notes"
              name="notes"
              label="Notes (optional)"
              placeholder="Add any notes..."
              rows={3}
              value={formik.values.notes ?? ''}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
          </div>
        </Modal.Content>
        <Modal.Footer>
          <Button variant="outline" type="button" onClick={handleClose} disabled={formik.isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={formik.isSubmitting}>
            Transfer
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};
