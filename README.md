// src/hooks/useDeleteSurvey.ts
import { useState } from 'react';
import apiClient from '../api/apiClient';

// Тип для функции обратного вызова после удаления
type OnDeleteCallback = (id: string) => void;

export const useDeleteSurvey = (onDeleteSuccess?: OnDeleteCallback) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteSurvey = async (id: string): Promise<boolean> => {
    if (!id) {
      setError('ID анкеты не указан');
      return false;
    }

    setIsDeleting(true);
    setError(null);

    try {
      await apiClient.delete(`/questionnaire/${id}`);
      // Успешно удалено — вызываем колбэк
      if (onDeleteSuccess) {
        onDeleteSuccess(id);
      }
      return true;
    } catch (err: any) {
      const message =
        err.response?.data?.message || err.message || 'Неизвестная ошибка';
      console.error('Ошибка при удалении анкеты:', message);
      setError(message);
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    deleteSurvey,
    isDeleting,
    error,
  };
};
