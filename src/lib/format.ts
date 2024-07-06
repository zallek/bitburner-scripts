export function formatProgressBar(percentage: number, nbSegments: number): string {
  let text = "";
  for (let i = 0; i < nbSegments; i++) {
    if (i < percentage * nbSegments) {
      text += "|";
    } else {
      text += " ";
    }
  }
  return text;
}

export function formatDuration(duration: number): string {
  const seconds = Math.floor(duration / 1000) % 60;
  const minutes = Math.floor((duration / (1000 * 60)) % 60);
  const hours = Math.floor(duration / (1000 * 3600));

  let text = "";
  if (hours > 0) text += `${hours}h `;
  if (hours > 0 || minutes > 0) text += `${minutes}min `;
  if (hours > 0 || minutes > 0 || seconds > 0) text += `${seconds}s`;
  return text;
}
