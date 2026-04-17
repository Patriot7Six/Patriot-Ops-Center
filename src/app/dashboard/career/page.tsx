'use client'
import { useState } from 'react'
import { FeatureGate } from '@/components/FeatureGate'
import { MOSMapper } from '@/components/MOSMapper'
import { ResumeAnalyzer } from '@/components/ResumeAnalyzer'
import { CareerChat } from '@/components/CareerChat'

type Tab = 'mos' | 'resume' | 'chat'

const TABS: { id: Tab; label: string; description: string }[] = [
  {
    id: 'mos',
    label: 'MOS Mapper',
    description: 'Translate your military role into civilian job titles, industries, and salary ranges.',
  },
  {
    id: 'resume',
    label: 'Resume Analyzer',
    description: 'Get specific feedback on translating your military experience for civilian employers.',
  },
  {
    id: 'chat',
    label: 'Career Advisor',
    description: 'Open-ended AI coaching on networking, interviews, education, and job search strategy.',
  },
]

export default function CareerPage() {
  const [activeTab, setActiveTab] = useState<Tab>('mos')

  return (
    <div className="flex-1 overflow-y-auto">
      <header className="h-16 border-b border-white/[0.06] px-6 lg:px-8 flex items-center shrink-0">
        <div>
          <h1 className="text-white font-semibold">Career Transition Toolkit</h1>
          <p className="text-xs text-slate-500">AI-powered tools to launch your civilian career</p>
        </div>
      </header>

      <div className="p-6 lg:p-8 max-w-4xl">
        <FeatureGate feature="career_toolkit">
          <div className="space-y-6">
            {/* Tab bar */}
            <div className="flex gap-1 p-1 bg-white/5 rounded-xl">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-gold-500 text-navy-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <p className="text-xs text-slate-500 -mt-2">
              {TABS.find(t => t.id === activeTab)?.description}
            </p>

            {activeTab === 'mos'    && <MOSMapper />}
            {activeTab === 'resume' && <ResumeAnalyzer />}
            {activeTab === 'chat'   && <CareerChat />}
          </div>
        </FeatureGate>
      </div>
    </div>
  )
}
