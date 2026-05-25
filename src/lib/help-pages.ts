/** Maps footer Help column labels to help_pages.slug */
export const FOOTER_HELP_SLUGS: Record<string, string> = {
  "Shipping & Returns": "shipping-returns",
  "Size Guide": "size-guide",
  "Contact Us": "contact-us",
  FAQ: "faq",
  "Privacy Policy": "privacy-policy",
};

export function footerLabelToHelpSlug(label: string): string | null {
  return FOOTER_HELP_SLUGS[label] ?? null;
}

export function isHelpFooterGroup(title: string): boolean {
  return title.toLowerCase() === "help";
}
