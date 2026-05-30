const databaseName = "private-garden-images";
const storeName = "images";
const mapImagePrefix = "indexeddb://map-images/";
const memoryImages = new Map<string, string>();

export async function storeBrowserImage(image: string, id: string): Promise<string> {
  if (!image.startsWith("data:image/")) {
    return image;
  }

  if (typeof indexedDB === "undefined") {
    memoryImages.set(id, image);
    return `${mapImagePrefix}${encodeURIComponent(id)}`;
  }

  const database = await openImageDatabase();
  await putImage(database, id, image);
  database.close();
  return `${mapImagePrefix}${encodeURIComponent(id)}`;
}

export async function resolveBrowserImageReference(reference: string): Promise<string> {
  if (!reference.startsWith(mapImagePrefix)) {
    return reference;
  }

  const id = decodeURIComponent(reference.slice(mapImagePrefix.length));
  if (typeof indexedDB === "undefined") {
    return memoryImages.get(id) ?? reference;
  }

  const database = await openImageDatabase();
  const image = await getImage(database, id);
  database.close();
  return image ?? reference;
}

function openImageDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1);

    request.onupgradeneeded = () => {
      request.result.createObjectStore(storeName);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Kunde inte öppna bildlagring."));
  });
}

function putImage(database: IDBDatabase, id: string, image: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, "readwrite");
    transaction.objectStore(storeName).put(image, id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Kunde inte spara bild."));
  });
}

function getImage(database: IDBDatabase, id: string): Promise<string | undefined> {
  return new Promise((resolve, reject) => {
    const request = database.transaction(storeName, "readonly").objectStore(storeName).get(id);
    request.onsuccess = () => resolve(typeof request.result === "string" ? request.result : undefined);
    request.onerror = () => reject(request.error ?? new Error("Kunde inte läsa bild."));
  });
}
