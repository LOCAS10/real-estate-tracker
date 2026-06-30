"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Building2, Delete, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { ROLE_LABELS } from "@/lib/format";

export function PinScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [step, setStep] = useState<"username" | "pin">("username");
  const [loading, setLoading] = useState(false);
  const [userPreview, setUserPreview] = useState<{ name: string; role: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [step]);

  async function handleUsernameNext() {
    if (!username.trim()) {
      toast.error("أدخل اسم المستخدم");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth");
      const data = await res.json();
      const found = (data.users || []).find(
        (u: any) => u.username === username.trim() && u.active
      );
      if (!found) {
        toast.error("اسم المستخدم غير موجود أو معطّل");
        setLoading(false);
        return;
      }
      setUserPreview({ name: found.name, role: found.role });
      setStep("pin");
      setPin("");
    } catch (e: any) {
      toast.error(e.message || "خطأ");
    }
    setLoading(false);
  }

  async function handleLogin() {
    if (pin.length < 4) {
      toast.error("أدخل 4 أرقام على الأقل");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), pin }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "فشل الدخول");
        setPin("");
        return;
      }
      toast.success(`مرحباً ${data.user.name}`);
      login(data.user);
    } catch (e: any) {
      toast.error(e.message || "خطأ");
    }
    setLoading(false);
  }

  function handleDigit(d: string) {
    if (pin.length < 8) setPin((p) => p + d);
  }

  function handleBackspace() {
    setPin((p) => p.slice(0, -1));
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-sidebar via-background to-accent">
      <Card className="w-full max-w-md p-8 shadow-2xl border-0 bg-card/95 backdrop-blur">
        <div className="flex flex-col items-center mb-6">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
            <Building2 className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">نظام تتبع المشروع</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {step === "username" ? "أدخل اسم المستخدم للمتابعة" : `مرحباً ${userPreview?.name}`}
          </p>
          {userPreview && (
            <span className="mt-2 inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-primary/10 text-primary">
              <ShieldCheck className="w-3 h-3" />
              {ROLE_LABELS[userPreview.role] || userPreview.role}
            </span>
          )}
        </div>

        {step === "username" ? (
          <div className="space-y-4">
            <input
              ref={inputRef}
              type="text"
              autoFocus
              placeholder="اسم المستخدم (مثل: admin)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleUsernameNext()}
              className="w-full px-4 py-3 text-center text-lg rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              dir="ltr"
            />
            <Button
              className="w-full h-12 text-base"
              onClick={handleUsernameNext}
              disabled={loading}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "متابعة"}
            </Button>
            <div className="text-xs text-center text-muted-foreground space-y-1">
              <div>حسابات تجريبية:</div>
              <div dir="ltr" className="font-mono">admin / 1234 — sales / 2345 — accountant / 3456</div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* عرض نقاط PIN */}
            <div className="flex justify-center gap-3 my-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full transition-all ${
                    i < pin.length ? "bg-primary scale-110" : "bg-muted border-2 border-border"
                  }`}
                />
              ))}
            </div>

            {/* لوحة الأرقام */}
            <div className="grid grid-cols-3 gap-2 max-w-[280px] mx-auto">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
                <Button
                  key={d}
                  variant="outline"
                  className="h-16 text-xl font-semibold"
                  onClick={() => handleDigit(d)}
                >
                  {d}
                </Button>
              ))}
              <Button variant="ghost" className="h-16" onClick={() => setStep("username")}>
                ←
              </Button>
              <Button
                variant="outline"
                className="h-16 text-xl font-semibold"
                onClick={() => handleDigit("0")}
              >
                0
              </Button>
              <Button variant="ghost" className="h-16" onClick={handleBackspace}>
                <Delete className="w-6 h-6" />
              </Button>
            </div>

            <Button
              className="w-full h-12 text-base"
              onClick={handleLogin}
              disabled={loading || pin.length < 4}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "دخول"}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
