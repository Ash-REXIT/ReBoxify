export type UserRole = 'user' | 'company' | 'partner' | 'admin';

export interface User {
    id: string;
    email: string;
    role: UserRole;
    greenTokens: number;
    details?: Record<string, any>;
}

export interface Session {
    isAuthenticated: boolean;
    user: User | null;
    token?: string;
}

class AuthService {
    private SESSION_STORAGE_KEY = 'reboxify_session';
    private API_URL = 'http://localhost:5000/api/auth';

    constructor() {
    }

    public async signup(email: string, password: string, role: UserRole = 'user', details?: any): Promise<{ success: boolean, error?: string }> {
        try {
            const res = await fetch(`${this.API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, role, details })
            });
            const data = await res.json();
            if (!res.ok) return { success: false, error: data.message };

            this.createSession(data.user, data.token);
            return { success: true };
        } catch (e) {
            return { success: false, error: 'Network error' };
        }
    }

    public async login(identifier: string, password: string, expectedRole: UserRole): Promise<{ success: boolean, user?: User, error?: string }> {
        try {
            const res = await fetch(`${this.API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: identifier, password }) // backend expects email
            });
            const data = await res.json();

            if (!res.ok) return { success: false, error: data.message };

            if (data.user.role !== expectedRole && expectedRole !== 'admin') {
                // Admin login page might check role separately, but here we enforce strict role if needed.
                // The original code passed 'expectedRole'. 
                if (data.user.role !== expectedRole) {
                    return { success: false, error: `Invalid access for role: ${expectedRole}` };
                }
            }

            this.createSession(data.user, data.token);
            return { success: true, user: data.user };
        } catch (e) {
            return { success: false, error: 'Network error' };
        }
    }

    private createSession(user: User, token: string) {
        const session: Session = {
            isAuthenticated: true,
            user,
            token
        };
        localStorage.setItem(this.SESSION_STORAGE_KEY, JSON.stringify(session));
    }

    public logout() {
        localStorage.removeItem(this.SESSION_STORAGE_KEY);
        // window.location.href = '/'; // optional
    }

    public async awardTokens(email: string, amount: number) {
        // TODO: Implement API endpoint for awarding tokens
        console.warn("awardTokens: API endpoint not implemented yet.");

        // Optimistic update for current session
        const session = this.getSession();
        if (session.user && session.user.email === email) {
            session.user.greenTokens = (session.user.greenTokens || 0) + amount;
            localStorage.setItem(this.SESSION_STORAGE_KEY, JSON.stringify(session));
            return true;
        }
        return false;
    }

    public getSession(): Session {
        const data = localStorage.getItem(this.SESSION_STORAGE_KEY);
        return data ? JSON.parse(data) : { isAuthenticated: false, user: null };
    }
}

export const authService = new AuthService();
