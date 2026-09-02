async function getPhotos(patientId: string) {
  const { db } = await import("@/lib/db");
  return db.photo.findMany({ where: { patientId }, orderBy: { takenAt: "desc" } });
}

export async function PhotoGallery({ patientId }: { patientId: string }) {
  const photos = await getPhotos(patientId);

  if (photos.length === 0) {
    return <p className="text-sm text-subtle">No photos uploaded yet.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {photos.map((photo) => (
        <a key={photo.id} href={photo.url} target="_blank" rel="noopener noreferrer" className="group">
          <div className="aspect-square overflow-hidden rounded-lg border border-black/5">
            <img
              src={photo.url}
              alt={photo.caption ?? "Patient photo"}
              className="h-full w-full object-cover transition group-hover:opacity-90"
            />
          </div>
          <div className="mt-1 text-xs text-subtle">
            {new Date(photo.takenAt).toLocaleString()}
          </div>
        </a>
      ))}
    </div>
  );
}