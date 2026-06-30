"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, Settings, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ROLE_LABELS } from "@/lib/format";
import { useAuth } from "@/lib/auth-context";

export function UsersView() {
  const { user: currentUser } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "", username: "", pin: "", role: "SALES", active: true,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => (await fetch("/api/auth")).json(),
  });

  const users = data?.users || [];

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (editId) {
        const res = await fetch(`/api/users/${editId}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error((await res.json()).error);
      } else {
        const res = await fetch("/api/users", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error((await res.json()).error);
      }
    },
    onSuccess: () => {
      toast.success(editId ? "تم التحديث" : "تمت الإضافة");
      setOpen(false); setEditId(null);
      setForm({ name: "", username: "", pin: "", role: "SALES", active: true });
      qc.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error);
    },
    onSuccess: () => {
      toast.success("تم الحذف");
      qc.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  function openEdit(u: any) {
    setEditId(u.id);
    setForm({ name: u.name, username: u.username, pin: "", role: u.role, active: u.active });
    setOpen(true);
  }

  function openCreate() {
    setEditId(null);
    setForm({ name: "", username: "", pin: "", role: "SALES", active: true });
    setOpen(true);
  }

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary" /> إدارة المستخدمين
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            إنشاء مستخدمين بـ PIN مخصص لكل دور
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 ml-2" /> مستخدم جديد
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الاسم</TableHead>
                  <TableHead>اسم المستخدم</TableHead>
                  <TableHead>الدور</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-left">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></TableCell></TableRow>
                ) : users.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">لا يوجد مستخدمون</TableCell></TableRow>
                ) : users.map((u: any) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">
                      {u.name}
                      {u.id === currentUser?.id && <Badge variant="secondary" className="ml-2 text-xs">أنت</Badge>}
                    </TableCell>
                    <TableCell className="font-mono text-xs" dir="ltr">{u.username}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{ROLE_LABELS[u.role] || u.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.active ? "default" : "secondary"} className={u.active ? "bg-emerald-100 text-emerald-700" : ""}>
                        {u.active ? "نشط" : "معطّل"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(u)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        {u.id !== currentUser?.id && (
                          <Button
                            variant="ghost" size="icon"
                            onClick={() => { if (confirm(`حذف المستخدم "${u.name}"؟`)) deleteMutation.mutate(u.id); }}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? "تعديل مستخدم" : "إضافة مستخدم جديد"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>الاسم *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>اسم المستخدم *</Label>
              <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label>PIN {editId ? "(اتركه فارغاً للإبقاء على الحالي)" : " *"}</Label>
              <Input
                type="password"
                inputMode="numeric"
                value={form.pin}
                onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, "") })}
                placeholder="4-6 أرقام"
                maxLength={6}
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label>الدور</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">مدير</SelectItem>
                  <SelectItem value="SALES">موظف مبيعات</SelectItem>
                  <SelectItem value="ACCOUNTANT">محاسب</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>نشط</Label>
              <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
            <Button
              onClick={() => saveMutation.mutate(form)}
              disabled={!form.name || !form.username || (!editId && !form.pin) || saveMutation.isPending}
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
