import type { Editor } from "grapesjs";

// Horizontal menu with click-to-open dropdown and editing toolbar on items
export default function horizMenuPlugin(editor: Editor, opts: any = {}) {
  const bm = editor.BlockManager;
  const dc = editor.DomComponents;

  const blockId = opts.blockId || "horizontal-menu";
  const category = opts.category || "Navigation";

  const blockLabel = `
		<div style="text-align:center;">
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
				<rect x="2" y="6" width="20" height="3" rx="1.5" fill="#080808ff"/>
				<rect x="2" y="11" width="12" height="3" rx="1.5" fill="#080808ff"/>
				<rect x="2" y="16" width="16" height="3" rx="1.5" fill="#080808ff"/>
			</svg>
			<div style="font-size:11px; margin-top:6px;">HorizontalMenu</div>
		</div>
	`;

  // Store cleanup functions for each menu instance
  const menuCleanupHandlers = new WeakMap();

  // Initial block shows only two menu items as requested
  const content = `
	<style>
		.pcf-hmenu { width: 100%; background: #ffffff; border: 1px dashed #999; border-radius: 4px; padding: 12px; }
		.pcf-hmenu * { box-sizing: border-box; }
    .pcf-hmenu .hmenu {
      list-style: none; margin: 0; padding: 0 12px; display: flex; gap: 24px;
      align-items: stretch;
    }
    .pcf-hmenu .hmenu > li {
      position: relative; padding: 15px; margin: 0px 0px 5px; font-weight: 600; color: inherit; cursor: default;
      /* Fix height so dropdown baseline is identical across items */
      height: 40px; display: flex; align-items: center; gap: 6px;
    }
		.pcf-hmenu a { color: inherit; text-decoration: none; display: flex; align-items: center; gap: 6px; margin: 0; height: 100%; }
    /* support text-only labels (no anchor) */
    .pcf-hmenu .hmenu > li > .menu-label { display: inline-block; margin: 0; padding: 0; color: inherit; }
    /* Reset any stray margins/paddings on anchor content that could shift baseline */
    .pcf-hmenu .hmenu > li > a, .pcf-hmenu .hmenu > li > a * { margin: 0 !important; padding: 0 !important; }
    .pcf-hmenu .hmenu > li > .menu-label, .pcf-hmenu .hmenu > li > .menu-label * { margin: 0 !important; padding: 0 !important; }
  .pcf-hmenu a:hover { color: inherit; background: transparent; }
		/* Caret SVG shown only when a submenu exists on the item */
    .pcf-hmenu .caret-icon { width: 12px; height: 12px; fill: currentColor; opacity: .7; pointer-events: none; margin-left: 4px; vertical-align: middle; }

  /* HARD OVERRIDES: prevent any global button-link styling from turning these into blue buttons */
    .pcf-hmenu a[data-role="button-link"],
    .pcf-hmenu a[data-role="button-link"]:hover,
    .pcf-hmenu a[data-role="button-link"]:focus,
    .pcf-hmenu a[data-role="button-link"]:active {
      background: transparent;
      border: none !important;
      padding: 0;
      margin: 0;
      /* keep flex set below on specific selector */
      box-shadow: none !important;
      color: inherit;
      text-decoration: none;
    }
  .pcf-hmenu .hmenu > li { background: transparent; }

    /* Remove blue focus/active styles and any left border highlight from external frameworks */
    .pcf-hmenu .hmenu > li,
    .pcf-hmenu .hmenu > li:focus,
    .pcf-hmenu .hmenu > li:focus-within,
    .pcf-hmenu .hmenu > li:active {
      border: none !important;
      border-left: 0 !important;
      outline: none !important;
      box-shadow: none !important;
    }
    .pcf-hmenu .hmenu > li > a,
    .pcf-hmenu .hmenu > li > a:link,
    .pcf-hmenu .hmenu > li > a:visited,
    .pcf-hmenu .hmenu > li > a:hover,
    .pcf-hmenu .hmenu > li > a:focus,
    .pcf-hmenu .hmenu > li > a:active,
    .pcf-hmenu .hmenu > li > a.active {
      color: inherit;
      text-decoration: none;
      border: none !important;
      border-left: 0 !important;
      box-shadow: none !important;
      outline: none !important;
      background: transparent;
    }
    /* text-only label should behave similarly */
    .pcf-hmenu .hmenu > li > .menu-label {
      color: inherit;
      text-decoration: none;
      background: transparent;
    }

    /* Submenu styling (used when a dropdown is added to an item) */
    .pcf-hmenu .submenu {
      list-style: none; margin: 0 !important; padding: 0; 
      position: absolute; left: 0; top: calc(100% + 2px); min-width: 220px;
      background: #fff; border: 1px solid #dcdcdc; border-radius: 6px;
      box-shadow: 0 8px 20px rgba(0,0,0,.12); z-index: 20;
    }
  .pcf-hmenu .submenu > li { padding: 0; margin: 0; white-space: nowrap; background: transparent; color: inherit; }
    .pcf-hmenu .submenu > li > a,
    .pcf-hmenu .submenu > li > a:hover,
    .pcf-hmenu .submenu > li > a:focus,
    .pcf-hmenu .submenu > li > a:active,
    .pcf-hmenu .submenu > li > a.active {
      font-weight: 700; color: inherit; text-decoration: none; border: none !important; box-shadow: none !important; outline: none !important; background: transparent;
    }
    /* Subitem hover zoom (submenu only) */
    .pcf-hmenu .submenu > li > a { transition: transform 120ms ease, color 120ms ease; transform-origin: left center; will-change: transform; }
    .pcf-hmenu .submenu > li > a:hover { transform: scale(1.08); }

  /* Hover underline (blue) on label text only for top-level items (not submenu) and not the caret icon */
  .pcf-hmenu .hmenu > li > a span { display: inline-block; border-bottom: 2px solid transparent; padding-bottom: 2px; }
  .pcf-hmenu .hmenu > li > a:hover span { border-bottom-color: #0078d4 !important; }
  .pcf-hmenu .hmenu > li > .menu-label { display: inline-block; border-bottom: 2px solid transparent; padding-bottom: 2px; }
  .pcf-hmenu .hmenu > li:hover > .menu-label { border-bottom-color: #0078d4 !important; }
  /* Ensure subitems never underline */
  .pcf-hmenu .submenu > li > a span { border-bottom: 0 !important; }
    .pcf-hmenu .submenu > li:hover { background: transparent; }
    .pcf-hmenu .hmenu > li:hover { background: transparent; }
    .pcf-hmenu a:focus, .pcf-hmenu a:active { background: transparent; }

		@media (max-width: 768px) {
			.pcf-hmenu .hmenu { flex-wrap: wrap; gap: 12px; }
			.pcf-hmenu .hmenu > li { padding: 15px; }
      /* no submenu in mobile either */
		}
		/* Preview mode: hide submenus by default, show on click */
		.pcf-hmenu .submenu { display: none !important; }
		.pcf-hmenu li.open > .submenu { display: block !important; }
    
    /* Portal Preview Fix: Ensure submenu stays visible and accessible */
    .pcf-hmenu li.open > .submenu {
      opacity: 1 !important;
      visibility: visible !important;
      pointer-events: auto !important;
      z-index: 9999 !important;
    }
    
    /* Force clickable state for menu items with submenus */
    .pcf-hmenu .hmenu > li:has(.submenu) {
      cursor: pointer !important;
    }
    
    .pcf-hmenu .hmenu > li:has(.submenu) > a {
      cursor: pointer !important;
      pointer-events: auto !important;
    }
    
    /* Preview mode: disable editing of menu labels and preserve text content */
    .pcf-hmenu .menu-label[contenteditable] {
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
      user-select: none !important;
      outline: none !important;
      cursor: default !important;
    }
    
    /* Ensure "New Item" text shows in preview even if contenteditable is disabled */
    .pcf-hmenu .menu-label:empty::before {
      content: "New Item" !important;
      color: inherit !important;
      font-style: normal !important;
    }
    
    /* Hide dashed border in preview mode */
    .gjs-preview-mode .pcf-hmenu { border: none !important; padding: 0 !important; }
    
    /* Hide dashed border in final output (when not in GrapesJS editor iframe) */
    body:not(.gjs-dashed) .pcf-hmenu:not([data-gjs-type]) { border: none !important; padding: 0 !important; }
    
    /* Alternative: hide border when pcf-hmenu doesn't have GrapesJS data attributes */
    .pcf-hmenu:not([data-gjs-type]):not([class*="gjs-"]) { border: none; padding: 0; }
	</style>
	<nav class="pcf-hmenu" role="navigation" data-gjs-type="hmenu">
		<ul class="hmenu" data-gjs-droppable="false">
			<li data-menu-item data-gjs-type="hmenu-item"><div data-gjs-type="text" class="menu-label">New Item</div></li>
      <li data-menu-item data-gjs-type="hmenu-item"><div data-gjs-type="text" class="menu-label">New Item</div></li>
		</ul>
	</nav>
	<script>
		(function() {
      var menuId = 'hmenu_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      
      // Disable editing in preview mode (Power Pages)
      function disableEditingInPreview() {
        // Check if we're in preview mode (not in editor)
        var isPreview = !window.grapesjs && !document.querySelector('.gjs-editor') && !document.querySelector('[data-gjs-type]');
        
        if (isPreview) {
          console.log('[Portal Menu Fix] Preview mode detected - disabling editing');
          
          // Disable contenteditable on all menu labels
          var menuLabels = document.querySelectorAll('.pcf-hmenu .menu-label[contenteditable]');
          menuLabels.forEach(function(label) {
            label.removeAttribute('contenteditable');
            label.style.cursor = 'default';
            label.style.userSelect = 'none';
            
            // Ensure text is preserved - if empty, set to "New Item"
            if (!label.textContent || label.textContent.trim() === '') {
              label.textContent = 'New Item';
            }
          });
          
          // Disable any other contenteditable elements in the menu
          var allEditables = document.querySelectorAll('.pcf-hmenu [contenteditable]');
          allEditables.forEach(function(elem) {
            elem.removeAttribute('contenteditable');
            elem.style.cursor = 'default';
            elem.style.userSelect = 'none';
          });
        }
      }
      
      // Preview mode functionality for horizontal menu - FORCE dropdown to open when submenu exists
      function hmenuClickHandler(ev) {
					var tgt = ev.target;
					if (!(tgt instanceof Element)) return;
					// Toggle horizontal menu dropdowns on click
          var hAnchor = tgt.closest && tgt.closest('.pcf-hmenu .hmenu > li > a');
          var hItem = tgt.closest && tgt.closest('.pcf-hmenu .hmenu > li');
          if (hAnchor || hItem) {
            var li = (hAnchor && hAnchor.closest('li')) || hItem;
            if (!li) return;
            var nav = li.closest('.pcf-hmenu');
            if (!nav) return;
            // Check if this menu is still in the document
            if (!document.body.contains(nav)) return;
            
            // Check if a submenu exists
            var submenu = (function(){
              var kids = li.children || [];
              for (var k = 0; k < kids.length; k++) {
                var n = kids[k];
                if (n && n.tagName === 'UL' && n.classList && n.classList.contains('submenu')) return n;
              }
              return null;
            })();
            
            if (!submenu) {
              // No submenu, let normal link behavior happen
              return;
            }
            
            // FORCE: If submenu exists, ALWAYS prevent navigation and toggle dropdown
            // This ensures dropdown opens in portal preview even when href exists
            ev.preventDefault();
            ev.stopPropagation();
            
            // Close other open items in this menu
            var opened = nav.querySelectorAll('li.open');
            for (var i = 0; i < opened.length; i++) {
              if (opened[i] !== li) opened[i].classList.remove('open');
            }
            
            // Toggle this item's dropdown
            li.classList.toggle('open');
            
            console.log('[Portal Menu Fix] Toggled dropdown for item:', li);
            return;
          }
					// Click outside any horizontal menu closes all
					var insideHmenu = tgt.closest && tgt.closest('.pcf-hmenu');
					if (!insideHmenu) {
						var allOpen = document.querySelectorAll('.pcf-hmenu li.open');
						for (var j = 0; j < allOpen.length; j++) allOpen[j].classList.remove('open');
					}
			}
      
      // Store the handler for cleanup
      var cleanupFn = function() {
        document.removeEventListener('click', hmenuClickHandler);
      };
      
      // Attach cleanup function to the nav element
      var navElements = document.querySelectorAll('.pcf-hmenu');
      if (navElements.length > 0) {
        var lastNav = navElements[navElements.length - 1];
        lastNav.setAttribute('data-menu-id', menuId);
        if (!lastNav.__hmenuCleanup) {
          lastNav.__hmenuCleanup = cleanupFn;
        }
      }
      
      // Use both click and mousedown for better compatibility in portal
      document.addEventListener('click', hmenuClickHandler, true);
      document.addEventListener('mousedown', function(ev) {
        var tgt = ev.target;
        if (!(tgt instanceof Element)) return;
        var hAnchor = tgt.closest && tgt.closest('.pcf-hmenu .hmenu > li > a');
        var hItem = tgt.closest && tgt.closest('.pcf-hmenu .hmenu > li');
        if (hAnchor || hItem) {
          var li = (hAnchor && hAnchor.closest('li')) || hItem;
          if (!li) return;
          var submenu = li.querySelector('.submenu');
          if (submenu) {
            // Prevent default on mousedown too for better portal compatibility
            ev.preventDefault();
          }
        }
      }, true);
      
      console.log('[Portal Menu Fix] Horizontal menu handlers initialized');
      
      // Initialize preview mode settings
      disableEditingInPreview();
      
      // Also run after a delay to catch dynamically loaded content
      setTimeout(function() {
        disableEditingInPreview();
      }, 500);
      setTimeout(function() {
        disableEditingInPreview();
      }, 1000);
		})();
	</script>
	`;

  // Register block
  bm.add(blockId, {
    label: blockLabel,
    category,
    attributes: { class: "gjs-fonts", title: "Horizontal Menu" },
    content,
  });

  // Component type for the whole menu (optional for future extensibility)
  dc.addType("hmenu", {
    isComponent: (el: HTMLElement) => el && el.classList?.contains("pcf-hmenu"),
    model: {
      defaults: {
        tagName: "nav",
        draggable: true,
        droppable: false,
        attributes: { class: "pcf-hmenu" },
      },
      removed() {
        // Clean up event handlers when component is removed
        const el = this.getEl();
        if (el && (el as any).__hmenuCleanup) {
          try {
            (el as any).__hmenuCleanup();
            delete (el as any).__hmenuCleanup;
          } catch {
            /* ignore */
          }
        }

        // Force remove the element from DOM
        try {
          if (el && el.parentNode) {
            el.parentNode.removeChild(el);
          }
        } catch {
          /* ignore */
        }

        // Trigger canvas update
        try {
          const canvas = editor.Canvas;
          if (canvas) {
            canvas.getBody()?.normalize();
          }
        } catch {
          /* ignore */
        }
      },
    },
    view: {
      onRender() {
        // Ensure clean state when component is rendered
        this.ensureCleanHorizontalMenuState();
      },

      ensureCleanHorizontalMenuState() {
        try {
          const el = this.el;
          if (el) {
            const doc = el.ownerDocument || document;
            // Remove any existing event listeners by cloning
            const existingMenus = doc.querySelectorAll(".pcf-hmenu");
            existingMenus.forEach((menu: Element) => {
              const htmlMenu = menu as HTMLElement;
              if (htmlMenu !== el) {
                const newMenu = htmlMenu.cloneNode(true);
                htmlMenu.parentNode?.replaceChild(newMenu, htmlMenu);
              }
            });
          }
        } catch {
          /* ignore */
        }
      },

      removed() {
        // Clean up view when removed
        try {
          const el = this.el;
          if (el && el.parentNode) {
            el.parentNode.removeChild(el);
          }
        } catch {
          /* ignore */
        }
      },
    },
  });

  // Component type for a top-level menu item to show toolbar with + and -
  dc.addType("hmenu-item", {
    isComponent: (el: HTMLElement) =>
      el?.tagName === "LI" && el.hasAttribute("data-menu-item"),
    model: {
      defaults: {
        tagName: "li",
        attributes: { "data-menu-item": "true" },
        droppable: false,
        draggable: ".hmenu",
        selectable: true,
        stylable: true,
        toolbar: [
          {
            attributes: { class: "fa fa-caret-down", title: "Add dropdown" },
            command: "hmenu-add-dropdown",
          },
          {
            attributes: { class: "fa fa-plus", title: "Add menu item (right)" },
            command: "hmenu-add-item",
          },
          {
            attributes: { class: "fa fa-link", title: "Edit link" },
            command: "hmenu-edit-link",
          },
          {
            attributes: { class: "fa fa-minus", title: "Remove this item" },
            command: "hmenu-remove-item",
          },
          {
            attributes: { class: "fa fa-arrows", title: "Move" },
            command: "tlb-move",
          },
        ],
      },
    },
    view: {
      onRender() {
        try {
          const comp: any = (this as any).model;
          if (!comp || !comp.find) return;
          const hasSub = comp.find && comp.find("ul.submenu li").length > 0;
          if (hasSub) {
            comp.addClass && comp.addClass("has-submenu");
            // Ensure caret exists too
            try {
              ensureCaretIcon(comp);
            } catch {
              /* ignore */
            }
          }
        } catch {
          /* ignore */
        }
      },
    },
  });

  // Submenu item definition for toolbar actions inside dropdown
  dc.addType("hmenu-subitem", {
    isComponent: (el: HTMLElement) =>
      (el?.tagName === "LI" &&
        el.closest("ul")?.classList.contains("submenu")) ||
      false,
    model: {
      defaults: {
        tagName: "li",
        attributes: { "data-subitem": "true" },
        droppable: false,
        draggable: "ul.submenu",
        selectable: true,
        stylable: true,
        toolbar: [
          {
            attributes: { class: "fa fa-plus", title: "Add sibling" },
            command: "hmenu-add-subitem",
          },
          {
            attributes: { class: "fa fa-link", title: "Edit link" },
            command: "hmenu-edit-link",
          },
          {
            attributes: { class: "fa fa-minus", title: "Remove" },
            command: "hmenu-remove-subitem",
          },
          {
            attributes: { class: "fa fa-arrows", title: "Move" },
            command: "tlb-move",
          },
        ],
      },
    },
  });

  // Component type for submenu UL to ensure it's selectable/stylable directly
  dc.addType("hmenu-submenu", {
    isComponent: (el: HTMLElement) =>
      el?.tagName === "UL" && el.classList?.contains("submenu"),
    model: {
      defaults: {
        tagName: "ul",
        attributes: { class: "submenu" },
        selectable: true,
        stylable: true,
        droppable: false,
        draggable: "li[data-menu-item]",
      },
    },
  });

  // Commands to add/remove items
  const normalizeUrl = (url: string): string => {
    if (!url || typeof url !== "string") return "";
    const trimmed = url.trim();
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    if (/^www\./i.test(trimmed)) return `https://${trimmed}`;
    if (trimmed.includes(".") && !trimmed.includes(" "))
      return `https://${trimmed}`;
    return trimmed || "#";
  };

  const openLinkModal = (ed: any, anchorComp: any) => {
    const href =
      (anchorComp?.getAttributes && anchorComp.getAttributes().href) || "";
    const modal = ed.Modal;
    const wrap = document.createElement("div");
    wrap.innerHTML = `
      <div style="padding:10px;">
        <label style="display:block; font-weight:600; margin-bottom:6px;">Link URL</label>
        <input id="hmenu-link-input" type="text" placeholder="#" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;" value="${
          href || ""
        }">
        <div style="margin-top:12px; text-align:right; display:flex; gap:8px; justify-content:flex-end;">
          <button id="hmenu-link-cancel" class="gjs-btn">Cancel</button>
          <button id="hmenu-link-save" class="gjs-btn-prim">Save</button>
        </div>
      </div>`;
    modal.setTitle("Edit Link");
    modal.setContent(wrap);
    modal.open();

    const cancelBtn = wrap.querySelector(
      "#hmenu-link-cancel"
    ) as HTMLButtonElement | null;
    const saveBtn = wrap.querySelector(
      "#hmenu-link-save"
    ) as HTMLButtonElement | null;
    const input = wrap.querySelector(
      "#hmenu-link-input"
    ) as HTMLInputElement | null;
    const close = () => modal.close();
    cancelBtn?.addEventListener("click", close);
    saveBtn?.addEventListener("click", () => {
      const val = normalizeUrl((input?.value || "").trim());
      try {
        const attrs =
          (anchorComp.getAttributes && anchorComp.getAttributes()) || {};
        const next = { ...attrs, href: val || "#" };
        if (anchorComp.setAttributes) anchorComp.setAttributes(next);
        else if (anchorComp.addAttributes) anchorComp.addAttributes(next);
        // Update DOM element too
        const el = anchorComp.getEl && anchorComp.getEl();
        if (el && val) el.setAttribute("href", val);
        // Re-render component view if available
        anchorComp.view && anchorComp.view.render && anchorComp.view.render();
        // Trigger updates for persistence
        try {
          anchorComp.trigger && anchorComp.trigger("change:attributes");
        } catch {
          /* ignore */
        }
        try {
          ed.trigger && ed.trigger("component:update", anchorComp);
        } catch {
          /* ignore */
        }
        try {
          ed.store && ed.store();
        } catch {
          /* ignore */
        }
      } catch {
        /* ignore */
      }
      close();
    });
  };

  editor.Commands.add("hmenu-edit-link", {
    run(ed) {
      let sel: any = ed.getSelected();
      if (!sel) return;
      // Normalize to hmenu-item or hmenu-subitem
      const type = sel.get && sel.get("type");
      if (type !== "hmenu-item" && type !== "hmenu-subitem") {
        const el = sel.getEl && sel.getEl();
        if (el) {
          const li =
            el.closest("ul.submenu > li") || el.closest("li[data-menu-item]");
          if (li) {
            const wrapper = ed.getWrapper && ed.getWrapper();
            if (wrapper && wrapper.find) {
              const match = li.hasAttribute("data-menu-item")
                ? "li[data-menu-item]"
                : "ul.submenu > li";
              const list = wrapper.find(match);
              for (const c of list) {
                if (c.getEl && c.getEl() === li) {
                  sel = c;
                  break;
                }
              }
            }
          }
        }
      }
      const finalType = sel && sel.get && sel.get("type");
      if (finalType !== "hmenu-item" && finalType !== "hmenu-subitem") return;

      // Find or create anchor inside the item
      let anchor: any = null;
      try {
        const found = sel.find && sel.find("a");
        anchor = found && found[0];
      } catch {
        /* ignore */
      }

      if (!anchor) {
        // Create an anchor wrapping existing content (prefer span label)
        const comps: any = sel.components && sel.components();
        let labelChild: any = null;
        try {
          const spanMatches = sel.find && sel.find("span");
          labelChild = spanMatches && spanMatches[0];
        } catch {
          /* ignore */
        }

        const linkComp: any = {
          tagName: "a",
          attributes: { href: "#", "data-role": "button-link" },
          components: labelChild
            ? []
            : [
                {
                  tagName: "span",
                  content: "Link",
                  attributes: { contenteditable: "true" },
                },
              ],
        };
        if (comps && typeof (comps as any).add === "function") {
          // Insert at the beginning
          (comps as any).add(linkComp, { at: 0 });
          const newChildren: any = sel.components && sel.components();
          const models: any[] = newChildren?.models || [];
          anchor = models[0] || null;
          if (anchor && labelChild) {
            try {
              anchor.append && anchor.append(labelChild);
            } catch {
              /* ignore */
            }
          }
        }
      }

      if (!anchor) return;
      openLinkModal(ed, anchor);
    },
  });

  // Command: select submenu UL of the selected top-level item
  editor.Commands.add("hmenu-select-submenu", {
    run(ed) {
      const item: any = getSelectedMenuItem();
      if (!item) return;
      const existing = item.find && item.find("ul.submenu");
      if (existing && existing.length) {
        const ul = existing[0];
        ed.select && ed.select(ul);
      }
    },
  });
  const ensureCaretIcon = (item: any) => {
    if (!item || !item.find) return;
    // Find only a direct child anchor of the top-level LI
    let anchor: any = null;
    try {
      const children = item.components && item.components();
      const models: any[] = (children && children.models) || [];
      for (const m of models) {
        const tag = (m.get && m.get("tagName")) || m.getTagName?.();
        if ((tag || "").toLowerCase() === "a") {
          anchor = m;
          break;
        }
      }
    } catch {
      /* ignore */
    }
    // Prefer appending to anchor; if only label exists, append caret as a sibling on LI (not inside label) to avoid underline
    const label = (item.find && (item.find(".menu-label")[0] as any)) || null;
    const target = anchor || item;
    if (!target) return;
    // Avoid duplicate caret: check both target and the entire item scope
    let existingCaret = target.find && target.find("svg.caret-icon");
    if (!(existingCaret && existingCaret.length) && item && item.find) {
      existingCaret = item.find("svg.caret-icon");
    }
    if (existingCaret && existingCaret.length) return;
    // Append the caret SVG using GrapesJS SVG component types so viewBox casing is preserved immediately
    const caretDef: any = {
      type: "svg",
      tagName: "svg",
      selectable: false,
      hoverable: false,
      draggable: false,
      droppable: false,
      copyable: false,
      layerable: false,
      attributes: {
        class: "caret-icon",
        width: "12",
        height: "12",
        viewBox: "0 0 24 24",
        fill: "currentColor",
        xmlns: "http://www.w3.org/2000/svg",
      },
      components: [
        {
          type: "svg-in",
          tagName: "path",
          selectable: false,
          hoverable: false,
          draggable: false,
          droppable: false,
          attributes: {
            d: "M11.178 19.569a.998.998 0 0 0 1.644 0l9-13A.999.999 0 0 0 21 5H3a1.002 1.002 0 0 0-.822 1.569l9 13z",
          },
        },
      ],
    };
    target.append(caretDef);

    // Force immediate canvas update so the caret appears without refresh
    try {
      target.view && target.view.render && target.view.render();
    } catch {
      /* ignore */
    }
    try {
      item.view && item.view.render && item.view.render();
    } catch {
      /* ignore */
    }
    try {
      (editor as any).trigger &&
        (editor as any).trigger("component:update", target);
    } catch {
      /* ignore */
    }
  };
  const removeCaretIcon = (item: any) => {
    if (!item || !item.find) return;
    const anchorList: any[] = item.find("a");
    const anchor = anchorList && anchorList[0];
    let carets: any[] = [];
    if (anchor && anchor.find) {
      carets = anchor.find("svg.caret-icon") || [];
    }
    // Also look for carets appended to label/LI when no anchor exists
    if (!carets.length) {
      if (item && item.find) carets = item.find("svg.caret-icon") || [];
    }
    carets.forEach((c) => c.remove && c.remove());
    // Force re-render so the caret removal reflects immediately
    try {
      anchor && anchor.view && anchor.view.render && anchor.view.render();
    } catch {
      /* ignore */
    }
    try {
      item.view && item.view.render && item.view.render();
    } catch {
      /* ignore */
    }
    try {
      (editor as any).trigger &&
        (editor as any).trigger("component:update", item);
    } catch {
      /* ignore */
    }
  };

  const getSelectedMenuItem = () => {
    let sel: any = editor.getSelected();
    if (!sel) return null;
    if ((sel as any).get && (sel as any).get("type") === "hmenu-item")
      return sel;
    const el = sel.getEl && sel.getEl();
    if (!el) return null;
    const li = el.closest("li[data-menu-item]");
    if (!li) return null;
    const wrapper = (editor as any).getWrapper && (editor as any).getWrapper();
    if (!wrapper || !wrapper.find) return null;
    const list = wrapper.find("li[data-menu-item]");
    for (const c of list) {
      if (c.getEl && c.getEl() === li) return c;
    }
    return null;
  };

  editor.Commands.add("hmenu-add-item", {
    run(ed) {
      const item = getSelectedMenuItem();
      if (!item) return;
      // Parent UL
      const parent = item.parent && item.parent();
      if (!parent) return;
      // Build a simple item template using GrapesJS default text type
      const newItem = {
        type: "hmenu-item",
        attributes: { "data-menu-item": "true" },
        components: [
          {
            type: "text", // Use GrapesJS default text type
            content: "New Item",
            attributes: {
              class: "menu-label",
            },
          },
        ],
      } as any;
      const children: any = parent.components && parent.components();
      const models: any[] = children?.models || [];
      const idx = models.indexOf(item);
      const insertAt = idx >= 0 ? idx + 1 : models.length;
      let inserted: any = null;
      if (children && typeof (children as any).add === "function") {
        inserted = (children as any).add(newItem, { at: insertAt });
      } else {
        parent.append(newItem);
        const all: any[] =
          (parent.components && parent.components()?.models) || [];
        inserted = all[all.length - 1] || null;
      }
      if (Array.isArray(inserted)) inserted = inserted[0];
      if (inserted) {
        ed.select(inserted);
        try {
          ed.trigger && ed.trigger("component:update", inserted);
        } catch {
          /* ignore */
        }
        try {
          ed.store && ed.store();
        } catch {
          /* ignore */
        }
      }
    },
  });

  // Add a dropdown (submenu) to the selected top-level item, if not present
  editor.Commands.add("hmenu-add-dropdown", {
    run(ed) {
      const item: any = getSelectedMenuItem();
      if (!item) return;
      // If submenu already exists, select first subitem
      const existing = item.find && item.find("ul.submenu");
      if (existing && existing.length) {
        // Ensure caret exists if submenu exists
        ensureCaretIcon(item);
        const first = existing[0].find && existing[0].find("li")[0];
        if (first) {
          ed.select(first);
          return;
        }
      }
      // Create submenu structure
      const submenu = item.components().add({
        type: "hmenu-submenu",
        components: [
          {
            type: "hmenu-subitem",
            components: [
              {
                tagName: "a",
                attributes: { href: "#" },
                components: [
                  {
                    type: "text", // Use GrapesJS default text type
                    content: "Sub item",
                  },
                ],
              },
            ],
          },
        ],
      });
      // Add caret to anchor to indicate dropdown exists
      ensureCaretIcon(item);
      const created = Array.isArray(submenu) ? submenu[0] : submenu;
      if (created) {
        ed.select(created.find && created.find("li")[0]);
        try {
          ed.trigger && ed.trigger("component:update", created);
        } catch {
          /* ignore */
        }
        try {
          ed.store && ed.store();
        } catch {
          /* ignore */
        }
      }
    },
  });

  // Add a sibling subitem to the selected subitem
  editor.Commands.add("hmenu-add-subitem", {
    run(ed) {
      let sel: any = ed.getSelected();
      if (!sel) return;
      // If clicked inside, normalize to subitem LI
      if ((sel.get && sel.get("type")) !== "hmenu-subitem") {
        const el = sel.getEl && sel.getEl();
        const li = el && el.closest && el.closest("ul.submenu > li");
        if (li) {
          const wrapper = ed.getWrapper();
          if (!wrapper || !wrapper.find) return;
          const matches = wrapper.find("ul.submenu > li");
          for (const c of matches) {
            if (c.getEl && c.getEl() === li) {
              sel = c;
              break;
            }
          }
        }
      }
      if (!sel || (sel.get && sel.get("type")) !== "hmenu-subitem") return;
      const parent = sel.parent && sel.parent();
      if (!parent) return;
      const children: any = parent.components && parent.components();
      const models: any[] = children?.models || [];
      const idx = models.indexOf(sel);
      const insertAt = idx >= 0 ? idx + 1 : models.length;
      const newSub = {
        type: "hmenu-subitem",
        components: [
          {
            tagName: "a",
            attributes: { href: "#" },
            components: [
              {
                type: "text", // Use GrapesJS default text type
                content: "Sub item",
              },
            ],
          },
        ],
      } as any;
      let inserted: any = null;
      if (children && typeof (children as any).add === "function") {
        inserted = (children as any).add(newSub, { at: insertAt });
      } else {
        parent.append(newSub);
        const all: any[] =
          (parent.components && parent.components()?.models) || [];
        inserted = all[all.length - 1] || null;
      }
      if (Array.isArray(inserted)) inserted = inserted[0];
      if (inserted) {
        ed.select(inserted);
        try {
          ed.trigger && ed.trigger("component:update", inserted);
        } catch {
          /* ignore */
        }
        try {
          ed.store && ed.store();
        } catch {
          /* ignore */
        }
      }
    },
  });

  editor.Commands.add("hmenu-remove-subitem", {
    run(ed) {
      const sel: any = ed.getSelected();
      if (!sel) return;
      const type = sel.get && sel.get("type");
      if (type !== "hmenu-subitem") return;
      const parent = sel.parent && sel.parent();
      const children: any = parent?.components && parent.components();
      const models: any[] = children?.models || [];
      const idx = models.indexOf(sel);

      // If this is the last remaining subitem, remove it and then clean up the submenu and caret
      if (models.length <= 1) {
        // Remove the last subitem
        sel.remove && sel.remove();
        // Remove the submenu UL itself (now empty)
        const submenuUl = parent;
        // The parent of the submenu is the top-level li[data-menu-item]
        const topItem = submenuUl?.parent && submenuUl.parent();
        // Remove the submenu component from the top item
        submenuUl && submenuUl.remove && submenuUl.remove();
        // Remove caret from the top-level item
        if (topItem && (topItem.get && topItem.get("type")) === "hmenu-item") {
          removeCaretIcon(topItem);
          // Force re-render for immediate UI update
          try {
            topItem.view && topItem.view.render && topItem.view.render();
          } catch {
            /* ignore */
          }
          try {
            (ed as any).trigger &&
              (ed as any).trigger("component:update", topItem);
          } catch {
            /* ignore */
          }
          // Remove canvas-only indicator
          try {
            topItem.removeClass && topItem.removeClass("has-submenu");
          } catch {
            /* ignore */
          }
          // Select the parent top-level item
          ed.select && ed.select(topItem);
        }
        try {
          ed.store && ed.store();
        } catch {
          /* ignore */
        }
        return;
      }

      // Otherwise, just remove the selected subitem and select a sibling
      const next = models[Math.max(0, idx - 1)] || models[1];
      sel.remove && sel.remove();
      if (next) ed.select(next);
      try {
        ed.store && ed.store();
      } catch {
        /* ignore */
      }
    },
  });

  editor.Commands.add("hmenu-remove-item", {
    run(ed) {
      const item = getSelectedMenuItem();
      if (!item) return;
      const parent = item.parent && item.parent();
      if (!parent) return;
      const items: any = parent.components && parent.components();
      if (!items) return;
      const models: any[] = items.models ? items.models : [];
      if (models.length <= 1) return; // keep at least one item
      // Select previous or next before removing
      const index = models.indexOf(item);
      const nextSel = models[Math.max(0, index - 1)] || models[1] || parent;
      item.remove && item.remove();
      if (nextSel) ed.select(nextSel);
      try {
        ed.store && ed.store();
      } catch {
        /* ignore */
      }
    },
  });

  // Ensure selecting inner elements selects the menu item to reveal toolbar
  editor.on("component:selected", (comp: any) => {
    try {
      if (!comp) return;
      const ctype = (comp as any).get ? (comp as any).get("type") : undefined;
      if (
        ctype === "hmenu-item" ||
        ctype === "hmenu-subitem" ||
        ctype === "hmenu-submenu"
      )
        return;
      const el = comp.getEl && comp.getEl();
      if (!el || !el.closest) return;
      // If the selected element is the submenu UL itself, keep selection for styling
      if (el.matches && el.matches("ul.submenu")) return;
      // Prefer subitem selection if inside submenu
      let li = el.closest("ul.submenu > li");
      if (li) {
        const wrapper = editor.getWrapper && editor.getWrapper();
        if (!wrapper || !wrapper.find) return;
        const list = wrapper.find("ul.submenu > li");
        for (const c of list) {
          if (c.getEl && c.getEl() === li) {
            editor.select(c);
            return;
          }
        }
      }
      // Otherwise select top-level item
      li = el.closest("li[data-menu-item]");
      if (!li) return;
      const wrapper = editor.getWrapper && editor.getWrapper();
      if (!wrapper || !wrapper.find) return;
      const list = wrapper.find("li[data-menu-item]");
      for (const c of list) {
        if (c.getEl && c.getEl() === li) {
          editor.select(c);
          break;
        }
      }
    } catch {
      /* ignore */
    }
  });

  // Canvas: toggle submenu visibility for the selected item
  editor.on("component:selected", (comp: any) => {
    try {
      const doc = editor.Canvas.getDocument();
      if (!doc) return;
      // Close any previously opened items
      try {
        const opened = doc.querySelectorAll(
          ".pcf-hmenu .hmenu > li.gjs-canvas-open"
        );
        opened.forEach((n) => n.classList.remove("gjs-canvas-open"));
      } catch {
        /* ignore */
      }

      if (!comp) return;
      const el = comp.getEl && comp.getEl();
      if (!el || !el.closest) return;
      // If selection is inside a horizontal menu, open the corresponding top-level LI
      const insideMenu = el.closest(".pcf-hmenu");
      if (!insideMenu) return; // nothing to open
      const topLi = el.closest("li[data-menu-item]") as HTMLElement | null;
      if (topLi) {
        try {
          topLi.classList.add("gjs-canvas-open");
        } catch {
          /* ignore */
        }
      }
    } catch {
      /* ignore */
    }
  });

  // Canvas-only polish to make it nice to work with
  editor.on("load", () => {
    try {
      const doc = editor.Canvas.getDocument();
      if (!doc) return;
      const style = doc.createElement("style");
      style.textContent = `
        .pcf-hmenu .hmenu > li { outline: none; }
        /* Canvas: hide submenus by default; show only for selected or programmatically opened items */
        .pcf-hmenu .submenu { display: none !important; }
        .pcf-hmenu .hmenu > li.gjs-selected > .submenu,
        .pcf-hmenu .hmenu > li.gjs-canvas-open > .submenu { display: block !important; }
        /* Enforce consistent dropdown alignment in canvas */
        .pcf-hmenu .submenu { top: calc(100% + 2px) !important; margin: 0 !important; transform: none !important; }
        .pcf-hmenu .hmenu > li { height: 40px !important; display: flex !important; align-items: center !important; }
        .pcf-hmenu .hmenu { align-items: stretch !important; }
        .pcf-hmenu .hmenu > li > a { margin: 0 !important; height: 100% !important; }
        .pcf-hmenu .hmenu > li > .menu-label { margin: 0 !important; height: auto !important; }
        .pcf-hmenu .hmenu > li > a * { margin: 0 !important; }
          /* Remove bottom divider line under the horizontal menu in editor */
          .pcf-hmenu .hmenu { border-bottom: none !important; }
          /* In canvas, immediately show an indicator for items that have submenus, without relying on runtime caret SVG */
          .pcf-hmenu .hmenu > li.has-submenu > .menu-label::after,
          .pcf-hmenu .hmenu > li.has-submenu > a::after {
            content: '';
            display: inline-block;
            width: 0; height: 0;
            border-left: 5px solid transparent;
            border-right: 5px solid transparent;
            border-top: 6px solid currentColor;
            margin-left: 6px;
            opacity: 0.7;
            vertical-align: middle;
          }
          /* Hide separately injected caret SVG in canvas to avoid duplicate indicators */
          .pcf-hmenu .caret-icon { display: none !important; }
      `;
      doc.head.appendChild(style);
    } catch {
      /* ignore */
    }
  });

  // If a submenu UL gets removed manually, also remove the caret from its parent item
  editor.on("component:remove", (comp: any) => {
    try {
      if (!comp || !comp.getAttributes) return;
      const attrs = comp.getAttributes();
      const isUL =
        (comp.get && comp.get("tagName")) === "ul" ||
        comp.getTagName?.() === "ul";
      const hasSubmenuClass =
        (attrs &&
          typeof attrs.class === "string" &&
          attrs.class.split(" ").includes("submenu")) ||
        comp.getClasses?.().includes?.("submenu");
      if (isUL && hasSubmenuClass) {
        // parent should be the LI item
        const parent = comp.parent && comp.parent();
        if (parent && (parent.get && parent.get("type")) === "hmenu-item") {
          removeCaretIcon(parent);
          // Also drop canvas indicator class
          try {
            const hasAny =
              parent.find && parent.find("ul.submenu li").length > 0;
            if (!hasAny)
              parent.removeClass && parent.removeClass("has-submenu");
          } catch {
            /* ignore */
          }
        }
      }

      // Check if a horizontal menu component is being removed
      const isHMenu =
        (comp.get && comp.get("type")) === "hmenu" ||
        (attrs &&
          typeof attrs.class === "string" &&
          attrs.class.includes("pcf-hmenu"));

      if (isHMenu) {
        // Clean up global event handlers
        try {
          const el = comp.getEl && comp.getEl();
          if (el && (el as any).__hmenuCleanup) {
            (el as any).__hmenuCleanup();
            delete (el as any).__hmenuCleanup;
          }

          // Force remove from DOM
          if (el && el.parentNode) {
            el.parentNode.removeChild(el);
          }
        } catch {
          /* ignore */
        }

        // Clean up any global horizontal menu state
        try {
          const doc = editor.Canvas.getDocument();
          if (doc) {
            // Remove global event handler flag
            delete (doc as any).__pcfHmenuBound;

            // Clean up any orphaned menu elements
            const orphanedMenus = doc.querySelectorAll(".pcf-hmenu");
            orphanedMenus.forEach((menu: Element) => {
              try {
                // Check if this menu is still part of the component tree
                const wrapper = editor.getWrapper();
                if (wrapper) {
                  const found = wrapper.find(".pcf-hmenu");
                  let isInTree = false;
                  for (const c of found) {
                    if (c.getEl && c.getEl() === menu) {
                      isInTree = true;
                      break;
                    }
                  }
                  // If not in tree, remove from DOM
                  if (!isInTree && menu.parentNode) {
                    menu.parentNode.removeChild(menu);
                  }
                }
              } catch {
                /* ignore */
              }
            });
          }
        } catch {
          /* ignore */
        }

        // Force canvas refresh
        try {
          const canvas = editor.Canvas;
          if (canvas) {
            const frame = canvas.getFrameEl();
            if (frame && frame.contentDocument) {
              const body = frame.contentDocument.body;
              if (body) {
                body.normalize();
              }
            }
          }
        } catch {
          /* ignore */
        }
      }
    } catch {
      /* ignore */
    }
  });

  // Immediately show caret when a submenu or subitem is added in canvas
  editor.on("component:add", (comp: any) => {
    try {
      if (!comp) return;
      const el = comp.getEl && comp.getEl();
      if (!el) return;

      // Determine if the new component implies a submenu exists for a top-level item
      const isSubmenuUL =
        (el.tagName &&
          el.tagName.toLowerCase() === "ul" &&
          (el.classList?.contains("submenu") ||
            (comp.get && comp.get("type")) === "hmenu-submenu")) ||
        false;

      const insideSubmenu = !!el.closest?.("ul.submenu");

      if (!isSubmenuUL && !insideSubmenu) return;

      // Find the top-level LI DOM element
      const topLiEl = (
        isSubmenuUL
          ? el.closest("li[data-menu-item]")
          : el.closest("li[data-menu-item]")
      ) as HTMLElement | null;
      if (!topLiEl) return;

      // Map DOM to GrapesJS component for the top-level item and ensure caret
      const wrapper = editor.getWrapper && editor.getWrapper();
      if (!wrapper || !wrapper.find) return;
      const items = wrapper.find("li[data-menu-item]");
      for (const item of items) {
        if (item.getEl && item.getEl() === topLiEl) {
          // Add caret if missing and force re-render so it appears immediately
          ensureCaretIcon(item);
          // Toggle canvas indicator class immediately
          try {
            item.addClass && item.addClass("has-submenu");
          } catch {
            /* ignore */
          }
          try {
            item.view && item.view.render && item.view.render();
          } catch {
            /* ignore */
          }
          try {
            (editor as any).trigger &&
              (editor as any).trigger("component:update", item);
          } catch {
            /* ignore */
          }
          break;
        }
      }
    } catch {
      /* ignore */
    }
  });

  // Listen for canvas clear event
  editor.on("component:remove:before", (comp: any) => {
    try {
      // If wrapper is being cleared, clean up all menus
      if (comp && comp.get && comp.get("type") === "wrapper") {
        const doc = editor.Canvas.getDocument();
        if (doc) {
          const allMenus = doc.querySelectorAll(".pcf-hmenu");
          allMenus.forEach((menu: Element) => {
            try {
              if ((menu as any).__hmenuCleanup) {
                (menu as any).__hmenuCleanup();
                delete (menu as any).__hmenuCleanup;
              }
              if (menu.parentNode) {
                menu.parentNode.removeChild(menu);
              }
            } catch {
              /* ignore */
            }
          });

          delete (doc as any).__pcfHmenuBound;
        }
      }
    } catch {
      /* ignore */
    }
  });
}
