-- Restrict profile visibility to authenticated users only
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;

CREATE POLICY "Authenticated users can view profiles"
ON profiles FOR SELECT
TO authenticated
USING (true);

-- Add server-side validation constraints for profiles
ALTER TABLE profiles
  ADD CONSTRAINT valid_age CHECK (age >= 5 AND age <= 100);

ALTER TABLE profiles
  ADD CONSTRAINT valid_shirt_number CHECK (shirt_number >= 0 AND shirt_number <= 99);

-- Create phone validation function
CREATE OR REPLACE FUNCTION validate_phone()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow NULL or valid phone format (10-15 digits, optional + prefix)
  IF NEW.phone IS NOT NULL AND NEW.phone !~ '^\+?[0-9]{10,15}$' THEN
    RAISE EXCEPTION 'Invalid phone format. Expected 10-15 digits with optional + prefix';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for phone validation
CREATE TRIGGER validate_phone_trigger
BEFORE INSERT OR UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION validate_phone();