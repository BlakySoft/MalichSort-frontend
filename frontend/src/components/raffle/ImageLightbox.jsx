import { useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Visor de imagen ampliada con navegación entre varias.
 * images: array de URLs. index: índice actualmente abierto (null = cerrado).
 */
export default function ImageLightbox({ images, index, onClose, onNavigate }) {
  useEffect(() => {
    if (index === null) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNavigate((index + 1) % images.length);
      if (e.key === "ArrowLeft") onNavigate((index - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, images.length, onClose, onNavigate]);

  if (index === null) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      <button
        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
        onClick={onClose}
        aria-label="Cerrar"
      >
        <X className="h-6 w-6" />
      </button>

      {images.length > 1 && (
        <button
          className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          onClick={(e) => { e.stopPropagation(); onNavigate((index - 1 + images.length) % images.length); }}
          aria-label="Anterior"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      <img
        src={images[index]}
        alt=""
        className="max-h-[85vh] max-w-full rounded-lg object-contain"
        onClick={(e) => e.stopPropagation()}
      />

      {images.length > 1 && (
        <button
          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          onClick={(e) => { e.stopPropagation(); onNavigate((index + 1) % images.length); }}
          aria-label="Siguiente"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-sm text-white">
          {index + 1} / {images.length}
        </div>
      )}
    </div>
  );
}
