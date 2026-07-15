export function PaymentIcons() {
  return (
    <div className="flex items-center justify-center gap-3" aria-label="Accepted payment methods">
      <VisaIcon />
      <MastercardIcon />
      <AmexIcon />
      <SepaIcon />
      <IdealIcon />
      <BancontactIcon />
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

function SepaIcon() {
  return (
    <svg viewBox="0 0 48 32" className="h-6 w-auto" role="img" aria-label="SEPA Direct Debit">
      <rect width="48" height="32" rx="4" fill="#f4f4f4" />
      <text
        x="24"
        y="20"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontSize="10"
        fontWeight="bold"
        fill="#003399"
      >
        SEPA
      </text>
    </svg>
  );
}

function IdealIcon() {
  return (
    <svg viewBox="0 0 48 32" className="h-6 w-auto" role="img" aria-label="iDEAL">
      <rect width="48" height="32" rx="4" fill="#cc0066" />
      <text
        x="24"
        y="20"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontSize="10"
        fontWeight="bold"
        fill="#ffffff"
      >
        iDEAL
      </text>
    </svg>
  );
}

function BancontactIcon() {
  return (
    <svg viewBox="0 0 48 32" className="h-6 w-auto" role="img" aria-label="Bancontact">
      <rect width="48" height="32" rx="4" fill="#f4f4f4" />
      <circle cx="19" cy="16" r="8" fill="#005498" />
      <circle cx="29" cy="16" r="8" fill="#FFD800" />
    </svg>
  );
}
