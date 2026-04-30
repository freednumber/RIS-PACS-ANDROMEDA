// dicomGeometry.ts
// Utility functions for DICOM vector mathematics

export type Vector3 = [number, number, number];

export interface ViewportGeometry {
  ipp: number[];
  iop: number[];
  rowCosines: number[];
  colCosines: number[];
  normal: number[];
  sx: number;
  sy: number;
  rows: number;
  cols: number;
  modality: string;
}



export function dot(v1: Vector3 | number[], v2: Vector3 | number[]): number {
  return v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2];
}

export function cross(v1: Vector3 | number[], v2: Vector3 | number[]): Vector3 {
  return [
    v1[1] * v2[2] - v1[2] * v2[1],
    v1[2] * v2[0] - v1[0] * v2[2],
    v1[0] * v2[1] - v1[1] * v2[0],
  ];
}

export function sub(v1: Vector3 | number[], v2: Vector3 | number[]): Vector3 {
  return [v1[0] - v2[0], v1[1] - v2[1], v1[2] - v2[2]];
}

export function normalize(v: Vector3 | number[]): Vector3 {
  const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  if (len === 0) return [0, 0, 0];
  return [v[0] / len, v[1] / len, v[2] / len];
}

export function getNormal(rowCosines: Vector3 | number[], colCosines: Vector3 | number[]): Vector3 {
  return normalize(cross(rowCosines, colCosines));
}

export function detectOrientation(normal: Vector3 | number[]): 'axial' | 'sagittal' | 'coronal' | 'unknown' {
  const [x, y, z] = normal;
  const absX = Math.abs(x);
  const absY = Math.abs(y);
  const absZ = Math.abs(z);

  if (absZ > 0.9) return 'axial'; // Blue
  if (absX > 0.9) return 'sagittal'; // Red
  if (absY > 0.9) return 'coronal'; // Green
  return 'unknown';
}

export function getOrientationColor(orientation: string): string {
  if (orientation === 'axial') return '#3B82F6'; // blue-500
  if (orientation === 'sagittal') return '#EF4444'; // red-500
  if (orientation === 'coronal') return '#10B981'; // emerald-500
  return '#F59E0B'; // amber-500 (Localizer fallback)
}

/**
 * Computes the 2D pixel coordinates of the intersection line between targetPlane and sourceImage.
 * Returns the two end points of the line bounded by the source image dimensions (0..cols, 0..rows).
 */
export function computeIntersectionLine(
  sourceIpp: number[],
  sourceRowDir: number[],
  sourceColDir: number[],
  sourceSx: number,
  sourceSy: number,
  sourceCols: number,
  sourceRows: number, // Height
  targetIpp: number[],
  targetNormal: number[]
): { p1: { x: number; y: number }; p2: { x: number; y: number } } | null {
  // Equation: sx * dot(row, tn) * x + sy * dot(col, tn) * y + dot(sourceIpp - targetIpp, tn) = 0
  const A = sourceSx * dot(sourceRowDir, targetNormal);
  const B = sourceSy * dot(sourceColDir, targetNormal);
  const C = dot(sub(sourceIpp, targetIpp), targetNormal);

  // If A and B are very close to zero, planes are parallel (no intersection)
  if (Math.abs(A) < 1e-6 && Math.abs(B) < 1e-6) {
    return null;
  }

  const points: { x: number; y: number }[] = [];

  // Check intersection with x = 0
  if (Math.abs(B) > 1e-6) {
    const y0 = -C / B;
    if (y0 >= 0 && y0 <= sourceRows) points.push({ x: 0, y: y0 });
  }

  // Check intersection with x = sourceCols
  if (Math.abs(B) > 1e-6) {
    const y1 = -(A * sourceCols + C) / B;
    if (y1 >= 0 && y1 <= sourceRows) points.push({ x: sourceCols, y: y1 });
  }

  // Check intersection with y = 0
  if (Math.abs(A) > 1e-6) {
    const x0 = -C / A;
    if (x0 >= 0 && x0 <= sourceCols) points.push({ x: x0, y: 0 });
  }

  // Check intersection with y = sourceRows
  if (Math.abs(A) > 1e-6) {
    const x1 = -(B * sourceRows + C) / A;
    if (x1 >= 0 && x1 <= sourceCols) points.push({ x: x1, y: sourceRows });
  }

  // Filter out duplicates (happens exactly on corners)
  const uniquePoints: { x: number; y: number }[] = [];
  for (const pt of points) {
    if (!uniquePoints.some(u => Math.abs(u.x - pt.x) < 1e-3 && Math.abs(u.y - pt.y) < 1e-3)) {
      uniquePoints.push(pt);
    }
  }

  if (uniquePoints.length >= 2) {
    return { p1: uniquePoints[0], p2: uniquePoints[1] };
  }

  return null;
}
