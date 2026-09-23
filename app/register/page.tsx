import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata = {
  title: "Ro'yxatdan o'tish",
};

export default function RegisterPage() {
  return (
    <AuthShell
      title="Ro'yxatdan o'tish"
      subtitle="Bir necha soniyada hisob yarating."
    >
      <RegisterForm />
    </AuthShell>
  );
}
