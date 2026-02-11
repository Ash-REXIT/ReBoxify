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
    returnRequested?: boolean;
    returnDate?: string;
}

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/api/boxes`;

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

export const getInventory = async (): Promise<Box[]> => {
    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error('Failed to fetch inventory');
        return await res.json();
    } catch (err) {
        console.error(err);
        return [];
    }
};

export const createBox = async (box: Box): Promise<Box> => {
    const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(box)
    });
    if (!res.ok) throw new Error('Failed to create box');
    return res.json();
};

export const updateBox = async (box: Box): Promise<Box> => {
    const res = await fetch(`${API_URL}/${box.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(box)
    });
    if (!res.ok) throw new Error('Failed to update box');
    return res.json();
};
export const deleteBoxApi = async (id: string): Promise<void> => {
    await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
};

export const validateAndTransition = async (
    boxId: string,
    role: 'admin' | 'company' | 'partner' | 'user',
    nextStatus: BoxStatus,
    metadata?: Partial<Box>
): Promise<{ success: boolean; message: string; box?: Box }> => {
    if (!isValidBoxId(boxId)) {
        return { success: false, message: `Invalid Box ID format: "${boxId}". IDs must be like ESA-012.` };
    }

    // Fetch latest inventory to ensure consistency
    const inventory = await getInventory();
    const box = inventory.find(b => b.id === boxId);

    if (!box) {
        return { success: false, message: `Box "${boxId}" not found in system. Register it in Super Admin first.` };
    }

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

            // Ensure customer_id is set if provided in metadata
            if (metadata?.customer_id) {
                updatedBox.customer_id = metadata.customer_id;
            }
        }

        // Clear customer link and deadline when possession ends (anything except DELIVERED and RECEIVED)
        // Kept for RECEIVED so users can still see history/issues until MNC resets it
        if (nextStatus !== 'DELIVERED' && nextStatus !== 'RECEIVED') {
            delete updatedBox.customer_id;
            delete updatedBox.deadline;
        }

        if (nextStatus === 'CREATED' && !updatedBox.createdAt) {
            updatedBox.createdAt = new Date().toISOString();
        }

        try {
            const result = await updateBox(updatedBox);
            return { success: true, message: `Success! Status updated to ${nextStatus}.`, box: result };
        } catch (e) {
            return { success: false, message: 'Failed to update box in database.' };
        }
    }

    return { success: false, message: errorMsg };
};

export const scheduleReturn = async (boxId: string): Promise<{ success: boolean, message: string }> => {
    const inventory = await getInventory();
    const box = inventory.find(b => b.id === boxId);

    if (!box) return { success: false, message: "Box not found" };

    if (box.status !== 'DELIVERED') return { success: false, message: "Box is not eligible for return (must be DELIVERED)" };

    const updatedBox = {
        ...box,
        returnRequested: true,
        returnDate: new Date().toISOString()
    };

    try {
        await updateBox(updatedBox);
        return { success: true, message: "Return scheduled successfully" };
    } catch (e) {
        return { success: false, message: "Failed to schedule return" };
    }
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
