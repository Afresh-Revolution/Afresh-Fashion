-- Update membership footnote with cancellation policy
UPDATE membership_section
SET footnote = 'Free to join • Paid members may cancel anytime by replying to our emails • All membership fees are non-refundable'
WHERE footnote = 'Free to join • No spam • Unsubscribe anytime';
