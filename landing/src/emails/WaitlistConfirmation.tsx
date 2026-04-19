import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface WaitlistConfirmationProps {
  email?: string
  siteUrl?: string
}

export default function WaitlistConfirmation({
  email,
  siteUrl = 'https://patriot-ops.com',
}: WaitlistConfirmationProps) {
  return (
    <Html>
      <Head />
      <Preview>You&apos;re on the list — we&apos;ll email you the moment early access opens</Preview>
      <Body style={main}>
        <Container style={container}>

          <Section style={headerSection}>
            <Img
              src={`${siteUrl}/logo.png`}
              width="80"
              height="80"
              alt="Patriot Ops Center"
              style={logo}
            />
          </Section>

          <Section style={contentSection}>
            <Heading style={heading}>You&apos;re on the list!</Heading>

            <Text style={paragraph}>
              Thank you for joining the Patriot Ops Center waitlist. We&apos;re building an AI-powered
              veteran platform covering VA benefits, claims support, and civilian career transition —
              and you&apos;re now on the list to hear first when we launch.
            </Text>

            <Text style={paragraphBold}>
              Here&apos;s what you can expect from us.
            </Text>

            <Text style={paragraph}>
              We&apos;ll email you as we hit real milestones — private early access, public launch, and
              new capabilities shipped. No spam, no filler, just updates from the front lines of
              development.
            </Text>

            <Text style={paragraph}>
              What&apos;s coming:
            </Text>

            <Section style={featureList}>
              <Text style={featureItem}>
                <span style={bullet}>★</span> Benefits Navigator &amp; Claims Copilot — always free
              </Text>
              <Text style={featureItem}>
                <span style={bullet}>★</span> 365-day interactive transition timeline
              </Text>
              <Text style={featureItem}>
                <span style={bullet}>★</span> DD214 parsing, MOS Translator, AI Resume Generator
              </Text>
              <Text style={featureItem}>
                <span style={bullet}>★</span> Interview Prep Coach (STAR method) &amp; Salary Intelligence
              </Text>
              <Text style={featureItem}>
                <span style={bullet}>★</span> Clearance Marketplace (TS/SCI and Secret-cleared roles)
              </Text>
              <Text style={featureItem}>
                <span style={bullet}>★</span> VSO, TAP, and employer partner portals
              </Text>
            </Section>

            <Section style={highlightBox}>
              <Text style={highlightText}>
                Your service matters. Your skills are valuable. We&apos;re here to help you prove it.
              </Text>
            </Section>
          </Section>

          <Section style={signatureSection}>
            <Text style={signature}>
              — Bradley Baker
              <br />
              <span style={signatureTitle}>U.S. Army Veteran &amp; Founder</span>
              <br />
              <span style={signatureCompany}>Patriot Ops Center</span>
            </Text>
          </Section>

          <Hr style={divider} />

          <Section style={footerSection}>
            <Text style={motto}>
              &quot;This We&apos;ll Defend&quot; — Your mission does not end with service, it evolves.
            </Text>

            <Text style={footerLinks}>
              <Link href={siteUrl} style={link}>Website</Link>
              {' · '}
              <Link href={`${siteUrl}/privacy`} style={link}>Privacy Policy</Link>
            </Text>

            <Text style={footerNote}>
              You&apos;re receiving this email because {email ?? 'you'} signed up for the Patriot Ops
              Center waitlist.
            </Text>

            <Text style={footerNote}>
              <Link
                href={`${siteUrl}/api/unsubscribe?email=${encodeURIComponent(email ?? '')}`}
                style={unsubscribeLink}
              >
                Unsubscribe
              </Link>
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  )
}

// ── Palette: matches src/app/globals.css theme ───────────────────────────
const navy950 = '#0a1929'
const navy900 = '#102a43'
const navy800 = '#243b53'
const navy500 = '#627d98'
const navy400 = '#829ab1'
const navy300 = '#9fb3c8'
const navy100 = '#d9e2ec'
const gold500 = '#f59e0b'
const gold400 = '#fbbf24'
const gold300 = '#fcd34d'

const main = {
  backgroundColor: navy950,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '600px',
}

const headerSection = {
  textAlign: 'center' as const,
  marginBottom: '32px',
}

const logo = {
  margin: '0 auto',
}

const contentSection = {
  backgroundColor: navy900,
  borderRadius: '12px',
  padding: '32px',
  border: `1px solid ${navy800}`,
}

const heading = {
  color: gold500,
  fontSize: '28px',
  fontWeight: '700',
  textAlign: 'center' as const,
  margin: '0 0 24px 0',
}

const paragraph = {
  color: navy100,
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 16px 0',
}

const paragraphBold = {
  ...paragraph,
  color: gold400,
  fontWeight: '600',
  marginTop: '20px',
}

const featureList = {
  backgroundColor: navy950,
  borderRadius: '8px',
  padding: '20px',
  margin: '16px 0',
}

const featureItem = {
  color: navy100,
  fontSize: '15px',
  lineHeight: '1.8',
  margin: '0 0 8px 0',
}

const bullet = {
  color: gold400,
  marginRight: '8px',
}

const highlightBox = {
  marginTop: '24px',
  padding: '20px',
  backgroundColor: 'rgba(245,158,11,0.08)',
  borderRadius: '8px',
  border: `1px solid rgba(245,158,11,0.25)`,
}

const highlightText = {
  color: gold300,
  fontSize: '17px',
  fontWeight: '600',
  textAlign: 'center' as const,
  margin: 0,
}

const signatureSection = {
  marginTop: '32px',
}

const signature = {
  color: navy300,
  fontSize: '14px',
  lineHeight: '1.6',
}

const signatureTitle = {
  color: navy400,
}

const signatureCompany = {
  color: gold400,
  fontWeight: '600',
}

const divider = {
  borderColor: navy800,
  margin: '32px 0',
}

const footerSection = {
  textAlign: 'center' as const,
}

const motto = {
  color: navy500,
  fontSize: '13px',
  fontStyle: 'italic',
  margin: '0 0 16px 0',
}

const footerLinks = {
  color: navy500,
  fontSize: '12px',
  margin: '0 0 16px 0',
}

const link = {
  color: gold400,
  textDecoration: 'none',
}

const unsubscribeLink = {
  color: navy500,
  textDecoration: 'underline',
}

const footerNote = {
  color: navy500,
  fontSize: '11px',
  margin: '0 0 8px 0',
}
