'use client'

import { useState } from 'react';

type ConfirmationDialogOptions = {
  cancelLabel?: string;
  confirmLabel?: string;
  message: string;
  onConfirm: () => Promise<void> | void;
  title?: string;
  tone?: 'danger' | 'neutral';
};

export function useConfirmationDialog() {
  const [confirmation, setConfirmation] = useState<ConfirmationDialogOptions | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const askForConfirmation = (options: ConfirmationDialogOptions) => {
    setConfirmation(options);
  };

  const closeConfirmation = () => {
    if (isConfirming) {
      return;
    }

    setConfirmation(null);
  };

  const confirm = async () => {
    if (!confirmation) {
      return;
    }

    setIsConfirming(true);

    try {
      await confirmation.onConfirm();
      setConfirmation(null);
    } finally {
      setIsConfirming(false);
    }
  };

  return {
    askForConfirmation,
    closeConfirmation,
    confirm,
    confirmation,
    isConfirming,
  };
}
