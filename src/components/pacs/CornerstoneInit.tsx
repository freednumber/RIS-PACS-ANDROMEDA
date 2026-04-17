'use client';

import { useEffect } from 'react';

/**
 * Global Cornerstone Initializer for Andromeda PACS.
 * Sets up codecs, image loaders, and handles Next.js specific path issues.
 */
export default function CornerstoneInit() {
    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Dynamic imports for client-side only libraries
        Promise.all([
            import('cornerstone-core'),
            import('cornerstone-wado-image-loader'),
            import('dicom-parser')
        ]).then(([cornerstoneModule, cornerstoneWADOImageLoaderModule, dicomParserModule]) => {
            const cornerstone = cornerstoneModule.default || cornerstoneModule;
            const cornerstoneWADOImageLoader = cornerstoneWADOImageLoaderModule.default || cornerstoneWADOImageLoaderModule;
            const dicomParser = dicomParserModule.default || dicomParserModule;

            // 1. Link External Libraries
            cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
            cornerstoneWADOImageLoader.external.dicomParser = dicomParser;
            
            // 2. Configure the loader
            // Disable web workers to avoid 'publicPath' issues in Next.js Turbopack environment
            const config = {
                maxWebWorkers: 0, 
                startWebWorkersOnDemand: false,
                taskConfiguration: {
                    decodeTask: {
                        initializeCodecsOnDemand: true,
                        useWebWorkers: false,
                    },
                },
            };

            try {
                cornerstoneWADOImageLoader.webWorkerManager.initialize(config);
            } catch (e) {
                console.warn('Cornerstone Worker init bypassed:', e);
            }

            console.log('💎 Andromeda PACS: Cornerstone Engine Initialized (Main Thread Mode)');
        }).catch(err => {
            console.error('Cornerstone Init Error:', err);
        });
    }, []);

    return null;
}
