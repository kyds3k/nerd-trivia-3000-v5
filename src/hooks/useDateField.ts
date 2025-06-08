"use client";

import { parseDate } from "@internationalized/date";
import type { DateValue } from "@react-types/datepicker";

/**
 * Hook to manage a CalendarDate field stored as a string
 */
export function useDateField(
  value: string | null,
  setValue: (val: string) => void
): { parsedDate: DateValue | null; onDateChange: (val: DateValue | null) => void } {
  return {
    parsedDate: typeof value === "string" ? (parseDate(value) as DateValue) : null,
    onDateChange: (newDate: DateValue | null) => {
      if (newDate) {
        setValue(newDate.toString());
      }
    },
  };
}
