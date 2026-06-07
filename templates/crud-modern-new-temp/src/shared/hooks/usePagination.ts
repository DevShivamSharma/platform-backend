import { useState, useCallback, useMemo } from "react";

interface PaginationState {
  page: number;
  totalPages: number;
  totalRecords: number;
}

interface UsePaginationReturn {
  page: number;
  totalPages: number;
  totalRecords: number;
  setPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  updateFromResponse: (totalPages: number, totalRecords: number) => void;
  canGoNext: boolean;
  canGoPrev: boolean;
}

export function usePagination(initialPage = 1): UsePaginationReturn {
  const [state, setState] = useState<PaginationState>({
    page: initialPage,
    totalPages: 1,
    totalRecords: 0,
  });

  const setPage = useCallback((page: number) => {
    setState((prev) => ({ ...prev, page }));
  }, []);

  const nextPage = useCallback(() => {
    setState((prev) =>
      prev.page < prev.totalPages
        ? { ...prev, page: prev.page + 1 }
        : prev
    );
  }, []);

  const prevPage = useCallback(() => {
    setState((prev) =>
      prev.page > 1 ? { ...prev, page: prev.page - 1 } : prev
    );
  }, []);

  const updateFromResponse = useCallback(
    (totalPages: number, totalRecords: number) => {
      setState((prev) => ({ ...prev, totalPages, totalRecords }));
    },
    []
  );

  const canGoNext = useMemo(() => state.page < state.totalPages, [state.page, state.totalPages]);
  const canGoPrev = useMemo(() => state.page > 1, [state.page]);

  return {
    ...state,
    setPage,
    nextPage,
    prevPage,
    updateFromResponse,
    canGoNext,
    canGoPrev,
  };
}
