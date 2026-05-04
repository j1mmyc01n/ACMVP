import { createCRN } from '../services/crn.service';
import type { CRNRequest } from '@acmvp/types';
export declare function useCRN(): {
    loading: boolean;
    error: string | null;
    result: CRNRequest | null;
    search: (crn: string) => Promise<void>;
    create: (params: Parameters<typeof createCRN>[0]) => Promise<CRNRequest | null>;
};
//# sourceMappingURL=useCRN.d.ts.map