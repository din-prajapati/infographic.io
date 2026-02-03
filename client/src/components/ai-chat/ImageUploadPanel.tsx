/**
 * Image Upload Panel
 * Upload reference images for AI generation
 */

import { motion, AnimatePresence } from 'motion/react';
import { Upload, Image as ImageIcon, X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface ImageUploadPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onImageUpload: (imageUrl: string) => void;
  buttonRef?: React.RefObject<HTMLButtonElement>;
}

export function ImageUploadPanel({ isOpen, onClose, onImageUpload, buttonRef }: ImageUploadPanelProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [position, setPosition] = useState({ bottom: '8rem', right: '2rem' });

  useEffect(() => {
    if (isOpen && buttonRef?.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        bottom: `${window.innerHeight - rect.top + 8}px`, // 8px above button
        right: `${window.innerWidth - rect.right}px`, // align with right edge of button
      });
    }
  }, [isOpen, buttonRef]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFiles = (files: FileList) => {
    const file = files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setUploadedImages((prev) => [...prev, result]);
        onImageUpload(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (buttonRef && buttonRef.current) {
      buttonRef.current.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.multiple = true;
        input.onchange = (e) => {
          const files = e.target.files;
          if (files) {
            handleFiles(files);
          }
        };
        input.click();
      });
    }
  }, [buttonRef]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 z-[100]"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="fixed bottom-32 right-8 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-[110]"
            style={position}
          >
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-sm">Upload Reference 📷</h3>
              <p className="text-xs text-gray-500 mt-1">Add images for AI to reference</p>
            </div>

            <div className="p-4 space-y-3">
              {/* Upload Area */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragActive
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-1">Drag & drop images here</p>
                <p className="text-xs text-gray-500 mb-3">or</p>
                <label className="inline-block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files && handleFiles(e.target.files)}
                    className="hidden"
                    multiple
                  />
                  <span className="px-4 py-2 bg-gray-900 text-white text-xs rounded-lg hover:bg-gray-800 cursor-pointer inline-block">
                    Browse Files
                  </span>
                </label>
              </div>

              {/* Uploaded Images */}
              {uploadedImages.length > 0 && (
                <div>
                  <h4 className="text-xs text-gray-600 mb-2">Uploaded ({uploadedImages.length})</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {uploadedImages.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={img}
                          alt={`Upload ${idx + 1}`}
                          className="w-full aspect-square object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tips */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-700">
                  <strong>Tip:</strong> Upload property photos, style references, or brand logos for better AI results.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}