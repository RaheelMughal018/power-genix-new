'use client';

import { useFormik } from 'formik';
import { Modal } from '@/app/_shared/components/ui/modal/modal';
import { Button } from '@/app/_shared/components/ui/button/button';
import { Input } from '@/app/_shared/components/ui/input/input';
import { useToast } from '@/app/_shared/components/ui/toast/toast';
import { categoriesApi } from '@/app/_shared/lib/api/client';
import { categorySchema, type CategoryFormValues } from '@/app/_shared/lib/validations/schemas';

interface CategoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  category?: { id: number; name: string } | null;
}

export const CategoryForm = ({ isOpen, onClose, onSuccess, category }: CategoryFormProps) => {
  const { addToast } = useToast();
  const isEditing = !!category;

  const formik = useFormik<CategoryFormValues>({
    enableReinitialize: true,
    initialValues: {
      name: category?.name ?? '',
    },
    validationSchema: categorySchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        if (isEditing) {
          await categoriesApi.update(category.id, { name: values.name });
          addToast({ title: 'Category updated', variant: 'success' });
        } else {
          await categoriesApi.create({ name: values.name });
          addToast({ title: 'Category created', variant: 'success' });
        }
        resetForm();
        onSuccess();
        onClose();
      } catch {
        addToast({
          title: 'Error',
          description: isEditing ? 'Failed to update category' : 'Failed to create category',
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
        title={isEditing ? 'Edit Category' : 'Add Category'}
        showClose
        onClose={handleClose}
      />
      <form onSubmit={formik.handleSubmit}>
        <Modal.Content>
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
