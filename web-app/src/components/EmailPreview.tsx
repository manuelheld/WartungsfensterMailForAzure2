import React from 'react';
import { X, Copy, Download, CheckCircle2, MailOpen } from 'lucide-react';
import { generateEml } from '../services/emailService';
import { zfLogoBase64 } from '../services/zfLogoBase64';

interface EmailPreviewProps {
    html: string;
    onClose: () => void;
}

const EmailPreview: React.FC<EmailPreviewProps> = ({ html, onClose }) => {
    const [copied, setCopied] = React.useState(false);

    // Replace the CID reference with a Base64 data URI for web preview, copy, and HTML download
    const webHtml = html.replace('cid:zf-logo', `data:image/png;base64,${zfLogoBase64}`);

    const handleCopy = () => {
        navigator.clipboard.writeText(webHtml);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const blob = new Blob([webHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Maintenance_Mail.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleEmlDownload = () => {
        const emlContent = generateEml(html);
        const blob = new Blob([emlContent], { type: 'message/rfc822' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Maintenance_Mail.eml';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10">
            <div className="absolute inset-0 bg-zf-blue/40 backdrop-blur-md" onClick={onClose}></div>

            <div className="relative bg-white w-full max-w-5xl h-full max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
                {/* Modal Header */}
                <div className="flex justify-between items-center px-8 py-6 border-b border-gray-100 bg-gray-50/50">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Vorschau</h2>
                        <p className="text-sm text-gray-500 font-medium">Prüfen Sie Ihre generierte Wartungs-E-Mail</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleCopy}
                            className={`
                flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all
                ${copied ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
              `}
                        >
                            {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            {copied ? 'Kopiert!' : 'HTML kopieren'}
                        </button>
                        <button
                            onClick={handleEmlDownload}
                            className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold bg-white text-zf-blue border-2 border-zf-blue hover:bg-zf-blue/5 transition-all"
                        >
                            <MailOpen className="w-4 h-4" />
                            In Outlook öffnen
                        </button>
                        <button
                            onClick={handleDownload}
                            className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold bg-zf-blue text-white hover:bg-zf-lightBlue transition-all"
                        >
                            <Download className="w-4 h-4" />
                            Herunterladen (.html)
                        </button>
                        <button
                            onClick={onClose}
                            className="p-3 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-all ml-2"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Modal Content - Preview Webview */}
                <div className="flex-1 overflow-auto p-8 bg-gray-100/30">
                    <div className="bg-white shadow-sm rounded-2xl overflow-hidden min-h-full max-w-[800px] mx-auto border border-gray-100">
                        <iframe
                            srcDoc={webHtml}
                            className="w-full h-full min-h-[600px] border-none"
                            title="Email Preview"
                        />
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="px-8 py-4 bg-gray-50/50 border-t border-gray-100 text-center">
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">
                        Diese Vorschau entspricht dem finalen Email-Format
                    </p>
                </div>
            </div>
        </div>
    );
};

export default EmailPreview;
