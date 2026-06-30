"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { FileBarChart, Download, FileSpreadsheet, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatDate, formatNumber, LOT_STATUS_LABELS, PAYMENT_METHOD_LABELS, VILLA_TYPE_LABELS } from "@/lib/format";

export function ReportsView() {
  const [tab, setTab] = useState("this-month");

  const { data, isLoading } = useQuery({
    queryKey: ["reports", tab],
    queryFn: async () => (await fetch(`/api/reports?type=${tab}`)).json(),
  });

  function exportExcel(rows: any[], filename: string, headers: { key: string, label: string }[]) {
    import("xlsx").then((XLSX) => {
      const ws = XLSX.utils.json_to_sheet(
        rows.map(r => {
          const o: any = {};
          headers.forEach(h => { o[h.label] = r[h.key]; });
          return o;
        })
      );
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Report");
      XLSX.writeFile(wb, `${filename}-${new Date().toISOString().slice(0,10)}.xlsx`);
      toast.success("تم تصدير Excel");
    });
  }

  function exportPDF(rows: any[], filename: string, headers: { key: string, label: string }[]) {
    import("jspdf").then((jsPDF) => {
      import("jspdf-autotable").then((autoTable) => {
        const doc = new jsPDF.default();
        doc.setFontSize(16);
        doc.text(filename, 14, 15);
        doc.setFontSize(10);
        doc.text(`تاريخ التصدير: ${new Date().toLocaleDateString("ar-MA")}`, 14, 22);

        autoTable.default(doc, {
          startY: 30,
          head: [headers.map(h => h.label)],
          body: rows.map(r => headers.map(h => String(r[h.key] ?? ""))),
          styles: { font: "helvetica", fontSize: 9 },
          headStyles: { fillColor: [40, 80, 60], textColor: 255 },
          rtl: false,
        });

        doc.save(`${filename}-${new Date().toISOString().slice(0,10)}.pdf`);
        toast.success("تم تصدير PDF");
      });
    });
  }

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-2">
          <FileBarChart className="w-6 h-6 text-primary" /> التقارير
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          تقارير شهرية ومخزون البقع، مع إمكانية التصدير إلى PDF و Excel
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="this-month">هذا الشهر</TabsTrigger>
          <TabsTrigger value="available">البقع المتوفرة</TabsTrigger>
          <TabsTrigger value="by-status">حسب الحالة</TabsTrigger>
          <TabsTrigger value="all-sales">كل المبيعات</TabsTrigger>
        </TabsList>

        <TabsContent value="this-month" className="space-y-4">
          {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : data && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { label: "زوار", value: formatNumber(data.totals?.visitorsCount || 0) },
                  { label: "زيارات", value: formatNumber(data.totals?.visitsCount || 0) },
                  { label: "عمليات بيع", value: formatNumber(data.totals?.salesCount || 0) },
                  { label: "إجمالي المبيعات", value: formatCurrency(data.totals?.salesTotal || 0) },
                  { label: "المحصّل", value: formatCurrency(data.totals?.paymentsTotal || 0) },
                ].map((s, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="text-xs text-muted-foreground">{s.label}</div>
                      <div className="text-lg font-bold mt-1 nums">{s.value}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <ReportTable
                title="الزوار هذا الشهر"
                rows={data.visitors || []}
                headers={[
                  { key: "visitorCode", label: "الكود" },
                  { key: "name", label: "الاسم" },
                  { key: "phone", label: "الهاتف" },
                  { key: "createdAt", label: "التاريخ" },
                ]}
                onExcel={(r) => exportExcel(r.map((x: any) => ({...x, createdAt: formatDate(x.createdAt)})), "visitors-month",
                  [{key:"visitorCode",label:"الكود"},{key:"name",label:"الاسم"},{key:"phone",label:"الهاتف"},{key:"createdAt",label:"التاريخ"}])}
                onPDF={(r) => exportPDF(r.map((x: any) => ({...x, createdAt: formatDate(x.createdAt)})), "visitors-month",
                  [{key:"visitorCode",label:"الكود"},{key:"name",label:"الاسم"},{key:"phone",label:"الهاتف"},{key:"createdAt",label:"التاريخ"}])}
              />

              <ReportTable
                title="المبيعات هذا الشهر"
                rows={data.sales || []}
                headers={[
                  { key: "lotNumber", label: "البقعة" },
                  { key: "customerName", label: "الزبون" },
                  { key: "salePrice", label: "السعر" },
                  { key: "saleDate", label: "التاريخ" },
                ]}
                renderRow={(r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono">{r.lotNumber}</TableCell>
                    <TableCell>{r.customerName}</TableCell>
                    <TableCell className="nums">{formatCurrency(r.salePrice)}</TableCell>
                    <TableCell className="text-xs">{formatDate(r.saleDate)}</TableCell>
                  </TableRow>
                )}
                onExcel={(r) => exportExcel(r.map((x: any) => ({...x, salePrice: x.salePrice, saleDate: formatDate(x.saleDate)})), "sales-month",
                  [{key:"lotNumber",label:"البقعة"},{key:"customerName",label:"الزبون"},{key:"salePrice",label:"السعر"},{key:"saleDate",label:"التاريخ"}])}
                onPDF={(r) => exportPDF(r.map((x: any) => ({...x, salePrice: x.salePrice, saleDate: formatDate(x.saleDate)})), "sales-month",
                  [{key:"lotNumber",label:"البقعة"},{key:"customerName",label:"الزبون"},{key:"salePrice",label:"السعر"},{key:"saleDate",label:"التاريخ"}])}
              />

              <ReportTable
                title="الدفعات هذا الشهر"
                rows={data.payments || []}
                headers={[
                  { key: "saleInfo", label: "العملية" },
                  { key: "amount", label: "المبلغ" },
                  { key: "paymentMethod", label: "الطريقة" },
                  { key: "paymentDate", label: "التاريخ" },
                ]}
                renderRow={(r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.saleInfo}</TableCell>
                    <TableCell className="nums font-semibold text-emerald-600">{formatCurrency(r.amount)}</TableCell>
                    <TableCell className="text-xs">{PAYMENT_METHOD_LABELS[r.paymentMethod] || r.paymentMethod}</TableCell>
                    <TableCell className="text-xs">{formatDate(r.paymentDate)}</TableCell>
                  </TableRow>
                )}
                onExcel={(r) => exportExcel(r.map((x: any) => ({...x, paymentMethod: PAYMENT_METHOD_LABELS[x.paymentMethod] || x.paymentMethod, paymentDate: formatDate(x.paymentDate)})), "payments-month",
                  [{key:"saleInfo",label:"العملية"},{key:"amount",label:"المبلغ"},{key:"paymentMethod",label:"الطريقة"},{key:"paymentDate",label:"التاريخ"}])}
                onPDF={(r) => exportPDF(r.map((x: any) => ({...x, paymentMethod: PAYMENT_METHOD_LABELS[x.paymentMethod] || x.paymentMethod, paymentDate: formatDate(x.paymentDate)})), "payments-month",
                  [{key:"saleInfo",label:"العملية"},{key:"amount",label:"المبلغ"},{key:"paymentMethod",label:"الطريقة"},{key:"paymentDate",label:"التاريخ"}])}
              />
            </>
          )}
        </TabsContent>

        <TabsContent value="available">
          {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : data && (
            <ReportTable
              title={`البقع المتوفرة (${data.count})`}
              rows={data.lots || []}
              headers={[
                { key: "lotNumber", label: "رقم البقعة" },
                { key: "villaType", label: "النوع" },
                { key: "status", label: "الحالة" },
                { key: "lotArea", label: "المساحة" },
                { key: "currentPrice", label: "السعر" },
              ]}
              renderRow={(r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono font-semibold">{r.lotNumber}</TableCell>
                  <TableCell className="text-xs">{VILLA_TYPE_LABELS[r.villaType]}</TableCell>
                  <TableCell className="text-xs">{LOT_STATUS_LABELS[r.status]}</TableCell>
                  <TableCell className="nums">{r.lotArea} م²</TableCell>
                  <TableCell className="nums font-semibold text-primary">{formatCurrency(r.currentPrice || (r.status === "READY" ? r.priceReady : r.status === "SEMI_FINISHED" ? r.priceSemiFinished : r.priceEmpty))}</TableCell>
                </TableRow>
              )}
              onExcel={(r) => exportExcel(r.map((x: any) => ({...x, villaType: VILLA_TYPE_LABELS[x.villaType], status: LOT_STATUS_LABELS[x.status], currentPrice: x.currentPrice || (x.status === "READY" ? x.priceReady : x.status === "SEMI_FINISHED" ? x.priceSemiFinished : x.priceEmpty)})), "available-lots",
                [{key:"lotNumber",label:"رقم البقعة"},{key:"villaType",label:"النوع"},{key:"status",label:"الحالة"},{key:"lotArea",label:"المساحة"},{key:"currentPrice",label:"السعر"}])}
              onPDF={(r) => exportPDF(r.map((x: any) => ({...x, villaType: VILLA_TYPE_LABELS[x.villaType], status: LOT_STATUS_LABELS[x.status], currentPrice: x.currentPrice || (x.status === "READY" ? x.priceReady : x.status === "SEMI_FINISHED" ? x.priceSemiFinished : x.priceEmpty)})), "available-lots",
                [{key:"lotNumber",label:"رقم البقعة"},{key:"villaType",label:"النوع"},{key:"status",label:"الحالة"},{key:"lotArea",label:"المساحة"},{key:"currentPrice",label:"السعر"}])}
            />
          )}
        </TabsContent>

        <TabsContent value="by-status" className="space-y-4">
          {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : data && (
            <>
              {[
                { key: "empty", label: "البقع الفارغة", rows: data.empty },
                { key: "semi", label: "البقع شبه الجاهزة", rows: data.semiFinished },
                { key: "ready", label: "البقع الجاهزة", rows: data.ready },
              ].map(s => (
                <ReportTable
                  key={s.key}
                  title={`${s.label} (${s.rows?.length || 0})`}
                  rows={s.rows || []}
                  headers={[
                    { key: "lotNumber", label: "رقم البقعة" },
                    { key: "lotArea", label: "المساحة" },
                    { key: "totalBuiltArea", label: "مساحة البناء" },
                  ]}
                  renderRow={(r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono font-semibold">{r.lotNumber}</TableCell>
                      <TableCell className="nums">{r.lotArea} م²</TableCell>
                      <TableCell className="nums">{r.totalBuiltArea} م²</TableCell>
                    </TableRow>
                  )}
                  onExcel={(r) => exportExcel(r, `${s.label}`,
                    [{key:"lotNumber",label:"رقم البقعة"},{key:"lotArea",label:"المساحة"},{key:"totalBuiltArea",label:"مساحة البناء"}])}
                  onPDF={(r) => exportPDF(r, `${s.label}`,
                    [{key:"lotNumber",label:"رقم البقعة"},{key:"lotArea",label:"المساحة"},{key:"totalBuiltArea",label:"مساحة البناء"}])}
                />
              ))}
            </>
          )}
        </TabsContent>

        <TabsContent value="all-sales">
          <AllSalesReport onExcel={exportExcel} onPDF={exportPDF} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ReportTable({
  title, rows, headers, renderRow, onExcel, onPDF,
}: {
  title: string;
  rows: any[];
  headers: { key: string; label: string }[];
  renderRow?: (r: any) => React.ReactNode;
  onExcel: (rows: any[]) => void;
  onPDF: (rows: any[]) => void;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        <div className="flex gap-1">
          <Button size="sm" variant="outline" onClick={() => onExcel(rows)} disabled={rows.length === 0}>
            <FileSpreadsheet className="w-3 h-3 ml-1" /> Excel
          </Button>
          <Button size="sm" variant="outline" onClick={() => onPDF(rows)} disabled={rows.length === 0}>
            <FileText className="w-3 h-3 ml-1" /> PDF
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {rows.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground">لا توجد بيانات</div>
        ) : (
          <div className="overflow-x-auto max-h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  {headers.map(h => <TableHead key={h.key}>{h.label}</TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {renderRow ? rows.map(r => renderRow(r)) : rows.map(r => (
                  <TableRow key={r.id}>
                    {headers.map(h => <TableCell key={h.key} className="text-sm">{r[h.key]}</TableCell>)}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AllSalesReport({ onExcel, onPDF }: { onExcel: (r: any[], f: string, h: any[]) => void; onPDF: (r: any[], f: string, h: any[]) => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ["sales"],
    queryFn: async () => (await fetch("/api/sales")).json(),
  });
  const { data: paymentsData } = useQuery({
    queryKey: ["payments"],
    queryFn: async () => (await fetch("/api/payments")).json(),
  });

  if (isLoading) return <Loader2 className="w-6 h-6 animate-spin" />;

  const sales = (data?.sales || []).map((s: any) => {
    const ps = (paymentsData?.payments || []).filter((p: any) => p.saleId === s.id);
    const paid = ps.reduce((sum: number, p: any) => sum + p.amount, 0);
    return {
      ...s,
      paid,
      remaining: s.salePrice - paid,
      paymentCount: ps.length,
    };
  });

  const headers = [
    { key: "lotNumber", label: "البقعة" },
    { key: "customerName", label: "الزبون" },
    { key: "salePrice", label: "سعر البيع" },
    { key: "paid", label: "المحصّل" },
    { key: "remaining", label: "المتبقي" },
    { key: "saleDate", label: "التاريخ" },
  ];

  return (
    <ReportTable
      title={`كل المبيعات (${sales.length})`}
      rows={sales}
      headers={headers}
      renderRow={(r) => (
        <TableRow key={r.id}>
          <TableCell className="font-mono">{r.lotNumber}</TableCell>
          <TableCell>{r.customerName}</TableCell>
          <TableCell className="nums">{formatCurrency(r.salePrice)}</TableCell>
          <TableCell className="nums text-emerald-600">{formatCurrency(r.paid)}</TableCell>
          <TableCell className="nums text-amber-600">{formatCurrency(r.remaining)}</TableCell>
          <TableCell className="text-xs">{formatDate(r.saleDate)}</TableCell>
        </TableRow>
      )}
      onExcel={(r) => onExcel(
        r.map((x: any) => ({...x, saleDate: formatDate(x.saleDate)})),
        "all-sales", headers
      )}
      onPDF={(r) => onPDF(
        r.map((x: any) => ({...x, saleDate: formatDate(x.saleDate)})),
        "all-sales", headers
      )}
    />
  );
}
