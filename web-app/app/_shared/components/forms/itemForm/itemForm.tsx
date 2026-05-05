'use client';

import { useFormik } from 'formik';
import { Modal } from '@/app/_shared/components/ui/modal/modal';
import { Button } from '@/app/_shared/components/ui/button/button';
import { Input } from '@/app/_shared/components/ui/input/input';
import { useToast } from '@/app/_shared/components/ui/toast/toast';
import { itemsApi } from '@/app/_shared/lib/api/client';
import { itemSchema, type ItemFormValues } from '@/app/_shared/lib/validations/schemas';

const ITEM_TYPE_OPTIONS = [
  { value: 'raw_material', label: 'Raw Material' },
  { value: 'final_product', label: 'Final Product' },
] as const;

const UNIT_OPTIONS = [
  { value: 'pcs', label: 'PCS' },
  { value: 'sets', label: 'SETS' },
] as const;

interface ItemFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  item?: { id: number; name: string; categoryId?: number; type: string; unit: string } | null;
  categories: Array<{ id: number; name: string }>;
}

export const ItemForm = ({ isOpen, onClose, onSuccess, item, categories }: ItemFormProps) => {
  const { addToast } = useToast();
  const isEditing = !!item;

  const formik = useFormik<ItemFormValues>({
    enableReinitialize: true,
    initialValues: {
      name: item?.name ?? '',
      categoryId: item?.categoryId ?? (categories[0]?.id ?? 0),
      type: (item?.type as 'raw_material' | 'final_product') ?? 'raw_material',
      unit: (item?.unit as 'pcs' | 'sets') ?? 'pcs',
    },
    validationSchema: itemSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        if (isEditing) {
          await itemsApi.update(item.id, values);
          addToast({ title: 'Item updated', variant: 'success' });
        } else {
          await itemsApi.create(values);
          addToast({ title: 'Item created', variant: 'success' });
        }
        resetForm();
        onSuccess();
        onClose();
      } catch {
        addToast({
          title: 'Error',
          description: isEditing ? 'Failed to update item' : 'Failed to create item',
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

  const selectClass =
    'w-full rounded-md border border-(--color-border) bg-(--color-surface) text-(--color-text-primary) px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-(--color-primary)';

  const labelClass = 'block text-sm font-medium text-(--color-text-primary) mb-1';

  const errorClass = 'text-xs text-(--color-danger) mt-1 block';

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="sm">
      <Modal.Header
        title={isEditing ? 'Edit Item' : 'Add Item'}
        showClose
        onClose={handleClose}
      />
      <form onSubmit={formik.handleSubmit}>
        <Modal.Content>
          <div className="space-y-4">
            <Input
              id="name"
              name="name"
              label="Item Name"
              placeholder="Enter item name"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.name && formik.errors.name ? formik.errors.name : undefined}
              required
            />

            <div>
              <label htmlFor="categoryId" className={labelClass}>
                Category <span className="text-(--color-danger)">*</span>
              </label>
              <select
                id="categoryId"
                name="categoryId"
                value={formik.values.categoryId}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={selectClass}
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {formik.touched.categoryId && formik.errors.categoryId && (
                <span className={errorClass}>{formik.errors.categoryId}</span>
              )}
            </div>

            <div>
              <label htmlFor="type" className={labelClass}>
                Type <span className="text-(--color-danger)">*</span>
              </label>
              <select
                id="type"
                name="type"
                value={formik.values.type}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={selectClass}
              >
                {ITEM_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {formik.touched.type && formik.errors.type && (
                <span className={errorClass}>{formik.errors.type}</span>
              )}
            </div>

            <div>
              <label htmlFor="unit" className={labelClass}>
                Unit <span className="text-(--color-danger)">*</span>
              </label>
              <select
                id="unit"
                name="unit"
                value={formik.values.unit}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={selectClass}
              >
                {UNIT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {formik.touched.unit && formik.errors.unit && (
                <span className={errorClass}>{formik.errors.unit}</span>
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
