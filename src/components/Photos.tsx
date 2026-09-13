import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ImagePlus, Loader2, TriangleAlert, X } from 'lucide-react';
import { ACCEPTED_TYPES, MAX_PHOTOS_PER_OP, photoUrl, removePhotos, uploadPhoto } from '../lib/storage';
import { cx } from './ui';

/* ------------------------------ PhotoPicker ------------------------------ */
/** Miniaturas + botão de adicionar; envia pro storage assim que o arquivo é escolhido. */
export function PhotoPicker({
  photos,
  onChange,
  disabled,
}: {
  photos: string[];
  onChange: (paths: string[]) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busyCount, setBusyCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const addFiles = async (files: FileList | File[]) => {
    setError(null);
    const room = MAX_PHOTOS_PER_OP - photos.length;
    const list = Array.from(files).slice(0, Math.max(0, room));
    if (Array.from(files).length > list.length) {
      setError(`Máximo de ${MAX_PHOTOS_PER_OP} fotos por operação.`);
    }
    let current = photos;
    for (const file of list) {
      setBusyCount((n) => n + 1);
      const { path, error: err } = await uploadPhoto(file);
      setBusyCount((n) => n - 1);
      if (err || !path) {
        setError(err ?? 'Falha ao enviar a foto.');
        continue;
      }
      current = [...current, path];
      onChange(current);
    }
  };

  const removeAt = (path: string) => {
    onChange(photos.filter((p) => p !== path));
    void removePhotos([path]);
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (!disabled && e.dataTransfer.files.length) void addFiles(e.dataTransfer.files);
        }}
        className={cx(
          'flex flex-wrap gap-2 rounded-lg p-1 transition-colors',
          dragOver && 'bg-accent-soft',
        )}
      >
        {photos.map((path) => (
          <div
            key={path}
            className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-line bg-surface-2"
          >
            <img src={photoUrl(path)} alt="Print da operação" className="h-full w-full object-cover" />
            {!disabled && (
              <button
                type="button"
                onClick={() => removeAt(path)}
                aria-label="Remover foto"
                className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X size={12} />
              </button>
            )}
          </div>
        ))}

        {Array.from({ length: busyCount }).map((_, i) => (
          <div
            key={`busy-${i}`}
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-line bg-surface-2"
          >
            <Loader2 size={16} className="animate-spin text-faint" />
          </div>
        ))}

        {photos.length + busyCount < MAX_PHOTOS_PER_OP && !disabled && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-16 w-16 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-line-2 text-faint transition-colors hover:border-accent hover:text-accent"
          >
            <ImagePlus size={17} />
            <span className="text-[10px] font-medium">Foto</span>
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files?.length) void addFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>
      {error && (
        <p className="flex items-center gap-1.5 text-[12px] text-negative">
          <TriangleAlert size={13} />
          {error}
        </p>
      )}
    </div>
  );
}

/* ------------------------------ PhotoStrip ------------------------------ */
/** Miniaturas sobrepostas usadas no card do dia. */
export function PhotoStrip({
  photos,
  onOpen,
  size = 40,
}: {
  photos: string[];
  onOpen: (index: number) => void;
  size?: number;
}) {
  if (!photos.length) return null;
  const shown = photos.slice(0, 3);
  const extra = photos.length - shown.length;
  return (
    <div className="flex shrink-0 -space-x-2.5">
      {shown.map((path, i) => (
        <button
          key={path}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpen(i);
          }}
          className="overflow-hidden rounded-lg border-2 border-elevated shadow-sm transition-transform hover:z-10 hover:scale-110"
          style={{ height: size, width: size }}
        >
          <img src={photoUrl(path)} alt="Print da operação" className="h-full w-full object-cover" />
        </button>
      ))}
      {extra > 0 && (
        <div
          className="flex items-center justify-center rounded-lg border-2 border-elevated bg-surface-2 text-[11px] font-semibold text-muted"
          style={{ height: size, width: size }}
        >
          +{extra}
        </div>
      )}
    </div>
  );
}

/* ----------------------------- PhotoLightbox ----------------------------- */
export function PhotoLightbox({
  photos,
  index,
  onClose,
  onIndexChange,
}: {
  photos: string[];
  index: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onIndexChange((index + 1) % photos.length);
      if (e.key === 'ArrowLeft') onIndexChange((index - 1 + photos.length) % photos.length);
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [index, photos.length, onClose, onIndexChange]);

  return (
    <div
      className="fixed inset-0 z-[60] flex animate-fade-in items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        aria-label="Fechar"
        className="absolute right-4 top-4 rounded-full p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
      >
        <X size={22} />
      </button>

      {photos.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onIndexChange((index - 1 + photos.length) % photos.length);
            }}
            aria-label="Foto anterior"
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white sm:left-4"
          >
            <ChevronLeft size={26} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onIndexChange((index + 1) % photos.length);
            }}
            aria-label="Próxima foto"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white sm:right-4"
          >
            <ChevronRight size={26} />
          </button>
        </>
      )}

      <img
        src={photoUrl(photos[index])}
        alt="Print da operação"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] max-w-[92vw] rounded-lg object-contain shadow-pop"
      />

      {photos.length > 1 && (
        <div className="absolute bottom-5 rounded-full bg-black/50 px-3 py-1 text-[13px] tabular-nums text-white/80">
          {index + 1} / {photos.length}
        </div>
      )}
    </div>
  );
}
