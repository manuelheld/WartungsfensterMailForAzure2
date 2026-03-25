import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileUp, ChevronRight, AlertCircle, RotateCcw } from 'lucide-react';
import { parseExcel } from '../services/excelService';
import { MaintenanceItem } from '../types';

interface ExcelUploaderProps {
    onDataLoaded: (data: MaintenanceItem[]) => void;
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
    hasStoredData?: boolean;
    onRestore?: () => void;
}

const ExcelUploader: React.FC<ExcelUploaderProps> = ({ onDataLoaded, isLoading, setIsLoading, hasStoredData, onRestore }) => {
    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (file) {
            setIsLoading(true);
            try {
                const data = await parseExcel(file);
                onDataLoaded(data);
            } catch (error) {
                console.error('Error parsing excel:', error);
                alert('Fehler beim Lesen der Excel-Datei. Bitte stellen Sie sicher, dass es sich um eine gültige .xlsx-Datei handelt.');
            } finally {
                setIsLoading(false);
            }
        }
    }, [onDataLoaded, setIsLoading]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
        },
        multiple: false
    });

    return (
        <div
            {...getRootProps()}
            className={`
        bg-white rounded-3xl shadow-xl border-4 border-dashed p-12 transition-all cursor-pointer
        ${isDragActive ? 'border-zf-blue bg-zf-blue/5 scale-[1.02]' : 'border-gray-100 hover:border-zf-blue/20 hover:shadow-2xl'}
      `}
        >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center justify-center py-10 px-4 group">
                <div className={`
          p-6 rounded-full mb-6 transition-all duration-500
          ${isDragActive ? 'bg-zf-blue text-white shadow-xl rotate-12' : 'bg-zf-blue/5 text-zf-blue group-hover:bg-zf-blue/10'}
        `}>
                    {isLoading ? (
                        <div className="w-12 h-12 border-4 border-zf-blue border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <FileUp className="w-12 h-12" />
                    )}
                </div>

                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    {isDragActive ? 'Datei hier loslassen' : 'Excel Datei hierher ziehen'}
                </h3>
                <p className="text-gray-500 mb-8 font-medium">
                    oder klicken zum Auswählen (.xlsx)
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <button className="bg-zf-blue text-white font-bold py-4 px-10 rounded-xl hover:bg-zf-lightBlue transition-all transform hover:-translate-y-1 active:scale-95 shadow-lg flex items-center gap-2">
                        Datei auswählen <ChevronRight className="w-5 h-5" />
                    </button>
                    {hasStoredData && onRestore && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onRestore(); }}
                            className="bg-white border-2 border-zf-blue text-zf-blue font-bold py-3.5 px-8 rounded-xl hover:bg-zf-blue/5 transition-all transform hover:-translate-y-1 active:scale-95 shadow-md flex items-center gap-2"
                        >
                            <RotateCcw className="w-5 h-5" /> Letzte Datei laden
                        </button>
                    )}
                </div>

                {/* Info Box */}
                <div className="mt-12 p-4 bg-gray-50 rounded-2xl flex items-start gap-3 max-w-md text-left border border-gray-100">
                    <AlertCircle className="w-5 h-5 text-zf-blue mt-0.5 shrink-0" />
                    <p className="text-sm text-gray-500 leading-relaxed font-medium">
                        Stellen Sie sicher, dass Ihre Excel-Datei die Standard-Wartungsfenster-Spalten enthält (A: Tag, B: Task Nr., C: Beschreibung, ...).
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ExcelUploader;
