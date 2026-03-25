import { useState, useEffect } from 'react'
import { CheckCircle2, User } from 'lucide-react'
import ExcelUploader from './components/ExcelUploader'
import MaintenanceTable from './components/MaintenanceTable'
import EmailPreview from './components/EmailPreview'
import { MaintenanceItem } from './types'
import { generateEmailHtml } from './services/emailService'
import { formatToAMPM } from './utils/timeUtils'

function App() {
    const [items, setItems] = useState<MaintenanceItem[]>([])
    const [storedItems, setStoredItems] = useState<MaintenanceItem[] | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [previewHtml, setPreviewHtml] = useState<string | null>(null)
    const [currentUser, setCurrentUser] = useState<string | null>(null)

    // Azure AD User Detection
    useEffect(() => {
        const fetchUser = async () => {
            try {
                // Azure Static Web Apps / App Service "Easy Auth" endpoint
                const response = await fetch('/.auth/me');
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                
                const text = await response.text();
                if (!text) throw new Error('Empty response');
                
                // If it returns HTML (like a 404 from Vite), parsing JSON will fail
                const payload = JSON.parse(text);
                
                let username = null;

                // Handle Azure format with clientPrincipal
                if (payload && 'clientPrincipal' in payload) {
                    if (payload.clientPrincipal === null) {
                        username = "Not logged in";
                    } else if (payload.clientPrincipal.userDetails) {
                        username = payload.clientPrincipal.userDetails;
                    } else if (payload.clientPrincipal.userId) {
                        username = payload.clientPrincipal.userId;
                    } else {
                        const keys = Object.keys(payload.clientPrincipal || {}).join(', ');
                        username = `CP Keys: ${keys}`.substring(0, 30);
                    }
                } 
                // Handle Azure App Service array format
                else if (Array.isArray(payload)) {
                    if (payload.length === 0) {
                        username = "Not logged in (Empty Array)";
                    } else {
                        const claims = payload[0].claims || [];
                        const nameClaim = claims.find((c: any) => 
                            c.typ === 'name' || 
                            c.typ === 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name' ||
                            c.typ === 'preferred_username'
                        );
                        
                        if (nameClaim && nameClaim.val) {
                            username = nameClaim.val;
                        } else if (payload[0].user_id) {
                            username = payload[0].user_id;
                        } else {
                            username = "No Name Claim Found";
                        }
                    }
                } 
                // Handle flat UserInfo object
                else if (typeof payload === 'object' && payload !== null) {
                    const claims = payload.claims || [];
                    const nameClaim = claims.find((c: any) => 
                        c.typ === 'name' || 
                        c.typ === 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name' ||
                        c.typ === 'preferred_username'
                    );
                    
                    if (nameClaim && nameClaim.val) {
                        username = nameClaim.val;
                    } else if (payload.name) {
                        username = payload.name;
                    } else if (payload.preferred_username) {
                        username = payload.preferred_username;
                    } else if (payload.user_id) {
                        username = payload.user_id;
                    } else if (payload.email) {
                        username = payload.email;
                    } else {
                        // Diagnostic: Show the keys of the JSON object so we know what's in there
                        username = `Keys: ${Object.keys(payload).join(', ')}`.substring(0, 35);
                    }
                } else {
                    username = `Type: ${typeof payload}`;
                }

                if (username) {
                    setCurrentUser(username);
                } else if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                    setCurrentUser('Manuel Held (Local Dev)');
                }
            } catch (error) {
                console.log('Not running in Azure or Auth not enabled', error);
                if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                    setCurrentUser('Manuel Held (Local Dev)');
                } else {
                    const errMsg = error instanceof Error ? error.message : 'Unknown Error';
                    setCurrentUser(`Auth Error: ${errMsg}`.substring(0, 35));
                }
            }
        };
        fetchUser();
    }, []);

    // Load from local storage on mount
    useEffect(() => {
        const stored = localStorage.getItem('maintenanceItems')
        if (stored) {
            try {
                // Parse dates back to Date objects since JSON.stringify converts them to strings
                const parsed = JSON.parse(stored).map((item: any) => {
                    const sortDate = new Date(item.sortDate);
                    const startDate = item.startDate ? new Date(item.startDate) : undefined;
                    const endDate = item.endDate ? new Date(item.endDate) : undefined;

                    // Force re-calculation of timeDisplay to ensure correct AM/PM format
                    let timeDisplay = item.timeDisplay;
                    const start = formatToAMPM(startDate || item.startDateTime);
                    const end = formatToAMPM(endDate || item.endDateTime);
                    if (start && end) {
                        timeDisplay = `${start} – ${end}`;
                    }

                    // Recovery: if service is missing or literally "Service", try to recover from notes (Column D)
                    let service = item.service;
                    if (!service || service === 'Service') {
                        service = String(item.notes || '').trim();
                    }

                    return {
                        ...item,
                        sortDate,
                        startDate,
                        endDate,
                        timeDisplay,
                        service
                    };
                });
                setStoredItems(parsed);
                // Also update current items and localStorage to "fix" the state permanently
                localStorage.setItem('maintenanceItems', JSON.stringify(parsed));
            } catch (e) {
                console.error('Failed to parse stored items', e)
            }
        }
    }, [])

    const handleDataLoaded = (data: MaintenanceItem[]) => {
        setItems(data)
        setStoredItems(data)
        localStorage.setItem('maintenanceItems', JSON.stringify(data))
    }

    const handleBack = () => {
        setItems([])
    }

    const handleRestore = () => {
        if (storedItems) {
            setItems(storedItems)
        }
    }

    const handleToggleSelect = (index: number) => {
        const newItems = [...items]
        newItems[index] = { ...newItems[index], isSelected: !newItems[index].isSelected }
        setItems(newItems)
    }

    const handleItemUpdate = (index: number, field: keyof MaintenanceItem, value: string) => {
        const newItems = [...items]
        newItems[index] = { ...newItems[index], [field]: value }
        setItems(newItems)
    }

    const handleGenerateEmail = (division: string) => {
        const selectedItems = items.filter(i => i.isSelected)
        if (selectedItems.length > 0) {
            const html = generateEmailHtml(selectedItems, division)
            setPreviewHtml(html)
        }
    }

    return (
        <div className="min-h-screen flex flex-col font-sans selection:bg-zf-cyan selection:text-white bg-zf-gray">
            {/* Fixed Top Header (72px) */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-zf-blue text-white shadow-md h-[72px] flex items-center">
                <div className="container mx-auto px-6 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/ZF_logo_STD_Blue_3CC.svg/250px-ZF_logo_STD_Blue_3CC.svg.png" width="40" alt="ZF Logo" className="filter brightness-0 invert" />
                        <h1 className="text-xl font-semibold tracking-wide">IT Maintenance Window</h1>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-sm font-bold text-zf-cyan uppercase tracking-[0.15em] hidden sm:block">
                            ZF Group
                        </div>
                        {currentUser && (
                            <div className="flex items-center gap-2 bg-zf-darkBlue/50 px-4 py-2 rounded-sm border border-zf-cyan/30">
                                <User className="w-4 h-4 text-zf-cyan" />
                                <span className="text-xs font-semibold tracking-wide">{currentUser}</span>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Content Area - Offset exactly by Header Height (72px) */}
            <main className="flex-1 mt-[72px] container mx-auto px-6 max-w-7xl pt-8">
                {items.length === 0 ? (
                    <>
                        {/* Landing State */}
                        <section className="text-center space-y-4 pt-12 pb-8">
                            <div className="inline-block px-4 py-1.5 bg-zf-cyan/10 text-zf-darkBlue text-xs font-bold uppercase tracking-widest border border-zf-cyan/20">
                                Tech BRM Tooling
                            </div>
                            <h2 className="text-4xl font-light text-zf-darkBlue tracking-tight leading-tight">
                                Maintenance Mail <span className="font-bold text-zf-blue border-b-2 border-zf-cyan">Generator</span>
                            </h2>
                            <p className="text-gray-500 text-lg max-w-2xl mx-auto font-normal leading-relaxed">
                                Konvertiert den Daily BRM IT Change Report effizient in professionell formatierte E-Mails für die weltweite Kommunikation.
                            </p>
                        </section>

                        <ExcelUploader
                            onDataLoaded={handleDataLoaded}
                            isLoading={isLoading}
                            setIsLoading={setIsLoading}
                            hasStoredData={storedItems !== null}
                            onRestore={handleRestore}
                        />
                    </>
                ) : (
                    <MaintenanceTable
                        items={items}
                        onToggleSelect={handleToggleSelect}
                        onGenerateEmail={handleGenerateEmail}
                        onItemUpdate={handleItemUpdate}
                        onBack={handleBack}
                    />
                )}
            </main>

            {/* Footer */}
            <footer className="py-8 bg-zf-darkBlue text-white mt-auto border-t-4 border-zf-cyan">
                <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 border-b border-white/10 pb-6 mb-6">
                    <div className="flex items-center gap-4">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/ZF_logo_STD_Blue_3CC.svg/250px-ZF_logo_STD_Blue_3CC.svg.png" width="60" alt="ZF Logo" className="filter brightness-0 invert" />
                    </div>
                    <div className="flex gap-8 text-xs font-semibold text-gray-300 uppercase tracking-widest">
                        <span className="hover:text-zf-cyan cursor-pointer transition-colors">Privacy</span>
                        <span className="hover:text-zf-cyan cursor-pointer transition-colors">Support</span>
                        <span className="hover:text-zf-cyan cursor-pointer transition-colors">Standards</span>
                    </div>
                </div>
                <div className="container mx-auto px-6 text-center text-[10px] text-gray-400 uppercase tracking-widest">
                    &copy; {new Date().getFullYear()} ZF Group - IT INF Maintenance Management
                </div>
            </footer>

            {/* Preview Modal */}
            {previewHtml && (
                <EmailPreview
                    html={previewHtml}
                    onClose={() => setPreviewHtml(null)}
                />
            )}
        </div>
    )
}

export default App
