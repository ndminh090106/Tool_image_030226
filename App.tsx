import React, { useState } from 'react';
import { Settings, Download, RotateCcw, Zap, Layout, RectangleHorizontal, RectangleVertical, Square } from 'lucide-react';
import JSZip from 'jszip';

import UploadZone from './components/UploadZone';
import CollageGrid from './components/CollageGrid';
import { UploadedImage, AspectRatio, QualityPreset, CollageResult } from './types';
import { MAX_ZONE_2_IMAGES, MIN_ZONE_2_IMAGES, ASPECT_RATIOS, TOTAL_COLLAGES_TO_GENERATE } from './constants';
import { generateSingleCollage } from './services/collageEngine';

const App: React.FC = () => {
  // State
  const [baseImage, setBaseImage] = useState<UploadedImage | null>(null);
  const [randomImages, setRandomImages] = useState<UploadedImage[]>([]);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [quality, setQuality] = useState<QualityPreset>('2K');
  const [generatedCollages, setGeneratedCollages] = useState<CollageResult[]>([]);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  // Handlers
  const handleBaseUpload = (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      const newImage: UploadedImage = {
        id: Math.random().toString(36).substr(2, 9),
        url: URL.createObjectURL(file),
        file
      };
      setBaseImage(newImage);
    }
  };

  const handleRandomUpload = (files: File[]) => {
    const remainingSlots = MAX_ZONE_2_IMAGES - randomImages.length;
    const filesToAdd = files.slice(0, remainingSlots);

    const newImages: UploadedImage[] = filesToAdd.map(f => ({
      id: Math.random().toString(36).substr(2, 9),
      url: URL.createObjectURL(f),
      file: f
    }));

    setRandomImages(prev => [...prev, ...newImages]);
  };

  const removeBaseImage = () => setBaseImage(null);
  const removeRandomImage = (id: string) => {
    setRandomImages(prev => prev.filter(img => img.id !== id));
  };

  // Only resets the results, keeps the uploads
  const handleClearResults = () => {
    setGeneratedCollages([]);
    setProgress(0);
    // Cleanup generated blobs
    generatedCollages.forEach(c => URL.revokeObjectURL(c.url));
  };

  // Full reset (not currently hooked up to main button based on requirements, but useful utility)
  const handleFullReset = () => {
    handleClearResults();
    setBaseImage(null);
    setRandomImages([]);
    if (baseImage) URL.revokeObjectURL(baseImage.url);
    randomImages.forEach(img => URL.revokeObjectURL(img.url));
  };

  const handleGenerate = async () => {
    if (!baseImage || randomImages.length < MIN_ZONE_2_IMAGES) return;

    setIsGenerating(true);
    setGeneratedCollages([]);
    setProgress(0);

    const results: CollageResult[] = [];
    
    try {
      // Generate 20 collages
      for (let i = 0; i < TOTAL_COLLAGES_TO_GENERATE; i++) {
        // Yield to main thread for UI updates using simple timeout
        await new Promise(resolve => setTimeout(resolve, 50));

        const result = await generateSingleCollage(
          baseImage,
          randomImages,
          aspectRatio,
          quality,
          i
        );

        const collageRes: CollageResult = {
          id: Math.random().toString(36),
          url: result.url,
          blob: result.blob,
          name: `Collage-${i + 1}.jpg`,
          usedImages: result.usedImages
        };

        results.push(collageRes);
        setProgress(((i + 1) / TOTAL_COLLAGES_TO_GENERATE) * 100);
      }
      setGeneratedCollages(results);
    } catch (error) {
      console.error("Generation failed", error);
      alert("An error occurred during generation. Please check your images and try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadAll = async () => {
    if (generatedCollages.length === 0) return;
    
    const zip = new JSZip();
    generatedCollages.forEach((collage) => {
      zip.file(collage.name, collage.blob);
    });

    const content = await zip.generateAsync({ type: 'blob' });
    
    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'All_Collages.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Validation
  const canGenerate = baseImage !== null && randomImages.length >= MIN_ZONE_2_IMAGES;

  // Helper for visual icons
  const getIconForRatio = (ratio: AspectRatio) => {
     switch(ratio) {
        case '1:1': return <Square className="w-5 h-5" />;
        case '9:16': 
        case '3:4': 
        case '900:1600': return <RectangleVertical className="w-5 h-5" />;
        default: return <RectangleHorizontal className="w-5 h-5" />;
     }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-20 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg shadow-sm">
              <Layout className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">CollagePro</h1>
          </div>
          
          <div className="flex items-center gap-3">
             {generatedCollages.length > 0 && (
                <button
                onClick={handleClearResults}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors shadow-sm"
                title="Clears generated results but keeps uploaded images"
              >
                <RotateCcw className="w-4 h-4" />
                Reset Results
              </button>
             )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Uploads */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
               <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-gray-900">
                 <span className="flex items-center justify-center w-7 h-7 rounded-full bg-indigo-600 text-white text-sm font-bold">1</span>
                 Upload Images
               </h2>
               
               <div className="space-y-6">
                 <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                    <UploadZone 
                        title="Fixed Image (Star)"
                        description="Appears prominently in every collage"
                        files={baseImage ? [baseImage] : []}
                        onUpload={handleBaseUpload}
                        onRemove={removeBaseImage}
                        maxFiles={1}
                        required={true}
                    />
                 </div>
                 
                 <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                    <UploadZone 
                        title="Gallery Images"
                        description={`Mix & match pool (${MIN_ZONE_2_IMAGES}-${MAX_ZONE_2_IMAGES} photos)`}
                        files={randomImages}
                        onUpload={handleRandomUpload}
                        onRemove={removeRandomImage}
                        multiple={true}
                        maxFiles={MAX_ZONE_2_IMAGES}
                        required={true}
                    />
                 </div>
               </div>
               
               {randomImages.length > 0 && randomImages.length < MIN_ZONE_2_IMAGES && (
                 <div className="mt-4 p-3 bg-amber-50 text-amber-800 text-sm rounded-lg border border-amber-200 flex items-start gap-2">
                    <div className="mt-0.5">⚠️</div>
                    <div>Please upload at least {MIN_ZONE_2_IMAGES - randomImages.length} more gallery image(s).</div>
                 </div>
               )}
            </div>
          </div>

          {/* Right Column: Settings & Results */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Settings Panel */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-gray-900">
                 <span className="flex items-center justify-center w-7 h-7 rounded-full bg-indigo-600 text-white text-sm font-bold">2</span>
                 Configuration
               </h2>
              
              <div className="space-y-6">
                
                {/* Visual Aspect Ratio Selector */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Settings className="w-4 h-4 text-indigo-600" /> Target Layout
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {Object.entries(ASPECT_RATIOS).map(([key, value]) => {
                        const isSelected = aspectRatio === key;
                        return (
                            <button
                                key={key}
                                onClick={() => setAspectRatio(key as AspectRatio)}
                                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-200
                                    ${isSelected 
                                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-100 ring-offset-1' 
                                        : 'border-gray-100 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                                    }
                                `}
                            >
                                <div className={`mb-2 opacity-80 ${isSelected ? 'text-indigo-600' : 'text-gray-400'}`}>
                                    {getIconForRatio(key as AspectRatio)}
                                </div>
                                <span className="text-xs font-semibold">{key.replace(':', ' : ')}</span>
                                <span className="text-[10px] opacity-70 mt-0.5 text-center leading-tight">{value.label.split('(')[0]}</span>
                            </button>
                        );
                    })}
                  </div>
                </div>

                <div className="h-px bg-gray-100 my-4"></div>

                <div className="flex flex-col sm:flex-row gap-6">
                    <div className="flex-1">
                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-amber-500" /> Output Resolution
                        </label>
                        <select
                            value={quality}
                            onChange={(e) => setQuality(e.target.value as QualityPreset)}
                            className="block w-full rounded-xl border-gray-200 bg-gray-50 border py-2.5 px-4 text-gray-900 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 sm:text-sm transition-shadow cursor-pointer"
                        >
                            <option value="2K">High Quality (2K) - Fast</option>
                            <option value="4K">Ultra Quality (4K) - Print Ready</option>
                        </select>
                    </div>

                    <div className="flex items-end flex-1">
                        <button
                        onClick={handleGenerate}
                        disabled={!canGenerate || isGenerating}
                        className={`w-full flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-white shadow-md transition-all focus:ring-4 focus:ring-indigo-100
                            ${!canGenerate || isGenerating 
                            ? 'bg-gray-300 cursor-not-allowed shadow-none' 
                            : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] shadow-indigo-200'
                            }`}
                        >
                        {isGenerating ? (
                            <>Generating...</>
                        ) : (
                            <>Generate Collages <Zap className="w-4 h-4 fill-white" /></>
                        )}
                        </button>
                    </div>
                </div>
              </div>
            </div>

            {/* Results Grid */}
            <CollageGrid 
              results={generatedCollages} 
              isGenerating={isGenerating} 
              progress={progress}
            />

            {generatedCollages.length > 0 && !isGenerating && (
                <div className="flex justify-center pt-4">
                    <button
                        onClick={handleDownloadAll}
                        className="flex items-center gap-2 px-8 py-4 bg-gray-900 text-white rounded-full font-bold shadow-lg hover:bg-gray-800 hover:scale-105 transition-all"
                    >
                        <Download className="w-5 h-5" />
                        Download All Collages (ZIP)
                    </button>
                </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
