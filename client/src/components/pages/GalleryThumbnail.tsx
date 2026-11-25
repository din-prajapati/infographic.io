import { useState } from 'react';
import { ImageOff } from 'lucide-react';

/** Keep a failed preview from printing alt text over gallery metadata. */
export function GalleryThumbnail({ src, title }: { src?: string; title: string }) {
  const [failedSrc, setFailedSrc] = useState<string>();
  if (!src || failedSrc === src) {
    return <span className="ws-gallery-fallback" role="img" aria-label={`Preview unavailable for ${title}`}><ImageOff aria-hidden="true" /><span>Preview unavailable</span></span>;
  }
  return <img src={src} alt={title} className="ws-gallery-image" loading="lazy" onError={() => setFailedSrc(src)} />;
}
