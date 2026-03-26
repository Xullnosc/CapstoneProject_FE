export interface ChecklistDTO {
    checklistId: number;
    content: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface ChecklistCreateDTO {
    content: string;
}

export interface ChecklistUpdateDTO {
    content: string;
}
