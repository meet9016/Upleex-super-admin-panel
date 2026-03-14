"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { toast } from 'react-toastify';
import { UserPlus, ArrowLeft, User, Mail, Phone, Lock, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { apiService } from '@/services/api';

const createAdminSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().regex(/^[0-9]{10}$/, 'Phone number must be exactly 10 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type CreateAdminFormValues = z.infer<typeof createAdminSchema>;

export default function CreateAdminPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateAdminFormValues>({
    resolver: zodResolver(createAdminSchema),
  });



  const onSubmit = async (data: CreateAdminFormValues) => {
    setIsLoading(true);
    try {
      const result = await apiService.register({
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
      })as any;

      if (result.success || result.status === 200) {
        toast.success('Admin created successfully!');
        reset();
        router.push('/settings');
      } else {
        toast.error(result.message || 'Failed to create admin');
      }
    } catch (error: any) {
      console.error('Create admin error:', error);
      if (error.message?.includes('already registered')) {
        toast.error('Email or phone number is already registered');
      } else {
        toast.error(error.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-4">
            <Link href="/settings">
              <Button variant="outline" size="icon" className="rounded-xl">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <UserPlus className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Create New Admin</h1>
                <p className="text-gray-600 mt-1">Add a new administrator to the system</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <Card className="shadow-sm border-0 bg-white">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              Admin Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Name Field */}
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-semibold text-gray-700">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter admin's full name"
                    className="pl-10 h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                    {...register('name')}
                    error={errors.name?.message}
                  />
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-semibold text-gray-700">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    className="pl-10 h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                    {...register('email')}
                    error={errors.email?.message}
                  />
                </div>
              </div>

              {/* Phone Field */}
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-semibold text-gray-700">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="1234567890 (10 digits only)"
                    className="pl-10 h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                    {...register('phone')}
                    error={errors.phone?.message}
                    maxLength={10}
                  />
                </div>
              </div>



              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-semibold text-gray-700">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10 pr-10 h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                    {...register('password')}
                    error={errors.password?.message}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10 pr-10 h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                    {...register('confirmPassword')}
                    error={errors.confirmPassword?.message}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Info Box */}
              {/* <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Admin Account Info</h4>
                    <ul className="text-sm text-blue-700 mt-2 space-y-1">
                      <li>• Email and phone number must be unique</li>
                      <li>• New admin will be created with no permissions initially</li>
                      <li>• You can assign permissions after creation</li>
                    </ul>
                  </div>
                </div>
              </div> */}

              {/* Submit Buttons */}
            <div className="flex items-center gap-4 pt-4">
  <Button
    type="submit"
    disabled={isLoading}
    className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold"
  >
    {isLoading ? (
      <>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
        Creating Admin...
      </>
    ) : (
      <>
        <UserPlus className="h-4 w-4 mr-2" />
        Create Admin Account
      </>
    )}
  </Button>

  <Link href="/settings" className="flex-1">
    <Button
      type="button"
      variant="outline"
      className="w-full h-12 rounded-xl"
      disabled={isLoading}
    >
      Cancel
    </Button>
  </Link>
</div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}