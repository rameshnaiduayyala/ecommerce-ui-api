import React from 'react';
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Row,
  Column,
  Heading,
  Text,
  Link,
} from '@react-email/components';

export const OrderEmail = ({ details, isAdmin = false, statusBanner = null }) => {
  const storeName = details.storeName || 'Aha Konaseema';
  const invoiceLink = details.origin ? `${details.origin}/print/invoice/${details.orderId}` : '#';
  const slipLink = details.origin ? `${details.origin}/print/packing-slip/${details.orderId}` : '#';

  return (
    <Html>
      <Head />
      <Preview>
        {isAdmin 
          ? `🚨 New Customer Order Received! #${details.orderId.split('-')[0].toUpperCase()} - ₹${details.grandTotal}` 
          : `Order Confirmation #${details.orderId.split('-')[0].toUpperCase()} - Aha Konaseema`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={headerSection}>
            <Heading style={logoText}>{storeName.toUpperCase()}</Heading>
            <Text style={subheaderText}>
              {isAdmin ? '🚨 New Customer Order Received!' : 'Thank you for shopping with us!'}
            </Text>
          </Section>

          {/* Optional Status Update Banner */}
          {statusBanner && (
            <Section style={statusBannerSection(statusBanner.status)}>
              <Heading as="h3" style={statusBannerHeader(statusBanner.status)}>
                Update: Your order is now {statusBanner.status.toUpperCase()}
              </Heading>
              {statusBanner.adminNote && (
                <Text style={statusBannerNote}>
                  <strong>Note from Team:</strong> {statusBanner.adminNote}
                </Text>
              )}
            </Section>
          )}

          <Section style={contentSection}>
            <Heading as="h2" style={welcomeHeader}>
              {isAdmin ? `Order Details for ${details.customerName}` : `Hello ${details.customerName},`}
            </Heading>
            <Text style={bodyText}>
              {isAdmin 
                ? 'A new order has been placed on the store. Please fulfill it as soon as possible.' 
                : 'Your order has been successfully placed and is now being processed. Below are the details of your purchase.'}
            </Text>

            {/* Info Cards */}
            <Section style={infoCardsContainer}>
              <Row>
                <Column style={infoCardColumnLeft}>
                  <Section style={infoCard}>
                    <Text style={infoCardTitle}>Delivery Address</Text>
                    <Text style={infoCardName}>{details.customerName}</Text>
                    <Text style={infoCardDetailsText}>{details.shippingAddress}</Text>
                    {details.phone && <Text style={infoCardDetailsText}>📞 {details.phone}</Text>}
                  </Section>
                </Column>
                <Column style={infoCardColumnRight}>
                  <Section style={infoCard}>
                    <Text style={infoCardTitle}>Order Info</Text>
                    <Text style={infoCardDetailsText}><strong>Order ID:</strong> #{details.orderId.split('-')[0].toUpperCase()}</Text>
                    <Text style={infoCardDetailsText}><strong>Order Date:</strong> {new Date(details.date).toLocaleDateString()}</Text>
                    <Text style={infoCardDetailsText}><strong>Payment:</strong> {details.paymentMethod}</Text>
                  </Section>
                </Column>
              </Row>
            </Section>

            {/* Items Summary Table */}
            <Heading as="h3" style={sectionHeader}>Order Summary</Heading>
            <table style={tableStyle}>
              <thead>
                <tr style={tableHeaderRow}>
                  <th style={tableHeaderCellLeft}>Item</th>
                  <th style={tableHeaderCellCenter}>Qty</th>
                  <th style={tableHeaderCellRight}>Price</th>
                </tr>
              </thead>
              <tbody>
                {details.items.map((item, idx) => (
                  <tr key={idx}>
                    <td style={tableBodyCellLeft}>
                      <div style={productContainer}>
                        {item.image_url && (
                          <img src={item.image_url} width="40" height="40" style={productImage} />
                        )}
                        <span style={productName}>{item.name}</span>
                      </div>
                    </td>
                    <td style={tableBodyCellCenter}>{item.quantity}</td>
                    <td style={tableBodyCellRight}>₹{item.discount_price || item.price}</td>
                  </tr>
                ))}
                {/* Breakdown Rows */}
                <tr>
                  <td colSpan={2} style={breakdownLabel}>Subtotal:</td>
                  <td style={breakdownVal}>₹{details.subtotal}</td>
                </tr>
                {details.discount > 0 && (
                  <tr>
                    <td colSpan={2} style={breakdownLabel}>Discount:</td>
                    <td style={discountVal}>-₹{details.discount}</td>
                  </tr>
                )}
                <tr>
                  <td colSpan={2} style={breakdownLabel}>Shipping:</td>
                  <td style={breakdownVal}>{details.shipping === 0 ? 'FREE' : `₹${details.shipping}`}</td>
                </tr>
                <tr>
                  <td colSpan={2} style={totalLabel}>Grand Total:</td>
                  <td style={totalVal}>₹{details.grandTotal}</td>
                </tr>
              </tbody>
            </table>

            {/* Action CTAs */}
            <Section style={actionsSection}>
              <Link href={invoiceLink} style={mainCtaButton}>
                🧾 View & Print Full Invoice
              </Link>
              {isAdmin && (
                <div style={{ marginTop: '15px' }}>
                  <Link href={slipLink} style={secondaryCtaLink}>
                    📦 Admin: Print Packing Slip
                  </Link>
                </div>
              )}
            </Section>
          </Section>

          {/* Footer Section */}
          <Section style={footerSection}>
            <Text style={footerText}>
              This email was sent automatically. Please do not reply directly.
            </Text>
            <Text style={footerCopyright}>
              &copy; {new Date().getFullYear()} {storeName}. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Styles for react-email components
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '0',
  maxWidth: '600px',
  borderRadius: '8px',
  border: '1px solid #e6ebf1',
  overflow: 'hidden',
};

const headerSection = {
  backgroundColor: '#f1f5f9',
  padding: '24px 30px',
  borderBottom: '1px solid #e2e8f0',
};

const logoText = {
  color: '#BA242A',
  fontSize: '24px',
  fontWeight: '900',
  letterSpacing: '0.5px',
  margin: '0',
  textTransform: 'uppercase',
};

const subheaderText = {
  margin: '6px 0 0 0',
  color: '#475569',
  fontSize: '14px',
  fontWeight: '500',
};

const statusBannerSection = (status) => ({
  backgroundColor: status === 'delivered' ? '#dcfce7' : status === 'cancelled' ? '#fee2e2' : '#fef9c3',
  padding: '16px 30px',
  borderBottom: '1px solid #e2e8f0',
});

const statusBannerHeader = (status) => ({
  margin: '0',
  fontSize: '16px',
  color: status === 'delivered' ? '#166534' : status === 'cancelled' ? '#991b1b' : '#854d0e',
});

const statusBannerNote = {
  margin: '6px 0 0 0',
  fontSize: '13px',
  color: '#334155',
};

const contentSection = {
  padding: '30px',
};

const welcomeHeader = {
  fontSize: '18px',
  margin: '0 0 10px 0',
  color: '#0f172a',
  fontWeight: '700',
};

const bodyText = {
  fontSize: '14px',
  lineHeight: '1.5',
  color: '#334155',
  margin: '0 0 24px 0',
};

const infoCardsContainer = {
  margin: '0 0 24px 0',
};

const infoCardColumnLeft = {
  paddingRight: '8px',
};

const infoCardColumnRight = {
  paddingLeft: '8px',
};

const infoCard = {
  backgroundColor: '#f8fafc',
  padding: '16px',
  borderRadius: '6px',
  border: '1px solid #e2e8f0',
  minHeight: '130px',
};

const infoCardTitle = {
  margin: '0 0 8px 0',
  fontSize: '11px',
  textTransform: 'uppercase',
  color: '#64748b',
  fontWeight: '700',
  letterSpacing: '0.5px',
};

const infoCardName = {
  margin: '0 0 4px 0',
  fontSize: '13px',
  fontWeight: '700',
  color: '#0f172a',
};

const infoCardDetailsText = {
  margin: '0 0 4px 0',
  fontSize: '13px',
  lineHeight: '1.4',
  color: '#334155',
};

const sectionHeader = {
  fontSize: '15px',
  color: '#0f172a',
  margin: '24px 0 12px 0',
  paddingBottom: '8px',
  borderBottom: '2px solid #f1f5f9',
  fontWeight: '700',
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  marginBottom: '24px',
  fontSize: '13px',
};

const tableHeaderRow = {
  backgroundColor: '#f8fafc',
};

const tableHeaderCellLeft = {
  padding: '10px 12px',
  textAlign: 'left',
  borderBottom: '1px solid #e2e8f0',
  color: '#475569',
  fontWeight: '700',
};

const tableHeaderCellCenter = {
  padding: '10px 12px',
  textAlign: 'center',
  borderBottom: '1px solid #e2e8f0',
  color: '#475569',
  fontWeight: '700',
};

const tableHeaderCellRight = {
  padding: '10px 12px',
  textAlign: 'right',
  borderBottom: '1px solid #e2e8f0',
  color: '#475569',
  fontWeight: '700',
};

const tableBodyCellLeft = {
  padding: '12px',
  borderBottom: '1px solid #f1f5f9',
  textAlign: 'left',
};

const tableBodyCellCenter = {
  padding: '12px',
  borderBottom: '1px solid #f1f5f9',
  textAlign: 'center',
  fontWeight: '600',
  color: '#0f172a',
};

const tableBodyCellRight = {
  padding: '12px',
  borderBottom: '1px solid #f1f5f9',
  textAlign: 'right',
  fontWeight: '600',
  color: '#0f172a',
};

const productContainer = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
};

const productImage = {
  borderRadius: '4px',
  objectFit: 'cover',
};

const productName = {
  fontWeight: '600',
  color: '#0f172a',
};

const breakdownLabel = {
  padding: '8px 12px',
  textAlign: 'right',
  color: '#64748b',
};

const breakdownVal = {
  padding: '8px 12px',
  textAlign: 'right',
  fontWeight: '600',
  color: '#0f172a',
};

const discountVal = {
  padding: '8px 12px',
  textAlign: 'right',
  fontWeight: '600',
  color: '#16a34a',
};

const totalLabel = {
  padding: '16px 12px 8px 12px',
  textAlign: 'right',
  fontWeight: '700',
  fontSize: '15px',
  borderTop: '2px solid #e2e8f0',
  color: '#0f172a',
};

const totalVal = {
  padding: '16px 12px 8px 12px',
  textAlign: 'right',
  fontWeight: '800',
  color: '#BA242A',
  fontSize: '16px',
  borderTop: '2px solid #e2e8f0',
};

const actionsSection = {
  textAlign: 'center',
  marginTop: '32px',
};

const mainCtaButton = {
  backgroundColor: '#BA242A',
  color: '#ffffff',
  padding: '12px 24px',
  textDecoration: 'none',
  borderRadius: '6px',
  fontWeight: '700',
  display: 'inline-block',
  fontSize: '14px',
};

const secondaryCtaLink = {
  color: '#BA242A',
  textDecoration: 'underline',
  fontSize: '12px',
  fontWeight: '700',
};

const footerSection = {
  backgroundColor: '#f8fafc',
  padding: '24px 30px',
  textAlign: 'center',
  borderTop: '1px solid #e2e8f0',
};

const footerText = {
  margin: '0 0 6px 0',
  fontSize: '12px',
  color: '#64748b',
  lineHeight: '1.4',
};

const footerCopyright = {
  margin: '0',
  fontSize: '11px',
  color: '#94a3b8',
};
