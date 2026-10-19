// Shared inventory for native audio checks and the subjective-listening worksheet.
export const isListeningTarget = item => typeof item.viz === 'function' &&
  item.viz.toString().includes('soundButton') && (
    ['sig-3.15', 'sig-4.12', 'physio-4.14', 'pde-4.2'].includes(item.id) ||
    (item.col === 'music' && [7, 8].includes(item.chapter)) || item.col === 'ling'
  );
