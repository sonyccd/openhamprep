-- Seed file for local Supabase development
-- This file is automatically run when you start local Supabase with `supabase start`
-- or when you reset the database with `supabase db reset`

-- Create a test user profile (this user will be created via auth, this is just the profile)
-- Note: You'll need to sign up via the app to create actual auth users

-- Insert sample questions for each license type
INSERT INTO public.questions (id, question, options, correct_answer, subelement, question_group) VALUES
  -- Technician questions
  ('T1A01', 'What is the maximum transmitting power an amateur station may use on 10.140 MHz?',
   '["200 watts PEP output", "1000 watts PEP output", "1500 watts PEP output", "2000 watts PEP output"]'::jsonb,
   0, 'T1', 'T1A'),

  ('T1A02', 'What is the maximum transmitting power an amateur station may use on the 12 meter band?',
   '["50 watts PEP output", "200 watts PEP output", "1500 watts PEP output", "An effective radiated power equivalent to 100 watts from a half-wave dipole"]'::jsonb,
   1, 'T1', 'T1A'),

  ('T1B01', 'What is the ITU?',
   '["An international association of amateur radio societies", "The International Telecommunications Union", "An international treaty that establishes frequency allocations", "The International Amateur Radio Union"]'::jsonb,
   1, 'T1', 'T1B'),

  -- General questions
  ('G1A01', 'On which HF bands does a Technician class operator have phone privileges?',
   '["None", "10 meter band only", "80 meter, 40 meter, 15 meter and 10 meter bands", "30 meter band only"]'::jsonb,
   1, 'G1', 'G1A'),

  ('G1A02', 'On which of the following bands is phone operation prohibited?',
   '["160 meters", "30 meters", "17 meters", "12 meters"]'::jsonb,
   1, 'G1', 'G1A'),

  -- Extra questions
  ('E1A01', 'When using a transceiver that displays the carrier frequency of phone signals, which of the following displayed frequencies represents the highest frequency at which a properly adjusted USB emission will be totally within the band?',
   '["The exact upper band edge", "300 Hz below the upper band edge", "1 kHz below the upper band edge", "3 kHz below the upper band edge"]'::jsonb,
   3, 'E1', 'E1A'),

  ('E1A02', 'When using a transceiver that displays the carrier frequency of phone signals, which of the following displayed frequencies represents the lowest frequency at which a properly adjusted LSB emission will be totally within the band?',
   '["The exact lower band edge", "300 Hz above the lower band edge", "1 kHz above the lower band edge", "3 kHz above the lower band edge"]'::jsonb,
   3, 'E1', 'E1A')
ON CONFLICT (id) DO NOTHING;

-- Insert sample glossary terms
INSERT INTO public.glossary_terms (term, definition) VALUES
  ('Antenna', 'A device designed to transmit or receive electromagnetic waves, converting electrical signals into radio waves and vice versa.'),
  ('Bandwidth', 'The range of frequencies occupied by a signal, typically measured in Hertz (Hz).'),
  ('Carrier', 'A radio frequency signal that is modulated to carry information.'),
  ('Dipole', 'A simple antenna consisting of two equal length conductors oriented end-to-end with the feedline connected between them.'),
  ('Frequency', 'The number of complete cycles of a periodic waveform that occur per second, measured in Hertz (Hz).'),
  ('Ground Wave', 'Radio waves that travel along the surface of the Earth.'),
  ('Harmonics', 'Signals that occur at integer multiples of the fundamental frequency.'),
  ('Impedance', 'The total opposition that a circuit presents to alternating current, measured in ohms.'),
  ('Modulation', 'The process of varying a carrier wave to encode information for transmission.'),
  ('Repeater', 'An automated station that receives a signal and retransmits it, usually at higher power and from a better location to extend communication range.')
ON CONFLICT (term) DO NOTHING;

-- Insert sample exam sessions (for testing the exam finder)
INSERT INTO public.exam_sessions (
  title, exam_date, exam_time, sponsor, walk_ins_allowed,
  public_contact, phone, email, vec,
  location_name, address, city, state, zip,
  latitude, longitude
) VALUES
  (
    'Monthly Ham Radio Exam Session',
    CURRENT_DATE + INTERVAL '14 days',
    '10:00 AM',
    'Local Amateur Radio Club',
    true,
    'John Smith',
    '555-1234',
    'exams@localclub.org',
    'ARRL',
    'Community Center',
    '123 Main Street',
    'Raleigh',
    'NC',
    '27601',
    35.7796,
    -78.6382
  ),
  (
    'Weekend Testing Session',
    CURRENT_DATE + INTERVAL '21 days',
    '2:00 PM',
    'State Amateur Radio Association',
    false,
    'Jane Doe',
    '555-5678',
    'testing@stateclub.org',
    'VEC',
    'Public Library',
    '456 Oak Avenue',
    'Durham',
    'NC',
    '27701',
    35.9940,
    -78.8986
  )
ON CONFLICT DO NOTHING;

-- Note: To create admin users, you need to:
-- 1. Sign up via the app (http://localhost:8080/auth)
-- 2. Get your user ID from Supabase Studio (Auth > Users)
-- 3. Run this query with your actual user ID:
--
-- INSERT INTO public.user_roles (user_id, role)
-- VALUES ('your-user-id-here', 'admin');

ANALYZE;

-- Display summary
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Local Supabase Seeded Successfully!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Questions: %', (SELECT COUNT(*) FROM public.questions);
  RAISE NOTICE 'Glossary Terms: %', (SELECT COUNT(*) FROM public.glossary_terms);
  RAISE NOTICE 'Exam Sessions: %', (SELECT COUNT(*) FROM public.exam_sessions);
  RAISE NOTICE '';
  RAISE NOTICE 'To create an admin user:';
  RAISE NOTICE '1. Sign up at http://localhost:8080/auth';
  RAISE NOTICE '2. Find your user ID in Studio: http://localhost:54323';
  RAISE NOTICE '3. Run: INSERT INTO user_roles (user_id, role) VALUES (''uuid'', ''admin'');';
  RAISE NOTICE '========================================';
END $$;
