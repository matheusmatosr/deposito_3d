export interface Shelf {
    id: string;
    occupied: boolean;
}

export interface Row {
    id: string;
    shelves: Shelf[];
}

export interface Warehouse {
    id: string;
    rows: Row[];
    size: {
      rows: number;
      shelvesPerRow: number;
    };
}