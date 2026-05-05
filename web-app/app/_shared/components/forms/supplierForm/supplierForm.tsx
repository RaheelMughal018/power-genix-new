'use client';

import { useFormik } from 'formik';
import { Modal } from '@/app/_shared/components/ui/modal/modal';
import { Button } from '@/app/_shared/components/ui/button/button';
import { Input } from '@/app/_shared/components/ui/input/input';
import { TextArea } from '@/app/_shared/components/ui/textArea/textArea';
import { useToast } from '@/app/_shared/components/ui/toast/toast';
import { suppliersApi } from '@/app/_shared/lib/api/client';
import { supplierSchema, type SupplierFormValues } from '@/app/_shared/lib/validations/schemas';
import type { Supplier } from '@/app/_shared/lib/types/entities';

interface SupplierFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  supplier?: Pick<Supplier, 'id' | 'name' | 'phone' | 'email' | 'address'> | null;
}

export const SupplierForm = ({ isOpen, onClose, onSuccess, supplier }: SupplierFormProps) => {
  const { addToast } = useToast();
  const isEditing = !!supplier;

  const formik = useFormik<SupplierFormValues>({
    enableReinitialize: true,
    initialValues: {
      name: supplier?.name ?? '',
      phone: supplier?.phone ?? '',
      email: supplier?.email ?? '',
      address: supplier?.address ?? '',
      openingBalance: 0,
    },
    validationSchema: supplierSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        if (isEditing) {
          await suppliersApi.update(supplier.id, {
            name: values.name,
            phone: values.phone,
            email: values.email || undefined,
            address: values.address || undefined,
          });
          addToast({ title: 'Supplier updated', variant: 'success' });
        } else {
          await suppliersApi.create({
            name: values.name,
            phone: values.phone,
            email: values.email || undefined,
            address: values.address || undefined,
            openingBalance: values.openingBalance,
          });
          addToast({ title: 'Supplier created', variant: 'success' });
        }
        resetForm();
        onSuccess();
        onClose();
      } catch {
        addToast({
          title: 'Error',
          description: isEditing ? 'Failed to update supplier' : 'Failed to create supplier',
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
        title={isEditing ? 'Edit Supplier' : 'Add Supplier'}
        showClose
        onClose={handleClose}
      />
      <form onSubmit={formik.handleSubmit}>
        <Modal.Content>
          <div className="space-y-4">
            <Input
              id="name"
              name="name"
              label="Name"
              placeholder="Enter supplier name"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.name && formik.errors.name ? formik.errors.name : undefined}
              required
            />
            <Input
              id="phone"
              name="phone"
              label="Phone"
              placeholder="Enter phone number"
              value={formik.values.phone}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.phone && formik.errors.phone ? formik.errors.phone : undefined}
              required
            />
            <Input
              id="email"
              name="email"
              label="Email"
              placeholder="Enter email (optional)"
              value={formik.values.email ?? ''}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.email && formik.errors.email ? formik.errors.email : undefined}
            />
            <TextArea
              id="address"
              name="address"
              label="Address"
              placeholder="Enter address (optional)"
              value={formik.values.address ?? ''}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.address && formik.errors.address ? formik.errors.address : undefined}
              rows={3}
            />
            {!isEditing && (
              <Input
                id="openingBalance"
                name="openingBalance"
                label="Opening Balance (PKR)"
                type="number"
                placeholder="0"
                value={formik.values.openingBalance ?? 0}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.openingBalance && formik.errors.openingBalance
                    ? formik.errors.openingBalance
                    : undefined
                }
              />
            )}
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
