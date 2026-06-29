/**
 * Utility to compress images client-side before storing or transmitting them.
 */

/**
 * Compresses an image file to a maximum resolution and specific quality.
 * Converts to JPEG format to enforce quality reduction and returns a base64 string and mimeType.
 */
export function compressImage(
  file: File,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.7
): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("File is not an image"));
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions maintaining aspect ratio
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Failed to get 2d canvas context"));
            return;
          }

          // Draw image onto canvas
          ctx.drawImage(img, 0, 0, width, height);

          // Get the base64 output as image/jpeg with defined quality (0.0 to 1.0)
          const compressedBase64 = canvas.toDataURL("image/jpeg", quality);
          
          resolve({
            base64: compressedBase64,
            mimeType: "image/jpeg",
          });
        } catch (error) {
          reject(error);
        }
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
}
