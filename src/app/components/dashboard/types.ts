export interface Widget {
    id: string;
    type: 'weather' | 'email' | 'social' | 'custom' | 'text';
    title: string;
    x: number;
    y: number;
    w: number;
    h: number;
    minW?: number;
    minH?: number;
    maxW?: number;
    maxH?: number;
    config?: any;
    content?: string;
} 