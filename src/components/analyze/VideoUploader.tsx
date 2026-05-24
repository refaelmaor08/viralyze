'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Video, X, CheckCircle, Loader2 } from 'lucide-react';
import { formatFileSize } from '@/lib/utils';
import { formatDurationLimit } from '@/lib/plans';

interface VideoUploaderProps {
  file: File | null;
  onFileSelected: (file: File) => void;
  onRemove: () => void;
  frameProgress?: { current: number; total: number } | null;
  framesReady?: boolean;
  thumbnailUrl?: string | null;
  planMaxDuration?: number;
}

export default function VideoUploader({
  file,
  onFileSelected,
  onRemove,
  frameProgress,
  framesReady,
  thumbnailUrl,
  planMaxDuration,
}: VideoUploaderProps) {
  const [isDragActive, setIsDragActive] = useState(false);

  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted[0]) onFileSelected(accepted[0]);
      setIsDragActive(false);
    },
    [onFileSelected]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { 'video/*': ['.mp4', '.mov', '.avi', '.webm', '.m4v'] },
    maxSize: 500 * 1024 * 1024,
    multiple: false,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
  });

  if (file) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl overflow-hidden"
        style={{ border: '1px solid rgba(212,168,67,0.2)', background: 'rgba(212,168,67,0.04)' }}
      >
        <div className="flex items-center gap-4 p-4">
          {/* Thumbnail */}
          <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 relative bg-[rgba(212,168,67,0.1)]">
            {thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumbnailUrl} alt="preview" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Video className="w-7 h-7 text-[#D4A843]" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 text-right">
            <p className="font-semibold text-white text-sm truncate">{file.name}</p>
            <p className="text-xs text-white/50 mt-0.5">{formatFileSize(file.size)}</p>

            {!framesReady && frameProgress ? (
              <div className="flex items-center justify-end gap-1.5 mt-1.5">
                <span className="text-xs text-[#D4A843]">
                  מחלץ פריימים... {frameProgress.current}/{frameProgress.total}
                </span>
                <Loader2 className="w-3 h-3 text-[#D4A843] animate-spin" />
              </div>
            ) : framesReady ? (
              <div className="flex items-center justify-end gap-1.5 mt-1.5">
                <span className="text-xs text-green-400">הסרטון מוכן לניתוח</span>
                <CheckCircle className="w-3.5 h-3.5 text-green-400" />
              </div>
            ) : (
              <div className="flex items-center justify-end gap-1.5 mt-1.5">
                <span className="text-xs text-[#D4A843]">מכין סרטון...</span>
                <Loader2 className="w-3 h-3 text-[#D4A843] animate-spin" />
              </div>
            )}
          </div>

          {/* Remove */}
          <button
            onClick={onRemove}
            className="w-8 h-8 rounded-full glass flex items-center justify-center hover:bg-red-500/20 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4 text-white/50" />
          </button>
        </div>

        {/* Frame progress bar */}
        {!framesReady && (
          <div className="h-0.5 bg-[rgba(255,255,255,0.05)]">
            <motion.div
              className="h-full bg-gradient-to-r from-[#D4A843] to-[#F0C060]"
              animate={{
                width: frameProgress
                  ? `${(frameProgress.current / frameProgress.total) * 100}%`
                  : '15%',
              }}
              transition={{ duration: 0.4 }}
            />
          </div>
        )}
      </motion.div>
    );
  }

  const rootProps = getRootProps();

  return (
    <div
      {...rootProps}
      className="rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-all relative overflow-hidden"
      style={{
        borderColor: isDragActive ? 'rgba(212,168,67,0.7)' : 'rgba(212,168,67,0.18)',
        background: isDragActive ? 'rgba(212,168,67,0.07)' : 'rgba(255,255,255,0.015)',
      }}
    >
      <input {...getInputProps()} />

      <AnimatePresence>
        {isDragActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[radial-gradient(circle,rgba(212,168,67,0.1)_0%,transparent_70%)]"
          />
        )}
      </AnimatePresence>

      <motion.div
        animate={{ y: isDragActive ? -4 : 0 }}
        transition={{ duration: 0.2 }}
        className="relative"
      >
        <div className="w-16 h-16 rounded-2xl bg-[rgba(212,168,67,0.1)] flex items-center justify-center mx-auto mb-4">
          <Upload className="w-8 h-8 text-[#D4A843]" />
        </div>
        <h3 className="text-lg font-bold mb-2">
          {isDragActive ? 'שחרר כאן' : 'העלה את הסרטון שלך'}
        </h3>
        <p className="text-white/50 text-sm mb-1">
          גרור ושחרר, או לחץ לבחירה
        </p>
        <p className="text-xs text-white/30 mb-1">MP4, MOV, WebM · עד 500MB</p>
        {planMaxDuration && (
          <p className="text-xs font-medium mt-2" style={{ color: 'rgba(212,168,67,0.6)' }}>
            מגבלת התוכנית שלך: עד {formatDurationLimit(planMaxDuration)}
          </p>
        )}
      </motion.div>
    </div>
  );
}
