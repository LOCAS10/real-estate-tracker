"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, UserCheck, Loader2, Search, ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/format";
import { useAuth } from "@/lib/auth-context";

export function CustomersView() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [convertOpen, setConvertOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [convertForm, setConvertForm] = useState({
    visitorId: "", nationalId: "", name: "", phone: "", phone2: "", address: "",
  });
  const [editForm, setEditForm] = useState<any>({});

  const { data: visitorsData } = useQuery<{ visitors: any[] }>({
    queryKey: ["visitors"],
    queryFn: async () => (await fetch("/api/visitors")).json(),
  });

  const { data: customersData } = useQuery<{ customers: any[] }>({
    queryKey: ["customers"],
    queryFn: async () => (await fetch("/api/customers")).json(),
  });

  const customers = (customersData?.customers || []).filter(c =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || "").includes(search) ||
    (c.nationalId || "").includes(search) ||
    c.customerCode.toLowerCase().includes(search.toLowerCase())
  );

  // الزوار المتاحون للتحويل (غير محوّلين مسبقاً)
  const convertedVisitorIds = new Set((customersData?.customers || []).map((c: any) => c.visitorId));
  const convertibleVisitors = (visitorsData?.visitors || []).filter(
    (v: any) => !convertedVisitorIds.has(v.id)
  );

  const convertMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, convert: true }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => {
      toast.success("تم تحويل الزائر إلى زبون بنجاح");
      setConvertOpen(false);
      setConvertForm({ visitorId: "", nationalId: "", name: "", phone: "", phone2: "", address: "" });
      qc.invalidateQueries({ queryKey: ["customers"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch(`/api/customers/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error);
    },
    onSuccess: () => {
      toast.success("تم التحديث");
      setEditOpen(false);
      qc.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error);
    },
    onSuccess: () => {
      toast.success("تم الحذف");
      qc.invalidateQueries({ queryKey: ["customers"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  function openConvert() {
    setConvertForm({ visitorId: "", nationalId: "", name: "", phone: "", phone2: "", address: "" });
    setConvertOpen(true);
  }

  function openEdit(c: any) {
    setEditId(c.id);
    setEditForm({
      nationalId: c.nationalId || "",
      name: c.name,
      phone: c.phone || "",
      phone2: c.phone2 || "",
      address: c.address || "",
    });
    setEditOpen(true);
  }

  // عند اختيار زائر، نملأ الحقول افتراضياً
  function onVisitorSelect(vid: string) {
    const v = (visitorsData?.visitors || []).find((x: any) => x.id === vid);
    setConvertForm({
      visitorId: vid,
      nationalId: "",
      name: v?.name || "",
      phone: v?.phone || "",
      phone2: "",
      address: "",
    });
  }

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-primary" /> الزبناء
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            يتم تحويل الزائر إلى زبون مع الاحتفاظ بسجل الزيارات
          </p>
        </div>
        <Button onClick={openConvert} disabled={convertibleVisitors.length === 0}>
          <ArrowRightLeft className="w-4 h-4 ml-2" /> تحويل زائر إلى زبون
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="ابحث بالاسم أو الهاتف أو البطاقة الوطنية..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الكود</TableHead>
                  <TableHead>الاسم</TableHead>
                  <TableHead>البطاقة الوطنية</TableHead>
                  <TableHead>الهاتف</TableHead>
                  <TableHead>هاتف 2</TableHead>
                  <TableHead>العنوان</TableHead>
                  <TableHead>تاريخ التسجيل</TableHead>
                  <TableHead className="text-left">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!customersData ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : customers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      لا يوجد زبناء
                    </TableCell>
                  </TableRow>
                ) : customers.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs">{c.customerCode}</TableCell>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell dir="ltr" className="text-right text-xs">{c.nationalId || "—"}</TableCell>
                    <TableCell dir="ltr" className="text-right text-xs">{c.phone || "—"}</TableCell>
                    <TableCell dir="ltr" className="text-right text-xs">{c.phone2 || "—"}</TableCell>
                    <TableCell className="text-xs max-w-[160px] truncate">{c.address || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(c.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          onClick={() => { if (confirm(`حذف الزبون "${c.name}"؟`)) deleteMutation.mutate(c.id); }}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* تحويل زائر إلى زبون */}
      <Dialog open={convertOpen} onOpenChange={setConvertOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>تحويل زائر إلى زبون</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label>الزائر *</Label>
              <Select value={convertForm.visitorId} onValueChange={onVisitorSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الزائر" />
                </SelectTrigger>
                <SelectContent>
                  {convertibleVisitors.map((v: any) => (
                    <SelectItem key={v.id} value={v.id}>
                      <span className="font-mono text-xs ml-2">{v.visitorCode}</span>
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>الاسم *</Label>
              <Input
                value={convertForm.name}
                onChange={(e) => setConvertForm({ ...convertForm, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>البطاقة الوطنية</Label>
                <Input
                  value={convertForm.nationalId}
                  onChange={(e) => setConvertForm({ ...convertForm, nationalId: e.target.value })}
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>الهاتف</Label>
                <Input
                  value={convertForm.phone}
                  onChange={(e) => setConvertForm({ ...convertForm, phone: e.target.value })}
                  dir="ltr"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>هاتف ثانوي</Label>
              <Input
                value={convertForm.phone2}
                onChange={(e) => setConvertForm({ ...convertForm, phone2: e.target.value })}
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label>العنوان</Label>
              <Textarea
                value={convertForm.address}
                onChange={(e) => setConvertForm({ ...convertForm, address: e.target.value })}
                rows={2}
              />
            </div>
            <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
              سيتم توليد كود الزبون تلقائياً بصيغة CUS-000001
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConvertOpen(false)}>إلغاء</Button>
            <Button
              onClick={() => convertMutation.mutate(convertForm)}
              disabled={!convertForm.visitorId || !convertForm.name || convertMutation.isPending}
            >
              {convertMutation.isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
              تحويل
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* تعديل زبون */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>تعديل بيانات الزبون</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label>الاسم</Label>
              <Input value={editForm.name || ""} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>البطاقة الوطنية</Label>
                <Input value={editForm.nationalId || ""} onChange={(e) => setEditForm({ ...editForm, nationalId: e.target.value })} dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label>الهاتف</Label>
                <Input value={editForm.phone || ""} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} dir="ltr" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>هاتف ثانوي</Label>
              <Input value={editForm.phone2 || ""} onChange={(e) => setEditForm({ ...editForm, phone2: e.target.value })} dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label>العنوان</Label>
              <Textarea value={editForm.address || ""} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>إلغاء</Button>
            <Button onClick={() => updateMutation.mutate(editForm)} disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
