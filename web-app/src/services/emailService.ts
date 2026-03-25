import { MaintenanceItem } from '../types';
import ouSitesData from '../data/ouSites.json';
import { zfLogoBase64 } from './zfLogoBase64';
import { formatToAMPM } from '../utils/timeUtils';

const ouSites: Record<string, string[]> = ouSitesData;

export const generateEmailHtml = (selectedItems: MaintenanceItem[], selectedDivision: string = 'Alle'): string => {
  const monthsEN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthsDE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  const daysEN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const daysDE = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

  const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  const formatDateEN = (date: Date) => {
    return `${daysEN[date.getDay()]} ${monthsEN[date.getMonth()]} ${getOrdinal(date.getDate())} ${date.getFullYear()}`;
  };

  const formatDateDE = (date: Date) => {
    return `${daysDE[date.getDay()]} ${date.getDate()}. ${monthsDE[date.getMonth()]} ${date.getFullYear()}`;
  };

  const formatDateTimeEN = (date: Date) => {
    const time = date.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return `${monthsEN[date.getMonth()]} ${getOrdinal(date.getDate())} ${date.getFullYear()}, ${time}`;
  };

  const formatDateTimeDE = (date: Date) => {
    const time = date.toLocaleString('de-DE', { hour: '2-digit', minute: '2-digit', hour12: false });
    return `${date.getDate()}. ${monthsDE[date.getMonth()]} ${date.getFullYear()}, ${time} Uhr`;
  };

  // Find overall min and max dates
  let minDate: Date | null = null;
  let maxDate: Date | null = null;
  selectedItems.forEach(item => {
    // Falls item.startDate ein gültiges Datum ist, sonst nimm sortDate
    const start = item.startDate || item.sortDate;
    const end = item.endDate || item.sortDate;
    if (!minDate || (start && start < minDate)) minDate = start;
    if (!maxDate || (end && end > maxDate)) maxDate = end;
  });
  const validMinDate = minDate || new Date();
  const validMaxDate = maxDate || new Date();

  // Group items by date string
  const groupedItems: { [key: string]: MaintenanceItem[] } = {};
  selectedItems.forEach(item => {
    const dateStr = item.sortDate.toDateString();
    if (!groupedItems[dateStr]) groupedItems[dateStr] = [];
    groupedItems[dateStr].push(item);
  });

  const sortedDates = Object.keys(groupedItems).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  const firstItem = selectedItems[0];
  const monthIdx = firstItem && firstItem.month !== -1 ? firstItem.month : new Date().getMonth();
  const year = new Date().getFullYear();

  const sectionsHtml = sortedDates.map(dateStr => {
    const items = groupedItems[dateStr];
    const date = new Date(dateStr);

    const tableRows = items.map(item => {
      // Use "Impact (I)" as the description in the email
      let desc = item.impact.replace(/(Downtime|Ausfallzeit)[^<]*/gi, (match) =>
        `<span style="color: #E2001A; font-weight: bold;">${match}</span>`
      );

      // Filter locations based on division (mirror logic from Table)
      const displayLocations = (item.locations || [])
        .filter(loc => {
           if (selectedDivision === 'Alle') return true;
           if (loc.toUpperCase().trim() === 'ALL') return true;
           const divLocs = ouSites[selectedDivision] || [];
           return divLocs.some(d => d.toUpperCase() === loc.trim().toUpperCase());
        })
        .join(', ');

      // Final safety: even if timeDisplay is messy, try to extract clean AM/PM times
      let preciseTime = item.timeDisplay || '-';
      if (preciseTime.length > 20) { 
        const parts = preciseTime.split(/\s*[–-]\s*/);
        if (parts.length === 2) {
          const start = formatToAMPM(parts[0]);
          const end = formatToAMPM(parts[1]);
          if (start && end) preciseTime = `${start} – ${end}`;
        } else {
          const singleClean = formatToAMPM(preciseTime);
          if (singleClean) preciseTime = singleClean;
        }
      }

      return `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #ddd; vertical-align: top; width: 150px;">
            <div style="font-weight: bold; font-size: 14px; text-transform: uppercase;">${displayLocations || 'All'}</div>
            <div style="font-size: 12px; color: #002D58; text-decoration: underline; margin-top: 4px;">
              ${item.dayLink ? `<a href="${item.dayLink}" style="color: #002D58;">${item.day}</a>` : item.day}
            </div>
            <div style="font-size: 11px; color: #666; margin-top: 2px;">
              ${item.taskNr}
            </div>
          </td>
          <td style="padding: 10px 10px; border-bottom: 1px solid #ddd; vertical-align: top; width: 150px; font-size: 13px;">
            ${preciseTime}
          </td>
          <td style="padding: 10px 10px; border-bottom: 1px solid #ddd; vertical-align: top; width: 120px; font-size: 13px;">
            ${item.service}
          </td>
          <td style="padding: 10px 10px; border-bottom: 1px solid #ddd; vertical-align: top; width: 100px; font-size: 13px;">
            ${item.hasDowntime ? `<span style="color: #E2001A; font-weight: bold;">${item.downtimeDuration || 'Yes'}</span>` : '-'}
          </td>
          <td style="padding: 10px 0; border-bottom: 1px solid #ddd; vertical-align: top; font-size: 13px; line-height: 1.4;">
            ${desc}
          </td>
        </tr>
      `;
    }).join('');

    return `
      <div style="margin-top: 50px;">
        <h3 style="margin-bottom: 20px; border-bottom: none;">
          <span style="color: #0078D4; font-size: 20px; font-weight: bold;">${formatDateEN(date)}</span>
          <span style="color: #666; font-size: 20px; font-weight: bold; margin-left: 20px;">${formatDateDE(date)}</span>
        </h3>
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
          <thead>
            <tr style="text-align: left; color: #0078D4; font-size: 16px;">
              <th style="padding-bottom: 10px; border-bottom: 2px solid #0078D4; font-weight: 500;">Location / CRQ</th>
              <th style="padding-bottom: 10px; border-bottom: 2px solid #0078D4; font-weight: 500; padding-left: 10px;">Time (CET)</th>
              <th style="padding-bottom: 10px; border-bottom: 2px solid #0078D4; font-weight: 500; padding-left: 10px;">Service</th>
              <th style="padding-bottom: 10px; border-bottom: 2px solid #0078D4; font-weight: 500; padding-left: 10px;">Downtime</th>
              <th style="padding-bottom: 10px; border-bottom: 2px solid #0078D4; font-weight: 500;">Description</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>
    `;
  }).join('');

  return `
<html>
<body style="font-family: Tahoma, sans-serif; color: #333; line-height: 1.6; margin: 0; padding: 0; background-color: #f5f5f7;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f7; padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Main Email Container -->
        <table width="800" cellpadding="0" cellspacing="0" border="0" style="background-color: white; border: 1px solid #d1d5db; border-radius: 4px; max-width: 800px; width: 100%; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td>
              <!-- Header with ZF Logo and dynamic titles -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding: 20px 40px; background-color: white; border-bottom: 2px solid #002D58;">
    <tr>
      <td width="80" align="left" style="vertical-align: middle;">
        <img src="cid:zf-logo" width="80" alt="ZF Logo" style="display: block; border: 0;" />
      </td>
      <td align="left" style="padding: 0 40px; vertical-align: middle;">
        <div style="font-size: 24px; color: #002D58; font-weight: 500;">
            IT Maintenance Window<br/>
            ${monthsEN[monthIdx]} ${year}
        </div>
      </td>
      <td align="right" style="vertical-align: middle;">
        <div style="font-size: 24px; color: #666; font-weight: 500;">
            IT - Wartungsfenster<br/>
            ${monthsDE[monthIdx]} ${year}
        </div>
      </td>
    </tr>
  </table>
  
  <div style="max-width: 900px; margin: 0 auto; padding: 30px 40px;">
    <p style="font-size: 15px;">
      <strong>Dear Ladies and Gentlemen,</strong><br/>
      <span style="color: gray; font-weight: bold;">Sehr geehrte Damen und Herren,</span>
    </p>
    
    <p style="margin-top: 15px; font-size: 15px;">
      I would like to draw your attention to the upcoming IT maintenance window of ZF Information Technology, which will take place on<br/>
      <strong>${formatDateTimeEN(validMinDate)} (CET) until ${formatDateTimeEN(validMaxDate)} (CET).</strong><br/>
      <span style="color: gray;">Hiermit weise ich auf das anstehende IT-Wartungsfenster der ZF-Informatik hin, welches in der Zeit vom<br/>
      <strong>${formatDateTimeDE(validMinDate)} (CET) bis ${formatDateTimeDE(validMaxDate)} (CET)</strong> stattfinden wird.</span>
    </p>

    <p style="margin-top: 25px; font-size: 15px;">
      <span style="color: #0078D4;">Impact on IT-Services:</span><br/>
      <span style="color: gray;">Auswirkungen auf die IT-Services:</span>
    </p>
    
    ${sectionsHtml}
    
    <p style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px; color: #666; font-size: 13px;">
      Best regards / Mit freundlichen Grüßen,<br/>
      <strong>ZF Group - IT Maintenance Team</strong>
    </p>
  </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};

export const generateEml = (html: string): string => {
  const boundary = `----=_NextPart_${Math.random().toString(36).slice(2)}`;
  const relatedBoundary = `----=_RelatedPart_${Math.random().toString(36).slice(2)}`;
  const subject = "IT Maintenance Window / IT - Wartungsfenster";

  return [
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/related; boundary="${relatedBoundary}"`,
    '',
    `--${relatedBoundary}`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    'Please open this mail in an HTML-capable client.',
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    btoa(unescape(encodeURIComponent(html))),
    '',
    `--${boundary}--`,
    '',
    `--${relatedBoundary}`,
    'Content-Type: image/png; name="zf-logo.png"',
    'Content-Transfer-Encoding: base64',
    'Content-ID: <zf-logo>',
    'Content-Disposition: inline; filename="zf-logo.png"',
    '',
    zfLogoBase64,
    '',
    `--${relatedBoundary}--`
  ].join('\r\n');
};
