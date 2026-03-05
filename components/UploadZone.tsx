'use client';

import React, { useCallback, useState } from 'react';
import Image from 'next/image';
import { useDropzone } from 'react-dropzone';
import { Camera, X } from 'lucide-react';
import { compressImage, fileToBase64 } from '@/lib/utils/compression';
import { useStore } from '@/lib/store';

interface UploadZoneProps {
  onImagesChange?: (images: string[]) => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onImagesChange }) => {
  const [previews, setPreviews] = useState<string[]>([]);
  const { setImages } = useStore();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const remainingSlots = 5 - previews.length;
    const filesToProcess = acceptedFiles.slice(0, remainingSlots);

    const processedImages = await Promise.all(
      filesToProcess.map(async (file) => {
        const compressed = await compressImage(file);
        return await fileToBase64(compressed);
      })
    );

    const newPreviews = [...previews, ...processedImages];
    setPreviews(newPreviews);
    setImages(newPreviews);
    if (onImagesChange) onImagesChange(newPreviews);
  }, [previews, setImages, onImagesChange]);

  const removeImage = (index: number) => {
    const newPreviews = previews.filter((_, i) => i !== index);
    setPreviews(newPreviews);
    setImages(newPreviews);
    if (onImagesChange) onImagesChange(newPreviews);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png'] },
    maxFiles: 5,
    disabled: previews.length >= 5,
  });

  return (
    <div className="w-full space-y-4">
      <div
        {...getRootProps()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
          isDragActive ? 'border-copper bg-copper/5' : 'border-navy/20 hover:border-copper'
        } ${previews.length >= 5 ? 'cursor-not-allowed opacity-50' : ''}`}
      >
        <input {...getInputProps()} />
        <Camera className="mb-2 h-8 w-8 text-navy" />
        <p className="text-center text-sm font-medium text-charcoal">
          {previews.length >= 5
            ? 'Maximum 5 photos uploaded'
            : isDragActive
              ? 'Drop photos here'
              : '📸 Upload Photos (up to 5)'}
        </p>
        <p className="text-xs text-charcoal-light">Drag & drop or click to select</p>
      </div>

      {previews.length > 0 && (
        <div className="grid grid-cols-5 gap-2">
          {previews.map((preview, index) => (
            <div key={index} className="relative aspect-square overflow-hidden rounded-md border border-navy/10">
              <Image
                src={preview}
                alt={`Upload ${index + 1}`}
                fill
                className="object-cover"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage(index);
                }}
                className="absolute right-1 top-1 rounded-full bg-navy/80 p-1 text-white hover:bg-navy"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
