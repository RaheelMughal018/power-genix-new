'use client';

import { useFormik } from 'formik';
import { Modal } from '@/app/_shared/components/ui/modal/modal';
import { Button } from '@/app/_shared/components/ui/button/button';
import { Input } from '@/app/_shared/components/ui/input/input';
import { useToast } from '@/app/_shared/components/ui/toast/toast';
import { accountsApi } from '@/app/_shared/lib/api/client';
import { accountSchema, type AccountFormValues } from '@/app/_shared/lib/validations/schemas';
import type { Account } from '@/app/_shared/lib/types/entities';

const ACCOUNT_TYPE_OPTIONS = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank', label: 'Bank' },
  { value: 'mobile_wallet', label: 'Mobile Wallet' },
] as const;

interface AccountFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  account?: Pick<Account, 'id' | 'name' | 'type'> | null;
}

export const AccountForm = ({ isOpen, onClose, onSuccess, account }: AccountFormProps) => {
  const { addToast } = useToast();
  const isEditing = !!account;

  const formik = useFormik<AccountFormValues>({
    enableReinitialize: true,
    initialValues: {
      name: account?.name ?? '',
      type: account?.type ?? 'cash',
    },
    validationSchema: accountSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        if (isEditing) {
          await accountsApi.update(account.id, values);
          addToast({ title: 'Account updated', variant: 'success' });
        } else {
          await accountsApi.create(values);
          addToast({ title: 'Account created', variant: 'success' });
        }
        resetForm();
        onSuccess();
        onClose();
      } catch {
        addToast({
          title: 'Error',
          description: isEditing ? 'Failed to update account' : 'Failed to create account',
          variant: 'error',
        });
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
      <Modal.Header
        title={isEditing ? 'Edit Account' : 'Add Account'}
        showClose
        onClose={handleClose}
      />
      <form onSubmit={formik.handleSubmit}>
        <Modal.Content>
          <div className="space-y-4">
            <Input
              id="name"
              name="name"
              label="Account Name"
              placeholder="Enter account name"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.name && formik.errors.name ? formik.errors.name : undefined}
              required
            />
            <div>
              <label
                htmlFor="type"
                className="block text-sm font-medium text-(--color-text-primary) mb-1"
              >
                Account Type <span className="text-(--color-danger)">*</span>
              </label>
              <select
                id="type"
                name="type"
                value={formik.values.type}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full rounded-md border border-(--color-border) bg-(--color-surface) text-(--color-text-primary) px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-(--color-primary)"
              >
                {ACCOUNT_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {formik.touched.type && formik.errors.type && (
                <span className="text-xs text-(--color-danger) mt-1 block">{formik.errors.type}</span>
              )}
            </div>
          </div>
        </Modal.Content>
        <Modal.Footer>
          <Button variant="outline" type="button" onClick={handleClose} disabled={formik.isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={formik.isSubmitting}>
            {isEditing ? 'Update' : 'Create'}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};
