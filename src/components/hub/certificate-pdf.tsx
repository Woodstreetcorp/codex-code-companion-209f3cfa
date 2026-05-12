import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";

// approvU brand colors
const PRIMARY = "#005467";
const SECONDARY = "#00A3B6";
const SECONDARY_SOFT = "#BFE4EA";
const SECONDARY_BG = "#E6F4F6";
const TEXT = "#0F172A";
const MUTED = "#64748B";
const BORDER = "#E2E8F0";

const styles = StyleSheet.create({
  page: {
    paddingTop: 0,
    paddingBottom: 0,
    paddingHorizontal: 0,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: TEXT,
    backgroundColor: "#FFFFFF",
  },
  // Header band
  header: {
    backgroundColor: PRIMARY,
    color: "#FFFFFF",
    paddingVertical: 28,
    paddingHorizontal: 36,
    alignItems: "center",
  },
  headerBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    fontSize: 22,
    color: "#FFFFFF",
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    lineHeight: 1.2,
  },
  brand: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  brandSub: {
    fontSize: 11,
    color: "rgba(255,255,255,0.85)",
    marginTop: 4,
  },

  body: { paddingTop: 20, paddingHorizontal: 36, paddingBottom: 24 },

  pillWrap: { alignItems: "center", marginBottom: 14 },
  pill: {
    borderWidth: 1,
    borderColor: SECONDARY_SOFT,
    backgroundColor: SECONDARY_BG,
    color: SECONDARY,
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
  },

  certifiesLabel: {
    textAlign: "center",
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: TEXT,
    marginBottom: 6,
  },
  applicantName: {
    textAlign: "center",
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: SECONDARY,
    marginTop: 2,
    letterSpacing: -0.4,
  },
  underline: {
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    marginHorizontal: 60,
    marginTop: 8,
    marginBottom: 4,
  },
  applicantHint: {
    textAlign: "center",
    fontSize: 8,
    color: MUTED,
    fontStyle: "italic",
    marginBottom: 14,
  },
  intro: {
    textAlign: "center",
    fontSize: 10,
    color: MUTED,
    marginBottom: 14,
  },

  // Big amount card
  amountCard: {
    backgroundColor: SECONDARY_BG,
    borderWidth: 1,
    borderColor: SECONDARY_SOFT,
    borderRadius: 10,
    paddingVertical: 22,
    paddingHorizontal: 18,
    alignItems: "center",
    marginBottom: 18,
  },
  amount: {
    fontSize: 38,
    fontFamily: "Helvetica-Bold",
    color: PRIMARY,
    letterSpacing: -1,
  },
  amountLabel: {
    marginTop: 4,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.2,
    color: MUTED,
  },

  // Two-column meta cards
  metaRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  metaCol: { flex: 1, gap: 10 },
  metaCardLight: {
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
    padding: 12,
  },
  metaCardTeal: {
    backgroundColor: SECONDARY_SOFT,
    borderRadius: 8,
    padding: 12,
  },
  metaLabel: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.2,
    color: MUTED,
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: TEXT,
  },
  metaSub: { fontSize: 8, color: MUTED, marginTop: 2 },

  divider: { borderBottomWidth: 1, borderBottomColor: BORDER, marginVertical: 14 },

  // Provides box
  providesBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 14,
  },
  providesTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: TEXT,
    marginBottom: 8,
  },
  benefitsGrid: { flexDirection: "row", flexWrap: "wrap" },
  benefitItem: { width: "50%", paddingVertical: 4, paddingRight: 8, flexDirection: "row" },
  bullet: {
    width: 10,
    color: SECONDARY,
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    marginRight: 4,
  },
  benefitLabel: { fontSize: 9, fontFamily: "Helvetica-Bold", color: TEXT },
  benefitDesc: { fontSize: 8, color: MUTED, marginTop: 1 },

  // Important info
  infoTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: TEXT,
    marginBottom: 6,
  },
  infoItem: { flexDirection: "row", marginBottom: 3 },
  infoBullet: { width: 8, color: MUTED, fontSize: 9 },
  infoText: { flex: 1, fontSize: 8, color: MUTED, lineHeight: 1.45 },

  // Signatures
  sigRow: { flexDirection: "row", gap: 24, marginTop: 16 },
  sigCol: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 6,
  },
  sigLabel: { fontSize: 9, fontFamily: "Helvetica-Bold", color: TEXT },
  sigValue: { fontSize: 8, color: MUTED, marginTop: 3 },

  // Footer band
  footer: {
    marginTop: "auto",
    backgroundColor: PRIMARY,
    color: "#FFFFFF",
    paddingVertical: 10,
    paddingHorizontal: 36,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 8, color: "#FFFFFF" },
  footerStrong: { fontSize: 8, color: "#FFFFFF", fontFamily: "Helvetica-Bold" },
});

export type CertificateData = {
  applicantName: string;
  amount: string;
  rateRange: string;
  monthlyEstimate: string;
  certificateNumber: string;
  issueDate: string;
  validUntil: string;
  lendersCount: number;
  productsCount: number;
};

