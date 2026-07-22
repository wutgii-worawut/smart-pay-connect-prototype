import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AttendanceHistoryList } from './AttendanceHistoryList'
import type { AttendanceHistoryDay } from '../types/attendance'

const DAYS: AttendanceHistoryDay[] = [
  {
    date: '2025-10-09',
    entries: [
      { direction: 'clock-in', time: '08:12', status: 'late', clockType: 'onsite', location: 'บริษัท คอมพิวเตอร์ จำกัด' },
      { direction: 'clock-out', time: '17:05', status: 'normal', clockType: 'onsite', location: 'บริษัท คอมพิวเตอร์ จำกัด' },
    ],
  },
]

describe('AttendanceHistoryList', () => {
  it('แสดงหัวข้อวันที่แบบไทยและเวลาทั้งสองแถว', () => {
    render(<AttendanceHistoryList days={DAYS} />)

    expect(screen.getByText('9 ตุลาคม 2568')).toBeInTheDocument()
    expect(screen.getByText('08:12')).toBeInTheDocument()
    expect(screen.getByText('17:05')).toBeInTheDocument()
    expect(screen.getAllByText('บริษัท คอมพิวเตอร์ จำกัด')).toHaveLength(2)
  })

  it('แถว status:late มีข้อความ "มาสาย" และ status:normal มีข้อความ "ปกติ" (ไม่พึ่งสีอย่างเดียว)', () => {
    render(<AttendanceHistoryList days={DAYS} />)

    expect(screen.getByText('(มาสาย)')).toBeInTheDocument()
    expect(screen.getByText('(ปกติ)')).toBeInTheDocument()
  })
})
