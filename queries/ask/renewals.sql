-- "What subscriptions or trials are about to renew?"
-- Cross-source JOIN: manual_deadlines (renewals) x gmail_messages.
-- Surfaces renewal/trial deadlines and attaches the billing email that warns
-- about the charge, so each upcoming renewal shows where the number came from.
WITH topic(deadline_id, kw) AS (
  VALUES
    ('deadline_notion', 'notion'),
    ('deadline_domain', 'sahil.dev')
)
SELECT
  dl.title,
  dl.due_at,
  dl.amount_at_risk,
  dl.currency,
  MAX(g.subject) AS billing_email
FROM life_files.manual_deadlines dl
JOIN topic ON topic.deadline_id = dl.id
LEFT JOIN life_files.gmail_messages g
  ON LOWER(g.subject) LIKE '%' || topic.kw || '%'
  OR LOWER(g.body_text) LIKE '%' || topic.kw || '%'
WHERE dl.category = 'renewal'
GROUP BY dl.title, dl.due_at, dl.amount_at_risk, dl.currency
ORDER BY dl.due_at ASC;
