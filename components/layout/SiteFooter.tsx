import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Container } from "@/components/ui/Container";

export function SiteFooter() {
  return (
    <footer id="aloqa" className="border-t border-border bg-background">
      <Container className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-6 text-muted">
            Savollar bering, g&apos;oyalar yarating va ishni tezroq bajarish uchun
            shaxsiy sun&apos;iy intellekt yordamchingiz.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold">Mahsulot</p>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>
              <Link href="/#xususiyatlar" className="hover:text-foreground">
                Xususiyatlar
              </Link>
            </li>
            <li>
              <Link href="/pricing" className="hover:text-foreground">
                Narxlar
              </Link>
            </li>
            <li>
              <Link href="/chat" className="hover:text-foreground">
                Chat
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold">Kompaniya</p>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>
              <Link href="/about" className="hover:text-foreground">
                Biz haqimizda
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-foreground">
                Maxfiylik
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-foreground">
                Shartlar
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold">Aloqa</p>
          <p className="mt-3 text-sm leading-6 text-muted">
            Savol yoki takliflaringiz bo&apos;lsa, platforma ichidan yozing yoki
            keyingi bosqichda email orqali bog&apos;laning.
          </p>
        </div>
      </Container>
      <div className="border-t border-border py-5">
        <Container className="flex flex-col gap-2 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Nodir AI. Barcha huquqlar himoyalangan.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-foreground">
              Maxfiylik
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Shartlar
            </Link>
          </div>
        </Container>
      </div>
    </footer>
  );
}
