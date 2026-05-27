/* ── Paste this into the browser DevTools Console (F12) ──
   Instructions:
   1. Open devtools (F12 or Cmd+Shift+I)
   2. Go to the "Console" tab
   3. Load an image in the app so Value Map shows
   4. Paste this entire script and press Enter
   5. Take a screenshot of the output
   6. Feed the screenshot to Claude Code
*/

(function debugChevron() {
  console.log('%c🔍 PANEL/CHEVRON DEBUG', 'font-size:16px; font-weight:bold');

  // 1. Find the chevron button
  const chevrons = document.querySelectorAll('button[aria-label*="Expand"], button[aria-label*="Collapse"]');
  console.log(`Found ${chevrons.length} chevron button(s):`);
  chevrons.forEach((btn, i) => {
    const rect = btn.getBoundingClientRect();
    const style = window.getComputedStyle(btn);
    const parent = btn.parentElement;
    const parentStyle = parent ? window.getComputedStyle(parent) : null;

    console.log(`\n  ── Chevron #${i} ──`);
    console.log(`  aria-label: "${btn.getAttribute('aria-label')}"`);
    console.log(`  Visible: ${rect.width > 0 && rect.height > 0}`);
    console.log(`  Bounding box: (${rect.left.toFixed(1)}, ${rect.top.toFixed(1)}) ${rect.width.toFixed(1)}×${rect.height.toFixed(1)}`);
    console.log(`  Position: ${style.position}`);
    console.log(`  left: ${style.left} | top: ${style.top} | z-index: ${style.zIndex}`);
    console.log(`  display: ${style.display} | visibility: ${style.visibility}`);
    console.log(`  opacity: ${style.opacity}`);
    console.log(`  overflow of parent: ${parentStyle?.overflow}`);
    console.log(`  Parent tag: ${parent?.tagName}.${parent?.className.slice(0, 60)}`);
    console.log(`  Parent bounding box:`, parent?.getBoundingClientRect());
    console.log(`  Parent overflow: ${parentStyle?.overflow}`);
    console.log(`  Parent position: ${parentStyle?.position}`);
  });

  // 2. Check if panel has data-collapsed
  const collapsedWrappers = document.querySelectorAll('[data-collapsed]');
  console.log(`\n  ── Data-collapsed wrappers: ${collapsedWrappers.length} ──`);
  collapsedWrappers.forEach((el, i) => {
    console.log(`  #${i}: ${el.tagName}.${el.className.slice(0, 60)} width=${el.getBoundingClientRect().width.toFixed(1)}px`);
  });

  // 3. Check for .collapsed class
  const allEls = document.querySelectorAll('*');
  let collapsedCount = 0;
  allEls.forEach(el => {
    if (el.className && typeof el.className === 'string' && el.className.includes('collapsed')) {
      collapsedCount++;
    }
  });
  console.log(`\n  Elements with "collapsed" in className: ${collapsedCount}`);

  // 4. Walk the root to find canvas area bounds
  const root = document.querySelector('[class*="root"]');
  if (root) {
    const children = Array.from(root.children);
    children.forEach((child, i) => {
      const rect = child.getBoundingClientRect();
      const pStyle = window.getComputedStyle(child);
      console.log(`\n  Root child #${i}: ${child.tagName}.${(child.className||'').slice(0, 40)}`);
      console.log(`    Box: (${rect.left.toFixed(1)}, ${rect.top.toFixed(1)}) ${rect.width.toFixed(1)}×${rect.height.toFixed(1)}`);
      console.log(`    flex: ${pStyle.flex} | width: ${pStyle.width}`);
    });
  } else {
    console.log('\n  No root element found');
  }

  console.log('\n%c📸 Take a screenshot of this output and share it!', 'font-size:14px; font-weight:bold; color:#7c6af7');
})();
