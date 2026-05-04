import { useState, useEffect } from 'react';
import { getSession, signOut, onAuthChange } from '../session';
export function useAuth() {
    const [state, setState] = useState({
        userId: null,
        email: null,
        role: null,
        loading: true,
    });
    useEffect(() => {
        getSession().then((session) => {
            setState({
                userId: session?.userId ?? null,
                email: session?.email ?? null,
                role: session?.role ?? null,
                loading: false,
            });
        });
        const { data: listener } = onAuthChange((_event, session) => {
            setState({
                userId: session?.userId ?? null,
                email: session?.email ?? null,
                role: session?.role ?? null,
                loading: false,
            });
        });
        return () => listener.subscription.unsubscribe();
    }, []);
    return {
        ...state,
        signOut,
        isAuthenticated: state.userId !== null,
    };
}
//# sourceMappingURL=useAuth.js.map