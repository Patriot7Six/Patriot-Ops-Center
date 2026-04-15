import Link from 'next/link'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-navy-950 border-t border-navy-800">
      <div className="max-w-7xl mx-auto px-6 pt-12 pb-8">

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-10">

          {/* Brand col — real logo + tagline + VOB badge */}
          <div className="md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-3 no-underline">
              <img src="/logo.svg" alt="Patriot Ops Center logo" className="h-12 w-12 object-contain" />
              <span className="font-extrabold text-base tracking-widest uppercase text-navy-50">
                Patriot <span className="text-gold-500">Ops</span> Center
              </span>
            </Link>
            <p className="text-xs text-navy-400 leading-relaxed max-w-[280px] mt-3">
              AI-powered transition support for every veteran — from first conversation about separation to a thriving civilian career. Built by veterans, for veterans.
            </p>
            {/* VOB badge — verified veteran-owned business */}
            <div className="mt-5">
              <img
                src="/vob-logo.png"
                alt="Verified Veteran-Owned Business — Texas Veterans Commission"
                title="Verified Veteran-Owned Business by the Texas Veterans Commission"
                className="h-20 w-20 object-contain opacity-90 hover:opacity-100 transition-opacity"
              />
            </div>
          </div>

          {/* Platform links */}
          <div>
            <h4 className="text-xs font-bold tracking-widest uppercase text-navy-400 mb-4">Platform</h4>
            <ul className="space-y-2 list-none">
              {[
                { href: '/#benefits',    label: 'Benefits Navigator' },
                { href: '/#benefits',    label: 'Claims Copilot'     },
                { href: '/#timeline',    label: 'Transition Timeline' },
                { href: '/#employment',  label: 'Employment Tools'   },
                { href: '/#employment',  label: 'Job Board'          },
                { href: '/#employment',  label: 'Clearance Market'   },
              ].map(l => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm text-navy-300 hover:text-gold-400 transition-colors no-underline">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Organizations links */}
          <div>
            <h4 className="text-xs font-bold tracking-widest uppercase text-navy-400 mb-4">Organizations</h4>
            <ul className="space-y-2 list-none">
              {[
                { href: '/#organizations', label: 'VSO Partners'   },
                { href: '/#organizations', label: 'Legal & Claims' },
                { href: '/#organizations', label: 'TAP Programs'   },
                { href: '/#organizations', label: 'Employers'      },
                { href: '/#organizations', label: 'Request Demo'   },
              ].map(l => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm text-navy-300 hover:text-gold-400 transition-colors no-underline">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company links */}
          <div>
            <h4 className="text-xs font-bold tracking-widest uppercase text-navy-400 mb-4">Company</h4>
            <ul className="space-y-2 list-none">
              {[
                { href: '/about',   label: 'About'          },
                { href: '/blog',    label: 'Blog'           },
                { href: '/pricing', label: 'Pricing'        },
                { href: '/privacy', label: 'Privacy Policy' },
                { href: '/terms',   label: 'Terms of Service' },
                { href: '/contact', label: 'Contact'        },
              ].map(l => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm text-navy-300 hover:text-gold-400 transition-colors no-underline">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div className="pt-6 border-t border-navy-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-navy-500">
            © {year} Patriot Ops Center. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-xs text-navy-500">
            <svg
              viewBox="0 0 19 10"
              aria-hidden="true"
              className="h-[14px] w-[26px] shrink-0 rounded-[1px] ring-1 ring-black/20"
            >
              <rect width="19" height="10" fill="#B22234" />
              <g fill="#fff">
                <rect y="0.77" width="19" height="0.77" />
                <rect y="2.31" width="19" height="0.77" />
                <rect y="3.85" width="19" height="0.77" />
                <rect y="5.38" width="19" height="0.77" />
                <rect y="6.92" width="19" height="0.77" />
                <rect y="8.46" width="19" height="0.77" />
              </g>
              <rect width="7.6" height="5.38" fill="#3C3B6E" />
            </svg>
            <span>Built with pride for those who served</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
