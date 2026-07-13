import React from 'react';
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Link,
} from '@react-email/components';

export const PasswordResetEmail = ({ resetLink, storeName = 'Aha Konaseema' }) => {
  return (
    <Html>
      <Head />
      <Preview>Reset your secure account password - Aha Konaseema</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerSection}>
            <Heading style={logoText}>{storeName.toUpperCase()}</Heading>
          </Section>
          <Section style={contentSection}>
            <Heading as="h2" style={welcomeHeader}>Password Reset Request</Heading>
            <Text style={bodyText}>
              We received a request to reset your password. Click the secure button below to set a new password:
            </Text>
            <Section style={actionBox}>
              <Link href={resetLink} style={resetButton}>
                Reset Password
              </Link>
            </Section>
            <Text style={infoText}>
              If you didn't initiate this request, you can safely ignore this email. Your password will remain unchanged.
            </Text>
          </Section>
          <Section style={footerSection}>
            <Text style={footerText}>
              &copy; {new Date().getFullYear()} {storeName}. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '0',
  maxWidth: '500px',
  borderRadius: '8px',
  border: '1px solid #e6ebf1',
  overflow: 'hidden',
};

const headerSection = {
  backgroundColor: '#f1f5f9',
  padding: '24px 30px',
  borderBottom: '1px solid #e2e8f0',
  textAlign: 'center',
};

const logoText = {
  color: '#BA242A',
  fontSize: '24px',
  fontWeight: '900',
  letterSpacing: '0.5px',
  margin: '0',
  textTransform: 'uppercase',
};

const contentSection = {
  padding: '30px',
  textAlign: 'center',
};

const welcomeHeader = {
  fontSize: '18px',
  margin: '0 0 16px 0',
  color: '#0f172a',
  fontWeight: '700',
};

const bodyText = {
  fontSize: '14px',
  lineHeight: '1.5',
  color: '#334155',
  margin: '0 0 24px 0',
};

const actionBox = {
  margin: '0 auto 24px auto',
  textAlign: 'center',
};

const resetButton = {
  backgroundColor: '#BA242A',
  color: '#ffffff',
  padding: '12px 24px',
  textDecoration: 'none',
  borderRadius: '6px',
  fontWeight: '700',
  display: 'inline-block',
  fontSize: '14px',
};

const infoText = {
  fontSize: '12px',
  lineHeight: '1.5',
  color: '#64748b',
  margin: '0',
};

const footerSection = {
  backgroundColor: '#f8fafc',
  padding: '20px 30px',
  textAlign: 'center',
  borderTop: '1px solid #e2e8f0',
};

const footerText = {
  margin: '0',
  fontSize: '11px',
  color: '#94a3b8',
};
