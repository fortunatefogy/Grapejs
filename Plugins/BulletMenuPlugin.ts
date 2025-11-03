import { Editor } from "grapesjs";

export function advancedBulletMenuPlugin(editor: Editor) {
  // Helper function to normalize URLs
  const normalizeUrl = (url: string): string => {
    if (!url || typeof url !== "string") {
      return "";
    }
    if (url.match(/^https?:\/\//)) {
      return url;
    }
    if (url.match(/^www\./)) {
      return `https://${url}`;
    }
    if (url.includes(".") && !url.includes(" ")) {
      return `https://${url}`;
    }
    return url;
  };

  // Helper function to inject CSS into both document and canvas
  const injectStyles = (cssContent: string, styleId: string) => {
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = cssContent;
      document.head.appendChild(style);
    }

    try {
      const canvas = editor.Canvas.getDocument();
      if (canvas && !canvas.getElementById(styleId)) {
        const canvasStyle = canvas.createElement("style");
        canvasStyle.id = styleId;
        canvasStyle.textContent = cssContent;
        canvas.head.appendChild(canvasStyle);
      }
    } catch (e) {
      console.warn(`Could not inject styles into canvas for ${styleId}:`, e);
    }
  };

  // Ensure RTE toolbar has proper styling
  editor.on("load", () => {
    const rteStyles = `
      .gjs-rte-toolbar {
        background-color: #333 !important;
        border: 1px solid #555 !important;
        border-radius: 4px !important;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3) !important;
        padding: 5px !important;
        display: flex !important;
        gap: 2px !important;
        z-index: 1000 !important;
      }
      .gjs-rte-btn {
        background-color: #444 !important;
        color: #fff !important;
        border: 1px solid #666 !important;
        border-radius: 3px !important;
        padding: 5px 8px !important;
        cursor: pointer !important;
        font-size: 12px !important;
        transition: background-color 0.2s !important;
      }
      .gjs-rte-btn:hover {
        background-color: #555 !important;
      }
      .gjs-rte-btn.gjs-rte-active {
        background-color: #007bff !important;
        border-color: #0056b3 !important;
      }
      
      /* Hide default toolbar for advanced bullet list components */
      .gjs-advanced-bullet-item.gjs-selected .gjs-toolbar,
      .gjs-advanced-bullet-list.gjs-selected .gjs-toolbar {
        display: none !important;
      }
      
      /* Hide default blue toolbar when nothing specific is selected after deletion */
      .gjs-toolbar:empty {
        display: none !important;
      }
    `;

    injectStyles(rteStyles, "gjs-rte-custom-styles");
  });

  // Show modal to edit link href
  function showEditLinkModal(linkEl: HTMLAnchorElement, component?: any) {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <div style="padding:10px;">
        <label style="display:block; font-weight:600; margin-bottom:6px;">Edit Link (href)</label>
        <input id="edit-link-input" type="text" placeholder="#" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;" value="${
          linkEl.getAttribute("href") || ""
        }">
        <div style="margin-top:12px; text-align:right;">
          <button id="edit-link-save" class="gjs-btn-prim">Save</button>
        </div>
      </div>
    `;
    editor.Modal.setTitle("Edit Link");
    editor.Modal.setContent(wrapper);
    editor.Modal.open();
    // Prevent closing the modal by clicking the overlay; only allow save button to close
    try {
      const mdlContainer = document.querySelector(
        ".gjs-mdl-container"
      ) as HTMLElement | null;
      if (mdlContainer) {
        const overlayClickHandler = (ev: MouseEvent) => {
          if (ev.target === mdlContainer) {
            ev.stopPropagation();
            ev.preventDefault();
            const input =
              wrapper.querySelector<HTMLInputElement>("#edit-link-input");
            if (input) input.focus();
          }
        };
        mdlContainer.addEventListener("click", overlayClickHandler, true);
        try {
          editor.on &&
            editor.on("modal:close", () => {
              try {
                mdlContainer.removeEventListener(
                  "click",
                  overlayClickHandler,
                  true
                );
              } catch (_) {
                void 0;
              }
            });
        } catch (_) {
          void 0;
        }
      }
    } catch (_) {
      void 0;
    }
    const saveBtn = wrapper.querySelector("#edit-link-save");
    const inputEl = wrapper.querySelector("#edit-link-input");
    if (saveBtn && inputEl) {
      saveBtn.addEventListener("click", () => {
        let url = ((inputEl as HTMLInputElement).value || "").trim();
        if (!url) return;
        url = normalizeUrl(url);

        try {
          linkEl.setAttribute("href", url);
          linkEl.style.color = "#007bff";
          linkEl.setAttribute("target", "_blank");
          linkEl.setAttribute("rel", "noopener noreferrer");
        } catch (e) {
          // ignore
        }

        if (component && component.getEl) {
          try {
            const parentEl = component.getEl();
            if (parentEl && parentEl.contains(linkEl)) {
              if (component.set) {
                component.set("content", parentEl.innerHTML);
              }
              component.view &&
                component.view.render &&
                component.view.render();
            } else if (component.set) {
              component.set("href", url);
              component.view &&
                component.view.render &&
                component.view.render();
            }
          } catch (err) {
            // Fallback already applied to DOM
          }
        }

        editor.Modal.close();
      });
    }
  }

  // Listen for link clicks in ABM text elements while editing
  editor.on("rte:enable", (view: any, rte: any) => {
    const component = view.model;
    if (component && isAbmTextComponent(component)) {
      let doc: Document | null = null;
      try {
        doc = rte && rte.doc ? rte.doc : null;
      } catch (_) {
        /* ignore */
      }
      let el: HTMLElement | null = null;
      if (!doc) {
        el = view.el as HTMLElement;
      }

      if (doc && (doc as any)._editLinkHandler) {
        doc.removeEventListener("click", (doc as any)._editLinkHandler, true);
        (doc as any)._editLinkHandler = null;
      }
      if (el && (el as any)._editLinkHandler) {
        el.removeEventListener("click", (el as any)._editLinkHandler, true);
        (el as any)._editLinkHandler = null;
      }

      const handler = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target && target.tagName === "A") {
          e.preventDefault();
          showEditLinkModal(target as HTMLAnchorElement, component);
        }
      };

      if (doc) {
        (doc as any)._editLinkHandler = handler;
        doc.addEventListener("click", handler, true);
      } else if (el) {
        (el as any)._editLinkHandler = handler;
        el.addEventListener("click", handler, true);
      }
    }
  });

  // Clean up listener on disable
  editor.on("rte:disable", (view: any, rte: any) => {
    const component = view.model;
    if (component && isAbmTextComponent(component)) {
      let doc: Document | null = null;
      try {
        doc = rte && rte.doc ? rte.doc : null;
      } catch (_) {
        /* ignore */
      }
      let el: HTMLElement | null = null;
      if (!doc) {
        el = view.el as HTMLElement;
      }
      if (doc && (doc as any)._editLinkHandler) {
        doc.removeEventListener("click", (doc as any)._editLinkHandler, true);
        (doc as any)._editLinkHandler = null;
      }
      if (el && (el as any)._editLinkHandler) {
        el.removeEventListener("click", (el as any)._editLinkHandler, true);
        (el as any)._editLinkHandler = null;
      }
    }
  });

  // Add custom RTE button for link
  editor.RichTextEditor.add("custom-link", {
    icon: '<i class="fa fa-link"></i>',
    attributes: { title: "Insert link" },
    result: (rte: any, action: any) => {
      const sel = rte.selection || rte.doc.getSelection();
      if (!sel || sel.isCollapsed) {
        editor.Modal.open({
          title: "No text selected",
          content: "Please select some text to link.",
        });
        return;
      }

      const wrapper = document.createElement("div");
      wrapper.innerHTML = `
        <div style="padding:10px;">
          <label style="display:block; font-weight:600; margin-bottom:6px;">Link (href)</label>
          <input id="custom-link-input" type="text" placeholder="https://" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
          <div style="margin-top:12px; text-align:right;">
            <button id="custom-link-save" class="gjs-btn-prim">Save</button>
          </div>
        </div>
      `;
      editor.Modal.setTitle("Insert Link");
      editor.Modal.setContent(wrapper);
      editor.Modal.open();
      // Prevent closing the modal by clicking overlay; only Save should close it
      try {
        const mdlContainer = document.querySelector(
          ".gjs-mdl-container"
        ) as HTMLElement | null;
        if (mdlContainer) {
          const overlayClickHandler = (ev: MouseEvent) => {
            if (ev.target === mdlContainer) {
              ev.stopPropagation();
              ev.preventDefault();
              const input =
                wrapper.querySelector<HTMLInputElement>("#custom-link-input");
              if (input) input.focus();
            }
          };
          mdlContainer.addEventListener("click", overlayClickHandler, true);
          try {
            editor.on &&
              editor.on("modal:close", () => {
                try {
                  mdlContainer.removeEventListener(
                    "click",
                    overlayClickHandler,
                    true
                  );
                } catch (_) {
                  void 0;
                }
              });
          } catch (_) {
            void 0;
          }
        }
      } catch (_) {
        void 0;
      }
      const saveBtn = wrapper.querySelector("#custom-link-save");
      const inputEl = wrapper.querySelector("#custom-link-input");
      if (saveBtn && inputEl) {
        saveBtn.addEventListener("click", () => {
          let url = ((inputEl as HTMLInputElement).value || "").trim();
          if (!url) return;
          url = normalizeUrl(url);
          const range = sel.getRangeAt(0);
          const a = document.createElement("a");
          a.href = url;
          a.style.color = "#007bff";
          a.target = "_blank";
          a.rel = "noopener noreferrer";
          a.textContent = range.toString();
          range.deleteContents();
          range.insertNode(a);
          editor.Modal.close();
        });
      }
    },
  });

  // Add the custom RTE button to ABM text elements
  editor.on("rte:enable", (view: any, rte: any) => {
    const component = view.model;
    if (component && isAbmTextComponent(component)) {
      const standardButtons = ["bold", "italic", "underline", "strikethrough"];
      const currentButtons = rte.getToolbarButtons();

      standardButtons.forEach((buttonName) => {
        if (!currentButtons.includes(buttonName)) {
          rte.addToolbarButton(buttonName);
        }
      });

      if (!currentButtons.includes("custom-link")) {
        rte.addToolbarButton("custom-link");
      }

      if (!currentButtons.includes("forecolor")) {
        rte.addToolbarButton("forecolor");
      }

      setTimeout(() => {
        const toolbar = document.querySelector(".gjs-rte-toolbar");
        if (toolbar) {
          (toolbar as HTMLElement).style.display = "flex";
          (toolbar as HTMLElement).style.backgroundColor = "#333";
          (toolbar as HTMLElement).style.border = "1px solid #555";
          (toolbar as HTMLElement).style.borderRadius = "4px";
          (toolbar as HTMLElement).style.padding = "5px";
          (toolbar as HTMLElement).style.zIndex = "1000";
        }
      }, 10);
    }
  });

  const bm = editor.BlockManager;
  const domc = editor.DomComponents;
  const DATA_ATTR = "data-advanced-text-control" as const;
  const OVERLAY_ATTR = "data-hide-advanced-text-overlays" as const;

  // Identify ABM text component regardless of underlying type
  const isAbmTextComponent = (cmp: any): boolean => {
    try {
      const type = cmp?.get && cmp.get("type");
      const attrs = cmp?.getAttributes ? cmp.getAttributes() : {};
      const klass = (attrs?.class ? String(attrs.class) : "").split(/\s+/);
      const hasFlag = attrs && attrs[DATA_ATTR] === "1";
      return (
        type === "advanced-text-element" ||
        (type === "text" && (klass.includes("abm-text") || hasFlag))
      );
    } catch (_) {
      return false;
    }
  };

  // Find ABM text component inside a container/list item
  const findAbmTextIn = (root: any): any | null => {
    try {
      if (!root) return null;
      if (typeof root.find === "function") {
        const res = root.find(".abm-text");
        if (res && res[0]) return res[0];
      }
      if (typeof root.findType === "function") {
        const res2 = root.findType("advanced-text-element");
        if (res2 && res2[0]) return res2[0];
      }
    } catch (_) {
      /* ignore */
    }
    return null;
  };

  // Convert legacy advanced-text-element to default GrapesJS 'text' type
  const migrateAdvancedTextToDefault = (cmp: any): any | null => {
    try {
      if (!cmp || cmp.get?.("type") !== "advanced-text-element") return cmp;
      const parent = cmp.parent && cmp.parent();
      if (!parent) return cmp;
      // Determine index in parent
      let index = -1;
      try {
        const col = parent.components && parent.components();
        if (col) {
          if (typeof col.indexOf === "function") index = col.indexOf(cmp);
          else if (Array.isArray((col as any).models))
            index = (col as any).models.indexOf(cmp);
        }
      } catch (_) {
        /* ignore */
      }
      const attrs = cmp.getAttributes ? { ...cmp.getAttributes() } : {};
      const style = cmp.getStyle ? { ...cmp.getStyle() } : {};
      const content = cmp.get ? cmp.get("content") : undefined;
      const classes = (attrs.class ? String(attrs.class) : "").split(/\s+/);
      if (!classes.includes("abm-text")) classes.push("abm-text");
      attrs.class = classes.filter(Boolean).join(" ");
      if (!attrs[DATA_ATTR]) attrs[DATA_ATTR] = "1";
      const added = parent.components().add(
        {
          type: "text",
          attributes: attrs,
          content: content != null ? content : "",
          draggable: false,
          editable: true,
          toolbar: false,
        },
        { at: index >= 0 ? index : undefined }
      );
      try {
        added?.addStyle && added.addStyle(style || {});
      } catch (_) {
        /* ignore */
      }
      try {
        cmp.remove && cmp.remove();
      } catch (_) {
        /* ignore */
      }
      return added;
    } catch (_) {
      return cmp;
    }
  };

  const getDoc = (): Document | null => {
    try {
      return editor.Canvas.getDocument();
    } catch (_) {
      return null;
    }
  };

  const setOverlayHidden = (hidden: boolean): void => {
    try {
      const doc = getDoc();
      const body = doc?.body;
      if (!body) return;
      if (hidden) body.setAttribute(OVERLAY_ATTR, "1");
      else body.removeAttribute(OVERLAY_ATTR);
    } catch (_) {
      // Ignore errors
    }
  };

  const isAdvancedTextElement = (cmp: any): boolean => {
    try {
      const attrs = cmp?.getAttributes ? cmp.getAttributes() : {};
      return !!attrs && attrs[DATA_ATTR] === "1";
    } catch (_) {
      return false;
    }
  };

  const getAdvancedTextRoot = (cmp: any): any | null => {
    try {
      let cur = cmp;
      while (cur) {
        if (isAdvancedTextElement(cur)) return cur;
        cur = cur.parent ? cur.parent() : null;
      }
    } catch (_) {
      //
    }
    return null;
  };

  // Enhanced CSS with improved selection behavior
  const ADVANCED_BULLET_CSS = `
  /* Advanced Bullet Menu Styles - Enhanced Single Click Selection */
  
  /* Outer container wrapper styling with dashed border */
  .abm-list-wrapper {
    border: 1px dashed #999;
    border-radius: 4px;
    padding: 12px;
    background: transparent;
  }
  
  /* Container div styling */
  .abm-container {
    display: flex;
    align-items: center;
    gap: 8px;
    // margin: 2px 0;
    line-height: 1.5;
    padding: 4px;
    border-radius: 4px;
    transition: all 0.15s ease;
    min-height: 20px;
    cursor: pointer;
  }
  
  /* Text element styling */
  .abm-text {
    flex: 1;
    cursor: text;
    line-height: 1.5;
    text-decoration: none !important;
    color: #000000;
    transition: all 0.15s ease;
    padding: 4px;
    border-radius: 3px;
    min-height: 18px;
    display: inline-block;
    position: relative;
  }
  
  /* Enhanced focus states for immediate editing */
  .abm-text:focus,
  .abm-text[contenteditable="true"] {
    outline: none !important;
    cursor: text !important;
  }
  
  /* Link state styling */
  .abm-text.has-link { 
    color: #0078d4; 
    cursor: pointer;
  }
  
  /* ENHANCED SELECTION STYLES FOR SINGLE CLICK BEHAVIOR */
  
  /* List item base styling */
  li.gjs-advanced-bullet-item {
    display: list-item;
    list-style-position: outside;
    line-height: 1.6;
    cursor: pointer;
    border-radius: 6px;
    // padding: 6px 8px;
    // margin: 2px 0;
    position: relative;
    border: none !important;
    background: transparent !important;
    box-shadow: none !important;
    transition: none !important;
  }
  /* Plain blue border only on selected item */
  li.gjs-advanced-bullet-item.selected-for-editing {
    /* Remove border from the LI itself so bullet marker stays outside */
    border: none !important;
  }
  /* Apply blue border only around the text control */
  li.gjs-advanced-bullet-item.selected-for-editing > .abm-container > .abm-text {
    border: 2px solid #1d6fe8 !important;
  /* Removed background override so Style Manager background colors remain visible */
    box-shadow: none !important;
    transform: none !important;
    border-radius: 3px;
  }
  /* Remove hover visual noise */
  li.gjs-advanced-bullet-item:hover:not(.selected-for-editing) {
    background: transparent !important;
  }
  
  /* Clear any conflicting GrapesJS selection styles */
  li.gjs-advanced-bullet-item.gjs-selected {
    border: none !important;
    background-color: transparent !important;
    box-shadow: none !important;
    transform: none !important;
  }
  
  /* Advanced list styling */
  ul.gjs-advanced-bullet-list {
    list-style-position: outside;
    padding-left: 20px;
    margin: 4px 0;
    line-height: 1.6;
  }
  
  /* Advanced depth-based bullet styles */
  li.gjs-advanced-bullet-item[data-depth="1"] { 
    list-style-type: disc; 
    margin-left: 0;
  }
  li.gjs-advanced-bullet-item[data-depth="2"] { 
    list-style-type: circle; 
    margin-left: 4px;
  }
  li.gjs-advanced-bullet-item[data-depth="3"] { 
    list-style-type: square; 
    margin-left: 8px;
  }
  li.gjs-advanced-bullet-item[data-depth]:not([data-depth="1"]):not([data-depth="2"]):not([data-depth="3"]) { 
    list-style-type: disc; 
    margin-left: 12px;
  }
  
  /* Advanced nested spacing */
  ul.gjs-advanced-bullet-list ul.gjs-advanced-bullet-list {
    padding-left: 24px;
    margin: 0;
  }
  
  /* Enhanced Marker styling with selectability and color customization */
  li.gjs-advanced-bullet-item::marker { 
    color: var(--bullet-color, #555); 
    font-size: 1em;
    cursor: pointer;
  }
  
  /* Make bullets selectable and hoverable */
  li.gjs-advanced-bullet-item {
    position: relative;
  }
  
  /* Create a pseudo-element to make the bullet area more clickable */
  li.gjs-advanced-bullet-item::before {
    content: '';
    position: absolute;
    left: -25px;
    top: 0;
    width: 20px;
    height: 100%;
    cursor: pointer;
    z-index: 1;
  }
  
  /* Bullet selection indicator */
  li.gjs-advanced-bullet-item.bullet-selected::marker {
    color: var(--bullet-color, #007bff);
    font-weight: bold;
    text-shadow: 0 0 3px rgba(0, 123, 255, 0.5);
  }
  
  /* Bullet hover effect */
  li.gjs-advanced-bullet-item:hover::marker {
    color: var(--bullet-color, #007bff);
    transform: scale(1.1);
    transition: all 0.2s ease;
  }
  
  /* Custom bullet colors with direct CSS selectors for all modes including preview */
  li.gjs-advanced-bullet-item[data-bullet-color="#555"]::marker,
  li.gjs-advanced-bullet-item[data-bullet-color="#555"] {
    --bullet-color: #555;
  }
  li.gjs-advanced-bullet-item[data-bullet-color="#555"] li.gjs-advanced-bullet-item:not([data-bullet-color])::marker {
    color: #555 !important;
  }
  
  li.gjs-advanced-bullet-item[data-bullet-color="#000000"]::marker,
  li.gjs-advanced-bullet-item[data-bullet-color="#000000"] {
    --bullet-color: #000000;
  }
  li.gjs-advanced-bullet-item[data-bullet-color="#000000"] li.gjs-advanced-bullet-item:not([data-bullet-color])::marker {
    color: #555 !important;
  }
  
  li.gjs-advanced-bullet-item[data-bullet-color="#007bff"]::marker,
  li.gjs-advanced-bullet-item[data-bullet-color="#007bff"] {
    --bullet-color: #007bff;
  }
  li.gjs-advanced-bullet-item[data-bullet-color="#007bff"] li.gjs-advanced-bullet-item:not([data-bullet-color])::marker {
    color: #555 !important;
  }
  
  li.gjs-advanced-bullet-item[data-bullet-color="#dc3545"]::marker,
  li.gjs-advanced-bullet-item[data-bullet-color="#dc3545"] {
    --bullet-color: #dc3545;
  }
  li.gjs-advanced-bullet-item[data-bullet-color="#dc3545"] li.gjs-advanced-bullet-item:not([data-bullet-color])::marker {
    color: #555 !important;
  }
  
  li.gjs-advanced-bullet-item[data-bullet-color="#28a745"]::marker,
  li.gjs-advanced-bullet-item[data-bullet-color="#28a745"] {
    --bullet-color: #28a745;
  }
  li.gjs-advanced-bullet-item[data-bullet-color="#28a745"] li.gjs-advanced-bullet-item:not([data-bullet-color])::marker {
    color: #555 !important;
  }
  
  li.gjs-advanced-bullet-item[data-bullet-color="#fd7e14"]::marker,
  li.gjs-advanced-bullet-item[data-bullet-color="#fd7e14"] {
    --bullet-color: #fd7e14;
  }
  li.gjs-advanced-bullet-item[data-bullet-color="#fd7e14"] li.gjs-advanced-bullet-item:not([data-bullet-color])::marker {
    color: #555 !important;
  }
  
  li.gjs-advanced-bullet-item[data-bullet-color="#6f42c1"]::marker,
  li.gjs-advanced-bullet-item[data-bullet-color="#6f42c1"] {
    --bullet-color: #6f42c1;
  }
  li.gjs-advanced-bullet-item[data-bullet-color="#6f42c1"] li.gjs-advanced-bullet-item:not([data-bullet-color])::marker {
    color: #555 !important;
  }
  
  li.gjs-advanced-bullet-item[data-bullet-color="#e83e8c"]::marker,
  li.gjs-advanced-bullet-item[data-bullet-color="#e83e8c"] {
    --bullet-color: #e83e8c;
  }
  li.gjs-advanced-bullet-item[data-bullet-color="#e83e8c"] li.gjs-advanced-bullet-item:not([data-bullet-color])::marker {
    color: #555 !important;
  }
  
  /* Enhanced bullet visibility with fallback color support - prevent inheritance */
  li.gjs-advanced-bullet-item::marker {
    color: var(--bullet-color, #555);
    transition: color 0.2s ease, transform 0.2s ease;
  }
  
  /* Reset bullet color inheritance for child items without explicit color */
  li.gjs-advanced-bullet-item:not([data-bullet-color]) {
    --bullet-color: #555;
  }
  
  /* Ensure child items don't inherit parent bullet colors */
  li.gjs-advanced-bullet-item li.gjs-advanced-bullet-item:not([data-bullet-color])::marker {
    color: #555 !important;
  }
  
  /* Ensure bullet colors work in preview mode */
  .gjs-preview li.gjs-advanced-bullet-item::marker {
    color: var(--bullet-color, #555);
  }
  
  /* Preview mode inheritance fix */
  .gjs-preview li.gjs-advanced-bullet-item:not([data-bullet-color]) {
    --bullet-color: #555;
  }
  
  .gjs-preview li.gjs-advanced-bullet-item li.gjs-advanced-bullet-item:not([data-bullet-color])::marker {
    color: #555 !important;
  }
  
  /* Bullet focus styles for accessibility */
  li.gjs-advanced-bullet-item:focus::marker,
  li.gjs-advanced-bullet-item.focused::marker {
    outline: 2px solid #007bff;
    outline-offset: 2px;
  }
  
  /* Keep marker consistent; enhanced with selectability */
  
  /* Drag placeholder */
  .gjs-dashed li.gjs-advanced-bullet-item {
    border: 2px dashed #667eea;
    background: rgba(102, 126, 234, 0.15);
    min-height: 24px;
    border-radius: 6px;
  }
  
  /* Removed rule that forced transparent background during selection to allow custom backgrounds */
  
  /* Remove text decorations */
  .abm-text,
  .abm-text:visited,
  .abm-text:focus,
  .gjs-cv-canvas .abm-text,
  .gjs-preview .abm-text {
    text-decoration: none !important;
  }

  /* Placeholder style when user intentionally clears text (data flag set later) */
  .abm-text[data-abm-empty="1"]:empty:before {
    content: attr(data-placeholder);
    color: #888;
    font-style: italic;
    pointer-events: none;
  }
  
  /* Override GrapesJS interference */
  ul.gjs-advanced-bullet-list,
  ul.gjs-advanced-bullet-list li.gjs-advanced-bullet-item:not(.selected-for-editing) {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    outline: none !important;
  }
  
  /* Disable default hover effects in canvas and preview */
  .gjs-cv-canvas .abm-container:hover,
  .gjs-preview .abm-container:hover,
  .gjs-cv-canvas .gjs-advanced-bullet-item:hover,
  .gjs-preview .gjs-advanced-bullet-item:hover,
  .gjs-cv-canvas .abm-text:hover,
  .gjs-preview .abm-text:hover {
    background-color: transparent !important;
    box-shadow: none !important;
    transform: none !important;
  }

  /* Removed global toolbar hide on empty canvas; JS manages this state precisely */
  
  /* Hide dashed border in preview mode */
  .gjs-preview-mode .abm-list-wrapper { border: none !important; padding: 0 !important; }
  
  /* Hide dashed border in final output (when not in GrapesJS editor iframe) */
  body:not(.gjs-dashed) .abm-list-wrapper:not([data-gjs-type]) { border: none !important; padding: 0 !important; }
  
  /* Alternative: hide border when wrapper doesn't have GrapesJS data attributes */
  .abm-list-wrapper:not([data-gjs-type]):not([class*="gjs-"]) { border: none; padding: 0; }
  `;

  const injectAdvancedStyles = () => {
    injectStyles(ADVANCED_BULLET_CSS, "gjs-advanced-bullet-css");

    if (!(editor as any).__advancedBulletCssExported) {
      editor.addStyle(ADVANCED_BULLET_CSS);
      (editor as any).__advancedBulletCssExported = true;
    }
  };

  // Function to inject dynamic bullet color styles for any custom color
  const injectBulletColorStyle = (color: string) => {
    if (!color || color === "#555") return; // Skip default color

    const escapedColor = color.replace(/[^a-zA-Z0-9#]/g, ""); // Sanitize color
    const styleId = `gjs-bullet-color-${escapedColor.replace("#", "")}`;

    // Create CSS rule for this specific color with inheritance prevention
    const colorCSS = `
      li.gjs-advanced-bullet-item[data-bullet-color="${color}"]::marker {
        color: ${color} !important;
      }
      li.gjs-advanced-bullet-item[data-bullet-color="${color}"] {
        --bullet-color: ${color};
      }
      /* Prevent inheritance - child items without explicit color should use default */
      li.gjs-advanced-bullet-item[data-bullet-color="${color}"] li.gjs-advanced-bullet-item:not([data-bullet-color])::marker {
        color: #555 !important;
      }
      li.gjs-advanced-bullet-item[data-bullet-color="${color}"] li.gjs-advanced-bullet-item:not([data-bullet-color]) {
        --bullet-color: #555;
      }
      /* Ensure preview mode support */
      .gjs-preview li.gjs-advanced-bullet-item[data-bullet-color="${color}"]::marker {
        color: ${color} !important;
      }
      .gjs-preview li.gjs-advanced-bullet-item[data-bullet-color="${color}"] li.gjs-advanced-bullet-item:not([data-bullet-color])::marker {
        color: #555 !important;
      }
    `;

    // Inject into both main document and canvas
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = colorCSS;
      document.head.appendChild(style);
    }

    try {
      const canvas = editor.Canvas.getDocument();
      if (canvas && !canvas.getElementById(styleId)) {
        const canvasStyle = canvas.createElement("style");
        canvasStyle.id = styleId;
        canvasStyle.textContent = colorCSS;
        canvas.head.appendChild(canvasStyle);
      }
    } catch (e) {
      console.warn(`Could not inject bullet color styles for ${color}:`, e);
    }
  };

  const calculateItemDepth = (component: any): number => {
    let depth = 1;
    let parent = component.parent && component.parent();
    while (parent) {
      if (parent.get && parent.get("type") === "advanced-bullet-list-item") {
        depth++;
      }
      parent = parent.parent && parent.parent();
    }
    return depth;
  };

  const applyAdvancedDepthStyling = (component: any) => {
    try {
      const depth = calculateItemDepth(component);
      component.addAttributes &&
        component.addAttributes({ "data-depth": String(depth) });

      const explicit = component.get && component.get("listStyleType");
      const el = component.getEl && component.getEl();

      let storedStyle = null;
      if (el) {
        storedStyle =
          el.getAttribute("data-list-style-type") || el.style.listStyleType;
      }

      let finalStyle = explicit || storedStyle;

      if (finalStyle && finalStyle !== "disc") {
        component.addStyle &&
          component.addStyle({ "list-style-type": finalStyle });
        component.addAttributes &&
          component.addAttributes({ "data-list-style-type": finalStyle });
        if (el) {
          el.style.listStyleType = finalStyle;
          el.setAttribute("style", `list-style-type: ${finalStyle};`);
        }
      } else {
        const listStyleMap: { [key: number]: string } = {
          1: "disc",
          2: "circle",
          3: "square",
        };
        const listStyle = listStyleMap[depth] || "disc";

        if (!explicit && !storedStyle) {
          component.set && component.set("listStyleType", listStyle);
          component.addStyle &&
            component.addStyle({ "list-style-type": listStyle });
          component.addAttributes &&
            component.addAttributes({ "data-list-style-type": listStyle });
          if (el) {
            el.style.listStyleType = listStyle;
            el.setAttribute("style", `list-style-type: ${listStyle};`);
          }
        }
      }

      updateAdvancedColorLogic(component);
    } catch (error) {
      console.warn("Error applying advanced depth styling:", error);
    }
  };

  // Track empty canvas state to hide default blue toolbox
  const updateEmptyCanvasToolboxVisibility = () => {
    try {
      const wrapper = editor.getWrapper && editor.getWrapper();
      const doc = editor.Canvas?.getDocument?.();
      const body = doc?.body;
      if (!wrapper || !body) return;

      // Count only real rendered components (skip script/style/etc.)
      let childCount = 0;
      try {
        const coll = wrapper.components && wrapper.components();
        if (coll) {
          const arr = Array.isArray(coll)
            ? coll
            : typeof (coll as any).toArray === "function"
            ? (coll as any).toArray()
            : (coll as any).models || [];
          childCount = arr.filter((c: any) => {
            try {
              const t = c.get && c.get("type");
              return !!t; // any component counts
            } catch (_) {
              return false;
            }
          }).length;
        }
      } catch (_) {
        /* ignore */
      }

      const hostBody = document && document.body;

      const hideAllToolbars = (hide: boolean) => {
        try {
          const toolbarDocs: Array<Document | null> = [document, doc];
          toolbarDocs.forEach((d) => {
            if (!d) return;
            const bars = d.querySelectorAll(
              ".gjs-toolbar, .gjs-toolbar-item, .gjs-toolbar-panel"
            );
            bars.forEach((el) => {
              const hel = el as HTMLElement;
              if (hide) {
                if (!hel.getAttribute("data-abm-hide-managed")) {
                  hel.setAttribute("data-abm-hide-managed", "1");
                }
                hel.style.display = "none";
              } else if (hel.getAttribute("data-abm-hide-managed") === "1") {
                hel.style.display = "";
              }
            });
          });
        } catch (_) {
          /* ignore */
        }
      };

      if (childCount === 0) {
        body.setAttribute("data-empty-canvas", "1");
        hostBody && hostBody.setAttribute("data-empty-canvas", "1");
        hideAllToolbars(true);
        try {
          editor.select(null as any); // ensure no stale selection keeps toolbar alive
        } catch (_) {
          /* ignore */
        }
      } else {
        body.removeAttribute("data-empty-canvas");
        hostBody && hostBody.removeAttribute("data-empty-canvas");
        hideAllToolbars(false);
      }
    } catch (_) {
      /* ignore */
    }
  };

  // Observe wrapper mutations to auto-update empty canvas state
  let __abmEmptyObserver: MutationObserver | null = null;
  const initEmptyCanvasObserver = () => {
    try {
      const wrapper = editor.getWrapper && editor.getWrapper();
      const el = wrapper && wrapper.getEl && wrapper.getEl();
      if (!el || __abmEmptyObserver) return;
      __abmEmptyObserver = new MutationObserver(() => {
        // Microtask -> debounce via rAF
        requestAnimationFrame(() => updateEmptyCanvasToolboxVisibility());
      });
      __abmEmptyObserver.observe(el, { childList: true, subtree: false });
    } catch (_) {
      /* ignore */
    }
  };

  const updateAdvancedColorLogic = (listItem: any) => {
    const container =
      listItem.findType && listItem.findType("advanced-text-container")[0];
    if (!container) return;

    const textComponent = findAbmTextIn(container);
    if (!textComponent) return;

    const textEl = textComponent.view && textComponent.view.el;
    if (!textEl) return;

    textEl.classList.remove("has-link");
    textEl.removeAttribute("data-custom-color");

    const customColor = textComponent.get && textComponent.get("textColor");
    if (customColor && customColor !== "" && customColor !== "unset") {
      textEl.setAttribute("data-custom-color", "true");
      textComponent.addStyle({ color: customColor });
      return;
    }

    const href = textComponent.get && textComponent.get("href");
    if (href && href !== "#" && href.trim() !== "") {
      textEl.classList.add("has-link");
      textComponent.addStyle({ color: "" });
      return;
    }

    textComponent.addStyle({ color: "" });
  };

  const createContainerToolbar = (depth: number) => {
    return [
      {
        attributes: { class: "fa fa-plus", title: "Add sibling item" },
        command: "add-advanced-sibling",
      },
      {
        attributes: { class: "fa fa-indent", title: "Add child item" },
        command: "add-advanced-child",
      },
      {
        attributes: { class: "fa fa-list-ul", title: "Bullet style" },
        command: "change-bullet-style",
      },
      {
        attributes: { class: "fa fa-circle", title: "Bullet color" },
        command: "change-bullet-color",
      },
      {
        attributes: { class: "fa fa-link", title: "Edit link" },
        command: "edit-advanced-link",
      },
      {
        attributes: { class: "fa fa-trash", title: "Remove item" },
        command: "remove-advanced-item",
      },
    ];
  };

  // Command: change bullet style
  editor.Commands.add("change-bullet-style", {
    run(ed: any) {
      const listItem = getAdvancedListItem(ed);
      if (!listItem) {
        ed.Modal.open({
          title: "No list item selected",
          content:
            "Select a bullet list item (or its text) to change its marker style.",
        });
        return;
      }

      const current = listItem.get && listItem.get("listStyleType");
      const options: Array<{ id: string; name: string }> = [
        { id: "disc", name: "Disc" },
        { id: "circle", name: "Circle" },
        { id: "square", name: "Square" },
        { id: "none", name: "None" },
      ];

      const wrapper = document.createElement("div");
      wrapper.innerHTML = `
        <div style="padding:10px;">
          <div style="font-weight:600; margin-bottom:8px;">Choose bullet style</div>
          <div id="bullet-style-grid" style="display:grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap:8px;">
            ${options
              .map(
                (o) => `
                <button data-style="${o.id}"
                  style="padding:8px; border:1px solid #ccc; border-radius:6px; cursor:pointer; background:#fff; ${
                    current === o.id
                      ? "outline:2px solid #667eea; outline-offset:2px;"
                      : ""
                  }">
                  ${o.name}
                </button>`
              )
              .join("")}
          </div>
          <div style="margin-top:12px; text-align:right;">
            <button id="bullet-style-cancel" class="gjs-btn">Close</button>
          </div>
        </div>
      `;

      ed.Modal.setTitle("Bullet style");
      ed.Modal.setContent(wrapper);
      ed.Modal.open();
      // Prevent overlay clicks from closing the modal
      try {
        const mdlContainer = document.querySelector(
          ".gjs-mdl-container"
        ) as HTMLElement | null;
        if (mdlContainer) {
          const overlayClickHandler = (ev: MouseEvent) => {
            if (ev.target === mdlContainer) {
              ev.stopPropagation();
              ev.preventDefault();
              const first = wrapper.querySelector<
                HTMLInputElement | HTMLElement
              >("input, button, textarea, select");
              if (first) first.focus();
            }
          };
          mdlContainer.addEventListener("click", overlayClickHandler, true);
          try {
            ed.on &&
              ed.on("modal:close", () => {
                try {
                  mdlContainer.removeEventListener(
                    "click",
                    overlayClickHandler,
                    true
                  );
                } catch (_) {
                  void 0;
                }
              });
          } catch (_) {
            void 0;
          }
        }
      } catch (_) {
        void 0;
      }

      const grid = wrapper.querySelector("#bullet-style-grid");
      const onPick = (ev: Event) => {
        const t = ev.target as HTMLElement;
        const style = t && t.getAttribute("data-style");
        if (!style) return;

        if (listItem.set) listItem.set("listStyleType", style);
        if (listItem.addStyle) listItem.addStyle({ "list-style-type": style });
        if (listItem.addAttributes) {
          listItem.addAttributes({ "data-list-style-type": style });
        }

        const listEl = listItem.getEl && listItem.getEl();
        if (listEl) {
          listEl.style.listStyleType = style;
          listEl.setAttribute("style", `list-style-type: ${style};`);
        }

        if (listItem.view && listItem.view.render) {
          listItem.view.render();
        }

        if (listItem.trigger) {
          listItem.trigger("change:listStyleType");
        }

        try {
          const container =
            listItem.findType &&
            listItem.findType("advanced-text-container")[0];
          const textEl = container && findAbmTextIn(container);
          if (textEl) ed.select(textEl);
        } catch (_) {
          /* ignore */
        }

        ed.Modal.close();
      };
      if (grid) grid.addEventListener("click", onPick);
      const cancel = wrapper.querySelector("#bullet-style-cancel");
      if (cancel) cancel.addEventListener("click", () => ed.Modal.close());
    },
  });

  // Command: change bullet color
  editor.Commands.add("change-bullet-color", {
    run(ed: any) {
      const listItem = getAdvancedListItem(ed);
      if (!listItem) {
        ed.Modal.open({
          title: "No list item selected",
          content:
            "Select a bullet list item (or its text) to change its bullet color.",
        });
        return;
      }

      const currentColor =
        (listItem.get && listItem.get("bulletColor")) || "#555";
      const predefinedColors = [
        { name: "Default", value: "#555" },
        { name: "Black", value: "#000000" },
        { name: "Blue", value: "#007bff" },
        { name: "Red", value: "#dc3545" },
        { name: "Green", value: "#28a745" },
        { name: "Orange", value: "#fd7e14" },
        { name: "Purple", value: "#6f42c1" },
        { name: "Pink", value: "#e83e8c" },
      ];

      const wrapper = document.createElement("div");
      wrapper.innerHTML = `
        <div style="padding:15px;">
          <div style="font-weight:600; margin-bottom:12px;">Choose bullet color</div>
          
          <!-- Predefined colors -->
          <div style="margin-bottom:16px;">
            <div style="font-weight:500; margin-bottom:8px; font-size:14px;">Quick Colors</div>
            <div id="bullet-color-grid" style="display:grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap:8px;">
              ${predefinedColors
                .map(
                  (color) => `
                  <button data-color="${color.value}" title="${color.name}"
                    style="width:40px; height:40px; border:2px solid ${
                      currentColor === color.value ? "#007bff" : "#ccc"
                    }; 
                           border-radius:8px; cursor:pointer; background:${
                             color.value
                           }; position:relative;
                           display:flex; align-items:center; justify-content:center;">
                    ${
                      currentColor === color.value
                        ? '<i class="fa fa-check" style="color:white; text-shadow:1px 1px 1px black;"></i>'
                        : ""
                    }
                  </button>`
                )
                .join("")}
            </div>
          </div>

          <!-- Custom color picker -->
          <div style="margin-bottom:16px;">
            <div style="font-weight:500; margin-bottom:8px; font-size:14px;">Custom Color</div>
            <input id="bullet-color-picker" type="color" value="${currentColor}" 
                   style="width:60px; height:40px; border:1px solid #ccc; border-radius:6px; cursor:pointer;">
          </div>
          
          <div style="text-align:right; border-top:1px solid #eee; padding-top:12px;">
            <button id="bullet-color-cancel" class="gjs-btn" style="margin-right:8px;">Cancel</button>
            <button id="bullet-color-apply" class="gjs-btn-prim">Apply</button>
          </div>
        </div>
      `;

      ed.Modal.setTitle("Bullet Color");
      ed.Modal.setContent(wrapper);
      ed.Modal.open();
      // Prevent overlay clicks from closing the modal
      try {
        const mdlContainer = document.querySelector(
          ".gjs-mdl-container"
        ) as HTMLElement | null;
        if (mdlContainer) {
          const overlayClickHandler = (ev: MouseEvent) => {
            if (ev.target === mdlContainer) {
              ev.stopPropagation();
              ev.preventDefault();
              const first = wrapper.querySelector<
                HTMLInputElement | HTMLElement
              >("input, button, textarea, select");
              if (first) first.focus();
            }
          };
          mdlContainer.addEventListener("click", overlayClickHandler, true);
          try {
            ed.on &&
              ed.on("modal:close", () => {
                try {
                  mdlContainer.removeEventListener(
                    "click",
                    overlayClickHandler,
                    true
                  );
                } catch (_) {
                  void 0;
                }
              });
          } catch (_) {
            void 0;
          }
        }
      } catch (_) {
        void 0;
      }

      let selectedColor = currentColor;

      // Handle predefined color selection
      const grid = wrapper.querySelector("#bullet-color-grid");
      const colorPicker = wrapper.querySelector(
        "#bullet-color-picker"
      ) as HTMLInputElement;

      const updateSelection = (color: string) => {
        selectedColor = color;
        colorPicker.value = color;

        // Update button borders
        const buttons = grid?.querySelectorAll("button[data-color]");
        buttons?.forEach((btn: any) => {
          const btnColor = btn.getAttribute("data-color");
          btn.style.border =
            btnColor === color ? "2px solid #007bff" : "2px solid #ccc";
          btn.innerHTML =
            btnColor === color
              ? '<i class="fa fa-check" style="color:white; text-shadow:1px 1px 1px black;"></i>'
              : "";
        });
      };

      const onColorPick = (ev: Event) => {
        const t = ev.target as HTMLElement;
        const color = t.closest("button")?.getAttribute("data-color");
        if (color) {
          updateSelection(color);
        }
      };

      // Handle custom color picker
      const onColorChange = (ev: Event) => {
        const color = (ev.target as HTMLInputElement).value;
        updateSelection(color);
      };

      // Apply color function
      const applyBulletColor = () => {
        if (listItem.set) listItem.set("bulletColor", selectedColor);
        if (listItem.addAttributes) {
          listItem.addAttributes({ "data-bullet-color": selectedColor });
        }

        // Inject dynamic styles for this color
        injectBulletColorStyle(selectedColor);

        const listEl = listItem.getEl && listItem.getEl();
        if (listEl) {
          listEl.style.setProperty("--bullet-color", selectedColor);
          listEl.setAttribute("data-bullet-color", selectedColor);
        }

        if (listItem.view && listItem.view.render) {
          listItem.view.render();
        }

        if (listItem.trigger) {
          listItem.trigger("change:bulletColor");
        }

        try {
          const container =
            listItem.findType &&
            listItem.findType("advanced-text-container")[0];
          const textEl = container && findAbmTextIn(container);
          if (textEl) ed.select(textEl);
        } catch (_) {
          /* ignore */
        }

        ed.Modal.close();
      };

      if (grid) grid.addEventListener("click", onColorPick);
      if (colorPicker) colorPicker.addEventListener("input", onColorChange);

      const applyBtn = wrapper.querySelector("#bullet-color-apply");
      const cancelBtn = wrapper.querySelector("#bullet-color-cancel");

      if (applyBtn) applyBtn.addEventListener("click", applyBulletColor);
      if (cancelBtn)
        cancelBtn.addEventListener("click", () => ed.Modal.close());
    },
  });

  // Command to edit the link
  editor.Commands.add("edit-advanced-link", {
    run(ed: any) {
      let cmp = ed.getSelected && ed.getSelected();
      if (!cmp) return;

      if (cmp.get && cmp.get("type") === "advanced-bullet-list-item") {
        const container =
          cmp.findType && cmp.findType("advanced-text-container")[0];
        if (container) {
          const textElement = findAbmTextIn(container);
          if (textElement) cmp = textElement;
        }
      }
      if (!cmp || !isAbmTextComponent(cmp)) return;

      const modal = ed.Modal;
      const el = cmp.getEl && (cmp.getEl() as HTMLElement);
      const existingAnchor = el?.querySelector?.(
        "a"
      ) as HTMLAnchorElement | null;
      if (existingAnchor) {
        showEditLinkModal(existingAnchor, cmp);
        return;
      }
      const wrapper = document.createElement("div");
      wrapper.innerHTML = `
        <div style="padding:10px;">
          <label style="display:block; font-weight:600; margin-bottom:6px;">Link (href)</label>
          <input id="menu-link-input" type="text" placeholder="https://" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
          <div style="margin-top:12px; text-align:right;">
            <button id="menu-link-save" class="gjs-btn-prim">Save</button>
          </div>
        </div>
      `;
      modal.setTitle("Change menu link");
      modal.setContent(wrapper);
      modal.open();
      // Prevent closing the modal by clicking the overlay; only Save/Close should close
      try {
        const mdlContainer = document.querySelector(
          ".gjs-mdl-container"
        ) as HTMLElement | null;
        if (mdlContainer) {
          const overlayClickHandler = (ev: MouseEvent) => {
            if (ev.target === mdlContainer) {
              ev.stopPropagation();
              ev.preventDefault();
              const input =
                wrapper.querySelector<HTMLInputElement>("#menu-link-input");
              if (input) input.focus();
            }
          };
          mdlContainer.addEventListener("click", overlayClickHandler, true);
          try {
            ed.on &&
              ed.on("modal:close", () => {
                try {
                  mdlContainer.removeEventListener(
                    "click",
                    overlayClickHandler,
                    true
                  );
                } catch (_) {
                  void 0;
                }
              });
          } catch (_) {
            void 0;
          }
        }
      } catch (_) {
        void 0;
      }
      const saveBtn = wrapper.querySelector(
        "#menu-link-save"
      ) as HTMLButtonElement;
      const inputEl = wrapper.querySelector(
        "#menu-link-input"
      ) as HTMLInputElement;
      if (saveBtn && inputEl) {
        saveBtn.addEventListener("click", () => {
          let v = (inputEl.value || "").trim();
          if (!v) {
            modal.close();
            return;
          }
          v = normalizeUrl(v);

          try {
            if (el) {
              const text = el.textContent || "";
              el.innerHTML = "";
              const a = (el.ownerDocument || document).createElement("a");
              a.href = v;
              a.target = "_blank";
              a.rel = "noopener noreferrer";
              a.textContent = text || "Link";
              el.appendChild(a);
              // Sync back to model
              cmp.set && cmp.set("content", el.innerHTML);
            }
          } catch (_) {
            /* ignore */
          }
          modal.close();
          setTimeout(() => ed.select(cmp), 10);
        });
      }
    },
  });

  const getAdvancedListItem = (editor: any): any => {
    const selected = editor.getSelected && editor.getSelected();
    if (!selected) return null;

    let current = selected;
    while (current) {
      if (current.get && current.get("type") === "advanced-bullet-list-item") {
        return current;
      }
      current = current.parent && current.parent();
    }
    return null;
  };

  // Initialize styles
  injectAdvancedStyles();
  editor.on("load", injectAdvancedStyles);
  setTimeout(injectAdvancedStyles, 300);

  // Outer wrapper component for the bullet list
  domc.addType("advanced-bullet-list-wrapper", {
    isComponent: (el: HTMLElement) =>
      el.tagName === "DIV" && el.classList.contains("abm-list-wrapper"),
    model: {
      defaults: {
        tagName: "div",
        attributes: { class: "abm-list-wrapper" },
        draggable: true,
        droppable: false,
        selectable: true,
        removable: true,
        // Exclude typography and dimension properties from Style Manager
        stylable: [
          "background",
          "background-color",
          "background-image",
          "background-repeat",
          "background-attachment",
          "background-position",
          "background-size",
          "border",
          "border-width",
          "border-style",
          "border-color",
          "border-radius",
          "box-shadow",
          "opacity",
          "cursor",
          "overflow",
          "z-index",
          "transform",
          "transition",
          "filter",
          "display",
          "float",
          "position",
          "top",
          "right",
          "bottom",
          "left",
          // Allow padding and margin
          "padding",
          "padding-top",
          "padding-right",
          "padding-bottom",
          "padding-left",
          "margin",
          "margin-top",
          "margin-right",
          "margin-bottom",
          "margin-left",
        ],
        components: [{ type: "advanced-bullet-list" }],
        traits: [
          {
            type: "color",
            label: "Background Color",
            name: "backgroundColor",
          },
          {
            type: "number",
            label: "Padding",
            name: "padding",
            unit: "px",
            min: 0,
          },
          {
            type: "number",
            label: "Margin",
            name: "margin",
            unit: "px",
          },
        ],
      },
    },
  });

  // Advanced bullet list component
  domc.addType("advanced-bullet-list", {
    isComponent: (el: HTMLElement) =>
      el.tagName === "UL" && el.classList.contains("gjs-advanced-bullet-list"),
    model: {
      defaults: {
        tagName: "ul",
        attributes: { class: "gjs-advanced-bullet-list" },
        droppable: ".gjs-advanced-bullet-item",
        draggable: true,
        removable: true,
        components: [{ type: "advanced-bullet-list-item" }],
        traits: [
          {
            type: "select",
            label: "List Style",
            name: "list-style-type",
            options: [
              { id: "disc", value: "disc", name: "Disc" },
              { id: "circle", value: "circle", name: "Circle" },
              { id: "square", value: "square", name: "Square" },
              { id: "none", value: "none", name: "None" },
            ],
          },
          {
            type: "number",
            label: "Padding Left",
            name: "paddingLeft",
            unit: "px",
            min: 0,
          },
          {
            type: "number",
            label: "Margin",
            name: "margin",
            unit: "px",
          },
        ],
      },
      init(this: any) {
        this.on("add", (component: any) => {
          if (
            component.get &&
            component.get("type") === "advanced-bullet-list-item"
          ) {
            applyAdvancedDepthStyling(component);
            setTimeout(() => recalculateAdvancedDepths(), 50);
          }
        });
      },
    },
  });

  // Text container component (separate control)
  domc.addType("advanced-text-container", {
    isComponent: (el: HTMLElement) =>
      el.tagName === "DIV" && el.classList.contains("abm-container"),
    model: {
      defaults: {
        tagName: "div",
        attributes: { class: "abm-container" },
        draggable: false,
        droppable: false,
        selectable: false,
        removable: true,
        toolbar: false,
        components: [
          {
            type: "text",
            attributes: { class: "abm-text", [DATA_ATTR]: "1" },
            content: "List Item",
            draggable: false,
            editable: true,
            toolbar: false,
          },
        ],
        traits: [
          {
            type: "color",
            label: "Background Color",
            name: "backgroundColor",
          },
          {
            type: "number",
            label: "Padding",
            name: "padding",
            unit: "px",
            min: 0,
          },
          {
            type: "number",
            label: "Margin",
            name: "margin",
            unit: "px",
          },
          {
            type: "select",
            label: "Display",
            name: "display",
            options: [
              { id: "flex", value: "flex", name: "Flex" },
              { id: "block", value: "block", name: "Block" },
              { id: "inline-flex", value: "inline-flex", name: "Inline Flex" },
            ],
          },
        ],
      },
      init(this: any) {
        this.on("change:backgroundColor", () => {
          this.addStyle({ backgroundColor: this.get("backgroundColor") });
        });
        this.on("change:padding", () => {
          this.addStyle({ padding: this.get("padding") });
        });
        this.on("change:margin", () => {
          this.addStyle({ margin: this.get("margin") });
        });
        this.on("change:display", () => {
          this.addStyle({ display: this.get("display") });
        });
      },
    },
  });

  // Note: Using default GrapesJS 'text' type for ABM text; no custom type registration.

  // Advanced bullet list item component
  domc.addType("advanced-bullet-list-item", {
    isComponent: (el: HTMLElement) => {
      if (
        el.tagName === "LI" &&
        el.classList.contains("gjs-advanced-bullet-item")
      ) {
        return true;
      }
      if (el.tagName === "LI" && el.hasAttribute("data-list-style-type")) {
        return true;
      }
      return false;
    },
    model: {
      defaults: {
        tagName: "li",
        attributes: { class: "gjs-advanced-bullet-item" },
        draggable: false,
        removable: true,
        droppable: ".gjs-advanced-bullet-list",
        listStyleType: "disc",
        bulletColor: "#555",
        components: [
          {
            type: "advanced-text-container",
          },
        ],
        traits: [
          {
            type: "select",
            label: "List Style Type",
            name: "listStyleType",
            changeProp: true,
            options: [
              { id: "disc", value: "disc", name: "Disc" },
              { id: "circle", value: "circle", name: "Circle" },
              { id: "square", value: "square", name: "Square" },
              { id: "none", value: "none", name: "None" },
            ],
          },
          {
            type: "color",
            label: "Bullet Color",
            name: "bulletColor",
            changeProp: true,
          },
        ],
      },
      init(this: any) {
        const el = this.getEl && this.getEl();
        if (el) {
          const storedStyle =
            el.getAttribute("data-list-style-type") ||
            el.style.listStyleType ||
            this.get("listStyleType");
          if (storedStyle && storedStyle !== "disc") {
            this.set("listStyleType", storedStyle);
          }
        }

        applyAdvancedDepthStyling(this);

        this.on("change:listStyleType", () => {
          const style = this.get("listStyleType");
          this.addStyle({ "list-style-type": style });
          this.addAttributes({ "data-list-style-type": style });
          const el = this.getEl();
          if (el) {
            el.style.listStyleType = style;
            el.setAttribute("style", `list-style-type: ${style};`);
          }
        });

        this.on("change:bulletColor", () => {
          const color = this.get("bulletColor");

          // Inject dynamic styles for this color
          injectBulletColorStyle(color);

          this.addAttributes({ "data-bullet-color": color });
          const el = this.getEl();
          if (el) {
            el.style.setProperty("--bullet-color", color);
            el.setAttribute("data-bullet-color", color);
          }
        });

        // Initialize bullet color on load
        const initBulletColor = () => {
          const el = this.getEl();
          if (el) {
            const storedColor =
              el.getAttribute("data-bullet-color") ||
              this.get("bulletColor") ||
              "#555";
            this.set("bulletColor", storedColor);

            // Inject dynamic styles for this color
            injectBulletColorStyle(storedColor);

            el.style.setProperty("--bullet-color", storedColor);
            el.setAttribute("data-bullet-color", storedColor);
          }
        };

        this.on("added", () => {
          setTimeout(() => {
            applyAdvancedDepthStyling(this);
            initBulletColor();
          }, 100);
        });

        // Initialize bullet color immediately
        setTimeout(() => {
          initBulletColor();
          updateAdvancedColorLogic(this);
        }, 50);
      },
    },
    view: {
      init(this: any) {
        this.listenTo(
          this.model,
          "change:attributes change:style",
          this.updateAdvancedDisplay
        );
      },

      updateAdvancedDisplay(this: any) {
        applyAdvancedDepthStyling(this.model);
      },
    },
  });

  // Register block in the Blocks panel so users can drag it from the Lists section
  try {
    bm.add("advanced-bullet-list", {
      label: "Bullet List",
      category: { id: "lists", label: "Lists", open: true },
      media:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><circle cx="4" cy="6" r="2"/><circle cx="4" cy="12" r="2"/><circle cx="4" cy="18" r="2"/><rect x="8" y="5" width="12" height="2"/><rect x="8" y="11" width="12" height="2"/><rect x="8" y="17" width="12" height="2"/></svg>',
      attributes: { title: "Advanced Bullet List" },
      content: { type: "advanced-bullet-list-wrapper" },
    });
  } catch (_) {
    /* ignore */
  }

  // Advanced Commands
  editor.Commands.add("add-advanced-sibling", {
    run(editor: any) {
      const listItem = getAdvancedListItem(editor);
      if (!listItem) return;

      const parentList = listItem.parent();
      if (!parentList || parentList.get("type") !== "advanced-bullet-list")
        return;

      const collection = parentList.components();
      const index = collection.indexOf
        ? collection.indexOf(listItem)
        : collection.models
        ? collection.models.indexOf(listItem)
        : -1;

      const newItem = collection.add(
        { type: "advanced-bullet-list-item" },
        { at: index >= 0 ? index + 1 : undefined }
      );

      applyAdvancedDepthStyling(newItem);

      setTimeout(() => {
        const container = newItem.findType("advanced-text-container")[0];
        if (container) {
          const textElement = container.findType("advanced-text-element")[0];
          if (textElement) {
            selectAndEditItem(textElement);
          }
        }
      }, 50);
    },
  });

  editor.Commands.add("add-advanced-child", {
    run(editor: any) {
      const listItem = getAdvancedListItem(editor);
      if (!listItem) return;

      let childList = listItem
        .components()
        .find((c: any) => c.get && c.get("type") === "advanced-bullet-list");

      if (!childList) {
        childList = listItem.append({
          type: "advanced-bullet-list",
          components: [],
        })[0];
      }

      const newChild = childList.append({
        type: "advanced-bullet-list-item",
      })[0];

      applyAdvancedDepthStyling(newChild);

      setTimeout(() => {
        const container = newChild.findType("advanced-text-container")[0];
        if (container) {
          const textElement = container.findType("advanced-text-element")[0];
          if (textElement) {
            selectAndEditItem(textElement);
          }
        }
      }, 50);
    },
  });

  editor.Commands.add("remove-advanced-item", {
    run(editor: any) {
      const listItem = getAdvancedListItem(editor);
      if (!listItem) return;

      const parent = listItem.parent();
      listItem.remove();

      if (parent && parent.components) {
        parent.components().forEach((c: any) => applyAdvancedDepthStyling(c));
        editor.select(null);
      }
    },
  });

  // ENHANCED SINGLE CLICK BEHAVIOR - Core functionality
  let currentEditingComponent: any = null;
  let clickTimeout: any = null;
  const SYNC_HANDLER_KEY = "__abmSyncHandler";
  // Track scheduled caret placement timeouts so we can cancel if user starts selecting manually
  let caretPlacementTimers: any[] = [];

  // Synchronize DOM content back into the GrapesJS component model so it persists
  const syncTextContent = (cmp: any) => {
    if (!cmp) return;
    try {
      const el = cmp.view && cmp.view.el;
      if (!el) return;
      // Use innerHTML to preserve links and inline formatting
      const html = el.innerHTML;
      const prev = cmp.get && cmp.get("content");
      const trimmed = html.trim();
      const prevTrim = (prev || "").trim();
      // Detect deletion intent via data flag on element (set during keydown) or if previous was default placeholder text
      const deletionIntent = (el as any).dataset?.abmDeletionIntent === "1";
      if (html != null) {
        if (trimmed === "") {
          // Only clear if the user explicitly deleted the content
          if (deletionIntent) {
            cmp.set && cmp.set("content", "");
            (el as HTMLElement).dataset.abmEmpty = "1";
          }
          // Otherwise, treat as accidental vanish (do not overwrite the model)
          else {
            return;
          }
        } else if (html !== prev) {
          cmp.set && cmp.set("content", html);
          (el as HTMLElement).dataset.abmEmpty = "";
        }
      }
      // Reset deletion intent flag after sync
      if ((el as any).dataset) (el as any).dataset.abmDeletionIntent = "0";
    } catch (_) {
      /* ignore sync errors */
    }
  };

  // Ensure DOM shows model content if DOM was cleared visually
  const hydrateTextDom = (cmp: any) => {
    try {
      const el = cmp?.view?.el;
      if (!el) return;
      const modelContent = (cmp.get && cmp.get("content")) || "";
      if (el.innerHTML.trim() === "" && modelContent.trim() !== "") {
        el.innerHTML = modelContent;
      }
    } catch (_) {
      /* ignore */
    }
  };

  const attachContentSyncListeners = (cmp: any) => {
    try {
      const el = cmp?.view?.el;
      if (!el) return;
      // Remove existing
      const existing = (el as any)[SYNC_HANDLER_KEY];
      if (existing) {
        el.removeEventListener("blur", existing);
        el.removeEventListener("focusout", existing);
        el.removeEventListener("compositionend", existing);
      }
      // Only sync on blur / focus loss / composition end to avoid re-render while typing
      const handler = () => {
        // If DOM is empty but model has content, restore before syncing
        try {
          hydrateTextDom(cmp);
        } catch (_) {
          /* ignore */
        }
        syncTextContent(cmp);
      };
      el.addEventListener("blur", handler);
      el.addEventListener("focusout", handler);
      el.addEventListener("compositionend", handler);
      // Track deletion intent (Backspace/Delete leading to empty content)
      el.addEventListener("keydown", (ev: KeyboardEvent) => {
        if (ev.key === "Backspace" || ev.key === "Delete") {
          // Delay check until after key processed
          setTimeout(() => {
            try {
              if ((el as HTMLElement).innerHTML.trim() === "") {
                (el as any).dataset.abmDeletionIntent = "1";
              }
            } catch (_) {
              /* ignore */
            }
          }, 0);
        }
      });
      // Also handle keyup to detect cleared content via typing over selection
      el.addEventListener("keyup", () => {
        try {
          if ((el as HTMLElement).innerHTML.trim() === "") {
            (el as any).dataset.abmDeletionIntent = "1";
          }
        } catch (_) {
          /* ignore */
        }
      });
      // Reset deletion intent when user inputs any content
      el.addEventListener("input", () => {
        try {
          if ((el as HTMLElement).innerHTML.trim() !== "") {
            (el as any).dataset.abmDeletionIntent = "0";
          }
        } catch (_) {
          /* ignore */
        }
      });
      (el as any)[SYNC_HANDLER_KEY] = handler;
    } catch (_) {
      /* ignore */
    }
  };

  // Forcefully exit current editing session
  const forceExitEditing = () => {
    if (!currentEditingComponent) return;
    try {
      // Ensure latest edits are stored before exiting
      syncTextContent(currentEditingComponent);
      editor.runCommand("core:component-exit");
    } catch (_) {
      /* ignore */
    }
    try {
      const el =
        currentEditingComponent.getEl && currentEditingComponent.getEl();
      if (el) {
        el.removeAttribute("contenteditable");
        (el as HTMLElement).blur && (el as HTMLElement).blur();
      }
    } catch (_) {
      /* ignore */
    }
    currentEditingComponent = null;
  };

  // Helper function to clear all selection styles
  const clearAllSelectionStyles = () => {
    try {
      const doc = getDoc() || document;
      const allListItems = doc.querySelectorAll(".gjs-advanced-bullet-item");
      allListItems.forEach((item: any) => {
        item.classList.remove("selected-for-editing");
        item.style.border = "";
        item.style.backgroundColor = "";
        item.style.boxShadow = "";
        item.style.transform = "";
        item.style.zIndex = "";
      });
    } catch (e) {
      console.warn("Error clearing selection styles:", e);
    }
  };

  // Ensure caret moves to end of the editable element reliably (iframe-safe)
  const placeCaretAtEnd = (el: HTMLElement, retries: number = 4) => {
    try {
      // If user already began their own selection, don't override
      if ((el as any).dataset?.abmUserSelecting === "1") return;
      const doc = (el.ownerDocument || document) as Document;
      // Some cases GrapesJS re-focuses wrapper; delay ensures final position
      el.focus();
      const range = doc.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      const sel = doc.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(range);
      }
      // If selection didn't land at end (e.g., length > 0 and anchorOffset == 0), retry
      if (retries > 0) {
        const shouldRetry = (() => {
          try {
            if (!sel) return false;
            const endNode = sel.anchorNode;
            if (!endNode) return false;
            // Heuristic: if offset is 0 but element has text, retry
            const textContent = el.textContent || "";
            return textContent.length > 0 && sel.anchorOffset === 0;
          } catch {
            return false;
          }
        })();
        if (shouldRetry) setTimeout(() => placeCaretAtEnd(el, retries - 1), 20);
      }
    } catch (_) {
      if (retries > 0) setTimeout(() => placeCaretAtEnd(el, retries - 1), 25);
    }
  };

  // Helper function to set selection styles and start editing
  const selectAndEditItem = (textComponent: any) => {
    try {
      // Clear previous selections
      clearAllSelectionStyles();

      // Exit any current editing
      if (
        currentEditingComponent &&
        currentEditingComponent !== textComponent
      ) {
        forceExitEditing();
      }

      // Find the parent list item
      const container = textComponent.parent();
      const listItem = container?.parent();

      if (listItem && listItem.get("type") === "advanced-bullet-list-item") {
        const listItemEl = listItem.getEl && listItem.getEl();
        if (listItemEl) {
          // Add prominent blue border
          listItemEl.classList.add("selected-for-editing");
        }

        // Set toolbar for the text component
        const depth = calculateItemDepth(listItem);
        const containerToolbar = createContainerToolbar(depth);
        textComponent.set && textComponent.set("toolbar", containerToolbar);
      }

      // Select and enter edit mode
      // If already the current component, only bail out if RTE really active
      if (currentEditingComponent === textComponent) {
        try {
          const view: any = textComponent.view;
          const rte: any = view && (view.rte || view?.rteActive);
          const el: HTMLElement | null = (view && view.el) || null;
          const rteEnabled = !!(
            rte &&
            (rte.enabled || rte.isActive || rte.active)
          );
          const isEditableAttr =
            !!el && el.getAttribute("contenteditable") === "true";
          if (rteEnabled || isEditableAttr) {
            return; // fully active; let user select text freely
          }
        } catch (_) {
          // fall through to re-init
        }
      }

      editor.select(textComponent);
      setTimeout(() => {
        try {
          editor.runCommand("core:component-edit", {
            component: textComponent,
          });
        } catch (_) {
          /* ignore */
        }
        const textEl = textComponent.view && textComponent.view.el;
        if (textEl) {
          currentEditingComponent = textComponent; // mark after attempting edit enabling
          // Hydrate before entering edit in case it was visually cleared
          hydrateTextDom(textComponent);
          if (textEl.getAttribute("contenteditable") !== "true")
            textEl.setAttribute("contenteditable", "true");

          // Clear any previous timers
          caretPlacementTimers.forEach((id) => clearTimeout(id));
          caretPlacementTimers = [];

          const schedule = (fn: () => void, delay: number) => {
            const id = setTimeout(fn, delay);
            caretPlacementTimers.push(id);
          };
          // Multi-stage caret placement (cancelled if user starts selecting)
          schedule(() => placeCaretAtEnd(textEl as HTMLElement, 4), 0);
          schedule(() => placeCaretAtEnd(textEl as HTMLElement, 3), 10);
          schedule(() => placeCaretAtEnd(textEl as HTMLElement, 2), 40);
          schedule(() => placeCaretAtEnd(textEl as HTMLElement, 1), 90);

          // If user initiates mousedown (selection), cancel pending caret placements and mark flag
          const cancelUserSelect = (ev: Event) => {
            (textEl as any).dataset.abmUserSelecting = "1";
            caretPlacementTimers.forEach((id) => clearTimeout(id));
            caretPlacementTimers = [];
          };
          textEl.addEventListener("mousedown", cancelUserSelect, {
            once: true,
          });

          // Attach live sync so edits persist
          attachContentSyncListeners(textComponent);
        }
      }, 25);
    } catch (error) {
      console.warn("Error in selectAndEditItem:", error);
    }
  };

  // Enhanced event handlers for single-click behavior
  editor.on("component:selected", (cmp: any) => {
    if (cmp && currentEditingComponent && cmp !== currentEditingComponent) {
      forceExitEditing();
    }
    const root = getAdvancedTextRoot(cmp);
    if (root) {
      setOverlayHidden(true);
    } else {
      setOverlayHidden(false);
    }

    // Handle text element selection - immediate edit mode (supports default 'text')
    if (cmp && cmp.get && isAbmTextComponent(cmp)) {
      hydrateTextDom(cmp);
      selectAndEditItem(cmp);
      return;
    }

    // Handle list item selection - find and select its text element
    if (cmp && cmp.get && cmp.get("type") === "advanced-bullet-list-item") {
      const container =
        cmp.findType && cmp.findType("advanced-text-container")[0];
      if (container) {
        const textElement = findAbmTextIn(container);
        if (textElement) {
          hydrateTextDom(textElement);
          selectAndEditItem(textElement);
          return;
        }
      }
    }

    // Clear selections for other component types
    if (!cmp || (cmp.get && !cmp.get("type").startsWith("advanced-"))) {
      clearAllSelectionStyles();
      currentEditingComponent = null;
    }
  });

  editor.on("component:deselected", (cmp: any) => {
    const root = getAdvancedTextRoot(cmp);
    if (root) setOverlayHidden(false);

    // Don't clear selection styles on deselect - keep the blue border
    // Only clear when explicitly selecting something else
    if (cmp && currentEditingComponent === cmp) {
      // Keep the selection visible even when component is technically deselected
      const container = cmp.parent();
      const listItem = container?.parent();
      if (listItem) {
        const listItemEl = listItem.getEl && listItem.getEl();
        if (listItemEl) {
          // Maintain the selection styling
          listItemEl.classList.add("selected-for-editing");
        }
      }
    }
  });

  // Enhanced canvas click handler for single-click editing
  editor.on("load", () => {
    const canvas = editor.Canvas.getFrameEl();
    if (canvas && canvas.contentDocument) {
      // Single click handler with immediate editing
      canvas.contentDocument.addEventListener(
        "click",
        (e: any) => {
          // Clear any pending timeout
          if (clickTimeout) {
            clearTimeout(clickTimeout);
            clickTimeout = null;
          }

          const target = e.target;
          const listItem = target.closest(".gjs-advanced-bullet-item");
          const textElement = target.closest(".abm-text");

          if (listItem && textElement) {
            // Find the corresponding GrapesJS components
            const wrapper = editor.getWrapper && editor.getWrapper();
            if (wrapper) {
              const textComponents = wrapper.find(".abm-text");
              const targetTextComponent = textComponents.find((comp: any) => {
                const el = comp.getEl && comp.getEl();
                return el === textElement;
              });

              if (targetTextComponent) {
                // If already editing this component, allow normal browser selection behavior
                const alreadyEditing =
                  currentEditingComponent === targetTextComponent &&
                  (textElement as HTMLElement).getAttribute(
                    "contenteditable"
                  ) === "true";
                const anchor = (e.target as HTMLElement).closest("a");
                if (alreadyEditing && anchor) {
                  // Let rte:enable link handler take over (it shows edit modal)
                  e.preventDefault();
                  e.stopPropagation();
                  return;
                }
                if (!alreadyEditing) {
                  selectAndEditItem(targetTextComponent);
                  e.stopPropagation();
                  e.preventDefault();
                }
              }
            }
          }
        },
        true
      );

      // Also handle clicks on list items themselves
      canvas.contentDocument.addEventListener(
        "click",
        (e: any) => {
          const target = e.target;
          if (
            target.classList &&
            target.classList.contains("gjs-advanced-bullet-item")
          ) {
            // Find the text element within this list item
            const textElement = target.querySelector(".abm-text");
            if (textElement) {
              const wrapper = editor.getWrapper && editor.getWrapper();
              if (wrapper) {
                const textComponents = wrapper.find(".abm-text");
                const targetTextComponent = textComponents.find((comp: any) => {
                  const el = comp.getEl && comp.getEl();
                  return el === textElement;
                });

                if (targetTextComponent) {
                  selectAndEditItem(targetTextComponent);
                  e.stopPropagation();
                }
              }
            }
          }
        },
        true
      );

      // Click outside any bullet-related node: exit editing
      canvas.contentDocument.addEventListener(
        "click",
        (e: any) => {
          const t = e.target as HTMLElement;
          if (
            !t.closest(".gjs-advanced-bullet-item") &&
            !t.closest(".abm-text")
          ) {
            forceExitEditing();
          }
        },
        false
      );

      // Handle bullet marker clicks for color selection
      canvas.contentDocument.addEventListener(
        "click",
        (e: any) => {
          const target = e.target;
          const listItem = target.closest(".gjs-advanced-bullet-item");

          if (listItem) {
            // Check if click was in the bullet area (left margin area)
            const rect = listItem.getBoundingClientRect();
            const clickX = e.clientX;
            const listItemX = rect.left;

            // If click is in the left margin area where bullet is (approximately -25px to 0px)
            if (clickX < listItemX) {
              // Find the corresponding GrapesJS component
              const wrapper = editor.getWrapper && editor.getWrapper();
              if (wrapper) {
                const listItems = wrapper.find(".gjs-advanced-bullet-item");
                const targetListItem = listItems.find((comp: any) => {
                  const el = comp.getEl && comp.getEl();
                  return el === listItem;
                });

                if (targetListItem) {
                  // Clear any existing bullet selections
                  const doc = canvas.contentDocument;
                  if (doc) {
                    const allBullets = doc.querySelectorAll(
                      ".gjs-advanced-bullet-item"
                    );
                    allBullets.forEach((item: any) => {
                      item.classList.remove("bullet-selected");
                    });
                  }

                  // Mark this bullet as selected
                  listItem.classList.add("bullet-selected");

                  // Select the list item component and open bullet color modal
                  editor.select(targetListItem);
                  setTimeout(() => {
                    editor.runCommand("change-bullet-color");
                  }, 10);

                  e.stopPropagation();
                  e.preventDefault();
                }
              }
            }
          }
        },
        true
      );
    }
  });

  // Handle RTE enable/disable events
  editor.on("rte:enable", (view: any, rte: any) => {
    const component = view.model;
    if (component && component.get("type") === "advanced-text-element") {
      currentEditingComponent = component;
      setOverlayHidden(true);

      // Ensure the blue border remains visible during editing
      const container = component.parent();
      const listItem = container?.parent();
      if (listItem) {
        const listItemEl = listItem.getEl && listItem.getEl();
        if (listItemEl) {
          listItemEl.classList.add("selected-for-editing");
        }
      }

      // Configure RTE toolbar
      setTimeout(() => {
        const toolbar = document.querySelector(".gjs-rte-toolbar");
        if (toolbar) {
          (toolbar as HTMLElement).style.display = "flex";
          (toolbar as HTMLElement).style.position = "absolute";
          (toolbar as HTMLElement).style.zIndex = "1000";
        }
      }, 50);
      // After RTE fully enabled, ensure caret is at end
      try {
        const el = component.view && component.view.el;
        if (el) {
          setTimeout(() => placeCaretAtEnd(el as HTMLElement, 4), 5);
          setTimeout(() => placeCaretAtEnd(el as HTMLElement, 3), 30);
          setTimeout(() => placeCaretAtEnd(el as HTMLElement, 2), 80);
        }
      } catch (_) {
        /* ignore */
      }
    }
  });

  editor.on("rte:disable", (view: any, rte: any) => {
    const component = view.model;
    if (component && component.get("type") === "advanced-text-element") {
      setOverlayHidden(false);
      // Final sync after editing session ends
      syncTextContent(component);

      // Keep the blue border visible even after editing ends
      const container = component.parent();
      const listItem = container?.parent();
      if (listItem) {
        updateAdvancedColorLogic(listItem);

        // Maintain selection styling
        const listItemEl = listItem.getEl && listItem.getEl();
        if (listItemEl && currentEditingComponent === component) {
          listItemEl.classList.add("selected-for-editing");
        }
      }
    }
  });

  const recalculateAdvancedDepths = () => {
    try {
      const wrapper = editor.getWrapper && editor.getWrapper();
      if (!wrapper) return;

      const items = wrapper.find
        ? wrapper.find(".gjs-advanced-bullet-item")
        : [];
      items.forEach((item: any) => applyAdvancedDepthStyling(item));
    } catch (error) {
      console.warn("Error recalculating advanced depths:", error);
    }
  };

  editor.on("component:drag:end", recalculateAdvancedDepths);
  editor.on("component:remove", recalculateAdvancedDepths);
  editor.on("component:remove", () => updateEmptyCanvasToolboxVisibility());

  // Track if we're in a bulk clear operation to avoid cascade conflicts
  let isBulkClearing = false;

  // Override the default canvas clear command to ensure bullet components are properly removed
  const originalClearCommand = editor.Commands.get("core:canvas-clear");
  editor.Commands.add("core:canvas-clear", {
    run(ed: any, sender: any, options: any) {
      // Set bulk clearing flag to prevent cascade delete interference
      isBulkClearing = true;

      // First run the original clear command
      if (originalClearCommand && originalClearCommand.run) {
        originalClearCommand.run(ed, sender, options);
      }

      // Then ensure any remaining bullet components are removed
      setTimeout(() => {
        try {
          const wrapper = ed.getWrapper && ed.getWrapper();
          if (wrapper) {
            // Find and remove any remaining bullet components
            const bulletComponents: any[] = [];

            // Recursively find all bullet components
            const findBulletComponents = (comp: any) => {
              if (!comp) return;
              const type = comp.get && comp.get("type");
              if (
                type === "advanced-bullet-list" ||
                type === "advanced-bullet-list-item" ||
                type === "advanced-text-container"
              ) {
                bulletComponents.push(comp);
              }
              // Check children
              const children = comp.components && comp.components();
              if (children && children.length) {
                children.forEach(findBulletComponents);
              }
            };

            findBulletComponents(wrapper);

            // Remove found bullet components
            bulletComponents.forEach((comp: any) => {
              try {
                comp.remove && comp.remove();
              } catch (_) {
                /* ignore */
              }
            });

            // Also clean up any remaining DOM elements
            const canvas = ed.Canvas;
            if (canvas && canvas.getBody) {
              const body = canvas.getBody();
              if (body) {
                const remainingElements = body.querySelectorAll(
                  '[data-gjs-type="advanced-bullet-list"], ' +
                    '[data-gjs-type="advanced-bullet-list-item"], ' +
                    '[data-gjs-type="advanced-text-container"], ' +
                    ".gjs-advanced-bullet-list, " +
                    ".gjs-advanced-bullet-item, " +
                    ".abm-container"
                );
                remainingElements.forEach((el: any) => {
                  try {
                    el.parentNode && el.parentNode.removeChild(el);
                  } catch (_) {
                    /* ignore */
                  }
                });
              }
            }

            // Clear selection and trigger updates
            ed.select && ed.select([]);
            ed.trigger && ed.trigger("component:update");
            ed.trigger && ed.trigger("canvas:update");
          }
        } catch (_) {
          /* ignore */
        }

        // Reset bulk clearing flag after operation completes
        setTimeout(() => {
          isBulkClearing = false;
        }, 200);
      }, 100);
    },
  });

  // If the text container or inner ABM text is removed, also remove the parent list item to drop the bullet
  editor.on("component:remove", (cmp: any) => {
    try {
      // Skip cascade delete during bulk clear operations
      if (isBulkClearing || !cmp || !cmp.get) return;

      const type = cmp.get("type");
      if (type === "advanced-text-container") {
        const parent = cmp.parent && cmp.parent();
        if (
          parent &&
          parent.get &&
          parent.get("type") === "advanced-bullet-list-item"
        ) {
          // Use setTimeout to avoid interference with the current removal process
          setTimeout(() => {
            if (parent && parent.remove) {
              parent.remove();
            }
          }, 10);
        }
        return;
      }

      // Inner text removal -> remove its bullet
      if (isAbmTextComponent(cmp)) {
        const container = cmp.parent && cmp.parent();
        const listItem = container && container.parent && container.parent();
        if (
          listItem &&
          listItem.get &&
          listItem.get("type") === "advanced-bullet-list-item"
        ) {
          // Use setTimeout to avoid interference with the current removal process
          setTimeout(() => {
            if (listItem && listItem.remove) {
              listItem.remove();
            }
          }, 10);
        }
      }
    } catch (_) {
      // ignore
    }
  });

  // Handle preview mode
  editor.on("run:preview", () => {
    // Ensure all bullet colors are properly injected for preview mode
    const wrapper = editor.getWrapper && editor.getWrapper();
    if (wrapper) {
      const items = wrapper.find
        ? wrapper.find(".gjs-advanced-bullet-item")
        : [];
      items.forEach((item: any) => {
        try {
          const bulletColor = item.get && item.get("bulletColor");
          if (bulletColor) {
            injectBulletColorStyle(bulletColor);
          }
        } catch (_) {
          // ignore
        }
      });
    }
  });

  editor.on("stop:preview", () => {
    const doc = (editor as any).Canvas?.getDocument?.();
    if (doc) {
      const textElements = doc.querySelectorAll(".abm-text");
      textElements.forEach((el: any) => {
        el.setAttribute("contenteditable", "true");
      });
    }

    recalculateAdvancedDepths();

    const wrapper = editor.getWrapper && editor.getWrapper();
    if (wrapper) {
      const items = wrapper.find
        ? wrapper.find(".gjs-advanced-bullet-item")
        : [];
      items.forEach((item: any) => updateAdvancedColorLogic(item));
    }
  });

  // Handle component loading and persistence
  editor.on("component:add", (component: any) => {
    try {
      if (
        component.get &&
        component.get("type") === "advanced-bullet-list-item"
      ) {
        applyAdvancedDepthStyling(component);
      }

      // Ensure ABM flag on default text components
      if (component.get && component.get("type") === "text") {
        const attrs = component.getAttributes ? component.getAttributes() : {};
        const classes = (attrs.class || "").split(/\s+/);
        if (classes.includes("abm-text") && !attrs[DATA_ATTR]) {
          component.addAttributes &&
            component.addAttributes({ [DATA_ATTR]: "1" });
        }
      }

      const t = component.get && component.get("type");
      if (
        t === "advanced-bullet-list-item" ||
        t === "advanced-bullet-list" ||
        (t === "text" && isAbmTextComponent(component))
      ) {
        component.set && component.set("draggable", false);
        try {
          const children = component.components && component.components();
          if (children && Array.isArray(children)) {
            children.forEach((c: any) => c.set && c.set("draggable", false));
          }
        } catch (_) {
          //
        }
      }
      // Migrate any legacy advanced-text-element immediately
      if (component.get && component.get("type") === "advanced-text-element") {
        migrateAdvancedTextToDefault(component);
      }
    } catch (_) {
      //
    }
    updateEmptyCanvasToolboxVisibility();
  });

  // Handle loading from storage
  editor.on("load", () => {
    setTimeout(() => {
      const wrapper = editor.getWrapper && editor.getWrapper();
      if (wrapper) {
        const items = wrapper.find
          ? wrapper.find(".gjs-advanced-bullet-item")
          : [];
        items.forEach((item: any) => {
          const el = item.getEl && item.getEl();
          let storedStyle = item.get("listStyleType");

          if (el) {
            storedStyle =
              el.getAttribute("data-list-style-type") ||
              el.style.listStyleType ||
              storedStyle;
          }

          if (storedStyle && storedStyle !== "disc") {
            item.set("listStyleType", storedStyle);
            item.addStyle({ "list-style-type": storedStyle });
            item.addAttributes({ "data-list-style-type": storedStyle });

            if (el) {
              el.style.listStyleType = storedStyle;
              el.setAttribute("style", `list-style-type: ${storedStyle};`);
            }
          }

          applyAdvancedDepthStyling(item);

          // Ensure bullet colors are properly applied after loading
          const bulletColor = item.get && item.get("bulletColor");
          if (bulletColor) {
            injectBulletColorStyle(bulletColor);
          }
        });
        // Migrate legacy text and ensure DATA_ATTR on default text
        try {
          const texts = wrapper.find ? wrapper.find(".abm-text") : [];
          texts.forEach((t: any) => {
            if (t.get && t.get("type") === "advanced-text-element") {
              migrateAdvancedTextToDefault(t);
            } else if (t.get && t.get("type") === "text") {
              const attrs = t.getAttributes ? t.getAttributes() : {};
              if (!attrs[DATA_ATTR])
                t.addAttributes && t.addAttributes({ [DATA_ATTR]: "1" });
            }
          });
        } catch (_) {
          /* ignore */
        }
      }
      updateEmptyCanvasToolboxVisibility();
      initEmptyCanvasObserver();
    }, 500);
  });

  editor.on("storage:load", () => {
    setTimeout(() => {
      const wrapper = editor.getWrapper && editor.getWrapper();
      if (wrapper) {
        const items = wrapper.find
          ? wrapper.find(".gjs-advanced-bullet-item")
          : [];
        items.forEach((item: any) => {
          const storedStyle = item.get("listStyleType");
          if (storedStyle && storedStyle !== "disc") {
            const el = item.getEl && item.getEl();
            if (el) {
              el.style.listStyleType = storedStyle;
              el.setAttribute("style", `list-style-type: ${storedStyle};`);
            }
            item.addAttributes({ "data-list-style-type": storedStyle });
          }

          // Ensure bullet colors are properly applied after storage load
          const bulletColor = item.get && item.get("bulletColor");
          if (bulletColor) {
            injectBulletColorStyle(bulletColor);
          }
        });
        // Migrate legacy text and ensure DATA_ATTR on default text
        try {
          const texts = wrapper.find ? wrapper.find(".abm-text") : [];
          texts.forEach((t: any) => {
            if (t.get && t.get("type") === "advanced-text-element") {
              migrateAdvancedTextToDefault(t);
            } else if (t.get && t.get("type") === "text") {
              const attrs = t.getAttributes ? t.getAttributes() : {};
              if (!attrs[DATA_ATTR])
                t.addAttributes && t.addAttributes({ [DATA_ATTR]: "1" });
            }
          });
        } catch (_) {
          /* ignore */
        }
      }
      updateEmptyCanvasToolboxVisibility();
      initEmptyCanvasObserver();
    }, 100);
  });

  // Handle canvas drops with immediate editing
  editor.on("canvas:drop", (dataTransfer: any, model: any) => {
    if (model && model.get("type") === "advanced-bullet-list-item") {
      try {
        model.set && model.set("draggable", false);
        const children = model.components && model.components();
        if (children && Array.isArray(children)) {
          children.forEach((c: any) => c.set && c.set("draggable", false));
        }
      } catch (_) {
        //
      }

      setTimeout(() => {
        const container = model.findType("advanced-text-container")[0];
        if (container) {
          const textElement = findAbmTextIn(container);
          if (textElement) selectAndEditItem(textElement);
        }
      }, 100);
    }
  });
}

export default advancedBulletMenuPlugin;
