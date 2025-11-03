import { Editor } from "grapesjs";

function injectCustomTableStyles(editor: Editor) {
        const CSS_ID = 'gjs-custom-table-styles';
        // Inject modal styles for table modals (simple, wide inputs, plain buttons)
        const MODAL_CSS_ID = 'gjs-table-modal-styles';
        if (!document.getElementById(MODAL_CSS_ID)) {
            const style = document.createElement('style');
            style.id = MODAL_CSS_ID;
            style.textContent = `
                .gjs-table-modal { padding: 10px; min-width: 450px; }
                .gjs-table-modal label { display:block; font-weight:600; margin-bottom:8px; }
                .gjs-table-modal input[type="text"], .gjs-table-modal input[type="number"] { width:100%; padding:10px; border:1px solid #ddd; border-radius:3px; box-sizing:border-box; margin-bottom:16px; font-size:14px; }
                .gjs-table-modal .gjs-table-buttons { display:flex; justify-content:flex-end; gap:10px; margin-top:20px; }
                .gjs-table-modal button { padding:8px 16px; cursor:pointer; border:1px solid #ddd; border-radius:3px; background:#fff; font-size:14px; }
                .gjs-table-modal button:hover { background:#f5f5f5; }
            `;
            document.head.appendChild(style);
        }
        const css = `
            /* Force collapsed borders so 'hidden' suppresses neighbor seams */
            .gjs-custom-table { 
                border-collapse: collapse !important; 
                border-spacing: 0 !important; 
                width: 100% !important;
                table-layout: fixed !important;
            }

            /* Wrapper is completely invisible - just for scrolling */
            .gjs-custom-table-wrapper {
                overflow-x: auto !important;
                overflow-y: visible !important;
                width: 100% !important;
                max-width: 100% !important;
                position: relative !important;
                box-sizing: border-box !important;
                /* NO visual styling - completely transparent */
                /* padding and margin removed here so inline styles (from Traits/StyleManager) can apply */
                /* allow inline background/border styles to apply */
            }

            /* TABLE - No CSS border, just rely on GrapesJS component highlighting */
            .gjs-custom-table {
                /* Add padding around table so GrapesJS highlight border is more visible and clickable */
                padding: 12px !important;
                margin: 12px 0 !important;
                box-sizing: border-box !important;
                /* NO CSS border - let GrapesJS handle component highlighting */
            }

            /* Mobile responsive behavior */
            @media (max-width: 768px) {
                .gjs-custom-table {
                    min-width: 600px !important;
                }
                .gjs-custom-table td, .gjs-custom-table th {
                    min-width: 120px !important;
                    max-width: 200px !important;
                }
            }

            /* Base cell styles */
            .gjs-custom-table td,
            table.gjs-custom-table td,
            div .gjs-custom-table td,
            div table.gjs-custom-table td,
            .gjs-custom-table th,
            table.gjs-custom-table th,
            div .gjs-custom-table th,
            div table.gjs-custom-table th {
                word-wrap: break-word !important;
                word-break: break-word !important;
                white-space: normal !important;
                overflow-wrap: break-word !important;
                max-width: 200px;
                min-width: 100px;
                vertical-align: top;
            }

            /* Headers bold by default */
            .gjs-custom-table th,
            table.gjs-custom-table th {
                font-weight: bold;
            }

            /* GrapesJS selection styles for table cells - multiple selectors for different GrapesJS versions */
            .gjs-custom-table td.gjs-selected,
            .gjs-custom-table th.gjs-selected,
            table.gjs-custom-table td.gjs-selected,
            table.gjs-custom-table th.gjs-selected,
            .gjs-custom-table td[data-gjs-selected],
            .gjs-custom-table th[data-gjs-selected],
            .gjs-custom-table td.__gjs-selected__,
            .gjs-custom-table th.__gjs-selected__ {
                /* Keep selection outlines for accessibility but do not change background */
                outline: 2px solid #3b97e3 !important;
                outline-offset: -2px !important;
                box-shadow: 0 0 0 2px rgba(59, 151, 227, 0.3) !important;
            }

            /* Hover styles for better UX */
            .gjs-custom-table td:hover:not(.gjs-selected),
            table.gjs-custom-table td:hover:not(.gjs-selected) {
                /* No hover background for table cells */
                cursor: pointer;
            }

            /* No hover effects for headers */
            .gjs-custom-table th:hover:not(.gjs-selected),
            table.gjs-custom-table th:hover:not(.gjs-selected) {
                /* No hover styling - keep original appearance */
            }

            /* Selected header cells should show selection outline but preserve custom background */
            .gjs-custom-table th.gjs-selected,
            table.gjs-custom-table th.gjs-selected,
            .gjs-custom-table th[data-gjs-selected],
            .gjs-custom-table th.__gjs-selected__ {
                /* Only show outline for selected headers; do not override header background */
                outline: 2px solid #3b97e3 !important;
                outline-offset: -2px !important;
                box-shadow: 0 0 0 2px rgba(59, 151, 227, 0.3) !important;
            }

            /* Ensure GrapesJS badges and toolbar work properly */
            .gjs-custom-table td .gjs-badge,
            .gjs-custom-table th .gjs-badge,
            .gjs-custom-table td .gjs-toolbar,
            .gjs-custom-table th .gjs-toolbar {
                z-index: 10 !important;
            }

            /* Attribute-driven overrides applied to the cell itself */
            /* Individual border control using data attributes with OR logic for adjacent cells */
            /* Default: Start with all borders hidden */
            .gjs-custom-table td,
            .gjs-custom-table th,
            table.gjs-custom-table td,
            table.gjs-custom-table th {
                border-top-style: hidden !important;
                border-right-style: hidden !important;
                border-bottom-style: hidden !important;
                border-left-style: hidden !important;
            }

            /* Show specific borders when data attribute is "true" */
            /* Only control border-style with !important; allow inline width/color to override */
            .gjs-custom-table td[data-border-top="true"],
            .gjs-custom-table th[data-border-top="true"],
            table.gjs-custom-table td[data-border-top="true"],
            table.gjs-custom-table th[data-border-top="true"] {
                border-top-style: solid !important;
            }

            .gjs-custom-table td[data-border-right="true"],
            .gjs-custom-table th[data-border-right="true"],
            table.gjs-custom-table td[data-border-right="true"],
            table.gjs-custom-table th[data-border-right="true"] {
                border-right-style: solid !important;
            }

            .gjs-custom-table td[data-border-bottom="true"],
            .gjs-custom-table th[data-border-bottom="true"],
            table.gjs-custom-table td[data-border-bottom="true"],
            table.gjs-custom-table th[data-border-bottom="true"] {
                border-bottom-style: solid !important;
            }

            .gjs-custom-table td[data-border-left="true"],
            .gjs-custom-table th[data-border-left="true"],
            table.gjs-custom-table td[data-border-left="true"],
            table.gjs-custom-table th[data-border-left="true"] {
                border-left-style: solid !important;
            }

            /* NOTE: Removed ALL forced header/tbody border-hiding rules.
               Previously these rules prevented header bottom borders from showing
               because border-collapse causes adjacent cell borders to interact.
               Now all borders (header bottom, first row top, etc.) are controlled
               purely by inline styles from the Style Manager and data attributes. */
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

        // Inject immediately if possible
        try { injectInto(editor.Canvas.getDocument()); } catch { /* ignore */ }
        
        // Re-inject on frame load 
        try { 
            editor.on('canvas:frame:loaded', () => { 
                try { injectInto(editor.Canvas.getDocument()); } catch { /* ignore */ } 
            }); 
        } catch { /* ignore */ }
        
        // Also re-inject when components are loaded (for persistence)
        try {
            editor.on('load', () => {
                setTimeout(() => {
                    try { injectInto(editor.Canvas.getDocument()); } catch { /* ignore */ }
                }, 100);
            });
        } catch { /* ignore */ }

        // Add styles using multiple approaches to ensure they appear in preview
        try {
            // Method 1: Direct CSS string injection for reliable preview mode
            const cssManager = editor.Css;
            const cssRules = `
/* Custom Table Styles for Preview Mode */
.gjs-custom-table {
    border-collapse: collapse !important;
    border-spacing: 0 !important;
    width: 100% !important;
    table-layout: fixed !important;
}

.gjs-custom-table-wrapper {
    overflow-x: auto !important;
    width: 100% !important;
    box-sizing: border-box !important;
    /* NO border by default - exported HTML should control spacing; allow inline padding/margin to override */
}

.gjs-custom-table td, .gjs-custom-table th {
    word-wrap: break-word !important;
    white-space: normal !important;
    max-width: 200px;
    min-width: 100px;
    vertical-align: top;
    padding: 8px;
}

.gjs-custom-table th {
    background-color: #005594;
    font-weight: bold;
    text-align: left;
}

/* Allow wrapper/table-level color to override header text when explicitly set on wrapper/table */
.gjs-custom-table-wrapper[style*="color"] .gjs-custom-table th,
.gjs-custom-table[style*="color"] th {
    color: inherit !important;
}

/* Border control using data attributes - default all hidden */
.gjs-custom-table td,
.gjs-custom-table th {
    border-top-style: hidden !important;
    border-right-style: hidden !important;
    border-bottom-style: hidden !important;
    border-left-style: hidden !important;
}

/* Show specific borders when data attribute is "true" */
/* Only control border-style with !important; allow inline width/color to override */
.gjs-custom-table td[data-border-top="true"],
.gjs-custom-table th[data-border-top="true"] {
    border-top-style: solid !important;
}

.gjs-custom-table td[data-border-right="true"],
.gjs-custom-table th[data-border-right="true"] {
    border-right-style: solid !important;
}

.gjs-custom-table td[data-border-bottom="true"],
.gjs-custom-table th[data-border-bottom="true"] {
    border-bottom-style: solid !important;
}

.gjs-custom-table td[data-border-left="true"],
.gjs-custom-table th[data-border-left="true"] {
    border-left-style: solid !important;
}
`;

            cssManager.add(cssRules);
            
        } catch { /* ignore */ }

        // Method 2: Also use editor.addStyle for canvas injection
        try {
            editor.addStyle(css);
        } catch { /* ignore */ }
}

// Constants for formatting elements
const FORMATTING_TAGS = ['b', 'strong', 'i', 'em', 'u', 's', 'strike', 'span', 'a'];
const FORMATTING_SELECTOR = 'b, strong, i, em, u, s, strike, span[style], a';


export function customTablePlugin(editor: Editor) {
        console.log('[TablePlugin] Plugin initializing...');
        injectCustomTableStyles(editor);
        
        // Also ensure CSS is added after editor loads for preview mode
        editor.on('load', () => {
            setTimeout(() => injectCustomTableStyles(editor), 200);
        });
        
        // Add/remove preview class on table wrappers when entering/exiting preview
        editor.on('run:preview', () => {
            setTimeout(() => {
                const canvasDoc = editor.Canvas.getDocument();
                if (canvasDoc) {
                    // Add class to all wrappers in DOM
                    const wrappers = canvasDoc.querySelectorAll('.gjs-custom-table-wrapper');
                    wrappers.forEach((wrapper: Element) => {
                        wrapper.classList.add('preview-mode');
                        // FORCIBLY remove border styles from DOM element
                        const el = wrapper as HTMLElement;
                        el.style.border = 'none';
                        el.style.borderTop = 'none';
                        el.style.borderRight = 'none';
                        el.style.borderBottom = 'none';
                        el.style.borderLeft = 'none';
                        el.style.padding = '0';
                        el.style.margin = '0';
                        el.style.outline = 'none';
                        el.style.boxShadow = 'none';
                    });
                    
                    // Also add to wrapper components in GrapesJS model
                    const allComponents = editor.DomComponents.getWrapper()?.find('.gjs-custom-table-wrapper');
                    if (allComponents) {
                        allComponents.forEach((comp: any) => {
                            if (comp.addClass) {
                                comp.addClass('preview-mode');
                            }
                            // Remove border styles from component model too
                            if (comp.setStyle) {
                                comp.setStyle({
                                    border: 'none',
                                    padding: '0',
                                    margin: '0'
                                });
                            }
                        });
                    }
                }
                injectCustomTableStyles(editor);
            }, 100);
        });
        
        // Remove preview class when exiting preview mode
        editor.on('stop:preview', () => {
            setTimeout(() => {
                const canvasDoc = editor.Canvas.getDocument();
                if (canvasDoc) {
                    // Remove class from all wrappers in DOM
                    const wrappers = canvasDoc.querySelectorAll('.gjs-custom-table-wrapper');
                    wrappers.forEach((wrapper: Element) => {
                        wrapper.classList.remove('preview-mode');
                    });
                    
                    // Also remove from wrapper components in GrapesJS model
                    const allComponents = editor.DomComponents.getWrapper()?.find('.gjs-custom-table-wrapper');
                    if (allComponents) {
                        allComponents.forEach((comp: any) => {
                            if (comp.removeClass) {
                                comp.removeClass('preview-mode');
                            }
                        });
                    }
                }
                injectCustomTableStyles(editor);
            }, 100);
        });

        const bm = editor.BlockManager;
        const domc = editor.DomComponents;
        const css = editor.Css;
        const tm = editor.TraitManager;
        const BRAND_BLUE = "#005594";

        // Define a lightweight component type for formatting wrappers inside table cells
        try {
            domc.addType('table-formatting-wrapper', {
                isComponent: (el: any) => {
                    if (!el || !el.tagName) return false;
                    const tag = (el.tagName || '').toLowerCase();
                    const isWrapper = FORMATTING_TAGS.includes(tag);
                    const inTableCell = !!(el.closest && el.closest('td, th'));
                    return isWrapper && inTableCell ? { type: 'table-formatting-wrapper' } as any : false;
                },
                model: {
                    defaults: {
                        selectable: false,
                        draggable: false,
                        hoverable: false,
                        layerable: false,
                        copyable: false,
                        resizable: false,
                        editable: false,
                        toolbar: [],
                        traits: []
                    },
                },
                view: {
                    onRender() {
                        try {
                            const el = (this as any).el as HTMLElement | null;
                            if (!el) return;
                            el.style.pointerEvents = 'none';
                            el.style.userSelect = 'none';
                            el.removeAttribute && el.removeAttribute('data-gjs-type');
                            el.classList.add('gjs-wrapper-neutralized');
                        } catch { /* no-op */ }
                    },
                },
            });
        } catch { /* ignore registration errors (hot reload) */ }

        const registerApplyBorderStyle = () => {
            const tagOf = (m: any) => ((m?.get?.('tagName')) || '').toLowerCase();
            const resolveCell = (m: any) => {
                const t = tagOf(m);
                if (t === 'td' || t === 'th') return m;
                return (m?.closest && (m.closest('td') || m.closest('th'))) || null;
            };

            const ensureTableCollapsed = (cell: any) => {
                let cur = cell;
                while (cur) {
                    if (tagOf(cur) === 'table') {
                        const attrs = cur.getAttributes?.() || {};
                        const cls = (attrs.class || '').trim();
                        if (!/(^|\s)gjs-custom-table(\s|$)/.test(cls)) {
                            cur.addAttributes?.({ class: (cls ? cls + ' ' : '') + 'gjs-custom-table' });
                        }
                        try {
                            const tel = cur.getEl?.();
                            tel?.style?.setProperty('border-collapse', 'collapse', 'important');
                            tel?.style?.setProperty('border-spacing', '0', 'important');
                        } catch {
                            /*op*/
                        }
                        return cur;
                    }
                    cur = cur.parent && cur.parent();
                }
                return null;
            };

            // Setup RTE fixes to prevent draggable formatting components
            function setupRTEFixes(editor: Editor) {
                try {
                    const findTableCell = (component: any) => {
                        let cur = component;
                        while (cur) {
                            const tag = (cur.get && cur.get('tagName'))?.toLowerCase?.();
                            if (tag === 'td' || tag === 'th') return cur;
                            cur = cur.parent && cur.parent();
                        }
                        return null;
                    };

                    // Hook rte:disable to clean up after the native RTE finishes
                    (editor as any).on && (editor as any).on('rte:disable', (component: any) => {
                        try {
                            const cell = findTableCell(component);
                            if (cell) setTimeout(() => cleanupWrappersAtCell(cell), 20);
                        } catch (e) { void e; }
                    });

                } catch (err) {
                    console.warn('[TablePlugin] setupRTEFixes failed', err);
                }
            }

            // Shared helper: cleanup formatting wrappers inside a table cell
            function cleanupWrappersAtCell(cell: any) {
                if (!cell) return;
                try {
                    const el = cell.getEl && cell.getEl();
                    if (!el) return;

                    // Find formatting wrappers inside the cell
                    const wrappers = el.querySelectorAll(FORMATTING_SELECTOR);

                    const combined: any = {};
                    // If multiple wrappers exist, preserve formatting styles
                    if (wrappers && wrappers.length) {
                        wrappers.forEach((w: Element) => {
                            const t = w.tagName.toLowerCase();
                            const st = (w as HTMLElement).style;
                            if (t === 'b' || t === 'strong') combined.fontWeight = combined.fontWeight || '700';
                            if (t === 'i' || t === 'em') combined.fontStyle = combined.fontStyle || 'italic';
                            if (t === 'u') combined.textDecoration = (combined.textDecoration || '') + ' underline';
                            if (t === 's' || t === 'strike') combined.textDecoration = (combined.textDecoration || '') + ' line-through';
                            if (t === 'a') {
                                // Preserve link attributes
                                const href = (w as HTMLAnchorElement).href;
                                const target = (w as HTMLAnchorElement).target;
                                if (href) combined.href = href;
                                if (target) combined.target = target;
                                // Links often have color styling
                                if (!combined.color) combined.color = 'blue';
                                combined.textDecoration = (combined.textDecoration || '') + ' underline';
                            }
                            if (st) {
                                if (st.fontWeight) combined.fontWeight = st.fontWeight;
                                if (st.fontStyle) combined.fontStyle = st.fontStyle;
                                if (st.fontSize) combined.fontSize = st.fontSize;
                                if (st.fontFamily) combined.fontFamily = st.fontFamily;
                                if (st.color) combined.color = st.color;
                                if (st.backgroundColor) combined.backgroundColor = st.backgroundColor;
                                if (st.textDecoration) combined.textDecoration = st.textDecoration;
                            }
                        });
                    }

                    const text = (el.textContent || '').replace(/\s+/g, ' ').trim();

                    const hasStyling = Object.keys(combined).length > 0;
                    if (!hasStyling && (!wrappers || wrappers.length === 0)) {
                        return;
                    }

                    // Update model content first (normalize text nodes)
                    try {
                        cell.set && cell.set('content', text);
                        cell.view && typeof cell.view.render === 'function' && cell.view.render();
                    } catch { /* no-op */ }

                    // Apply combined styles to the cell element
                    setTimeout(() => {
                        try {
                            const freshEl = cell.getEl && cell.getEl();
                            if (freshEl && hasStyling) {
                                Object.keys(combined).forEach(prop => {
                                    if (prop === 'href' || prop === 'target') {
                                        // For links, we need to create an anchor tag or update cell content
                                        if (prop === 'href') {
                                            const currentContent = freshEl.innerHTML || text;
                                            const linkHtml = `<a href="${combined.href}"${combined.target ? ` target="${combined.target}"` : ''}>${text}</a>`;
                                            freshEl.innerHTML = linkHtml;
                                        }
                                    } else {
                                        // Apply CSS styles
                                        (freshEl as HTMLElement).style.setProperty(prop, combined[prop]);
                                    }
                                });
                            }
                        } catch { /* no-op */ }
                    }, 30);

                } catch (err) {
                    console.warn('[TablePlugin] cleanupWrappersAtCell failed', err);
                }
            }

            // Initialize the RTE fixes
            setupRTEFixes(editor);
        }; // End of registerApplyBorderStyle function

        // Register helper functions
        registerApplyBorderStyle();

    // Command to open border styling modal with toggle buttons
    editor.Commands.add('open-border-dropdown', {
        run(ed: any, sender: any, opts: any = {}) {
            const comp = opts.target || ed.getSelected();
            if (!comp) return;

            const modal = ed.Modal;
            const wrapper = document.createElement('div');
            wrapper.className = 'gjs-table-modal';

            // Get current border state
            const attrs = comp.getAttributes ? comp.getAttributes() : {};
            const borderTop = attrs['data-border-top'] === 'true';
            const borderRight = attrs['data-border-right'] === 'true';
            const borderBottom = attrs['data-border-bottom'] === 'true';
            const borderLeft = attrs['data-border-left'] === 'true';

            wrapper.innerHTML = `
                <div style="padding: 20px; min-width: 320px;">
                    <div style="margin-bottom:20px; font-weight:600; font-size:15px;">Border Options</div>
                    
                    <div style="display:flex; flex-direction:column; gap:12px; margin-bottom:20px;">
                        <div style="display:flex; align-items:center; justify-content:space-between;">
                            <span style="font-size:14px; flex:1;">All Borders</span>
                            <button class="border-toggle-btn" data-side="all" data-state="${borderTop && borderRight && borderBottom && borderLeft ? 'on' : 'off'}" 
                                style="background:${borderTop && borderRight && borderBottom && borderLeft ? '#0078d4' : '#005a9c'}; color:white; border:none; width:50px; min-width:50px; padding:6px 0; cursor:pointer; font-size:12px; border-radius:3px; text-align:center; font-weight:600;">
                                ${borderTop && borderRight && borderBottom && borderLeft ? 'ON' : 'OFF'}
                            </button>
                        </div>
                        <div style="display:flex; align-items:center; justify-content:space-between;">
                            <span style="font-size:14px; flex:1;">Top Border</span>
                            <button class="border-toggle-btn" data-side="top" data-state="${borderTop ? 'on' : 'off'}" 
                                style="background:${borderTop ? '#0078d4' : '#005a9c'}; color:white; border:none; width:50px; min-width:50px; padding:6px 0; cursor:pointer; font-size:12px; border-radius:3px; text-align:center; font-weight:600;">
                                ${borderTop ? 'ON' : 'OFF'}
                            </button>
                        </div>
                        <div style="display:flex; align-items:center; justify-content:space-between;">
                            <span style="font-size:14px; flex:1;">Right Border</span>
                            <button class="border-toggle-btn" data-side="right" data-state="${borderRight ? 'on' : 'off'}" 
                                style="background:${borderRight ? '#0078d4' : '#005a9c'}; color:white; border:none; width:50px; min-width:50px; padding:6px 0; cursor:pointer; font-size:12px; border-radius:3px; text-align:center; font-weight:600;">
                                ${borderRight ? 'ON' : 'OFF'}
                            </button>
                        </div>
                        <div style="display:flex; align-items:center; justify-content:space-between;">
                            <span style="font-size:14px; flex:1;">Bottom Border</span>
                            <button class="border-toggle-btn" data-side="bottom" data-state="${borderBottom ? 'on' : 'off'}" 
                                style="background:${borderBottom ? '#0078d4' : '#005a9c'}; color:white; border:none; width:50px; min-width:50px; padding:6px 0; cursor:pointer; font-size:12px; border-radius:3px; text-align:center; font-weight:600;">
                                ${borderBottom ? 'ON' : 'OFF'}
                            </button>
                        </div>
                        <div style="display:flex; align-items:center; justify-content:space-between;">
                            <span style="font-size:14px; flex:1;">Left Border</span>
                            <button class="border-toggle-btn" data-side="left" data-state="${borderLeft ? 'on' : 'off'}" 
                                style="background:${borderLeft ? '#0078d4' : '#005a9c'}; color:white; border:none; width:50px; min-width:50px; padding:6px 0; cursor:pointer; font-size:12px; border-radius:3px; text-align:center; font-weight:600;">
                                ${borderLeft ? 'ON' : 'OFF'}
                            </button>
                        </div>
                        <div style="display:flex; align-items:center; justify-content:space-between;">
                            <span style="font-size:14px; flex:1;">No Borders</span>
                            <button class="border-toggle-btn" data-side="none" data-state="${!borderTop && !borderRight && !borderBottom && !borderLeft ? 'on' : 'off'}" 
                                style="background:${!borderTop && !borderRight && !borderBottom && !borderLeft ? '#0078d4' : '#005a9c'}; color:white; border:none; width:50px; min-width:50px; padding:6px 0; cursor:pointer; font-size:12px; border-radius:3px; text-align:center; font-weight:600;">
                                ${!borderTop && !borderRight && !borderBottom && !borderLeft ? 'ON' : 'OFF'}
                            </button>
                        </div>
                    </div>

                    <div class="gjs-table-buttons">
                        <button id="border-apply">Apply</button>
                        <button id="border-cancel">Cancel</button>
                    </div>
                </div>
            `;

            modal.setTitle('Cell Borders');
            modal.setContent(wrapper);
            modal.open();

            // Track toggle state
            const state = {
                top: borderTop,
                right: borderRight,
                bottom: borderBottom,
                left: borderLeft
            };

            // Handle toggle button clicks
            wrapper.querySelectorAll('.border-toggle-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const target = e.currentTarget as HTMLButtonElement;
                    const side = target.getAttribute('data-side');
                    const currentState = target.getAttribute('data-state');

                    if (side === 'all') {
                        const newState = currentState === 'off';
                        state.top = newState;
                        state.right = newState;
                        state.bottom = newState;
                        state.left = newState;
                        
                        // Update all buttons
                        wrapper.querySelectorAll('.border-toggle-btn').forEach(b => {
                            const s = (b as HTMLButtonElement).getAttribute('data-side');
                            if (s === 'none') {
                                (b as HTMLButtonElement).setAttribute('data-state', newState ? 'off' : 'on');
                                (b as HTMLButtonElement).style.background = newState ? '#005a9c' : '#0078d4';
                                (b as HTMLButtonElement).textContent = newState ? 'OFF' : 'ON';
                            } else {
                                (b as HTMLButtonElement).setAttribute('data-state', newState ? 'on' : 'off');
                                (b as HTMLButtonElement).style.background = newState ? '#0078d4' : '#005a9c';
                                (b as HTMLButtonElement).textContent = newState ? 'ON' : 'OFF';
                            }
                        });
                    } else if (side === 'none') {
                        state.top = false;
                        state.right = false;
                        state.bottom = false;
                        state.left = false;
                        
                        // Update all buttons
                        wrapper.querySelectorAll('.border-toggle-btn').forEach(b => {
                            const s = (b as HTMLButtonElement).getAttribute('data-side');
                            if (s === 'none') {
                                (b as HTMLButtonElement).setAttribute('data-state', 'on');
                                (b as HTMLButtonElement).style.background = '#0078d4';
                                (b as HTMLButtonElement).textContent = 'ON';
                            } else {
                                (b as HTMLButtonElement).setAttribute('data-state', 'off');
                                (b as HTMLButtonElement).style.background = '#005a9c';
                                (b as HTMLButtonElement).textContent = 'OFF';
                            }
                        });
                    } else {
                        // Toggle individual side
                        const newState = currentState === 'off';
                        state[side as 'top' | 'right' | 'bottom' | 'left'] = newState;
                        target.setAttribute('data-state', newState ? 'on' : 'off');
                        target.style.background = newState ? '#0078d4' : '#005a9c';
                        target.textContent = newState ? 'ON' : 'OFF';

                        // Update 'All' button
                        const allBtn = wrapper.querySelector('.border-toggle-btn[data-side="all"]') as HTMLButtonElement;
                        if (allBtn && state.top && state.right && state.bottom && state.left) {
                            allBtn.setAttribute('data-state', 'on');
                            allBtn.style.background = '#0078d4';
                            allBtn.textContent = 'ON';
                        } else if (allBtn) {
                            allBtn.setAttribute('data-state', 'off');
                            allBtn.style.background = '#005a9c';
                            allBtn.textContent = 'OFF';
                        }

                        // Update 'None' button
                        const noneBtn = wrapper.querySelector('.border-toggle-btn[data-side="none"]') as HTMLButtonElement;
                        if (noneBtn && !state.top && !state.right && !state.bottom && !state.left) {
                            noneBtn.setAttribute('data-state', 'on');
                            noneBtn.style.background = '#0078d4';
                            noneBtn.textContent = 'ON';
                        } else if (noneBtn) {
                            noneBtn.setAttribute('data-state', 'off');
                            noneBtn.style.background = '#005a9c';
                            noneBtn.textContent = 'OFF';
                        }
                    }
                });
            });

            // Apply button
            const applyBtn = wrapper.querySelector('#border-apply');
            if (applyBtn) {
                applyBtn.addEventListener('click', () => {
                    const currentAttrs = comp.getAttributes ? comp.getAttributes() : {};
                    comp.setAttributes({
                        ...currentAttrs,
                        'data-border-top': state.top ? 'true' : 'false',
                        'data-border-right': state.right ? 'true' : 'false',
                        'data-border-bottom': state.bottom ? 'true' : 'false',
                        'data-border-left': state.left ? 'true' : 'false'
                    });
                    
                    // Force re-render
                    try {
                        comp.view && comp.view.render && comp.view.render();
                    } catch (e) { /* ignore */ }
                    
                    modal.close();
                });
            }

            // Cancel button
            const cancelBtn = wrapper.querySelector('#border-cancel');
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => modal.close());
            }
        }
    });

    // Prevent table-bound components from being dragged outside table cells
    try {
        editor.on && editor.on('component:drag:start', (data: any) => {
            try {
                if (!data || !data.target) return;
                const target = data.target;
                const attrs = (target.getAttributes && target.getAttributes()) || {};
                if (attrs && attrs['data-bound-to-table']) {
                    // Remember original parent and index to restore if drag ends outside
                    try {
                        const parent = target.parent && target.parent();
                        (target as any).__originalParent = parent;
                        if (parent && parent.components) {
                            const comps = parent.components();
                            (target as any).__originalIndex = typeof comps.indexOf === 'function' ? comps.indexOf(target) : -1;
                        }
                    } catch (_) { /*no-op*/ }
                }
            } catch (_) { /*no-op*/ }
        });

        editor.on && editor.on('component:drag:end', (data: any) => {
            try {
                if (!data || !data.target) return;
                const target = data.target;
                const attrs = (target.getAttributes && target.getAttributes()) || {};
                if (attrs && attrs['data-bound-to-table']) {
                    // Check if current parent chain contains a td or th; if not, restore
                    let cur = target.parent && target.parent();
                    let insideCell = false;
                    while (cur) {
                        try {
                            const tag = (cur.get && (cur.get('tagName') || '') || '').toLowerCase();
                            if (tag === 'td' || tag === 'th') { insideCell = true; break; }
                        } catch (_) { /*no-op*/ }
                        cur = cur.parent && cur.parent();
                    }
                    if (!insideCell) {
                        // restore
                        try {
                            const origParent = (target as any).__originalParent;
                            const origIndex = (target as any).__originalIndex;
                            if (origParent && origParent.components) {
                                // remove from current parent first
                                try { target.remove && target.remove(); } catch (_) { /*no-op*/ }
                                if (typeof origIndex === 'number' && origIndex >= 0) origParent.components().add(target, { at: origIndex });
                                else origParent.components().add(target);
                            }
                        } catch (_) { /*no-op*/ }
                    }
                    // Clean up temp markers
                    try { delete (target as any).__originalParent; delete (target as any).__originalIndex; } catch (_) { /*no-op*/ }
                }
            } catch (_) { /*no-op*/ }
        });

        // Listen for component removal - if user deletes all cells, remove entire table
        editor.on && editor.on('component:remove', (removedComp: any) => {
            try {
                if (!removedComp) return;
                
                // Check if removed component is a cell (td or th)
                const tagName = removedComp.get && (removedComp.get('tagName') || '').toLowerCase();
                if (tagName !== 'td' && tagName !== 'th') return;
                
                // Find the parent table
                let cur = removedComp.parent && removedComp.parent();
                let tableModel: any = null;
                while (cur) {
                    const tag = cur.get && (cur.get('tagName') || '').toLowerCase();
                    if (tag === 'table') {
                        tableModel = cur;
                        break;
                    }
                    cur = cur.parent && cur.parent();
                }
                
                if (!tableModel) return;
                
                // Check if table has any remaining cells
                setTimeout(() => {
                    try {
                        const allCells: any[] = [];
                        const collectCells = (component: any) => {
                            try {
                                if (!component) return;
                                const tag = (component.get && (component.get('tagName') || '')) || '';
                                if (tag.toLowerCase() === 'td' || tag.toLowerCase() === 'th') {
                                    allCells.push(component);
                                }
                                if (component.components) {
                                    const children = component.components();
                                    if (children && children.forEach) {
                                        children.forEach((child: any) => collectCells(child));
                                    }
                                }
                            } catch (e) { /* ignore */ }
                        };
                        
                        collectCells(tableModel);
                        
                        // If no cells remain, delete the entire table wrapper
                        if (allCells.length === 0) {
                            // Find the wrapper
                            let wrapper = tableModel.parent && tableModel.parent();
                            if (wrapper && wrapper.get && wrapper.get('type') === 'custom-table-wrapper') {
                                wrapper.remove && wrapper.remove();
                                console.log('[TablePlugin] Removed empty table wrapper');
                            } else {
                                // If no wrapper, just remove the table
                                tableModel.remove && tableModel.remove();
                                console.log('[TablePlugin] Removed empty table');
                            }
                        }
                    } catch (e) {
                        console.warn('[TablePlugin] Failed to check for empty table', e);
                    }
                }, 50); // Small delay to ensure removal is complete
                
            } catch (e) { /* no-op */ }
        });
    } catch (e) { /*no-op*/ }
 
    // Command to add a new row to the selected table
    editor.Commands.add("add-table-row", {
        run(ed: any, sender: any, opts: any = {}) {
            try {
                let comp = opts.target || ed.getSelected && ed.getSelected();
                if (!comp) return;
 
                // Find the table model
                const findTableModel = (m: any) => {
                    if (m && m.get && (m.get("tagName") || "").toLowerCase() === "table") return m;
                    if (m && m.find) {
                        const found = m.find("table");
                        if (found && found[0]) return found[0];
                    }
                    let cur = m;
                    while (cur) {
                        if (cur.get && (cur.get("tagName") || "").toLowerCase() === "table") return cur;
                        cur = cur.parent && cur.parent();
                    }
                    return null;
                };
 
                const tableModel = findTableModel(comp);
                if (!tableModel) return;
 
                // Get tbody component (not DOM)
                const tbodyComp = tableModel.components().filter((c: any) => c.get("tagName") === "tbody")[0];
                let colCount = 3;
 
                // Try to get column count from thead or first row
                const theadComp = tableModel.components().filter((c: any) => c.get("tagName") === "thead")[0];
                if (theadComp) {
                    const thRow = theadComp.components().filter((c: any) => c.get("tagName") === "tr")[0];
                    if (thRow) colCount = thRow.components().length;
                }
                if (!colCount && tbodyComp) {
                    const firstRow = tbodyComp.components().filter((c: any) => c.get("tagName") === "tr")[0];
                    if (firstRow) colCount = firstRow.components().length;
                }
 

                const cellsHtml = Array.from({ length: colCount }, (_, i) => 
                    `<td data-gjs-type="custom-cell" style="padding:8px; text-align:left; border:1px solid #202020; word-wrap:break-word; max-width:200px; min-width:100px; vertical-align:top;">New Cell ${i + 1}</td>`
                ).join('');
                
                const newRow = {
                    tagName: 'tr',
                    type: 'custom-row',
                    components: cellsHtml
                };
 
                // Show improved modal for position selection
                const modal = ed.Modal;
                const wrapper = document.createElement("div");
                wrapper.innerHTML = `
                    <div class="gjs-table-modal">
                        <div style="margin-bottom:20px; font-weight:600; font-size:15px;">Add New Row</div>
                        <button id="gjs-row-above" style="display:block; width:100%; margin-bottom:10px;"><i class="fa fa-arrow-up" style="margin-right:8px;"></i>Add Above Current Row</button>
                        <button id="gjs-row-below" style="display:block; width:100%; margin-bottom:10px;"><i class="fa fa-arrow-down" style="margin-right:8px;"></i>Add Below Current Row</button>
                        <div class="gjs-table-buttons">
                            <button id="gjs-row-cancel"><i class="fa fa-times" style="margin-right:6px;"></i>Cancel</button>
                        </div>
                    </div>
                `;
                modal.setTitle("Insert Row");
                modal.setContent(wrapper);
                modal.open();
 
                const addRow = (position: "above" | "below") => {
                    // Find the current row (tr)
                    let rowComp = comp;
                    if ((rowComp.get("tagName") || "").toLowerCase() !== "tr") {
                        rowComp = rowComp.closest && rowComp.closest("tr");
                    }
                    if (!rowComp || !tbodyComp) return;
 
                    const rows = tbodyComp.components();
                    const idx = rows.indexOf(rowComp);
 
                    if (idx === -1) return;
 
                    let addedRow;
                    if (position === "above") {
                        addedRow = tbodyComp.components().add(newRow, { at: idx });
                    } else {
                        addedRow = tbodyComp.components().add(newRow, { at: idx + 1 });
                    }
 
                    // Refresh only via the editor to avoid re-applying model defaults
                    try { ed.refresh && ed.refresh(); } catch { /* Non-critical */ }
                    
                    // Re-inject CSS to ensure new cells get proper styling
                    setTimeout(() => injectCustomTableStyles(ed), 100);
                   
                    // Select the newly added row to show its toolbar
                    const newRowComponent = Array.isArray(addedRow) ? addedRow[0] : addedRow;
                    if (newRowComponent) {
                        setTimeout(() => {
                            ed.select(newRowComponent);
                        }, 100);
                    } else {
                        ed.select(tableModel);
                    }
                   
                    ed.refresh && ed.refresh();
                };
 
                // Add hover effects to buttons
                const addHoverEffect = (btn: Element, hoverColor: string) => {
                    btn.addEventListener('mouseenter', () => {
                        (btn as HTMLElement).style.backgroundColor = hoverColor;
                    });
                    btn.addEventListener('mouseleave', () => {
                        (btn as HTMLElement).style.backgroundColor = btn.id === 'gjs-row-cancel' ? '#666' : '#007cba';
                    });
                };
 
                const aboveBtn = wrapper.querySelector("#gjs-row-above");
                const belowBtn = wrapper.querySelector("#gjs-row-below");
                const cancelBtn = wrapper.querySelector("#gjs-row-cancel");
 
                if (aboveBtn) {
                    addHoverEffect(aboveBtn, '#005a9c');
                    aboveBtn.addEventListener("click", () => {
                        addRow("above");
                        modal.close();
                    });
                }
 
                if (belowBtn) {
                    addHoverEffect(belowBtn, '#005a9c');
                    belowBtn.addEventListener("click", () => {
                        addRow("below");
                        modal.close();
                    });
                }
 
                if (cancelBtn) {
                    addHoverEffect(cancelBtn, '#555');
                    cancelBtn.addEventListener("click", () => {
                        modal.close();
                    });
                }
 
            } catch (err) {
                console.warn("[TablePlugin] Add Row failed", err);
            }
        },
    });
 
    // Command to open table editor for an existing table component
    editor.Commands.add("edit-table", {
        run(ed: any, sender: any, opts: any = {}) {
            try {
                let comp = opts.target || opts.component || ed.getSelected && ed.getSelected();
                if (!comp) return;

                // Helper: find the actual model which represents the <table>
                const findTableModel = (m: any) => {
                    try {
                        if (!m) return null;
                        if (m.get && (m.get("tagName") || "").toLowerCase() === "table") return m;
                        if (m.find) {
                            const found = m.find("table");
                            if (found && found[0]) return found[0];
                        }
                        let cur = m;
                        while (cur) {
                            if (cur.get && (cur.get("tagName") || "").toLowerCase() === "table") return cur;
                            cur = cur.parent && cur.parent();
                        }
                    } catch { /* no-op */ }
                    return null;
                };

                const tableComp = findTableModel(comp) || comp;
                if (!tableComp) return;

                // Read current rows/cols and existing contents
                let currentRows = 0;
                let currentCols = 0;
                let existingContent: string[][] = [];
                let existingHeader: string[] = [];
                try {
                    const tableModel = findTableModel(tableComp) || tableComp;
                    const el = tableModel.getEl && tableModel.getEl();
                    const tableEl = el && (el.tagName && el.tagName.toLowerCase() === "table" ? el : el.querySelector && el.querySelector("table"));
                    if (tableEl) {
                        const thead = tableEl.querySelector("thead");
                        const tbody = tableEl.querySelector("tbody");
                        if (thead) {
                            const ths = thead.querySelectorAll("tr:first-child th");
                            currentCols = ths.length || currentCols;
                            existingHeader = Array.from(ths).map((t: any) => t.textContent || "");
                        }
                        if (tbody) {
                            const rows = tbody.querySelectorAll("tr");
                            currentRows = rows.length;
                            existingContent = Array.from(rows).map((r: any) => Array.from(r.querySelectorAll("td")).map((c: any) => c.innerHTML || ""));
                            if (!currentCols && existingContent[0]) currentCols = existingContent[0].length;
                        }
                    }
                } catch { /* no-op */ }

                if (!currentRows) currentRows = 3;
                if (!currentCols) currentCols = 3;

                // Modal UI
                const modal = ed.Modal;
                const wrapper = document.createElement("div");
                wrapper.innerHTML = `
                    <div class="gjs-table-modal">
                        <label>Rows</label>
                        <input id="gjs-table-rows" type="number" min="1" max="50" value="${currentRows}">
                        <label>Columns</label>
                        <input id="gjs-table-cols" type="number" min="1" max="20" value="${currentCols}">
                        <div class="gjs-table-buttons">
                            <button id="gjs-table-update">Update Table</button>
                            <button id="gjs-table-cancel">Cancel</button>
                        </div>
                    </div>
                `;
                modal.setTitle("Edit Table");
                modal.setContent(wrapper);
                modal.open();

                const updateBtn = wrapper.querySelector("#gjs-table-update") as HTMLButtonElement | null;
                const cancelBtn = wrapper.querySelector("#gjs-table-cancel") as HTMLButtonElement | null;
                const rowsInput = wrapper.querySelector("#gjs-table-rows") as HTMLInputElement | null;
                const colsInput = wrapper.querySelector("#gjs-table-cols") as HTMLInputElement | null;

                if (cancelBtn) cancelBtn.addEventListener("click", () => modal.close());
                if (!updateBtn || !rowsInput || !colsInput) return;

                updateBtn.addEventListener("click", () => {
                    const r = Math.max(1, Math.min(50, parseInt(rowsInput.value || "0", 10) || 1));
                    const c = Math.max(1, Math.min(20, parseInt(colsInput.value || "0", 10) || 1));

                    const thCells: string[] = [];
                    for (let i = 0; i < c; i++) {
                        const txt = existingHeader[i] || `Header ${i + 1}`;
                        thCells.push(`<th data-gjs-type="custom-th" contenteditable="false" style="background-color: ${BRAND_BLUE}; padding:8px; text-align:left; border:none;">${txt}</th>`);
                    }

                    const bodyRows: string[] = [];
                    for (let ri = 0; ri < r; ri++) {
                        const cells: string[] = [];
                        for (let ci = 0; ci < c; ci++) {
                            const prevRaw = (existingContent[ri] && existingContent[ri][ci]);
                            const prev = (typeof prevRaw === "string" && prevRaw.trim() !== "") ? prevRaw : `Cell ${ri + 1}-${ci + 1}`;
                            cells.push(`<td data-gjs-type="custom-cell" style="padding:8px; text-align:left;">${prev}</td>`);
                        }
                        bodyRows.push(`<tr data-gjs-type="custom-row">${cells.join("")}</tr>`);
                    }

                    try {
                        const targetModel = findTableModel(tableComp) || tableComp;
                        if (targetModel && targetModel.components) {
                            const theadComponent = {
                                type: 'custom-thead',
                                tagName: 'thead',
                                components: [{
                                    type: 'custom-row',
                                    tagName: 'tr',
                                    components: thCells.map(thHtml => {
                                        const headerText = thHtml.match(/>([^<]*)</)?.[1] || 'Header';
                                        return {
                                            type: 'custom-th',
                                            tagName: 'th',
                                            content: headerText,
                                            attributes: {
                                                'data-gjs-type': 'custom-th',
                                                style: `background-color: ${BRAND_BLUE}; padding:8px; text-align:left; border:none;`
                                            }
                                        };
                                    })
                                }]
                            };

                            const tbodyComponent = {
                                type: 'tbody',
                                tagName: 'tbody',
                                components: []
                            };

                            for (let ri = 0; ri < r; ri++) {
                                const rowCells: any[] = [];
                                for (let ci = 0; ci < c; ci++) {
                                    const prevRaw = (existingContent[ri] && existingContent[ri][ci]);
                                    const prev = (typeof prevRaw === "string" && prevRaw.trim() !== "") ? prevRaw : `Cell ${ri + 1}-${ci + 1}`;
                                    rowCells.push({
                                        type: 'custom-cell',
                                        tagName: 'td',
                                        content: prev,
                                        attributes: { 'data-gjs-type': 'custom-cell' },
                                        style: { padding: '8px', textAlign: 'left' }
                                    });
                                }
                                (tbodyComponent.components as any[]).push({
                                    type: 'custom-row',
                                    tagName: 'tr',
                                    attributes: { 'data-gjs-type': 'custom-row' },
                                    components: rowCells
                                });
                            }

                            targetModel.components().reset([theadComponent, tbodyComponent]);
                            try {
                                targetModel.view && typeof targetModel.view.render === "function" && targetModel.view.render();
                                editor.select && editor.select(targetModel);
                            } catch (err) {
                                console.warn("[TablePlugin] Update failed", err);
                            }
                        }
                    } catch (err) {
                        console.warn("[TablePlugin] Update failed", err);
                    }

                    modal.close();
                });

            } catch (e) {
                /* no-op */
            }
        },
    });
 
   editor.Commands.add("select-row", {
    run(ed: any, sender: any, opts: any = {}) {
        const comp = opts.target || ed.getSelected();
        if (!comp) return;
 
        let row = comp;
        if ((row.get("tagName") || "").toLowerCase() !== "tr") {
            row = row.closest("tr") || row;
        }
 
        if (row) {
            ed.select(row);
        }
    }
});

    // Command to select entire column
    editor.Commands.add("select-column", {
        run(ed: any, sender: any, opts: any = {}) {
            try {
                const comp = opts.target || ed.getSelected();
                if (!comp) {
                    console.warn('[TablePlugin] No component selected');
                    return;
                }

                // Find cell (td or th)
                let cell = comp;
                const cellTag = (cell.get && (cell.get('tagName') || '').toLowerCase()) || '';
                if (cellTag !== 'td' && cellTag !== 'th') {
                    cell = cell.closest && (cell.closest('td') || cell.closest('th'));
                }
                if (!cell) {
                    console.warn('[TablePlugin] Could not find cell');
                    return;
                }

                // Find table
                let tableModel: any = null;
                let cur = cell;
                while (cur) {
                    const tag = (cur.get && (cur.get('tagName') || '').toLowerCase()) || '';
                    if (tag === 'table') {
                        tableModel = cur;
                        break;
                    }
                    cur = cur.parent && cur.parent();
                }
                if (!tableModel) {
                    console.warn('[TablePlugin] Could not find table');
                    return;
                }

                // Get column index - try multiple methods
                let colIndex = -1;
                try {
                    const rowModel = cell.closest && cell.closest('tr');
                    if (rowModel) {
                        const comps = rowModel.components();
                        // Try array-like access
                        if (comps && comps.models) {
                            colIndex = comps.models.indexOf(cell);
                        } else if (Array.isArray(comps)) {
                            colIndex = comps.indexOf(cell);
                        } else if (comps && comps.indexOf) {
                            colIndex = comps.indexOf(cell);
                        }
                        
                        // Fallback: iterate to find index
                        if (colIndex === -1 && comps) {
                            let idx = 0;
                            comps.forEach((c: any) => {
                                if (c === cell) colIndex = idx;
                                idx++;
                            });
                        }
                    }
                } catch (err) {
                    console.warn('[TablePlugin] Error getting column index', err);
                }

                if (colIndex === -1) {
                    console.warn('[TablePlugin] Could not determine column index');
                    colIndex = 0; // Default to first column
                }

                console.log('[TablePlugin] Column index:', colIndex);

                // Collect all cells in this column
                const columnCells: any[] = [];
                
                // Get header cell if exists
                const thead = tableModel.components().filter((c: any) => c.get && (c.get('tagName') || '').toLowerCase() === 'thead')[0];
                if (thead) {
                    const headerRow = thead.components().filter((c: any) => c.get && (c.get('tagName') || '').toLowerCase() === 'tr')[0];
                    if (headerRow) {
                        const headerCells = headerRow.components();
                        let headerCell = null;
                        if (headerCells && headerCells.models && headerCells.models[colIndex]) {
                            headerCell = headerCells.models[colIndex];
                        } else if (Array.isArray(headerCells) && headerCells[colIndex]) {
                            headerCell = headerCells[colIndex];
                        } else if (headerCells && typeof headerCells.at === 'function') {
                            headerCell = headerCells.at(colIndex);
                        }
                        if (headerCell) {
                            columnCells.push(headerCell);
                        }
                    }
                }

                // Get all body cells in this column
                const tbody = tableModel.components().filter((c: any) => c.get && (c.get('tagName') || '').toLowerCase() === 'tbody')[0];
                if (tbody) {
                    tbody.components().forEach((row: any) => {
                        if (row.get && (row.get('tagName') || '').toLowerCase() === 'tr') {
                            const cells = row.components();
                            let bodyCell = null;
                            if (cells && cells.models && cells.models[colIndex]) {
                                bodyCell = cells.models[colIndex];
                            } else if (Array.isArray(cells) && cells[colIndex]) {
                                bodyCell = cells[colIndex];
                            } else if (cells && typeof cells.at === 'function') {
                                bodyCell = cells.at(colIndex);
                            }
                            if (bodyCell) {
                                columnCells.push(bodyCell);
                            }
                        }
                    });
                }

                console.log('[TablePlugin] Selected cells:', columnCells.length);

                // Select all cells in column
                if (columnCells.length > 0) {
                    ed.select(columnCells);
                } else {
                    console.warn('[TablePlugin] No cells found in column');
                }
            } catch (e) {
                console.error('[TablePlugin] Select column failed', e);
            }
        }
    });
 
    // Command to remove header from table
    editor.Commands.add('remove-table-header', {
        run(ed: any, sender: any, opts: any = {}) {
            try {
                const comp = opts.target || ed.getSelected();
                if (!comp) return;

                // Find the table model (search both up parent chain and down in children)
                const findTableModel = (m: any) => {
                    if (!m) return null;
                    if (m.get && (m.get("tagName") || "").toLowerCase() === "table") return m;
                    // Search in children first (for wrapper case)
                    if (m.find) {
                        const found = m.find("table");
                        if (found && found[0]) return found[0];
                    }
                    // Then search in parent chain
                    if (m.closest) return m.closest("table");
                    let cur = m;
                    while (cur) {
                        if (cur.get && (cur.get("tagName") || "").toLowerCase() === "table") return cur;
                        cur = cur.parent && cur.parent();
                    }
                    return null;
                };

                const tableModel = findTableModel(comp);
                if (!tableModel) return;

                // Find and remove thead
                const thead = tableModel.components().filter((c: any) => c.get && (c.get('tagName') || '').toLowerCase() === 'thead')[0];
                if (thead) {
                    thead.remove();
                    // Trigger view refresh to apply CSS changes
                    try { 
                        tableModel.view && tableModel.view.render && tableModel.view.render();
                        ed.refresh && ed.refresh();
                    } catch { /* non-critical */ }
                }
            } catch (e) {
                console.warn('[TablePlugin] Remove header failed', e);
            }
        }
    });

    // Command to add/restore table header
    editor.Commands.add('add-table-header', {
        run(ed: any, sender: any, opts: any = {}) {
            try {
                const comp = opts.target || ed.getSelected();
                if (!comp) return;

                // Find the table model (search both up parent chain and down in children)
                const findTableModel = (m: any) => {
                    if (!m) return null;
                    if (m.get && (m.get("tagName") || "").toLowerCase() === "table") return m;
                    // Search in children first (for wrapper case)
                    if (m.find) {
                        const found = m.find("table");
                        if (found && found[0]) return found[0];
                    }
                    // Then search in parent chain
                    if (m.closest) return m.closest("table");
                    let cur = m;
                    while (cur) {
                        if (cur.get && (cur.get("tagName") || "").toLowerCase() === "table") return cur;
                        cur = cur.parent && cur.parent();
                    }
                    return null;
                };

                const tableModel = findTableModel(comp);
                if (!tableModel) return;

                // Check if thead already exists
                let thead = tableModel.components().filter((c: any) => c.get && (c.get('tagName') || '').toLowerCase() === 'thead')[0];
                
                // Determine number of columns from tbody
                let colCount = 0;
                const tbody = tableModel.components().filter((c: any) => c.get && (c.get('tagName') || '').toLowerCase() === 'tbody')[0];
                if (tbody) {
                    const firstRow = tbody.components().filter((c: any) => c.get && (c.get('tagName') || '').toLowerCase() === 'tr')[0];
                    if (firstRow) {
                        colCount = firstRow.components().length;
                    }
                }
                if (!colCount) colCount = 3; // Default fallback

                if (!thead) {
                    // Create new thead with header row
                    const headerCells: any[] = [];
                    for (let i = 0; i < colCount; i++) {
                        // Create header cell using the component's style object (not attributes.style string)
                        // so later calls to setStyle() merge properly and do not wipe background color.
                        headerCells.push({
                            type: 'custom-th',
                            tagName: 'th',
                            // Use a text component inside so RTE and selection work normally
                            components: [{ type: 'text', content: `Header ${i + 1}` }],
                            attributes: {
                                'data-gjs-type': 'custom-th',
                                'data-border-top': 'true',
                                'data-border-right': 'true',
                                'data-border-bottom': 'true',
                                'data-border-left': 'true'
                            },
                            style: {
                                'background-color': BRAND_BLUE,
                                color: '#fff',
                                padding: '8px',
                                'text-align': 'left',
                                border: '1px solid #202020',
                                'word-wrap': 'break-word',
                                'max-width': '200px',
                                'min-width': '100px',
                                'font-weight': 'bold'
                            }
                        });
                    }

                    const theadComponent = {
                        type: 'custom-thead',
                        tagName: 'thead',
                        components: [{
                            type: 'custom-row',
                            tagName: 'tr',
                            components: headerCells
                        }]
                    };

                    // Insert thead at the beginning of the table (before tbody)
                    tableModel.components().add(theadComponent, { at: 0 });
                    
                    // Trigger view refresh
                    try { 
                        tableModel.view && tableModel.view.render && tableModel.view.render();
                        ed.refresh && ed.refresh();
                    } catch { /* non-critical */ }
                } else {
                    // thead exists - ensure it has the correct number of header cells
                    const headerRow = thead.components().filter((c: any) => c.get && (c.get('tagName') || '').toLowerCase() === 'tr')[0];
                    if (headerRow) {
                        const existingHeaders = headerRow.components();
                        const existingCount = existingHeaders.length;
                        
                        if (existingCount < colCount) {
                            // Add missing header cells
                            for (let i = existingCount; i < colCount; i++) {
                                headerRow.components().add({
                                    type: 'custom-th',
                                    tagName: 'th',
                                    components: [{ type: 'text', content: `Header ${i + 1}` }],
                                    attributes: {
                                        'data-gjs-type': 'custom-th',
                                        'data-border-top': 'true',
                                        'data-border-right': 'true',
                                        'data-border-bottom': 'true',
                                        'data-border-left': 'true'
                                    },
                                    style: {
                                        'background-color': BRAND_BLUE,
                                        color: '#fff',
                                        padding: '8px',
                                        'text-align': 'left',
                                        border: '1px solid #202020',
                                        'word-wrap': 'break-word',
                                        'max-width': '200px',
                                        'min-width': '100px',
                                        'font-weight': 'bold'
                                    }
                                });
                            }
                            
                            try { 
                                tableModel.view && tableModel.view.render && tableModel.view.render();
                                ed.refresh && ed.refresh();
                            } catch { /* non-critical */ }
                        }
                    }
                }
            } catch (e) {
                console.warn('[TablePlugin] Add header failed', e);
            }
        }
    });

    // Command to select all cells in a table for bulk styling
    editor.Commands.add('select-all-cells', {
        run(ed: any, sender: any, opts: any = {}) {
            try {
                const comp = opts.target || ed.getSelected();
                if (!comp) return;

                // Find the table model (search both up parent chain and down in children)
                const findTableModel = (m: any) => {
                    if (!m) return null;
                    if (m.get && (m.get("tagName") || "").toLowerCase() === "table") return m;
                    // Search in children first (for wrapper case)
                    if (m.find) {
                        const found = m.find("table");
                        if (found && found[0]) return found[0];
                    }
                    // Then search in parent chain
                    if (m.closest) return m.closest("table");
                    let cur = m;
                    while (cur) {
                        if (cur.get && (cur.get("tagName") || "").toLowerCase() === "table") return cur;
                        cur = cur.parent && cur.parent();
                    }
                    return null;
                };

                const tableModel = findTableModel(comp);
                if (!tableModel) return;

                // Collect all td and th components from the table
                const allCells: any[] = [];
                
                const collectCells = (component: any) => {
                    try {
                        if (!component) return;
                        const tagName = (component.get && (component.get('tagName') || '')) || '';
                        if (tagName.toLowerCase() === 'td' || tagName.toLowerCase() === 'th') {
                            allCells.push(component);
                        }
                        // Recursively check children
                        if (component.components) {
                            const children = component.components();
                            if (children && children.forEach) {
                                children.forEach((child: any) => collectCells(child));
                            }
                        }
                    } catch (e) { /* ignore errors */ }
                };

                collectCells(tableModel);

                if (allCells.length > 0) {
                    // Select all cells - GrapesJS supports multiple selection
                    try {
                        ed.select(allCells);
                    } catch {
                        // Fallback: select first cell and show message
                        ed.select(allCells[0]);
                        console.log(`[TablePlugin] Selected ${allCells.length} cells for bulk editing`);
                    }
                }
            } catch (e) {
                console.warn('[TablePlugin] Select all cells failed', e);
            }
        }
    });

    // Command for table border options (remove interior borders, row borders, column borders)
    editor.Commands.add('table-border-options', {
        run(ed: any, sender: any, opts: any = {}) {
            try {
                const comp = opts.target || ed.getSelected();
                if (!comp) return;

                // Find the table model
                const findTableModel = (m: any) => {
                    if (!m) return null;
                    if (m.get && (m.get("tagName") || "").toLowerCase() === "table") return m;
                    if (m.find) {
                        const found = m.find("table");
                        if (found && found[0]) return found[0];
                    }
                    if (m.closest) return m.closest("table");
                    let cur = m;
                    while (cur) {
                        if (cur.get && (cur.get("tagName") || "").toLowerCase() === "table") return cur;
                        cur = cur.parent && cur.parent();
                    }
                    return null;
                };

                const tableModel = findTableModel(comp);
                if (!tableModel) return;

                // Detect current border state from first body cell
                const detectCurrentMode = () => {
                    const tbody = tableModel.components().filter((c: any) => c.get && (c.get('tagName') || '').toLowerCase() === 'tbody')[0];
                    if (!tbody) return 'all';
                    
                    const rows = tbody.components();
                    if (!rows || rows.length === 0) return 'all';
                    
                    const firstRow = rows.at ? rows.at(0) : rows[0];
                    if (!firstRow) return 'all';
                    
                    const cells = firstRow.components();
                    if (!cells || cells.length === 0) return 'all';
                    
                    const firstCell = cells.at ? cells.at(0) : cells[0];
                    if (!firstCell) return 'all';
                    
                    const attrs = firstCell.getAttributes ? firstCell.getAttributes() : {};
                    const top = attrs['data-border-top'] === 'true';
                    const right = attrs['data-border-right'] === 'true';
                    const bottom = attrs['data-border-bottom'] === 'true';
                    const left = attrs['data-border-left'] === 'true';
                    
                    // Detect pattern
                    if (!top && !right && !bottom && !left) return 'none';
                    if (top && right && bottom && left) return 'all';
                    if (top && bottom && !right && !left) {
                        // Check if it's outer mode (first cell has left border)
                        if (left) return 'outer';
                        return 'row';
                    }
                    if (!top && !bottom && left && right) {
                        // Check if it's outer mode (first cell has top border)
                        if (top) return 'outer';
                        return 'column';
                    }
                    
                    // Check for outer mode more carefully
                    const rowCount = rows.length;
                    const cellCount = cells.length;
                    if (top && left && !right && !bottom) return 'outer';
                    
                    return 'all'; // Default
                };

                const currentMode = detectCurrentMode();

                const modal = ed.Modal;
                const wrapper = document.createElement('div');
                wrapper.className = 'gjs-table-modal';
                
                // Helper to get button state
                const getBtnState = (mode: string) => mode === currentMode;
                const getBtnBg = (mode: string) => getBtnState(mode) ? '#0078d4' : '#005a9c';
                const getBtnText = (mode: string) => getBtnState(mode) ? 'ON' : 'OFF';
                
                wrapper.innerHTML = `
                    <div style="padding: 20px; min-width: 320px;">
                        <div style="margin-bottom:20px; font-weight:600; font-size:15px;">Apply Table Border</div>
                        
                        <div style="display:flex; flex-direction:column; gap:12px; margin-bottom:20px;">
                            <div style="display:flex; align-items:center; justify-content:space-between;">
                                <span style="font-size:14px; flex:1;">All Borders</span>
                                <button class="table-border-toggle-btn" data-mode="all" data-state="${getBtnState('all') ? 'on' : 'off'}" 
                                    style="background:${getBtnBg('all')}; color:white; border:none; width:50px; min-width:50px; padding:6px 0; cursor:pointer; font-size:12px; border-radius:3px; text-align:center; font-weight:600;">
                                    ${getBtnText('all')}
                                </button>
                            </div>
                            <div style="display:flex; align-items:center; justify-content:space-between;">
                                <span style="font-size:14px; flex:1;">Row Borders Only</span>
                                <button class="table-border-toggle-btn" data-mode="row" data-state="${getBtnState('row') ? 'on' : 'off'}" 
                                    style="background:${getBtnBg('row')}; color:white; border:none; width:50px; min-width:50px; padding:6px 0; cursor:pointer; font-size:12px; border-radius:3px; text-align:center; font-weight:600;">
                                    ${getBtnText('row')}
                                </button>
                            </div>
                            <div style="display:flex; align-items:center; justify-content:space-between;">
                                <span style="font-size:14px; flex:1;">Column Borders Only</span>
                                <button class="table-border-toggle-btn" data-mode="column" data-state="${getBtnState('column') ? 'on' : 'off'}" 
                                    style="background:${getBtnBg('column')}; color:white; border:none; width:50px; min-width:50px; padding:6px 0; cursor:pointer; font-size:12px; border-radius:3px; text-align:center; font-weight:600;">
                                    ${getBtnText('column')}
                                </button>
                            </div>
                            <div style="display:flex; align-items:center; justify-content:space-between;">
                                <span style="font-size:14px; flex:1;">Outer Borders Only</span>
                                <button class="table-border-toggle-btn" data-mode="outer" data-state="${getBtnState('outer') ? 'on' : 'off'}" 
                                    style="background:${getBtnBg('outer')}; color:white; border:none; width:50px; min-width:50px; padding:6px 0; cursor:pointer; font-size:12px; border-radius:3px; text-align:center; font-weight:600;">
                                    ${getBtnText('outer')}
                                </button>
                            </div>
                            <div style="display:flex; align-items:center; justify-content:space-between;">
                                <span style="font-size:14px; flex:1;">No Borders</span>
                                <button class="table-border-toggle-btn" data-mode="none" data-state="${getBtnState('none') ? 'on' : 'off'}" 
                                    style="background:${getBtnBg('none')}; color:white; border:none; width:50px; min-width:50px; padding:6px 0; cursor:pointer; font-size:12px; border-radius:3px; text-align:center; font-weight:600;">
                                    ${getBtnText('none')}
                                </button>
                            </div>
                        </div>

                        <div class="gjs-table-buttons">
                            <button id="table-border-apply">Apply</button>
                            <button id="table-border-cancel">Cancel</button>
                        </div>
                    </div>
                `;

                modal.setTitle('Apply Table Border');
                modal.setContent(wrapper);
                modal.open();

                // Track selected mode
                let selectedMode = currentMode;

                // Handle toggle button clicks - just update UI, don't apply yet
                wrapper.querySelectorAll('.table-border-toggle-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const target = e.currentTarget as HTMLButtonElement;
                        const mode = target.getAttribute('data-mode');
                        const currentState = target.getAttribute('data-state');
                        
                        // If clicking already-on button, toggle it off and reset to 'all'
                        if (currentState === 'on') {
                            selectedMode = 'all';
                        } else {
                            selectedMode = mode || 'all';
                        }
                        
                        // Update all buttons
                        wrapper.querySelectorAll('.table-border-toggle-btn').forEach(b => {
                            const bMode = (b as HTMLButtonElement).getAttribute('data-mode');
                            if (bMode === selectedMode) {
                                (b as HTMLButtonElement).setAttribute('data-state', 'on');
                                (b as HTMLButtonElement).style.background = '#0078d4';
                                (b as HTMLButtonElement).textContent = 'ON';
                            } else {
                                (b as HTMLButtonElement).setAttribute('data-state', 'off');
                                (b as HTMLButtonElement).style.background = '#005a9c';
                                (b as HTMLButtonElement).textContent = 'OFF';
                            }
                        });
                    });
                });

                // Apply button - applies the selected mode and closes modal
                const applyBtn = wrapper.querySelector('#table-border-apply');
                if (applyBtn) {
                    applyBtn.addEventListener('click', () => {
                        const tbody = tableModel.components().filter((c: any) => c.get && (c.get('tagName') || '').toLowerCase() === 'tbody')[0];
                        
                        if (tbody) {
                            const rows = tbody.components();
                            const rowCount = rows.length;
                            
                            rows.forEach((row: any, rowIndex: number) => {
                                if (row.get && (row.get('tagName') || '').toLowerCase() === 'tr') {
                                    const cells = row.components();
                                    const cellCount = cells.length;
                                    
                                    cells.forEach((cell: any, cellIndex: number) => {
                                        if (cell.get && (cell.get('tagName') || '').toLowerCase() === 'td') {
                                            try {
                                                const currentAttrs = cell.getAttributes ? cell.getAttributes() : {};
                                                let borderAttrs: any = {};
                                                
                                                // Determine which borders to show based on selected mode
                                                switch (selectedMode) {
                                                    case 'all':
                                                        borderAttrs = {
                                                            'data-border-top': 'true',
                                                            'data-border-right': 'true',
                                                            'data-border-bottom': 'true',
                                                            'data-border-left': 'true'
                                                        };
                                                        break;
                                                    
                                                    case 'row':
                                                        borderAttrs = {
                                                            'data-border-top': 'true',
                                                            'data-border-right': 'false',
                                                            'data-border-bottom': 'true',
                                                            'data-border-left': 'false'
                                                        };
                                                        if (cellIndex === 0) borderAttrs['data-border-left'] = 'true';
                                                        if (cellIndex === cellCount - 1) borderAttrs['data-border-right'] = 'true';
                                                        break;
                                                    
                                                    case 'column':
                                                        borderAttrs = {
                                                            'data-border-top': 'false',
                                                            'data-border-right': 'true',
                                                            'data-border-bottom': 'false',
                                                            'data-border-left': 'true'
                                                        };
                                                        if (rowIndex === 0) borderAttrs['data-border-top'] = 'true';
                                                        if (rowIndex === rowCount - 1) borderAttrs['data-border-bottom'] = 'true';
                                                        break;
                                                    
                                                    case 'outer':
                                                        borderAttrs = {
                                                            'data-border-top': rowIndex === 0 ? 'true' : 'false',
                                                            'data-border-right': cellIndex === cellCount - 1 ? 'true' : 'false',
                                                            'data-border-bottom': rowIndex === rowCount - 1 ? 'true' : 'false',
                                                            'data-border-left': cellIndex === 0 ? 'true' : 'false'
                                                        };
                                                        break;
                                                    
                                                    case 'none':
                                                        borderAttrs = {
                                                            'data-border-top': 'false',
                                                            'data-border-right': 'false',
                                                            'data-border-bottom': 'false',
                                                            'data-border-left': 'false'
                                                        };
                                                        break;
                                                }
                                                
                                                cell.setAttributes({
                                                    ...currentAttrs,
                                                    ...borderAttrs
                                                });
                                                
                                                // ALSO set inline styles directly for immediate visibility
                                                if (cell.setStyle) {
                                                    try {
                                                        const borderStyle = '1px solid #005594';
                                                        // Merge with existing styles to avoid wiping background-color or other styles
                                                        const existing = (cell.getStyle && cell.getStyle()) || (cell.get && cell.get('style')) || {};
                                                        const newStyles = Object.assign({}, existing, {
                                                            'border-top': borderAttrs['data-border-top'] === 'true' ? borderStyle : 'none',
                                                            'border-right': borderAttrs['data-border-right'] === 'true' ? borderStyle : 'none',
                                                            'border-bottom': borderAttrs['data-border-bottom'] === 'true' ? borderStyle : 'none',
                                                            'border-left': borderAttrs['data-border-left'] === 'true' ? borderStyle : 'none'
                                                        });
                                                        cell.setStyle(newStyles);
                                                    } catch (e) { /* ignore style merge failures */ }
                                                }
                                            } catch (e) {
                                                console.warn('Failed to set border attributes', e);
                                            }
                                        }
                                    });
                                }
                            });
                            
                            // Also process header cells if thead exists
                            const thead = tableModel.components().filter((c: any) => c.get && (c.get('tagName') || '').toLowerCase() === 'thead')[0];
                            if (thead) {
                                const headerRow = thead.components().filter((c: any) => c.get && (c.get('tagName') || '').toLowerCase() === 'tr')[0];
                                if (headerRow) {
                                    const headerCells = headerRow.components();
                                    const cellCount = headerCells.length;
                                    
                                    headerCells.forEach((cell: any, cellIndex: number) => {
                                        if (cell.get && (cell.get('tagName') || '').toLowerCase() === 'th') {
                                            try {
                                                const currentAttrs = cell.getAttributes ? cell.getAttributes() : {};
                                                let borderAttrs: any = {};
                                                
                                                // Determine which borders to show based on selected mode
                                                switch (selectedMode) {
                                                    case 'all':
                                                        borderAttrs = {
                                                            'data-border-top': 'true',
                                                            'data-border-right': 'true',
                                                            'data-border-bottom': 'true',
                                                            'data-border-left': 'true'
                                                        };
                                                        break;
                                                    
                                                    case 'row':
                                                        borderAttrs = {
                                                            'data-border-top': 'true',
                                                            'data-border-right': 'false',
                                                            'data-border-bottom': 'true',
                                                            'data-border-left': 'false'
                                                        };
                                                        if (cellIndex === 0) borderAttrs['data-border-left'] = 'true';
                                                        if (cellIndex === cellCount - 1) borderAttrs['data-border-right'] = 'true';
                                                        break;
                                                    
                                                    case 'column':
                                                        borderAttrs = {
                                                            'data-border-top': 'true', // Header is always top
                                                            'data-border-right': 'true',
                                                            'data-border-bottom': 'false',
                                                            'data-border-left': 'true'
                                                        };
                                                        break;
                                                    
                                                    case 'outer':
                                                        borderAttrs = {
                                                            'data-border-top': 'true', // Header is at top
                                                            'data-border-right': cellIndex === cellCount - 1 ? 'true' : 'false',
                                                            'data-border-bottom': 'false',
                                                            'data-border-left': cellIndex === 0 ? 'true' : 'false'
                                                        };
                                                        break;
                                                    
                                                    case 'none':
                                                        borderAttrs = {
                                                            'data-border-top': 'false',
                                                            'data-border-right': 'false',
                                                            'data-border-bottom': 'false',
                                                            'data-border-left': 'false'
                                                        };
                                                        break;
                                                }
                                                
                                                cell.setAttributes({
                                                    ...currentAttrs,
                                                    ...borderAttrs
                                                });
                                                
                                                // ALSO set inline styles directly for immediate visibility
                                                if (cell.setStyle) {
                                                    try {
                                                        const borderStyle = '1px solid #005594';
                                                        const existing = (cell.getStyle && cell.getStyle()) || (cell.get && cell.get('style')) || {};
                                                        const newStyles = Object.assign({}, existing, {
                                                            'border-top': borderAttrs['data-border-top'] === 'true' ? borderStyle : 'none',
                                                            'border-right': borderAttrs['data-border-right'] === 'true' ? borderStyle : 'none',
                                                            'border-bottom': borderAttrs['data-border-bottom'] === 'true' ? borderStyle : 'none',
                                                            'border-left': borderAttrs['data-border-left'] === 'true' ? borderStyle : 'none'
                                                        });
                                                        cell.setStyle(newStyles);
                                                    } catch (e) { /* ignore style merge failures */ }
                                                }
                                            } catch (e) {
                                                console.warn('Failed to set header border attributes', e);
                                            }
                                        }
                                    });
                                }
                            }
                            
                            // Force complete re-render of all cells to ensure borders show
                            try {
                                // Re-render each cell individually
                                tbody.components().forEach((row: any) => {
                                    if (row.components) {
                                        row.components().forEach((cell: any) => {
                                            if (cell.view && cell.view.render) {
                                                cell.view.render();
                                            }
                                        });
                                    }
                                    if (row.view && row.view.render) {
                                        row.view.render();
                                    }
                                });
                                
                                // Re-render table
                                if (tableModel.view && tableModel.view.render) {
                                    tableModel.view.render();
                                }
                                
                                // Force GrapesJS to re-inject styles into canvas
                                const canvas = ed.Canvas;
                                if (canvas) {
                                    const canvasDoc = canvas.getDocument();
                                    if (canvasDoc) {
                                        // Re-inject custom table styles
                                        injectCustomTableStyles(ed);
                                    }
                                }
                                
                                // Trigger editor refresh
                                if (ed.refresh) {
                                    ed.refresh();
                                }
                                
                                // CRITICAL: After re-render, forcibly remove wrapper border styles
                                // This prevents wrapper border from appearing after applying cell borders
                                setTimeout(() => {
                                    // Find the wrapper component
                                    let wrapperComp = tableModel.parent && tableModel.parent();
                                    while (wrapperComp) {
                                        if (wrapperComp.get && wrapperComp.get('classes') && 
                                            wrapperComp.get('classes').includes && 
                                            wrapperComp.get('classes').includes('gjs-custom-table-wrapper')) {
                                            break;
                                        }
                                        wrapperComp = wrapperComp.parent && wrapperComp.parent();
                                    }
                                    
                                    if (wrapperComp) {
                                        // Remove border styles from wrapper component model
                                        if (wrapperComp.setStyle) {
                                            wrapperComp.setStyle({
                                                border: '',
                                                borderTop: '',
                                                borderRight: '',
                                                borderBottom: '',
                                                borderLeft: '',
                                                padding: '',
                                                margin: ''
                                            });
                                        }
                                        
                                        // Also remove from DOM element if exists
                                        const wrapperEl = wrapperComp.getEl && wrapperComp.getEl();
                                        if (wrapperEl) {
                                            wrapperEl.style.removeProperty('border');
                                            wrapperEl.style.removeProperty('border-top');
                                            wrapperEl.style.removeProperty('border-right');
                                            wrapperEl.style.removeProperty('border-bottom');
                                            wrapperEl.style.removeProperty('border-left');
                                            wrapperEl.style.removeProperty('padding');
                                            wrapperEl.style.removeProperty('margin');
                                        }
                                    }
                                }, 50);
                            } catch (e) {
                                console.warn('Failed to refresh table', e);
                            }
                        }
                        
                        modal.close();
                    });
                }

                // Cancel button
                const cancelBtn = wrapper.querySelector('#table-border-cancel');
                if (cancelBtn) {
                    cancelBtn.addEventListener('click', () => modal.close());
                }

            } catch (e) {
                console.warn('[TablePlugin] Border options failed', e);
            }
        }
    });

    // Custom Row Type (TR) with full toolbar
    domc.addType('custom-row', {
        extend: 'row',
        isComponent: (el: HTMLElement) => {
            if (el.tagName === 'TR') return { type: 'custom-row' };
            return false;
        },
        model: {
            defaults: {
                tagName: 'tr',
                draggable: false,
                droppable: 'td',
                selectable: true,
                highlightable: true,
                toolbar: [
                    { attributes: { class: 'fa fa-arrow-up', title: 'Insert Row Above' }, command: 'insert-row-above' },
                    { attributes: { class: 'fa fa-arrow-down', title: 'Insert Row Below' }, command: 'insert-row-below' },
                    { attributes: { class: 'fa fa-trash', title: 'Remove Row' }, command: 'tlb-delete' }
                ]
            }
        }
    });
 
 
    editor.Commands.add("add-table-column", {
  run(ed: any, sender: any, opts: any = {}) {
    try {
      let comp = opts.target || ed.getSelected();
      if (!comp) return;
 
      // Find parent table
      const findTableModel = (m: any) => {
        if (!m) return null;
        if (m.get && (m.get("tagName") || "").toLowerCase() === "table") return m;
        if (m.closest) return m.closest("table");
        let cur = m;
        while (cur) {
          if (cur.get && (cur.get("tagName") || "").toLowerCase() === "table") return cur;
          cur = cur.parent && cur.parent();
        }
        return null;
      };
 
      const tableModel = findTableModel(comp);
      if (!tableModel) return;
 
      const tbody = tableModel.components().filter((c: any) => c.get("tagName") === "tbody")[0];
      if (!tbody) return;
 
            // Find the column index and whether the origin is a header (th) or a regular cell (td)
            // Helper to get column index robustly (model index first, then DOM fallback)
            let isHeader = false;
            let cell = comp;
            const tag = (cell && cell.get && (cell.get("tagName") || "") || "").toLowerCase();
            const getColIndex = (cellModel: any) => {
                try {
                    // try model-based index
                    const rowModel = cellModel && cellModel.closest && cellModel.closest('tr');
                    if (rowModel && rowModel.components) {
                        const comps = rowModel.components();
                        const idx = typeof comps.indexOf === 'function' ? comps.indexOf(cellModel) : -1;
                        if (idx >= 0) return idx;
                    }
                    // DOM fallback
                    const el = cellModel && cellModel.getEl && cellModel.getEl();
                    if (el && typeof el.cellIndex === 'number') return el.cellIndex;
                } catch (_) { /* no-op */ }
                return -1;
            };

            if (tag === 'th') {
                isHeader = true;
                // ensure we are working with model for header
                if (!(cell && cell.get && (cell.get('tagName') || '').toLowerCase() === 'th')) {
                    cell = cell && cell.closest && cell.closest('th');
                }
                if (!cell) return;
                const colIndex = getColIndex(cell);
                (cell as any).__colIndex = colIndex;
            } else {
                // resolve TD model
                if (tag !== 'td') {
                    cell = cell && cell.closest && cell.closest('td');
                }
                if (!cell) return;
                const colIndex = getColIndex(cell);
                (cell as any).__colIndex = colIndex;
            }
 
      // Modal popup
      const modal = ed.Modal;
            const wrapper = document.createElement("div");
            wrapper.innerHTML = `
                                <div class="gjs-table-modal">
                                    <div style="margin-bottom:20px; font-weight:600; font-size:15px;">Add New Column</div>
                                    <button id="gjs-col-left" style="display:block; width:100%; margin-bottom:10px;"><i class="fa fa-arrow-left" style="margin-right:8px;"></i>Add Left</button>
                                    <button id="gjs-col-right" style="display:block; width:100%; margin-bottom:10px;"><i class="fa fa-arrow-right" style="margin-right:8px;"></i>Add Right</button>
                                    <div class="gjs-table-buttons">
                                        <button id="gjs-col-cancel"><i class="fa fa-times" style="margin-right:6px;"></i>Cancel</button>
                                    </div>
                                </div>
      `;
      modal.setTitle("Insert Column");
      modal.setContent(wrapper);
      modal.open();
 
            const addColumn = (position: "left" | "right") => {
                    // Determine column index from the cell 
                    let computedIndex = (cell as any).__colIndex;
                    if (typeof computedIndex !== 'number' || computedIndex < 0) computedIndex = 0;
                    const atIndex = position === 'left' ? computedIndex : computedIndex + 1;

                    // Check if thead exists (do NOT auto-create if user removed it)
                    const thead = tableModel.components().filter((c: any) => c.get && (c.get('tagName') || '').toLowerCase() === 'thead')[0];

                    // Insert TD into every tbody row at atIndex with proper styling for preview mode
                    tbody.components().forEach((r: any) => {
                        r.components().add({
                            type: "custom-cell",
                            content: "New Cell",
                            style: {
                                'border': '1px solid #202020',
                                'padding': '8px',
                                'text-align': 'left',
                                'word-wrap': 'break-word',
                                'max-width': '200px',
                                'min-width': '100px',
                                'vertical-align': 'top'
                            }
                        }, { at: atIndex });
                    });

                    // Insert matching TH into thead at atIndex
                    if (thead) {
                        try {
                            const thRow = thead.components().filter((c: any) => c.get && (c.get('tagName') || '').toLowerCase() === 'tr')[0];
                            if (thRow) {
                                thRow.components().add({
                                    type: 'custom-th',
                                    content: 'Header',
                                    style: {
                                        'background-color': BRAND_BLUE,
                                        'color': '#fff',
                                        'border': '1px solid #202020',
                                        'padding': '8px',
                                        'text-align': 'left',
                                        'word-wrap': 'break-word',
                                        'max-width': '200px',
                                        'min-width': '100px',
                                        'font-weight': 'bold'
                                    }
                                }, { at: atIndex });
                            }
                        } catch (e) {
                            // DOM fallback
                            try {
                                const el = tableModel.getEl && tableModel.getEl();
                                if (el) {
                                    const headerRow = el.querySelector && el.querySelector('thead tr');
                                    if (headerRow) {
                                        const th = document.createElement('th');
                                        th.textContent = 'Header';
                                        th.setAttribute('style', `background-color: ${BRAND_BLUE}; padding:8px; text-align:left; border:none;`);
                                        th.setAttribute('data-gjs-type', 'custom-th');
                                        const ref = headerRow.children[computedIndex];
                                        if (position === 'left') headerRow.insertBefore(th, ref);
                                        else if (ref && ref.nextSibling) headerRow.insertBefore(th, ref.nextSibling);
                                        else headerRow.appendChild(th);
                                    }
                                }
                            } catch (_) { /* no-op */ }
                        }
                    }

                    try { editor.refresh && editor.refresh(); } catch { /* Non-critical */ }
                    
                    // Re-inject CSS to ensure new cells get proper styling
                    setTimeout(() => injectCustomTableStyles(editor), 100);
                    
                    modal.close();
                };

      wrapper.querySelector("#gjs-col-left")?.addEventListener("click", () => addColumn("left"));
      wrapper.querySelector("#gjs-col-right")?.addEventListener("click", () => addColumn("right"));
      wrapper.querySelector("#gjs-col-cancel")?.addEventListener("click", () => modal.close());
 
    } catch (err) {
      console.warn("[TablePlugin] Add Column failed", err);
    }
  }
});

    // Command to add/edit link on a single cell (TD)
    editor.Commands.add('add-cell-link', {
        run(ed: any, sender: any, opts: any = {}) {
            try {
                const comp = opts.target || ed.getSelected && ed.getSelected();
                if (!comp) return;

                // resolve to TD model if something inside was clicked
                let cell = comp;
                try {
                    if (!(cell && cell.get && (cell.get('tagName') || '').toLowerCase() === 'td')) {
                        cell = cell && cell.closest && cell.closest('td');
                    }
                } catch (_) { cell = null; }
                if (!cell) return;

                const el = cell.getEl && cell.getEl();
                // derive current text and existing href if present
                let currentText = '';
                let currentHref = '';
                try {
                    if (el) {
                        const a = el.querySelector && el.querySelector('a');
                        if (a) {
                            currentHref = a.getAttribute('href') || '';
                            currentText = a.textContent || '';
                        } else {
                            currentText = el.textContent || '';
                        }
                    } else {
                        const content = cell.get && cell.get('content');
                        if (typeof content === 'string') currentText = content.replace(/<[^>]*>/g, '').trim();
                    }
                } catch (_) { /* no-op */ }

                const modal = ed.Modal;
                const wrapper = document.createElement('div');
                wrapper.innerHTML = `
                    <div class="gjs-table-modal">
                        <label>Link (href)</label>
                        <input id="gjs-cell-link-input" type="text" placeholder="https://" value="${currentHref}">
                        <label>Link Text</label>
                        <input id="gjs-cell-link-text" type="text" value="${currentText}">
                        <div class="gjs-table-buttons">
                            <button id="gjs-cell-link-save">Save</button>
                            <button id="gjs-cell-link-cancel">Cancel</button>
                        </div>
                    </div>
                `;
                modal.setTitle('Insert Link');
                modal.setContent(wrapper);
                modal.open();

                const saveBtn = wrapper.querySelector('#gjs-cell-link-save');
                const cancelBtn = wrapper.querySelector('#gjs-cell-link-cancel');
                const inputEl = wrapper.querySelector('#gjs-cell-link-input') as HTMLInputElement | null;
                const textEl = wrapper.querySelector('#gjs-cell-link-text') as HTMLInputElement | null;

                const normalize = (u: string) => {
                    if (!u) return '';
                    if (/^https?:\/\//i.test(u)) return u;
                    if (/^www\./i.test(u)) return `https://${u}`;
                    if (u.indexOf('.') !== -1 && u.indexOf(' ') === -1) return `https://${u}`;
                    return u;
                };

                if (cancelBtn) cancelBtn.addEventListener('click', () => modal.close());

                if (saveBtn && inputEl && textEl) {
                    saveBtn.addEventListener('click', () => {
                        let url = (inputEl.value || '').trim();
                        const txt = (textEl.value || '').trim() || 'Link';
                        if (!url) return;
                        url = normalize(url);

                        try {
                            // Build anchor as a GrapesJS component and replace the cell's components
                            const anchorComp = {
                                type: 'link',
                                tagName: 'a',
                                content: txt,
                                // Prevent the link itself from being dragged/selected as a separate component
                                draggable: false,
                                selectable: false,
                                hoverable: false,
                                copyable: false,
                                editable: false,
                                attributes: {
                                    href: url,
                                    target: '_blank',
                                    rel: 'noopener noreferrer',
                                    style: 'display:inline; padding:0; margin:0; color:#007bff; text-decoration:underline; line-height:inherit;'
                                }
                            } as any;

                            if (cell && typeof cell.components === 'function') {
                                try {
                                    // Replace inner components with the anchor component
                                    cell.components().reset([anchorComp]);
                                } catch (_) {
                                    // Fallback to setting raw components/html
                                    try { cell.set && cell.set('components', `<a href="${url}" target="_blank" rel="noopener noreferrer" data-gjs-draggable="false" data-gjs-selectable="false" style="display:inline; padding:0; margin:0; color:#007bff; text-decoration:underline; line-height:inherit;">${txt}</a>`); } catch (_) { /*no-op*/ }
                                }

                                // mark attribute for later detection
                                try { cell.addAttributes && cell.addAttributes({ 'data-has-link': '1' }); } catch (_) { /*no-op*/ }

                                // Re-render the cell's view
                                try { cell.view && cell.view.render && cell.view.render(); } catch (_) { /*no-op*/ }
                            } else if (el) {
                                // Very rare fallback when model not available
                                el.innerHTML = `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color:#007bff;">${txt}</a>`;
                            }
                        } catch (e) { console.warn('[TablePlugin] apply link failed', e); }

                        try { modal.close(); } catch (_) { /*no-op*/ }
                    });
                }
            } catch (e) { console.warn('[TablePlugin] add-cell-link failed', e); }
        }
    });

    // Insert a row above the current row (no modal)
    editor.Commands.add('insert-row-above', {
        run(ed: any, sender: any, opts: any = {}) {
            try {
                const comp = opts.target || ed.getSelected && ed.getSelected();
                if (!comp) return;
                let rowComp = comp;
                if ((rowComp.get && (rowComp.get('tagName') || '').toLowerCase() !== 'tr')) {
                    // try to resolve
                    rowComp = rowComp && rowComp.closest && rowComp.closest('tr');
                }
                if (!rowComp) return;

                // find table and tbody
                let cur = rowComp;
                let tableModel: any = null;
                while (cur) {
                    if (cur.get && (cur.get('tagName') || '').toLowerCase() === 'table') { tableModel = cur; break; }
                    cur = cur.parent && cur.parent();
                }
                if (!tableModel) return;
                const tbody = tableModel.components().filter((c: any) => c.get && (c.get('tagName') || '').toLowerCase() === 'tbody')[0];
                if (!tbody) return;

                // determine columns
                let colCount = 0;
                const thead = tableModel.components().filter((c: any) => c.get && (c.get('tagName') || '').toLowerCase() === 'thead')[0];
                if (thead) {
                    const thRow = thead.components().filter((c: any) => c.get && (c.get('tagName') || '').toLowerCase() === 'tr')[0];
                    if (thRow) colCount = thRow.components().length;
                }
                if (!colCount) {
                    const firstRow = tbody.components().filter((c: any) => c.get && (c.get('tagName') || '').toLowerCase() === 'tr')[0];
                    if (firstRow) colCount = firstRow.components().length;
                }
                if (!colCount) colCount = 1;

                const rows = tbody.components();
                const idx = rows.indexOf(rowComp);
                const newRow = { 
                    type: 'custom-row', 
                    components: Array.from({ length: colCount }, (_, i) => ({ 
                        type: 'custom-cell', 
                        tagName: 'td', 
                        components: [{ type: 'text', content: `Cell ${i + 1}` }],
                        attributes: { 'data-gjs-type': 'custom-cell' }, 
                        style: { padding: '8px', textAlign: 'left', border: '1px solid #202020', wordWrap: 'break-word', maxWidth: '200px', minWidth: '100px' } 
                    })) 
                };
                tbody.components().add(newRow, { at: Math.max(0, idx) });
                try { ed.refresh && ed.refresh(); } catch { /* Non-critical */ }
                // Ensure the table view is re-rendered so injected table CSS applies to new cells immediately
                try { tableModel.view && tableModel.view.render && tableModel.view.render(); } catch (_) { /* non-critical */ }
                ed.select && ed.select(newRow);
            } catch (e) { /* no-op */ }
        }
    });

    // Insert a row below the current row (no modal)
    editor.Commands.add('insert-row-below', {
        run(ed: any, sender: any, opts: any = {}) {
            try {
                const comp = opts.target || ed.getSelected && ed.getSelected();
                if (!comp) return;
                let rowComp = comp;
                if ((rowComp.get && (rowComp.get('tagName') || '').toLowerCase() !== 'tr')) {
                    rowComp = rowComp && rowComp.closest && rowComp.closest('tr');
                }
                if (!rowComp) return;

                let cur = rowComp;
                let tableModel: any = null;
                while (cur) {
                    if (cur.get && (cur.get('tagName') || '').toLowerCase() === 'table') { tableModel = cur; break; }
                    cur = cur.parent && cur.parent();
                }
                if (!tableModel) return;
                const tbody = tableModel.components().filter((c: any) => c.get && (c.get('tagName') || '').toLowerCase() === 'tbody')[0];
                if (!tbody) return;

                let colCount = 0;
                const thead = tableModel.components().filter((c: any) => c.get && (c.get('tagName') || '').toLowerCase() === 'thead')[0];
                if (thead) {
                    const thRow = thead.components().filter((c: any) => c.get && (c.get('tagName') || '').toLowerCase() === 'tr')[0];
                    if (thRow) colCount = thRow.components().length;
                }
                if (!colCount) {
                    const firstRow = tbody.components().filter((c: any) => c.get && (c.get('tagName') || '').toLowerCase() === 'tr')[0];
                    if (firstRow) colCount = firstRow.components().length;
                }
                if (!colCount) colCount = 1;

                const rows = tbody.components();
                const idx = rows.indexOf(rowComp);
                const at = (idx === -1) ? undefined : idx + 1;
                const newRow = { 
                    type: 'custom-row', 
                    components: Array.from({ length: colCount }, (_, i) => ({ 
                        type: 'custom-cell', 
                        tagName: 'td', 
                        components: [{ type: 'text', content: `Cell ${i + 1}` }],
                        attributes: { 'data-gjs-type': 'custom-cell' }, 
                        style: { padding: '8px', textAlign: 'left', border: '1px solid #202020', wordWrap: 'break-word', maxWidth: '200px', minWidth: '100px' } 
                    })) 
                };
                tbody.components().add(newRow, (typeof at === 'number' ? { at } : undefined));
                // Re-render so inline styles and editor CSS apply immediately
                try { tableModel.view && tableModel.view.render && tableModel.view.render(); } catch (_) { /* non-critical */ }
                ed.select && ed.select(newRow);
            } catch (e) { /* no-op */ }
        }
    });

    // Insert a column to the left of the selected cell (no modal)
    editor.Commands.add('insert-column-left', {
        run(ed: any, sender: any, opts: any = {}) {
            try {
                const comp = opts.target || ed.getSelected && ed.getSelected();
                if (!comp) return;
                let cell = comp;
                try { if (!(cell && cell.get && (cell.get('tagName') || '').toLowerCase() === 'td' || (cell && cell.get && (cell.get('tagName') || '').toLowerCase() === 'th'))) cell = (cell && cell.closest && (cell.closest('td') || cell.closest('th'))); } catch (_) { cell = null; }
                if (!cell) return;

                // find table
                let cur = cell;
                let tableModel: any = null;
                while (cur) {
                    if (cur.get && (cur.get('tagName') || '').toLowerCase() === 'table') { tableModel = cur; break; }
                    cur = cur.parent && cur.parent();
                }
                if (!tableModel) return;

                const getColIndex = (cellModel: any) => {
                    try {
                        const rowModel = cellModel && cellModel.closest && cellModel.closest('tr');
                        if (rowModel && rowModel.components) {
                            const comps = rowModel.components();
                            const idx = typeof comps.indexOf === 'function' ? comps.indexOf(cellModel) : -1;
                            if (idx >= 0) return idx;
                        }
                        const el = cellModel && cellModel.getEl && cellModel.getEl();
                        if (el && typeof el.cellIndex === 'number') return el.cellIndex;
                    } catch (_) { /*no-op*/ }
                    return 0;
                };

                const colIndex = getColIndex(cell);
                const atIndex = colIndex;

                const tbody = tableModel.components().filter((c: any) => c.get && (c.get('tagName') || '').toLowerCase() === 'tbody')[0];
                if (!tbody) return;

                // Check if thead exists (do NOT auto-create if user removed it)
                let thead = tableModel.components().filter((c: any) => c.get && (c.get('tagName') || '').toLowerCase() === 'thead')[0];

                // insert new TDs in each tbody row with inline styles so borders render immediately
                tbody.components().forEach((r: any, rowIdx: number) => {
                    // All rows get uniform border styling (no special first-row handling)
                    const cellStyle: any = {
                        padding: '8px',
                        textAlign: 'left',
                        border: '1px solid #202020',
                        wordWrap: 'break-word',
                        maxWidth: '200px',
                        minWidth: '100px',
                        verticalAlign: 'top'
                    };
                    r.components().add({ 
                        type: 'custom-cell', 
                        components: [{ type: 'text', content: 'New Cell' }],
                        style: cellStyle 
                    }, { at: atIndex });
                });

                // insert TH in header row
                if (thead) {
                    try {
                        const thRow = thead.components().filter((c: any) => c.get && (c.get('tagName') || '').toLowerCase() === 'tr')[0];
                        if (thRow) {
                            // Use inline style string (attributes.style) to match insert-column-right behavior
                            thRow.components().add({ 
                                type: 'custom-th', 
                                components: [{ type: 'text', content: 'Header' }],
                                attributes: { style: `background-color: ${BRAND_BLUE}; padding:8px; text-align:left; border:none; word-wrap:break-word; max-width:200px; min-width:100px; font-weight:bold;` } 
                            }, { at: atIndex });
                        }
                    } catch (_) { /*no-op*/ }
                }

                tableModel.view && tableModel.view.render && tableModel.view.render();
            } catch (e) { /*no-op*/ }
        }
    });

    // Insert a column to the right of the selected cell (no modal)
    editor.Commands.add('insert-column-right', {
        run(ed: any, sender: any, opts: any = {}) {
            try {
                const comp = opts.target || ed.getSelected && ed.getSelected();
                if (!comp) return;
                let cell = comp;
                try { if (!(cell && cell.get && (cell.get('tagName') || '').toLowerCase() === 'td' || (cell && cell.get && (cell.get('tagName') || '').toLowerCase() === 'th'))) cell = (cell && cell.closest && (cell.closest('td') || cell.closest('th'))); } catch (_) { cell = null; }
                if (!cell) return;

                let cur = cell;
                let tableModel: any = null;
                while (cur) {
                    if (cur.get && (cur.get('tagName') || '').toLowerCase() === 'table') { tableModel = cur; break; }
                    cur = cur.parent && cur.parent();
                }
                if (!tableModel) return;

                const getColIndex = (cellModel: any) => {
                    try {
                        const rowModel = cellModel && cellModel.closest && cellModel.closest('tr');
                        if (rowModel && rowModel.components) {
                            const comps = rowModel.components();
                            const idx = typeof comps.indexOf === 'function' ? comps.indexOf(cellModel) : -1;
                            if (idx >= 0) return idx;
                        }
                        const el = cellModel && cellModel.getEl && cellModel.getEl();
                        if (el && typeof el.cellIndex === 'number') return el.cellIndex;
                    } catch (_) { /*no-op*/ }
                    return 0;
                };

                const colIndex = getColIndex(cell);
                const atIndex = colIndex + 1;

                const tbody = tableModel.components().filter((c: any) => c.get && (c.get('tagName') || '').toLowerCase() === 'tbody')[0];
                if (!tbody) return;

                // Check if thead exists (do NOT auto-create if user removed it)
                let thead = tableModel.components().filter((c: any) => c.get && (c.get('tagName') || '').toLowerCase() === 'thead')[0];

                tbody.components().forEach((r: any, rowIdx: number) => {
                    // All rows get uniform border styling (no special first-row handling)
                    const cellStyle: any = {
                        padding: '8px',
                        textAlign: 'left',
                        border: '1px solid #202020',
                        wordWrap: 'break-word',
                        maxWidth: '200px',
                        minWidth: '100px',
                        verticalAlign: 'top'
                    };
                    r.components().add({ 
                        type: 'custom-cell', 
                        components: [{ type: 'text', content: 'New Cell' }],
                        style: cellStyle 
                    }, { at: atIndex });
                });

                if (thead) {
                    try {
                        const thRow = thead.components().filter((c: any) => c.get && (c.get('tagName') || '').toLowerCase() === 'tr')[0];
                        if (thRow) {
                            thRow.components().add({ 
                                type: 'custom-th', 
                                components: [{ type: 'text', content: 'Header' }],
                                attributes: { style: `background-color: ${BRAND_BLUE}; padding:8px; text-align:left; border:none;` } 
                            }, { at: atIndex });
                        }
                    } catch (_) { /*no-op*/ }
                }                tableModel.view && tableModel.view.render && tableModel.view.render();
            } catch (e) { /*no-op*/ }
        }
    });
 
    // Custom Cell Type (TD) with full toolbar
    domc.addType('custom-cell', {
        extend: 'cell',
        isComponent: (el: HTMLElement) => {
            if (el.tagName === 'TD') return { type: 'custom-cell' };
            return false;
        },
        model: {
            defaults: {
                tagName: 'td',
                editable: false, 
                draggable: false,
                droppable: true, // Allow dropping components into cells
                selectable: true,
                highlightable: true,
                // RTE configuration to prevent nested components
                'custom-rte-disable': true,
                // Allow component nesting
                components: [],
                attributes: {
                    'data-border-top': 'true',
                    'data-border-right': 'true',
                    'data-border-bottom': 'true',
                    'data-border-left': 'true'
                },
                style: {
                    padding: '8px',
                    textAlign: 'left',
                    boxSizing: 'border-box',
                    wordWrap: 'break-word',
                    wordBreak: 'break-word',
                    whiteSpace: 'normal',
                    overflowWrap: 'break-word',
                    maxWidth: '200px',
                    minWidth: '100px',
                    verticalAlign: 'top'
                },
                traits: [
                    'background-color',
                    'color', 
                    'text-align',
                    'vertical-align',
                    'padding',
                    'margin',
                    'border-color',
                    'border-width',
                    'border-style',
                    'font-weight',
                    'font-size'
                ] as any,
                toolbar: [
                    { attributes: { class: 'fa fa-table', title: 'Select Entire Row' }, command: 'select-row' },
                    { attributes: { class: 'fa fa-plus-square', title: 'Add Header' }, command: 'add-table-header' },
                    { attributes: { class: 'fa fa-arrow-up', title: 'Insert Row Above' }, command: 'insert-row-above' },
                    { attributes: { class: 'fa fa-arrow-down', title: 'Insert Row Below' }, command: 'insert-row-below' },
                    { attributes: { class: 'fa fa-th-large', title: 'Border Options' }, command: 'open-border-dropdown' },
                    { attributes: { class: 'fa fa-link', title: 'Add/Edit Link' }, command: 'add-cell-link' },
                    { attributes: { class: 'fa fa-arrow-left', title: 'Insert Column Left' }, command: 'insert-column-left' },
                    { attributes: { class: 'fa fa-arrow-right', title: 'Insert Column Right' }, command: 'insert-column-right' },
                    { attributes: { class: 'fa fa-trash', title: 'Remove Row/Column' }, command: 'tlb-delete' }
                ]
            },
            init() {
                // Listen for style changes to handle border removal properly
                this.on('change:style', () => {
                    this.handleBorderChanges();
                });
                
                // Add double-click editing functionality
                this.on('component:mount', () => {
                    const el = this.getEl();
                    if (el) {
                        // Add double-click listener for editing
                        const doubleClickHandler = () => {
                            el.setAttribute('contenteditable', 'true');
                            el.focus();
                            
                            // Select all content
                            try {
                                const range = document.createRange();
                                range.selectNodeContents(el);
                                const selection = window.getSelection();
                                selection?.removeAllRanges();
                                selection?.addRange(range);
                            } catch { /* ignore selection errors */ }
                        };
                        el.addEventListener('dblclick', doubleClickHandler);
                        
                        // Add blur listener to stop editing
                        const blurHandler = () => {
                            el.setAttribute('contenteditable', 'false');
                            // Update component content
                            this.set('content', el.innerHTML);
                        };
                        el.addEventListener('blur', blurHandler);
                        
                        // Ensure contenteditable is false by default
                        el.setAttribute('contenteditable', 'false');
                    }
                });
            },
            handleBorderChanges() {
                try {
                    const style = this.get('style') || {};
                    const el = this.getEl();
                    if (!el) return;

                    // Remove existing border classes
                    el.classList.remove('no-border', 'no-top-border', 'no-right-border', 'no-bottom-border', 'no-left-border');

                    // Re-apply classes based on attributes (data-no-*) or stored border style
                    try {
                        const attrs = (this.getAttributes && this.getAttributes()) || {};
                        if (attrs['data-no-top']) el.classList.add('no-top-border');
                        if (attrs['data-no-right']) el.classList.add('no-right-border');
                        if (attrs['data-no-bottom']) el.classList.add('no-bottom-border');
                        if (attrs['data-no-left']) el.classList.add('no-left-border');
                        if (attrs['data-border-style'] === 'none') el.classList.add('no-border');
                    } catch (e) {
                        // Non-critical: ignore attribute read errors
                    }
                } catch (e) {
                    // Non-critical: ignore rendering errors
                }
            },
        },
        view: {
            onRender() {
                // Apply border handling on initial render
                setTimeout(() => {
                    if (this.model && (this.model as any).handleBorderChanges) {
                        (this.model as any).handleBorderChanges();
                    }
                }, 10);
            }
        }
    });

    // Custom Table Wrapper Component for responsive behavior
    domc.addType('custom-table-wrapper', {
        isComponent: (el: HTMLElement) => {
            if (el.classList && el.classList.contains('gjs-custom-table-wrapper')) {
                return { type: 'custom-table-wrapper' };
            }
            return false;
        },
        model: {
            defaults: {
                tagName: 'div',
                classes: ['gjs-custom-table-wrapper'],
                draggable: false,
                // Only allow a TABLE (or the specific table component) to be dropped into
                // the outer wrapper. This prevents arbitrary components being inserted
                // between the wrapper and the table itself.
                droppable: (el: any) => {
                    try {
                        if (!el) return false;

                        // If GrapesJS passes a component model
                        if (typeof el === 'object' && el.get) {
                            const tag = ((el.get('tagName') || '') + '').toLowerCase();
                            const type = ((el.get('type') || '') + '').toLowerCase();
                            const classes = el.get && (el.get('classes') || []);
                            // Accept true table components or those explicitly marked with our class
                            if (tag === 'table') return true;
                            if ((Array.isArray(classes) && classes.indexOf('gjs-custom-table') > -1)) return true;
                            if (type === 'gjs-custom-table' || type === 'custom-table') return true;
                        }

                        // If a DOM element is provided (e.g., when dragging raw HTML), accept if it contains a table
                        if (el.tagName && (el.tagName || '').toLowerCase() === 'table') return true;
                        if (el.querySelector && el.querySelector('table')) return true;
                    } catch (e) {
                        /* ignore */
                    }
                    return false;
                },
                selectable: true,
                highlightable: true,
                // NO inline styles - all styling via CSS classes only!
                // This prevents any inline styles from appearing in preview/export
                toolbar: [
                    { attributes: { class: 'fa fa-th', title: 'Select All Cells' }, command: 'select-all-cells' },
                    { attributes: { class: 'fa fa-plus-square', title: 'Add Header' }, command: 'add-table-header' },
                    { attributes: { class: 'fa fa-minus-square', title: 'Remove Header' }, command: 'remove-table-header' },
                    { attributes: { class: 'fa fa-edit', title: 'Edit Table' }, command: 'edit-table' },
                    { attributes: { class: 'fa fa-th-large', title: 'Table Border Options' }, command: 'table-border-options' },
                    { attributes: { class: 'fa fa-clone', title: 'Clone' }, command: 'tlb-clone' },
                    { attributes: { class: 'fa fa-trash', title: 'Delete' }, command: 'tlb-delete' }
                ],
                traits: [
                    'margin',
                    'padding',
                    // Allow editing wrapper background and border via Traits
                    'background-color',
                    'border-style',
                    'border-width',
                    'border-color'
                    // Removed border traits - they conflict with wrapper visibility logic
                    // Border should only be controlled by CSS, not inline styles
                ] as any
            },
            init() {
                // Sync wrapper background/border changes to the inner table so visual styles apply to the table itself
                this.on('change:style', () => {
                    try {
                        const style = this.getStyle();
                        if (!style) return;
                        
                        // Find the inner table component
                        const tableComp = this.find('.gjs-custom-table')[0];
                        if (!tableComp) return;
                        
                        // Copy background and border properties from wrapper to table
                        const tableStyle = tableComp.getStyle() || {};
                        const wrapperStyle = {...style};
                        let updated = false;
                        
                        if (style['background-color']) {
                            tableStyle['background-color'] = style['background-color'];
                            delete wrapperStyle['background-color']; // Remove from wrapper
                            updated = true;
                        }
                        if (style['border-style']) {
                            tableStyle['border-style'] = style['border-style'];
                            delete wrapperStyle['border-style']; // Remove from wrapper
                            updated = true;
                        }
                        if (style['border-width']) {
                            tableStyle['border-width'] = style['border-width'];
                            delete wrapperStyle['border-width']; // Remove from wrapper
                            updated = true;
                        }
                        if (style['border-color']) {
                            tableStyle['border-color'] = style['border-color'];
                            delete wrapperStyle['border-color']; // Remove from wrapper
                            updated = true;
                        }
                        if (style['border']) {
                            tableStyle['border'] = style['border'];
                            delete wrapperStyle['border']; // Remove from wrapper
                            updated = true;
                        }
                        
                        if (updated) {
                            tableComp.setStyle(tableStyle);
                            // Update wrapper style to remove background/border properties
                            this.setStyle(wrapperStyle);
                        }
                    } catch (e) {
                        /* ignore sync errors */
                    }
                });
            }
        },
        view: {
            onRender() {
                // Inject editor-only dashed border for wrapper visibility
                // This border will ONLY appear in the editor canvas, NOT in preview or export
                try {
                    const el = this.el;
                    if (!el) return;
                    
                    // Add a CSS class that we'll style via canvas-only CSS
                    el.classList.add('gjs-table-wrapper-editor-hint');
                    
                    // Inject CSS into canvas document (editor only)
                    const canvasDoc = this.em?.Canvas?.getDocument?.();
                    if (canvasDoc) {
                        const styleId = 'gjs-table-wrapper-editor-styles';
                        if (!canvasDoc.getElementById(styleId)) {
                            const style = canvasDoc.createElement('style');
                            style.id = styleId;
                            style.textContent = `
                                /* Editor-only wrapper hint: use GrapesJS-style dotted outline (non-blue hover)
                                   This CSS is injected into the canvas document and will not appear in preview/export */
                                .gjs-table-wrapper-editor-hint {
                                    outline: 2px dotted #999 !important;
                                    outline-offset: -2px !important;
                                    min-height: 50px !important;
                                }

                                /* Hide the outline during preview mode */
                                body.preview-mode .gjs-table-wrapper-editor-hint,
                                .preview-mode .gjs-table-wrapper-editor-hint {
                                    outline: none !important;
                                }
                            `;
                            (canvasDoc.head || canvasDoc.documentElement).appendChild(style);
                        }
                    }
                } catch (e) {
                    /* ignore rendering errors */
                }
            }
        }
    });

    // Custom TABLE component - makes the actual <table> element selectable with toolbar
    domc.addType('gjs-custom-table', {
        isComponent: (el: HTMLElement) => {
            if (el.tagName === 'TABLE' && el.classList && el.classList.contains('gjs-custom-table')) {
                return { type: 'gjs-custom-table' };
            }
            return false;
        },
        model: {
            defaults: {
                tagName: 'table',
                classes: ['gjs-custom-table'],
                draggable: false,
                droppable: true,
                // Make the table itself non-selectable so the wrapper is the primary selection target
                // This prevents default/double toolbars and ensures wrapper toolbar is used for whole-table actions
                selectable: false,
                highlightable: true,
                hoverable: true,
                // Add larger padding as model defaults (users should edit via wrapper traits/styles)
                style: {
                    padding: '12px',
                    margin: '12px 0'
                },
                // Keep table toolbar empty to avoid conflicts with wrapper toolbar
                toolbar: []
            },
            init() {
                // When table-level styles change (e.g., color/background applied to table or wrapper),
                // propagate relevant styles to header cells so header text/background match.
                this.on && this.on('change:style', () => {
                    try {
                        const style = this.getStyle ? this.getStyle() : (this.get && this.get('style')) || {};
                        if (!style) return;

                        const color = style['color'] || style.color || null;
                        const bg = style['background-color'] || style['backgroundColor'] || style['background'] || null;
                        if (!color && !bg) return;

                        // Try to find the THEAD component (custom-thead or plain thead)
                        let theadComp: any = null;
                        try {
                            const found = (this.find && this.find('custom-thead')) || [];
                            if (found && found.length > 0) theadComp = found[0];
                        } catch (_) { /* ignore */ }

                        if (!theadComp) {
                            try {
                                const found2 = (this.find && this.find('thead')) || [];
                                if (found2 && found2.length > 0) theadComp = found2[0];
                            } catch (_) { /* ignore */ }
                        }

                        if (!theadComp) return;

                        // Find header cells (custom-th or TH) inside the thead
                        let ths: any[] = [];
                        try { ths = (theadComp.find && theadComp.find('custom-th')) || []; } catch (_) { ths = []; }
                        if (!ths || ths.length === 0) {
                            try { ths = (theadComp.find && theadComp.find('th')) || []; } catch (_) { ths = []; }
                        }

                        if (!ths || ths.length === 0) return;

                        ths.forEach((th: any) => {
                            try {
                                const thStyle = th.getStyle ? (th.getStyle() || {}) : (th.get && th.get('style')) || {};
                                if (color) thStyle.color = color;
                                if (bg) thStyle['background-color'] = bg;
                                th.setStyle && th.setStyle(thStyle);
                                // Also update nested text components if any
                                try {
                                    const inner = th.find && (th.find('text') || th.find('[data-gjs-type="text"]')) || [];
                                    (inner || []).forEach((c: any) => { c.setStyle && c.setStyle({ color: color || thStyle.color }); });
                                } catch (_) { /* ignore */ }
                            } catch (_) { /* ignore */ }
                        });
                    } catch (_) { /* ignore */ }
                });
            }
        }
    });

    // Override wrapper toHTML to ensure NO wrapper styling in exported HTML
    domc.addType('custom-table-wrapper-export', {
        extend: 'custom-table-wrapper',
        model: {
            toHTML(opts: any) {
                // Get the wrapper element
                const el = this.getEl();
                if (el) {
                    // Temporarily remove all border/padding/margin styles
                    const oldBorder = el.style.border;
                    const oldPadding = el.style.padding;
                    const oldMargin = el.style.margin;
                    
                    el.style.border = 'none';
                    el.style.padding = '0';
                    el.style.margin = '0';
                    
                    // Get HTML
                    const html = (this.constructor as any).prototype.toHTML.call(this, opts);
                    
                    // Restore (in case we're still in editor)
                    el.style.border = oldBorder;
                    el.style.padding = oldPadding;
                    el.style.margin = oldMargin;
                    
                    return html;
                }
                return (this.constructor as any).prototype.toHTML.call(this, opts);
            }
        }
    });

    // Custom Table Header (THEAD) Component
    domc.addType('custom-thead', {
        isComponent: (el: HTMLElement) => {
            if (el.tagName === 'THEAD') return { type: 'custom-thead' };
            return false;
        },
        model: {
            defaults: {
                tagName: 'thead',
                draggable: false,
                droppable: true,
                selectable: false,
                highlightable: false,
                removable: false, // Prevent deletion to avoid border issues
                copyable: false,
                toolbar: [],
            }
        }
    });

    // Custom Header Cell Type (TH) - similar to custom-cell but for headers
    domc.addType('custom-th', {
        extend: 'custom-cell',
        isComponent: (el: HTMLElement) => {
            if (el.tagName === 'TH') return { type: 'custom-th' };
            return false;
        },
        model: {
            defaults: {
                tagName: 'th',
                editable: false,
                draggable: false,
                droppable: true, // Allow dropping components into header cells
                selectable: true,
                highlightable: true,
                removable: true, // Allow deletion when selecting column
                // Allow component nesting
                components: [],
                attributes: {
                    'data-border-top': 'true',
                    'data-border-right': 'true',
                    'data-border-bottom': 'true',
                    'data-border-left': 'true'
                },
                style: {
                    padding: '8px',
                    textAlign: 'left',
                    boxSizing: 'border-box',
                    wordWrap: 'break-word',
                    wordBreak: 'break-word',
                    whiteSpace: 'normal',
                    overflowWrap: 'break-word',
                    maxWidth: '200px',
                    minWidth: '100px',
                    verticalAlign: 'top'
                },
                traits: [
                    'background-color',
                    'color', 
                    'text-align',
                    'vertical-align',
                    'padding',
                    'margin',
                    'border-color',
                    'border-width',
                    'border-style',
                    'font-weight',
                    'font-size'
                ] as any,
                toolbar: [
                    { attributes: { class: 'fa fa-table', title: 'Select Entire Column' }, command: 'select-column' },
                    { attributes: { class: 'fa fa-arrow-left', title: 'Insert Column Left' }, command: 'insert-column-left' },
                    { attributes: { class: 'fa fa-arrow-right', title: 'Insert Column Right' }, command: 'insert-column-right' },
                    { attributes: { class: 'fa fa-th-large', title: 'Border Options' }, command: 'open-border-dropdown' },
                    { attributes: { class: 'fa fa-trash', title: 'Delete Header Cell' }, command: 'tlb-delete' }
                ]
            },
            init() {
                // Call parent init to inherit double-click editing functionality
                const parent = domc.getType('custom-cell');
                if (parent && parent.model && parent.model.prototype && parent.model.prototype.init) {
                    parent.model.prototype.init.call(this);
                }

                try {
                    // Helper to sync header color to inner text components
                    const syncColor = () => {
                        try {
                            // Prefer explicit style.color from the model
                            const style = (this as any).get && (this as any).get('style');
                            const color = style && (style.color || style['color']) ? (style.color || style['color']) : null;
                            if (!color) return;

                            const comps = (this as any).components && (this as any).components();
                            if (!comps || !comps.each) return;
                            comps.each((c: any) => {
                                try {
                                    // If the nested component is a text block, apply the color
                                    const t = c.get && c.get('type');
                                    if (t === 'text' || (c.get && c.get('attributes') && c.get('attributes')['data-gjs-type'] === 'text')) {
                                        c.setStyle && c.setStyle({ color });
                                    }
                                } catch (_) { /* ignore */ }
                            });
                        } catch (_) { /* ignore */ }
                    };

                    // Sync initially
                    setTimeout(syncColor, 50);

                    // Sync whenever style changes on the header cell (e.g., via Style Manager)
                    (this as any).on && (this as any).on('change:style', syncColor);
                } catch (_) { /* ignore */ }
            },
            handleBorderChanges() {
                // Inherit border handling from custom-cell
                const parent = domc.getType('custom-cell');
                if (parent && parent.model && parent.model.prototype && parent.model.prototype.handleBorderChanges) {
                    parent.model.prototype.handleBorderChanges.call(this);
                }
            }
        }
    });

    // Command to add a row across the entire table (used by header)
    editor.Commands.add('add-table-row-all', {
        run(ed: any, sender: any, opts: any = {}) {
            try {
                let comp = opts.target || ed.getSelected && ed.getSelected();
                if (!comp) return;

                // find table model
                const findTableModel = (m: any) => {
                    if (!m) return null;
                    if (m.get && (m.get('tagName') || '').toLowerCase() === 'table') return m;
                    if (m.find) { const f = m.find('table'); if (f && f[0]) return f[0]; }
                    let cur = m; while (cur) { if (cur.get && (cur.get('tagName') || '').toLowerCase() === 'table') return cur; cur = cur.parent && cur.parent(); }
                    return null;
                };

                const table = findTableModel(comp);
                if (!table) return;

                const tbody = table.components().filter((c: any) => (c.get && (c.get('tagName') || '').toLowerCase() === 'tbody'))[0];
                if (!tbody) return;

                // compute number of columns from header or first row
                let colCount = 0;
                const thead = table.components().filter((c: any) => c.get && (c.get('tagName') || '').toLowerCase() === 'thead')[0];
                if (thead) {
                    const thRow = thead.components().filter((c: any) => c.get && (c.get('tagName') || '').toLowerCase() === 'tr')[0];
                    if (thRow) colCount = thRow.components().length;
                }
                if (!colCount) {
                    const firstRow = tbody.components().filter((c: any) => c.get && (c.get('tagName') || '').toLowerCase() === 'tr')[0];
                    if (firstRow) colCount = firstRow.components().length;
                }
                if (!colCount) colCount = 1;

                // build row and add at end
                const newRow = { type: 'custom-row', components: Array.from({ length: colCount }, (_, i) => ({ type: 'custom-cell', content: `Cell ${i + 1}` })) };
                tbody.components().add(newRow);
                table.view && table.view.render && table.view.render();
                ed.select && ed.select(newRow);
            } catch (e) { /*no-op*/ }
        }
    });

    // Command to add a column across the entire table (used by header)
    editor.Commands.add('add-table-column-all', {
        run(ed: any, sender: any, opts: any = {}) {
            try {
                let comp = opts.target || ed.getSelected && ed.getSelected();
                if (!comp) return;

                // find table model
                const findTableModel = (m: any) => {
                    if (!m) return null;
                    if (m.get && (m.get('tagName') || '').toLowerCase() === 'table') return m;
                    if (m.find) { const f = m.find('table'); if (f && f[0]) return f[0]; }
                    let cur = m; while (cur) { if (cur.get && (cur.get('tagName') || '').toLowerCase() === 'table') return cur; cur = cur.parent && cur.parent(); }
                    return null;
                };

                const table = findTableModel(comp);
                if (!table) return;

                // compute column index for the header cell
                let headerCell = comp;
                try {
                    if (!(headerCell && headerCell.get && (headerCell.get('tagName') || '').toLowerCase() === 'th')) {
                        headerCell = headerCell && headerCell.closest && headerCell.closest('th');
                    }
                } catch (_) { headerCell = null; }

                const getColIndexFromModel = (cellModel: any) => {
                    try {
                        const rowModel = cellModel && cellModel.closest && cellModel.closest('tr');
                        if (rowModel && rowModel.components) {
                            const comps = rowModel.components();
                            const idx = typeof comps.indexOf === 'function' ? comps.indexOf(cellModel) : -1;
                            if (idx >= 0) return idx;
                        }
                        const el = cellModel && cellModel.getEl && cellModel.getEl();
                        if (el && typeof el.cellIndex === 'number') return el.cellIndex;
                    } catch (_) { /*no-op*/ }
                    return -1;
                };

                const computedIndex = headerCell ? getColIndexFromModel(headerCell) : -1;

                // modal to choose left or right
                const modal = ed.Modal;
                const wrapper = document.createElement('div');
                wrapper.innerHTML = `
                    <div class="gjs-table-modal">
                        <div style="margin-bottom:20px; font-weight:600; font-size:15px;">Add New Column</div>
                        <button id="gjs-col-left-h" style="display:block; width:100%; margin-bottom:10px;">Add Left</button>
                        <button id="gjs-col-right-h" style="display:block; width:100%; margin-bottom:10px;">Add Right</button>
                        <div class="gjs-table-buttons">
                            <button id="gjs-col-cancel-h">Cancel</button>
                        </div>
                    </div>
                `;
                modal.setTitle('Insert Column');
                modal.setContent(wrapper);
                modal.open();

                const ensureThead = (tbl: any) => {
                    try {
                        let thead = tbl.components().filter((c: any) => c.get && (c.get('tagName') || '').toLowerCase() === 'thead')[0];
                        if (!thead) {
                            let colCount = 0;
                            const tbody = tbl.components().filter((c: any) => c.get && (c.get('tagName') || '').toLowerCase() === 'tbody')[0];
                            if (tbody) {
                                const firstRow = tbody.components().filter((r: any) => r.get && (r.get('tagName') || '').toLowerCase() === 'tr')[0];
                                if (firstRow) colCount = firstRow.components().length;
                            }
                            if (!colCount) colCount = 1;
                            const ths: string[] = [];
                            for (let i = 0; i < colCount; i++) ths.push(`<th data-gjs-type="custom-th" contenteditable="false" style="background-color: ${BRAND_BLUE}; padding:8px; text-align:left; border:none;">Header ${i + 1}</th>`);
                            const headerHTML = `<thead><tr>${ths.join('')}</tr></thead>`;
                            tbl.components().add({ components: headerHTML }, { at: 0 });
                            thead = tbl.components().filter((c: any) => c.get && (c.get('tagName') || '').toLowerCase() === 'thead')[0];
                        }
                        return thead;
                    } catch (_) { return null; }
                };

                const performInsert = (position: 'left' | 'right') => {
                    try {
                        const tbody = table.components().filter((c: any) => c.get && (c.get('tagName') || '').toLowerCase() === 'tbody')[0];
                        if (!tbody) return;
                        let atIndex = (typeof computedIndex === 'number' && computedIndex >= 0) ? (position === 'left' ? computedIndex : computedIndex + 1) : undefined;
                        // if undefined, append at end
                        tbody.components().forEach((r: any) => {
                            r.components().add({ type: 'custom-cell', content: 'New Cell' }, (typeof atIndex === 'number' ? { at: atIndex } : undefined));
                        });

                        const thead = ensureThead(table);
                        if (thead) {
                            const thRow = thead.components().filter((c: any) => c.get && (c.get('tagName') || '').toLowerCase() === 'tr')[0];
                            if (thRow) {
                                thRow.components().add({ type: 'custom-th', content: 'Header', style: { backgroundColor: BRAND_BLUE, color: '#fff', padding: '8px', textAlign: 'left', border: 'none', wordWrap: 'break-word', maxWidth: '200px', minWidth: '100px', fontWeight: 'bold' } }, (typeof atIndex === 'number' ? { at: atIndex } : undefined));
                            }
                        }

                        table.view && table.view.render && table.view.render();
                        try { editor.refresh && editor.refresh(); } catch (_) { /*non-critical*/ }
                    } catch (e) { /*no-op*/ }
                    try { modal.close(); } catch (_) { /*no-op*/ }
                };

                wrapper.querySelector('#gjs-col-left-h')?.addEventListener('click', () => performInsert('left'));
                wrapper.querySelector('#gjs-col-right-h')?.addEventListener('click', () => performInsert('right'));
                wrapper.querySelector('#gjs-col-cancel-h')?.addEventListener('click', () => modal.close());

            } catch (e) { /*no-op*/ }
        }
    });

    // Define a component type for the table placeholder to prevent it from being embedded in text components
    domc.addType('table-placeholder', {
        isComponent: (el: HTMLElement) => {
            const attrs = el.attributes || {};
            if ((attrs as any)['data-gjs-table-placeholder'] || (attrs as any)['data-table-placeholder']) {
                return { type: 'table-placeholder' };
            }
            return false;
        },
        model: {
            defaults: {
                tagName: 'div',
                draggable: true,
                droppable: false,
                editable: false,
                selectable: true,
                highlightable: true,
                attributes: {
                    'data-gjs-table-placeholder': 'true'
                },
                content: 'Table (configure)',
                style: {
                    padding: '20px',
                    backgroundColor: '#f0f0f0',
                    border: '2px dashed #ccc',
                    textAlign: 'center',
                    cursor: 'pointer',
                    minHeight: '60px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }
            }
        }
    });
 
    // Add a block which drops a lightweight placeholder
    bm.add("custom-table", {
         label: "Table",
  media: `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
         xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="18" height="18" rx="1" stroke="#666" fill="#080808ff !important"/>
      <path d="M3 9h18M3 15h18M9 3v18M15 3v18" stroke="#999"/>
    </svg>
  `,
        category: "Layout",
        content: { type: 'table-placeholder' }
    });
 
    // When the placeholder component is added, show modal to configure dimensions
    editor.on("component:add", (component: any) => {
        try {
            if (!component) return;
            // Prevent handling same component multiple times
            if ((component as any).__tableConfigHandled) return;
 
            const attrs = component.getAttributes ? component.getAttributes() : {};
            // Support multiple detection strategies: attribute presence, content text, or raw HTML marker
            let looksLikePlaceholder = false;
            if (attrs && ("data-gjs-table-placeholder" in attrs || "data-table-placeholder" in attrs)) looksLikePlaceholder = true;
            try {
                const content = (component.get && component.get("content")) || "";
                if (typeof content === "string" && content.indexOf("Table (configure)") !== -1) looksLikePlaceholder = true;
            } catch (_) {
                /*no op*/
            }
            try {
                const html = (component.toHTML && component.toHTML()) || "";
                if (typeof html === "string" && html.indexOf("data-gjs-table-placeholder") !== -1) looksLikePlaceholder = true;
            } catch (_) {
                /*no op*/
            }
 
            if (!looksLikePlaceholder) return;
            // mark handled to avoid re-opening modal
            (component as any).__tableConfigHandled = true;
 
            const modal = editor.Modal;
            const wrapper = document.createElement("div");
            wrapper.innerHTML = `
                <div class="gjs-table-modal">
                    <label>Rows</label>
                    <input id="gjs-table-rows" type="number" min="1" max="50" value="3">
                    <label>Columns</label>
                    <input id="gjs-table-cols" type="number" min="1" max="20" value="3">
                    <div class="gjs-table-buttons">
                        <button id="gjs-table-insert">Insert Table</button>
                        <button id="gjs-table-cancel">Cancel</button>
                    </div>
                </div>
            `;
 
            modal.setTitle("Insert Table");
            modal.setContent(wrapper);
            modal.open();
 
            const btn = wrapper.querySelector("#gjs-table-insert") as HTMLButtonElement | null;
            const cancelBtn = wrapper.querySelector("#gjs-table-cancel") as HTMLButtonElement | null;
            const rowsInput = wrapper.querySelector("#gjs-table-rows") as HTMLInputElement | null;
            const colsInput = wrapper.querySelector("#gjs-table-cols") as HTMLInputElement | null;
 
            const cleanup = () => {
                try {
                    modal.close();
                } catch (_) {
                    /*no op*/
                }
            };
 
            if (cancelBtn) cancelBtn.addEventListener("click", () => {
                // Remove placeholder if user cancelled
                try { component.remove && component.remove(); } catch (_) {
                    /*no op*/
                }
                cleanup();
            });
 
            if (!btn || !rowsInput || !colsInput) return;
 
            btn.addEventListener("click", () => {
                const r = Math.max(1, Math.min(50, parseInt(rowsInput.value || "0", 10) || 1));
                const c = Math.max(1, Math.min(20, parseInt(colsInput.value || "0", 10) || 1));
 
                // Build table HTML with inline styles for preview compatibility
                const thCells: string[] = [];
                for (let i = 1; i <= c; i++) {
                    // Header should have no border by default, with text component inside
                    thCells.push(`<th data-gjs-type="custom-th" contenteditable="false" style="background-color: ${BRAND_BLUE}; padding:8px; text-align:left; border:none; word-wrap:break-word; max-width:200px; min-width:100px;"><div data-gjs-type="text">Header ${i}</div></th>`);
                }
 
                const bodyRows: string[] = [];
                for (let ri = 0; ri < r; ri++) {
                    const cells: string[] = [];
                    for (let ci = 0; ci < c; ci++) {
                        // All cells get uniform borders (no special first-row handling)
                        cells.push(`<td data-gjs-type="custom-cell" style="padding:8px; text-align:left; border:1px solid #202020; word-wrap:break-word; max-width:200px; min-width:100px;"><div data-gjs-type="text">Cell ${ri + 1}-${ci + 1}</div></td>`);
                    }
                    bodyRows.push(`<tr data-gjs-type="custom-row">${cells.join("")}</tr>`);
                }
 
                    const tableHTML = `
                    <div class="gjs-custom-table-wrapper" data-gjs-type="custom-table-wrapper" style="overflow-x: auto; width: 100%; position: relative;">
                        <table class="gjs-custom-table" data-gjs-type="gjs-custom-table" style="width:100%; border-collapse:collapse; border-spacing:0; table-layout:fixed;">
                            <thead>
                                <tr>${thCells.join("")}</tr>
                            </thead>
                            <tbody>
                                ${bodyRows.join("\n")}
                            </tbody>
                        </table>
                    </div>
                `;
 
                // Insert table into the same parent where placeholder was dropped
                try {
                    const parent = component.parent && component.parent();
                    if (parent) {
                        // determine index
                        let idx: number | undefined = undefined;
                        try {
                            const siblings = parent.components && parent.components();
                            if (Array.isArray(siblings)) idx = (siblings as any).indexOf(component);
                            else if (siblings && siblings.models) idx = (siblings.models as any).indexOf(component);
                        } catch (_) { idx = undefined; }
 
                        let added: any = null;
                        try {
                            // Prefer append at same index
                            if (typeof idx === "number" && parent.components && parent.components().add) {
                                added = parent.components().add({ components: tableHTML }, { at: idx });
                            } else if (parent.append) {
                                added = parent.append({ components: tableHTML });
                            } else if (parent.add) {
                                added = parent.add({ components: tableHTML });
                            } else {
                                // fallback: set component's html directly
                                try {
                                    component.set && component.set("components", tableHTML);
                                } catch (_) {
                                    try { component.set && component.set("components", tableHTML); } catch (_) {
                                        /*no op*/
                                    }
                                }
                                added = component;
                            }
                        } catch (e) {
                            try { component.set && component.set("components", tableHTML); added = component; } catch (_) { added = null; }
                        }
 
                        // Remove the placeholder
                        try { component.remove && component.remove(); } catch (_) {
                            /*no op*/
                        }
 
                        // Select the new table wrapper for user feedback (force wrapper selection so our custom toolbar appears)
                        try {
                            if (added) {
                                // add returns collection or model depending on API
                                const pick = Array.isArray(added) ? added[0] : added;
                                // Try to locate the wrapper component inside the added model
                                let wrapperComp: any = null;
                                try {
                                    // If pick itself is the wrapper
                                    if (pick && pick.get && pick.get('type') === 'custom-table-wrapper') {
                                        wrapperComp = pick;
                                    } else if (pick && pick.find) {
                                        const found = pick.find && pick.find('.gjs-custom-table-wrapper');
                                        if (found && found.length) wrapperComp = found[0];
                                    }
                                } catch (_) { /* ignore */ }

                                // If we found the wrapper, select it after a short delay to avoid selection race with internal table
                                if (wrapperComp) {
                                    setTimeout(() => {
                                        try {
                                            editor.select && editor.select(wrapperComp);
                                            // Ensure the wrapper has its toolbar (defensive)
                                            const existing = (wrapperComp.get && wrapperComp.get('toolbar')) || [];
                                            if (!existing || existing.length === 0) {
                                                try {
                                                    wrapperComp.set && wrapperComp.set('toolbar', [
                                                        { attributes: { class: 'fa fa-th', title: 'Select All Cells' }, command: 'select-all-cells' },
                                                        { attributes: { class: 'fa fa-minus-square', title: 'Remove Header' }, command: 'remove-table-header' },
                                                        { attributes: { class: 'fa fa-edit', title: 'Edit Table' }, command: 'edit-table' },
                                                        { attributes: { class: 'fa fa-th-large', title: 'Table Border Options' }, command: 'table-border-options' },
                                                        { attributes: { class: 'fa fa-clone', title: 'Clone' }, command: 'tlb-clone' },
                                                        { attributes: { class: 'fa fa-trash', title: 'Delete' }, command: 'tlb-delete' }
                                                    ]);
                                                } catch (_) { /* ignore */ }
                                            }
                                        } catch (_) { /* ignore */ }
                                    }, 80);
                                } else {
                                    // Fallback: select what was added
                                    editor.select && editor.select(pick);
                                }
                            }
                        } catch (_) {
                            /*no op*/
                        }
                    } else {
                        try { component.set && component.set("components", tableHTML); } catch (_) {
                            /*no op*/
                        }
                    }
                } catch (err) {
                    console.warn("[TablePlugin] Insert failed", err);
                }
 
                cleanup();
            });
 
        } catch (e) {
            /* no-op */
        }
    });
 
    // Ensure the Edit button appears in the visible selection toolbar whenever a table is in the selection chain
    editor.on("component:selected", (component: any) => {
        try {
            if (!component) return;
            
            // Detect whether the selected component is (or contains) a table
            const findTableModel = (m: any) => {
                try {
                    if (m && m.get && (m.get("tagName") || "").toLowerCase() === "table") return m;
                    if (m && m.find) {
                        const f = m.find("table");
                        if (f && f[0]) return f[0];
                    }
                    let cur = m;
                    while (cur) {
                        if (cur.get && (cur.get("tagName") || "").toLowerCase() === "table") return cur;
                        cur = cur.parent && cur.parent();
                    }
                } catch { /*no-op*/ }
                return null;
            };
 
            const tableModel = findTableModel(component);
            
            // If NO table in selection chain, remove any lingering table toolbar buttons
            if (!tableModel) {
                try {
                    const existing = (component.get && component.get("toolbar")) || [];
                    const filtered = (existing || []).filter((t: any) => {
                        return !(t && (t.command === "edit-table" || t.command === "remove-table-header" || t.command === "select-all-cells"));
                    });
                    // Only update if we actually removed something
                    if (filtered.length !== (existing || []).length) {
                        try { component.set && component.set("toolbar", filtered); } catch { /*no-op*/ }
                    }
                } catch { /*no-op*/ }
                return; // Exit early - no table in chain
            }
 
            const ensureEditButtonOn = (tableModelTarget: any) => {
                try {
                    // NOTE: These buttons are now on the wrapper toolbar only
                    // We no longer add them to the table element itself
                    // if (!tableModelTarget) return;
                    // const existing = (tableModelTarget.get && tableModelTarget.get("toolbar")) || [];
                    // const filtered = (existing || []).filter((t: any) => !(t && (t.command === "edit-table" || t.command === "remove-table-header" || t.command === "select-all-cells")));
                    // filtered.push({ attributes: { class: 'fa fa-edit', title: 'Edit Table' }, command: 'edit-table' });
                    // filtered.push({ attributes: { class: 'fa fa-minus-square', title: 'Remove Header' }, command: 'remove-table-header' });
                    // filtered.push({ attributes: { class: 'fa fa-th', title: 'Select All Cells' }, command: 'select-all-cells' });
                    // try { tableModelTarget.set && tableModelTarget.set("toolbar", filtered); } catch { /*no-op*/ }
                } catch { /*no-op*/ }
            };

            // Attach the edit button to the table model itself so custom toolbars on cells/headers remain intact
            // NOTE: Disabled - these buttons are now only on the wrapper
            // ensureEditButtonOn(tableModel);

            // Ensure specific toolbars are applied to header/cell/row components when selected
            try {
                const tag = (component.get && (component.get('tagName') || '') || '').toLowerCase();
                // Only apply table toolbars to table-related elements (td, th, tr, table)
                const isTableRelated = tag === 'td' || tag === 'th' || tag === 'tr' || tag === 'table';
                
                // Define desired toolbars
                const cellToolbar = [
                    { attributes: { class: 'fa fa-table', title: 'Select Entire Row' }, command: 'select-row' },
                    { attributes: { class: 'fa fa-columns', title: 'Select Entire Column' }, command: 'select-column' },
                    { attributes: { class: 'fa fa-arrow-up', title: 'Insert Row Above' }, command: 'insert-row-above' },
                    { attributes: { class: 'fa fa-arrow-down', title: 'Insert Row Below' }, command: 'insert-row-below' },
                    { attributes: { class: 'fa fa-th-large', title: 'Border Options' }, command: 'open-border-dropdown' },
                    { attributes: { class: 'fa fa-link', title: 'Add/Edit Link' }, command: 'add-cell-link' },
                    { attributes: { class: 'fa fa-arrow-left', title: 'Insert Column Left' }, command: 'insert-column-left' },
                    { attributes: { class: 'fa fa-arrow-right', title: 'Insert Column Right' }, command: 'insert-column-right' },
                    { attributes: { class: 'fa fa-trash', title: 'Remove Row/Column' }, command: 'tlb-delete' }
                ];
                const headerToolbar = [
                    { attributes: { class: 'fa fa-arrow-left', title: 'Insert Column Left' }, command: 'insert-column-left' },
                    { attributes: { class: 'fa fa-arrow-right', title: 'Insert Column Right' }, command: 'insert-column-right' },
                    { attributes: { class: 'fa fa-th-large', title: 'Border Options' }, command: 'open-border-dropdown' },
                    // Use insert-row-below to add rows for all columns (no modal). Removed insert-row-above per request.
                    { attributes: { class: 'fa fa-arrow-down', title: 'Insert Row Below (All Columns)' }, command: 'insert-row-below' },
                    { attributes: { class: 'fa fa-trash', title: 'Delete Header Cell' }, command: 'tlb-delete' }
                ];
                const rowToolbar = [
                    { attributes: { class: 'fa fa-arrow-up', title: 'Insert Row Above' }, command: 'insert-row-above' },
                    { attributes: { class: 'fa fa-arrow-down', title: 'Insert Row Below' }, command: 'insert-row-below' },
                    { attributes: { class: 'fa fa-trash', title: 'Remove Row' }, command: 'tlb-delete' }
                ];

                if (tag === 'td') {
                    try { component.set && component.set('toolbar', cellToolbar); } catch { /*no-op*/ }
                } else if (tag === 'th') {
                    try { component.set && component.set('toolbar', headerToolbar); } catch { /*no-op*/ }
                } else if (tag === 'tr') {
                    try { component.set && component.set('toolbar', rowToolbar); } catch { /*no-op*/ }
                }
                // Only merge Edit Table buttons for table-related components, not body or other elements
                // NOTE: These buttons are now on the wrapper toolbar, so we skip adding them to cells
                // if (isTableRelated) {
                //     try {
                //         const mergeEditBtn = (m: any) => {
                //             try {
                //                 if (!m || !m.get || !m.set) return;
                //                 const existing = m.get('toolbar') || [];
                //                 // if table buttons not present, add them at the beginning
                //                 const hasEdit = (existing || []).some((t: any) => t && t.command === 'edit-table');
                //                 const hasRemoveHeader = (existing || []).some((t: any) => t && t.command === 'remove-table-header');
                //                 const hasSelectAll = (existing || []).some((t: any) => t && t.command === 'select-all-cells');
                //                 if (!hasEdit || !hasRemoveHeader || !hasSelectAll) {
                //                     const copy = Array.isArray(existing) ? existing.slice() : existing;
                //                     if (!hasEdit) {
                //                         copy.unshift({ attributes: { class: 'fa fa-edit', title: 'Edit Table' }, command: 'edit-table' });
                //                     }
                //                     if (!hasRemoveHeader) {
                //                         copy.unshift({ attributes: { class: 'fa fa-minus-square', title: 'Remove Header' }, command: 'remove-table-header' });
                //                     }
                //                     if (!hasSelectAll) {
                //                         copy.unshift({ attributes: { class: 'fa fa-th', title: 'Select All Cells' }, command: 'select-all-cells' });
                //                     }
                //                     try { m.set && m.set('toolbar', copy); } catch { /*no-op*/ }
                //                 }
                //             } catch { /*no-op*/ }
                //         };
                //         mergeEditBtn(component);
                //     } catch (e) { /*no-op*/ }
                // }
            } catch (e) { /*no-op*/ }
            // NOTE: Disabled - these buttons are now only on the wrapper
            // setTimeout(() => ensureEditButtonOn(tableModel), 60);
            // setTimeout(() => ensureEditButtonOn(tableModel), 260);
        } catch (e) { /*no-op*/ }
    });

    // Remove lingering edit-table toolbar when a table is removed
    const stripEditToolbarFrom = (model: any) => {
        try {
            if (!model || !model.get || !model.set) return;
            const existing = model.get("toolbar") || [];
            const filtered = (existing || []).filter((t: any) => !(t && t.command === "edit-table"));
            // only set if changed
            if (filtered.length !== (existing || []).length) {
                try { model.set && model.set("toolbar", filtered); } catch { /*no-op*/ }
                try { model.view && model.view.render && model.view.render(); } catch { /*no-op*/ }
            }
        } catch { /*no-op*/ }
    };

    const handlePotentialTableRemoval = (component: any) => {
        try {
            if (!component) return;

            // If the removed component is (or contains) a table, ensure no lingering edit toolbar remains
            const findTableModel = (m: any) => {
                try {
                    if (m && m.get && (m.get("tagName") || "").toLowerCase() === "table") return m;
                    if (m && m.find) {
                        const f = m.find("table");
                        if (f && f[0]) return f[0];
                    }
                    let cur = m;
                    while (cur) {
                        if (cur.get && (cur.get("tagName") || "").toLowerCase() === "table") return cur;
                        cur = cur.parent && cur.parent();
                    }
                } catch { /*no-op*/ }
                return null;
            };

            const tableModel = findTableModel(component);
            if (!tableModel) return;

            // Clear edit button from currently selected and its ancestors
            const sel = editor.getSelected && editor.getSelected();
            let cur = sel;
            while (cur) {
                stripEditToolbarFrom(cur);
                cur = cur.parent && cur.parent();
            }

          
            stripEditToolbarFrom(component.parent && component.parent());

            // Force selection to clear so the toolbar UI is refreshed
            try { editor.select && editor.select(); } catch { /*no-op*/ }
            try { editor.refresh && editor.refresh(); } catch { /*no-op*/ }
        } catch { /*no-op*/ }
    };

    editor.on("component:remove", (component: any) => handlePotentialTableRemoval(component));
    editor.on("component:removed", (component: any) => handlePotentialTableRemoval(component));
}
 
export default customTablePlugin;

