/** Department codes aligned with MCAET — https://mcaet.vercel.app/ */
export const DEPARTMENT_LABELS: Record<string, string> = {
  FMPE: 'Farm Machinery & Power Engineering',
  PFE: 'Processing & Food Engineering',
  SWCE: 'Soil & Water Conservation Engineering',
  IDE: 'Irrigation & Drainage Engineering',
  REE: 'Renewable Energy Engineering',
  BEAS: 'Basic Engineering & Applied Sciences',
  AE: 'Agricultural Engineering',
  ME: 'Mechanical Engineering',
  CSE: 'Computer Science & Engineering',
  CE: 'Civil Engineering',
  CHEM: 'Chemistry',
  MISC: 'Miscellaneous',
};

export function getDepartmentLabel(code: string): string {
  return DEPARTMENT_LABELS[code] ?? code;
}
