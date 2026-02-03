import React, { useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { UploadedImage } from '../types';

interface UploadZoneProps {
  title: string;
  description: string;
  files: UploadedImage[];
  onUpload: (files: File[]) => void;
  onRemove: (id: string) => void;
  multiple?: boolean;
  maxFiles?: number;
  accept?: string;
  required?: boolean;
}

const UploadZone: React.FC<UploadZoneProps> = ({
  title,
  description,
  files,
  onUpload,
  onRemove,
  multiple = false,
  maxFiles = 1,
  accept = "image/*",
  required = false
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(Array.from(e.target.files));
      // Reset input value to allow re-uploading same file if needed
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUpload(Array.from(e.dataTransfer.files));
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
          {title}
          {required && <span className="text-red-500">*</span>}
        </label>
        <span className="text-xs text-gray-500">{files.length} / {maxFiles}</span>
      </div>

      <div
        className={`relative border-2 border-dashed rounded-xl p-6 transition-all duration-200 
          ${files.length >= maxFiles && !multiple 
            ? 'border-gray-200 bg-gray-50' 
            : 'border-indigo-200 hover:border-indigo-400 bg-indigo-50/30'
          }`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {files.length === 0 ? (
          <div 
            className="flex flex-col items-center justify-center text-center cursor-pointer h-32"
            onClick={() => inputRef.current?.click()}
          >
            <div className="bg-indigo-100 p-3 rounded-full mb-3">
              <Upload className="w-6 h-6 text-indigo-600" />
            </div>
            <p className="text-sm font-medium text-gray-900">Click to upload</p>
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
             {files.map((file) => (
               <div key={file.id} className="group relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-white">
                 <img 
                   src={file.url} 
                   alt="Preview" 
                   className="w-full h-full object-cover"
                 />
                 <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      onClick={() => onRemove(file.id)}
                      className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                 </div>
               </div>
             ))}
             {files.length < maxFiles && (
               <div 
                 className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors"
                 onClick={() => inputRef.current?.click()}
               >
                 <Upload className="w-5 h-5 mb-1" />
                 <span className="text-xs">Add</span>
               </div>
             )}
          </div>
        )}
        
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          multiple={multiple}
          accept={accept}
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
};

export default UploadZone;
