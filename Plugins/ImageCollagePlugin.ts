import { Editor } from "grapesjs";

// CSS injection function following table plugin pattern
function injectImageCollageStyles(editor: Editor) {
  const CSS_ID = 'gjs-image-collage-styles';
  const css = `
    /* Scope all styles to canvas and preview only to avoid GrapesJS conflicts */
    /* IMPORTANT: Only target elements inside the canvas iframe, NOT the editor UI */
    iframe.gjs-frame .image-collage-container,
    .gjs-frame .image-collage-container,
    body:not(.gjs-editor) .image-collage-container {
      display: flex !important;
      flex-wrap: wrap !important;
      width: 100% !important;
      max-width: 100% !important;
      box-sizing: border-box !important;
      position: relative !important;
      contain: layout style !important;
      /* Ensure no visible border/outline around the entire component */
      border: none !important;
      outline: none !important;
      box-shadow: none !important;
      background: transparent !important;
      padding: 0 !important;
      margin: 0 !important;
      /* Use gap for consistent spacing */
      gap: 10px !important;
    }
    
    iframe.gjs-frame .collage-row,
    .gjs-frame .collage-row,
    body:not(.gjs-editor) .collage-row {
      /* Rows are no longer needed for responsive behavior, but keep for backward compatibility */
      display: contents !important;
    }
    
    /* Responsive cell appearance */
    iframe.gjs-frame .image-collage-cell,
    .gjs-frame .image-collage-cell,
    body:not(.gjs-editor) .image-collage-cell {
      position: relative !important;
      background-size: cover !important;
      background-position: center !important;
      background-repeat: no-repeat !important;
      overflow: hidden !important;
      box-sizing: border-box !important;
        border: 2px solid #ccc !important;
      /* Ensure cells are below the wrapper overlay when selected */
      z-index: 1 !important;
      border-radius: 0 !important;
      display: block !important;
      min-height: 0 !important;
      height: auto !important;
      /* Remove margins since we're using gap on parent */
      margin: 0 !important;
      /* Enforce square aspect ratio */
      aspect-ratio: 1 / 1 !important;
      
      /* Dynamic sizing based on column count */
      flex: 1 1 0px !important;
      max-width: none !important;
    }
    
    /* Dynamic column-based sizing */
    iframe.gjs-frame .image-collage-container[data-cols="1"] .image-collage-cell,
    .gjs-frame .image-collage-container[data-cols="1"] .image-collage-cell,
    body:not(.gjs-editor) .image-collage-container[data-cols="1"] .image-collage-cell {
      flex: 0 0 100% !important;
      max-width: 100% !important;
    }
    
    iframe.gjs-frame .image-collage-container[data-cols="2"] .image-collage-cell,
    .gjs-frame .image-collage-container[data-cols="2"] .image-collage-cell,
    body:not(.gjs-editor) .image-collage-container[data-cols="2"] .image-collage-cell {
      flex: 0 0 calc(50% - 5px) !important;
      max-width: calc(50% - 5px) !important;
    }
    
    iframe.gjs-frame .image-collage-container[data-cols="3"] .image-collage-cell,
    .gjs-frame .image-collage-container[data-cols="3"] .image-collage-cell,
    body:not(.gjs-editor) .image-collage-container[data-cols="3"] .image-collage-cell {
      flex: 0 0 calc(33.333% - 6.67px) !important;
      max-width: calc(33.333% - 6.67px) !important;
    }
    
    iframe.gjs-frame .image-collage-container[data-cols="4"] .image-collage-cell,
    .gjs-frame .image-collage-container[data-cols="4"] .image-collage-cell,
    body:not(.gjs-editor) .image-collage-container[data-cols="4"] .image-collage-cell {
      flex: 0 0 calc(25% - 7.5px) !important;
      max-width: calc(25% - 7.5px) !important;
    }
    
    iframe.gjs-frame .image-collage-container[data-cols="5"] .image-collage-cell,
    .gjs-frame .image-collage-container[data-cols="5"] .image-collage-cell,
    body:not(.gjs-editor) .image-collage-container[data-cols="5"] .image-collage-cell {
      flex: 0 0 calc(20% - 8px) !important;
      max-width: calc(20% - 8px) !important;
    }
    
    iframe.gjs-frame .image-collage-container[data-cols="6"] .image-collage-cell,
    .gjs-frame .image-collage-container[data-cols="6"] .image-collage-cell,
    body:not(.gjs-editor) .image-collage-container[data-cols="6"] .image-collage-cell {
      flex: 0 0 calc(16.666% - 8.33px) !important;
      max-width: calc(16.666% - 8.33px) !important;
    }
    
    iframe.gjs-frame .image-collage-container[data-cols="7"] .image-collage-cell,
    .gjs-frame .image-collage-container[data-cols="7"] .image-collage-cell,
    body:not(.gjs-editor) .image-collage-container[data-cols="7"] .image-collage-cell {
      flex: 0 0 calc(14.286% - 8.57px) !important;
      max-width: calc(14.286% - 8.57px) !important;
    }
    
    iframe.gjs-frame .image-collage-container[data-cols="8"] .image-collage-cell,
    .gjs-frame .image-collage-container[data-cols="8"] .image-collage-cell,
    body:not(.gjs-editor) .image-collage-container[data-cols="8"] .image-collage-cell {
      flex: 0 0 calc(12.5% - 8.75px) !important;
      max-width: calc(12.5% - 8.75px) !important;
    }
    
    iframe.gjs-frame .image-collage-container[data-cols="9"] .image-collage-cell,
    .gjs-frame .image-collage-container[data-cols="9"] .image-collage-cell,
    body:not(.gjs-editor) .image-collage-container[data-cols="9"] .image-collage-cell {
      flex: 0 0 calc(11.111% - 8.89px) !important;
      max-width: calc(11.111% - 8.89px) !important;
    }
    
    iframe.gjs-frame .image-collage-container[data-cols="10"] .image-collage-cell,
    .gjs-frame .image-collage-container[data-cols="10"] .image-collage-cell,
    body:not(.gjs-editor) .image-collage-container[data-cols="10"] .image-collage-cell {
      flex: 0 0 calc(10% - 9px) !important;
      max-width: calc(10% - 9px) !important;
    }
    
    /* Responsive behavior: reduce columns on smaller screens */
    @media (max-width: 768px) {
      iframe.gjs-frame .image-collage-container[data-cols="4"] .image-collage-cell,
      iframe.gjs-frame .image-collage-container[data-cols="5"] .image-collage-cell,
      iframe.gjs-frame .image-collage-container[data-cols="6"] .image-collage-cell,
      iframe.gjs-frame .image-collage-container[data-cols="7"] .image-collage-cell,
      iframe.gjs-frame .image-collage-container[data-cols="8"] .image-collage-cell,
      iframe.gjs-frame .image-collage-container[data-cols="9"] .image-collage-cell,
      iframe.gjs-frame .image-collage-container[data-cols="10"] .image-collage-cell,
      .gjs-frame .image-collage-container[data-cols="4"] .image-collage-cell,
      .gjs-frame .image-collage-container[data-cols="5"] .image-collage-cell,
      .gjs-frame .image-collage-container[data-cols="6"] .image-collage-cell,
      .gjs-frame .image-collage-container[data-cols="7"] .image-collage-cell,
      .gjs-frame .image-collage-container[data-cols="8"] .image-collage-cell,
      .gjs-frame .image-collage-container[data-cols="9"] .image-collage-cell,
      .gjs-frame .image-collage-container[data-cols="10"] .image-collage-cell,
      body:not(.gjs-editor) .image-collage-container[data-cols="4"] .image-collage-cell,
      body:not(.gjs-editor) .image-collage-container[data-cols="5"] .image-collage-cell,
      body:not(.gjs-editor) .image-collage-container[data-cols="6"] .image-collage-cell,
      body:not(.gjs-editor) .image-collage-container[data-cols="7"] .image-collage-cell,
      body:not(.gjs-editor) .image-collage-container[data-cols="8"] .image-collage-cell,
      body:not(.gjs-editor) .image-collage-container[data-cols="9"] .image-collage-cell,
      body:not(.gjs-editor) .image-collage-container[data-cols="10"] .image-collage-cell {
        flex: 0 0 calc(33.333% - 6.67px) !important;
        max-width: calc(33.333% - 6.67px) !important;
      }
    }
    
    @media (max-width: 480px) {
      iframe.gjs-frame .image-collage-container[data-cols="3"] .image-collage-cell,
      iframe.gjs-frame .image-collage-container[data-cols="4"] .image-collage-cell,
      iframe.gjs-frame .image-collage-container[data-cols="5"] .image-collage-cell,
      iframe.gjs-frame .image-collage-container[data-cols="6"] .image-collage-cell,
      iframe.gjs-frame .image-collage-container[data-cols="7"] .image-collage-cell,
      iframe.gjs-frame .image-collage-container[data-cols="8"] .image-collage-cell,
      iframe.gjs-frame .image-collage-container[data-cols="9"] .image-collage-cell,
      iframe.gjs-frame .image-collage-container[data-cols="10"] .image-collage-cell,
      .gjs-frame .image-collage-container[data-cols="3"] .image-collage-cell,
      .gjs-frame .image-collage-container[data-cols="4"] .image-collage-cell,
      .gjs-frame .image-collage-container[data-cols="5"] .image-collage-cell,
      .gjs-frame .image-collage-container[data-cols="6"] .image-collage-cell,
      .gjs-frame .image-collage-container[data-cols="7"] .image-collage-cell,
      .gjs-frame .image-collage-container[data-cols="8"] .image-collage-cell,
      .gjs-frame .image-collage-container[data-cols="9"] .image-collage-cell,
      .gjs-frame .image-collage-container[data-cols="10"] .image-collage-cell,
      body:not(.gjs-editor) .image-collage-container[data-cols="3"] .image-collage-cell,
      body:not(.gjs-editor) .image-collage-container[data-cols="4"] .image-collage-cell,
      body:not(.gjs-editor) .image-collage-container[data-cols="5"] .image-collage-cell,
      body:not(.gjs-editor) .image-collage-container[data-cols="6"] .image-collage-cell,
      body:not(.gjs-editor) .image-collage-container[data-cols="7"] .image-collage-cell,
      body:not(.gjs-editor) .image-collage-container[data-cols="8"] .image-collage-cell,
      body:not(.gjs-editor) .image-collage-container[data-cols="9"] .image-collage-cell,
      body:not(.gjs-editor) .image-collage-container[data-cols="10"] .image-collage-cell {
        flex: 0 0 calc(50% - 5px) !important;
        max-width: calc(50% - 5px) !important;
      }
    }
    
    @media (max-width: 320px) {
      iframe.gjs-frame .image-collage-container[data-cols="2"] .image-collage-cell,
      iframe.gjs-frame .image-collage-container[data-cols="3"] .image-collage-cell,
      iframe.gjs-frame .image-collage-container[data-cols="4"] .image-collage-cell,
      iframe.gjs-frame .image-collage-container[data-cols="5"] .image-collage-cell,
      iframe.gjs-frame .image-collage-container[data-cols="6"] .image-collage-cell,
      iframe.gjs-frame .image-collage-container[data-cols="7"] .image-collage-cell,
      iframe.gjs-frame .image-collage-container[data-cols="8"] .image-collage-cell,
      iframe.gjs-frame .image-collage-container[data-cols="9"] .image-collage-cell,
      iframe.gjs-frame .image-collage-container[data-cols="10"] .image-collage-cell,
      .gjs-frame .image-collage-container[data-cols="2"] .image-collage-cell,
      .gjs-frame .image-collage-container[data-cols="3"] .image-collage-cell,
      .gjs-frame .image-collage-container[data-cols="4"] .image-collage-cell,
      .gjs-frame .image-collage-container[data-cols="5"] .image-collage-cell,
      .gjs-frame .image-collage-container[data-cols="6"] .image-collage-cell,
      .gjs-frame .image-collage-container[data-cols="7"] .image-collage-cell,
      .gjs-frame .image-collage-container[data-cols="8"] .image-collage-cell,
      .gjs-frame .image-collage-container[data-cols="9"] .image-collage-cell,
      .gjs-frame .image-collage-container[data-cols="10"] .image-collage-cell,
      body:not(.gjs-editor) .image-collage-container[data-cols="2"] .image-collage-cell,
      body:not(.gjs-editor) .image-collage-container[data-cols="3"] .image-collage-cell,
      body:not(.gjs-editor) .image-collage-container[data-cols="4"] .image-collage-cell,
      body:not(.gjs-editor) .image-collage-container[data-cols="5"] .image-collage-cell,
      body:not(.gjs-editor) .image-collage-container[data-cols="6"] .image-collage-cell,
      body:not(.gjs-editor) .image-collage-container[data-cols="7"] .image-collage-cell,
      body:not(.gjs-editor) .image-collage-container[data-cols="8"] .image-collage-cell,
      body:not(.gjs-editor) .image-collage-container[data-cols="9"] .image-collage-cell,
      body:not(.gjs-editor) .image-collage-container[data-cols="10"] .image-collage-cell {
        flex: 0 0 100% !important;
        max-width: 100% !important;
      }
    }
    
    /* Default appearance for cells without images */
    iframe.gjs-frame .image-collage-cell:not([data-has-image="true"]):not([style*="background-image"]),
    .gjs-frame .image-collage-cell:not([data-has-image="true"]):not([style*="background-image"]),
    body:not(.gjs-editor) .image-collage-cell:not([data-has-image="true"]):not([style*="background-image"]) {
      background-color: rgba(240, 240, 240, 0.3);
    }
    
    /* When cell has background image - completely override the dashed border */
    iframe.gjs-frame .image-collage-cell[style*="background-image"][style*="url"],
    iframe.gjs-frame .image-collage-cell[data-has-image="true"],
    .gjs-frame .image-collage-cell[style*="background-image"][style*="url"],
    .gjs-frame .image-collage-cell[data-has-image="true"],
    body:not(.gjs-editor) .image-collage-cell[style*="background-image"][style*="url"],
    body:not(.gjs-editor) .image-collage-cell[data-has-image="true"] {
      border: none !important;
      background-color: transparent !important;
      border-radius: 0 !important;
    }
    
    /* Force remove dashed border when image is present */
    iframe.gjs-frame .image-collage-cell[data-has-image="true"],
    .gjs-frame .image-collage-cell[data-has-image="true"],
    body:not(.gjs-editor) .image-collage-cell[data-has-image="true"] {
      border-style: none !important;
      border-width: 0 !important;
    }

    /* When the wrapper is selected, draw an overlay border above cells */
    iframe.gjs-frame .image-collage-wrapper.gjs-selected::after,
    .gjs-frame .image-collage-wrapper.gjs-selected::after,
    body:not(.gjs-editor) .image-collage-wrapper.gjs-selected::after {
      content: '';
      position: absolute;
      inset: 0;
      border: 3px solid rgba(0,124,186,0.95);
      pointer-events: none;
      z-index: 10000;
      border-radius: 2px;
      box-sizing: border-box;
    }
    
    iframe.gjs-frame .cell-text-overlay,
    .gjs-frame .cell-text-overlay,
    body:not(.gjs-editor) .cell-text-overlay {
      position: absolute !important;
      bottom: 0 !important;
      left: 0 !important;
      right: 0 !important;
      /* Overlay takes 30% of the parent cell's height and must not grow */
      /* Use non-!important defaults so inline styles / traits can override height */
      height: 30%;
      max-height: 30%;
      min-height: 30%;
      /* Default background - can be overridden by traits */
      background: rgba(0, 0, 0, 0.45);
      /* equal vertical padding to center the text vertically */
      padding: 10px 12px !important;
      /* FIXED: Reduced z-index to avoid conflicts with other components */
      z-index: 1 !important;
      box-sizing: border-box !important;
      display: flex !important;
      align-items: center !important; /* vertically center content */
      justify-content: flex-start !important;
      overflow: hidden !important; /* prevent expansion when content wraps */
      /* FIXED: Ensure overlay doesn't block clicks outside its boundaries */
      pointer-events: none !important;
    }
    
    /* Re-enable pointer events only for the text inside the overlay */
    iframe.gjs-frame .cell-text-overlay .overlay-text,
    .gjs-frame .cell-text-overlay .overlay-text,
    body:not(.gjs-editor) .cell-text-overlay .overlay-text {
      pointer-events: auto;
    }
    
    iframe.gjs-frame .overlay-text,
    .gjs-frame .overlay-text,
    body:not(.gjs-editor) .overlay-text {
      /* Default styles - can be overridden by parent overlay traits */
      color: #ffffff;
      /* Desktop default font size (keep unchanged) */
      font-size: 18px;
      /* Lock the text element position completely */
      position: static !important;
      width: 100% !important;
      height: auto !important;
      min-height: auto !important;
      margin: 0 !important;
      padding: 0 !important;
      cursor: text !important;
      /* FIXED: Remove pointer-events to avoid blocking clicks on other components */
      /* pointer-events: auto !important; */
      /* Prevent any transform or positioning */
      transform: none !important;
      top: auto !important;
      left: auto !important;
      right: auto !important;
      bottom: auto !important;
      font-weight: 600;
      text-shadow: 0 1px 2px rgba(0,0,0,0.55);
      /* Ensure text has transparent background */
      background: transparent !important;
      /* Layout styles - keep important to maintain structure */
      display: block !important;
      line-height: 1.1 !important;
      cursor: text !important;
      outline: none !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow: hidden !important;
      /* Allow wrapping to multiple lines and break long words if necessary */
      text-overflow: clip !important;
      white-space: normal !important;
      word-break: break-word !important;
      display: -webkit-box !important;
      -webkit-line-clamp: 3 !important; /* show up to 3 lines inside the overlay */
      -webkit-box-orient: vertical !important;
    }
    
    /* Responsive font sizes for overlay text */
    /* Tablet: 3 columns - increase font size */
    @media (max-width: 768px) {
      iframe.gjs-frame .overlay-text,
      .gjs-frame .overlay-text,
      body:not(.gjs-editor) .overlay-text {
        font-size: 16px;
      }
    }
    
    /* Mobile: 2 columns - larger font size */
    @media (max-width: 480px) {
      iframe.gjs-frame .overlay-text,
      .gjs-frame .overlay-text,
      body:not(.gjs-editor) .overlay-text {
        font-size: 18px;
      }
    }
    
    /* Very small mobile: 1 column - largest font size */
    @media (max-width: 320px) {
      iframe.gjs-frame .overlay-text,
      .gjs-frame .overlay-text,
      body:not(.gjs-editor) .overlay-text {
        font-size: 20px;
      }
    }
    
    /* Ensure contenteditable text doesn't expand the overlay - clamp lines and hide overflow */
    iframe.gjs-frame .overlay-text[contenteditable="true"],
    .gjs-frame .overlay-text[contenteditable="true"],
    body:not(.gjs-editor) .overlay-text[contenteditable="true"] {
      /* Layout constraints - keep important */
      display: block !important;
      max-width: 100% !important;
      overflow: hidden !important;
      text-overflow: clip !important;
      white-space: normal !important;
      word-break: break-word !important;
      -webkit-line-clamp: 3 !important;
      -webkit-box-orient: vertical !important;
      display: -webkit-box !important;
    }

    /* Prevent GrapesJS panel conflicts - be very specific */
    .gjs-editor .gjs-pn-panels {
      position: relative !important;
      z-index: 10 !important;
    }
    
    .gjs-editor .gjs-pn-panel {
      position: relative !important;
    }
    
    .gjs-editor .gjs-sm-sectors {
      max-width: 300px !important;
      width: 300px !important;
      overflow-x: hidden !important;
    }
    
    .gjs-editor .gjs-sm-property {
      flex: none !important;
      width: auto !important;
      max-width: none !important;
    }
    
    .gjs-editor .gjs-traits-cs {
      max-width: 300px !important;
      width: auto !important;
      flex: none !important;
    }
    
    /* Fix modal positioning - ensure modals appear above other content but don't interfere globally */
    .gjs-modal-container {
      z-index: 9999 !important;
      position: fixed !important;
    }
    
    .gjs-modal-content {
      max-width: 600px !important;
      max-height: 80vh !important;
      overflow-y: auto !important;
      position: relative !important;
      z-index: 10000 !important;
    }
  `;

  const injectInto = (doc: Document | null | undefined) => {
    if (!doc) return;
    let styleEl = doc.getElementById(CSS_ID) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = doc.createElement('style');
      styleEl.id = CSS_ID;
      styleEl.type = 'text/css';
      styleEl.appendChild(doc.createTextNode(css));
      (doc.head || doc.documentElement).appendChild(styleEl);
    } else {
      styleEl.textContent = css;
    }
  };

  // Inject immediately
  try { injectInto(editor.Canvas.getDocument()); } catch { /* ignore */ }
  
  // Re-inject on frame load
  try { 
    editor.on('canvas:frame:loaded', () => { 
      try { injectInto(editor.Canvas.getDocument()); } catch { /* ignore */ } 
    }); 
  } catch { /* ignore */ }
  
  // Re-inject when components are loaded
  try {
    editor.on('load', () => {
      setTimeout(() => {
        try { injectInto(editor.Canvas.getDocument()); } catch { /* ignore */ }
      }, 100);
    });
  } catch { /* ignore */ }

  // Add styles using CSS Manager for preview mode
  try {
    const cssManager = editor.Css;
    if (cssManager && cssManager.addRules) {
      cssManager.addRules(css);
    }
  } catch { /* ignore */ }

  // Also use editor.addStyle for canvas injection
  try {
    editor.addStyle(css);
  } catch { /* ignore */ }
}

