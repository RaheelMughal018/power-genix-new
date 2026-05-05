'use client';

import { useFormik } from 'formik';
import { Modal } from '@/app/_shared/components/ui/modal/modal';
import { Button } from '@/app/_shared/components/ui/button/button';
import { Input } from '@/app/_shared/components/ui/input/input';
import { TextArea } from '@/app/_shared/components/ui/textArea/textArea';
import { useToast } from '@/app/_shared/components/ui/toast/toast';
import { customersApi } from '@/app/_shared/lib/api/client';
import { customerSchema, type CustomerFormValues } from '@/app/_shared/lib/validations/schemas';
import type { Customer } from '@/app/_shared/lib/types/entities';

interface CustomerFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customer?: Pick<Customer, 'id' | 'name' | 'phone' | 'email' | 'address'> | null;
}

export const CustomerForm = ({ isOpen, onClose, onSuccess, customer }: CustomerFormProps) => {
  const { addToast } = useToast();
  const isEditing = !!customer;

  const formik = useFormik<CustomerFormValues>({
    enableReinitialize: true,
    initialValues: {
      name: customer?.name ?? '',
      phone: customer?.phone ?? '',
      email: customer?.email ?? '',
      address: customer?.address ?? '',
      openingBalance: 0,
    },
    validationSchema: customerSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        if (isEditing) {
          await customersApi.update(customer.id, {
            name: values.name,
            phone: values.phone,
            email: values.email || undefined,
            address: values.address || undefined,
          });
          addToast({ title: 'Customer updated', variant: 'success' });
        } else {
          await customersApi.create({
            name: values.name,
            phone: values.phone,
            email: values.email || undefined,
            address: values.address || undefined,
            openingBalance: values.openingBalance,
          });
          addToast({ title: 'Customer created', variant: 'success' });
        }
        resetForm();
        onSuccess();
        onClose();
      } catch {
        addToast({
          title: 'Error',
          description: isEditing ? 'Failed to update customer' : 'Failed to create customer',
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
        title={isEditing ? 'Edit Customer' : 'Add Customer'}
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
              placeholder="Enter customer name"
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
