// VA knowledge chunks for the RAG corpus. Chunks are built by a pure function
// from structured rate data in va-rates.ts — no dollar amounts are hardcoded
// in prose. The sync job may swap in live-fetched rates before calling the
// builder; the shape is identical to the committed fallback.
//
// To update narrative content: edit the chunk templates below.
// To update dollar amounts: edit va-rates.ts (single source of truth).

import {
  COMPENSATION_RATES,
  SMC_RATES,
  DIC_RATES,
  EDUCATION_RATES,
  LOAN_LIMITS,
  TEXAS_PROPERTY_TAX,
  usd,
  usdWhole,
  type CompensationRates,
  type SMCRates,
  type DICRates,
  type EducationRates,
  type LoanLimits,
  type TexasPropertyTaxTiers,
} from './va-rates'

export interface KnowledgeChunk {
  source:   string  // stable upsert key — never include a year here
  category: 'compensation' | 'claims' | 'healthcare' | 'education' | 'housing' | 'career' | 'state'
  content:  string
}

export interface ChunkBuilderInputs {
  comp:             CompensationRates
  smc:              SMCRates
  dic:              DICRates
  education:        EducationRates
  loans:            LoanLimits
  texasPropertyTax: TexasPropertyTaxTiers
}

function rateTable(entries: [number, number][]): string {
  return entries.map(([r, v]) => `${String(r).padEnd(3)}%   | ${usd(v)}`).join('\n')
}

function sortedEntries(table: Record<number, number>): [number, number][] {
  return Object.entries(table)
    .map(([k, v]) => [Number(k), v] as [number, number])
    .sort((a, b) => a[0] - b[0])
}

