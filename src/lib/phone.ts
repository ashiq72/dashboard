export const normalizePhone = (value: string): string => value.trim()
  .replace(/[০-৯]/g, (digit) => String(digit.charCodeAt(0) - 0x09e6))
  .replace(/[\s()-]/g, "")
  .replace(/^(?:\+880|00880|880)(?=1)/, "0");
