export const dynamic = 'force-dynamic';
export const revalidate = 0;

import Link from "next/link";
import GoogleTranslate from "@/components/GoogleTranslate";
import BackButton from "@/components/BackButton";

export const metadata = {
  title: "Bobalicious",
  description: "Order your favorite boba drinks",
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-950 to-black text-zinc-100">
      <div className="mx-auto flex max-w-3xl flex-col items-center px-6 py-16 md:py-24">
        {/* Title */}
        <header className="w-full">
          <h1 className="text-center text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
            Bobalicious
          </h1>
          <p className="mt-3 text-center text-zinc-400">
            Freshly brewed. Made your way.
          </p>
        </header>

        {/* <div className="mt-6"> */}
        <nav className="flex justify-between items-center">

          <GoogleTranslate />
        </nav>
        {/* </div> */}

        {/* Buttons */}
        <section className="mt-16 flex w-full flex-col items-center gap-10">
          {/* Start ordering in English */}
          <NavButton href="/login" ariaLabel="Start ordering in English">
            Start Ordering
          </NavButton>

          {/* Employee login */}
          <NavButton href="/manager-dashboard" variant="secondary" ariaLabel="Employees login">
            Employees Login
          </NavButton>
        </section>
      </div>
    </main>
  );
}

/** Reusable rounded button */
function NavButton({
  href,
  children,
  ariaLabel,
  variant = "primary",
}: {
  href: string;
  children: React.ReactNode;
  ariaLabel: string;
  variant?: "primary" | "secondary";
}) {
  const base =
    "block w-full max-w-xl rounded-3xl border px-10 py-14 text-center text-xl font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-4 md:text-2xl";
  const styles =
    variant === "primary"
      ? "bg-zinc-800/70 border-zinc-700 hover:bg-zinc-800 hover:-translate-y-0.5 focus-visible:ring-teal-600/40"
      : "bg-zinc-900/70 border-zinc-700 hover:bg-zinc-900 hover:-translate-y-0.5 focus-visible:ring-indigo-600/40";

  return (
    <Link href={href} aria-label={ariaLabel} className={`${base} ${styles}`}>
      {children}
    </Link>
  );
}