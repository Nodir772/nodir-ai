"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { AuthShell } from "@/components/auth/AuthShell";
import { SetupNotice } from "@/components/auth/SetupNotice";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <AuthShell title="Parolni tiklash" subtitle="Emailingizga tiklash havolasi yuboriladi.">
      <form
        className="space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          setPending(true);
          setError("");
          setMessage("");
          const result = await resetPassword(email);
          setPending(false);
          if (result) {
            setError(result);
            return;
          }
          setMessage("Agar email to'g'ri bo'lsa, tiklash yo'riqnomasi yuboriladi.");
        }}
      >
        <SetupNotice />
        <Field label="Email">
          <Input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        {message ? <p className="text-sm text-accent">{message}</p> : null}
        <Button type="submit" className="w-full" disabled={pending}>
          Yuborish
        </Button>
        <p className="text-center text-sm text-muted">
          <Link href="/login">Kirish sahifasiga qaytish</Link>
        </p>
      </form>
    </AuthShell>
  );
}
