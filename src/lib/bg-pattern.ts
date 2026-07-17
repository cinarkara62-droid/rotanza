// Shared deterministic dot-scatter generator for page ambient backgrounds
// (no Math.random at render, so server/client markup match).
export function scatterDots(cols: number, rows: number, seedA: number, seedB: number) {
  const dots: { x: number; y: number }[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const jitterX = ((row * seedA + col * 17) % 9) - 4;
      const jitterY = ((row * 13 + col * seedB) % 9) - 4;
      dots.push({
        x: (col / (cols - 1)) * 1000 + jitterX,
        y: (row / (rows - 1)) * 500 + jitterY,
      });
    }
  }
  return dots;
}
