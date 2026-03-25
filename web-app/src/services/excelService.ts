import * as XLSX from 'xlsx';
import { MaintenanceItem } from '../types';
import { formatToAMPM } from '../utils/timeUtils';

export const parseExcel = async (file: File): Promise<MaintenanceItem[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, {
                    type: 'array',
                    cellDates: true,
                    cellNF: false,
                    cellText: true
                });

                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                // We get raw values for dates but also formatted text
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                // Helper to extract hyperlink from a cell
                const extractLink = (cell: any) => {
                    if (!cell) return 'https://www.google.de';
                    // Standard explicit hyperlink
                    if (cell.l && cell.l.Target) return cell.l.Target;

                    // Formula hyperlink, e.g., =HYPERLINK("https://...", "CRQ...") or =HYPERLINK('https://...', 'CRQ...')
                    if (cell.f && typeof cell.f === 'string') {
                        // Match everything inside the first parameter of HYPERLINK( ... )
                        const match = cell.f.match(/^HYPERLINK\(\s*["']([^"']+)["']/i);
                        if (match && match[1]) {
                            return match[1];
                        }
                    }
                    return 'https://www.google.de';
                };

                const items: MaintenanceItem[] = jsonData.slice(1).map((row: any, index: number) => {
                    const rowNum = index + 2; // +1 for 1-based, +1 for header
                    const cellA = worksheet['A' + rowNum];
                    const dayLink = extractLink(cellA);

                    const cellB = worksheet['B' + rowNum];
                    const taskNrLink = extractLink(cellB);

                    const sites = String(row[5] || '').trim();
                    const taskNr = String(row[1] || '').trim();
                    const description = String(row[2] || '').trim();
                    const startG = row[6];

                    let sortDate = new Date(0);
                    let month = -1;

                    if (startG instanceof Date) {
                        sortDate = startG;
                        month = startG.getMonth();
                    } else if (typeof startG === 'string') {
                        // Fallback for strings like "20.01.2024"
                        const parts = startG.split(/[\. :]/);
                        if (parts.length >= 3) {
                            const day = parseInt(parts[0], 10);
                            const mon = parseInt(parts[1], 10) - 1;
                            const year = parseInt(parts[2], 10);
                            if (!isNaN(day) && !isNaN(mon) && !isNaN(year)) {
                                sortDate = new Date(year, mon, day);
                                month = mon;
                            }
                        }
                    }

                    const startTime = formatToAMPM(row[6]);
                    const endTime = formatToAMPM(row[7]);
                    const timeframe = (startTime && endTime) ? `${startTime} – ${endTime}` : '';

                    const otherImpactsStr = String(row[9] || '');

                    // Normalize all whitespace (including newlines, tabs, non-breaking spaces) to single spaces for easier matching
                    const normalizedOther = otherImpactsStr.toLowerCase().replace(/\s+/g, ' ');

                    let downtimeDuration = '';
                    // Match "Downtime Duration:" or "Execution Duration:" followed by anything up to the next line break
                    // Use a global match to find all occurrences
                    const allDurationMatches = otherImpactsStr.match(/(?:downtime\s*duration|execution\s*duration)\s*:\s*([^\r\n]+)/gi);

                    if (allDurationMatches) {
                        // Priority 1: Find a match that is purely numeric (e.g., "2900")
                        const numericDuration = allDurationMatches.find(m => {
                            const val = m.split(':')[1].trim();
                            return /^\d+$/.test(val);
                        });

                        if (numericDuration) {
                            downtimeDuration = numericDuration.split(':')[1].trim();
                        } else {
                            // Priority 2: Use the first match found
                            downtimeDuration = allDurationMatches[0].split(':')[1].trim();
                        }
                    }

                    // Look for various versions of "Service Downtime: yes", "Downtime: yes", "Downtime yes", etc.
                    // Also check for German terms and handle cases where duration is present
                    const hasDowntimeValue = normalizedOther.includes('downtime: yes') ||
                        normalizedOther.includes('downtime: ja') ||
                        normalizedOther.includes('downtime: true') ||
                        normalizedOther.includes('downtime yes') ||
                        normalizedOther.includes('downtime ja') ||
                        normalizedOther.includes('ausfallzeit: ja') ||
                        normalizedOther.includes('ausfallzeit ja');

                    // If we have a duration but no explicit 'yes', it's still downtime
                    const hasDowntime = hasDowntimeValue || (downtimeDuration.length > 0 && !downtimeDuration.toLowerCase().includes('none') && !downtimeDuration.toLowerCase().includes('keine'));

                    let extractedLocations: string[] = [];
                    // Look for common patterns like ["GCR"] or ["GCR", "ABC"] or GCR, ABC or even multi-line block
                    const sitesMatch = otherImpactsStr.match(/impacted\s*sites\s*:?\s*([\s\S]+?)(?=downtime\s*duration|impacted\s*services|$)/i);

                    if (sitesMatch && sitesMatch[1]) {
                        let innerText = sitesMatch[1].trim();

                        // If it's a JSON array format like `["GCR", "LVN"]` we can extract all strings inside quotes
                        const quoteMatches = innerText.match(/["']([^"']+)["']/g);
                        if (quoteMatches) {
                            extractedLocations = quoteMatches.map(m => m.replace(/["']/g, '').trim()).filter(Boolean);
                        } else {
                            // Fallback to splitting by comma, newline or semicolon
                            // Remove any square brackets globally before splitting
                            let cleaned = innerText.replace(/\[|\]/g, '').trim();
                            extractedLocations = cleaned.split(/[\r\n,;]+/).map(s => s.trim()).filter(Boolean);
                        }
                    }

                    return {
                        day: String(row[0] || ''),
                        dayLink: dayLink,
                        taskNr: taskNr,
                        description: description,
                        notes: String(row[3] || ''),
                        region: String(row[4] || ''),
                        sites: sites,
                        startDateTime: startG instanceof Date ? startG.toLocaleString('de-DE') : String(startG || ''),
                        endDateTime: row[7] instanceof Date ? row[7].toLocaleString('de-DE') : String(row[7] || ''),
                        impact: String(row[8] || ''),
                        otherImpacts: otherImpactsStr,
                        hasDowntime: hasDowntime,
                        downtimeDuration: downtimeDuration,
                        locations: extractedLocations,
                        isSelected: false,
                        startDate: row[6] instanceof Date ? row[6] : undefined,
                        endDate: row[7] instanceof Date ? row[7] : undefined,
                        locationCrq: `${sites} ${taskNr}`.trim(),
                        timeDisplay: timeframe,
                        service: String(row[3] || '').trim(),
                        sortDate: sortDate,
                        month: month
                    };
                });

                // Filter out empty rows and sort
                const filteredItems = items
                    .filter(item => item.taskNr || item.description || item.startDateTime)
                    .sort((a, b) => a.sortDate.getTime() - b.sortDate.getTime());

                resolve(filteredItems);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    });
};
