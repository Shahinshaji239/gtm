import imageCompression from 'browser-image-compression';

const MAX_SIZE_MB = 0.5; // 500KB
const MAX_WIDTH_OR_HEIGHT = 1920;

export const compressImageForUpload = async (file) => {
  if (!file.type.startsWith('image/')) {
    return file;
  }

  const options = {
    maxSizeMB: MAX_SIZE_MB,
    maxWidthOrHeight: MAX_WIDTH_OR_HEIGHT,
    useWebWorker: true,
  };

  try {
    const compressedBlob = await imageCompression(file, options);
    return new File([compressedBlob], file.name, {
      type: compressedBlob.type,
      lastModified: Date.now(),
    });
  } catch (error) {
    console.error('Error compressing image:', error);
    return file;
  }
};

export const compressImagesForUpload = async (files) => Promise.all(
  Array.from(files).map((file) => compressImageForUpload(file))
);
