// ============================================================================
// 📐 VIEWPORT DEBUG TOOL - Minimal & Semi-Transparent
// ============================================================================

(function() {
  'use strict';
  
  // Create viewport display element
  const viewportDisplay = document.createElement('div');
  viewportDisplay.id = 'viewport-debug-tool';
  viewportDisplay.style.cssText = `
    position: fixed;
    bottom: 8px;
    right: 8px;
    background: rgba(0, 0, 0, 0.3);
    color: rgba(255, 255, 255, 0.6);
    padding: 4px 8px;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
    font-size: 10px;
    font-weight: normal;
    z-index: 999999;
    pointer-events: none;
    border: 1px solid rgba(255, 255, 255, 0.2);
    line-height: 1.3;
    backdrop-filter: blur(4px);
  `;
  
  // Function to update viewport dimensions
  function updateViewport() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    viewportDisplay.textContent = `${width} × ${height}`;
  }
  
  // Add to page when DOM is ready
  function init() {
    document.body.appendChild(viewportDisplay);
    updateViewport();
    
    // Update on resize
    window.addEventListener('resize', updateViewport);
    
    // Update on orientation change (mobile)
    window.addEventListener('orientationchange', () => {
      setTimeout(updateViewport, 100);
    });
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
