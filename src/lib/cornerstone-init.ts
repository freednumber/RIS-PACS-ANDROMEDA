"use client";

let initialized = false;
let cornerstoneInstance: any = null;

export async function initCornerstone() {
  if (initialized || typeof window === 'undefined') return cornerstoneInstance;

  try {
    // Dynamically import to avoid SSR issues with window/document
    const cornerstone = (await import('cornerstone-core')).default;
    const cornerstoneWADOImageLoader = (await import('cornerstone-wado-image-loader')).default;
    const dicomParser = await import('dicom-parser');

    // Configure Cornerstone WADO Image Loader
    cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
    cornerstoneWADOImageLoader.external.dicomParser = dicomParser;
    
    cornerstoneWADOImageLoader.configure({
      beforeSend: function(xhr: XMLHttpRequest) {
        // Add custom headers if needed
      },
      useWebWorkers: false,
    });

    cornerstoneInstance = cornerstone;
    initialized = true;
    console.log('Andromeda PACS: Cornerstone initialized (Lazy)');
    return cornerstoneInstance;
  } catch (err) {
    console.error('Failed to initialize Cornerstone:', err);
    return null;
  }
}

export function getCornerstone() {
  return cornerstoneInstance;
}
