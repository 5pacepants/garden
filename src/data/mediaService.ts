import { convertFileSrc, invoke } from "@tauri-apps/api/core";

export type StoredMedia = {
  reference: string;
  fileName: string;
  url: string;
};

export interface MediaService {
  pickAndStoreImage(): Promise<StoredMedia | null>;
  resolveMediaUrl(reference: string): Promise<string>;
}

export class TauriMediaService implements MediaService {
  async pickAndStoreImage(): Promise<StoredMedia | null> {
    const media = await invoke<StoredMedia | null>("pick_and_store_image");
    return media ? { ...media, url: toRenderableMediaUrl(media.url) } : null;
  }

  async resolveMediaUrl(reference: string): Promise<string> {
    if (!reference.startsWith("appmedia://")) {
      return reference;
    }

    const path = await invoke<string>("resolve_media_url", { reference });
    return toRenderableMediaUrl(path);
  }
}

function toRenderableMediaUrl(pathOrUrl: string): string {
  if (/^(asset|http|https|data|blob):/.test(pathOrUrl)) {
    return pathOrUrl;
  }

  return convertFileSrc(pathOrUrl);
}
