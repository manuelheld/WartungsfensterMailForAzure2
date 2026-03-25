export const formatToAMPM = (val: any): string => {
    if (!val && val !== 0) return '';
    
    let d: Date;
    if (val instanceof Date) {
        d = val;
    } else if (typeof val === 'number') {
        // Handle Excel time serial (if < 1, it's just a time)
        if (val < 1 && val > 0) {
            const totalSeconds = Math.round(val * 24 * 3600);
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const period = hours >= 12 ? 'PM' : 'AM';
            const displayHours = (hours % 12) || 12;
            return `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
        }
        d = new Date(val); 
    } else if (typeof val === 'string' && val.trim()) {
        d = new Date(val);
    } else {
        return '';
    }

    // Extraction fallback for invalid dates or messy strings
    if (isNaN(d.getTime())) {
        const s = String(val);
        const timeMatch = s.match(/(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[APM]{2})?)/i);
        if (timeMatch) {
            let t = timeMatch[1].toUpperCase();
            if (!t.includes('AM') && !t.includes('PM')) {
                // If it's 24h format from string, try to convert
                const [h, m] = t.split(':').map(Number);
                const period = h >= 12 ? 'PM' : 'AM';
                return `${(h % 12 || 12).toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${period}`;
            }
            return t;
        }
        return '';
    }

    // Manual reliable formatting
    let hours = d.getHours();
    const minutes = d.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = (hours % 12) || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    
    return `${displayHours.toString().padStart(2, '0')}:${displayMinutes} ${period}`;
};
