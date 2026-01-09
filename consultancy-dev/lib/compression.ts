import imageCompression from 'browser-image-compression';

/**
 * Compression options for different file types
 */
const COMPRESSION_CONFIG = {
    // Target max size in MB
    maxSizeMB: 0.9, // Slightly under 1MB to ensure we stay below limit

    // Max width/height for images
    maxWidthOrHeight: 1920, // Full HD resolution

    // Use web worker for better performance
    useWebWorker: true,

    // Quality settings
    initialQuality: 0.8,
};

/**
 * Check if file is an image
 */
export function isImageFile(file: File): boolean {
    return file.type.startsWith('image/');
}

/**
 * Check if file is a PDF
 */
export function isPDFFile(file: File): boolean {
    return file.type === 'application/pdf';
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Compress an image file
 */
export async function compressImage(file: File): Promise<File> {
    try {
        const options = {
            maxSizeMB: COMPRESSION_CONFIG.maxSizeMB,
            maxWidthOrHeight: COMPRESSION_CONFIG.maxWidthOrHeight,
            useWebWorker: COMPRESSION_CONFIG.useWebWorker,
            initialQuality: COMPRESSION_CONFIG.initialQuality,
        };

        const compressedFile = await imageCompression(file, options);

        // If compression didn't help much (within 10% of original), return original
        if (compressedFile.size > file.size * 0.9) {
            return file;
        }

        return compressedFile;
    } catch (error) {
        console.error('Error compressing image:', error);
        // Return original file if compression fails
        return file;
    }
}

/**
 * Compress a PDF file (basic approach - convert to images if needed)
 * Note: True PDF compression requires server-side processing
 * This is a placeholder for future implementation
 */
export async function compressPDF(file: File): Promise<File> {
    // For now, just return the original file
    // TODO: Implement PDF compression or notify user to compress PDFs before upload
    console.warn('PDF compression not yet implemented. Consider compressing PDFs before upload.');
    return file;
}

/**
 * Main compression function that routes to appropriate compression method
 */
export async function compressFile(
    file: File,
    onProgress?: (progress: number) => void
): Promise<{
    compressedFile: File;
    originalSize: number;
    compressedSize: number;
    compressionRatio: number
}> {
    const originalSize = file.size;

    // Skip compression for files already under 1MB
    if (originalSize < 1024 * 1024) {
        return {
            compressedFile: file,
            originalSize,
            compressedSize: originalSize,
            compressionRatio: 1,
        };
    }

    let compressedFile: File;

    // Compress based on file type
    if (isImageFile(file)) {
        onProgress?.(50);
        compressedFile = await compressImage(file);
    } else if (isPDFFile(file)) {
        onProgress?.(50);
        compressedFile = await compressPDF(file);
    } else {
        // For other file types, return as-is
        compressedFile = file;
    }

    onProgress?.(100);

    const compressedSize = compressedFile.size;
    const compressionRatio = compressedSize / originalSize;

    return {
        compressedFile,
        originalSize,
        compressedSize,
        compressionRatio,
    };
}

/**
 * Batch compress multiple files
 */
export async function compressMultipleFiles(
    files: File[],
    onProgress?: (fileIndex: number, progress: number) => void
): Promise<Array<{
    file: File;
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
}>> {
    const results = [];

    for (let i = 0; i < files.length; i++) {
        const result = await compressFile(files[i], (progress) => {
            onProgress?.(i, progress);
        });

        results.push({
            file: result.compressedFile,
            originalSize: result.originalSize,
            compressedSize: result.compressedSize,
            compressionRatio: result.compressionRatio,
        });
    }

    return results;
}
