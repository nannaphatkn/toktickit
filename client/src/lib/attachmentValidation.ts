export const MAX_ATTACHMENT_COUNT = 5;
export const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024; // 5 MB

export const ALLOWED_FILE_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
};

export function formatFileSize(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function validateSingleFile(file: File): string | null {
  if (file.size > MAX_ATTACHMENT_SIZE) {
    return 'File size must not exceed 5 MB.';
  }

  const lastDot = file.name.lastIndexOf('.');
  const extension = lastDot >= 0 ? file.name.slice(lastDot).toLowerCase() : '';
  if (ALLOWED_FILE_TYPES[extension] !== file.type.toLowerCase()) {
    return 'Only JPG, JPEG, PNG, WEBP, and PDF files are allowed.';
  }

  return null;
}

export function validateFileList(files: FileList | null): string[] {
  if (!files) return [];

  const errors: string[] = [];
  if (files.length > MAX_ATTACHMENT_COUNT) {
    errors.push(`You can attach a maximum of ${MAX_ATTACHMENT_COUNT} files.`);
  }

  Array.from(files).forEach((file) => {
    if (file.size > MAX_ATTACHMENT_SIZE) {
      errors.push(`File size exceeds 5 MB: "${file.name}".`);
    }
    const extensionStart = file.name.lastIndexOf('.');
    const extension = extensionStart >= 0 ? file.name.slice(extensionStart).toLowerCase() : '';
    if (ALLOWED_FILE_TYPES[extension] !== file.type.toLowerCase()) {
      errors.push(`Unsupported file type: "${file.name}". Allowed: JPG, PNG, WEBP, PDF.`);
    }
  });

  return errors;
}
