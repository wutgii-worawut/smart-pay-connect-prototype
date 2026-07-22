/**
 * features/leave/components/LeaveForm.tsx — ฟอร์มสร้างใบลา (จอ 6.1/6.2, feature-plans/03 §3.6, P16
 * "หน้าที่หนักสุดของ feature") RHF + Zod v4 เป็นด่านเข้ม (§16.3) — ฟอร์มนี้เป็นเจ้าของ
 * `useForm` (register/control/setError) ทั้งหมด แต่มูเทชัน `useSubmitLeave()` ถูกยกไปเรียกที่
 * `LeaveFormPage` ตาม spec P16 ("page hosts ... the mutation") — สื่อสารกันผ่าน prop `isPending` +
 * `submitError` (=`.error` ของมูเทชันฝั่ง page) แล้ว sync กลับเข้า field ของฟอร์มด้วย `useEffect`
 * ด้านล่าง แทนที่ฟอร์มจะเรียกมูเทชันเอง (ต่างจาก `RegisterForm` ที่เรียก `useRequestOtp()` เอง —
 * เพราะ spec ของเฟสนี้ระบุชัดว่า data-fetching+มูเทชันอยู่ที่ page, ฟอร์มรับผ่าน props)
 *
 * error mapping (§20, testing.md DoD):
 * - `QUOTA_EXCEEDED` → `setError('dateRange', ...)` (โชว์ตรงช่องวันที่/ช่วงเวลา ไม่ toast ทั่วไป)
 * - `VALIDATION_ERROR` → `setError('root', ...)` โชว์เหนือปุ่มส่ง (backend ยังไม่ระบุ field ละเอียด
 *   จึงไม่ผูกกับ field เฉพาะ)
 * - code อื่น (`NETWORK_ERROR` ฯลฯ) → toast ด้วย `ApiError.message` (ไทยอยู่แล้ว §16.1)
 *
 * ⚠️ [worker decision] PNG 6.1/6.2 โชว์ "ลาพักร้อน" (การ์ดแรก) ถูกเลือกไว้แล้วเป็นตัวอย่างในภาพ —
 * ตัดสินใจ**ไม่ preselect ค่าเริ่มต้นจริงในฟอร์ม** (เริ่มว่าง ให้ผู้ใช้กดเลือกเอง) เพื่อให้ validation
 * "required" ของประเภทลาทดสอบผ่าน UI ได้จริงตามที่ testing.md DoD ต้องการ — ถือเป็น deviation จาก
 * state ตัวอย่างในภาพ ไม่ใช่การเพิ่ม flow ใหม่
 *
 * "ผู้ปฏิบัติงานแทน" (`proxyId` — RHF field name ภายใน) **ไม่บังคับ** (ผู้ใช้เคาะ 2026-07-22: ตรงกับ
 * `substituteId?` ใน §16.3) — เก็บเป็น `''` เมื่อยังไม่เลือก/เลือก "ไม่ระบุ" แล้ว map เป็น
 * `substituteId` ใน payload เฉพาะตอนมีค่าเท่านั้น (omit key ทั้งอันถ้าไม่ได้เลือก — ดู
 * `handleFormSubmit` ด้านล่าง) `SelectField` เป็น Radix Select ที่ไม่มีปุ่ม "ล้างค่า" ในตัว จึงเติม
 * option สมมติ "ไม่ระบุ" (`NO_PROXY_OPTION_VALUE`) ไว้ให้กดกลับไปว่างได้หลังเคยเลือกคนอื่นแล้ว
 *
 * การซิงก์ `days[]` กับช่วงวันที่: เมื่อ `dateRange`/`holidays` เปลี่ยน คำนวณ `workingDates` ใหม่ผ่าน
 * `listLeaveWorkingDays` แล้ว reconcile `days` — คงค่า period เดิมของวันที่ยังอยู่ในช่วง, วันใหม่ตั้ง
 * default 'full', วันที่หลุดช่วงตัดทิ้ง (ไม่ใช้ `useFieldArray` เพราะ key คือวันที่ ไม่ใช่ index คงที่)
 */
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { DateRangeField } from '@/components/DateRangeField'
import { PrimaryButton } from '@/components/PrimaryButton'
import { SelectField } from '@/components/SelectField'
import { Textarea } from '@/components/Textarea'
import { toastError } from '@/components/toast'
import type { ApiError } from '@/lib/api-client'
import { listLeaveWorkingDays } from '@/utils/date'
import type {
  LeaveBalance,
  LeaveCreatePayload,
  LeaveDayEntry,
  LeaveType,
  Teammate,
} from '@/types/leave'
import { AttachmentDropzone } from './AttachmentDropzone'
import { LeavePeriodSection } from './LeavePeriodSection'
import { LeaveTypeCard } from './LeaveTypeCard'
import { buildLeaveFormSchema, type LeaveFormValues } from '../utils/leaveFormSchema'

