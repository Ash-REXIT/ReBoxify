
export type UserRole = 'user' | 'company' | 'partner' | 'admin';

export interface User {
    id: string;
    email: string;
    passwordHash: string;
    role: UserRole;
    greenTokens: number;
    details?: Record<string, any>;
}

export interface Session {
    isAuthenticated: boolean;
    user: Omit<User, 'passwordHash'> | null;
}

class AuthService {
    private USER_STORAGE_KEY = 'reboxify_vault_users';
    private SESSION_STORAGE_KEY = 'reboxify_session';

    constructor() {
        this.initializeDemoUsers();
    }

    private hashPassword(password: string): string {
        // Simple mock hashing for demo purposes
        return btoa(password).split('').reverse().join('');
    }

    private initializeDemoUsers() {
        const users = this.getUsers();
        const demoUsers: User[] = [
            { id: 'user-001', email: 'user@demo.com', passwordHash: this.hashPassword('password123'), role: 'user', greenTokens: 25 },
            { id: 'MNC-AMZ', email: 'MNC-AMZ', passwordHash: this.hashPassword('password123'), role: 'company', greenTokens: 0, details: { companyName: 'Amazon', companyId: 'MNC-AMZ' } },
            { id: 'MNC-FLK', email: 'MNC-FLK', passwordHash: this.hashPassword('password123'), role: 'company', greenTokens: 0, details: { companyName: 'Flipkart', companyId: 'MNC-FLK' } },
            { id: 'DLP-001', email: 'DLP-001', passwordHash: this.hashPassword('password123'), role: 'partner', greenTokens: 0, details: { zone: 'North-East' } },
            { id: 'SEC-ADMIN', email: 'super-admin', passwordHash: this.hashPassword('password123'), role: 'admin', greenTokens: 0 },
        ];

        // Ensure all demo users exist and are up to date
        demoUsers.forEach(u => {
            if (!users[u.email] || u.id.startsWith('MNC') || u.id.startsWith('DLP') || u.id === 'SEC-ADMIN') {
                users[u.email] = u;
            }
        });
        localStorage.setItem(this.USER_STORAGE_KEY, JSON.stringify(users));
    }

    private getUsers(): Record<string, User> {
        const data = localStorage.getItem(this.USER_STORAGE_KEY);
        return data ? JSON.parse(data) : {};
    }

    private saveUser(user: User) {
        const users = this.getUsers();
        users[user.email] = user;
        localStorage.setItem(this.USER_STORAGE_KEY, JSON.stringify(users));
    }

    public signup(email: string, password: string, role: UserRole = 'user'): { success: boolean, error?: string } {
        const users = this.getUsers();
        if (users[email]) {
            return { success: false, error: 'Email already registered.' };
        }

        const newUser: User = {
            id: `USR-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            email,
            passwordHash: this.hashPassword(password),
            role,
            greenTokens: 0
        };

        this.saveUser(newUser);
        return { success: true };
    }

    public login(identifier: string, password: string, expectedRole: UserRole): { success: boolean, user?: Omit<User, 'passwordHash'>, error?: string } {
        const users = this.getUsers();
        const user = users[identifier];

        if (!user) {
            return { success: false, error: 'Invalid credentials.' };
        }

        if (user.passwordHash !== this.hashPassword(password)) {
            return { success: false, error: 'Invalid credentials.' };
        }

        if (user.role !== expectedRole) {
            return { success: false, error: `Invalid access for role: ${expectedRole}` };
        }

        const { passwordHash, ...userWithoutPassword } = user;
        this.createSession(userWithoutPassword);

        return { success: true, user: userWithoutPassword };
    }

    private createSession(user: Omit<User, 'passwordHash'>) {
        const session: Session = {
            isAuthenticated: true,
            user
        };
        localStorage.setItem(this.SESSION_STORAGE_KEY, JSON.stringify(session));
    }

    public logout() {
        localStorage.removeItem(this.SESSION_STORAGE_KEY);
    }

    public awardTokens(email: string, amount: number) {
        const users = this.getUsers();
        if (users[email]) {
            users[email].greenTokens = (users[email].greenTokens || 0) + amount;
            localStorage.setItem(this.USER_STORAGE_KEY, JSON.stringify(users));

            // If the awarded user is currently logged in, update their session too
            const currentSession = this.getSession();
            if (currentSession.user && currentSession.user.email === email) {
                currentSession.user.greenTokens = users[email].greenTokens;
                localStorage.setItem(this.SESSION_STORAGE_KEY, JSON.stringify(currentSession));
            }
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
