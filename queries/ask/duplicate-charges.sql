-- "Am I being double-charged anywhere?"
-- Cross-source JOIN: transactions x gmail_messages.
-- Groups card transactions by merchant, flags any merchant charged 2+ times,
-- and joins the matching receipt email so the duplicate has supporting context.
SELECT
  t.merchant,
  COUNT(*)        AS charge_count,
  SUM(t.amount)   AS total_amount,
  MAX(t.currency) AS currency,
  MAX(g.subject)  AS receipt_evidence
FROM life_files.transactions t
LEFT JOIN life_files.gmail_messages g
  ON LOWER(g.subject) LIKE '%' || LOWER(t.merchant) || '%'
  OR LOWER(g.body_text) LIKE '%' || LOWER(t.merchant) || '%'
GROUP BY t.merchant
HAVING COUNT(*) >= 2
ORDER BY total_amount DESC;
