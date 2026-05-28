WITH gmail AS (
  SELECT id, subject, from_domain, snippet, body_text, received_at, labels
  FROM life_files.gmail_messages
),
deadlines AS (
  SELECT id, title, due_at, amount_at_risk, currency, category
  FROM life_files.manual_deadlines
),
transactions AS (
  SELECT id, posted_at, merchant, amount, currency, category, raw_description
  FROM life_files.transactions
),
documents AS (
  SELECT id, name, type, status, tags, updated_at
  FROM life_files.documents
),
calendar_events AS (
  SELECT id, title, description, start_time, end_time
  FROM life_files.calendar_events
),
duplicate_charges AS (
  SELECT
    'duplicate-adobe' AS id,
    'Review possible duplicate Adobe charge' AS title,
    'duplicate_charge' AS category,
    CAST(NULL AS VARCHAR) AS due_at,
    SUM(amount) AS amount_at_risk,
    MAX(currency) AS currency,
    'Two matching Adobe transactions appeared within 48 hours, with a receipt email as supporting context.' AS reason,
    'high' AS severity,
    92 AS confidence,
    93 AS score,
    'files,gmail,coral' AS source_badges
  FROM transactions
  WHERE LOWER(merchant) LIKE '%adobe%'
  HAVING COUNT(*) >= 2
),
deadline_risks AS (
  SELECT
    d.id,
    d.title,
    d.category,
    d.due_at,
    d.amount_at_risk,
    d.currency,
    CASE
      WHEN d.category = 'refund' THEN 'Refund or return window is closing soon; Gmail receipt and transaction evidence should be reviewed.'
      WHEN d.category = 'cancellation' THEN 'Free cancellation deadline is approaching; missing it may lock in a fee.'
      WHEN d.category = 'renewal' THEN 'Renewal deadline is approaching; decide whether this service still deserves spend.'
      WHEN d.category = 'document' THEN 'Appointment depends on documents; missing required files can waste the slot.'
      WHEN d.category = 'kyc' THEN 'KYC deadline may restrict account access if ignored.'
      ELSE 'Deadline detected across seeded life-admin sources.'
    END AS reason,
    CASE
      WHEN d.due_at <= '2026-05-29T23:59:59Z' THEN 'critical'
      WHEN d.due_at <= '2026-05-31T23:59:59Z' THEN 'high'
      ELSE 'medium'
    END AS severity,
    CASE
      WHEN d.category IN ('refund', 'cancellation', 'renewal') THEN 88
      ELSE 82
    END AS confidence,
    CASE
      WHEN d.due_at <= '2026-05-29T23:59:59Z' THEN 95
      WHEN d.amount_at_risk >= 100 THEN 91
      ELSE 84
    END AS score,
    'gmail,calendar,files,coral' AS source_badges
  FROM deadlines d
)
SELECT *
FROM duplicate_charges
UNION ALL
SELECT *
FROM deadline_risks
ORDER BY score DESC, due_at ASC;