const PROVIDES = [
  { label: "Zero Credit Impact", desc: "No hard credit inquiry performed" },
  { label: "Multi-Lender Access", desc: "Qualified across 25+ lenders" },
  { label: "Buyer Confidence", desc: "Show sellers you're ready to purchase" },
  { label: "Fast-Track Approval", desc: "Convert to pre-approval in 24 hours" },
];

function CertificateDocument({ data }: { data: CertificateData }) {
  return (
    <Document
      title={`approvU Pre-Qualification Certificate ${data.certificateNumber}`}
      author="approvU Mortgage Platform"
    >
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerBadge}>
            <Text>★</Text>
          </View>
          <Text style={styles.brand}>approvU</Text>
          <Text style={styles.brandSub}>Pre-Qualification Certificate</Text>
        </View>

        {/* Body */}
        <View style={styles.body}>
          <View style={styles.pillWrap}>
            <Text style={styles.pill}>OFFICIAL PRE-QUALIFICATION</Text>
          </View>

          <Text style={styles.certifiesLabel}>This certifies that</Text>
          <Text style={styles.applicantName}>{data.applicantName}</Text>
          <View style={styles.underline} />
          <Text style={styles.applicantHint}>Applicant Name(s)</Text>

          <Text style={styles.intro}>has been pre-qualified for a mortgage amount up to</Text>

          <View style={styles.amountCard}>
            <Text style={styles.amount}>{data.amount}</Text>
            <Text style={styles.amountLabel}>PRE-QUALIFIED MORTGAGE AMOUNT</Text>
          </View>

          {/* Meta cards */}
          <View style={styles.metaRow}>
            <View style={styles.metaCol}>
              <View style={styles.metaCardLight}>
                <Text style={styles.metaLabel}>ESTIMATED RATE RANGE</Text>
                <Text style={styles.metaValue}>{data.rateRange}</Text>
                <Text style={styles.metaSub}>
                  Est. Monthly Payment: {data.monthlyEstimate}
                </Text>
              </View>
              <View style={styles.metaCardLight}>
                <Text style={styles.metaLabel}>MULTI-LENDER COVERAGE</Text>
                <Text style={[styles.metaValue, { color: SECONDARY }]}>
                  {data.lendersCount} Lenders
                </Text>
                <Text style={styles.metaSub}>
                  {data.productsCount.toLocaleString()} Products Analyzed
                </Text>
              </View>
            </View>
            <View style={styles.metaCol}>
              <View style={styles.metaCardTeal}>
                <Text style={styles.metaLabel}>CERTIFICATE NUMBER</Text>
                <Text style={[styles.metaValue, { fontFamily: "Courier-Bold" }]}>
                  {data.certificateNumber}
                </Text>
              </View>
              <View style={styles.metaCardTeal}>
                <Text style={styles.metaLabel}>ISSUE DATE</Text>
                <Text style={styles.metaValue}>{data.issueDate}</Text>
              </View>
              <View style={styles.metaCardTeal}>
                <Text style={styles.metaLabel}>VALID UNTIL</Text>
                <Text style={styles.metaValue}>{data.validUntil}</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          {/* What this provides */}
          <View style={styles.providesBox}>
            <Text style={styles.providesTitle}>What This Certificate Provides</Text>
            <View style={styles.benefitsGrid}>
              {PROVIDES.map((p) => (
                <View key={p.label} style={styles.benefitItem}>
                  <Text style={styles.bullet}>✓</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.benefitLabel}>{p.label}</Text>
                    <Text style={styles.benefitDesc}>{p.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.divider} />

          {/* Important Info */}
          <Text style={styles.infoTitle}>Important Information</Text>
          {[
            "This pre-qualification is not a commitment to lend and does not guarantee loan approval.",
            "Interest rates are estimates based on current market conditions and are subject to change.",
            "Official pre-approval requires income verification, credit check, and final lender approval.",
            "This certificate is valid for 90 days from the issue date shown above.",
            `Rates shown reflect data from ${data.productsCount.toLocaleString()} products across ${data.lendersCount} lending partners as of ${data.issueDate}.`,
          ].map((line) => (
            <View key={line} style={styles.infoItem}>
              <Text style={styles.infoBullet}>•</Text>
              <Text style={styles.infoText}>{line}</Text>
            </View>
          ))}

          {/* Signatures */}
          <View style={styles.sigRow}>
            <View style={styles.sigCol}>
              <Text style={styles.sigLabel}>Digital Signature</Text>
              <Text style={styles.sigValue}>approvU Mortgage Platform</Text>
              <Text style={styles.sigValue}>Authorized Digital Certificate</Text>
            </View>
            <View style={styles.sigCol}>
              <Text style={styles.sigLabel}>Issue Date</Text>
              <Text style={styles.sigValue}>{data.issueDate}</Text>
            </View>
          </View>
        </View>

        {/* Footer band */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Secure Certificate ID: {data.certificateNumber}
          </Text>
          <Text style={styles.footerStrong}>Issued by approvU Mortgage Platform</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function downloadCertificatePdf(data: CertificateData) {
  const blob = await pdf(<CertificateDocument data={data} />).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `approvU-Pre-Qualification-${data.certificateNumber}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}