/** MongoDB-first helpers — re-exports for existing imports */
export { getDepartmentLabel, DEPARTMENT_LABELS } from '@/constants/departments';
export {
  deriveStatsFromBooks,
  uniqueDepartments,
  uniqueRacks,
  uniqueSubjects,
  findApiBookById,
  booksInDepartment,
  filterApiBooks,
  matchesRack,
} from '@/lib/api-books';
