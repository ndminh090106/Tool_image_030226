import React, { useState } from 'react';
import { Download, Package, Check, Loader2, Image as ImageIcon } from 'lucide-react';
import JSZip from 'jszip';
import { CollageResult } from '../types';

interface CollageGridProps {
  results: CollageResult[];
  isGenerating: boolean;
  progress: number;
}

const CollageGrid: React.FC<CollageGridProps> = ({ results, isGenerating, progress }) => {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownloadImage = (collage: CollageResult) => {
    const link = document.createElement('a');
    link.href = collage.url;
    link.download = collage.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPack = async (collage: CollageResult) => {
    setDownloadingId(collage.id);
    try {
      const zip = new JSZip();
      
      // 1. Add the Result Collage
      zip.file(`RESULT_${collage.name}`, collage.blob);

      // 2. Add Source Images
      const sourcesFolder = zip.folder("source_images");
      if (sourcesFolder) {
        // Fetch blobs for source images (since we only have object URLs in memory)
        // Note: In a real app with backend URLs, we'd fetch. Here we have local files or blob URLs.
        // Since we have the `File` object in UploadedImage, we can use that directly!
        collage.usedImages.forEach((img, idx) => {
           // Create a unique name
           const ext = img.file.name.split('.').pop() || 'jpg';
           sourcesFolder.file(`source_${idx + 1}_${img.file.name}`, img.file);
        });
      }

      const content = await zip.generateAsync({ type: 'blob' });
      
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Pack_${collage.name.replace('.jpg', '')}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Failed to zip", e);
      alert("Could not create download pack.");
    } finally {
      setDownloadingId(null);
    }
  };

  if (isGenerating) {
    return (
      <div className="w-full py-20 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="w-64 h-2 bg-gray-100 rounded-full overflow-hidden mb-6">
          <div 
            className="h-full bg-indigo-600 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center gap-3 text-indigo-600 mb-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <h3 className="text-lg font-semibold">Creating Variations...</h3>
        </div>
        <p className="text-gray-500 text-sm">Generating collage {Math.ceil((progress / 100) * 20)} of 20</p>
      </div>
    );
  }

  if (results.length === 0) {
    return null;
  }

  return (
    <div className="w-full animate-in fade-in duration-500 slide-in-from-bottom-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Generated Collages</h2>
        <span className="text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
          {results.length} Variations
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {results.map((collage) => (
          <div key={collage.id} className="group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all hover:shadow-lg hover:border-indigo-200 flex flex-col">
            
            {/* Image Preview Area */}
            <div 
              className="aspect-[4/3] w-full relative bg-gray-100 overflow-hidden cursor-pointer"
              onClick={() => window.open(collage.url, '_blank')}
            >
              <img 
                src={collage.url} 
                alt="Collage Preview" 
                className="w-full h-full object-contain bg-gray-50 p-2"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                 <div className="bg-white/90 backdrop-blur-sm text-gray-700 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                    Click to Zoom
                 </div>
              </div>
            </div>

            {/* Action Area */}
            <div className="p-4 bg-white flex flex-col gap-3 border-t border-gray-100">
               <div className="flex justify-between items-start">
                   <div>
                       <h4 className="text-sm font-semibold text-gray-900 truncate" title={collage.name}>{collage.name}</h4>
                       <p className="text-xs text-gray-500 mt-0.5">{collage.usedImages.length} images used</p>
                   </div>
               </div>
               
               <div className="grid grid-cols-2 gap-2 mt-1">
                   {/* Download Image Only */}
                   <button 
                     onClick={(e) => { e.stopPropagation(); handleDownloadImage(collage); }}
                     className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors text-xs font-medium"
                     title="Download Final Collage (JPG)"
                   >
                     <ImageIcon className="w-3.5 h-3.5" />
                     Result
                   </button>

                   {/* Download Pack */}
                   <button 
                     onClick={(e) => { e.stopPropagation(); handleDownloadPack(collage); }}
                     disabled={downloadingId === collage.id}
                     className="flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors text-xs font-medium"
                     title="Download Result + Source Images (ZIP)"
                   >
                     {downloadingId === collage.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                     ) : (
                        <Package className="w-3.5 h-3.5" />
                     )}
                     Source Pack
                   </button>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CollageGrid;
