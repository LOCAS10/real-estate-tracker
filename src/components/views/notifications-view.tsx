"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Bell, Plus, Check, Trash2, MessageSquare, ListTodo, Filter, Inbox
} from "lucide-react";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/format";
import { ROLE_LABELS } from "@/lib/format";
import { useAuth } from "@/lib/auth-context";

type FilterType = "ALL" | "NOTE" | "TASK";
type FilterRead = "ALL" | "UNREAD" | "READ";

export function NotificationsView() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [sendOpen, setSendOpen] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>("ALL");
  const [filterRead, setFilterRead] = useState<FilterRead>("ALL");
  const [form, setForm] = useState({
    type: "NOTE" as "NOTE" | "TASK",
    title: "",
    message: "",
    targetRole: "ALL",
    toUserId: "",
    lotId: "",
    lotNumber: "",
  });

  const { data, isLoading } = useQuery<{ notifications: any[] }>({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/notifications?userId=${user?.id}&userRole=${user?.role}`);
      return res.json();
    },
    refetchInterval: 15000,
    enabled: !!user?.id,
  });

  const allNotifications = data?.notifications || [];
  const notifications = allNotifications.filter((n: any) => {
    if (filterType !== "ALL" && n.type !== filterType) return false;
    if (filterRead === "UNREAD" && n.read) return false;
    if (filterRead === "READ" && !n.read) return false;
    return true;
  });

  const unreadCount = allNotifications.filter((n: any) => !n.read).length;
  const taskPendingCount = allNotifications.filter((n: any) => n.type === "TASK" && !n.completed).length;

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!form.title || !form.message) throw new Error("العنوان والمحتوى مطلوبان");
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          targetRole: form.targetRole === "ALL" ? "" : form.targetRole,
          fromUserId: user?.id,
          fromUserName: user?.name,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
    },
    onSuccess: () => {
      toast.success("تم إرسال الإشعار بنجاح");
      setSendOpen(false);
      setForm({ type: "NOTE", title: "", message: "", targetRole: "ALL", toUserId: "", lotId: "", lotNumber: "" });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (e: any) => toast.error(e.message || "خطأ في الإرسال"),
  });

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    qc.invalidateQueries({ queryKey: ["notifications"] });
  }

  async function markCompleted(id: string) {
    await fetch(`/api/notifications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: true }),
    });
    toast.success("تم إنجاز المهمة");
    qc.invalidateQueries({ queryKey: ["notifications"] });
  }

  async function deleteNotif(id: string) {
    if (!confirm("حذف هذا الإشعار؟")) return;
    await fetch(`/api/notifications/${id}`, { method: "DELETE" });
    qc.invalidateQueries({ queryKey: ["notifications"] });
  }

  async function markAllRead() {
    const unread = allNotifications.filter((n: any) => !n.read);
    await Promise.all(unread.map((n: any) => markRead(n.id)));
    toast.success("تم تعليم الكل كمقروء");
  }

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary" /> المراسلات الداخلية
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            ملاحظات ومهام بين أعضاء الفريق
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead}>
              تعليم الكل كمقروء
            </Button>
          )}
          <Button onClick={() => setSendOpen(true)}>
            <Plus className="w-4 h-4 ml-2" /> إشعار جديد
          </Button>
        </div>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-50 dark:bg-blue-950/40">
              <Inbox className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-xl font-bold">{isLoading ? <Skeleton className="h-6 w-8" /> : allNotifications.length}</div>
              <div className="text-xs text-muted-foreground">إجمالي الرسائل</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-amber-50 dark:bg-amber-950/40">
              <MessageSquare className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="text-xl font-bold">{isLoading ? <Skeleton className="h-6 w-8" /> : unreadCount}</div>
              <div className="text-xs text-muted-foreground">غير مقروءة</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-rose-50 dark:bg-rose-950/40">
              <ListTodo className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <div className="text-xl font-bold">{isLoading ? <Skeleton className="h-6 w-8" /> : taskPendingCount}</div>
              <div className="text-xs text-muted-foreground">مهام معلقة</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* الفلاتر */}
      <Card>
        <CardContent className="p-3 flex items-center gap-3 flex-wrap">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <div className="flex gap-2">
            {([["ALL", "الكل"], ["NOTE", "ملاحظات"], ["TASK", "مهام"]] as [FilterType, string][]).map(([val, label]) => (
              <Button
                key={val}
                variant={filterType === val ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType(val)}
              >
                {label}
              </Button>
            ))}
          </div>
          <div className="h-5 w-px bg-border" />
          <div className="flex gap-2">
            {([["ALL", "الكل"], ["UNREAD", "غير مقروء"], ["READ", "مقروء"]] as [FilterRead, string][]).map(([val, label]) => (
              <Button
                key={val}
                variant={filterRead === val ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterRead(val)}
              >
                {label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* قائمة الإشعارات */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[60vh]">
            {isLoading ? (
              <div className="p-8 space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-3 p-3">
                    <Skeleton className="w-10 h-10 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-64" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-12 text-center">
                <Inbox className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">لا توجد إشعارات</p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((n: any) => (
                  <div
                    key={n.id}
                    className={`p-4 hover:bg-muted/30 transition-colors cursor-pointer ${!n.read ? "bg-primary/[0.03] dark:bg-primary/[0.06]" : ""}`}
                    onClick={() => { if (!n.read) markRead(n.id); }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        n.type === "TASK"
                          ? n.completed
                            ? "bg-emerald-50 dark:bg-emerald-950/40"
                            : "bg-blue-50 dark:bg-blue-950/40"
                          : "bg-emerald-50 dark:bg-emerald-950/40"
                      }`}>
                        {n.type === "TASK" ? (
                          <ListTodo className={`w-5 h-5 ${n.completed ? "text-emerald-600" : "text-blue-600"}`} />
                        ) : (
                          <MessageSquare className="w-5 h-5 text-emerald-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">{n.title}</span>
                          {n.type === "TASK" && !n.completed && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">
                              مهمة
                            </Badge>
                          )}
                          {n.type === "TASK" && n.completed && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                              مُنجزة
                            </Badge>
                          )}
                          {n.type === "NOTE" && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                              ملاحظة
                            </Badge>
                          )}
                          {!n.read && (
                            <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{n.message}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                          <span>من: <strong>{n.fromUserName}</strong></span>
                          {n.lotNumber && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              بقعة {n.lotNumber}
                            </Badge>
                          )}
                          <span>{formatDateTime(n.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        {n.type === "TASK" && !n.completed && (
                          <Button
                            variant="ghost" size="icon" className="h-8 w-8"
                            title="إنجاز المهمة"
                            onClick={(e) => { e.stopPropagation(); markCompleted(n.id); }}
                          >
                            <Check className="w-4 h-4 text-emerald-600" />
                          </Button>
                        )}
                        <Button
                          variant="ghost" size="icon" className="h-8 w-8"
                          title="حذف"
                          onClick={(e) => { e.stopPropagation(); deleteNotif(n.id); }}
                        >
                          <Trash2 className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* حوار إرسال إشعار */}
      <Dialog open={sendOpen} onOpenChange={setSendOpen}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>إرسال إشعار جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>النوع *</Label>
                <Select value={form.type} onValueChange={(v: any) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NOTE">ملاحظة</SelectItem>
                    <SelectItem value="TASK">مهمة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>إلى (دور)</Label>
                <Select value={form.targetRole} onValueChange={(v) => setForm({ ...form, targetRole: v })}>
                  <SelectTrigger><SelectValue placeholder="الجميع" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">الجميع</SelectItem>
                    <SelectItem value="ADMIN">المدير</SelectItem>
                    <SelectItem value="SALES">موظف المبيعات</SelectItem>
                    <SelectItem value="ACCOUNTANT">المحاسب</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>العنوان *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="مثال: طلب خصم خاص"
              />
            </div>
            <div className="space-y-2">
              <Label>المحتوى *</Label>
              <Textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="تفاصيل الرسالة..."
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>ربط ببقعة (اختياري)</Label>
              <Input
                value={form.lotNumber}
                onChange={(e) => setForm({ ...form, lotNumber: e.target.value })}
                placeholder="رقم البقعة"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendOpen(false)}>إلغاء</Button>
            <Button
              onClick={() => sendMutation.mutate()}
              disabled={!form.title || !form.message || sendMutation.isPending}
            >
              إرسال
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
