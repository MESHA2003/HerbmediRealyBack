import { useState, useEffect } from 'react';
import API from '../services/api';
import toast from 'react-hot-toast';

export const useApi = (url, options = { immediate: true }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await API.get(url);
            setData(res.data);
            setError(null);
        } catch (err) {
            setError(err);
            toast.error(err.response?.data?.detail || 'API error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (options.immediate) fetchData();
    }, [url]);

    return { data, loading, error, refetch: fetchData };
};