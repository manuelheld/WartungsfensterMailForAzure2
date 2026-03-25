export interface MaintenanceItem {
    day: string;          // Column A
    taskNr: string;       // Column B
    description: string;  // Column C
    notes: string;        // Column D (User requested D)
    region: string;       // Column E
    sites: string;        // Column F
    startDateTime: string; // Column G (User requested G)
    endDateTime: string;   // Column H (User requested H)
    impact: string;        // Column I (User requested I)
    otherImpacts: string;  // Column J (User requested J)
    hasDowntime: boolean;
    downtimeDuration: string;
    locations: string[];
    dayLink?: string;       // Link from Column A
    isSelected: boolean;
    startDate?: Date;
    endDate?: Date;

    // Computed/Helper properties
    locationCrq: string;
    timeDisplay: string;
    service: string;

    // Internal logic properties
    sortDate: Date;
    month: number; // 0-11
}
