// Structured VA rate tables — the single source of truth for dollar amounts.
// All chunk content in va-data.ts is generated from these values; no rate is
// hardcoded in prose. The weekly sync job in trigger/jobs/knowledge-sync.ts
// calls the va-rate-fetcher before embedding chunks, so if these values drift
// from va.gov the fetcher auto-corrects and logs a drift warning.
//
// Annual update: when the VA announces the new COLA each December, edit this
// file only. Never edit dollar amounts elsewhere.

export type CompRateTable = Record<number, number>  // rating % → monthly USD

export interface CompensationRates {
  rate_year:                 string    // e.g. 'FY2026'
  effective_date:            string    // e.g. 'December 1, 2025'
  cola_pct:                  string    // e.g. '2.8%'
  source_url:                string
  no_deps:                   CompRateTable
  with_spouse:               CompRateTable
  with_spouse_and_one_child: CompRateTable
}

// Effective December 1, 2025 — 2.8% COLA (SSA announced 2025-10-24).
// Source of truth: https://www.va.gov/disability/compensation-rates/veteran-rates/
export const COMPENSATION_RATES: CompensationRates = {
  rate_year:      'FY2026',
  effective_date: 'December 1, 2025',
  cola_pct:       '2.8%',
  source_url:     'https://www.va.gov/disability/compensation-rates/veteran-rates/',

  no_deps: {
    10:  180.42,
    20:  356.66,
    30:  552.47,
    40:  795.84,
    50:  1132.90,
    60:  1435.02,
    70:  1808.45,
    80:  2102.15,
    90:  2362.30,
    100: 3938.58,
  },

  with_spouse: {
    30:  617.47,
    40:  882.84,
    50:  1241.90,
    60:  1566.02,
    70:  1961.45,
    80:  2277.15,
    90:  2559.30,
    100: 4158.17,
  },

  with_spouse_and_one_child: {
    30:  666.47,
    40:  947.84,
    50:  1322.90,
    60:  1663.02,
    70:  2074.45,
    80:  2406.15,
    90:  2704.30,
    100: 4318.99,
  },
}

export interface SMCRates {
  effective_date:  string
  source_url:      string
  k_amount:        number   // added on top of basic rating
  l_veteran_alone: number
  s_housebound:    number
}

export const SMC_RATES: SMCRates = {
  effective_date:  'December 1, 2025',
  source_url:      'https://www.va.gov/disability/compensation-rates/special-monthly-compensation-rates/',
  k_amount:        139.87,
  l_veteran_alone: 4900.83,
  s_housebound:    4408.53,
}

export interface DICRates {
  effective_date:                  string
  source_url:                      string
  surviving_spouse_base:           number
  per_dependent_child_under_18:    number
  transitional_first_2_years:      number
  aid_and_attendance_added:        number
}

export const DIC_RATES: DICRates = {
  effective_date:               'December 1, 2025',
  source_url:                   'https://www.va.gov/disability/survivor-dic-rates/',
  surviving_spouse_base:        1699.36,
  per_dependent_child_under_18: 421.00,
  transitional_first_2_years:   359.00,
  aid_and_attendance_added:     421.00,
}

export interface EducationRates {
  academic_year:              string
  source_url:                 string
  private_school_tuition_cap: number
}

export const EDUCATION_RATES: EducationRates = {
  academic_year:              '2026-2027',
  source_url:                 'https://www.va.gov/education/benefit-rates/post-9-11-gi-bill-rates/',
  private_school_tuition_cap: 30908.34,
}

export interface LoanLimits {
  year:              string
  source_url:        string
  baseline:          number
  high_cost_ceiling: number
}

export const LOAN_LIMITS: LoanLimits = {
  year:              '2026',
  source_url:        'https://www.fhfa.gov/news/news-release/fhfa-announces-conforming-loan-limit-values-for-2026',
  baseline:          832750,
  high_cost_ceiling: 1249125,
}

// Texas-specific benefit amounts. Statutory tiers change by legislative act,
// not annually — but keep them here alongside federal rates so the update path
// is uniform. Source: Texas Tax Code §§ 11.22, 11.131.
export interface TexasPropertyTaxTiers {
  source_url:                      string
  tier_10_29:                      number
  tier_30_49:                      number
  tier_50_69:                      number
  tier_70_100:                     number
  age_65_plus_or_qualifying_loss:  number   // flat amount regardless of rating
  total_100_pt_exemption:          boolean  // full homestead exemption under §11.131
}

export const TEXAS_PROPERTY_TAX: TexasPropertyTaxTiers = {
  source_url:                     'https://comptroller.texas.gov/taxes/property-tax/exemptions/disabledvet-faq.php',
  tier_10_29:                     5000,
  tier_30_49:                     7500,
  tier_50_69:                     10000,
  tier_70_100:                    12000,
  age_65_plus_or_qualifying_loss: 12000,
  total_100_pt_exemption:         true,
}

// ── Staleness detection ──────────────────────────────────────────────────────

// Month-age of COMPENSATION_RATES.effective_date relative to now. Used by the
// sync job: if > 14 months and the live fetcher can't verify against va.gov,
// the job fails loudly instead of pushing ancient rates to production.
export function compensationRatesAgeMonths(now: Date = new Date()): number {
  const effective = new Date(COMPENSATION_RATES.effective_date)
  if (isNaN(effective.getTime())) return Number.POSITIVE_INFINITY
  return (now.getFullYear() - effective.getFullYear()) * 12
       + (now.getMonth()    - effective.getMonth())
}

export function ratesAreStale(now?: Date): boolean {
  return compensationRatesAgeMonths(now) > 14
}

// ── Formatting ────────────────────────────────────────────────────────────────

export function usd(n: number): string {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function usdWhole(n: number): string {
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 })
}
