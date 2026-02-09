
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

const ISSUES_KEY = 'reboxify_issues';

export const getIssues = (): Issue[] => {
    const saved = localStorage.getItem(ISSUES_KEY);
    return saved ? JSON.parse(saved) : [];
};

export const saveIssue = (issue: Omit<Issue, 'issueId' | 'status' | 'createdAt'>): Issue => {
    const issues = getIssues();
    const newIssue: Issue = {
        ...issue,
        issueId: `ISS-${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'OPEN',
        createdAt: new Date().toISOString()
    };
    const updated = [...issues, newIssue];
    localStorage.setItem(ISSUES_KEY, JSON.stringify(updated));
    return newIssue;
};

export const updateIssueStatus = (issueId: string, status: IssueStatus): boolean => {
    const issues = getIssues();
    const index = issues.findIndex(i => i.issueId === issueId);
    if (index === -1) return false;

    issues[index].status = status;
    localStorage.setItem(ISSUES_KEY, JSON.stringify(issues));
    return true;
};

export const deleteIssue = (issueId: string): boolean => {
    const issues = getIssues();
    const updated = issues.filter(i => i.issueId !== issueId);
    if (updated.length === issues.length) return false;
    localStorage.setItem(ISSUES_KEY, JSON.stringify(updated));
    return true;
};
