-- Footer help popups (admin-editable)
CREATE TABLE IF NOT EXISTS help_pages (
  slug              TEXT PRIMARY KEY,
  title             TEXT NOT NULL,
  body              TEXT NOT NULL DEFAULT '',
  diagram_url       TEXT,
  diagram_caption   TEXT,
  contact_email     TEXT,
  sort_order        INTEGER NOT NULL DEFAULT 0,
  status            content_status NOT NULL DEFAULT 'published',
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_help_pages_updated_at ON help_pages;
CREATE TRIGGER trg_help_pages_updated_at
  BEFORE UPDATE ON help_pages
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

UPDATE contact_section SET email = 'afreshfashions@gmail.com' WHERE id = 1;

INSERT INTO help_pages (slug, title, body, diagram_url, diagram_caption, contact_email, sort_order) VALUES
(
  'shipping-returns',
  'Shipping & Returns',
  'AFRESH ships worldwide from our fulfilment partners in Lagos and London.

Standard delivery: 5–10 business days (Africa & UK), 10–18 business days (Americas, EU, Asia).

Express delivery: 2–5 business days where available — selected at checkout.

Orders are processed within 1–2 business days. You will receive tracking once your package ships.

Returns & exchanges:
• Items must be unworn, unwashed, and with original tags attached.
• Request a return within 14 days of delivery.
• Sale pieces and limited drops are final sale unless faulty.
• Refunds are issued to the original payment method within 7–10 business days after we receive your return.

For return authorisation, email us with your order number and reason.',
  NULL,
  NULL,
  NULL,
  1
),
(
  'size-guide',
  'Size Guide',
  'AFRESH fits true to size with a relaxed, elevated street silhouette. When between sizes, we recommend sizing up for outerwear and staying true to size for tees and hoodies.

Measure yourself:
• Chest — around the fullest part, under arms.
• Waist — natural waistline.
• Hips — fullest part of seat.
• Length — shoulder seam to hem (tops) or waist to ankle (trousers).

Use the diagram and chart below. Still unsure? Contact us with your height and usual size — we will advise.',
  NULL,
  'Body measurement reference — chest, waist, hip, and length',
  NULL,
  2
),
(
  'contact-us',
  'Contact Us',
  'We respond within 24–48 hours on business days. For order issues, include your order number in the subject line.

Press, collaborations, wholesale, and styling enquiries are welcome — tell us about your project and timeline.',
  NULL,
  NULL,
  'afreshfashions@gmail.com',
  3
),
(
  'faq',
  'FAQ',
  'What is AFRESH?
A global fashion movement born from Africa — apparel, culture, and community in one house.

Do you ship internationally?
Yes. Rates and timelines are shown at checkout.

How do I join VIP?
Use the membership section on the homepage. VIP members get early access to drops and private offers.

How do I pay?
Card via Paystack where available, or manual bank transfer with confirmation by our team.

Can I cancel an order?
Contact us within 2 hours of placing your order. Once fulfilment begins, orders cannot be cancelled.

How do I care for my pieces?
Cold wash inside out, low tumble or line dry. Do not bleach. Steam or low iron on reverse.',
  NULL,
  NULL,
  NULL,
  4
),
(
  'privacy-policy',
  'Privacy Policy',
  'AFRESH respects your privacy. This policy explains how we collect and use information when you use our website, shop, or join VIP.

Information we collect:
• Contact details (name, email, phone) when you order or join VIP.
• Payment references from our payment partners (we do not store full card numbers).
• Usage data such as pages visited and device type, to improve the experience.

How we use your data:
• To fulfil orders and communicate about your purchases.
• To send marketing you have opted into (VIP and newsletters).
• To prevent fraud and comply with legal obligations.

We do not sell your personal data. We may share data with trusted processors (hosting, email, payments) under contract.

Your rights:
You may request access, correction, or deletion of your data by contacting us.

Updates:
We may update this policy; the latest version is always on this page.',
  NULL,
  NULL,
  NULL,
  5
)
ON CONFLICT (slug) DO NOTHING;

SELECT 'Migration 007 complete — help pages & contact email ready' AS status, NOW() AS completed_at;
