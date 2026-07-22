import { authHandlers } from './auth'
import { attendanceHandlers } from './attendance'
import { leaveHandlers } from './leave'
import { employeesHandlers } from './employees'
import { approvalHandlers } from './approval'
import { payrollHandlers } from './payroll'
import { calendarHandlers } from './calendar'

export const handlers = [
  ...authHandlers,
  ...attendanceHandlers,
  ...leaveHandlers,
  ...employeesHandlers,
  ...approvalHandlers,
  ...payrollHandlers,
  ...calendarHandlers,
]
