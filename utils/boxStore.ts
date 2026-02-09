
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
}

const STORAGE_KEY = 'reboxify_inventory';

export const INITIAL_BOXES: Box[] = [
    { id: 'ESA-012', company: 'MNC-AMZ', status: 'DISPATCHED', uses: 5, condition: 'GOOD' },
    { id: 'ESA-001', company: 'MNC-AMZ', status: 'DELIVERED', uses: 12, condition: 'GOOD', customer_id: 'user@demo.com', deadline: '2024-02-25' },
    { id: 'ESA-055', company: 'MNC-FLK', status: 'EXPORTED', uses: 2, condition: 'NEW' },
];

export const getInventory = (): Box[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_BOXES));
        return INITIAL_BOXES;
    }
    return JSON.parse(data);
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
    const inventory = getInventory();
    const boxIndex = inventory.findIndex(b => b.id === boxId);

    if (boxIndex === -1) {
        return { success: false, message: `Box ${boxId} not found in system.` };
    }

    const box = inventory[boxIndex];

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
        const updatedBox = {
            ...box,
            ...metadata,
            status: nextStatus,
            uses: (nextStatus === 'EXPORTED' && box.status === 'RECEIVED') ? box.uses + 1 : box.uses
        };

        inventory[boxIndex] = updatedBox;
        saveInventory(inventory);
        return { success: true, message: `Success! Status updated to ${nextStatus}.`, box: updatedBox };
    }

    return { success: false, message: errorMsg };
};
