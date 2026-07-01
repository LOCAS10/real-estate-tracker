"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover, PopoverContent, PopoverTrigger
} from "@/components/ui/popover";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Bell, Plus, Check, Trash2, MessageSquare, ListTodo } from "lucide-react";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/format";
import { ROLE_LABELS } from "@/lib/format";

export function NotificationBell() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [form, setForm] = useState({
    type: "NOTE" as "NOTE" | "TASK",
    title: "",
    message: "",
    targetRole: "",
    toUserId: "",
  });

  const { data } = useQuery<{ notifications: any[] }>({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/notifications?userId=${user?.id}&userRole=${user?.role}`);
      return res.json();
    },
    refetchInterval: 15000,
    enabled: !!user?.id,
  });

  const notifications = data?.notifications || [];
  const unreadCount = notifications.filter((n: any) => !n.read).length;

  async function handleSend() {
    if (!form.title || !form.message) return;
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          fromUserId: user?.id,
          fromUserName: user?.name,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("تم الإرسال");
      setSendOpen(false);
      setForm({ type: "NOTE", title: "", message: "", targetRole: "", toUserId: "" });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    } catch {
      toast.error("خطأ في الإرسال");
    }
  }

  async function markRead(id: string, completed?: boolean) {
    try {
      await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !!completed }),
      });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    } catch {}
  }

  async function deleteNotif(id: string) {
    try {
      await fetch(`/api/notifications/${id}`, { method: "DELETE" });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    } catch {}
  }

  if (!user) return null;

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative h-8 w-8 text-sidebar-foreground/70 hover:text-sidebar-foreground">
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -left-0.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent side="left" align="end" className="w-80 p-0" dir="rtl">
          <div className="flex items-center justify-between p-3 border-b">
            <span className="font-semibold text-sm">الإشعارات</span>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSendOpen(true)} title="إرسال إشعار">
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
          <ScrollArea className="max-h-72">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">لا توجد إشعارات</div>
            ) : (
              <div className="divide-y">
                {notifications.map((n: any) => (
                  <div
                    key={n.id}
                    className={`p-3 text-sm hover:bg-muted/50 transition-colors ${!n.read ? "bg-muted/30" : ""}`}
                    onClick={() => { if (!n.read) markRead(n.id); }}
                  >
                    <div className="flex items-start gap-2">
                      {n.type === "TASK" ? (
                        <ListTodo className="w-4 h-4 mt-0.5 text-blue-500 flex-shrink-0" />
                      ) : (
                        <MessageSquare className="w-4 h-4 mt-0.5 text-emerald-500 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-xs truncate">{n.title}</span>
                          {n.type === "TASK" && !n.completed && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">مهمة</Badge>
                          )}
                          {n.type === "TASK" && n.completed && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-emerald-100 text-emerald-700">مُنجزة</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                          <span>{n.fromUserName}</span>
                          <span>·</span>
                          <span>{formatDateTime(n.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex gap-0.5 flex-shrink-0">
                        {n.type === "TASK" && !n.completed && (
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); markRead(n.id, true); toast.success("تم إنجاز المهمة"); }}>
                            <Check className="w-3 h-3 text-emerald-600" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); deleteNotif(n.id); }}>
                          <Trash2 className="w-3 h-3 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {/* إرسال إشعار */}
      <Dialog open={sendOpen} onOpenChange={setSendOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>إرسال إشعار</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm">النوع</label>
                <Select value={form.type} onValueChange={(v: any) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NOTE">ملاحظة</SelectItem>
                    <SelectItem value="TASK">مهمة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm">إلى (دور)</label>
                <Select value={form.targetRole} onValueChange={(v) => setForm({ ...form, targetRole: v })}>
                  <SelectTrigger><SelectValue placeholder="الجميع" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">الجميع</SelectItem>
                    <SelectItem value="ADMIN">المدير</SelectItem>
                    <SelectItem value="SALES">موظف المبيعات</SelectItem>
                    <SelectItem value="ACCOUNTANT">المحاسب</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm">العنوان *</label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="مثال: طلب خصم" />
            </div>
            <div className="space-y-2">
              <label className="text-sm">المحتوى *</label>
              <Input value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="التفاصيل..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendOpen(false)}>إلغاء</Button>
            <Button disabled={!form.title || !form.message} onClick={handleSend}>إرسال</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
