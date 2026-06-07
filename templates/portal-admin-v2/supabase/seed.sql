-- ============================================================
-- portal-admin-v2 — seed data
-- ============================================================
-- Run AFTER schema.sql.
--
-- Login user: this seed creates the organization_users PROFILE row but NOT the
-- auth.users credential (passwords are managed by Supabase Auth). To finish:
--
--   1. Supabase dashboard -> Authentication -> Users -> "Add user"
--        email:    admin@portal.demo
--        password: Passw0rd!   (or your own)
--        (check "Auto Confirm User")
--   2. Run the LAST statement in this file to link that auth user to the
--      seeded admin profile (or just re-run this whole file after step 1).
--
-- If the link is skipped, login still works — loadProfile() falls back to a
-- default "Organization Admin" profile so you reach the dashboard either way.
-- ============================================================

-- Fixed UUIDs so rows reference each other deterministically.
-- org:   11111111-1111-1111-1111-111111111111
-- acct1: 22222222-2222-2222-2222-222222222201
-- acct2: 22222222-2222-2222-2222-222222222202

insert into organizations (id, name) values
  ('11111111-1111-1111-1111-111111111111', 'Demo Health Group')
on conflict (id) do nothing;

insert into payers (name, payer_code) values
  ('Aetna', 'AET'),
  ('Blue Cross Blue Shield', 'BCBS'),
  ('UnitedHealthcare', 'UHC'),
  ('Cigna', 'CIG')
on conflict do nothing;

insert into accounts (id, npi, name, address, city, state, zip, organization_id, tax_id, stc_codes, status, is_primary) values
  ('22222222-2222-2222-2222-222222222201', '1234567890', 'Downtown Family Clinic', '100 Main St', 'Austin', 'TX', '73301', '11111111-1111-1111-1111-111111111111', '81-1234567', '["30","35"]', 'Active', true),
  ('22222222-2222-2222-2222-222222222202', '9876543210', 'Northside Pediatrics', '200 Oak Ave', 'Dallas', 'TX', '75201', '11111111-1111-1111-1111-111111111111', '81-7654321', '["30"]', 'Active', false)
on conflict (id) do nothing;

insert into patients (first_name, last_name, date_of_birth, gender, member_id, payer_name, insurance_status, account_id, organization_id, status) values
  ('John',   'Carter',  '1985-04-12', 'Male',   'AET100200', 'Aetna',                   'Verified', '22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111111', 'Active'),
  ('Maria',  'Lopez',   '1990-09-30', 'Female', 'BCBS44551', 'Blue Cross Blue Shield',  'Pending',  '22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111111', 'Active'),
  ('David',  'Nguyen',  '1978-01-05', 'Male',   'UHC778812', 'UnitedHealthcare',        'Verified', '22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111111', 'Active'),
  ('Sarah',  'Johnson', '2001-07-19', 'Female', 'CIG223344', 'Cigna',                   'Inactive', '22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111111', 'Inactive')
on conflict do nothing;

insert into batches (name, account_id, type, status, total, processed, organization_id) values
  ('March Claims Batch',  '22222222-2222-2222-2222-222222222201', 'CLAIMS_SUBMISSION', 'COMPLETED',  120, 120, '11111111-1111-1111-1111-111111111111'),
  ('April Test Batch',    '22222222-2222-2222-2222-222222222202', 'TEST',              'PROCESSING', 40,  18,  '11111111-1111-1111-1111-111111111111'),
  ('Eligibility Sweep',   '22222222-2222-2222-2222-222222222201', 'CLAIMS_SUBMISSION', 'PENDING',    0,   0,   '11111111-1111-1111-1111-111111111111')
on conflict do nothing;

insert into claims (patient_name, account_id, payer, amount, status, organization_id) values
  ('John Carter',  '22222222-2222-2222-2222-222222222201', 'Aetna',            1240.00, 'PAID',     '11111111-1111-1111-1111-111111111111'),
  ('Maria Lopez',  '22222222-2222-2222-2222-222222222201', 'Blue Cross',        860.50, 'SUBMITTED','11111111-1111-1111-1111-111111111111'),
  ('David Nguyen', '22222222-2222-2222-2222-222222222202', 'UnitedHealthcare', 2300.00, 'DENIED',   '11111111-1111-1111-1111-111111111111')
on conflict do nothing;

-- Admin profile (links to auth user on login via auth_user_id).
insert into organization_users
  (first_name, last_name, email, phone_number, organization_id, role, status, account_ids, accounts, is_acknowledged, subscription_id)
values
  ('Demo', 'Admin', 'admin@portal.demo', '5125550100', '11111111-1111-1111-1111-111111111111',
   'Organization Admin', 'Active',
   '["22222222-2222-2222-2222-222222222201","22222222-2222-2222-2222-222222222202"]',
   '[{"id":"22222222-2222-2222-2222-222222222201","name":"Downtown Family Clinic"},{"id":"22222222-2222-2222-2222-222222222202","name":"Northside Pediatrics"}]',
   true, 'demo-subscription')
on conflict (email) do nothing;

-- A second (regular) user to populate the Users list.
insert into organization_users
  (first_name, last_name, email, phone_number, organization_id, role, status, account_ids, accounts, is_acknowledged)
values
  ('Casey', 'Rivera', 'casey@portal.demo', '5125550111', '11111111-1111-1111-1111-111111111111',
   'Organization User', 'Active',
   '["22222222-2222-2222-2222-222222222201"]',
   '[{"id":"22222222-2222-2222-2222-222222222201","name":"Downtown Family Clinic"}]',
   true)
on conflict (email) do nothing;

-- STEP 2 (run after creating the auth user in the dashboard):
update organization_users ou
   set auth_user_id = au.id
  from auth.users au
 where au.email = ou.email
   and ou.auth_user_id is null;
