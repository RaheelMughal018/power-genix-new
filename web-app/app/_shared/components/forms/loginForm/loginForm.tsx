'use client';

import { useFormik } from 'formik';
import { loginSchema, type LoginFormValues } from '@/app/_shared/lib/validations/schemas';
import { Input } from '@/app/_shared/components/ui/input/input';
import { Button } from '@/app/_shared/components/ui/button/button';
import { useAuth } from '@/app/_shared/lib/hooks/useAuth';
import { authApi } from '@/app/_shared/lib/api/client';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/app/_shared/lib/config/routes';

interface LoginFormProps {
  callbackUrl?: string;
}

export function LoginForm({ callbackUrl = ROUTES.DASHBOARD }: LoginFormProps) {
  const { login } = useAuth();
  const router = useRouter();

  const formik = useFormik<LoginFormValues>({
    initialValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
    validationSchema: loginSchema,
    onSubmit: async (values, { setSubmitting, setErrors }) => {
      try {
        const response = await authApi.login(values.email, values.password);
        const resData = response.data as { data?: { user: { id: number; email: string; firstName: string }; tokens: { accessToken: string; refreshToken: string } }; user?: { id: number; email: string; firstName: string }; tokens?: { accessToken: string; refreshToken: string } };
        const result = resData.data || resData;
        const { user: userData, tokens } = result as { user: { id: number; email: string; firstName: string }; tokens: { accessToken: string; refreshToken: string } };

        await login(tokens.accessToken, tokens.refreshToken, {
          id: String(userData.id),
          email: userData.email,
          firstName: userData.firstName,
        });

        router.push(callbackUrl);
      } catch {
        setErrors({
          email: 'Invalid email or password',
          password: 'Invalid email or password',
        });
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <form onSubmit={formik.handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <Input
          id="email"
          name="email"
          type="email"
          label="Email"
          placeholder="Enter your email"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          value={formik.values.email}
          error={formik.touched.email && formik.errors.email ? formik.errors.email : undefined}
          required
        />

        <Input
          id="password"
          name="password"
          type="password"
          label="Password"
          placeholder="Enter your password"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          value={formik.values.password}
          error={formik.touched.password && formik.errors.password ? formik.errors.password : undefined}
          required
        />
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="rememberMe"
            checked={formik.values.rememberMe}
            onChange={formik.handleChange}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-[var(--color-text-secondary)]">Remember me</span>
        </label>

      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        isLoading={formik.isSubmitting}
      >
        Sign in
      </Button>

    </form>
  );
}
