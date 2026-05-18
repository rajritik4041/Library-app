/** Re-exports catalog service for backward compatibility */
export {
  DEPARTMENT_LABELS,
  getBOOKS,
  getBookById,
  getBooks,
  getBooksByDepartment,
  getBooksByRack,
  getCatalogMeta,
  getDepartmentLabel,
  getLibraryStats,
  getUniqueDepartments,
  getUniqueRacks,
  getUniqueSubjects,
  matchesRack,
  normalizeRack,
  searchBooks,
  searchBooksDetailed,
} from '@/services/catalog-service';
