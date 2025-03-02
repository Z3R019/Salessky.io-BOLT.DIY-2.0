import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X } from 'lucide-react';

interface CSVUploaderProps {
  onFileSelect: (file: File) => void;
}

const CSVUploader: React.FC<CSVUploaderProps> = ({ onFileSelect }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setSelectedFile(file);
        // Automatisch direkt nach Auswahl weitergeben, um die Mapping-Modal zu öffnen
        onFileSelect(file);
      } else {
        alert('Bitte laden Sie eine CSV-Datei hoch.');
      }
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
      'text/plain': ['.csv'],
    },
    maxFiles: 1,
  });

  return (
    <div>
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400'
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center">
          <Upload className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg font-medium mb-2">CSV-Datei auswählen</p>
          <p className="text-sm text-gray-500 mb-4">Oder per Drag & Drop hierher ziehen</p>
          <button className="btn btn-primary">CSV-Datei auswählen</button>
        </div>
      </div>
    </div>
  );
};

export default CSVUploader;
