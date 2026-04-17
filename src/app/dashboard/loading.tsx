export default function DashboardLoading() {
  return (
    <div className="flex-1 overflow-y-auto animate-pulse">
      {/* Top bar */}
      <div className="h-16 border-b border-white/[0.06] px-6 lg:px-8 flex items-center">
        <div className="h-4 w-28 bg-white/10 rounded-full" />
      </div>

      <div className="p-6 lg:p-8 space-y-8 max-w-5xl">
        {/* Welcome */}
        <div className="space-y-2">
          <div className="h-7 w-56 bg-white/10 rounded-full" />
          <div className="h-4 w-80 bg-white/5 rounded-full" />
        </div>

        {/* Section label */}
        <div className="h-3 w-24 bg-white/5 rounded-full" />

        {/* Quick action cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-5 space-y-3">
              <div className="w-11 h-11 rounded-xl bg-white/5" />
              <div className="h-4 w-36 bg-white/10 rounded-full" />
              <div className="space-y-1.5">
                <div className="h-3 w-full bg-white/5 rounded-full" />
                <div className="h-3 w-4/5 bg-white/5 rounded-full" />
              </div>
              <div className="h-3 w-20 bg-white/5 rounded-full" />
            </div>
          ))}
        </div>

        {/* Profile section */}
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6 grid grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="space-y-1.5">
              <div className="h-3 w-16 bg-white/5 rounded-full" />
              <div className="h-4 w-20 bg-white/10 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