export function imageCollagePlugin(editor: Editor) {
  injectImageCollageStyles(editor);
  
  // Ensure CSS is added after editor loads
  editor.on('load', () => {
    setTimeout(() => injectImageCollageStyles(editor), 200);
  });
  
  // Re-inject CSS when entering preview mode
  editor.on('run:preview', () => {
    setTimeout(() => injectImageCollageStyles(editor), 100);
  });
  
  // Re-inject CSS when exiting preview mode
  editor.on('stop:preview', () => {
    setTimeout(() => injectImageCollageStyles(editor), 100);
  });

  const domc = editor.DomComponents;

  // Row component - simple div with flex layout
  domc.addType('collage-row', {
    isComponent: (el: HTMLElement): boolean => {
      return el.classList && el.classList.contains('collage-row');
    },
    model: {
      defaults: {
        tagName: 'div',
        classes: ['collage-row'],
        droppable: ['image-collage-cell'],
        draggable: false
      }
    }
  });

  // Cell component - holds image and text overlay
  domc.addType('image-collage-cell', {
    isComponent: (el: HTMLElement): boolean => {
      return el.classList && el.classList.contains('image-collage-cell');
    },
    model: {
      defaults: {
        tagName: 'div',
        classes: ['image-collage-cell'],
        droppable: ['cell-text-overlay'],
        draggable: false,
        removable: true,
        traits: [
          {
            type: 'color',
            name: 'background-color',
            label: 'Background Color'
          }
        ],
        components: [
          {
            tagName: 'svg',
            classes: ['collage-thumb'],
            attributes: {
              viewBox: '0 0 24 24',
              'aria-hidden': 'true',
              focusable: 'false'
            },
            removable: false,
            draggable: false,
            selectable: false,
            hoverable: false,
            style: {
              width: '100%',
              height: '100%',
              display: 'block',
              pointerEvents: 'none'
            },
            components: [
              {
                tagName: 'rect',
                attributes: { width: '100%', height: '100%', fill: 'rgba(240,240,240,0.6)' }
              },
              {
                tagName: 'g',
                components: [
                  { tagName: 'circle', attributes: { cx: '18', cy: '6', r: '2', fill: '#cccccc', opacity: '0.9' } },
                  { tagName: 'polygon', attributes: { points: '3,20 10,8 17,20', fill: '#bbbbbb' } }
                ]
              }
            ]
          },
          {
            type: 'cell-text-overlay'
          }
        ],
        toolbar: [
          { 
            attributes: { class: "fa fa-image", title: "Add/Change Image" }, 
            command: "set-cell-image" 
          },
          { 
            attributes: { class: "fa fa-trash", title: "Delete Cell" }, 
            command: "delete-collage-cell" 
          }
        ]
      }
    },
    view: {
      init() {
        const model: any = this.model;
        const el = this.el as HTMLElement | null;
        if (!el) return;

        // Manage placeholder thumbnail visibility (the placeholder is an <img.collage-thumb> child)
        try {
          const attrs = model.getAttributes ? model.getAttributes() : {};
          const hasImage = attrs && attrs['data-has-image'] === 'true';
          const imgEl = el.querySelector && el.querySelector('.collage-thumb') as HTMLElement | null;
          if (imgEl) {
            try {
              imgEl.style.display = hasImage ? 'none' : 'block';
            } catch (_) { /* ignore */ }
          }

          // Listen for future attribute/style changes to toggle placeholder.
          try {
            const togglePlaceholder = () => {
              try {
                const a = (this.model as any).getAttributes ? (this.model as any).getAttributes() : {};
                const byAttr = a && a['data-has-image'] === 'true';
                const bg = el.style && (el.style.backgroundImage || el.style.getPropertyValue('background-image'));
                const byStyle = !!(bg && bg.indexOf('url(') !== -1);
                const img = el.querySelector && el.querySelector('.collage-thumb') as HTMLElement | null;
                if (img) img.style.display = (byAttr || byStyle) ? 'none' : 'block';
              } catch (_) { /* ignore */ }
            };

            // Model attribute changes
            (this.model as any).on && (this.model as any).on('change:attributes', togglePlaceholder);
            // Model style changes (AzureImagePlugin triggers change:style)
            (this.model as any).on && (this.model as any).on('change:style', togglePlaceholder);

            // Observe DOM attribute/style changes as a final fallback
            try {
              const mo = new MutationObserver(() => togglePlaceholder());
              mo.observe(el, { attributes: true, attributeFilter: ['style', 'data-has-image'] });
              (this as any).__collageAttrObserver = mo;
            } catch (_) { /* ignore */ }
          } catch (_) { /* ignore */ }
        } catch (_) { /* ignore */ }

        // Click on the cell should open the Azure image explorer and select this cell
        const clickHandler = (ev: Event) => {
          try {
            ev.stopPropagation();
          } catch (_) {
            /* ignore */
          }
          try {
            // Select the model in the editor so AzureImagePlugin targets it
            (editor as any).select && (editor as any).select(model);
          } catch (_) {
            /* ignore */
          }
          try {
            (editor as any).runCommand && (editor as any).runCommand('azure-image:open');
          } catch (e) {
            console.warn('[ImageCollage] Failed to open Azure explorer on cell click', e);
          }
        };

        el.addEventListener('click', clickHandler);

        // Store handler for cleanup
        (this as any).__collageClickHandler = clickHandler;
      },
      onRemove() {
        const el = this.el as HTMLElement | null;
        const h = (this as any).__collageClickHandler;
        if (el && h) el.removeEventListener('click', h);
        const mo = (this as any).__collageAttrObserver as MutationObserver | undefined;
        if (mo) try { mo.disconnect(); } catch (_) { /* ignore */ }
      }
    }
  });

  // Text overlay component
  domc.addType('cell-text-overlay', {
    isComponent: (el: HTMLElement): boolean => {
      return el.classList && el.classList.contains('cell-text-overlay');
    },
    model: {
      defaults: {
        tagName: 'div',
        classes: ['cell-text-overlay'],
        droppable: false,
        draggable: false,
        selectable: true,
        traits: [
          {
            type: 'color',
            name: 'background-color',
            label: 'Background Color'
          },
          {
            type: 'slider',
            name: 'overlay-height',
            label: 'Overlay Height',
            min: 5,
            max: 80,
            unit: '%',
            value: '30%',
            changeProp: true
          },
          {
            type: 'color',
            name: 'color',
            label: 'Text Color'
          },
          {
            type: 'slider',
            name: 'font-size',
            label: 'Font Size',
            min: 10,
            max: 32,
            unit: 'px'
          },
          {
            type: 'select',
            name: 'font-weight',
            label: 'Font Weight',
            options: [
              { id: 'normal', name: 'Normal' },
              { id: 'bold', name: 'Bold' },
              { id: '100', name: '100' },
              { id: '200', name: '200' },
              { id: '300', name: '300' },
              { id: '400', name: '400' },
              { id: '500', name: '500' },
              { id: '600', name: '600' },
              { id: '700', name: '700' },
              { id: '800', name: '800' },
              { id: '900', name: '900' }
            ]
          },
          {
            type: 'select',
            name: 'text-align',
            label: 'Text Align',
            options: [
              { id: 'left', name: 'Left' },
              { id: 'center', name: 'Center' },
              { id: 'right', name: 'Right' }
            ]
          }
        ],
        components: [
          {
            type: 'text',
            classes: ['overlay-text'],
            content: 'Sample Text',
            editable: true,
            selectable: false,
            draggable: false,
            droppable: false,
            removable: false,
            copyable: false,
            hoverable: false,
            highlightable: false,
            layerable: false,
            resizable: false,
            badgable: false,
            stylable: false,
            // Make it completely locked
            locked: true
          }
        ]
      },
      
      init() {
        // Listen for trait changes and apply them to the nested text component
        this.listenTo(this, 'change:color change:font-size change:font-weight change:text-align', this.updateTextStyles);
        // Listen for overlay height changes and apply inline styles
        this.listenTo(this, 'change:overlay-height', this.updateOverlayHeight);
        // Apply initial overlay height from trait (if present)
        setTimeout(() => this.updateOverlayHeight(), 50);
        
        // Ensure nested text component is completely locked
        const components = this.components() as any;
        if (components && components.each) {
          components.each((comp: any) => {
            if (comp.get && comp.get('classes') && comp.get('classes').includes('overlay-text')) {
              comp.set({
                draggable: false,
                droppable: false,
                selectable: false,
                removable: false,
                copyable: false,
                hoverable: false,
                highlightable: false,
                layerable: false,
                // Additional properties to prevent movement
                resizable: false,
                badgable: false,
                stylable: false
              });
              
              // Prevent any drag events
              if (comp.view && comp.view.el) {
                comp.view.el.addEventListener('dragstart', (e: Event) => {
                  e.preventDefault();
                  e.stopPropagation();
                  return false;
                }, true);
                
                comp.view.el.addEventListener('drag', (e: Event) => {
                  e.preventDefault();
                  e.stopPropagation();
                  return false;
                }, true);
              }
            }
          });
        }
      },
      
      updateTextStyles() {
        const components = this.components() as any;
        const textComponent = components.at ? components.at(0) : components.first();
        if (textComponent) {
          const styles: any = {};
          
          // Apply text-related styles to the nested text component
          const color = this.get('color');
          const fontSize = this.get('font-size');
          const fontWeight = this.get('font-weight');
          const textAlign = this.get('text-align');
          
          if (color) styles.color = color;
          if (fontSize) styles['font-size'] = fontSize;
          if (fontWeight) styles['font-weight'] = fontWeight;
          if (textAlign) styles['text-align'] = textAlign;
          
          textComponent.setStyle(styles);
        }
  },

  updateOverlayHeight() {
        // New trait stores a numeric value + unit (e.g. '30%') or a number
        let raw = this.get('overlay-height');
        if (raw === undefined || raw === null) raw = '30%';

        // Normalize value to string with unit
        let heightValue = String(raw);
        // If it's a plain number, append %
        if (/^\d+$/.test(heightValue)) {
          heightValue = `${heightValue}%`;
        }

        // Ensure the model style is updated so the trait persists
        try {
          this.setStyle({ height: heightValue, 'max-height': heightValue, 'min-height': heightValue });
        } catch (e) {
          // ignore
        }

        // Also apply inline style with !important on the actual element inside the canvas so it overrides remaining stylesheet rules
        try {
          const el = this.getEl && this.getEl();
          if (el && el.style && el.style.setProperty) {
            el.style.setProperty('height', heightValue, 'important');
            el.style.setProperty('max-height', heightValue, 'important');
            el.style.setProperty('min-height', heightValue, 'important');
          }
        } catch (e) {
          // ignore
        }
      }
    }
  });

  // Wrapper component for the entire collage (outer selectable container)
  domc.addType('image-collage-wrapper', {
    isComponent: (el: HTMLElement): boolean => {
      return el.classList && el.classList.contains('image-collage-wrapper');
    },
    model: {
      defaults: {
        tagName: 'div',
        classes: ['image-collage-wrapper'],
        droppable: false,
        draggable: true,
        removable: true,
        copyable: true,
        selectable: true,
        hoverable: true,
        highlightable: true,
        name: 'Image Collage',
        icon: '<svg viewBox="0 0 24 24"><path d="M22 16V4c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2zm-11-4l2.03 2.71L16 11l4 5H8l3-4zM2 6v14c0 1.1.9 2 2 2h14v-2H4V6H2z"/></svg>',
        toolbar: [
          {
            attributes: { class: 'fa fa-arrows', title: 'Move' },
            command: 'tlb-move'
          },
          {
            attributes: { class: 'fa fa-cogs', title: 'Configure Collage' },
            command: 'configure-collage-wrapper'
          },
          {
            attributes: { class: 'fa fa-clone', title: 'Duplicate' },
            command: 'tlb-clone'
          },
          {
            attributes: { class: 'fa fa-trash-o', title: 'Delete' },
            command: 'tlb-delete'
          }
        ],
        components: [
          {
            type: 'image-collage'
          }
        ],
        styles: `
          .image-collage-wrapper {
            display: block;
            width: 100%;
            margin: 0;
            padding: 0;
            position: relative;
          }
        `
      }
    }
  });

  // Main image collage component (inner grid)
  domc.addType('image-collage', {
    isComponent: (el: HTMLElement): any => {
      if (el.classList && el.classList.contains('image-collage-container')) {
        return {
          type: 'image-collage',
          rows: parseInt(el.getAttribute('data-rows') || '5'),
          cols: parseInt(el.getAttribute('data-cols') || '4')
        };
      }
      return false;
    },
    model: {
      defaults: {
        tagName: 'div',
        classes: ['image-collage-container'],
        droppable: ['image-collage-cell'],
        draggable: false,
        selectable: false,
        removable: false,
        copyable: false,
        name: 'Collage Grid',
        rows: 5,
        cols: 4,
        attributes: { 
          'data-cols': '4',
          'data-rows': '5'
        },
        traits: [
          {
            type: 'number',
            name: 'rows',
            label: 'Rows',
            min: 1,
            max: 10,
            changeProp: true
          },
          {
            type: 'number', 
            name: 'cols',
            label: 'Columns',
            min: 1,
            max: 10,
            changeProp: true
          }
        ],
        toolbar: [
          {
            attributes: { class: 'fa fa-cogs', title: 'Configure Collage' },
            command: 'configure-collage'
          }
        ]
      },

      init() {
        this.listenTo(this, 'change:rows change:cols', this.updateGrid);
        
      },

      updateGrid() {
        const rows = this.get('rows') || 5;
        const cols = this.get('cols') || 4;
        
        // Update data attributes for CSS to use and persistence
        this.addAttributes({ 
          'data-cols': cols.toString(),
          'data-rows': rows.toString()
        });
        
        this.generateGrid();
      },

      generateGrid() {
        const rows = this.get('rows') || 5;
        const cols = this.get('cols') || 4;
        const totalCells = rows * cols;
        
        // Clear existing components
        (this.components() as any).reset();
        
        // Set data attribute for CSS to use
        this.addAttributes({ 'data-cols': cols });
        
        // Generate cells directly in container (responsive flex-wrap will handle layout)
        for (let i = 0; i < totalCells; i++) {
          this.append({
            type: 'image-collage-cell',
            attributes: { 'data-has-image': 'false' }
          });
        }
      }
    },

    view: {
      init() {
        // Show configuration modal when component is first added
        const model = this.model;
        
        // Check if this is a new component (no existing children)
        const components = model.components();
        const isNewComponent = !components || (components as any).length === 0;
        
        if (isNewComponent) {
          // Delay to ensure component is fully initialized
          setTimeout(() => {
            this.showInitialConfigModal();
          }, 100);
        }
      },

      showInitialConfigModal() {
        const model = this.model;
        const modal = editor.Modal;
        
        const modalContent = document.createElement('div');
        modalContent.innerHTML = `
          <div class="gjs-table-modal">
            <!-- header removed per request -->
            <div style="margin-bottom: 12px;">
              <label>Rows:</label>
              <input id="initial-rows" type="number" min="1" max="10" value="5">
            </div>
            <div style="margin-bottom: 14px;">
              <label>Columns:</label>
              <input id="initial-cols" type="number" min="1" max="10" value="4">
            </div>
            <div class="gjs-table-buttons">
              <button id="create-btn">Create Collage</button>
            </div>
          </div>
        `;

        const rowsInput = modalContent.querySelector('#initial-rows') as HTMLInputElement;
        const colsInput = modalContent.querySelector('#initial-cols') as HTMLInputElement;
        const createBtn = modalContent.querySelector('#create-btn') as HTMLButtonElement;

        modal.open({
          title: 'Image Collage Setup',
          content: modalContent
        });

        createBtn.addEventListener('click', () => {
          const rows = parseInt(rowsInput.value) || 5;
          const cols = parseInt(colsInput.value) || 4;
          
          // Set the dimensions and generate the grid
          model.set({ rows, cols });
          (model as any).generateGrid();
          
          modal.close();
        });

        // Focus on rows input
        setTimeout(() => rowsInput.focus(), 100);
      }
    }
  });

  // Commands
  // Use the centralized Azure image explorer instead of the legacy modal.
  // This delegates image selection to the AzureImagePlugin which exposes
  // the `azure-image:open` command and will call back into the editor to
  // update the currently selected component via its `selectImage` flow.
  editor.Commands.add('set-cell-image', {
    run(editor: Editor, sender: any, options: any = {}) {
      const target = options.target || editor.getSelected();
      if (!target) return;

      // Ensure the target is selected so the Azure plugin can determine
      // which component should receive the chosen image.
      try {
        editor.select(target);
      } catch (e) {
        // non-fatal
      }

      // Open the Azure image explorer command provided by AzureImagePlugin
      try {
        editor.runCommand && editor.runCommand('azure-image:open');
      } catch (e) {
        console.warn('[ImageCollage] Failed to open Azure image explorer', e);
      }
    }
  });

  editor.Commands.add('remove-cell-image', {
    run(editor: Editor, sender: any, options: any = {}) {
      const target = options.target || editor.getSelected();
      if (!target) return;

      // Check if it's an image collage cell
      if (!target.get || !target.get('classes') || !target.get('classes').includes('image-collage-cell')) {
        return;
      }

      // Remove background image and restore dashed border
      target.setStyle({
        'background-image': '',
        'background-size': '',
        'background-position': '',
        'background-repeat': '',
        'background-color': 'rgba(240, 240, 240, 0.3)',
        'border': '2px solid #ccc'
      });
      
      // Remove the data attribute
      target.removeAttributes('data-has-image');
      
      // Clear the background-image from the actual element
      const el = target.getEl();
      if (el) {
        el.style.backgroundImage = '';
        el.removeAttribute('data-has-image');
      }
      
      // Force re-render
      target.view?.render();
      
      // Trigger change to ensure UI updates
      target.trigger('change:style');
    }
  });

  // Command to delete a single cell completely
  editor.Commands.add('delete-collage-cell', {
    run(editor: Editor, sender: any, options: any = {}) {
      try {
        const target = options.target || editor.getSelected();
        if (!target) {
          console.warn('[ImageCollage] No target to delete');
          return;
        }

        console.log('[ImageCollage] Delete cell - target type:', target.get('type'), 'classes:', target.get('classes'));

        // Check if it's an image collage cell - be more flexible with the check
        const type = target.get('type');
        const classes = target.get('classes');
        const classList = classes?.models?.map((m: any) => m.get('name')) || [];
        
        const isCollageCell = type === 'image-collage-cell' || 
                             classList.includes('image-collage-cell') ||
                             (classes && classes.includes && classes.includes('image-collage-cell'));
        
        if (!isCollageCell) {
          console.warn('[ImageCollage] Target is not a collage cell');
          return;
        }

        console.log('[ImageCollage] Removing cell...');
        
        // Get the parent before removing - with safety check
        const parent = (typeof target.parent === 'function') ? target.parent() : null;

        // Remove the cell component
        target.remove();
        
        console.log('[ImageCollage] Cell removed successfully');

        // Select the parent or canvas after deletion
        setTimeout(() => {
          if (parent && !parent.removed) {
            editor.select(parent);
          } else {
            editor.select(editor.getWrapper());
          }
        }, 10);
        
      } catch (error) {
        console.error('[ImageCollage] Error deleting cell:', error);
      }
    }
  });

  editor.Commands.add('configure-collage', {
    run(editor: Editor, sender: any, options: any = {}) {
      const target = options.target || editor.getSelected();
      if (!target) return;

      // Get current rows and cols from the target
      const currentRows = target.get('rows') || 5;
      const currentCols = target.get('cols') || 4;

      const modal = editor.Modal;
      const modalContent = document.createElement('div');
      modalContent.innerHTML = `
        <div class="gjs-table-modal">
          <div style="margin-bottom: 15px;">
            <label>Rows:</label>
            <input id="collage-rows" type="number" min="1" max="10" value="${currentRows}">
          </div>
          <div style="margin-bottom: 20px;">
            <label>Columns:</label>
            <input id="collage-cols" type="number" min="1" max="10" value="${currentCols}">
          </div>
          <div class="gjs-table-buttons">
            <button id="cancel-btn">Cancel</button>
            <button id="apply-btn">Apply</button>
          </div>
        </div>
      `;

      const rowsInput = modalContent.querySelector('#collage-rows') as HTMLInputElement;
      const colsInput = modalContent.querySelector('#collage-cols') as HTMLInputElement;
      const applyBtn = modalContent.querySelector('#apply-btn') as HTMLButtonElement;
      const cancelBtn = modalContent.querySelector('#cancel-btn') as HTMLButtonElement;

      modal.open({
        title: 'Configure Collage',
        content: modalContent
      }).getModel().set('backdrop', false); 

      applyBtn.addEventListener('click', () => {
        const rows = parseInt(rowsInput.value) || 5;
        const cols = parseInt(colsInput.value) || 4;
        
        target.set({ rows, cols });
        modal.close();
      });

      cancelBtn.addEventListener('click', () => {
        modal.close();
      });
    }
  });

  // Add wrapper-specific configure command that finds the inner collage component
  editor.Commands.add('configure-collage-wrapper', {
    run(editor: Editor, sender: any, options: any = {}) {
      const wrapper = options.target || editor.getSelected();
      if (!wrapper) return;

      // Find the inner image-collage component
      const components = wrapper.components();
      let collageComponent: any = null;
      
      
      if (components && (components as any).length > 0) {
        collageComponent = (components as any).at(0);
      }
      
      // Try to find by type if not found
      if (!collageComponent && components && (components as any).filter) {
        const found = (components as any).filter((comp: any) => {
          return comp.get && comp.get('type') === 'image-collage';
        });
        if (found && found.length > 0) {
          collageComponent = found[0];
        }
      }
      
      // Try to find by class name
      if (!collageComponent && components && (components as any).filter) {
        const found = (components as any).filter((comp: any) => {
          const classes = comp.get && comp.get('classes');
          return classes && classes.includes && classes.includes('image-collage-container');
        });
        if (found && found.length > 0) {
          collageComponent = found[0];
        }
      }
      
      
      if (!collageComponent) {
        console.error('[Configure Collage] Could not find inner image-collage component');
        return;
      }

      // Get current rows and cols from the inner collage component
      const currentRows = collageComponent.get('rows') || 5;
      const currentCols = collageComponent.get('cols') || 4;
      

      const modal = editor.Modal;
      const modalContent = document.createElement('div');
      modalContent.innerHTML = `
        <div class="gjs-table-modal">
          <!-- header removed per request -->
          <div style="margin-bottom: 12px;">
            <label>Rows:</label>
            <input id="collage-rows" type="number" min="1" max="10" value="${currentRows}">
          </div>
          <div style="margin-bottom: 14px;">
            <label>Columns:</label>
            <input id="collage-cols" type="number" min="1" max="10" value="${currentCols}">
          </div>
          <div class="gjs-table-buttons">
            <button id="cancel-btn">Cancel</button>
            <button id="apply-btn">Apply</button>
          </div>
        </div>
      `;

      const rowsInput = modalContent.querySelector('#collage-rows') as HTMLInputElement;
      const colsInput = modalContent.querySelector('#collage-cols') as HTMLInputElement;
      const applyBtn = modalContent.querySelector('#apply-btn') as HTMLButtonElement;
      const cancelBtn = modalContent.querySelector('#cancel-btn') as HTMLButtonElement;

      modal.open({
        title: 'Configure Collage',
        content: modalContent
      }).getModel().set('backdrop', false); 

      applyBtn.addEventListener('click', () => {
        const rows = parseInt(rowsInput.value) || 5;
        const cols = parseInt(colsInput.value) || 4;
        
        // Update the inner collage component
        collageComponent.set({ rows, cols });
        modal.close();
      });

      cancelBtn.addEventListener('click', () => {
        modal.close();
      });
    }
  });

  // Add editor-level event handlers to prevent text component dragging
  editor.on('component:drag:start', (component: any) => {
    try {
      // Safety check: ensure component is valid and has required methods
      if (!component || typeof component.get !== 'function' || typeof component.parent !== 'function') {
        return;
      }
      
      // Check if this is a text component within an image collage
      if (component.get('classes')) {
        const classes = component.get('classes');
        if (classes && classes.includes && classes.includes('overlay-text')) {
          // Prevent drag start for overlay text
          return false;
        }
      }
      
      // Check if parent is a cell-text-overlay
      let parent = (typeof component.parent === 'function') ? component.parent() : null;
      while (parent) {
        if (typeof parent.get === 'function' && parent.get('classes')) {
          const parentClasses = parent.get('classes');
          if (parentClasses && parentClasses.includes && parentClasses.includes('cell-text-overlay')) {
            // This is a child of a text overlay, prevent dragging
            return false;
          }
        }
        parent = (typeof parent.parent === 'function') ? parent.parent() : null;
      }
    } catch (e) {
      console.warn('[ImageCollage] Error in drag:start handler:', e);
    }
  });

  editor.on('component:selected', (component: any) => {
    try {
      // Safety check: ensure component is valid and has required methods
      if (!component || typeof component.get !== 'function' || typeof component.parent !== 'function') {
        return;
      }

      // If an overlay-text component is selected, select its parent instead
      if (component.get('classes')) {
        const classes = component.get('classes');
        if (classes && classes.includes && classes.includes('overlay-text')) {
          const parent = (typeof component.parent === 'function') ? component.parent() : null;
          if (parent) {
            editor.select(parent);
            return;
          }
        }
      }

      // If an image-collage cell is selected and it doesn't have an image yet,
      // open the Azure image explorer so the user can pick one directly from the cell
      const classes = component.get('classes');
      const isCellByType = component.get('type') === 'image-collage-cell';
      const isCellByClass = (classes && classes.includes && classes.includes('image-collage-cell')) === true;
      let isCell = isCellByType || isCellByClass;

      // Fallback: detect DOM proximity to a collage cell
      if (!isCell) {
        try {
          const el = component.getEl && component.getEl();
          const nearestCell = el && el.closest ? el.closest('.image-collage-cell') : null;
          isCell = !!nearestCell;
        } catch (_) { /* ignore */ }
      }

      if (isCell) {
        // Determine if the cell already has an image
        let hasImage = false;
        try {
          // Prefer attribute flag set by AzureImagePlugin/selectImage
          const attrs = component.getAttributes ? component.getAttributes() : {};
          if (attrs && (attrs['data-has-image'] === 'true' || attrs['data-has-image'] === true)) {
            hasImage = true;
          } else {
            // Check inline style background-image
            const el = component.getEl && component.getEl();
            const bg = el && (el as HTMLElement).style && (el as HTMLElement).style.backgroundImage;
            if (bg && /url\(/i.test(bg)) hasImage = true;
          }
        } catch (_) { /* ignore */ }

        // Auto-open only for empty cells on selection
        if (!hasImage) {
          try {
            // Ensure this component is selected so the Azure plugin updates the correct target
            editor.select(component);
            // Open Azure explorer
            editor.runCommand && editor.runCommand('azure-image:open');
          } catch (e) {
            console.warn('[ImageCollage] Failed to open Azure image explorer on selection', e);
          }
        }
      }
    } catch (e) {
      console.warn('[ImageCollage] Error in selected handler:', e);
    }
  });

  // Also support opening the explorer on double-click for any collage cell (even if it already has an image)
  editor.on('component:dblclick', (component: any) => {
    try {
      if (!component || typeof component.get !== 'function') return;
      const classes = component.get('classes');
      const isCell = component.get('type') === 'image-collage-cell' || (classes && classes.includes && classes.includes('image-collage-cell'));
      if (!isCell) {
        // Check DOM ancestry
        try {
          const el = component.getEl && component.getEl();
          if (!el || !(el as HTMLElement).closest) return;
          if (!(el as HTMLElement).closest('.image-collage-cell')) return;
        } catch { return; }
      }

      try {
        editor.select(component);
      } catch { /* ignore */ }
      try {
        editor.runCommand && editor.runCommand('azure-image:open');
      } catch (e) {
        console.warn('[ImageCollage] Failed to open Azure image explorer on dblclick', e);
      }
    } catch (e) {
      console.warn('[ImageCollage] Error in dblclick handler:', e);
    }
  });

  // Add canvas event handlers to prevent dragging of text components
  editor.on('load', () => {
    const canvas = editor.Canvas;
    if (canvas && canvas.getBody) {
      const canvasBody = canvas.getBody();
      if (canvasBody) {
        // Prevent drag events on overlay text elements only, don't stop propagation
        canvasBody.addEventListener('dragstart', (e: any) => {
          // Only prevent drag if target is specifically overlay-text or its direct child
          const target = e.target;
          if (target && target.classList && target.classList.contains('overlay-text')) {
            e.preventDefault();
            // FIXED: Don't stop propagation to allow other components to work
            // e.stopPropagation();
            return false;
          }
          
          // Check immediate parent only, not all ancestors
          const parent = target?.parentElement;
          if (parent && parent.classList && parent.classList.contains('overlay-text')) {
            e.preventDefault();
            // FIXED: Don't stop propagation to allow other components to work
            // e.stopPropagation();
            return false;
          }
        }, true);

        canvasBody.addEventListener('drag', (e: any) => {
          const target = e.target;
          if (target && target.classList && target.classList.contains('overlay-text')) {
            e.preventDefault();
            // FIXED: Don't stop propagation to allow other components to work
            // e.stopPropagation();
            return false;
          }
        }, true);
      }
    }
  });

  // Add block to sidebar
  editor.BlockManager.add('image-collage', {
     label: "ImageCollage",
  media: `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
         xmlns="http://www.w3.org/2000/svg">
      <!-- Big left image -->
      <rect x="3" y="3" width="10" height="18" rx="1" fill="#080808ff" stroke="#666"/>
      <!-- Top-right small image -->
      <rect x="15" y="3" width="6" height="8" rx="1" fill="#080808ff" stroke="#999"/>
      <!-- Bottom-right small image -->
      <rect x="15" y="13" width="6" height="8" rx="1" fill="#080808ff" stroke="#999"/>
    </svg>
  `,
    category: 'Layout',
    content: {
      type: 'image-collage-wrapper'
    }
  });
}

export default imageCollagePlugin;