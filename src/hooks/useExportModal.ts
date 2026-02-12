import { useState, useCallback } from 'react';

interface ExportModalData {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export function useExportModal(): ExportModalData {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return { isOpen, open, close, toggle };
}
