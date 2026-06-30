"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search as SearchIcon, Users, UserCheck, MapPinned, ShoppingCart,
  Wallet, Loader2, ArrowLeft
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { TabId } from "@/components/app-shell";

export function SearchView({ onNavigate }: { onNavigate?: (t: TabId) => void }) {
  const [q, setQ] = useState("");
  const [submitted, setSubmitted] = useState("");

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["search", submitted],
    queryFn: async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(submitted)}`);
      return res.json();
    },
    enabled: submitted.length > 0,
  });

  function submit() {
    setSubmitted(q);
  }

  const sections = [
    { key: "visitors", label: "الزوار", icon: Users, items: data?.visitors || [], render: (v: any) => (
      <div className="flex items-center justify-between py-2 px-3 border-b last:border-0">
        <div>
          <div className="font-medium">{v.name}</div>
          <div className="text-xs text-muted-foreground font-mono">{v.visitorCode}</div>
        </div>
        <div className="text-xs text-muted-foreground" dir="ltr">{v.phone}</div>
      </div>
    )},
    { key: "visits", label: "الزيارات", icon: UserCheck, items: data?.visits || [], render: (v: any) => (
      <div className="py-2 px-3 border-b last:border-0">
        <div className="flex justify-between">
          <div className="font-medium">{v.visitorName}</div>
          <div className="text-xs text-muted-foreground">{formatDate(v.visitDate)}</div>
        </div>
        <div className="text-xs text-muted-foreground">{v.request}</div>
      </div>
    )},
    { key: "customers", label: "الزبناء", icon: UserCheck, items: data?.customers || [], render: (c: any) => (
      <div className="flex items-center justify-between py-2 px-3 border-b last:border-0">
        <div>
          <div className="font-medium">{c.name}</div>
          <div className="text-xs text-muted-foreground font-mono">{c.customerCode}</div>
        </div>
        <div className="text-xs text-muted-foreground" dir="ltr">{c.phone}</div>
      </div>
    )},
    { key: "lots", label: "البقع", icon: MapPinned, items: data?.lots || [], render: (l: any) => (
      <div className="flex items-center justify-between py-2 px-3 border-b last:border-0">
        <div>
          <div className="font-medium font-mono">{l.lotNumber}</div>
          <div className="text-xs text-muted-foreground">{l.titleDeed}</div>
        </div>
        <div className="text-xs">{l.lotArea} م²</div>
      </div>
    )},
    { key: "sales", label: "المبيعات", icon: ShoppingCart, items: data?.sales || [], render: (s: any) => (
      <div className="flex items-center justify-between py-2 px-3 border-b last:border-0">
        <div>
          <div className="font-medium">{s.customerName}</div>
          <div className="text-xs text-muted-foreground">بقعة {s.lotNumber}</div>
        </div>
        <div className="font-semibold nums text-primary">{formatCurrency(s.salePrice)}</div>
      </div>
    )},
    { key: "payments", label: "الدفعات", icon: Wallet, items: data?.payments || [], render: (p: any) => (
      <div className="flex items-center justify-between py-2 px-3 border-b last:border-0">
        <div>
          <div className="font-medium text-sm">{p.saleInfo}</div>
          <div className="text-xs text-muted-foreground">{formatDate(p.paymentDate)}</div>
        </div>
        <div className="font-semibold nums text-emerald-600">{formatCurrency(p.amount)}</div>
      </div>
    )},
  ];

  const totalResults = sections.reduce((s, x) => s + x.items.length, 0);

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-2">
          <SearchIcon className="w-6 h-6 text-primary" /> البحث الموحد
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          محرك بحث واحد يجمع كل الأقسام: اكتب اسماً أو رقماً ليربطك بالسجلات المرتبطة
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <SearchIcon className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                placeholder="اكتب مثلاً: محمد، أو VIS-000001، أو رقم هاتف..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                className="pr-10 h-12 text-base"
              />
            </div>
            <Button onClick={submit} size="lg" disabled={!q.trim()}>
              {isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <SearchIcon className="w-4 h-4" />}
              بحث
            </Button>
          </div>
        </CardContent>
      </Card>

      {submitted && (
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">
            نتائج البحث عن "<span className="font-medium text-foreground">{submitted}</span>" — {totalResults} نتيجة
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : totalResults === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                لا توجد نتائج مطابقة
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {sections.map(sec => {
                const Icon = sec.icon;
                if (sec.items.length === 0) return null;
                return (
                  <Card key={sec.key}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Icon className="w-4 h-4 text-primary" />
                        {sec.label}
                        <span className="text-xs text-muted-foreground font-normal">({sec.items.length})</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 max-h-72 overflow-y-auto">
                      {sec.items.map((item: any) => (
                        <div key={item.id}>{sec.render(item)}</div>
                      ))}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
