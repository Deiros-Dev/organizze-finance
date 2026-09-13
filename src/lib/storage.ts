import { supabase } from './supabase';

const BUCKET = 'operation-photos';

export const MAX_PHOTOS_PER_OP = 6;
export const MAX_PHOTO_MB = 8;

const EXT_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export const ACCEPTED_TYPES = Object.keys(EXT_BY_TYPE);

/** URL pública para um path do bucket de fotos. */
export function photoUrl(path: string): string {
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Envia uma foto e devolve o path salvo no bucket. */
export async function uploadPhoto(file: File): Promise<{ path: string | null; error: string | null }> {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return { path: null, error: 'Use imagens JPG, PNG, WEBP ou GIF.' };
  }
  if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
    return { path: null, error: `Cada foto deve ter até ${MAX_PHOTO_MB} MB.` };
  }
  const ext = EXT_BY_TYPE[file.type] ?? 'jpg';
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '31536000',
    upsert: false,
    contentType: file.type,
  });
  return { path: error ? null : path, error: error ? error.message : null };
}

/** Remove uma ou mais fotos do bucket (best-effort). */
export async function removePhotos(paths: string[]): Promise<string | null> {
  if (!paths.length) return null;
  const { error } = await supabase.storage.from(BUCKET).remove(paths);
  return error ? error.message : null;
}

/** Apaga todos os arquivos do bucket (usado em "limpar todos os dados"). */
export async function clearAllPhotos(): Promise<string | null> {
  const { data, error } = await supabase.storage.from(BUCKET).list('', { limit: 1000 });
  if (error) return error.message;
  const paths = (data ?? []).map((f) => f.name).filter(Boolean);
  return paths.length ? removePhotos(paths) : null;
}
