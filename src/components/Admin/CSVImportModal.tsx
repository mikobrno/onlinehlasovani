import React, { useState } from 'react';
import { X, Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { useMember } from '../../contexts/MemberContext';

interface CSVImportModalProps {
  onClose: () => void;
}

export function CSVImportModal({ onClose }: CSVImportModalProps) {
  const { importMembersFromCSV } = useMember();
  const [csvData, setCsvData] = useState('');
  const [preview, setPreview] = useState<string[][]>([]);
  const [importing, setImporting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setCsvData(text);
        parsePreview(text);
      };
      reader.readAsText(file);
    }
  };

  const parsePreview = (data: string) => {
    const lines = data.split('\n').filter(line => line.trim());
    const parsedData = lines.slice(0, 6).map(line => 
      line.split(',').map(cell => cell.trim())
    );
    setPreview(parsedData);
  };

  const handleTextareaChange = (value: string) => {
    setCsvData(value);
    if (value.trim()) {
      parsePreview(value);
    } else {
      setPreview([]);
    }
  };

  const handleImport = async () => {
    if (!csvData.trim()) return;

    setImporting(true);
    try {
      // Skip header row for import
      const dataWithoutHeader = csvData.split('\n').slice(1).join('\n');
      importMembersFromCSV(dataWithoutHeader);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Import failed:', error);
    } finally {
      setImporting(false);
    }
  };

  const exampleCSV = `email,first_name,last_name,phone,unit_number,ownership_share
jan.novak@email.com,Jan,Novák,+420 123 456 789,12,12.5
marie.svoboda@email.com,Marie,Svobodová,+420 987 654 321,15,8.3
petr.dvorak@email.com,Petr,Dvořák,,18,10.2`;

  if (success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-md w-full p-6 text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-green-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Import úspěšný!</h3>
          <p className="text-gray-600">Členové byli úspěšně importováni.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Upload className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Import členů z CSV</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-blue-900">Formát CSV souboru</h3>
                <p className="text-sm text-blue-700 mt-1">
                  CSV soubor musí obsahovat sloupce v tomto pořadí: email, first_name, last_name, phone, unit_number, ownership_share
                </p>
              </div>
            </div>
          </div>

          {/* Example */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">Příklad CSV souboru:</h3>
            <div className="bg-gray-50 rounded-lg p-3 text-sm font-mono text-gray-800 overflow-x-auto">
              <pre>{exampleCSV}</pre>
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vybrat CSV soubor
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {/* Text Input */}
          <div>
            <label htmlFor="csvText" className="block text-sm font-medium text-gray-700 mb-2">
              Nebo vložit CSV data přímo
            </label>
            <textarea
              id="csvText"
              rows={8}
              value={csvData}
              onChange={(e) => handleTextareaChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              placeholder="Vložte CSV data zde..."
            />
          </div>

          {/* Preview */}
          {preview.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Náhled (prvních 5 řádků)</h3>
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {preview[0]?.map((header, index) => (
                        <th key={index} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {preview.slice(1).map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex} className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Zrušit
            </button>
            <button
              onClick={handleImport}
              disabled={!csvData.trim() || importing}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FileText className="h-4 w-4" />
              <span>{importing ? 'Importuji...' : 'Importovat'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}