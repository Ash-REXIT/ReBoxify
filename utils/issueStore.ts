export type IssueType = 'Box damaged on delivery' | 'Box missing parts / broken' | 'Unable to return box' | 'Other';
export type IssueStatus = 'OPEN' | 'IN_REVIEW' | 'RESOLVED';

export interface Issue {
    issueId: string;
    boxId: string;
    customerId: string;
    companyId: string;
    issueType: IssueType;
    description: string;
    proofImageUrl?: string;
    status: IssueStatus;
    createdAt: string;
}

const API_URL = 'http://localhost:5000/api/issues';

export const getIssues = async (): Promise<Issue[]> => {
    try {
        const res = await fetch(API_URL);
        if (!res.ok) return [];
        return await res.json();
    } catch (e) {
        console.error(e);
        return [];
    }
};

export const saveIssue = async (issue: Omit<Issue, 'issueId' | 'status' | 'createdAt'>): Promise<Issue> => {
    const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(issue)
    });
    if (!res.ok) throw new Error('Failed to save issue');
    return res.json();
};

export const updateIssueStatus = async (issueId: string, status: IssueStatus): Promise<boolean> => {
    try {
        const res = await fetch(`${API_URL}/${issueId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        return res.ok;
    } catch (e) {
        return false;
    }
};

export const deleteIssue = async (issueId: string): Promise<boolean> => {
    try {
        const res = await fetch(`${API_URL}/${issueId}`, { method: 'DELETE' });
        return res.ok;
    } catch (e) {
        return false;
    }
};
