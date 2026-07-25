"use client";

import Link from "next/link";
import { useState } from "react";

interface ClientAddress {
  line1: string;
  line2: string | null;
  city: string;
  region: string | null;
  postal_code: string;
  country: string;
}

export interface ClientOption {
  id: string;
  name: string | null;
  email: string;
  orderCount: number;
  shippingAddress: ClientAddress | null;
  billingAddress: ClientAddress | null;
}

function AddressBlock({ address }: { address: ClientAddress }) {
  return (
    <p className="mt-1 text-sm text-foreground">
      {address.line1}
      {address.line2 ? `, ${address.line2}` : ""}
      <br />
      {address.city}
      {address.region ? `, ${address.region}` : ""} {address.postal_code}
      <br />
      {address.country}
    </p>
  );
}

/**
 * Customer card for the Create order page's sidebar -- before a client
 * is picked, shows the existing-client dropdown + guest fields
 * (unchanged fields/logic from the old ClientOrGuestFields). Once a
 * client is selected, swaps to a read-only summary (name/order count/
 * email/shipping/billing address, same data shapes the order detail
 * page's own Customer card already renders) with a "Change" link back
 * to the picker -- matching the screenshot's post-selection state
 * while keeping a way to fix a wrong pick without reloading the page.
 */
export function CustomerCardPicker({ clients }: { clients: ClientOption[] }) {
  const [selectedId, setSelectedId] = useState("");
  const selected = clients.find((c) => c.id === selectedId) ?? null;

  if (selected) {
    return (
      <div className="mt-3 text-sm">
        <input type="hidden" name="client_id" value={selected.id} />
        <p className="text-foreground">{selected.name ?? selected.email}</p>
        <Link
          href={`/admin/clients/${selected.id}`}
          className="mt-1 inline-block text-accent underline underline-offset-4"
        >
          {selected.orderCount} order{selected.orderCount === 1 ? "" : "s"}
        </Link>

        <h4 className="mt-4 text-xs font-medium uppercase tracking-wide text-muted">
          Contact information
        </h4>
        <p className="mt-1 text-foreground">{selected.email}</p>

        <h4 className="mt-4 text-xs font-medium uppercase tracking-wide text-muted">
          Shipping address
        </h4>
        {selected.shippingAddress ? (
          <AddressBlock address={selected.shippingAddress} />
        ) : (
          <p className="mt-1 text-sm text-muted">No saved address.</p>
        )}

        <h4 className="mt-4 text-xs font-medium uppercase tracking-wide text-muted">
          Billing address
        </h4>
        {selected.billingAddress ? (
          <AddressBlock address={selected.billingAddress} />
        ) : (
          <p className="mt-1 text-sm text-muted">Same as shipping address</p>
        )}

        <button
          type="button"
          onClick={() => setSelectedId("")}
          className="mt-4 text-xs text-muted underline underline-offset-4 hover:text-foreground"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="mt-3 flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-foreground">Existing client</span>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="border border-line bg-background px-3 py-2 text-sm"
        >
          <option value="">— None, use guest details below —</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name ?? c.email} ({c.email})
            </option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-foreground">Guest name</span>
          <input name="guest_name" className="border border-line bg-background px-3 py-2 text-sm" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-foreground">Guest email</span>
          <input
            name="guest_email"
            type="email"
            className="border border-line bg-background px-3 py-2 text-sm"
          />
        </label>
      </div>
      <p className="text-xs text-muted">
        Choose an existing client above, or leave it unselected and fill in a guest name and email.
      </p>
    </div>
  );
}
