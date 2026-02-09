
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, Session, UserRole, User } from '../utils/auth';

interface AuthContextType {
    session: Session;
    login: (identifier: string, password: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
    signup: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    awardTokens: (email: string, amount: number) => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session>(authService.getSession());
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Sync session on mount/tab change
        const syncSession = () => {
            setSession(authService.getSession());
        };
        window.addEventListener('storage', syncSession);
        return () => window.removeEventListener('storage', syncSession);
    }, []);

    const login = async (identifier: string, password: string, role: UserRole) => {
        setIsLoading(true);
        // Artificial delay for realism
        await new Promise(resolve => setTimeout(resolve, 800));

        const result = authService.login(identifier, password, role);
        if (result.success) {
            setSession(authService.getSession());
        }
        setIsLoading(false);
        return { success: result.success, error: result.error };
    };

    const signup = async (email: string, password: string) => {
        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 800));

        const result = authService.signup(email, password);
        setIsLoading(false);
        return result;
    };

    const logout = () => {
        authService.logout();
        setSession({ isAuthenticated: false, user: null });
    };

    const awardTokens = (email: string, amount: number) => {
        authService.awardTokens(email, amount);
        setSession(authService.getSession());
    };

    return (
        <AuthContext.Provider value={{ session, login, signup, logout, awardTokens, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
