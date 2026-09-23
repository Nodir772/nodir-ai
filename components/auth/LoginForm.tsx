"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { SetupNotice } from "@/components/auth/SetupNotice";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { AUTH_ERRORS } from "@/lib/auth/constants";

export function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/chat";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim() || !password) {
      setError(AUTH_ERRORS.empty);
      return;
    }
    setPending(true);
    setError("");
    const result = await login(email, password);
    setPending(false);
    if (result) {
      setError(result);
      return;
    }
    router.push(next.startsWith("/") ? next : "/chat");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <SetupNotice />
      <Field label="Email">
        <Input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="email@domain.com"
          required
        />
      </Field>
      <Field label="Parol">
        <Input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="••••••••"
          required
        />
      </Field>
      <div className="flex justify-end">
        <Link href="/forgot-password" className="text-sm text-muted hover:text-foreground">
          Parolni unutdingizmi?
        </Link>
      </div>
      {error ? (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Tekshirilmoqda..." : "Kirish"}
      </Button>
      <p className="text-center text-sm text-muted">
        Hisobingiz yo&apos;qmi?{" "}
        <Link href="/register" className="text-foreground underline-offset-4 hover:underline">
          Ro&apos;yxatdan o&apos;tish
        </Link>
      </p>
    </form>
  );
}
