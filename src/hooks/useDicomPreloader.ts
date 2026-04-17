'use client';

import { useEffect, useState } from 'react';
import type { DicomStudy } from '@/lib/dicomweb';

/**
 * useDicomPreloader (Cornerstone Edition)
 * Preloads all DICOM images into the Cornerstone cache for fluid PACS navigation.
 */
export function useDicomPreloader(study: DicomStudy | null) {
    const [progress, setProgress] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        if (!study) return;

        setIsLoaded(false);
        setProgress(0);

        const imageIds = study.series.flatMap(s => 
            s.instances.map(i => `wadouri:${i.imagePath}`)
        );
        
        let loadedCount = 0;

        if (imageIds.length === 0) {
            setIsLoaded(true);
            return;
        }

        const loadAll = async () => {
            const cs = await import('cornerstone-core');
            const cornerstone = cs.default || cs;

            const promises = imageIds.map(id => {
                return cornerstone.loadAndCacheImage(id).then(() => {
                    loadedCount++;
                    setProgress(Math.round((loadedCount / imageIds.length) * 100));
                }).catch(err => {
                    console.error(`Preload failed for ${id}:`, err);
                    loadedCount++;
                });
            });

            await Promise.all(promises);
            setIsLoaded(true);
            console.log(`📦 Andromeda PACS: Preloaded ${imageIds.length} slices into cache.`);
        };
        
        loadAll();

        return () => {
            // Optional: purge cache if needed, but usually we want to keep it
        };
    }, [study]);

    return { progress, isLoaded };
}
