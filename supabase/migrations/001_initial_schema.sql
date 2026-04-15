-- ============================================================
-- Sprint 2 — Initial Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── benefits table (read-only reference data) ──────────────
create table if not exists public.benefits (
  id          uuid primary key default uuid_generate_v4(),
  slug        text unique not null,
  title       text not null,
  category    text not null,  -- 'disability', 'education', 'housing', 'healthcare', 'career'
  description text,
  eligibility text,           -- plain text summary
  url         text,           -- link to official resource
  branches    text[],         -- e.g. ARRAY['Army','Navy'] or NULL for all
  created_at  timestamptz default now()
);

-- Seed a few key benefits
insert into public.benefits (slug, title, category, description, eligibility, url, branches) values
  ('disability-compensation',
   'VA Disability Compensation',
   'disability',
   'Monthly tax-free payment for veterans with service-connected disabilities.',
   'Honorable discharge, service-connected disability rating of at least 10%.',
   'https://www.va.gov/disability/',
   null),

  ('gi-bill-chapter-33',
   'Post-9/11 GI Bill (Chapter 33)',
   'education',
   'Up to 100% tuition and fees, monthly housing allowance, and book stipend.',
   'At least 90 days of active service after September 10, 2001, or discharged due to service-connected disability.',
   'https://www.va.gov/education/about-gi-bill-benefits/post-9-11/',
   null),

  ('home-loan-guarantee',
   'VA Home Loan Guarantee',
   'housing',
   'Buy a home with no down payment, no PMI, and competitive interest rates.',
   'Minimum 90 days active service (wartime) or 181 days (peacetime). Certificate of Eligibility required.',
   'https://www.va.gov/housing-assistance/home-loans/',
   null),

  ('healthcare-enrollment',
   'VA Health Care',
   'healthcare',
   'Comprehensive health care at VA medical centers and clinics, including mental health services.',
   'Veterans who served in the active military and were not dishonorably discharged.',
   'https://www.va.gov/health-care/how-to-apply/',
   null),

  ('vocational-rehab',
   'Vocational Rehabilitation & Employment (VR&E)',
   'career',
   'Job training, education, and career counseling for veterans with service-connected disabilities.',
   'VA disability rating, valid discharge, and an employment handicap.',
   'https://www.va.gov/careers-employment/vocational-rehabilitation/',
   null),

  ('survivor-benefit',
   'Dependency and Indemnity Compensation (DIC)',
   'disability',
   'Tax-free monthly benefit for surviving spouses and dependents of veterans who died from a service-related condition.',
   'Surviving spouse, child, or parent of a veteran who died from a service-connected disability.',
   'https://www.va.gov/disability/dependency-indemnity-compensation/',
   null),

  ('caregiver-support',
   'Program of Comprehensive Assistance for Family Caregivers (PCAFC)',
   'healthcare',
   'Monthly stipend, health insurance, mental health services, and training for family caregivers.',
   'Caregivers of eligible veterans who were injured or ill in the line of duty on or after May 7, 1975.',
   'https://www.caregiver.va.gov/',
   null),

  ('veteran-readiness',
   'Veteran Readiness & Employment',
   'career',
   'Career counseling, job-seeking skills, and resume assistance for all veterans.',
   'Honorably discharged veterans with any rating or no rating.',
   'https://www.va.gov/careers-employment/',
   null)
on conflict (slug) do nothing;

-- RLS: benefits are public read, no auth required
alter table public.benefits enable row level security;

create policy "Public read benefits"
  on public.benefits
  for select
  using (true);
