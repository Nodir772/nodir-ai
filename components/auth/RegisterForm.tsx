"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { SetupNotice } from "@/components/auth/SetupNotice";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { AUTH_ERRORS } from "@/lib/auth/constants";

export function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim() || !email.trim() || !password || !confirm) {
      setError(AUTH_ERRORS.empty);
      return;
    }
    if (password !== confirm) {
      setError(AUTH_ERRORS.mismatch);
      return;
    }
    if (password.length < 8) {
      setError(AUTH_ERRORS.weak);
      return;
    }
    setPending(true);
    setError("");
    setInfo("");
    const result = await register(name, email, password);
    setPending(false);
    if (result) {
      if (result.startsWith("Hisob yaratildi")) {
        setInfo(result);
        return;
      }
      setError(result);
      return;
    }
    router.push("/onboarding");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <SetupNotice />
      <Field label="Ism">
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nodir"
          autoComplete="name"
          required
        />
      </Field>
      <Field label="Email">
        <Input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="email@domain.com"
          autoComplete="email"
          required
        />
      </Field>
      <Field label="Parol">
        <Input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="new-password"
          required
        />
      </Field>
      <Field label="Parolni tasdiqlang">
        <Input
          type="password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          autoComplete="new-password"
          required
        />
      </Field>
      {error ? (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      {info ? (
        <p className="text-sm text-accent" role="status">
          {info}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Yaratilmoqda..." : "Ro'yxatdan o'tish"}
      </Button>
      <p className="text-center text-sm text-muted">
        Allaqachon hisobingiz bormi?{" "}
        <Link href="/login" className="text-foreground underline-offset-4 hover:underline">
          Kirish
        </Link>
      </p>
    </form>
  );
}