export function buildKnowledgeChunks(inputs: ChunkBuilderInputs): KnowledgeChunk[] {
  const { comp, smc, dic, education, loans, texasPropertyTax } = inputs
  const year = comp.rate_year

  return [
    // ── Compensation Rates ────────────────────────────────────────────────────

    {
      source: 'va-comp-rates-no-deps',
      category: 'compensation',
      content: `VA Disability Compensation Rates ${year} — Veteran with No Dependents
Effective: ${comp.effective_date} (${comp.cola_pct} COLA increase)
Official source: ${comp.source_url}

Rating | Monthly Payment
${rateTable(sortedEntries(comp.no_deps))}

These are tax-free federal benefit payments. Veterans rated 100% P&T may also qualify for additional state benefits.`,
    },

    {
      source: 'va-comp-rates-with-spouse',
      category: 'compensation',
      content: `VA Disability Compensation Rates ${year} — Veteran with Spouse (No Children)
Effective: ${comp.effective_date} (${comp.cola_pct} COLA increase)
These rates apply at 30% and above — the VA does not add dependent amounts at 10% or 20%.
Official source: ${comp.source_url}

Rating | Monthly Payment (with spouse)
${rateTable(sortedEntries(comp.with_spouse))}

To receive the dependent rate, the veteran must add dependents to their VA record (VA Form 21-686c).`,
    },

    {
      source: 'va-comp-rates-with-spouse-child',
      category: 'compensation',
      content: `VA Disability Compensation Rates ${year} — Veteran with Spouse and One Child
Effective: ${comp.effective_date} (${comp.cola_pct} COLA increase)
Official source: ${comp.source_url}

Rating | Monthly Payment (spouse + 1 child)
${rateTable(sortedEntries(comp.with_spouse_and_one_child))}

Each additional child under 18 (or under 23 if in school) adds to the monthly payment.
Submit VA Form 21-686c to add dependents; VA Form 21-674 for school-age children.`,
    },

    {
      source: 'va-tdiu',
      category: 'compensation',
      content: `TDIU — Total Disability based on Individual Unemployability (${year})
TDIU allows veterans rated less than 100% to receive 100% disability pay if their service-connected condition(s) prevent substantially gainful employment.

Eligibility requirements:
• Single condition: rated at least 60%
• Multiple conditions: one rated at least 40% AND combined rating at least 70%

${year} TDIU payment rate (same as 100% schedular): ${usd(comp.no_deps[100])}/month (no dependents)
With spouse: ${usd(comp.with_spouse[100])}/month

How to apply: VA Form 21-8940 (Veteran's Application for Increased Compensation Based on Unemployability)
Also submit: VA Form 21-4192 (employer's statement of earnings) if recently employed

Note: TDIU does not require a formal 100% schedular rating — it is a separate benefit.
Marginal employment (under federal poverty threshold) does not disqualify a veteran.`,
    },

    {
      source: 'va-smc',
      category: 'compensation',
      content: `SMC — Special Monthly Compensation (${year})
SMC provides additional payments above the standard disability rate for veterans with severe disabilities, loss of limb, or need for regular aid and attendance.
Effective: ${smc.effective_date}
Official source: ${smc.source_url}

Key SMC levels (monthly amounts):
• SMC-S (housebound), veteran alone: ${usd(smc.s_housebound)}
• SMC-L (aid and attendance, one limb loss), veteran alone: ${usd(smc.l_veteran_alone)}
• SMC-K (minor loss, e.g., creative organ): ${usd(smc.k_amount)} added to existing rating
• SMC-T (traumatic brain injury): equivalent to SMC-R.2 rate — case-by-case, highest level

To apply: VA Form 21-2680 (Examination for Housebound Status or Permanent Need for Regular Aid and Attendance)
Also VA Form 21-0779 for nursing home veterans.

SMC is often underutilized — veterans with severe conditions should specifically ask their VSO or VA rater about SMC eligibility.`,
    },

    {
      source: 'va-dic',
      category: 'compensation',
      content: `DIC — Dependency and Indemnity Compensation (${year})
DIC is a tax-free monthly benefit paid to eligible survivors (surviving spouse, children, parents) of veterans who died in service or from a service-connected condition.
Effective: ${dic.effective_date}
Official source: ${dic.source_url}

Basic DIC rate for surviving spouse: ${usd(dic.surviving_spouse_base)}/month
Additional amounts:
• Transitional benefit (first 2 years): +${usd(dic.transitional_first_2_years)}/month
• Each dependent child under 18: +${usd(dic.per_dependent_child_under_18)}/month
• Aid and attendance: +${usd(dic.aid_and_attendance_added)}/month

Eligibility (surviving spouse):
• Married veteran who died on active duty, OR
• Veteran who died from a service-connected disability, OR
• Veteran who was 100% P&T for 10+ years before death, OR
• 100% P&T for 5+ years if disability began within 1 year of discharge

How to apply: VA Form 21P-534EZ`,
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
      content: `VA Appeals — Three Decision Review Options (AMA Framework, ${year})
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
• Gulf War illness: chronic multisymptom illness, undiagnosed illness (presumptive — check va.gov for current expiry)
• PACT Act (2022): expanded presumptives for burn pit/toxic exposure veterans
• POW conditions: various psychiatric and physical conditions
• 1-year presumptive: any condition rated 10%+ within 1 year of discharge

Nexus letter: A private doctor's letter stating "at least as likely as not" (50%+ probability) that the condition is related to service. This is the legal standard (not "definitely" or "probably").`,
    },

    {
      source: 'va-key-forms',
      category: 'claims',
      content: `Key VA Forms for Disability Claims (${year})
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
      content: `VA Healthcare Eligibility (${year})
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
• Combat veterans within 10 years of discharge (PACT Act extended this from 5 to 10 years)

PACT Act expansion: Post-9/11 combat veterans now have 10 years of free VA healthcare. Veterans who declined enrollment previously can re-enroll.

How to enroll: VA Form 10-10EZ at https://www.va.gov/health-care/apply-for-health-care-form-10-10ez/`,
    },

    // ── Education ─────────────────────────────────────────────────────────────

    {
      source: 'va-post911-gibill',
      category: 'education',
      content: `Post-9/11 GI Bill (Chapter 33) — Academic Year ${education.academic_year}
The most generous education benefit for veterans who served on active duty after September 10, 2001.

Eligibility: 90+ days of active duty after 9/10/2001 (or discharged for service-connected disability after 30 days)

Benefits (at 100% eligibility = 36 months of aggregate active duty):
• Tuition & fees at public schools: 100% of in-state tuition (no cap)
• Tuition & fees at private/foreign schools: up to ${usd(education.private_school_tuition_cap)}/year (${education.academic_year} cap)
• Housing allowance (MHA): Equal to E-5 with dependents BAH for the school's ZIP code. Online-only attendance pays half the national average BAH.
• Book stipend: Up to $1,000/year
• One-time relocation: $500 (if moving from rural area)

Official rate source: ${education.source_url}

Eligibility tiers:
• 90 days: 40% of benefits
• 6 months: 60%
• 18 months: 80%
• 36 months: 100%

Expiration: GI Bill benefits have NO expiration for veterans discharged on or after January 1, 2013 (Forever GI Bill). For discharges before that date, the 15-year delimiting date may still apply.

Yellow Ribbon Program: Schools can partner with the VA to cover tuition above the private-school cap. Only veterans at 100% Post-9/11 eligibility qualify. The school contributes an amount and the VA matches it.

Transfer to dependents: Active duty members with 6+ years can transfer unused months to spouse/children (must remain in service 4 more years after approval — submit before separation).

Apply: VA Form 22-1990 at https://www.va.gov/education/apply-for-education-benefits/`,
    },

    // ── Housing ───────────────────────────────────────────────────────────────

    {
      source: 'va-home-loan',
      category: 'housing',
      content: `VA Home Loan Benefit (${loans.year})
VA-backed loans require no down payment and no private mortgage insurance (PMI), making them the best mortgage product available for most veterans.

Eligibility: Active duty, veterans, National Guard/Reserve (6+ years or mobilized 90+ days), surviving spouses

${loans.year} VA loan limits: No loan limit for veterans with full entitlement (no existing VA loan). For those with reduced entitlement, the FHFA conforming loan limit applies:
• Baseline (most counties): ${usdWhole(loans.baseline)}
• High-cost ceiling: ${usdWhole(loans.high_cost_ceiling)}
• Source: ${loans.source_url}

VA funding fee — one-time fee, can be financed:
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
      content: `VR&E — Vocational Rehabilitation & Employment (Chapter 31, ${year})
VR&E helps veterans with service-connected disabilities prepare for, find, and maintain suitable employment.

Eligibility:
• Service-connected disability rating of 10%+ (OR memorandum rating of 20%+)
• Discharge other than dishonorable
• Entitlement period: 12 years from date of separation OR date of disability notification (whichever is later)

Benefits:
• Education/training: Full tuition + fees (no cap), books, supplies
• Monthly subsistence allowance while in training (rates similar to Post-9/11 GI Bill housing rates)
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

    // ── Texas State Benefits ─────────────────────────────────────────────────

    {
      source: 'tx-property-tax-exemption',
      category: 'state',
      content: `Texas Disabled Veteran Property Tax Exemption

Texas offers TWO separate property tax benefits for disabled veterans:

1. Partial exemption (Texas Tax Code § 11.22) — reduces the assessed value of ANY property owned by the veteran (not limited to a homestead):
• 10%–29% rating: ${usdWhole(texasPropertyTax.tier_10_29)} off assessed value
• 30%–49% rating: ${usdWhole(texasPropertyTax.tier_30_49)} off assessed value
• 50%–69% rating: ${usdWhole(texasPropertyTax.tier_50_69)} off assessed value
• 70%–100% rating: ${usdWhole(texasPropertyTax.tier_70_100)} off assessed value

Bonus ${usdWhole(texasPropertyTax.age_65_plus_or_qualifying_loss)} exemption applies regardless of rating if the veteran is 65+ with a 10%+ rating, totally blind in one or both eyes, or has lost use of one or more limbs.

2. Total homestead exemption (Texas Tax Code § 11.131) — veterans rated 100% service-connected disabled (or receiving TDIU rated 100% P&T) receive a FULL property tax exemption on their residence homestead. No cap on home value, no income test.

Surviving spouses: may continue the exemption if they do not remarry and the property remains their homestead.

How to apply: File Form 50-135 ("Application for Disabled Veteran's or Survivor's Exemptions") with your county appraisal district. Filing deadline is April 30 of the tax year; late applications accepted up to 5 years after the delinquency date under § 11.439.

Source: ${texasPropertyTax.source_url}`,
    },

    {
      source: 'tx-hazlewood-act',
      category: 'state',
      content: `Texas Hazlewood Act — State Tuition Exemption

The Hazlewood Act provides eligible Texas veterans up to 150 credit hours of tuition and most mandatory fees at ANY public college or university in Texas. It does NOT cover books, supplies, or living expenses. Hazlewood can be used AFTER exhausting federal benefits (Post-9/11 GI Bill, MGIB).

Eligibility:
• Entered military service in Texas (declared Texas as home of record) OR was a Texas resident at time of entry
• Served 181+ days of active duty (excluding training)
• Discharged under honorable conditions
• Exhausted federal VA education benefits (or never had entitlement)
• Not in default on any federal student loan
• Classified as a Texas resident for tuition purposes

Legacy Act — transfer to a dependent child:
Veterans with unused Hazlewood hours can transfer them to ONE biological, stepchild, adopted, or tax-claimed dependent at a time. The child must:
• Be age 25 or younger on the first day of the semester
• Make satisfactory academic progress
• Be a Texas resident

How to apply: Contact the veterans services office at your Texas public college/university. Each institution verifies eligibility each semester.

Source: Texas Veterans Commission — https://tvc.texas.gov/education/hazlewood-act/`,
    },

    {
      source: 'tx-state-parks-pass',
      category: 'state',
      content: `Texas Disabled Veteran State Park Access

Veterans with a 60% OR GREATER service-connected disability rating, OR any veteran who has lost the use of a lower extremity, qualify for a free Parklands Passport from Texas Parks and Wildlife Department (TPWD). The Parklands Passport provides free entry to all Texas State Parks for the veteran and any accompanying family.

Veterans with lower disability ratings (below 60%) do not qualify for the free Parklands Passport but can purchase the standard Texas State Parks Pass at regular price.

How to apply: Present a VA award letter showing current disability rating (or DD-214 showing qualifying injury) at any Texas State Park headquarters, or contact TPWD at 512-389-8900.

Source: Texas Parks and Wildlife — https://tpwd.texas.gov/state-parks/park-information/passes`,
    },

    {
      source: 'tx-vehicle-registration-plates',
      category: 'state',
      content: `Texas Disabled Veteran License Plates and Vehicle Registration

Disabled Veteran (DV) License Plates: Veterans who receive compensation from the VA for service-connected disabilities qualify for specialty DV plates. Available designs include standard DV plates, Purple Heart plates (Purple Heart recipients), and plates for specific branches.

First set of DV plates: $3 registration fee (one vehicle). Additional vehicles with DV plates pay standard registration fees.

Disabled parking privileges: DV plates issued to veterans whose disability includes a qualifying mobility impairment include disabled parking privileges automatically — no separate placard needed. Otherwise, a veteran can apply for a standard disabled parking placard alongside DV plates.

How to apply:
• Complete Application for Persons with Disabilities Parking Placard and/or License Plate (VTR-214)
• Bring a VA award letter or Summary of Benefits Letter showing current rating
• File at your county tax assessor-collector office

Source: Texas DMV — https://www.txdmv.gov/motorists/disabled-veterans`,
    },

    {
      source: 'tx-vlb-loans',
      category: 'state',
      content: `Texas Veterans Land Board (VLB) Loan Programs

The VLB is a Texas state agency (within the General Land Office) that offers below-market loan programs for eligible Texas veterans. VLB loans can be used ALONGSIDE a federal VA loan (e.g., VA loan for the home, VLB Land Loan for acreage, VLB Home Improvement Loan for accessibility modifications).

Three VLB loan programs:

1. Home Loan — up to the FHFA conforming limit, 30-year fixed rate. Can be stacked with federal VA loan guaranty.

2. Land Loan — up to $150,000 for 5+ acres of rural Texas land. Minimum 5% down. Below-market interest rate and 30-year fixed term. Unique to Texas.

3. Home Improvement Loan — up to $50,000 (20-year term) or $10,000 (10-year term) for home repairs, disability accommodations, or energy-efficiency improvements. No equity requirement.

Disabled veteran discount: Veterans with a 30% or greater service-connected disability rating receive a 0.50% interest rate discount on all VLB loans.

Eligibility:
• Served 90+ days active duty (not including training)
• Texas as home of record OR current Texas resident at application
• Honorable discharge

How to apply: VLB loans are originated through participating banks — see the approved lender list at vlb.texas.gov. The state underwrites/subsidizes; lenders process.

Source: Texas General Land Office — https://vlb.texas.gov/`,
    },

    {
      source: 'tx-comal-county-appraisal',
      category: 'state',
      content: `Comal County Appraisal District — Filing Disabled Veteran Property Tax Exemptions

Comal County disabled veterans file Form 50-135 with the Comal Appraisal District (not the tax assessor-collector).

Comal Appraisal District
900 S. Seguin Ave., New Braunfels, TX 78130
Phone: 830-625-8597
Website: https://www.comalad.org/

Documents required:
• Completed Form 50-135 ("Application for Disabled Veteran's or Survivor's Exemptions")
• VA award letter or Summary of Benefits Letter showing current disability rating AND effective date
• Texas driver's license or ID matching the homestead address (for the § 11.131 total exemption)

For the 100% P&T total homestead exemption (Texas Tax Code § 11.131): the VA letter MUST state "100% service-connected permanent and total" or show TDIU with permanent and total designation. A plain 100% schedular rating without P&T does not qualify for § 11.131.

Filing:
• One-time filing; the exemption automatically renews each year if the rating and address don't change
• Filing deadline: April 30 of the tax year
• Late filings accepted up to 5 years after the delinquency date under § 11.439
• If rating increases mid-year, file an updated application to get the higher tier retroactively (within allowed window)

Neighboring counties (for veterans near Comal borders):
• Hays County AD — https://www.hayscad.com/ (San Marcos, Wimberley, Kyle)
• Guadalupe County AD — https://www.guadalupead.org/ (Seguin, Schertz east of Cibolo)
• Bexar County AD — https://www.bcad.org/ (San Antonio, Bulverde-area south)
• Canyon Lake residents are in Comal County (not Hays or Blanco).`,
    },
  ]
}

// Back-compat: commonly imported top-level constant. The sync job may replace
// `comp` with live-fetched values before calling the builder; this export uses
// the committed defaults from va-rates.ts.
export const VA_KNOWLEDGE_CHUNKS: KnowledgeChunk[] = buildKnowledgeChunks({
  comp:             COMPENSATION_RATES,
  smc:              SMC_RATES,
  dic:              DIC_RATES,
  education:        EDUCATION_RATES,
  loans:            LOAN_LIMITS,
  texasPropertyTax: TEXAS_PROPERTY_TAX,
})
