'use client'

import { useState } from 'react'
import { Lock } from 'lucide-react'
import ClosePeriodModal from './ClosePeriodModal'

export default function ClosePeriodButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:opacity-90 transition-opacity font-medium text-sm"
      >
        <Lock size={16} />
        Close Period
      </button>

      {isOpen && <ClosePeriodModal onClose={() => setIsOpen(false)} />}
    </>
  )
}
