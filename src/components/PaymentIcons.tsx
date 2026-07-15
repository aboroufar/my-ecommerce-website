export function PaymentIcons() {
  return (
    <div className="flex items-center justify-center gap-3" aria-label="Accepted payment methods">
      <VisaIcon />
      <MastercardIcon />
      <AmexIcon />
      <KlarnaIcon />
      <SatispayIcon />
      <PaypalIcon />
    </div>
  );
}

function VisaIcon() {
  return (
    <svg viewBox="0 0 48 32" className="h-6 w-auto" role="img" aria-label="Visa">
      <rect width="48" height="32" rx="4" fill="#1A1F71" />
      <text
        x="24"
        y="21"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontSize="13"
        fontStyle="italic"
        fontWeight="bold"
        fill="#ffffff"
      >
        VISA
      </text>
    </svg>
  );
}

function MastercardIcon() {
  return (
    <svg viewBox="0 0 48 32" className="h-6 w-auto" role="img" aria-label="Mastercard">
      <rect width="48" height="32" rx="4" fill="#f4f4f4" />
      <circle cx="19" cy="16" r="9" fill="#EB001B" />
      <circle cx="29" cy="16" r="9" fill="#F79E1B" />
      <path
        d="M24 9.5a9 9 0 0 1 0 13 9 9 0 0 1 0-13Z"
        fill="#FF5F00"
      />
    </svg>
  );
}

function AmexIcon() {
  return (
    <svg viewBox="0 0 48 32" className="h-6 w-auto" role="img" aria-label="American Express">
      <rect width="48" height="32" rx="4" fill="#2E77BC" />
      <text
        x="24"
        y="20"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontSize="9"
        fontWeight="bold"
        fill="#ffffff"
      >
        AMEX
      </text>
    </svg>
  );
}

function KlarnaIcon() {
  return (
    <svg viewBox="0 0 48 32" className="h-6 w-auto" role="img" aria-label="Klarna">
      <rect width="48" height="32" rx="4" fill="#FFB3C7" />
      <text
        x="24"
        y="20"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontSize="10"
        fontWeight="bold"
        fill="#0B051D"
      >
        Klarna
      </text>
    </svg>
  );
}

function SatispayIcon() {
  return (
    <svg viewBox="0 0 48 32" className="h-6 w-auto" role="img" aria-label="Satispay">
      <rect width="48" height="32" rx="4" fill="#DA291C" />
      <text
        x="24"
        y="20"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontSize="8.5"
        fontWeight="bold"
        fill="#ffffff"
      >
        Satispay
      </text>
    </svg>
  );
}

function PaypalIcon() {
  return (
    <svg viewBox="0 0 48 32" className="h-6 w-auto" role="img" aria-label="PayPal">
      <rect width="48" height="32" rx="4" fill="#003087" />
      <text
        x="24"
        y="20"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontSize="9"
        fontStyle="italic"
        fontWeight="bold"
        fill="#ffffff"
      >
        PayPal
      </text>
    </svg>
  );
}
