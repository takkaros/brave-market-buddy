-- Add unique constraint to economic_indicators table for indicator_code
-- This allows proper upsert operations and prevents duplicates

ALTER TABLE economic_indicators 
ADD CONSTRAINT economic_indicators_indicator_code_key 
UNIQUE (indicator_code);