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
import { Plus, Pencil, Trash2, UserCheck, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/format";
import { useAuth } from "@/lib/auth-context";

export function VisitsView() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    visitorId: "", visitDate: new Date().toISOString().slice(0, 10),
    request: "", notes: "",
  });

  const { data: visitorsData } = useQuery<{ visitors: any[] }>({
    queryKey: ["visitors"],
    queryFn: async () => (await fetch("/api/visitors")).json(),
  });

  const { data, isLoading } = useQuery<{ visits: any[] }>({
    queryKey: ["visits"],
    queryFn: async () => (await fetch("/api/visits")).json(),
  });

  const visits = (data?.visits || []).filter(v =>
    !search ||
    (v.visitorName || "").toLowerCase().includes(search.toLowerCase()) ||
    (v.request || "").toLowerCase().includes(search.toLowerCase()) ||
    (v.notes || "").toLowerCase().includes(search.toLowerCase())
  ).slice().reverse();

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      const body = {
        ...payload,
        visitDate: new Date(payload.visitDate).toISOString(),
        createdById: user?.id,
        createdByName: user?.name,
      };
      if (editId) {
        const res = await fetch(`/api/visits/${editId}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error((await res.json()).error);
      } else {
        const res = await fetch("/api/visits", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error((await res.json()).error);
      }
    },
    onSuccess: () => {
      toast.success(editId ? "تم التحديث" : "تمت الإضافة");
      setOpen(false); setEditId(null);
      setForm({ visitorId: "", visitDate: new Date().toISOString().slice(0, 10), request: "", notes: "" });
      qc.invalidateQueries({ queryKey: ["visits"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/visits/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error);
    },
    onSuccess: () => {
      toast.success("تم الحذف");
      qc.invalidateQueries({ queryKey: ["visits"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  function openEdit(v: any) {
    setEditId(v.id);
    setForm({
      visitorId: v.visitorId,
      visitDate: (v.visitDate || "").slice(0, 10),
      request: v.request || "",
      notes: v.notes || "",
    });
    setOpen(true);
  }

  function openCreate() {
    setEditId(null);
    setForm({ visitorId: "", visitDate: new Date().toISOString().slice(0, 10), request: "", notes: "" });
    setOpen(true);
  }

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-primary" /> سجل الزيارات
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            يمكن للزائر الواحد القيام بعدة زيارات
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 ml-2" /> زيارة جديدة
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="ابحث باسم الزائر أو الطلب أو الملاحظات..."
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
                  <TableHead>الزائر</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>الطلب</TableHead>
                  <TableHead>الملاحظات</TableHead>
                  <TableHead>بواسطة</TableHead>
                  <TableHead className="text-left">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : visits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      لا توجد زيارات
                    </TableCell>
                  </TableRow>
                ) : visits.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-mono text-xs">{v.visitorCode || "—"}</TableCell>
                    <TableCell className="font-medium">{v.visitorName || "—"}</TableCell>
                    <TableCell className="text-xs">{formatDate(v.visitDate)}</TableCell>
                    <TableCell className="text-sm max-w-xs truncate">{v.request || "—"}</TableCell>
                    <TableCell className="text-sm max-w-xs truncate text-muted-foreground">{v.notes || "—"}</TableCell>
                    <TableCell className="text-xs">{v.createdByName || "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(v)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          onClick={() => { if (confirm("حذف الزيارة؟")) deleteMutation.mutate(v.id); }}
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? "تعديل زيارة" : "تسجيل زيارة جديدة"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>الزائر *</Label>
              <Select value={form.visitorId} onValueChange={(v) => setForm({ ...form, visitorId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الزائر" />
                </SelectTrigger>
                <SelectContent>
                  {(visitorsData?.visitors || []).map((v: any) => (
                    <SelectItem key={v.id} value={v.id}>
                      <span className="font-mono text-xs ml-2">{v.visitorCode}</span>
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>تاريخ الزيارة</Label>
              <Input
                type="date"
                value={form.visitDate}
                onChange={(e) => setForm({ ...form, visitDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>الطلب</Label>
              <Input
                value={form.request}
                onChange={(e) => setForm({ ...form, request: e.target.value })}
                placeholder="مثال: استفسار عن بقعة 200م²"
              />
            </div>
            <div className="space-y-2">
              <Label>ملاحظات</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="ملاحظات إضافية"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
            <Button
              onClick={() => saveMutation.mutate(form)}
              disabled={!form.visitorId || saveMutation.isPending}
            >
              {saveMutation.isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
