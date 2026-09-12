import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Upload, Check } from "lucide-react";

export default function PhotoPickerModal({ winnerId, currentPhotoUrl, onClose, onAssigned }) {
  const [photos, setPhotos] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState(null);

  const loadPhotos = () => {
    base44.functions
      .invoke("adminPhotos", { action: "list" })
      .then(({ data }) => setPhotos(data.photos))
      .catch(() => setError("No pudimos cargar la galería."));
  };

  useEffect(loadPhotos, []);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      await base44.functions.invoke("adminPhotos", { action: "upload", file });
      loadPhotos();
    } catch {
      setError("No se pudo subir la foto. Revisá el formato (jpg/png/webp) y el tamaño (máx. 5MB).");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleAssign = async (photoId) => {
    setAssigning(true);
    setError(null);
    try {
      const { data } = await base44.functions.invoke("adminPhotos", {
        action: "assignToWinner",
        winner_id: winnerId,
        photo_id: photoId,
      });
      onAssigned(data.winner);
      onClose();
    } catch {
      setError("No se pudo asignar la foto.");
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="font-sora text-lg font-semibold text-foreground">Elegir foto del ganador</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
          <p className="text-xs text-muted-foreground">
            {currentPhotoUrl ? "Ya tiene una foto asignada. Elegí otra para reemplazarla." : "Todavía no tiene foto asignada."}
          </p>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-muted/50">
            <Upload className="h-4 w-4" />
            {uploading ? "Subiendo…" : "Subir nueva"}
            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        </div>

        {error && <p className="mx-5 mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>}

        <div className="grid grid-cols-3 gap-3 overflow-y-auto p-5 sm:grid-cols-4">
          {photos === null && <p className="col-span-full text-sm text-muted-foreground">Cargando galería…</p>}
          {photos?.length === 0 && <p className="col-span-full text-sm text-muted-foreground">La galería está vacía. Subí la primera foto.</p>}
          {photos?.map((photo) => (
            <button
              key={photo.id}
              onClick={() => handleAssign(photo.id)}
              disabled={assigning}
              className="group relative aspect-square overflow-hidden rounded-lg border border-border disabled:opacity-50"
            >
              <img src={photo.url} alt={photo.original_filename || ""} className="h-full w-full object-cover" />
              {photo.url === currentPhotoUrl && (
                <span className="absolute inset-0 flex items-center justify-center bg-primary/40">
                  <Check className="h-6 w-6 text-primary-foreground" />
                </span>
              )}
              {photo.in_use && photo.url !== currentPhotoUrl && (
                <span className="absolute bottom-0 left-0 right-0 truncate bg-black/70 px-1.5 py-1 text-[10px] text-white">
                  {photo.winner_name}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
