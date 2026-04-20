// Structured VA knowledge chunks — seeded into va_knowledge via the sync job.
//
// ┌─────────────────────────────────────────────────────────────────┐
// │  ANNUAL UPDATE CHECKLIST (every December when VA announces COLA) │
// │  1. Update RATE_YEAR to the new benefit year                     │
// │  2. Update COLA_EFFECTIVE to the new effective date              │
// │  3. Update COLA_PCT to the new COLA percentage                   │
// │  4. Update all dollar amounts in the chunks below                │
// │  5. Re-run the sync job: Trigger.dev → sync-va-knowledge → Test  │
// │                                                                   │
// │  Official rate source: https://www.va.gov/disability/            │
// │                        compensation-rates/                        │
// └─────────────────────────────────────────────────────────────────┘

const RATE_YEAR      = '2025'
const COLA_EFFECTIVE = 'December 1, 2024'
const COLA_PCT       = '2.5%'

export interface KnowledgeChunk {
  source: string    // stable upsert key — never include a year here
  category: 'compensation' | 'claims' | 'healthcare' | 'education' | 'housing' | 'career'
  content: string
}

export const VA_KNOWLEDGE_CHUNKS: KnowledgeChunk[] = [
  // ── Compensation Rates ──────────────────────────────────────────────────────

  {
    source: 'va-comp-rates-no-deps',
    category: 'compensation',
    content: `VA Disability Compensation Rates ${RATE_YEAR} — Veteran with No Dependents
Effective: ${COLA_EFFECTIVE} (${COLA_PCT} COLA increase)
Official source: https://www.va.gov/disability/compensation-rates/veteran-with-disability-rating/

Rating | Monthly Payment
10%    | $175.51
20%    | $346.95
30%    | $537.42
40%    | $774.16
50%    | $1,102.04
60%    | $1,395.93
70%    | $1,759.19
80%    | $2,044.89
90%    | $2,297.96
100%   | $3,831.30

These are tax-free federal benefit payments. Veterans rated 100% P&T may also qualify for additional state benefits.`,
  },

  {
    source: 'va-comp-rates-with-spouse',
    category: 'compensation',
    content: `VA Disability Compensation Rates ${RATE_YEAR} — Veteran with Spouse (No Children)
Effective: ${COLA_EFFECTIVE} (${COLA_PCT} COLA increase)
These rates apply at 30% and above — the VA does not add dependent amounts at 10% or 20%.
Official source: https://www.va.gov/disability/compensation-rates/veteran-with-disability-rating/

Rating | Monthly Payment (with spouse)
30%    | $601.58
40%    | $866.11
50%    | $1,211.81
60%    | $1,523.52
70%    | $1,905.51
80%    | $2,210.00
90%    | $2,481.78
100%   | $4,037.53

To receive the dependent rate, the veteran must add dependents to their VA record (VA Form 21-686c).`,
  },

  {
    source: 'va-comp-rates-with-spouse-child',
    category: 'compensation',
    content: `VA Disability Compensation Rates ${RATE_YEAR} — Veteran with Spouse and One Child
Effective: ${COLA_EFFECTIVE} (${COLA_PCT} COLA increase)
Official source: https://www.va.gov/disability/compensation-rates/veteran-with-disability-rating/

Rating | Monthly Payment (spouse + 1 child)
30%    | $659.58
40%    | $942.11
50%    | $1,305.81
60%    | $1,634.52
70%    | $2,034.51
80%    | $2,357.00
90%    | $2,645.78
100%   | $4,212.53

Each additional child under 18 (or under 23 if in school) adds to the monthly payment.
Submit VA Form 21-686c to add dependents; VA Form 21-674 for school-age children.`,
  },

  {
    source: 'va-tdiu',
    category: 'compensation',
    content: `TDIU — Total Disability based on Individual Unemployability (${RATE_YEAR})
TDIU allows veterans rated less than 100% to receive 100% disability pay if their service-connected condition(s) prevent substantially gainful employment.

Eligibility requirements:
• Single condition: rated at least 60%
• Multiple conditions: one rated at least 40% AND combined rating at least 70%

${RATE_YEAR} TDIU payment rate (same as 100% schedular): $3,831.30/month (no dependents)
With spouse: $4,037.53/month

How to apply: VA Form 21-8940 (Veteran's Application for Increased Compensation Based on Unemployability)
Also submit: VA Form 21-4192 (employer's statement of earnings) if recently employed

Note: TDIU does not require a formal 100% schedular rating — it is a separate benefit.
Marginal employment (under federal poverty threshold) does not disqualify a veteran.`,
  },

  {
    source: 'va-smc',
    category: 'compensation',
    content: `SMC — Special Monthly Compensation (${RATE_YEAR})
SMC provides additional payments above the standard disability rate for veterans with severe disabilities, loss of limb, or need for regular aid and attendance.

Key SMC levels (monthly amounts, ${RATE_YEAR}):
• SMC-S (housebound): $3,831.30 base + $370.04 = ~$4,201.34/month
• SMC-L (aid and attendance, one limb loss): ~$4,289.16/month
• SMC-K (minor loss, e.g., creative organ): +$122.53 added to existing rating
• SMC-T (traumatic brain injury): highest level, case-by-case

To apply: VA Form 21-2680 (Examination for Housebound Status or Permanent Need for Regular Aid and Attendance)
Also VA Form 21-0779 for nursing home veterans.

SMC is often underutilized — veterans with severe conditions should specifically ask their VSO or VA rater about SMC eligibility.`,
  },

  {
    source: 'va-dic',
    category: 'compensation',
    content: `DIC — Dependency and Indemnity Compensation (${RATE_YEAR})
DIC is a tax-free monthly benefit paid to eligible survivors (surviving spouse, children, parents) of veterans who died in service or from a service-connected condition.

${RATE_YEAR} Basic DIC rate for surviving spouse: $1,612.75/month
Additional amounts:
• Transitional benefit (first 2 years): +$342.46/month
• Each dependent child under 18: +$342.46/month
• Housebound/aid and attendance: higher rates apply

Eligibility (surviving spouse):
• Married veteran who died on active duty, OR
• Veteran who died from a service-connected disability, OR
• Veteran who was 100% P&T for 10+ years before death, OR
• 100% P&T for 5+ years if disability began within 1 year of discharge

How to apply: VA Form 21P-534EZ
Official source: https://www.va.gov/burials-memorials/dependency-indemnity-compensation/`,
  },

  // ── Claims Process ────────────────────────────────────────────────────────

  {
    source: 'va-combined-ratings-formula',
    category: 'claims',
    content: `VA Combined Ratings Formula — "Whole Person" Method
The VA does NOT simply add disability percentages together. It uses the "whole person" method.

How it works:
1. Start with 100% (whole person)
2. Subtract the highest rating first: e.g., 70% of 100 = 30% remaining
3. Apply next rating to the remainder: e.g., 50% of 30 = 15
4. Add: 70 + 15 = 85 → rounds to 90% (VA rounds to nearest 10%)

Example: 70% + 50% + 30% combined:
• 100 - 70 = 30 remaining
• 50% of 30 = 15 → running total: 85
• 30% of 15 = 4.5 → running total: 89.5 → rounds to 90%

The final combined rating is rounded: .5+ rounds up to next 10%, less than .5 rounds down.
A 95% combined rating rounds to 100%.

Key insight: veterans often need 3-4 conditions to reach 100% due to this diminishing returns formula.
Use the VA's combined ratings calculator: https://www.va.gov/disability/about-disability-ratings/`,
  },

  {
    source: 'va-appeal-lanes',
    category: 'claims',
    content: `VA Appeals — Three Decision Review Options (AMA Framework, ${RATE_YEAR})
After a denied or unfavorable rating decision, veterans have three appeal lanes. The deadline for all three is generally 1 year from the decision date.

1. Supplemental Claim (best for new evidence)
   • Submit new and relevant evidence not previously considered
   • VA must respond within 125 days
   • Use: VA Form 20-0995
   • Best when you have new medical evidence, buddy statements, or a nexus letter

2. Higher-Level Review (best for legal/procedural error)
   • Senior VA reviewer looks at the same evidence for clear error
   • No new evidence allowed
   • VA must respond within 125 days
   • Can request informal conference with reviewer
   • Use: VA Form 20-0996

3. Board of Veterans' Appeals (best for complex cases)
   • Three lanes: Direct Review, Evidence Submission, Hearing Request
   • Hearing lane average wait time: 2-3+ years
   • Direct review average: 1-2 years
   • Use: VA Form 10182
   • Veterans Law Judge makes the decision

CRITICAL: Never miss the 1-year deadline. If missed, you can still file a new claim but lose the effective date (which determines back pay).`,
  },

  {
    source: 'va-nexus-requirements',
    category: 'claims',
    content: `VA Service Connection — Nexus Requirements
To get a disability rated, veterans must establish three elements:
1. Current diagnosis: A current diagnosed medical condition
2. In-service event: An event, injury, or illness during active duty
3. Nexus: Medical link between the in-service event and current condition

Types of service connection:
• Direct: Condition caused or worsened by service (e.g., knee injury in service)
• Aggravation: Pre-existing condition worsened beyond natural progression by service
• Secondary: Condition caused or worsened by an already service-connected condition
• Presumptive: Certain conditions are presumed service-connected (see below)

Presumptive conditions (no nexus letter needed):
• Agent Orange exposure: ischemic heart disease, diabetes type 2, Parkinson's, certain cancers
• Gulf War illness: chronic multisymptom illness, undiagnosed illness (presumptive through 2026)
• PACT Act (2022): expanded presumptives for burn pit/toxic exposure veterans
• POW conditions: various psychiatric and physical conditions
• 1-year presumptive: any condition rated 10%+ within 1 year of discharge

Nexus letter: A private doctor's letter stating "at least as likely as not" (50%+ probability) that the condition is related to service. This is the legal standard (not "definitely" or "probably").`,
  },

  {
    source: 'va-key-forms',
    category: 'claims',
    content: `Key VA Forms for Disability Claims (${RATE_YEAR})
Filing forms:
• VA Form 21-526EZ — Initial Application for Disability Compensation (most common)
• VA Form 20-0995 — Supplemental Claim Decision Review Request
• VA Form 20-0996 — Higher-Level Review Request
• VA Form 10182 — Notice of Disagreement (Board of Veterans' Appeals)

Evidence forms:
• VA Form 21-4142 — Authorization to Release Medical Records
• VA Form 21-4142a — General Release for Medical Provider Information
• VA Form 21-0781 — PTSD Statement in Support of Claim
• VA Form 21-0781a — PTSD (MST) Statement in Support of Claim
• VA Form 21-10210 — Lay/Witness Statement (buddy statement)

Dependent forms:
• VA Form 21-686c — Add/Remove Dependents
• VA Form 21-674 — School Enrollment for Dependent Child (18-23)

Unemployability:
• VA Form 21-8940 — TDIU Application
• VA Form 21-4192 — Request for Employment Information

File all forms at: https://www.va.gov/decision-reviews/ or through a VSO (free).`,
  },

  {
    source: 'va-pact-act',
    category: 'claims',
    content: `PACT Act — Sergeant First Class Heath Robinson Honoring our Promise to Address Comprehensive Toxics Act (2022)
The PACT Act is the largest expansion of VA benefits in decades, effective August 2022.

Who it helps:
• Post-9/11 veterans exposed to burn pits in Iraq, Afghanistan, or other locations
• Vietnam-era veterans with Agent Orange exposure in new locations (Thailand, Korea, etc.)
• Cold War radiation-exposed veterans

New presumptive conditions added for post-9/11 veterans (burn pit exposure):
• All cancers: Any cancer (if veteran served in a covered location after Aug 2, 1990)
• Respiratory: rhinitis, sinusitis, laryngitis, rhinosinusitis, constrictive bronchiolitis
• Headache disorders
• Reproductive: male infertility, endometriosis

Covered locations: Iraq, Afghanistan, Syria, Djibouti, Jordan, Egypt, Lebanon, Bahrain, etc. (any SWA location after Aug 2, 1990)

How to apply:
1. File VA Form 21-526EZ — check "toxic exposure" box
2. VA will request military occupational history
3. No individual nexus letter required for presumptive conditions
4. Retroactive: Claims filed before Aug 10, 2022 can be resubmitted under PACT Act

More: https://www.va.gov/resources/the-pact-act-and-your-va-benefits/`,
  },

  // ── Healthcare ────────────────────────────────────────────────────────────

  {
    source: 'va-healthcare-eligibility',
    category: 'healthcare',
    content: `VA Healthcare Eligibility (${RATE_YEAR})
Most veterans who served on active duty and were separated under conditions other than dishonorable are eligible.

Priority groups (1 = highest priority, 8 = lowest):
• Group 1: 50%+ service-connected disability or receiving TDIU
• Group 2: 30-40% service-connected disability
• Group 3: 10-20% service-connected disability; Purple Heart; former POW; some Medal of Honor
• Group 4: Catastrophic disability; Aid and Attendance; housebound
• Group 5: Non-service-connected disability if income below VA threshold
• Groups 6-8: Based on income; some may have copays

Free care (no copay) for:
• Any condition related to a service-connected disability
• Veterans 50%+ service-connected for ALL care
• Combat veterans within 5 years of discharge (PACT Act extended this)

PACT Act expansion: Post-9/11 combat veterans now have 10 years of free VA healthcare (extended from 5 years). Veterans who declined enrollment previously can re-enroll.

How to enroll: VA Form 10-10EZ at https://www.va.gov/health-care/apply-for-health-care-form-10-10ez/`,
  },

  // ── Education ─────────────────────────────────────────────────────────────

  {
    source: 'va-post911-gibill',
    category: 'education',
    content: `Post-9/11 GI Bill (Chapter 33) — ${RATE_YEAR}
The most generous education benefit for veterans who served on active duty after September 10, 2001.

Eligibility: 90+ days of active duty after 9/10/2001 (or discharged for service-connected disability after 30 days)

Benefits (at 100% eligibility = 36 months of aggregate active duty):
• Tuition & fees: 100% of in-state public school tuition (or up to $28,937.09/year for private/foreign schools in 2024-25 academic year)
• Housing allowance: Equal to E-5 with dependents BAH for school's zip code (online-only = ~$1,053/month in ${RATE_YEAR})
• Book stipend: Up to $1,000/year
• One-time relocation: $500 (if moving from rural area)

Eligibility tiers:
• 90 days: 40% of benefits
• 6 months: 60%
• 18 months: 80%
• 36 months: 100%

Expiration: GI Bill benefits expire 15 years after your last period of active duty (if discharged before Jan 1, 2013). If discharged on or after Jan 1, 2013: NO expiration (unlimited time).

Transfer to dependents: Active duty members with 6+ years can transfer unused months to spouse/children (must remain in service 4 more years after approval — submit before separation).

Apply: VA Form 22-1990 at https://www.va.gov/education/apply-for-education-benefits/`,
  },

  // ── Housing ───────────────────────────────────────────────────────────────

  {
    source: 'va-home-loan',
    category: 'housing',
    content: `VA Home Loan Benefit (${RATE_YEAR})
VA-backed loans require no down payment and no private mortgage insurance (PMI), making them the best mortgage product available for most veterans.

Eligibility: Active duty, veterans, National Guard/Reserve (6+ years or mobilized 90+ days), surviving spouses

${RATE_YEAR} VA loan limits: No loan limit for veterans with full entitlement (no existing VA loan). For those with reduced entitlement, conforming loan limit applies ($766,550 in most areas, higher in high-cost areas).

VA funding fee (${RATE_YEAR}) — one-time fee, can be financed:
• First use, no down payment: 2.15% (Regular Military), 2.15% (Reserves/Guard)
• First use, 5-9.99% down: 1.5%
• First use, 10%+ down: 1.25%
• Subsequent use, no down payment: 3.3%
• EXEMPT from funding fee: Veterans with any service-connected disability rating (even 0%)

Interest rate: Set by lender — shop around. VA loans typically run 0.25-0.5% lower than conventional.

Certificate of Eligibility (COE): Apply at https://www.va.gov/housing-assistance/home-loans/request-coe-form-26-1880/ or through your lender's VA portal.

Restoration of entitlement: After selling VA-financed home and paying off the loan, you can restore full entitlement (VA Form 26-1880).`,
  },

  // ── Career ────────────────────────────────────────────────────────────────

  {
    source: 'va-vre-voc-rehab',
    category: 'career',
    content: `VR&E — Vocational Rehabilitation & Employment (Chapter 31, ${RATE_YEAR})
VR&E helps veterans with service-connected disabilities prepare for, find, and maintain suitable employment.

Eligibility:
• Service-connected disability rating of 10%+ (OR memorandum rating of 20%+)
• Discharge other than dishonorable
• Entitlement period: 12 years from date of separation OR date of disability notification (whichever is later)

Benefits:
• Education/training: Full tuition + fees (no cap), books, supplies
• Monthly subsistence allowance while in training (${RATE_YEAR} rates similar to GI Bill housing rates)
• Job placement assistance
• Independent living services (for 100% P&T unable to work)
• Business ownership track available

Five tracks:
1. Reemployment (return to previous employer)
2. Rapid Access to Employment (short-term job readiness)
3. Self-Employment (business ownership)
4. Employment Through Long-Term Services (education/training)
5. Independent Living (for severely disabled veterans)

VR&E can be STACKED with GI Bill: VR&E is the better benefit in most cases (no cap on private school tuition, subsistence pay is often higher). Use VR&E first; preserve GI Bill for dependents.

Apply: VA Form 28-1900 at https://www.va.gov/careers-employment/vocational-rehabilitation/`,
  },
]
