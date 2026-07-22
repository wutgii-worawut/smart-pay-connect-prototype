import { describe, expect, it } from 'vitest'
import { formatFileSize, isAllowedAttachmentFile } from './attachment'

describe('isAllowedAttachmentFile', () => {
  it('รับ .pdf', () => {
    expect(isAllowedAttachmentFile('ใบจองที่พัก.pdf')).toBe(true)
  })

  it('รับ .jpg / .jpeg / .png', () => {
    expect(isAllowedAttachmentFile('photo.jpg')).toBe(true)
    expect(isAllowedAttachmentFile('photo.jpeg')).toBe(true)
    expect(isAllowedAttachmentFile('photo.png')).toBe(true)
  })

  it('ไม่สนตัวพิมพ์เล็ก-ใหญ่ของนามสกุล', () => {
    expect(isAllowedAttachmentFile('SCAN.PDF')).toBe(true)
  })

  it('ปฏิเสธนามสกุลอื่น เช่น .docx / .exe', () => {
    expect(isAllowedAttachmentFile('resume.docx')).toBe(false)
    expect(isAllowedAttachmentFile('virus.exe')).toBe(false)
  })

  it('ไฟล์ไม่มีนามสกุล → ปฏิเสธ', () => {
    expect(isAllowedAttachmentFile('noextension')).toBe(false)
  })
})

describe('formatFileSize', () => {
  it('ต่ำกว่า 1024 ไบต์ → "B"', () => {
    expect(formatFileSize(500)).toBe('500 B')
  })

  it('ระดับ KB → ปัดเศษไม่มีทศนิยม', () => {
    expect(formatFileSize(122880)).toBe('120 KB')
  })

  it('ระดับ MB → ทศนิยม 1 ตำแหน่ง', () => {
    expect(formatFileSize(1572864)).toBe('1.5 MB')
  })
})
