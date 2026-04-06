export function renderHeroOverlay(content = {}, subtext = '') {
  const mainText = content.text || "Imagine Infinity : You are '|πF|π|+¥', We are '|πF|π|+¥'";
  const sub = subtext || "System Architect // Infinity Workspace-as-a-Service";

  return `
    <div class="pan-text-floating">
      <p>${mainText}</p>
      <small>${sub}</small>
    </div>
  `;
}
