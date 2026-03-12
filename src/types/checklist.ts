export interface ChecklistDTO {
    checklistId: number;
    title: string;
    content: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface ChecklistCreateDTO {
    title: string;
    content: string;
}

export interface ChecklistUpdateDTO {
    title: string;
    content: string;
}
