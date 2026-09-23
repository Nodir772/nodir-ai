export type UploadResult<T> = { ok: boolean; status: number; json: T };

export function uploadFormData<T>(
  url: string,
  form: FormData,
  options?: {
    signal?: AbortSignal;
    onProgress?: (percent: number) => void;
  },
): Promise<UploadResult<T>> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.responseType = "text";
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        options?.onProgress?.(Math.min(100, Math.round((event.loaded / event.total) * 100)));
      }
    };
    xhr.onload = () => {
      let json = {} as T;
      try {
        json = JSON.parse(xhr.responseText) as T;
      } catch {
        json = {} as T;
      }
      resolve({ ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status, json });
    };
    xhr.onerror = () => reject(new TypeError("NetworkError"));
    xhr.onabort = () => reject(new DOMException("Aborted", "AbortError"));
    const abort = () => xhr.abort();
    if (options?.signal) {
      if (options.signal.aborted) {
        abort();
        return;
      }
      options.signal.addEventListener("abort", abort, { once: true });
    }
    xhr.send(form);
  });
}
