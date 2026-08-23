"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/lib/actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="mt-8 space-y-4">
      <div>
        <label htmlFor="password" className="font-data text-xs uppercase tracking-wider text-ink-muted">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoFocus
          className="font-data mt-2 w-full border border-hairline bg-transparent px-3 py-2 text-ink outline-none focus-visible:border-gold"
        />
      </div>
      {state.error && (
        <p className="font-data text-sm text-gold" role="alert">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="font-display bg-gold px-6 py-3 text-lg font-bold tracking-wide text-bg transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "CHECKING…" : "ENTER"}
      </button>
    </form>
  );
}
