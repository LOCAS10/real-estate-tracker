"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { PinScreen } from "@/components/pin-screen";
import { AppShell, TabId } from "@/components/app-shell";
import { DashboardView } from "@/components/views/dashboard-view";
import { VisitorsView } from "@/components/views/visitors-view";
import { VisitsView } from "@/components/views/visits-view";
import { CustomersView } from "@/components/views/customers-view";
import { LotsView } from "@/components/views/lots-view";
import { SalesView } from "@/components/views/sales-view";
import { PaymentsView } from "@/components/views/payments-view";
import { SearchView } from "@/components/views/search-view";
import { ReportsView } from "@/components/views/reports-view";
import { UsersView } from "@/components/views/users-view";
import { BackupView } from "@/components/views/backup-view";
import { NotificationsView } from "@/components/views/notifications-view";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<TabId>("dashboard");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <PinScreen />;
  }

  return (
    <AppShell active={tab} onChange={setTab}>
      {tab === "dashboard" && <DashboardView onNavigate={setTab} />}
      {tab === "search" && <SearchView onNavigate={setTab} />}
      {tab === "visitors" && <VisitorsView />}
      {tab === "visits" && <VisitsView />}
      {tab === "customers" && <CustomersView />}
      {tab === "lots" && <LotsView />}
      {tab === "sales" && <SalesView />}
      {tab === "payments" && <PaymentsView />}
      {tab === "reports" && <ReportsView />}
      {tab === "users" && <UsersView />}
      {tab === "backup" && <BackupView />}
      {tab === "notifications" && <NotificationsView />}
    </AppShell>
  );
}
