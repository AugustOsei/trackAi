"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/lib/actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="mt-8 space-y-4">
      <div>
        <label htmlFor="password" className="font-display text-xs font-bold uppercase tracking-wider text-ink-muted">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoFocus
          className="font-data mt-2 w-full rounded-xl bg-surface px-4 py-3 text-ink outline-none ring-1 ring-transparent focus-visible:ring-gold"
        />
      </div>
      {state.error && (
        <p className="font-display text-sm font-semibold text-gold" role="alert">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="font-display rounded-full bg-gold px-7 py-3.5 text-lg font-black tracking-tight text-gold-fg transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Checking…" : "Enter"}
      </button>
    </form>
  );
}
