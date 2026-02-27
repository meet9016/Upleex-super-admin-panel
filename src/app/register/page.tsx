"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Lock, Mail, User, Phone, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "react-toastify";
import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";

const registerSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(10, "Phone number must be at least 10 digits"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const {
        register: formRegister,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterFormValues) => {
        setIsLoading(true);
        try {
            const response = await api.post(endPointApi.adminRegister, data);

            if (response.data.success || response.status === 200 || response.status === 201) {
                toast.success("Account created successfully! Please login.");
                router.push("/login");
            } else {
                toast.error(response.data.message || "Registration failed");
            }
        } catch (error: any) {
            console.error("Registration error:", error);
            toast.error(error.response?.data?.message || "Something went wrong. Please try again.");
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
                        Create Admin Account
                    </CardTitle>
                    <CardDescription>
                        Join Upleex as a super administrator
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <div className="space-y-2">
                            <label htmlFor="name" className="text-sm font-semibold text-gray-700">
                                Full Name
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="John Doe"
                                    className="pl-10 h-11 rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20 transition-all font-medium"
                                    {...formRegister("name")}
                                    error={errors.name?.message}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-semibold text-gray-700">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="admin@upleex.com"
                                    className="pl-10 h-11 rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20 transition-all font-medium"
                                    {...formRegister("email")}
                                    error={errors.email?.message}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="phone" className="text-sm font-semibold text-gray-700">
                                Phone Number
                            </label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                <Input
                                    id="phone"
                                    type="tel"
                                    placeholder="+91 9876543210"
                                    className="pl-10 h-11 rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20 transition-all font-medium"
                                    {...formRegister("phone")}
                                    error={errors.phone?.message}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="password" className="text-sm font-semibold text-gray-700">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    className="pl-10 h-11 rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20 transition-all font-medium"
                                    {...formRegister("password")}
                                    error={errors.password?.message}
                                />
                            </div>
                        </div>

                        <Button type="submit" className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg shadow-lg shadow-indigo-200 transition-all active:scale-95 mt-4" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Creating Account...
                                </>
                            ) : (
                                "Create Account"
                            )}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4 pt-4">
                    <div className="text-sm text-center">
                        <span className="text-gray-500">Already have an account? </span>
                        <Link href="/login" className="text-indigo-600 font-semibold hover:underline">
                            Sign in
                        </Link>
                    </div>
                    <p className="text-center text-xs text-gray-400">
                        © 2026 Upleex. All rights reserved.
                    </p>
                </CardFooter>
            </Card>

            <Link href="/login" className="fixed top-8 left-8 flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors font-medium">
                <ArrowLeft size={20} />
                Back to Login
            </Link>
        </div>
    );
}
