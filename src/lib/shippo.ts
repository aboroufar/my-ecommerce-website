import { Shippo } from "shippo";

let shippo: Shippo | null = null;

/**
 * Lazily-initialized Shippo client. Lazy so that a missing SHIPPO_API_KEY
 * only breaks label-purchase code paths when actually called, not the
 * whole build -- same pattern as getStripe() in src/lib/stripe.ts.
 */
function getShippo(): Shippo {
  if (!shippo) {
    const key = process.env.SHIPPO_API_KEY;
    if (!key) {
      throw new Error(
        "SHIPPO_API_KEY is not set. Add it to .env.local (and Vercel env vars)."
      );
    }
    shippo = new Shippo({ apiKeyHeader: key });
  }
  return shippo;
}

export interface ShippoAddress {
  name: string;
  street1: string;
  street2?: string;
  city: string;
  state?: string;
  zip: string;
  country: string;
  phone?: string;
  email?: string;
}

export interface ShippoParcel {
  weightGrams: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
}

export interface ShippingRateOption {
  rateId: string;
  provider: string;
  serviceLevel: string;
  amount: string;
  currency: string;
  estimatedDays: number | null;
}

/**
 * Creates a Shippo Shipment from the given from/to addresses and parcel,
 * and returns the resulting carrier rate options. Runs synchronously
 * (async: false is Shippo's default for this request shape) so the
 * caller gets rates back in the same request rather than needing to poll.
 */
export async function getShippingRates(params: {
  fromAddress: ShippoAddress;
  toAddress: ShippoAddress;
  parcel: ShippoParcel;
}): Promise<ShippingRateOption[]> {
  const shipment = await getShippo().shipments.create({
    addressFrom: {
      name: params.fromAddress.name,
      street1: params.fromAddress.street1,
      street2: params.fromAddress.street2,
      city: params.fromAddress.city,
      state: params.fromAddress.state,
      zip: params.fromAddress.zip,
      country: params.fromAddress.country,
      phone: params.fromAddress.phone,
      email: params.fromAddress.email,
    },
    addressTo: {
      name: params.toAddress.name,
      street1: params.toAddress.street1,
      street2: params.toAddress.street2,
      city: params.toAddress.city,
      state: params.toAddress.state,
      zip: params.toAddress.zip,
      country: params.toAddress.country,
      phone: params.toAddress.phone,
      email: params.toAddress.email,
    },
    parcels: [
      {
        massUnit: "g",
        weight: String(params.parcel.weightGrams),
        distanceUnit: "cm",
        length: String(params.parcel.lengthCm),
        width: String(params.parcel.widthCm),
        height: String(params.parcel.heightCm),
      },
    ],
  });

  return shipment.rates.map((rate) => ({
    rateId: rate.objectId,
    provider: rate.provider,
    serviceLevel: rate.servicelevel.name ?? rate.servicelevel.token ?? "",
    amount: rate.amount,
    currency: rate.currency,
    estimatedDays: rate.estimatedDays ?? null,
  }));
}

export interface PurchasedLabel {
  carrier: string;
  trackingNumber: string;
  trackingUrl: string | null;
  labelUrl: string;
  transactionId: string;
}

/**
 * Purchases a shipping label for a previously-fetched rate id. Throws on
 * failure or a non-SUCCESS transaction status -- unlike
 * sendOrderConfirmationEmail, this always runs as an explicit admin action
 * with its own error handling in the UI, not a best-effort side effect
 * after an already-completed payment.
 */
export async function purchaseShippingLabel(
  rateId: string,
  provider: string
): Promise<PurchasedLabel> {
  const transaction = await getShippo().transactions.create({
    rate: rateId,
    async: false,
  });

  if (transaction.status !== "SUCCESS" || !transaction.labelUrl || !transaction.trackingNumber) {
    const message = transaction.messages?.map((m) => m.text).join("; ");
    throw new Error(
      `Shippo could not generate the label (status: ${transaction.status}).${
        message ? ` ${message}` : ""
      }`
    );
  }

  return {
    carrier: provider,
    trackingNumber: transaction.trackingNumber,
    trackingUrl: transaction.trackingUrlProvider ?? null,
    labelUrl: transaction.labelUrl,
    transactionId: transaction.objectId ?? "",
  };
}
