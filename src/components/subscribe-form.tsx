"use client";

import { useActionState } from "react";
import { subscribe, type SubscribeState } from "@/lib/actions";

const initialState: SubscribeState = {};

export function SubscribeForm() {
  const [state, formAction, pending] = useActionState(subscribe, initialState);

  if (state.success) {
    return (
      <p className="font-display text-sm font-bold text-ink">
        {state.alreadySubscribed
          ? "You're already on the list."
          : "Check your inbox — click the link to confirm."}
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-2 sm:flex-row sm:items-start">
      {/* Honeypot — hidden from people, tempting to naive bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="sub-website">Website</label>
        <input id="sub-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="flex-1">
        <input
          type="email"
          name="email"
          required
          placeholder="you@wherever.com"
          className="font-data w-full rounded-full bg-surface px-4 py-2.5 text-sm text-ink outline-none placeholder:text-ink-faint ring-1 ring-transparent focus-visible:ring-gold"
        />
        {state.error && (
          <p className="mt-1.5 text-xs font-semibold text-gold" role="alert">
            {state.error}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="font-display shrink-0 rounded-full bg-gold px-5 py-2.5 text-sm font-bold text-gold-fg transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Subscribing…" : "Notify me"}
      </button>
    </form>
  );
}
