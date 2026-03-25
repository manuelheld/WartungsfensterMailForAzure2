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
                const payload = await response.json();
                if (payload && payload.clientPrincipal) {
                    setCurrentUser(payload.clientPrincipal.userDetails);
                } else {
                    // Fallback for local development
                    if (window.location.hostname === 'localhost') {
                        setCurrentUser('Manuel Held (Local Dev)');
                    }
                }
            } catch (error) {
                console.log('Not running in Azure or Auth not enabled');
                // Fallback for local development
                if (window.location.hostname === 'localhost') {
                    setCurrentUser('Manuel Held (Local Dev)');
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
        <div className="min-h-screen flex flex-col font-sans selection:bg-zf-blue selection:text-white">
            {/* Fixed Top Header (72px) */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-zf-blue text-white shadow-xl h-[72px] flex items-center">
                <div className="container mx-auto px-6 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/10 p-2 rounded-lg">
                            <CheckCircle2 className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight">IT Maintenance Window</h1>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-sm font-bold opacity-70 uppercase tracking-[0.2em] hidden sm:block">
                            ZF Group
                        </div>
                        {currentUser && (
                            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl border border-white/10">
                                <User className="w-4 h-4" />
                                <span className="text-xs font-bold tracking-wide">{currentUser}</span>
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
                            <section className="text-center space-y-6 pt-10 pb-4">
                                <div className="inline-block px-4 py-1.5 bg-zf-blue/10 text-zf-blue text-sm font-bold rounded-full uppercase tracking-wider mb-2">
                                    Digital Transformation
                                </div>
                                <h2 className="text-5xl font-black text-gray-900 tracking-tight leading-tight">
                                    Maintenance Mail <span className="text-zf-blue italic underline decoration-zf-blue/20">Generator</span>
                                </h2>
                                <p className="text-gray-500 text-xl max-w-2xl mx-auto font-medium leading-relaxed">
                                    Konvertieren Sie Ihre Wartungsplanung effizient in professionell formatierte E-Mails für die weltweite Kommunikation.
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
            <footer className="py-10 bg-white border-t border-gray-100 mt-20">
                <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-gray-400 text-sm font-semibold uppercase tracking-widest">
                        &copy; {new Date().getFullYear()} ZF Group - IT INF Maintenance Management
                    </div>
                    <div className="flex gap-8 text-sm font-bold text-gray-400">
                        <span className="hover:text-zf-blue cursor-pointer transition-colors">Privacy</span>
                        <span className="hover:text-zf-blue cursor-pointer transition-colors">Support</span>
                        <span className="hover:text-zf-blue cursor-pointer transition-colors">Standards</span>
                    </div>
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
