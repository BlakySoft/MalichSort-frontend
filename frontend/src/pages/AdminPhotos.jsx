import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import AdminPage from "@/components/AdminPage";
import { Upload, Trash2 } from "lucide-react";

export default function AdminPhotos() {
  const [photos, setPhotos] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const load = () => {
    base44.functions
      .invoke("adminPhotos", { action: "list" })
      .then(({ data }) => setPhotos(data.photos))
      .catch(() => setError("No pudimos cargar la galería."));
  };

  useEffect(load, []);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      await base44.functions.invoke("adminPhotos", { action: "upload", file });
      load();
    } catch {
      setError("No se pudo subir la foto. Revisá el formato (jpg/png/webp) y el tamaño (máx. 5MB).");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (photo) => {
    if (photo.in_use) return;
    if (!confirm("¿Eliminar esta foto? No se puede deshacer.")) return;
    try {
      await base44.functions.invoke("adminPhotos", { action: "delete", photo_id: photo.id });
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
    } catch {
      setError("No se pudo eliminar la foto.");
    }
  };

  return (
    <AdminPage title="Gestor de fotos" description="Galería general de fotos subidas al sistema, usadas para ilustrar a los ganadores en el Salón de la fama.">
      <div className="mb-6 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {photos ? `${photos.length} foto${photos.length === 1 ? "" : "s"}` : "Cargando…"}
        </p>
        <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
          <Upload className="h-4 w-4" />
          {uploading ? "Subiendo…" : "Subir foto"}
          <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      {error && <p className="mb-4 rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</p>}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
        {photos === null && <p className="col-span-full text-muted-foreground">Cargando galería…</p>}
        {photos?.length === 0 && <p className="col-span-full text-muted-foreground">Todavía no se subió ninguna foto.</p>}
        {photos?.map((photo) => (
          <div key={photo.id} className="group relative overflow-hidden rounded-xl border border-border bg-card">
            <img src={photo.url} alt={photo.original_filename || ""} className="aspect-square w-full object-cover" />
            <div className="p-2">
              {photo.in_use ? (
                <p className="truncate text-xs text-muted-foreground">Asignada a {photo.winner_name}</p>
              ) : (
                <p className="text-xs text-muted-foreground">Sin asignar</p>
              )}
            </div>
            {!photo.in_use && (
              <button
                onClick={() => handleDelete(photo)}
                className="absolute right-2 top-2 rounded-lg bg-black/60 p-1.5 text-white opacity-0 transition group-hover:opacity-100 hover:bg-destructive"
                title="Eliminar foto"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </AdminPage>
  );
}
