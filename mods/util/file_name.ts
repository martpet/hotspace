export function getFileExtension(filename: string) {
  const dotIndex = filename.lastIndexOf(".");
  if (dotIndex > 0 && dotIndex < filename.length - 1) {
    return filename.slice(dotIndex + 1);
  }
  return "";
}

export function addSuffixBeforeExtension(filename: string, suffix: string) {
  const dotIndex = filename.lastIndexOf(".");
  if (dotIndex > 0) {
    const name = filename.slice(0, dotIndex);
    const ext = filename.slice(dotIndex);
    return `${name}${suffix}${ext}`;
  } else {
    return `${filename}${suffix}`;
  }
}
