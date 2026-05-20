export const DEPARTMENT_LABELS: Record<string, string> = {
  FMPE: 'Fluid Mechanics & Power Engineering',
  PFE: 'Production & Industrial Engineering',
  SWCE: 'Soil & Water Conservation Engineering',
  IDE: 'Instrumentation & Data Engineering',
  REE: 'Renewable Energy Engineering',
  BEAS: 'Biological & Agricultural Sciences',
  ME: 'Mechanical Engineering',
  CSE: 'Computer Science & Engineering',
  CE: 'Civil Engineering',
  CHEM: 'Chemistry',
  MISC: 'Miscellaneous',
};

export function getDepartmentLabel(code: string): string {
  return DEPARTMENT_LABELS[code] ?? code;
}
