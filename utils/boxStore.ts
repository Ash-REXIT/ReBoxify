
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

export const INITIAL_BOXES: Box[] = [
    { id: 'ESA-012', company: 'MNC-AMZ', status: 'DISPATCHED', uses: 5, condition: 'GOOD' },
    { id: 'ESA-001', company: 'MNC-AMZ', status: 'DELIVERED', uses: 12, condition: 'GOOD', customer_id: 'user@demo.com', deadline: '2024-02-25' },
    { id: 'ESA-055', company: 'MNC-FLK', status: 'EXPORTED', uses: 2, condition: 'NEW' },
];

const STORAGE_KEY = 'reboxify_inventory';

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
        case 'EXPORTED': // Admin assigns to Company OR Box loops back from RECEIVED
            if (role === 'admin' && (box.status === 'CREATED' || box.status === 'RETIRED')) {
                isValid = true;
            } else if (role === 'partner' && box.status === 'RECEIVED') {
                // Loop back logic: If partner marks as RECEIVED, it automatically moves to EXPORTED for the same company
                isValid = true;
                metadata = { ...metadata, status: 'EXPORTED' };
            }
            break;

        case 'DISPATCHED': // Company scans code at packaging
            if (role === 'company' && box.status === 'EXPORTED' && box.company === metadata?.company) {
                isValid = true;
            } else if (box.status !== 'EXPORTED') {
                errorMsg = `Box must be in EXPORTED state (currently ${box.status}).`;
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
    }

    if (isValid) {
        const updatedBox = { ...box, ...metadata, status: nextStatus };

        // Auto-logic for specific transitions
        if (nextStatus === 'RECEIVED') {
            updatedBox.uses += 1;
            // If not damaged, loop back to EXPORTED for the same company
            if (updatedBox.condition !== 'DAMAGED') {
                updatedBox.status = 'EXPORTED';
                updatedBox.customer_id = undefined;
                updatedBox.deadline = undefined;
            } else {
                updatedBox.status = 'RETIRED';
            }
        }

        inventory[boxIndex] = updatedBox;
        saveInventory(inventory);
        return { success: true, message: `Success! Status updated to ${updatedBox.status}.`, box: updatedBox };
    }

    return { success: false, message: errorMsg };
};
