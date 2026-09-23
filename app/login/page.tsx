import { Suspense } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = {
  title: "Kirish",
};

export default function LoginPage() {
  return (
    <AuthShell title="Kirish" subtitle="Nodir AI hisobingizga xush kelibsiz.">
      <Suspense fallback={<p className="text-sm text-muted">Yuklanmoqda...</p>}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
