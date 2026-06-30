"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, Download, Loader2, Upload, Info } from "lucide-react";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/format";

export function BackupView() {
  const [downloading, setDownloading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [lastBackup, setLastBackup] = useState<string | null>(null);

  async function handleBackup() {
    setDownloading(true);
    try {
      const res = await fetch("/api/backup");
      if (!res.ok) throw new Error("فشل التصدير");
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setLastBackup(new Date().toISOString());
      toast.success("تم تنزيل النسخة الاحتياطية");
    } catch (e: any) {
      toast.error(e.message || "خطأ");
    }
    setDownloading(false);
  }

  async function handleRestore(file: File) {
    setRestoring(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data.data) throw new Error("ملف غير صالح");
      toast.info("ميزة الاستعادة ستتوفر في النسخة الكاملة. يمكن استيراد البيانات يدوياً في Firebase Console.");
    } catch (e: any) {
      toast.error("ملف غير صالح: " + e.message);
    }
    setRestoring(false);
  }

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-2">
          <Database className="w-6 h-6 text-primary" /> النسخ الاحتياطي
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          تنزيل نسخة كاملة من قاعدة البيانات بصيغة JSON
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">تصدير البيانات</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 text-blue-800 text-sm">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium mb-1">ماذا يشمل النسخ الاحتياطي؟</p>
              <ul className="text-xs space-y-0.5 list-disc list-inside">
                <li>كل المستخدمين (بدون أكواد PIN لأمان أعلى)</li>
                <li>الزوار وسجل الزيارات</li>
                <li>الزبناء</li>
                <li>البقع العقارية</li>
                <li>عمليات البيع والدفعات</li>
              </ul>
            </div>
          </div>

          <Button onClick={handleBackup} disabled={downloading} size="lg" className="w-full">
            {downloading ? <Loader2 className="w-5 h-5 ml-2 animate-spin" /> : <Download className="w-5 h-5 ml-2" />}
            تنزيل النسخة الاحتياطية
          </Button>

          {lastBackup && (
            <div className="text-xs text-muted-foreground text-center">
              آخر تنزيل: {formatDateTime(lastBackup)}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">استعادة البيانات</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 text-amber-800 text-sm">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-medium mb-1">تنبيه</p>
              <p>استعادة البيانات ستلغي البيانات الحالية. تأكد من أخذ نسخة احتياطية أولاً.</p>
            </div>
          </div>
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleRestore(f);
              }}
            />
            <Button variant="outline" size="lg" className="w-full" disabled={restoring}>
              {restoring ? <Loader2 className="w-5 h-5 ml-2 animate-spin" /> : <Upload className="w-5 h-5 ml-2" />}
              استعادة من ملف
            </Button>
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">معلومات النظام</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-2 text-muted-foreground">
            <div className="flex justify-between">
              <span>الإصدار:</span>
              <span className="font-mono">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span>قاعدة البيانات:</span>
              <span>Firebase Firestore</span>
            </div>
            <div className="flex justify-between">
              <span>النشر:</span>
              <span>Vercel + GitHub</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
