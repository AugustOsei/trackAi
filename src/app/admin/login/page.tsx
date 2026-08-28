import type { Metadata } from "next";
import { LoginForm } from "./login-form";

// Second layer over robots.txt — keep the login form out of any index.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function AdminLoginPage() {
  return (
    <div className="mx-auto max-w-sm px-4 py-20 sm:px-6">
      <h1 className="font-display text-4xl font-black tracking-tight text-ink">Admin</h1>
      <p className="mt-2 text-sm text-ink-muted">Review queue access.</p>
      <LoginForm />
    </div>
  );
}
