import type { MaybeNever } from "$util";
import type { PostProcessConf } from "./post_process/types.ts";
import type { FileNodeDisplay } from "./types.ts";

type MimeConf =
  & {
    title: string | Record<string, string>;
    display?: FileNodeDisplay;
    forceOrig?: boolean;
  }
  & MaybeNever<PostProcessConf>;

// deno-fmt-ignore
export const MIMES: Record<string, MimeConf> = {
  "application/epub+zip": { title: "Electronic Publication (EPUB)", proc: "pandoc", to: "text/html" },
  "application/json": { title: "JSON Document", display: "iframe" },
  "application/msword": { title: "Microsoft Word 97 - 2004 document (.doc)", proc: "libre", to: "application/pdf" },
  "application/pdf": { title: "PDF document", display: "iframe" },
  "application/rtf": { title: "Rich Text Document", proc: "libre", to: "application/pdf" },
  "application/vnd.ms-excel": { title: "Microsoft Excel Document", proc: "libre", to: "application/pdf" },
  "application/vnd.ms-powerpoint": { title: "Microsoft PowerPoint Document", proc: "libre", to: "application/pdf" },
  "application/vnd.oasis.opendocument.base": { title: "OpenDocument Database" },
  "application/vnd.oasis.opendocument.database": { title: "OpenDocument Database" },
  "application/vnd.oasis.opendocument.formula": { title: "OpenDocument Formula", proc: "libre", to: "application/pdf" },
  "application/vnd.oasis.opendocument.graphics": { title: "OpenDocument Drawing", proc: "libre", to: "application/pdf" },
  "application/vnd.oasis.opendocument.presentation": { title: "OpenDocument Presentation", proc: "libre", to: "application/pdf" },
  "application/vnd.oasis.opendocument.spreadsheet": { title: "OpenDocument Spreadsheet", proc: "libre", to: "application/pdf" },
  "application/vnd.oasis.opendocument.text": { title: "OpenDocument Text", proc: "libre", to: "application/pdf" },
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": { title: "Microsoft PowerPoint Document", proc: "libre", to: "application/pdf" },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": { title: "Microsoft Excel Document", proc: "libre", to: "application/pdf" },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { title: "Microsoft Word document (.docx)", proc: "libre", to: "application/pdf" },
  "application/x-diff": { title: "Patch File", proc: "libre", to: "application/pdf" },
  "application/x-javascript": { title: "JavaScript script", display: "iframe" },
  "application/x-msmetafile": { title: "Windows Metafile", proc: "libre", to: "image/png" },
  "application/xhtml+xml": { title: "XHTML document", display: "iframe" },
  "application/xml": { title: "XML Document", display: "iframe" },
  "audio/mpeg": { title: { mp2: "MP2 audio", mp3: "MP3 audio"}, display: "audio" },
  "audio/ogg": { title: "HTML5 Audio (Ogg)", display: "audio" },
  "audio/x-m4a": { title: "Apple MPEG-4 audio", display: "audio" },
  "audio/x-wav": { title: "Waveform audio", display: "audio" },
  "font/otf": { title: "OpenType® font", display: "font" },
  "font/ttf": { title: "TrueType® font", display: "font" },
  "font/woff2": { title: "Web Open Font Format 2.0", display: "font" },
  "image/avif": { title: "AV1 Image File Format", display: "image", proc: "sharp", to: "image/jpeg" },
  "image/bmp": { title: "Windows BMP image", display: "image" },
  "image/gif": { title: "GIF image", display: "image", proc: "sharp", thumbOnly: true },
  "image/jpeg": { title: "JPEG image", display: "image", proc: "sharp", to: "image/jpeg" },
  "image/png": { title: "PNG image", display: "image", proc: "sharp", thumbOnly: true },
  "image/svg+xml": { title: "SVG document", display: "image", proc: "sharp", thumbOnly: true },
  "image/tiff": { title: "TIFF image", proc: "sharp", to: "image/jpeg" },
  "image/vnd.microsoft.icon": { title: "Windows icon image",display: "image" },
  "image/webp": { title: "WebP Image", display: "image", proc: "sharp", to: "image/jpeg" },
  "image/wmf": { title: "Windows Metafile", proc: "libre", to: "image/png" },
  "image/x-icon": { title: "Windows icon image", display: "image" },
  "image/x-wmf": { title: "Windows Metafile", proc: "libre", to: "image/png" },
  "text/css": { title: "CSS Stylesheet", display: "iframe" },
  "text/html": { title: "HTML document", display: "iframe" },
  "text/javascript": { title: "JavaScript script", display: "iframe" },
  "text/markdown": { title: "Markdown Document", proc: "pandoc", to: "text/html" },
  "text/plain": { title: "Plain Text Document", display: "iframe" },
  "text/rtf": { title: "Rich Text Document", proc: "libre", to: "application/pdf" },
  "text/xml": { title: "XML Document", display: "iframe" },
  "video/3gpp": { title: "3GPP movie", proc: "aws_mediaconvert" },
  "video/3gpp2": { title: "3GPP2 movie", proc: "aws_mediaconvert" },
  "video/mp2t": { title: "AVCHD MPEG-2 Transport Stream", proc: "aws_mediaconvert" },
  "video/mp4": { title: "MPEG-4 movie", proc: "aws_mediaconvert" },
  "video/mpeg": { title: "MPEG movie", proc: "aws_mediaconvert" },
  "video/quicktime": { title: "QuickTime movie", proc: "aws_mediaconvert" },
  "video/webm": { title: "HTML5 Video (WebM)", proc: "aws_mediaconvert" },
  "video/x-f4v": { title: "Flash video", proc: "aws_mediaconvert" },
  "video/x-flv": { title: "Flash video", proc: "aws_mediaconvert" },
  "video/x-m4v": { title: "Apple MPEG-4 movie", proc: "aws_mediaconvert" },
  "video/x-matroska": { title: "Matroska video", proc: "aws_mediaconvert" },
  "video/x-ms-asf": { title: "Advanced Systems Format (ASF) media", proc: "aws_mediaconvert" },
  "video/x-ms-wmv": { title: "Windows Media", proc: "aws_mediaconvert" },
  "video/x-msvideo": { title: "AVI movie", proc: "aws_mediaconvert" },
};
