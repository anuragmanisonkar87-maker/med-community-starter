"use client";

import { useState } from "react";

// Requires typing DELETE to confirm, then posts to the delete route.
export default function DeleteAccount() {
  const [confirm, setConfirm] = useState("");
  return (
    <form action="/api/account/delete" method="post" className="space-y-2">
      <input
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder="Type DELETE to confirm"
        className="w-full rounded-lg border border-red-200 px-3 py-2 text-sm outline-none focus:border-red-400"
      />
      <button
        disabled={confirm !== "DELETE"}
        className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-40"
      >
        Delete my account
      </button>
    </form>
  );
}
