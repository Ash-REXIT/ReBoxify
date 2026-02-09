
export type BoxStatus = 'CREATED' | 'EXPORTED' | 'DISPATCHED' | 'DELIVERED' | 'RECEIVED' | 'RETIRED';
export type BoxCondition = 'NEW' | 'GOOD' | 'MINOR_DAMAGE' | 'DAMAGED';

export interface Box {
    id: string;
    company: string | null;
    status: BoxStatus;
    uses: number;
    condition: BoxCondition;
    customer_id?: string;
    deadline?: string;
    createdAt?: string; // ISO string for ESG time-based metrics
}

/**
 * Robustly extracts a Box ID from noisy scan data.
 * Looks for patterns like "ESA-012" or "RBX-101".
 */
export const extractBoxId = (text: string): string => {
    if (!text) return '';

    // Pattern: 3 uppercase letters, hyphen, 2-4 digits (e.g., ESA-012)
    const pattern = /[A-Z]{3}-\d{2,4}/;
    const match = text.match(pattern);

    if (match) {
        return match[0];
    }

    // Fallback: URL parsing
    try {
        if (text.startsWith('http')) {
            const url = new URL(text);
            const idParam = url.searchParams.get('id');
            if (idParam && isValidBoxId(idParam.toUpperCase())) return idParam.toUpperCase();

            const parts = url.pathname.split('/').filter(p => p);
            if (parts.length > 0) {
                const lastPart = parts[parts.length - 1].trim().toUpperCase();
                if (isValidBoxId(lastPart)) return lastPart;
            }
        }
    } catch (e) { }

    return '';
};

export const isValidBoxId = (id: string): boolean => {
    return /^[A-Z]{3}-\d{2,4}$/.test(id);
};

export const getDepositAmount = (box: Box): number => {
    return box.status === 'DELIVERED' ? 80 : 0;
};

const STORAGE_KEY = 'reboxify_inventory';

export const INITIAL_BOXES: Box[] = [
    { id: 'ESA-012', company: 'MNC-AMZ', status: 'DISPATCHED', uses: 5, condition: 'GOOD', createdAt: '2025-12-01T00:00:00Z' },
    { id: 'ESA-001', company: 'MNC-AMZ', status: 'DELIVERED', uses: 12, condition: 'GOOD', customer_id: 'user@demo.com', deadline: '2024-02-25', createdAt: '2025-10-15T00:00:00Z' },
    { id: 'ESA-055', company: 'MNC-FLK', status: 'EXPORTED', uses: 2, condition: 'NEW', createdAt: '2026-01-10T00:00:00Z' },
];

export const getInventory = (): Box[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    let inventory: Box[] = data ? JSON.parse(data) : INITIAL_BOXES;

    // Auto-Cleanup: Remove any junk boxes that don't match the valid ID pattern
    const cleaned = inventory.filter(b => isValidBoxId(b.id));

    if (cleaned.length !== inventory.length) {
        console.warn("ReBoxify: Removed invalid box entries from local storage.");
        saveInventory(cleaned);
        return cleaned;
    }

    if (!data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_BOXES));
        return INITIAL_BOXES;
    }
    return inventory;
};

export const saveInventory = (inventory: Box[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inventory));
};

export const validateAndTransition = (
    boxId: string,
    role: 'admin' | 'company' | 'partner' | 'user',
    nextStatus: BoxStatus,
    metadata?: Partial<Box>
): { success: boolean; message: string; box?: Box } => {
    if (!isValidBoxId(boxId)) {
        return { success: false, message: `Invalid Box ID format: "${boxId}". IDs must be like ESA-012.` };
    }

    const inventory = getInventory();
    const boxIndex = inventory.findIndex(b => b.id === boxId);

    if (boxIndex === -1) {
        return { success: false, message: `Box "${boxId}" not found in system. Register it in Super Admin first.` };
    }

    const box = inventory[boxIndex];

    if (box.status === nextStatus) {
        return { success: true, message: `Box ${boxId} already in status ${nextStatus}.`, box };
    }

    // Permission Matrix & State Machine Logic
    let isValid = false;
    let errorMsg = "Invalid transition for your role.";

    switch (nextStatus) {
        case 'EXPORTED': // Admin assigns OR Company receives back from return loop
            if (role === 'admin' && (box.status === 'CREATED' || box.status === 'RETIRED')) {
                isValid = true;
            } else if (role === 'company' && (box.status === 'RECEIVED' || box.status === 'DELIVERED') && box.company === metadata?.company) {
                // MNC marks as Received (ready for reuse)
                isValid = true;
            }
            break;

        case 'DISPATCHED': // Company scans code at packaging
            if (role === 'company' && box.status === 'EXPORTED' && box.company === metadata?.company) {
                isValid = true;
            } else if (box.status !== 'EXPORTED') {
                errorMsg = `Box must be in EXPORTED state to be DISPATCHED (currently ${box.status}).`;
            }
            break;

        case 'DELIVERED': // Delivery partner scans at customer door
            if (role === 'partner' && box.status === 'DISPATCHED') {
                isValid = true;
            }
            break;

        case 'RECEIVED': // Delivery partner scans at collection
            if (role === 'partner' && box.status === 'DELIVERED') {
                isValid = true;
            }
            break;

        case 'RETIRED':
            if (role === 'admin' || (role === 'company' && box.company === metadata?.company)) {
                isValid = true;
            }
            break;
    }

    if (isValid) {
        // Increment uses only when it successfully finishes a journey (MNC receives it back)
        const updatedBox: Box = {
            ...box,
            ...metadata,
            status: nextStatus,
            uses: (nextStatus === 'EXPORTED' && (box.status === 'RECEIVED' || box.status === 'DELIVERED')) ? box.uses + 1 : box.uses
        };

        // Auto-set 14-day deadline when DELIVERED
        if (nextStatus === 'DELIVERED') {
            const deadlineDate = new Date();
            deadlineDate.setDate(deadlineDate.getDate() + 14);
            updatedBox.deadline = deadlineDate.toISOString();
        }

        // Clear customer link and deadline when possession ends (anything except DELIVERED)
        if (nextStatus !== 'DELIVERED') {
            delete updatedBox.customer_id;
            delete updatedBox.deadline;
        }

        if (nextStatus === 'CREATED' && !updatedBox.createdAt) {
            updatedBox.createdAt = new Date().toISOString();
        }

        inventory[boxIndex] = updatedBox;
        saveInventory(inventory);
        return { success: true, message: `Success! Status updated to ${nextStatus}.`, box: updatedBox };
    }

    return { success: false, message: errorMsg };
};

/**
 * Calculates the Net Impact Score (in kg) and event counts.
 * Formula: (totalReuseEvents × 0.5) + (totalRecyclingEvents × 0.2)
 * 
 * Assumptions:
 * - Reuse Event: A box that has completed a journey (recorded in 'uses').
 * - Recycling Event: A box marked as 'DAMAGED' (representing recovery/recycling).
 */
export interface ImpactMetrics {
    totalImpact: number;
    totalReuseEvents: number;
    totalRecyclingEvents: number;
}

export const calculateNetImpact = (boxes: Box[]): ImpactMetrics => {
    const totalReuseEvents = boxes.reduce((acc, b) => acc + b.uses, 0);
    const totalRecyclingEvents = boxes.filter(b => b.condition === 'DAMAGED').length;

    const impact = (totalReuseEvents * 0.5) + (totalRecyclingEvents * 0.2);

    return {
        totalImpact: Number(impact.toFixed(1)),
        totalReuseEvents,
        totalRecyclingEvents
    };
};
