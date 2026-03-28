"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { Lock, Mail, Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "react-toastify";
import Link from "next/link";
import { apiService } from "@/services/api";
import Loader from "@/components/common/Loader";

const loginSchema = z.object({
  email: z.string()
    .min(1, { message: "Email address is required" })
    .email({ message: "Valid email address is required" }),
  password: z.string().min(1, { message: "Password is required" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;


export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const {
    register: formRegister,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const response = await apiService.login(data.email, data.password)as any;
      if (response.success && response.data?.token) {
        // Save token and user info
        localStorage.setItem("auth_token", response.data.token);
        localStorage.setItem("user_info", JSON.stringify(response.data.admin));
        
        toast.success("Login successful! Welcome back.");
        router.push("/dashboard");
      } else {
        toast.error(response.message || "Login failed");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

 return (
  <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
    <Card className="w-full max-w-md shadow-xl border-none">
      
      <CardHeader className="space-y-4 text-center pb-8">
        <div className="flex justify-center">
          <img src="/logo.png" alt="Upleex" className="h-12 object-contain" />
        </div>

        <CardTitle className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent">
          Super Admin Login
        </CardTitle>

        <CardDescription>
          Enter your credentials to access the management panel
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          
          {/* Email */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-semibold text-gray-700">
              Email Address
            </label>

            <div className="flex flex-col w-full">
              <Input
  id="email"
  type="text"
  placeholder="admin@upleex.com"
  className={`h-11 rounded-xl border w-full outline-none transition-all
    focus:outline-none focus:ring-0
    ${errors.email
      ? "border-red-500 focus:border-red-500"
      : "border-gray-200 focus:border-indigo-500"
    }`}
  {...formRegister("email")}
/>

              {errors.email?.message && (
                <span className="text-[12px] text-red-600 mt-1">
                  {errors.email.message}
                </span>
              )}
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-semibold text-gray-700">
              Password
            </label>

            <div className="flex flex-col w-full">
    <Input
  id="email"
  type="text"
  placeholder="admin@upleex.com"
  className={`h-11 rounded-xl border w-full outline-none transition-all
    focus:outline-none focus:ring-0
    ${errors.email
      ? "border-red-500 focus:border-red-500"
      : "border-gray-200 focus:border-gray-300"
    }`}
  {...formRegister("email")}
/>

              {errors.password?.message && (
                <span className="text-[12px] text-red-600 mt-1">
                  {errors.password.message}
                </span>
              )}
            </div>

            {/* Toggle Button */}
            <div className="flex justify-end -mt-9 pr-3">
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Button */}
          <Button 
            type="submit" 
            className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg shadow-lg shadow-indigo-200 transition-all active:scale-95" 
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader type="button" text="Authenticating..." iconClassName="text-white" />
            ) : (
              "Sign In"
            )}
          </Button>

        </form>
      </CardContent>

      <CardFooter className="flex flex-col space-y-4 pt-4">
        <p className="text-center text-xs text-gray-400">
          © 2026 Upleex. All rights reserved.
        </p>
      </CardFooter>

    </Card>
  </div>
);
}
