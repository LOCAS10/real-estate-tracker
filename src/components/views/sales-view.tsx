"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Plus, Pencil, Trash2, ShoppingCart, Loader2, Search,
  ChevronDown, ChevronLeft, Wallet, FileText, Upload, Download, FileCheck,
  Image as ImageIcon, X, Eye
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatDate, PAYMENT_METHOD_LABELS } from "@/lib/format";
import { useAuth } from "@/lib/auth-context";

export function SalesView() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [expandedSale, setExpandedSale] = useState<string | null>(null);
  const [paymentModal, setPaymentModal] = useState<{ saleId: string } | null>(null);

  const [form, setForm] = useState({
    customerId: "", lotId: "", salePrice: "", saleDate: new Date().toISOString().slice(0, 10), notes: "",
  });
  const [contractFile, setContractFile] = useState<{ name: string; dataUrl: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [editContractFile, setEditContractFile] = useState<{ name: string; dataUrl: string } | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: "", paymentDate: new Date().toISOString().slice(0, 10),
    paymentMethod: "CASH", notes: "",
  });
  const [paymentImage, setPaymentImage] = useState<{ name: string; dataUrl: string } | null>(null);
  const [uploadingPayment, setUploadingPayment] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null);

  const { data: customersData } = useQuery({ queryKey: ["customers"], queryFn: async () => (await fetch("/api/customers")).json() });
  const { data: lotsData } = useQuery({ queryKey: ["lots"], queryFn: async () => (await fetch("/api/lots")).json() });
  const { data: salesData, isLoading } = useQuery({ queryKey: ["sales"], queryFn: async () => (await fetch("/api/sales")).json() });
  const { data: paymentsData } = useQuery({ queryKey: ["payments"], queryFn: async () => (await fetch("/api/payments")).json() });

  // البقع المتاحة للبيع (متوفرة فقط)
  const availableLots = (lotsData?.lots || []).filter((l: any) => l.availability === "AVAILABLE");

  const sales = (salesData?.sales || []).filter(s =>
    !search ||
    (s.customerName || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.lotNumber || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.customerCode || "").toLowerCase().includes(search.toLowerCase())
  ).slice().reverse();

  const paymentsForSale = (saleId: string) => (paymentsData?.payments || []).filter((p: any) => p.saleId === saleId);

  function summary(sale: any) {
    const ps = paymentsForSale(sale.id);
    const paid = ps.reduce((s: number, p: any) => s + p.amount, 0);
    const remaining = sale.salePrice - paid;
    const percent = sale.salePrice > 0 ? (paid / sale.salePrice) * 100 : 0;
    return { paid, remaining, percent, count: ps.length };
  }

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const body = {
        ...payload,
        saleDate: new Date(payload.saleDate).toISOString(),
        salePrice: Number(payload.salePrice),
        createdById: user?.id, createdByName: user?.name,
      };
      const res = await fetch("/api/sales", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).error);
    },
    onSuccess: () => {
      toast.success("تم تسجيل عملية البيع");
      setOpen(false);
      setForm({ customerId: "", lotId: "", salePrice: "", saleDate: new Date().toISOString().slice(0, 10), notes: "" });
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["lots"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: any) => {
      const body = { ...payload, salePrice: Number(payload.salePrice), saleDate: new Date(payload.saleDate).toISOString() };
      const res = await fetch(`/api/sales/${editId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).error);
    },
    onSuccess: () => {
      toast.success("تم التحديث");
      setEditOpen(false);
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/sales/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error);
    },
    onSuccess: () => {
      toast.success("تم الحذف");
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["lots"] });
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const addPaymentMutation = useMutation({
    mutationFn: async (saleId: string) => {
      const res = await fetch("/api/payments", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          saleId, amount: Number(paymentForm.amount),
          paymentDate: new Date(paymentForm.paymentDate).toISOString(),
          paymentMethod: paymentForm.paymentMethod,
          notes: paymentForm.notes,
          paymentImage: paymentImage?.dataUrl || "",
          paymentImageName: paymentImage?.name || "",
          createdById: user?.id, createdByName: user?.name,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
    },
    onSuccess: () => {
      toast.success("تمت إضافة الدفعة");
      setPaymentModal(null);
      setPaymentForm({ amount: "", paymentDate: new Date().toISOString().slice(0, 10), paymentMethod: "CASH", notes: "" });
      setPaymentImage(null);
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  // رفع صورة الدفعة
  async function handlePaymentImageUpload(file: File) {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
    if (!allowed.includes(file.type)) {
      toast.error("الصيغة غير مدعومة. استخدم: JPG, PNG, WebP, GIF, أو PDF");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("حجم الملف كبير جداً (الحد الأقصى 5 ميجابايت)");
      return;
    }
    setUploadingPayment(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("فشل قراءة الملف"));
        reader.readAsDataURL(file);
      });
      setPaymentImage({ name: file.name, dataUrl });
      toast.success(`تم تحميل: ${file.name}`);
    } catch (e: any) {
      toast.error(e.message || "خطأ في الرفع");
    }
    setUploadingPayment(false);
  }

  // عند اختيار البقعة، يُملأ السعر تلقائياً
  function onLotSelect(lotId: string) {
    const lot = (lotsData?.lots || []).find((l: any) => l.id === lotId);
    setForm({ ...form, lotId, salePrice: lot ? String(lot.currentPrice) : form.salePrice });
  }

  // رفع ملف العقد PDF وتحويله إلى Data URL
  async function handleContractUpload(file: File, target: "create" | "edit") {
    if (file.type !== "application/pdf") {
      toast.error("يجب أن يكون الملف بصيغة PDF");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("حجم الملف كبير جداً (الحد الأقصى 10 ميجابايت)");
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
      const payload = { name: file.name, dataUrl };
      if (target === "create") setContractFile(payload);
      else setEditContractFile(payload);
      toast.success(`تم تحميل الملف: ${file.name}`);
    } catch (e: any) {
      toast.error(e.message || "خطأ في الرفع");
    }
    setUploading(false);
  }

  // تحميل العقد من Data URL
  function downloadContract(sale: any) {
    if (!sale.contractPdf) {
      toast.error("لا يوجد عقد مرفق");
      return;
    }
    const link = document.createElement("a");
    link.href = sale.contractPdf;
    link.download = `عقد-بيع-${sale.lotNumber}-${sale.customerName}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // فتح العقد في تبويب جديد للمعاينة
  function previewContract(sale: any) {
    if (!sale.contractPdf) {
      toast.error("لا يوجد عقد مرفق");
      return;
    }
    const win = window.open();
    if (win) {
      win.document.write(
        `<iframe src="${sale.contractPdf}" style="width:100%;height:100vh;border:0;"></iframe>`
      );
      win.document.title = `عقد ${sale.customerName} - ${sale.lotNumber}`;
    }
  }

  function openEdit(s: any) {
    setEditId(s.id);
    setEditForm({
      salePrice: s.salePrice,
      saleDate: (s.saleDate || "").slice(0, 10),
      notes: s.notes || "",
      contractPdf: s.contractPdf || "",
      contractName: s.contractName || "",
    });
    setEditContractFile(null);
    setEditOpen(true);
  }

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-primary" /> المبيعات
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            اختيار الزبون والبقعة من القائمة لضمان ترابط البيانات
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4 ml-2" /> عملية بيع جديدة
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="ابحث باسم الزبون أو رقم البقعة..."
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
                  <TableHead>الزبون</TableHead>
                  <TableHead>البقعة</TableHead>
                  <TableHead>سعر البيع</TableHead>
                  <TableHead>المحصّل</TableHead>
                  <TableHead>المتبقي</TableHead>
                  <TableHead>النسبة</TableHead>
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
                ) : sales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      لا توجد عمليات بيع
                    </TableCell>
                  </TableRow>
                ) : sales.map((s) => {
                  const sm = summary(s);
                  const isExpanded = expandedSale === s.id;
                  return (
                    <>
                      <TableRow key={s.id} className="cursor-pointer hover:bg-muted/30" onClick={() => setExpandedSale(isExpanded ? null : s.id)}>
                        <TableCell className="text-xs">{formatDate(s.saleDate)}</TableCell>
                        <TableCell>
                          <div className="font-medium">{s.customerName}</div>
                          <div className="text-xs text-muted-foreground font-mono">{s.customerCode}</div>
                        </TableCell>
                        <TableCell className="font-mono">{s.lotNumber}</TableCell>
                        <TableCell className="font-semibold nums">{formatCurrency(s.salePrice)}</TableCell>
                        <TableCell className="text-emerald-600 font-medium nums">{formatCurrency(sm.paid)}</TableCell>
                        <TableCell className="text-amber-600 font-medium nums">{formatCurrency(sm.remaining)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={sm.percent} className="h-1.5 w-16" />
                            <span className="text-xs nums">{sm.percent.toFixed(0)}%</span>
                          </div>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex gap-1 justify-end">
                            {s.contractPdf && (
                              <>
                                <Button variant="ghost" size="icon" onClick={() => previewContract(s)} title="معاينة العقد">
                                  <FileText className="w-4 h-4 text-blue-600" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => downloadContract(s)} title="تحميل العقد">
                                  <Download className="w-4 h-4 text-emerald-600" />
                                </Button>
                              </>
                            )}
                            <Button variant="ghost" size="icon" onClick={() => setPaymentModal({ saleId: s.id })} title="إضافة دفعة">
                              <Wallet className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost" size="icon"
                              onClick={() => { if (confirm("حذف عملية البيع ودفعاتها؟")) deleteMutation.mutate(s.id); }}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              {isExpanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow key={s.id + "-details"} className="bg-muted/20">
                          <TableCell colSpan={8} className="p-4">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-3">
                                  <h4 className="font-semibold text-sm">الدفعات ({sm.count})</h4>
                                  {s.contractPdf ? (
                                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 gap-1 cursor-pointer" onClick={() => previewContract(s)}>
                                      <FileCheck className="w-3 h-3" /> عقد مرفق — اضغط للمعاينة
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary" className="bg-amber-100 text-amber-700 gap-1">
                                      <FileText className="w-3 h-3" /> لا يوجد عقد
                                    </Badge>
                                  )}
                                </div>
                                <Button size="sm" variant="outline" onClick={() => setPaymentModal({ saleId: s.id })}>
                                  <Plus className="w-3 h-3 ml-1" /> دفعة
                                </Button>
                              </div>
                              {paymentsForSale(s.id).length === 0 ? (
                                <div className="text-sm text-muted-foreground py-3 text-center">لا توجد دفعات</div>
                              ) : (
                                <div className="border rounded-lg overflow-hidden">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>التاريخ</TableHead>
                                        <TableHead>المبلغ</TableHead>
                                        <TableHead>الطريقة</TableHead>
                                        <TableHead>الصورة</TableHead>
                                        <TableHead>ملاحظات</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {paymentsForSale(s.id).map((p: any) => (
                                        <TableRow key={p.id}>
                                          <TableCell className="text-xs">{formatDate(p.paymentDate)}</TableCell>
                                          <TableCell className="font-medium nums">{formatCurrency(p.amount)}</TableCell>
                                          <TableCell className="text-xs">{PAYMENT_METHOD_LABELS[p.paymentMethod] || p.paymentMethod}</TableCell>
                                          <TableCell>
                                            {p.paymentMethod === "CASH" ? (
                                              <span className="text-xs text-muted-foreground">—</span>
                                            ) : p.paymentImage ? (
                                              <Button variant="ghost" size="sm" onClick={() => setPreviewImage({ url: p.paymentImage, name: p.paymentImageName || "صورة" })} className="h-7 gap-1">
                                                <Eye className="w-3 h-3 text-blue-600" />
                                                <span className="text-xs">عرض</span>
                                              </Button>
                                            ) : (
                                              <span className="text-xs text-amber-600">لم تُرفع</span>
                                            )}
                                          </TableCell>
                                          <TableCell className="text-xs">{p.notes || "—"}</TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* إنشاء بيع */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>عملية بيع جديدة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>الزبون *</Label>
              <Select value={form.customerId} onValueChange={(v) => setForm({ ...form, customerId: v })}>
                <SelectTrigger><SelectValue placeholder="اختر الزبون" /></SelectTrigger>
                <SelectContent>
                  {(customersData?.customers || []).map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      <span className="font-mono text-xs ml-2">{c.customerCode}</span>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>البقعة *</Label>
              <Select value={form.lotId} onValueChange={onLotSelect}>
                <SelectTrigger><SelectValue placeholder="اختر البقعة" /></SelectTrigger>
                <SelectContent>
                  {availableLots.map((l: any) => (
                    <SelectItem key={l.id} value={l.id}>
                      <span className="font-mono ml-2">{l.lotNumber}</span>
                      <span className="text-xs text-muted-foreground">— {formatCurrency(l.currentPrice)}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableLots.length === 0 && (
                <p className="text-xs text-amber-600">لا توجد بقع متاحة للبيع</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>سعر البيع *</Label>
                <Input
                  type="number"
                  value={form.salePrice}
                  onChange={(e) => setForm({ ...form, salePrice: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>تاريخ البيع</Label>
                <Input
                  type="date"
                  value={form.saleDate}
                  onChange={(e) => setForm({ ...form, saleDate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>ملاحظات</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
              />
            </div>

            {/* رفع عقد البيع PDF */}
            <div className="space-y-2">
              <Label>عقد البيع الموقع (PDF) — اختياري</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-4 transition-colors hover:border-primary/50">
                {contractFile ? (
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-5 h-5 text-red-600 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{contractFile.name}</div>
                        <div className="text-xs text-muted-foreground">جاهز للرفع</div>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        size="sm" variant="ghost"
                        onClick={() => setContractFile(null)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center cursor-pointer py-4">
                    <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                    <span className="text-sm font-medium">اضغط لاختيار ملف PDF</span>
                    <span className="text-xs text-muted-foreground mt-1">الحد الأقصى 10 ميجابايت</span>
                    <input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleContractUpload(f, "create");
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setOpen(false); setContractFile(null); }}>إلغاء</Button>
            <Button
              onClick={() => createMutation.mutate({ ...form, contractPdf: contractFile?.dataUrl || "", contractName: contractFile?.name || "" })}
              disabled={!form.customerId || !form.lotId || !form.salePrice || createMutation.isPending}
            >
              {createMutation.isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
              تسجيل البيع
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* تعديل بيع */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل البيع</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label>سعر البيع</Label>
              <Input type="number" value={editForm.salePrice || ""} onChange={(e) => setEditForm({ ...editForm, salePrice: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>تاريخ البيع</Label>
              <Input type="date" value={editForm.saleDate || ""} onChange={(e) => setEditForm({ ...editForm, saleDate: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>ملاحظات</Label>
              <Textarea value={editForm.notes || ""} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} rows={2} />
            </div>

            {/* العقد الحالي / استبداله */}
            <div className="space-y-2">
              <Label>عقد البيع الموقع (PDF)</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-4 transition-colors hover:border-primary/50">
                {/* العقد المرفوع حديثاً (لم يُحفظ بعد) */}
                {editContractFile ? (
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-5 h-5 text-red-600 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{editContractFile.name}</div>
                        <div className="text-xs text-emerald-600">جديد — سيحل محل القديم</div>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => setEditContractFile(null)} className="text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ) : editForm.contractPdf ? (
                  /* عقد قديم محفوظ */
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-sm font-medium">عقد محفوظ</div>
                        <div className="text-xs text-muted-foreground">اضغط "معاينة" لعرضه</div>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button size="sm" variant="ghost" onClick={() => previewContract(editForm)} title="معاينة">
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => downloadContract(editForm)} title="تحميل">
                        <Download className="w-3.5 h-3.5 text-emerald-600" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* لا يوجد عقد */
                  <label className="flex flex-col items-center justify-center cursor-pointer py-4">
                    <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                    <span className="text-sm font-medium">اضغط لاختيار ملف PDF</span>
                    <span className="text-xs text-muted-foreground mt-1">الحد الأقصى 10 ميجابايت</span>
                    <input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleContractUpload(f, "edit");
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
                {/* زر حذف العقد المحفوظ */}
                {editForm.contractPdf && !editContractFile && (
                  <Button
                    size="sm" variant="ghost"
                    className="mt-2 w-full text-destructive"
                    onClick={() => setEditForm({ ...editForm, contractPdf: "", contractName: "" })}
                  >
                    <Trash2 className="w-3.5 h-3.5 ml-1" /> حذف العقد الحالي
                  </Button>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditOpen(false); setEditContractFile(null); }}>إلغاء</Button>
            <Button
              onClick={() => updateMutation.mutate({
                ...editForm,
                contractPdf: editContractFile?.dataUrl || editForm.contractPdf || "",
                contractName: editContractFile?.name || editForm.contractName || "",
              })}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* إضافة دفعة */}
      <Dialog open={!!paymentModal} onOpenChange={(o) => !o && setPaymentModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة دفعة</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label>المبلغ *</Label>
              <Input type="number" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>التاريخ</Label>
                <Input type="date" value={paymentForm.paymentDate} onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>طريقة الدفع</Label>
                <Select value={paymentForm.paymentMethod} onValueChange={(v) => setPaymentForm({ ...paymentForm, paymentMethod: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">نقداً</SelectItem>
                    <SelectItem value="CHECK">شيك</SelectItem>
                    <SelectItem value="TRANSFER">تحويل بنكي</SelectItem>
                    <SelectItem value="CARD">بطاقة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>ملاحظات</Label>
              <Textarea value={paymentForm.notes} onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })} rows={2} />
            </div>

            {/* رفع صورة الدفعة - يظهر فقط عند غير النقد */}
            {paymentForm.paymentMethod !== "CASH" && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  صورة {PAYMENT_METHOD_LABELS[paymentForm.paymentMethod]} — اختياري
                </Label>
                <div className="border-2 border-dashed border-border rounded-lg p-3 transition-colors hover:border-primary/50">
                  {paymentImage ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                          <span className="text-sm font-medium truncate">{paymentImage.name}</span>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => setPaymentImage(null)} className="text-destructive">
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                      {paymentImage.dataUrl.startsWith("data:image") && (
                        <img src={paymentImage.dataUrl} alt={paymentImage.name} className="max-h-32 rounded border mx-auto" />
                      )}
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center cursor-pointer py-3">
                      <Upload className="w-5 h-5 text-muted-foreground mb-1" />
                      <span className="text-xs font-medium">اضغط لرفع صورة أو PDF</span>
                      <span className="text-xs text-muted-foreground mt-0.5">حتى 5 ميجابايت</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handlePaymentImageUpload(f);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  )}
                  {uploadingPayment && (
                    <div className="mt-1 flex items-center gap-2 text-xs text-primary">
                      <Loader2 className="w-3 h-3 animate-spin" /> جارٍ التحضير...
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPaymentModal(null); setPaymentImage(null); }}>إلغاء</Button>
            <Button
              onClick={() => paymentModal && addPaymentMutation.mutate(paymentModal.saleId)}
              disabled={!paymentForm.amount || addPaymentMutation.isPending}
            >
              {addPaymentMutation.isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
              إضافة الدفعة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: معاينة صورة الدفعة */}
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
              <img src={previewImage.url} alt={previewImage.name} className="max-h-[70vh] mx-auto rounded-lg border" />
            ) : (
              <iframe src={previewImage?.url} className="w-full h-[70vh] rounded-lg border" title={previewImage?.name} />
            )}
          </div>
          <DialogFooter>
            <a href={previewImage?.url} download={previewImage?.name}>
              <Button variant="outline">
                <Download className="w-4 h-4 ml-2" /> تحميل
              </Button>
            </a>
            <Button onClick={() => setPreviewImage(null)}>إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
