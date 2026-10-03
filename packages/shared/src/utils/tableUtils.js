/**
 * Utilitaires pour la gestion et la disposition des tables Restobook (Shared)
 */

export const getNextAvailableTableNumber = (tables = []) => {
  if (!tables || tables.length === 0) return '1';

  const usedNumbers = new Set();
  tables.forEach(t => {
    if (t && t.number !== undefined && t.number !== null) {
      usedNumbers.add(String(t.number).trim());
    }
  });

  let candidate = 1;
  while (usedNumbers.has(String(candidate))) {
    candidate++;
  }

  return String(candidate);
};

export const findDuplicateTableNumbers = (tables = []) => {
  if (!tables || tables.length <= 1) return [];

  const counts = {};
  tables.forEach(t => {
    if (t && t.number !== undefined && t.number !== null) {
      const num = String(t.number).trim();
      counts[num] = (counts[num] || 0) + 1;
    }
  });

  return Object.keys(counts).filter(num => counts[num] > 1);
};

export const fixDuplicateTableNumbers = (tables = []) => {
  if (!tables || tables.length === 0) return [];

  const seen = new Set();
  const allUsed = new Set();

  tables.forEach(t => {
    const num = String(t.number || '').trim();
    if (num && !seen.has(num)) {
      seen.add(num);
      allUsed.add(num);
    }
  });

  let nextCandidate = 1;
  const getNextFree = () => {
    while (allUsed.has(String(nextCandidate))) {
      nextCandidate++;
    }
    const allocated = String(nextCandidate);
    allUsed.add(allocated);
    return allocated;
  };

  const processedSeen = new Set();
  return tables.map(t => {
    const num = String(t.number || '').trim();
    if (!num || processedSeen.has(num)) {
      const newNum = getNextFree();
      return {
        ...t,
        number: newNum
      };
    }
    processedSeen.add(num);
    return t;
  });
};

export const autoAlignTables = (tables = [], canvasWidth = 1000) => {
  if (!tables || tables.length === 0) return [];

  const startX = 60;
  const startY = 80;
  const stepX = 170;
  const stepY = 150;
  const cols = Math.max(2, Math.floor((canvasWidth - startX) / stepX));

  return tables.map((t, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    return {
      ...t,
      positionX: startX + col * stepX,
      positionY: startY + row * stepY
    };
  });
};
