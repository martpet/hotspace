import { type AllValuesNever } from "$util";
import type { PostProcessConf } from "./post_process/types.ts";
import type { InodeDisplay } from "./types.ts";

type MimeConfig =
  | Base & AllValuesNever<PostProcessConf>
  | Partial<Base> & PostProcessConf;

interface Base {
  display: InodeDisplay;
  forceOrig?: boolean;
}

// deno-fmt-ignore
export const MIME_CONFS: Record<string, MimeConfig | undefined> = {
  "application/application/pdf": { display: "iframe" },
  "application/epub+zip": { proc: "pandoc", to: "text/html" },
  "application/json": { display: "iframe" },
  "application/msword": { proc: "libre", to: "application/pdf" },
  "application/mxf": { proc: "aws_mediaconvert" },
  "application/pdf": { display: "iframe" },
  "application/rtf": { proc: "libre", to: "application/pdf" },
  "application/vnd.ms-excel": { proc: "libre", to: "application/pdf" },
  "application/vnd.ms-powerpoint": { proc: "libre", to: "application/pdf" },
  "application/vnd.oasis.opendocument.database": { proc: "libre", to: "application/pdf" },
  "application/vnd.oasis.opendocument.formula": { proc: "libre", to: "application/pdf" },
  "application/vnd.oasis.opendocument.graphics": { proc: "libre", to: "application/pdf" },
  "application/vnd.oasis.opendocument.presentation": { proc: "libre", to: "application/pdf" },
  "application/vnd.oasis.opendocument.spreadsheet": { proc: "libre", to: "application/pdf" },
  "application/vnd.oasis.opendocument.text": { proc: "libre", to: "application/pdf" },
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": { proc: "libre", to: "application/pdf" },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": { proc: "libre", to: "application/pdf" },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { proc: "libre", to: "application/pdf" },
  "application/x-diff": { proc: "libre", to: "application/pdf" },
  "application/x-javascript": { display: "iframe" },
  "application/x-msmetafile": { proc: "libre", to: "application/pdf" },
  "application/xhtml+xml": { display: "iframe" },
  "application/xml": { display: "iframe" },
  "audio/mp4": { display: "audio" },
  "audio/mpeg": { display: "audio" },
  "audio/x-m4a": { display: "audio" },
  "image/apng": { display: "image" },
  "image/avif": { display: "image", proc: "sharp", to: "image/jpeg" },
  "image/bmp": { display: "image" },
  "image/gif": { display: "image", proc: "sharp", thumbOnly: true },
  "image/jpeg": { display: "image", proc: "sharp", to: "image/jpeg" },
  "image/png": { display: "image", proc: "sharp", thumbOnly: true },
  "image/svg+xml": { display: "image", proc: "sharp", thumbOnly: true },
  "image/tiff": { proc: "sharp", to: "image/jpeg" },
  "image/vnd.microsoft.icon": { display: "image" },
  "image/webp": { display: "image", proc: "sharp", to: "image/jpeg" },
  "image/wmf": { proc: "libre", to: "image/png" },
  "image/x-icon": { display: "image" },
  "text/css": { display: "iframe" },
  "text/html": { display: "iframe" },
  "text/javascript": { display: "iframe" },
  "text/markdown": { proc: "pandoc", to: "text/html" },
  "text/plain": { display: "iframe" },
  "text/rtf": { proc: "libre", to: "application/pdf" },
  "text/xml": { display: "iframe" },
  "video/3gpp": { proc: "aws_mediaconvert" },
  "video/3gpp2": { proc: "aws_mediaconvert" },
  "video/MP2T": { proc: "aws_mediaconvert" },
  "video/mp4": { proc: "aws_mediaconvert" },
  "video/mpeg": { proc: "aws_mediaconvert" },
  "video/quicktime": { proc: "aws_mediaconvert" },
  "video/webm": { proc: "aws_mediaconvert" },
  "video/x-f4v": { proc: "aws_mediaconvert" },
  "video/x-flv": { proc: "aws_mediaconvert" },
  "video/x-m4v": { proc: "aws_mediaconvert" },
  "video/x-matroska": { proc: "aws_mediaconvert" },
  "video/x-ms-asf": { proc: "aws_mediaconvert" },
  "video/x-ms-wmv": { proc: "aws_mediaconvert" },
  "video/x-msvideo": { proc: "aws_mediaconvert" },
};
