-- "What is costing me money this week?"
-- Cross-source JOIN: manual_deadlines x gmail_messages x calendar_events.
-- A small topic dimension maps each deadline to the term that links its
-- supporting email and calendar reminder, so every row carries real evidence
-- from three different sources joined inside Coral.
WITH topic(deadline_id, kw) AS (
  VALUES
    ('deadline_notion', 'notion'),
    ('deadline_amazon', 'amazon'),
    ('deadline_booking', 'hotel'),
    ('deadline_passport', 'passport'),
    ('deadline_kyc', 'kyc'),
    ('deadline_domain', 'sahil.dev')
)
SELECT
  dl.title,
  dl.due_at,
  dl.amount_at_risk,
  dl.currency,
  MAX(g.subject) AS email_evidence,
  MAX(c.title)   AS calendar_evidence
FROM life_files.manual_deadlines dl
JOIN topic ON topic.deadline_id = dl.id
LEFT JOIN life_files.gmail_messages g
  ON LOWER(g.subject) LIKE '%' || topic.kw || '%'
  OR LOWER(g.body_text) LIKE '%' || topic.kw || '%'
  OR LOWER(g.from_domain) LIKE '%' || topic.kw || '%'
LEFT JOIN life_files.calendar_events c
  ON LOWER(c.title) LIKE '%' || topic.kw || '%'
  OR LOWER(c.description) LIKE '%' || topic.kw || '%'
WHERE dl.amount_at_risk > 0
GROUP BY dl.title, dl.due_at, dl.amount_at_risk, dl.currency
ORDER BY dl.due_at ASC;
