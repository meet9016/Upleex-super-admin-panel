"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  ShoppingBag,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";

const stats = [
  {
    title: "Total Revenue",
    value: "$45,231.89",
    change: "+20.1%",
    trend: "up",
    icon: DollarSign,
    color: "text-blue-600",
    bg: "bg-blue-100",
  },
  {
    title: "Subscriptions",
    value: "+2350",
    change: "+180.1%",
    trend: "up",
    icon: Users,
    color: "text-purple-600",
    bg: "bg-purple-100",
  },
  {
    title: "Sales",
    value: "+12,234",
    change: "+19%",
    trend: "up",
    icon: ShoppingBag,
    color: "text-emerald-600",
    bg: "bg-emerald-100",
  },
  {
    title: "Active Now",
    value: "+573",
    change: "+201",
    trend: "up",
    icon: TrendingUp,
    color: "text-orange-600",
    bg: "bg-orange-100",
  },
];

const recentOrders = [
  { id: "ORD001", user: "John Doe", email: "john@example.com", product: "iPhone 15 Pro", amount: "$999.00", status: "Completed" },
  { id: "ORD002", user: "Alice Smith", email: "alice@example.com", product: "MacBook Air M3", amount: "$1,299.00", status: "Processing" },
  { id: "ORD003", user: "Bob Johnson", email: "bob@example.com", product: "AirPods Pro", amount: "$249.00", status: "Completed" },
  { id: "ORD004", user: "Emma Wilson", email: "emma@example.com", product: "Apple Watch S9", amount: "$399.00", status: "Pending" },
  { id: "ORD005", user: "Michael Brown", email: "mike@example.com", product: "iPad Pro", amount: "$799.00", status: "Completed" },
];

export default function DashboardPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      router.push("/login");
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground border-slate-100">Welcome back, here&apos;s what&apos;s happening today.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Download Report</Button>
          <Button>Create New</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={`${stat.bg} ${stat.color} p-2 rounded-lg`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                {stat.trend === "up" ? (
                  <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                )}
                <span className={stat.trend === "up" ? "text-green-500 font-semibold" : "text-red-500 font-semibold"}>
                  {stat.change}
                </span>{" "}
                vs last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-7">
        <Card className="lg:col-span-5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>You have 5 new orders this week.</CardDescription>
              </div>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{order.user}</span>
                        <span className="text-xs text-muted-foreground">{order.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>{order.product}</TableCell>
                    <TableCell>{order.amount}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${order.status === "Completed" ? "bg-green-100 text-green-800" :
                        order.status === "Processing" ? "bg-blue-100 text-blue-800" :
                          "bg-yellow-100 text-yellow-800"
                        }`}>
                        {order.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Commonly used tasks.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {[
              { title: "Manage Inventory", desc: "Update stock levels" },
              { title: "Review Support", desc: "3 tickets pending" },
              { title: "Site Settings", desc: "Configure preferences" },
              { title: "User Roles", desc: "Assign permissions" },
            ].map((action) => (
              <div key={action.title} className="group flex items-center justify-between p-3 rounded-xl border bg-card transition-all hover:bg-slate-50 hover:border-primary/20 cursor-pointer">
                <div className="space-y-1">
                  <p className="text-sm font-semibold">{action.title}</p>
                  <p className="text-xs text-muted-foreground">{action.desc}</p>
                </div>
                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
