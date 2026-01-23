import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const execute = useCallback(async (apiFunc, options = {}) => {
    const {
      showSuccessToast = false,
      successMessage = 'Operation successful',
      showErrorToast = true,
      onSuccess,
      onError,
    } = options;

    setLoading(true);
    setError(null);

    try {
      const response = await apiFunc();

      setData(response);
      setLoading(false);

      if (showSuccessToast) {
        toast.success(successMessage);
      }

      if (onSuccess) {
        onSuccess(response);
      }

      return { success: true, data: response };
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'An error occurred';
      setError(errorMessage);
      setLoading(false);

      if (showErrorToast) {
        toast.error(errorMessage);
      }

      if (onError) {
        onError(err);
      }

      return { success: false, error: errorMessage };
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return {
    loading,
    error,
    data,
    execute,
    reset,
  };
};

export default useApi;
