// Refleja Contracts/PagedResult.cs (envoltorio genérico de listados paginados en servidor).
export interface PagedResult<T> {
  items: T[];
  totalCount: number;
}
