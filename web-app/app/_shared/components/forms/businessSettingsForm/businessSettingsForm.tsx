'use client';

import { useState } from 'react';
import { useFormik } from 'formik';
import { businessSettingsSchema, type BusinessSettingsFormValues } from '@/app/_shared/lib/validations/schemas';
import { Input } from '@/app/_shared/components/ui/input/input';
import { TextArea } from '@/app/_shared/components/ui/textArea/textArea';
import { Button } from '@/app/_shared/components/ui/button/button';
import { FileUpload } from '@/app/_shared/components/ui/fileUpload/fileUpload';
import { settingsApi } from '@/app/_shared/lib/api/client';
import { useToast } from '@/app/_shared/components/ui/toast/toast';
import Image from 'next/image';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5614';

const getLogoUrl = (path: string): string => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:')) return path;
  return `${API_BASE_URL}${path}`;
};

interface BusinessSettingsFormProps {
  initialValues: {
    companyName: string;
    companyLogo: string;
    companyAddress: string;
    companyPhone: string;
    serialPrefix: string;
    fiscalYearStart: number;
  };
  onSuccess?: () => void;
}

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

export const BusinessSettingsForm = ({ initialValues, onSuccess }: BusinessSettingsFormProps) => {
  const { addToast } = useToast();
  const [logoPreview, setLogoPreview] = useState<string>(getLogoUrl(initialValues.companyLogo || ''));
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const formik = useFormik<BusinessSettingsFormValues>({
    initialValues: {
      companyName: initialValues.companyName || '',
      companyAddress: initialValues.companyAddress || '',
      companyPhone: initialValues.companyPhone || '',
      serialPrefix: initialValues.serialPrefix || 'LEH',
      fiscalYearStart: initialValues.fiscalYearStart || 7,
    },
    enableReinitialize: true,
    validationSchema: businessSettingsSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await settingsApi.updateBusiness(values);
        addToast({
          title: 'Success',
          description: 'Business settings updated successfully',
          variant: 'success',
        });
        onSuccess?.();
      } catch {
        addToast({
          title: 'Error',
          description: 'Failed to update business settings',
          variant: 'error',
        });
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleLogoUpload = async (files: File[]) => {
    if (files.length === 0) return;
    setUploadingLogo(true);
    try {
      const response = await settingsApi.uploadLogo(files[0]);
      const resData = response.data as { data?: { logoPath: string }; logoPath?: string };
      const logoPath = resData.data?.logoPath || resData.logoPath || '';
      setLogoPreview(getLogoUrl(logoPath));
      addToast({
        title: 'Success',
        description: 'Logo uploaded successfully',
        variant: 'success',
      });
    } catch {
      addToast({
        title: 'Error',
        description: 'Failed to upload logo',
        variant: 'error',
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  return (
    <form onSubmit={formik.handleSubmit} className="space-y-6 max-w-lg">
      <div className="space-y-2">
        <label className="text-sm font-medium text-(--color-text-primary)">Company Logo</label>
        {logoPreview && (
          <div className="mb-2">
            <Image
              src={logoPreview}
              alt="Company Logo"
              width={120}
              height={60}
              className="rounded border border-(--color-border)"
              unoptimized
            />
          </div>
        )}
        <FileUpload
          accept="image/*"
          maxSize={5 * 1024 * 1024}
          onFilesChange={handleLogoUpload}
        />
        {uploadingLogo && <p className="text-sm text-(--color-text-secondary)">Uploading...</p>}
      </div>

      <Input
        id="companyName"
        name="companyName"
        label="Company Name"
        placeholder="Enter company name"
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        value={formik.values.companyName || ''}
      />

      <TextArea
        id="companyAddress"
        name="companyAddress"
        label="Company Address"
        placeholder="Enter company address"
        rows={3}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        value={formik.values.companyAddress || ''}
      />

      <Input
        id="companyPhone"
        name="companyPhone"
        label="Company Phone"
        placeholder="Enter company phone"
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        value={formik.values.companyPhone || ''}
      />

      <Input
        id="serialPrefix"
        name="serialPrefix"
        label="Serial Number Prefix"
        placeholder="e.g. LEH"
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        value={formik.values.serialPrefix || ''}
      />

      <div className="space-y-1">
        <label htmlFor="fiscalYearStart" className="text-sm font-medium text-(--color-text-primary)">
          Fiscal Year Start Month
        </label>
        <select
          id="fiscalYearStart"
          name="fiscalYearStart"
          value={formik.values.fiscalYearStart || 7}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          className="w-full px-3 py-2 rounded-lg border border-(--color-border) bg-(--color-bg-primary) text-(--color-text-primary) focus:outline-none focus:ring-2 focus:ring-(--color-primary-500)"
        >
          {MONTHS.map((month) => (
            <option key={month.value} value={month.value}>
              {month.label}
            </option>
          ))}
        </select>
      </div>

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
