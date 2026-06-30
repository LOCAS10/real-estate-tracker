"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users, UserCheck, MapPinned, ShoppingCart, Wallet,
  TrendingUp, AlertCircle, CheckCircle2
} from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/format";
import { TabId } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

interface Stats {
  visitorsCount: number;
  customersCount: number;
  lotsCount: number;
  soldCount: number;
  availableCount: number;
  totalSales: number;
  totalCollected: number;
  totalRemaining: number;
}

export function DashboardView({ onNavigate }: { onNavigate: (t: TabId) => void }) {
  const { data, isLoading } = useQuery<{ stats: Stats }>({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard");
      return res.json();
    },
  });

  const stats = data?.stats;
  const collectedPercent = stats && stats.totalSales > 0
    ? (stats.totalCollected / stats.totalSales) * 100
    : 0;

  const cards = [
    { label: "الزوار", value: stats?.visitorsCount, icon: Users, color: "text-blue-600 bg-blue-50", tab: "visitors" as TabId },
    { label: "الزبناء", value: stats?.customersCount, icon: UserCheck, color: "text-emerald-600 bg-emerald-50", tab: "customers" as TabId },
    { label: "إجمالي البقع", value: stats?.lotsCount, icon: MapPinned, color: "text-amber-600 bg-amber-50", tab: "lots" as TabId },
    { label: "البقع المباعة", value: stats?.soldCount, icon: ShoppingCart, color: "text-rose-600 bg-rose-50", tab: "sales" as TabId },
    { label: "البقع المتوفرة", value: stats?.availableCount, icon: CheckCircle2, color: "text-teal-600 bg-teal-50", tab: "lots" as TabId },
    { label: "المبالغ المحصلة", value: formatCurrency(stats?.totalCollected || 0), icon: Wallet, color: "text-green-600 bg-green-50", tab: "payments" as TabId },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl lg:text-3xl font-bold">لوحة التحكم</h1>
        <p className="text-muted-foreground text-sm">نظرة عامة على نشاط النظام</p>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <Card key={i} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${c.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-2xl font-bold nums">
                  {isLoading ? <Skeleton className="h-7 w-12" /> : (typeof c.value === "number" ? formatNumber(c.value) : c.value)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">{c.label}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* المجموعات المالية */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي المبيعات</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-10 w-40" /> : (
              <div className="text-2xl lg:text-3xl font-bold nums text-primary">
                {formatCurrency(stats?.totalSales || 0)}
              </div>
            )}
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>إجمالي قيمة عقود البيع</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">المبالغ المحصلة</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-10 w-40" /> : (
              <div className="text-2xl lg:text-3xl font-bold nums text-emerald-600">
                {formatCurrency(stats?.totalCollected || 0)}
              </div>
            )}
            <div className="text-xs text-muted-foreground mt-1">نسبة التحصيل</div>
            <Progress value={collectedPercent} className="h-1.5 mt-2" />
            <div className="text-xs text-emerald-600 font-semibold mt-1">{collectedPercent.toFixed(1)}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">المبالغ المتبقية</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-10 w-40" /> : (
              <div className="text-2xl lg:text-3xl font-bold nums text-amber-600">
                {formatCurrency(stats?.totalRemaining || 0)}
              </div>
            )}
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              <span>مبالغ قيد التحصيل</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* اختصارات */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">إجراءات سريعة</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Button variant="outline" onClick={() => onNavigate("visitors")}>
            <Users className="w-4 h-4 ml-2" /> إضافة زائر
          </Button>
          <Button variant="outline" onClick={() => onNavigate("visits")}>
            <UserCheck className="w-4 h-4 ml-2" /> تسجيل زيارة
          </Button>
          <Button variant="outline" onClick={() => onNavigate("lots")}>
            <MapPinned className="w-4 h-4 ml-2" /> إضافة بقعة
          </Button>
          <Button variant="outline" onClick={() => onNavigate("sales")}>
            <ShoppingCart className="w-4 h-4 ml-2" /> عملية بيع جديدة
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
