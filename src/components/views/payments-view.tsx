"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Pencil, Trash2, Wallet, Loader2, Search, Upload, FileText, Download, Eye, Image as ImageIcon, X } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatDate, PAYMENT_METHOD_LABELS } from "@/lib/format";
import { useAuth } from "@/lib/auth-context";

const METHOD_COLORS: Record<string, string> = {
  CASH: "bg-emerald-100 text-emerald-700",
  CHECK: "bg-blue-100 text-blue-700",
  TRANSFER: "bg-purple-100 text-purple-700",
  CARD: "bg-amber-100 text-amber-700",
};

export function PaymentsView() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [imageFile, setImageFile] = useState<{ name: string; dataUrl: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null);
  const [form, setForm] = useState({
    saleId: "", amount: "",
    paymentDate: new Date().toISOString().slice(0, 10),
    paymentMethod: "CASH", notes: "",
  });

  const { data: salesData } = useQuery({ queryKey: ["sales"], queryFn: async () => (await fetch("/api/sales")).json() });
  const { data: paymentsData, isLoading } = useQuery({ queryKey: ["payments"], queryFn: async () => (await fetch("/api/payments")).json() });

  const payments = (paymentsData?.payments || []).filter(p =>
    !search ||
    (p.saleInfo || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.notes || "").toLowerCase().includes(search.toLowerCase())
  ).slice().reverse();

  const total = payments.reduce((s, p) => s + p.amount, 0);

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      const body = {
        ...payload,
        amount: Number(payload.amount),
        paymentDate: new Date(payload.paymentDate).toISOString(),
        createdById: user?.id, createdByName: user?.name,
      };
      if (editId) {
        const res = await fetch(`/api/payments/${editId}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error((await res.json()).error);
      } else {
        const res = await fetch("/api/payments", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error((await res.json()).error);
      }
    },
    onSuccess: () => {
      toast.success(editId ? "تم التحديث" : "تمت الإضافة");
      setOpen(false); setEditId(null);
      setImageFile(null);
      setForm({ saleId: "", amount: "", paymentDate: new Date().toISOString().slice(0, 10), paymentMethod: "CASH", notes: "" });
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/payments/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error);
    },
    onSuccess: () => {
      toast.success("تم الحذف");
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  function openEdit(p: any) {
    setEditId(p.id);
    setForm({
      saleId: p.saleId,
      amount: String(p.amount),
      paymentDate: (p.paymentDate || "").slice(0, 10),
      paymentMethod: p.paymentMethod,
      notes: p.notes || "",
    });
    setImageFile(null);
    setOpen(true);
  }

  function openCreate() {
    setEditId(null);
    setForm({ saleId: "", amount: "", paymentDate: new Date().toISOString().slice(0, 10), paymentMethod: "CASH", notes: "" });
    setImageFile(null);
    setOpen(true);
  }

  // رفع صورة الدفعة (شيك/وصل/تحويل) وتحويلها إلى Data URL
  async function handleImageUpload(file: File) {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
    if (!allowed.includes(file.type)) {
      toast.error("الصيغة غير مدعومة. استخدم: JPG, PNG, WebP, GIF, أو PDF");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("حجم الملف كبير جداً (الحد الأقصى 5 ميجابايت)");
      return;
    }
    setUploading(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("فشل قراءة الملف"));
        reader.readAsDataURL(file);
      });
      setImageFile({ name: file.name, dataUrl });
      toast.success(`تم تحميل: ${file.name}`);
    } catch (e: any) {
      toast.error(e.message || "خطأ في الرفع");
    }
    setUploading(false);
  }

  // معاينة صورة الدفعة
  function previewPaymentImage(p: any) {
    if (!p.paymentImage) {
      toast.error("لا توجد صورة مرفقة");
      return;
    }
    setPreviewImage({ url: p.paymentImage, name: p.paymentImageName || "صورة الدفعة" });
  }

  // تحميل صورة الدفعة
  function downloadPaymentImage(p: any) {
    if (!p.paymentImage) {
      toast.error("لا توجد صورة مرفقة");
      return;
    }
    const link = document.createElement("a");
    link.href = p.paymentImage;
    link.download = p.paymentImageName || `دفعة-${p.amount}-${formatDate(p.paymentDate)}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-2">
            <Wallet className="w-6 h-6 text-primary" /> الدفعات
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            إجمالي المحصّل: <span className="font-bold text-emerald-600 nums">{formatCurrency(total)}</span>
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 ml-2" /> دفعة جديدة
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="ابحث في الدفعات..."
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
                  <TableHead>التاريخ</TableHead>
                  <TableHead>عملية البيع</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>الطريقة</TableHead>
                  <TableHead>الصورة</TableHead>
                  <TableHead>ملاحظات</TableHead>
                  <TableHead>بواسطة</TableHead>
                  <TableHead className="text-left">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      لا توجد دفعات
                    </TableCell>
                  </TableRow>
                ) : payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-xs">{formatDate(p.paymentDate)}</TableCell>
                    <TableCell className="text-sm">{p.saleInfo || "—"}</TableCell>
                    <TableCell className="font-semibold nums text-emerald-600">{formatCurrency(p.amount)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={METHOD_COLORS[p.paymentMethod]}>
                        {PAYMENT_METHOD_LABELS[p.paymentMethod] || p.paymentMethod}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {p.paymentMethod === "CASH" ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : p.paymentImage ? (
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => previewPaymentImage(p)} title="معاينة الصورة">
                            <Eye className="w-4 h-4 text-blue-600" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => downloadPaymentImage(p)} title="تحميل الصورة">
                            <Download className="w-4 h-4 text-emerald-600" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-amber-600">لم تُرفع</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{p.notes || "—"}</TableCell>
                    <TableCell className="text-xs">{p.createdByName || "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          onClick={() => { if (confirm("حذف الدفعة؟")) deleteMutation.mutate(p.id); }}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? "تعديل دفعة" : "إضافة دفعة جديدة"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>عملية البيع *</Label>
              <Select value={form.saleId} onValueChange={(v) => setForm({ ...form, saleId: v })}>
                <SelectTrigger><SelectValue placeholder="اختر العملية" /></SelectTrigger>
                <SelectContent>
                  {(salesData?.sales || []).map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.lotNumber} - {s.customerName} ({formatCurrency(s.salePrice)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>المبلغ *</Label>
                <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>التاريخ</Label>
                <Input type="date" value={form.paymentDate} onChange={(e) => setForm({ ...form, paymentDate: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>طريقة الدفع</Label>
              <Select value={form.paymentMethod} onValueChange={(v) => setForm({ ...form, paymentMethod: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">نقداً</SelectItem>
                  <SelectItem value="CHECK">شيك</SelectItem>
                  <SelectItem value="TRANSFER">تحويل بنكي</SelectItem>
                  <SelectItem value="CARD">بطاقة</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* رفع صورة الدفعة - يظهر فقط عند غير النقد */}
            {form.paymentMethod !== "CASH" && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  صورة {PAYMENT_METHOD_LABELS[form.paymentMethod]} (شيك / وصل / إشعار تحويل) — اختياري
                </Label>
                <div className="border-2 border-dashed border-border rounded-lg p-4 transition-colors hover:border-primary/50">
                  {imageFile ? (
                    /* صورة جديدة لم تُحفظ بعد */
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">{imageFile.name}</div>
                            <div className="text-xs text-emerald-600">جديد — جاهز للحفظ</div>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => setImageFile(null)} className="text-destructive">
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                      {/* معاينة إن كانت صورة */}
                      {imageFile.dataUrl.startsWith("data:image") && (
                        <img
                          src={imageFile.dataUrl}
                          alt={imageFile.name}
                          className="max-h-28 w-auto rounded-lg border mx-auto object-contain"
                        />
                      )}
                    </div>
                  ) : editId && (paymentsData?.payments || []).find((p: any) => p.id === editId)?.paymentImage ? (
                    /* صورة محفوظة سابقاً في وضع التعديل */
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">
                              {(paymentsData?.payments || []).find((p: any) => p.id === editId)?.paymentImageName || "صورة محفوظة"}
                            </div>
                            <div className="text-xs text-muted-foreground">سيتم استبدالها عند رفع صورة جديدة</div>
                          </div>
                        </div>
                        <Button
                          size="sm" variant="ghost"
                          onClick={() => {
                            const p = (paymentsData?.payments || []).find((x: any) => x.id === editId);
                            if (p) setPreviewImage({ url: p.paymentImage, name: p.paymentImageName || "صورة" });
                          }}
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-600" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* لا توجد صورة */
                    <label className="flex flex-col items-center justify-center cursor-pointer py-4">
                      <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                      <span className="text-sm font-medium">اضغط لرفع صورة أو PDF</span>
                      <span className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP, PDF — حتى 5 ميجابايت</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleImageUpload(f);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  )}
                  {uploading && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-primary">
                      <Loader2 className="w-3 h-3 animate-spin" /> جارٍ التحضير...
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>ملاحظات</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setOpen(false); setImageFile(null); }}>إلغاء</Button>
            <Button
              onClick={() => {
                const existingPayment = editId ? (paymentsData?.payments || []).find((p: any) => p.id === editId) : null;
                saveMutation.mutate({
                  ...form,
                  paymentImage: imageFile?.dataUrl || (existingPayment?.paymentImage ?? ""),
                  paymentImageName: imageFile?.name || (existingPayment?.paymentImageName ?? ""),
                });
              }}
              disabled={!form.saleId || !form.amount || saveMutation.isPending}
            >
              {saveMutation.isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: معاينة الصورة */}
      <Dialog open={!!previewImage} onOpenChange={(o) => !o && setPreviewImage(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-primary" />
              {previewImage?.name || "صورة الدفعة"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            {previewImage?.url.startsWith("data:image") ? (
              <img
                src={previewImage.url}
                alt={previewImage.name}
                className="max-h-[70vh] mx-auto rounded-lg border"
              />
            ) : (
              <iframe
                src={previewImage?.url}
                className="w-full h-[70vh] rounded-lg border"
                title={previewImage?.name}
              />
            )}
          </div>
          <DialogFooter>
            <a href={previewImage?.url} download={previewImage?.name}>
              <Button variant="outline">
                <Download className="w-4 h-4 ml-2" />
                تحميل
              </Button>
            </a>
            <Button onClick={() => setPreviewImage(null)}>إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
