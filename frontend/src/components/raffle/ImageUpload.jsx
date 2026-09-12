import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Upload, X, Expand } from "lucide-react";
import ImageLightbox from "@/components/raffle/ImageLightbox";

export default function ImageUpload({ value, onChange, onUploaded, label = "Imagen" }) {
  const [uploading, setUploading] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const { toast } = useToast();

  const handle = async (file) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast({ title: "Formato no válido", description: "Solo JPG, PNG o WebP.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Archivo demasiado grande", description: "Tamaño máximo 5MB.", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onChange(file_url);
      await onUploaded?.(file_url);
    } catch (e) {
      toast({ title: "Error al subir", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  if (value) {
    return (
      <div className="relative w-40">
        <button type="button" className="group block w-full" onClick={() => setLightboxOpen(true)}>
          <Image src={value} alt={label} className="h-32 w-40 rounded-lg border object-cover" />
          <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/0 opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
            <Expand className="h-5 w-5 text-white" />
          </span>
        </button>
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute -right-2 -top-2 rounded-full bg-red-600 p-1 text-white shadow"
        >
          <X className="h-3 w-3" />
        </button>
        <ImageLightbox
          images={[value]}
          index={lightboxOpen ? 0 : null}
          onClose={() => setLightboxOpen(false)}
          onNavigate={() => {}}
        />
      </div>
    );
  }

  return (
    <label className="flex h-32 w-40 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed text-slate-400 hover:border-slate-400 hover:text-slate-600">
      {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
        <>
          <Upload className="h-5 w-5" />
          <span className="mt-2 text-xs">Subir {label}</span>
        </>
      )}
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => handle(e.target.files?.[0])}
      />
    </label>
  );
}