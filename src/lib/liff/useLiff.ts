/**
 * lib/liff/useLiff.ts — hook consume สถานะ LIFF จาก LiffProvider
 */
import { useContext } from 'react'
import { LiffContext, type LiffState } from './liff-context'

export function useLiff(): LiffState {
  return useContext(LiffContext)
}
