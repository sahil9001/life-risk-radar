-- "Which missing document is blocking the most deadlines?" (single point of failure)
-- Cross-source JOIN: documents x manual_deadlines.
-- Finds documents marked 'missing' and counts how many distinct deadlines each
-- one blocks, matching the document's tags to related deadlines. One missing
-- file blocking several deadlines is an insight only a join can surface.
SELECT
  doc.name AS missing_document,
  COUNT(DISTINCT dl.id) AS deadlines_blocked,
  STRING_AGG(DISTINCT dl.title, ' | ') AS blocked_items,
  MIN(dl.due_at) AS earliest_due
FROM life_files.documents doc
JOIN life_files.manual_deadlines dl
  ON (doc.tags LIKE '%passport%' AND LOWER(dl.title) LIKE '%passport%')
  OR (doc.tags LIKE '%kyc%'  AND (LOWER(dl.title) LIKE '%kyc%' OR dl.category = 'kyc'))
  OR (doc.tags LIKE '%bank%' AND LOWER(dl.title) LIKE '%bank%')
WHERE doc.status = 'missing'
GROUP BY doc.name
ORDER BY deadlines_blocked DESC;
