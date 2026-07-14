import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Row,
  Column,
  Text,
  Heading,
  Hr,
  Link,
} from "react-email";

const colors = {
  background: "#FAF8F4",
  foreground: "#222222",
  accent: "#B48A63",
  muted: "#666666",
  line: "#E8E2DB",
};

function formatPrice(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export interface OrderConfirmationEmailProps {
  orderId: string;
  items: { name: string; quantity: number; unitPriceCents: number }[];
  totalCents: number;
  currency: string;
  orderUrl?: string;
}

export default function OrderConfirmationEmail({
  orderId,
  items,
  totalCents,
  currency,
  orderUrl,
}: OrderConfirmationEmailProps) {
  const shortId = orderId.slice(0, 8);

  return (
    <Html>
      <Head />
      <Preview>Your order #{shortId} is confirmed</Preview>
      <Body
        style={{
          backgroundColor: colors.background,
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          margin: 0,
          padding: "40px 0",
        }}
      >
        <Container style={{ maxWidth: "480px", margin: "0 auto", padding: "0 24px" }}>
          <Text
            style={{
              fontSize: "12px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: colors.muted,
              margin: "0 0 8px",
            }}
          >
            Order confirmed
          </Text>
          <Heading
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: "26px",
              color: colors.foreground,
              margin: "0 0 20px",
              fontWeight: "normal",
            }}
          >
            Thank you for your order
          </Heading>
          <Text style={{ fontSize: "14px", color: colors.muted, margin: "0 0 8px" }}>
            Order #{shortId} — we&apos;ll email you again once it ships.
          </Text>

          <Hr style={{ borderColor: colors.line, margin: "24px 0" }} />

          {items.map((item, i) => (
            <Row key={i} style={{ marginBottom: "10px" }}>
              <Column>
                <Text style={{ fontSize: "14px", color: colors.foreground, margin: 0 }}>
                  {item.name} × {item.quantity}
                </Text>
              </Column>
              <Column style={{ textAlign: "right" }}>
                <Text style={{ fontSize: "14px", color: colors.foreground, margin: 0 }}>
                  {formatPrice(item.unitPriceCents * item.quantity, currency)}
                </Text>
              </Column>
            </Row>
          ))}

          <Hr style={{ borderColor: colors.line, margin: "24px 0" }} />

          <Row>
            <Column>
              <Text style={{ fontSize: "14px", color: colors.muted, margin: 0 }}>
                Total
              </Text>
            </Column>
            <Column style={{ textAlign: "right" }}>
              <Text
                style={{
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontSize: "20px",
                  color: colors.foreground,
                  margin: 0,
                }}
              >
                {formatPrice(totalCents, currency)}
              </Text>
            </Column>
          </Row>

          {orderUrl && (
            <Section style={{ marginTop: "32px" }}>
              <Link href={orderUrl} style={{ fontSize: "13px", color: colors.accent }}>
                View your order
              </Link>
            </Section>
          )}
        </Container>
      </Body>
    </Html>
  );
}
