'use client';

import { useEffect, useState } from 'react';
import { Tabs } from '@/app/_shared/components/ui/tabs/tabs';
import { Spinner } from '@/app/_shared/components/ui/spinner/spinner';
import { ProfileForm } from '@/app/_shared/components/forms/profileForm/profileForm';
import { BusinessSettingsForm } from '@/app/_shared/components/forms/businessSettingsForm/businessSettingsForm';
import { settingsApi } from '@/app/_shared/lib/api/client';
import { useToast } from '@/app/_shared/components/ui/toast/toast';
import { changePasswordSchema, type ChangePasswordFormValues } from '@/app/_shared/lib/validations/schemas';
import { useFormik } from 'formik';
import { Input } from '@/app/_shared/components/ui/input/input';
import { Button } from '@/app/_shared/components/ui/button/button';

interface SettingsData {
  profile: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
  };
  business: {
    companyName: string;
    companyLogo: string;
    companyAddress: string;
    companyPhone: string;
    serialPrefix: string;
    fiscalYearStart: number;
  };
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const fetchSettings = async () => {
    try {
      const response = await settingsApi.getSettings();
      const resData = response.data as { data?: SettingsData } & SettingsData;
      setSettings(resData.data || resData);
    } catch {
      addToast({
        title: 'Error',
        description: 'Failed to load settings',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const passwordFormik = useFormik<ChangePasswordFormValues>({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
    validationSchema: changePasswordSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        await settingsApi.changePassword(values.currentPassword, values.newPassword);
        addToast({
          title: 'Success',
          description: 'Password changed successfully',
          variant: 'success',
        });
        resetForm();
      } catch {
        addToast({
          title: 'Error',
          description: 'Failed to change password',
          variant: 'error',
        });
      } finally {
        setSubmitting(false);
      }
    },
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 page-container-sm">
      <div>
        <h1 className="text-2xl font-bold text-(--color-text-primary)">Settings</h1>
        <p className="text-(--color-text-secondary)">Manage your profile and business settings</p>
      </div>

      <Tabs defaultTab="profile">
        <Tabs.List>
          <Tabs.Tab id="profile">Profile</Tabs.Tab>
          <Tabs.Tab id="business">Business Settings</Tabs.Tab>
          <Tabs.Tab id="password">Change Password</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel id="profile">
          <div className="form-container mt-6">
            {settings?.profile && (
              <ProfileForm
                initialValues={settings.profile}
                onSuccess={fetchSettings}
              />
            )}
          </div>
        </Tabs.Panel>

        <Tabs.Panel id="business">
          <div className="form-container mt-6">
            {settings?.business && (
              <BusinessSettingsForm
                initialValues={settings.business}
                onSuccess={fetchSettings}
              />
            )}
          </div>
        </Tabs.Panel>

        <Tabs.Panel id="password">
          <div className="form-container mt-6">
            <form onSubmit={passwordFormik.handleSubmit} className="space-y-4">
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                label="Current Password"
                placeholder="Enter current password"
                onChange={passwordFormik.handleChange}
                onBlur={passwordFormik.handleBlur}
                value={passwordFormik.values.currentPassword}
                error={
                  passwordFormik.touched.currentPassword && passwordFormik.errors.currentPassword
                    ? passwordFormik.errors.currentPassword
                    : undefined
                }
                required
              />
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                label="New Password"
                placeholder="Enter new password"
                onChange={passwordFormik.handleChange}
                onBlur={passwordFormik.handleBlur}
                value={passwordFormik.values.newPassword}
                error={
                  passwordFormik.touched.newPassword && passwordFormik.errors.newPassword
                    ? passwordFormik.errors.newPassword
                    : undefined
                }
                required
              />
              <Input
                id="confirmNewPassword"
                name="confirmNewPassword"
                type="password"
                label="Confirm New Password"
                placeholder="Confirm new password"
                onChange={passwordFormik.handleChange}
                onBlur={passwordFormik.handleBlur}
                value={passwordFormik.values.confirmNewPassword}
                error={
                  passwordFormik.touched.confirmNewPassword && passwordFormik.errors.confirmNewPassword
                    ? passwordFormik.errors.confirmNewPassword
                    : undefined
                }
                required
              />
              <Button
                type="submit"
                variant="primary"
                isLoading={passwordFormik.isSubmitting}
              >
                Change Password
              </Button>
            </form>
          </div>
        </Tabs.Panel>
      </Tabs>
    </div>
  );
}
