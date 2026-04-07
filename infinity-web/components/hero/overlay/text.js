export function renderHeroOverlay(content = {}, subtext = '') {
  const mainText = content.text || "Imagine Infinity : THANK YOU FOR YOUR CONTINUED SUPPORT.You are '|πF|π|+¥',CHECK IN LATER FOR MORE SCRIPTS";
  const sub = subtext || "System Architect // Infinity Workspace-as-a-Service";

  return `
    <div class="pan-text-floating">
      <p>${mainText}</p>
      <small>${sub}</small>
    </div>
  `;
}
