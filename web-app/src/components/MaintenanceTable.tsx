import React, { useState } from 'react';
import { MaintenanceItem } from '../types';
import { Mail, CheckSquare, Square, Calendar, X, Save, Edit3, ArrowLeft, Filter } from 'lucide-react';
import ouSitesData from '../data/ouSites.json';

interface MaintenanceTableProps {
    items: MaintenanceItem[];
    onToggleSelect: (index: number) => void;
    onGenerateEmail: (division: string) => void;
    onItemUpdate: (index: number, field: keyof MaintenanceItem, value: string) => void;
    onBack: () => void;
}

const MONTHS = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
];

// Typed version of the JSON mapping
const ouSites: Record<string, string[]> = ouSitesData;
const divisions = Object.keys(ouSites).sort();

const MaintenanceTable: React.FC<MaintenanceTableProps> = ({ items, onToggleSelect, onGenerateEmail, onItemUpdate, onBack }) => {
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
    const [showOnlyDowntime, setShowOnlyDowntime] = useState(false);
    const [selectedDivision, setSelectedDivision] = useState<string>('Alle');
    const [editingCell, setEditingCell] = useState<{ index: number, field: 'impact' | 'otherImpacts', value: string, title: string } | null>(null);

    const filteredItems = items.filter(item => {
        const monthMatch = item.month === selectedMonth || item.month === -1;
        const downtimeMatch = !showOnlyDowntime || item.hasDowntime;

        let divisionMatch = true;
        if (selectedDivision !== 'Alle') {
            const divList = (ouSites[selectedDivision] || []).map(s => s.toUpperCase().trim());
            const itemLocs = (item.locations || []).map(l => l.toUpperCase().trim());

            // Show if it matches the division OR if it contains "ALL"
            divisionMatch = itemLocs.includes('ALL') || itemLocs.some(loc => divList.includes(loc));
        }

        return monthMatch && downtimeMatch && divisionMatch;
    });
    const groupedItems = filteredItems.reduce((acc: Record<string, MaintenanceItem[]>, item) => {
        const dateKey = item.sortDate ? new Date(item.sortDate).toISOString().split('T')[0] : 'unknown';
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(item);
        return acc;
    }, {});

    const sortedDateKeys = Object.keys(groupedItems).sort();

    const formatDateBilingual = (dateStr: string) => {
        if (dateStr === 'unknown') return 'Unknown Date / Unbekanntes Datum';
        const date = new Date(dateStr);
        const de = new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit' }).format(date);
        const en = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: '2-digit', day: '2-digit' }).format(date);
        // Clean up US format to match user expectation: "Saturday, 15.03."
        const enDate = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit' }).format(date);
        const enDay = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date);
        return `${enDay}, ${enDate} / ${de}`;
    };

    const selectedCount = items.filter(i => i.isSelected).length;

    const handleSaveEdit = () => {
        if (editingCell) {
            onItemUpdate(editingCell.index, editingCell.field, editingCell.value);
            setEditingCell(null);
        }
    };
    return (
        <div className="bg-white rounded-sm shadow-sm border border-gray-200 overflow-hidden flex flex-col">
            {/* Row 1: Controls & Filters - OUTSIDE table scroll container */}
            <div className="sticky top-[72px] z-40 bg-white border-b border-gray-100 shadow-sm w-full">
                <div className="px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-row flex-wrap items-center gap-3">
                                        <button
                                            onClick={onBack}
                                            className="flex items-center gap-2 text-gray-500 hover:text-zf-blue transition-colors group font-semibold bg-white border border-gray-200 py-1.5 px-3 rounded-sm text-xs uppercase"
                                        >
                                            <ArrowLeft className="w-4 h-4" />
                                            Zurück
                                        </button>
                                        <div className="flex items-center gap-2 bg-zf-cyan/10 px-3 py-1.5 border-l-2 border-zf-cyan shrink-0">
                                            <Calendar className="w-4 h-4 text-zf-darkBlue" />
                                            <span className="font-semibold text-zf-darkBlue uppercase tracking-wider text-[10px]">Monat:</span>
                                        </div>
                                        <select
                                            value={selectedMonth}
                                            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                            className="bg-white border border-gray-200 text-zf-darkBlue font-semibold py-1.5 px-3 focus:outline-none focus:border-zf-cyan transition-colors cursor-pointer text-xs"
                                        >
                                            {MONTHS.map((month, idx) => (
                                                <option key={idx} value={idx}>{month}</option>
                                            ))}
                                        </select>
                                        <div className="flex items-center gap-2 bg-zf-cyan/10 px-3 py-1.5 border-l-2 border-zf-cyan shrink-0">
                                            <Filter className="w-4 h-4 text-zf-darkBlue" />
                                            <span className="font-semibold text-zf-darkBlue uppercase tracking-wider text-[10px]">Division:</span>
                                        </div>
                                        <select
                                            value={selectedDivision}
                                            onChange={(e) => setSelectedDivision(e.target.value)}
                                            className="bg-white border border-gray-200 text-zf-darkBlue font-semibold py-1.5 px-3 focus:outline-none focus:border-zf-cyan transition-colors cursor-pointer text-xs"
                                        >
                                            <option value="Alle">Alle</option>
                                            {divisions.map((div, idx) => (
                                                <option key={idx} value={div}>{div}</option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={() => setShowOnlyDowntime(!showOnlyDowntime)}
                                            className={`font-semibold py-1.5 px-3 transition-colors flex items-center gap-2 text-xs uppercase cursor-pointer ${showOnlyDowntime ? 'bg-zf-cyan text-white border-zf-cyan' : 'bg-white text-gray-500 border border-gray-200 hover:border-zf-cyan/50'}`}
                                        >
                                            Nur mit Downtime
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="text-right shrink-0">
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-xl font-bold text-zf-darkBlue leading-none">{selectedCount}</span>
                                                <span className="text-gray-400 text-sm font-semibold">/ {filteredItems.length}</span>
                                            </div>
                                            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mt-0.5">Ausgewählt</p>
                                        </div>
                                        <button
                                            onClick={() => onGenerateEmail(selectedDivision)}
                                            disabled={selectedCount === 0}
                                            className={`
                                                font-semibold py-2 px-6 flex items-center gap-2 uppercase tracking-wide text-xs transition-colors
                                                ${selectedCount > 0
                                                    ? 'bg-zf-cyan text-white hover:bg-zf-lightBlue'
                                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
                                            `}
                                        >
                                            <Mail className="w-4 h-4" />
                                            E-Mail
                                        </button>
                                    </div>
                                </div>
                            </div>

            {/* Table Area with Horizontal Scroll */}
            <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead className="bg-gray-50 border-b border-gray-200 shadow-sm">
                        {/* Row 2: Column Headers */}
                        <tr>
                            <th className="px-4 py-3 font-black text-gray-400 uppercase text-[10px] tracking-[0.3em]">Select</th>
                            <th className="px-4 py-3 font-black text-gray-400 uppercase text-[10px] tracking-[0.3em] min-w-[200px]">Description (D)</th>
                            <th className="px-4 py-3 font-black text-gray-400 uppercase text-[10px] tracking-[0.3em] min-w-[200px]">Time (CET)</th>
                            <th className="px-4 py-3 font-black text-gray-400 uppercase text-[10px] tracking-[0.3em]">Downtime</th>
                            <th className="px-4 py-3 font-black text-gray-400 uppercase text-[10px] tracking-[0.3em]">Lokationen</th>
                            <th className="px-4 py-3 font-black text-gray-400 uppercase text-[10px] tracking-[0.3em]">Impact (I)</th>
                            <th className="px-4 py-3 font-black text-gray-400 uppercase text-[10px] tracking-[0.3em]">Other (J)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {sortedDateKeys.map((dateKey) => (
                            <React.Fragment key={dateKey}>
                                {/* Date Group Header */}
                                <tr className="bg-white border-l-4 border-zf-darkBlue border-t border-gray-100">
                                    <td colSpan={7} className="px-4 py-2 bg-gray-50/50">
                                        <div className="flex items-center gap-3">
                                            <Calendar className="w-5 h-5 text-zf-darkBlue" />
                                            <span className="text-xs font-bold text-zf-darkBlue uppercase tracking-widest">
                                                {formatDateBilingual(dateKey)}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                                {groupedItems[dateKey].map((item) => {
                                    // Find original index for toggle/update
                                    const originalIndex = items.findIndex(i => i === item);
                                    return (
                                        <tr
                                            key={`${item.taskNr}-${item.startDateTime}-${originalIndex}`}
                                            className={`
                              transition-all group
                              ${item.isSelected ? 'bg-zf-blue/5' : 'hover:bg-gray-50/80'}
                            `}
                                        >
                                            <td className="px-4 py-3 cursor-pointer" onClick={() => onToggleSelect(originalIndex)}>
                                                <div className={`
                                w-6 h-6 border-2 flex items-center justify-center transition-colors
                                ${item.isSelected ? 'bg-zf-cyan border-zf-cyan text-white' : 'border-gray-300 group-hover:border-zf-cyan bg-white'}
                              `}>
                                                    {item.isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-transparent" />}
                                                </div>
                                            </td>
                                    <td className="px-4 py-3">
                                        <div className="font-semibold text-zf-blue mb-1 line-clamp-1">{item.notes}</div>
                                        <div className="font-bold text-gray-900 text-[13px] mb-1">
                                            {item.dayLink ? (
                                                <a href={item.dayLink} target="_blank" rel="noopener noreferrer" className="text-zf-blue hover:underline">
                                                    {item.day}
                                                </a>
                                            ) : (
                                                item.day
                                            )}
                                        </div>
                                        <div className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
                                            {item.taskNr}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600 font-bold text-[12px] bg-gray-50/30 whitespace-nowrap">{item.timeDisplay || '-'}</td>
                                    <td className="px-4 py-3">
                                        {item.hasDowntime ? (
                                            <span className="inline-block px-3 py-1 bg-red-50 text-red-600 border border-red-200 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
                                                {item.downtimeDuration || 'Ja'}
                                            </span>
                                        ) : (
                                            <span className="text-gray-300 ml-4">-</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-1">
                                            {/* Show ONLY extracted locations from Column J that match the selected division (or all if Alle) */}
                                            {item.locations && item.locations.length > 0 ? (
                                                item.locations
                                                    .filter(loc => {
                                                        if (selectedDivision === 'Alle') return true;
                                                        if (loc.toUpperCase().trim() === 'ALL') return true;
                                                        const divLocs = ouSites[selectedDivision] || [];
                                                        return divLocs.some(d => d.toUpperCase() === loc.trim().toUpperCase());
                                                    })
                                                    .map((loc, idx) => (
                                                        <span key={idx} className="inline-block px-2 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded-md text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
                                                            {loc}
                                                        </span>
                                                    ))
                                            ) : (
                                                <span className="text-gray-300 ml-4">-</span>
                                            )}

                                            {/* If there are locations but none match the current division filter */}
                                            {item.locations && item.locations.length > 0 && selectedDivision !== 'Alle' &&
                                                item.locations.filter(loc => {
                                                    if (loc.toUpperCase().trim() === 'ALL') return true;
                                                    const divLocs = ouSites[selectedDivision] || [];
                                                    return divLocs.some(d => d.toUpperCase() === loc.trim().toUpperCase());
                                                }).length === 0 && (
                                                    <span className="text-gray-300 ml-4">-</span>
                                                )}
                                        </div>
                                    </td>
                                    <td
                                        className="px-4 py-3 cursor-pointer hover:bg-zf-blue/5 transition-colors group/cell"
                                        onClick={() => setEditingCell({
                                            index: originalIndex,
                                            field: 'impact',
                                            value: item.impact,
                                            title: 'Impact bearbeiten'
                                        })}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="inline-block px-3 py-1 bg-gray-100 text-gray-500 rounded-lg text-[10px] font-bold uppercase tracking-wider line-clamp-2 max-w-[150px]">
                                                {item.impact || 'Standard'}
                                            </span>
                                            <Edit3 className="w-4 h-4 text-zf-blue opacity-0 group-hover/cell:opacity-100 transition-opacity" />
                                        </div>
                                    </td>
                                    <td
                                        className="px-4 py-3 cursor-pointer hover:bg-zf-blue/5 transition-colors group/cell"
                                        onClick={() => setEditingCell({
                                            index: originalIndex,
                                            field: 'otherImpacts',
                                            value: item.otherImpacts,
                                            title: 'Other Impacts bearbeiten'
                                        })}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-400 text-xs italic line-clamp-2 max-w-[150px]">{item.otherImpacts || '-'}</span>
                                            <Edit3 className="w-4 h-4 text-zf-blue opacity-0 group-hover/cell:opacity-100 transition-opacity" />
                                        </div>
                                    </td>
                                </tr>
                            );
                                })}
                            </React.Fragment>
                        ))}
                        {filteredItems.length === 0 && (
                            <tr>
                                <td colSpan={8} className="px-4 py-16 text-center">
                                    <div className="flex flex-col items-center gap-4">
                                        <Calendar className="w-12 h-12 text-gray-200" />
                                        <p className="text-gray-400 font-bold text-xl">Keine Termine für diesen Monat gefunden.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Editing Modal */}
            {editingCell && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
                    <div className="bg-white shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
                            <h3 className="text-xl font-bold text-gray-900">{editingCell?.title}</h3>
                            <button
                                onClick={() => setEditingCell(null)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-8">
                            <textarea
                                value={editingCell?.value || ''}
                                onChange={(e) => editingCell && setEditingCell({ ...editingCell, value: e.target.value })}
                                className="w-full h-48 p-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-zf-blue/10 focus:border-zf-blue outline-none transition-all resize-none text-gray-700 font-medium"
                                placeholder="Text hier eingeben..."
                                autoFocus
                            />
                        </div>
                        <div className="flex justify-end gap-4 p-6 border-t border-gray-100 bg-gray-50">
                            <button
                                onClick={() => setEditingCell(null)}
                                className="px-6 py-3 font-bold text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                Abbrechen
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                className="px-8 py-3 bg-zf-cyan text-white font-semibold rounded-sm hover:bg-zf-lightBlue transition-colors flex items-center gap-2 uppercase tracking-wide text-sm shadow-md shadow-zf-cyan/20"
                            >
                                <Save className="w-5 h-5" />
                                Speichern
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MaintenanceTable;
