/**
 * Download-Helper für PDF und andere Dateien
 */

export function downloadBlob(blob, filename) {
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    
    return true;
  } catch (error) {
    console.error('Download failed:', error);
    return false;
  }
}

export function createBlobURL(blob) {
  try {
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Failed to create blob URL:', error);
    return null;
  }
}

export function revokeBlobURL(url) {
  try {
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to revoke blob URL:', error);
  }
}