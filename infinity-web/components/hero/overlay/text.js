export function renderHeroOverlay(content = {}, subtext = '') {
  const mainText = content.text || "Imagine Infinity : THANK YOU FOR YOUR CONTINUED SUPPORT.";
  const sub = subtext || "You are '|πF|π|+¥'.CHECK IN LATER FOR MORE SCRIPTS";

  return `
    <div class="pan-text-floating">
      <p>${mainText}</p>
      <small>${sub}</small>
    </div>
  `;
}
