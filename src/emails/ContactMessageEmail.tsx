import { Html, Head, Preview, Body, Container, Text, Heading, Hr } from "react-email";

const colors = {
  background: "#FAFAF8",
  foreground: "#1C1E1B",
  muted: "#6B6F68",
  line: "#DEDCD2",
};

export interface ContactMessageEmailProps {
  name: string;
  email: string;
  message: string;
}

export default function ContactMessageEmail({
  name,
  email,
  message,
}: ContactMessageEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>New contact form message from {name}</Preview>
      <Body
        style={{
          backgroundColor: colors.background,
          fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
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
            Contact form
          </Text>
          <Heading
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: "22px",
              color: colors.foreground,
              margin: "0 0 20px",
              fontWeight: "normal",
            }}
          >
            New message from {name}
          </Heading>

          <Text style={{ fontSize: "14px", color: colors.muted, margin: "0 0 4px" }}>
            From
          </Text>
          <Text style={{ fontSize: "14px", color: colors.foreground, margin: "0 0 16px" }}>
            {name} &lt;{email}&gt;
          </Text>

          <Hr style={{ borderColor: colors.line, margin: "16px 0" }} />

          <Text style={{ fontSize: "14px", color: colors.muted, margin: "0 0 4px" }}>
            Message
          </Text>
          <Text
            style={{
              fontSize: "14px",
              color: colors.foreground,
              margin: 0,
              whiteSpace: "pre-wrap",
            }}
          >
            {message}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