const LEAVE_TYPES: LeaveType[] = ['vacation', 'sick', 'personal']

/** sentinel value ของตัวเลือก "ไม่ระบุ" ใน Select ผู้ปฏิบัติงานแทน — Radix Select.Item ห้ามใช้ value
 * เป็น string ว่าง จึงต้องมี sentinel แล้วแปลงกลับเป็น '' ตอน onValueChange (ดูคอมเมนต์หัวไฟล์) */
const NO_PROXY_OPTION_VALUE = '__no_proxy__'

interface LeaveFormProps {
  balances: LeaveBalance[]
  holidays: string[]
  teammates: Teammate[]
  approverName: string
  isPending: boolean
  submitError: ApiError | null
  onSubmit: (payload: LeaveCreatePayload) => void
}

function remainingByType(balances: LeaveBalance[], type: LeaveType): number | undefined {
  return balances.find((b) => b.type === type)?.remaining
}

function SectionHeading({ step, title }: { step: number; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-success text-sm font-bold text-white">
        {step}
      </span>
      <h2 className="text-base font-semibold text-primary-dark">{title}</h2>
    </div>
  )
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M5 13l4 4L19 7" />
    </svg>
  )
}

export function LeaveForm({
  balances,
  holidays,
  teammates,
  approverName,
  isPending,
  submitError,
  onSubmit,
}: LeaveFormProps) {
  const schema = useMemo(() => buildLeaveFormSchema(holidays), [holidays])

  const {
    control,
    register,
    handleSubmit,
    setError,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<LeaveFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: null,
      dateRange: null,
      days: [],
      reason: '',
      attachments: [],
      proxyId: '',
    },
  })

  // useWatch (ไม่ใช่ watch() ตรง ๆ) — ให้ React Compiler memoize component นี้ได้ปกติ (watch() คืน
  // ฟังก์ชันที่ compiler มองว่า memoize ไม่ได้ปลอดภัย ดู react-hooks/incompatible-library)
  const dateRangeValue = useWatch({ control, name: 'dateRange' })
  const selectedType = useWatch({ control, name: 'type' })
  const days = useWatch({ control, name: 'days' })

  const workingDates = useMemo(
    () => (dateRangeValue ? listLeaveWorkingDays(dateRangeValue.start, dateRangeValue.end, holidays) : []),
    [dateRangeValue, holidays],
  )

  // reconcile days[] กับ workingDates ทุกครั้งที่ช่วงวันที่/วันหยุดเปลี่ยน — คงค่า period เดิมของวันที่
  // ยังอยู่ในช่วง, ตั้ง default 'full' ให้วันใหม่ — getValues/setValue เป็น ref คงที่จาก RHF (ไม่ทำให้
  // effect วนซ้ำ), จงใจไม่ใส่ `days`/`watch('days')` ใน deps กันลูปตัวเอง
  useEffect(() => {
    const existing = new Map(getValues('days').map((d) => [d.date, d.period]))
    const next: LeaveDayEntry[] = workingDates.map((date) => ({
      date,
      period: existing.get(date) ?? 'full',
    }))
    setValue('days', next, { shouldValidate: false })
  }, [workingDates, getValues, setValue])

  useEffect(() => {
    if (!submitError) return
    if (submitError.code === 'QUOTA_EXCEEDED') {
      setError('dateRange', { message: submitError.message })
      return
    }
    if (submitError.code === 'VALIDATION_ERROR') {
      setError('root', { message: submitError.message })
      return
    }
    toastError(submitError.message)
  }, [submitError, setError])

  function handleFormSubmit(values: LeaveFormValues) {
    // ผ่าน Zod (superRefine) มาแล้ว type/dateRange ต้องไม่ null — กันไว้เผื่อ TS แคบชนิดไม่ได้เอง
    if (!values.type || !values.dateRange) return
    const payload: LeaveCreatePayload = {
      leaveType: values.type,
      days: values.days,
      reason: values.reason,
      attachments: values.attachments,
      // proxyId ว่าง ('' = ไม่ได้เลือก/เลือก "ไม่ระบุ") → omit key substituteId ทั้งอัน ไม่ส่ง '' หรือ
      // undefined ขึ้นไปตรง ๆ (ตรง §16.3 `substituteId?`)
      ...(values.proxyId ? { substituteId: values.proxyId } : {}),
    }
    onSubmit(payload)
  }

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      noValidate
      className="flex flex-col gap-6 px-4 pt-4 pb-[calc(2rem+env(safe-area-inset-bottom))]"
    >
      <h1 className="text-lg font-semibold text-primary-dark">ขออนุมัติลา</h1>

      <section className="flex flex-col gap-3">
        <SectionHeading step={1} title="ประเภทการลา" />
        <div role="radiogroup" aria-label="ประเภทการลา" className="flex flex-col gap-3">
          {LEAVE_TYPES.map((type) => (
            <LeaveTypeCard
              key={type}
              type={type}
              remaining={remainingByType(balances, type)}
              selected={selectedType === type}
              onSelect={() => setValue('type', type, { shouldValidate: true })}
            />
          ))}
        </div>
        {errors.type ? <p className="text-sm text-danger">{errors.type.message}</p> : null}
      </section>

      <section className="flex flex-col gap-3">
        <SectionHeading step={2} title="ช่วงวันที่ลา" />
        <Controller
          name="dateRange"
          control={control}
          render={({ field, fieldState }) => (
            <DateRangeField
              name={field.name}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
            />
          )}
        />
        <LeavePeriodSection
          dateRange={dateRangeValue}
          days={days}
          holidays={holidays}
          onDaysChange={(next) => setValue('days', next, { shouldValidate: true })}
        />
      </section>

      <section className="flex flex-col gap-3">
        <SectionHeading step={3} title="เหตุผลการลา" />
        <Textarea
          placeholder="ระบุเหตุผล เช่น เดินทางต่างจังหวัดกับครอบครัว"
          error={errors.reason?.message}
          {...register('reason')}
        />
      </section>

      <section className="flex flex-col gap-3">
        <SectionHeading step={4} title="แนบเอกสาร (ถ้ามี)" />
        <Controller
          name="attachments"
          control={control}
          render={({ field }) => <AttachmentDropzone files={field.value} onChange={field.onChange} />}
        />
      </section>

      <div className="flex flex-col gap-4">
        <Controller
          name="proxyId"
          control={control}
          render={({ field, fieldState }) => (
            <SelectField
              label="ผู้ปฏิบัติงานแทน (ถ้ามี)"
              placeholder="เลือกผู้ปฏิบัติงานแทน"
              options={[
                { value: NO_PROXY_OPTION_VALUE, label: 'ไม่ระบุ' },
                ...teammates.map((t) => ({ value: t.id, label: t.name })),
              ]}
              value={field.value === '' ? undefined : field.value}
              onValueChange={(next) =>
                field.onChange(next === NO_PROXY_OPTION_VALUE ? '' : next)
              }
              onBlur={field.onBlur}
              name={field.name}
              error={fieldState.error?.message}
            />
          )}
        />

        <SelectField
          id="approverName"
          label="ผู้อนุมัติ"
          options={[{ value: approverName, label: approverName }]}
          value={approverName}
          onValueChange={() => undefined}
          disabled
        />
      </div>

      {errors.root?.message ? <p className="text-sm text-danger">{errors.root.message}</p> : null}

      <PrimaryButton type="submit" icon={<CheckIcon />} isPending={isPending} pendingText="กำลังส่ง...">
        ส่งคำขอลา
      </PrimaryButton>
    </form>
  )
}
