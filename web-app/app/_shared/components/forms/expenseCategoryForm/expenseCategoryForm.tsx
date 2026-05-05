'use client';

import { useFormik } from 'formik';
import { Modal } from '@/app/_shared/components/ui/modal/modal';
import { Button } from '@/app/_shared/components/ui/button/button';
import { Input } from '@/app/_shared/components/ui/input/input';
import { useToast } from '@/app/_shared/components/ui/toast/toast';
import { expenseCategoriesApi } from '@/app/_shared/lib/api/client';
import { expenseCategorySchema, type ExpenseCategoryFormValues } from '@/app/_shared/lib/validations/schemas';

interface ExpenseCategoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  category?: { id: number; name: string; description?: string | null } | null;
}

export const ExpenseCategoryForm = ({ isOpen, onClose, onSuccess, category }: ExpenseCategoryFormProps) => {
  const { addToast } = useToast();
  const isEditing = !!category;

  const formik = useFormik<ExpenseCategoryFormValues>({
    enableReinitialize: true,
    initialValues: {
      name: category?.name ?? '',
      description: category?.description ?? '',
    },
    validationSchema: expenseCategorySchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        if (isEditing) {
          await expenseCategoriesApi.update(category.id, {
            name: values.name,
            description: values.description || undefined,
          });
          addToast({ title: 'Expense category updated', variant: 'success' });
        } else {
          await expenseCategoriesApi.create({
            name: values.name,
            description: values.description || undefined,
          });
          addToast({ title: 'Expense category created', variant: 'success' });
        }
        resetForm();
        onSuccess();
        onClose();
      } catch {
        addToast({
          title: 'Error',
          description: isEditing ? 'Failed to update expense category' : 'Failed to create expense category',
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
        title={isEditing ? 'Edit Expense Category' : 'Add Expense Category'}
        showClose
        onClose={handleClose}
      />
      <form onSubmit={formik.handleSubmit}>
        <Modal.Content>
          <div className="space-y-4">
            <Input
              id="name"
              name="name"
              label="Category Name"
              placeholder="Enter category name"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.name && formik.errors.name ? formik.errors.name : undefined}
              required
            />
            <div className="space-y-1">
              <label htmlFor="description" className="text-sm font-medium text-(--color-text-primary)">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formik.values.description}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                rows={3}
                placeholder="Optional description..."
                className="w-full px-3 py-2 rounded-lg border border-(--color-border) bg-(--color-bg-primary) text-(--color-text-primary) resize-none text-sm"
              />
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
