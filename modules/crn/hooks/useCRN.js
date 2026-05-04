import { useState } from 'react';
import { searchCRN, createCRN } from '../services/crn.service';
export function useCRN() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);
    const search = async (crn) => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await searchCRN(crn);
            setResult(data);
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Search failed');
        }
        finally {
            setLoading(false);
        }
    };
    const create = async (params) => {
        setLoading(true);
        setError(null);
        try {
            const record = await createCRN(params);
            setResult(record);
            return record;
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Creation failed');
            return null;
        }
        finally {
            setLoading(false);
        }
    };
    return { loading, error, result, search, create };
}
//# sourceMappingURL=useCRN.js.map