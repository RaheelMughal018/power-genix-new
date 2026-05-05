'use client';

import { useFormik } from 'formik';
import { profileSchema, type ProfileFormValues } from '@/app/_shared/lib/validations/schemas';
import { Input } from '@/app/_shared/components/ui/input/input';
import { TextArea } from '@/app/_shared/components/ui/textArea/textArea';
import { Button } from '@/app/_shared/components/ui/button/button';
import { settingsApi } from '@/app/_shared/lib/api/client';
import { useToast } from '@/app/_shared/components/ui/toast/toast';

interface ProfileFormProps {
  initialValues: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
  };
  onSuccess?: () => void;
}

export const ProfileForm = ({ initialValues, onSuccess }: ProfileFormProps) => {
  const { addToast } = useToast();

  const formik = useFormik<ProfileFormValues>({
    initialValues: {
      firstName: initialValues.firstName || '',
      lastName: initialValues.lastName || '',
      phone: initialValues.phone || '',
      address: initialValues.address || '',
    },
    enableReinitialize: true,
    validationSchema: profileSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await settingsApi.updateProfile(values);
        addToast({
          title: 'Success',
          description: 'Profile updated successfully',
          variant: 'success',
        });
        onSuccess?.();
      } catch {
        addToast({
          title: 'Error',
          description: 'Failed to update profile',
          variant: 'error',
        });
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <form onSubmit={formik.handleSubmit} className="space-y-4 max-w-lg">
      <div className="grid grid-cols-2 gap-4">
        <Input
          id="firstName"
          name="firstName"
          label="First Name"
          placeholder="Enter first name"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          value={formik.values.firstName}
          error={formik.touched.firstName && formik.errors.firstName ? formik.errors.firstName : undefined}
          required
        />
        <Input
          id="lastName"
          name="lastName"
          label="Last Name"
          placeholder="Enter last name"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          value={formik.values.lastName}
          error={formik.touched.lastName && formik.errors.lastName ? formik.errors.lastName : undefined}
          required
        />
      </div>

      <Input
        id="email"
        name="email"
        type="email"
        label="Email"
        value={initialValues.email}
        disabled
      />

      <Input
        id="phone"
        name="phone"
        label="Phone"
        placeholder="Enter phone number"
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        value={formik.values.phone || ''}
      />

      <TextArea
        id="address"
        name="address"
        label="Address"
        placeholder="Enter address"
        rows={3}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        value={formik.values.address || ''}
      />

      <Button
        type="submit"
        variant="primary"
        isLoading={formik.isSubmitting}
      >
        Save Changes
      </Button>
    </form>
  );
};
