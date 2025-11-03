import type { Editor } from "grapesjs";

export default function breadcrumbPlugin(editor: Editor) {
  const bm = editor.BlockManager;
  const dc = editor.DomComponents;
  // Default component type references used to extend views
  const defaultType = dc.getType("default");
  const defaultView = defaultType.view;

  // (Page Title component extracted to a dedicated plugin file)

  dc.addType("breadcrumb-container", {
    isComponent: (el: HTMLElement) =>
      el.tagName === "OL" && el.classList.contains("breadcrumb"),
    model: {
      defaults: {
        tagName: "ol",
        attributes: { class: "breadcrumb" },
        // Only allow reordering of existing breadcrumb-item within the list
        droppable: (src: any, dest: any, index: number) => {
          try {
            // Allow if the dragged component is a breadcrumb-item coming from this container
            const type = src?.get && src.get("type");
            if (type === "breadcrumb-item") return true;
          } catch (_) {
            /* no-op */
          }
          return false;
        },
        draggable: false,
        selectable: true,
        hoverable: true,
        highlightable: true,
        // enable style manager for backgrounds, borders, spacing
        stylable: [
          "background",
          "background-color",
          "border",
          "border-radius",
          "padding",
          "margin",
        ],
        // Default to white background so it doesn't inherit canvas grey
        style: {
          "background-color": "#ffffff",
        },
        // Define what can be dropped into breadcrumb (legacy API guard)
        "drop-valid": function (component: any) {
          try {
            return component?.get?.("type") === "breadcrumb-item";
          } catch (_) {
            return false;
          }
        },
      },
    },
  });

  dc.addType("breadcrumb-item", {
    isComponent: (el: HTMLElement) =>
      el.tagName === "LI" && el.classList.contains("breadcrumb-item"),
    model: {
      defaults: {
        tagName: "li",
        attributes: { class: "breadcrumb-item" },
        droppable: false, // Breadcrumb items don't accept drops
        draggable: ".breadcrumb", // Can only be dragged within breadcrumb containers
        removable: true, // Can be deleted
        copyable: true, // Can be copied
        selectable: true,
        hoverable: true,
        highlightable: true,
        // Default inner content is plain text (not a link)
        components: [
          {
            type: "text",
            tagName: "span",
            content: "Item",
          },
        ],
      },
    },
  });

  bm.add("h1-heading", {
    label: `
      <div style="text-align:center; padding:5px;">
        <div style="width:40px; height:20px; background:#ddd; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:bold; margin:0 auto;">H1</div>
        <div style="font-size:11px;">H1 Heading</div>
      </div>
    `,
    category: "Basic",
    content: {
      type: "text",
      tagName: "h1",
      draggable: true,
      editable: true,
      content: "Heading 1",
      // style: { padding: "10px" },
      traits: [
        {
          type: "color",
          name: "bgColor",
          label: "Background Color",
          changeProp: true,
        },
      ],
    },
  });

  bm.add("h2-heading", {
    label: `
      <div style="text-align:center; padding:5px;">
        <div style="width:40px; height:20px; background:#ddd; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:bold; margin:0 auto;">H2</div>
        <div style="font-size:11px;">H2 Heading</div>
      </div>
    `,
    category: "Basic",
    content: {
      type: "text",
      tagName: "h2",
      draggable: true,
      editable: true,
      content: "Heading 2",
      traits: [
        {
          type: "color",
          name: "bgColor",
          label: "Background Color",
          changeProp: true,
        },
      ],
    },
  });

  bm.add("h3-heading", {
    label: `
      <div style="text-align:center; padding:5px;">
        <div style="width:40px; height:20px; background:#ddd; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:bold; margin:0 auto;">H3</div>
        <div style="font-size:11px;">H3 Heading</div>
      </div>
    `,
    category: "Basic",
    content: {
      type: "text",
      tagName: "h3",
      draggable: true,
      editable: true,
      content: "Heading 3",
      traits: [
        {
          type: "color",
          name: "bgColor",
          label: "Background Color",
          changeProp: true,
        },
      ],
    },
  });

  bm.add("breadcrumb", {
    label: "BreadCrumb",

    media: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M4 5L10 12L4 19V5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M8 5L14 12L8 19V5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M12 5L18 12L12 19V5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M16 5L22 12L16 19V5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`,
    category: "Navigation",
    content: `
      <style>
        /* Keep defaults minimal so Style Manager can override */
        /* Outer nav spacing and default font-size */
        .breadcrumb-nav {
          padding: 12px;
          font-size: 14.4px; /* default */
          background-color: #ffffff;
          border: 1px dashed #999;
          border-radius: 4px;
          margin: 0 0 12px; /* requested margin */
        }

        /* Breadcrumb list: allow wrapping when items don't fit */
        .breadcrumb {
          display: flex;
          flex-wrap: wrap; /* allow items to flow to next line */
          padding: 0;
          margin: 0;
          list-style: none;
          align-items: center;
          background-color: #ffffff;
          gap: 8px 12px; /* vertical and horizontal gaps between items */
        }

        /* Individual items: keep inner text from breaking mid-word, but allow the whole item to wrap */
        .breadcrumb-item {
          display: inline-flex;
          align-items: center;
          padding: 2px 4px;
          line-height: 1;
          font-size: inherit;
          max-width: 100%;
        }
        .breadcrumb-item > * { white-space: nowrap; }

        /* Separator between items stays simple and static */
        .breadcrumb-item + .breadcrumb-item::before {
          content: "|";
          padding: 0 8px;
          position: static;
        }

        .breadcrumb-item a { text-decoration: none; position: static; color: inherit; }
        .breadcrumb-item a:hover { text-decoration: underline; }
        .breadcrumb-item a:focus { outline: none; } /* Remove blue selection indicator */
        .breadcrumb-item a:active { position: static; } /* Prevent link movement */
        .breadcrumb-item span { position: static; }
        .breadcrumb-item.preview-selected::before { background: none !important; } /* Remove blue color */

        /* Hide dashed border in preview mode */
        .gjs-preview-mode .breadcrumb-nav { border: none !important; padding: 10px 0 !important; }
        /* Hide dashed border in final output (when not in GrapesJS editor iframe) */
        body:not(.gjs-dashed) .breadcrumb-nav:not([data-gjs-type]) { border: none !important; padding: 10px 0 !important; }
        /* Alternative: hide border when breadcrumb-nav doesn't have GrapesJS data attributes */
        .breadcrumb-nav:not([data-gjs-type]):not([class*="gjs-"]) { border: none; padding: 10px 0; }

        /* Responsive font-size reductions to save horizontal space */
        @media (max-width: 1024px) {
          .breadcrumb-nav { font-size: 12.8px; }
          .breadcrumb-item + .breadcrumb-item::before { padding: 0 6px; }
          .breadcrumb { gap: 6px 8px; }
        }

        @media (max-width: 480px) {
          .breadcrumb-nav { font-size: 12px; }
          .breadcrumb-item + .breadcrumb-item::before { padding: 0 4px; }
          .breadcrumb { gap: 4px 6px; }
          .breadcrumb-item { padding: 1px 3px; }
        }
      </style>
      <nav class="breadcrumb-nav" aria-label="breadcrumb" data-gjs-type="breadcrumb-outer">
        <ol class="breadcrumb" data-gjs-type="breadcrumb-container">
          <li class="breadcrumb-item" data-gjs-type="breadcrumb-item">
            <span data-gjs-type="text" data-gjs-editable="true" contenteditable="true">Home</span>
          </li>
          <li class="breadcrumb-item" data-gjs-type="breadcrumb-item">
            <span data-gjs-type="text" data-gjs-editable="true" contenteditable="true">Category</span>
          </li>
       
        </ol>
      </nav>
    `,
  });

  // Outer container (nav) type to allow background/border styling when selected
  dc.addType("breadcrumb-outer", {
    isComponent: (el: HTMLElement) =>
      el.tagName === "NAV" && el.classList.contains("breadcrumb-nav"),
    model: {
      defaults: {
        tagName: "nav",
        attributes: { class: "breadcrumb-nav" },
        draggable: true,
        droppable: false,
        selectable: true,
        hoverable: true,
        highlightable: true,
        // Exclude only typography properties from Style Manager
        stylable: [
          // Background properties
          "background",
          "background-color",
          "background-image",
          "background-repeat",
          "background-attachment",
          "background-position",
          "background-size",
          // Border properties (Decorations)
          "border",
          "border-width",
          "border-style",
          "border-color",
          "border-radius",
          "border-top",
          "border-right",
          "border-bottom",
          "border-left",
          "border-top-width",
          "border-right-width",
          "border-bottom-width",
          "border-left-width",
          "border-top-style",
          "border-right-style",
          "border-bottom-style",
          "border-left-style",
          "border-top-color",
          "border-right-color",
          "border-bottom-color",
          "border-left-color",
          "box-shadow",
          // Dimension properties
          "width",
          "height",
          "max-width",
          "max-height",
          "min-width",
          "min-height",
          // Spacing properties
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
          // Position properties
          "position",
          "top",
          "right",
          "bottom",
          "left",
          "z-index",
          // Display properties
          "display",
          "float",
          "clear",
          "overflow",
          "overflow-x",
          "overflow-y",
          "visibility",
          // Flex properties
          "flex",
          "flex-direction",
          "flex-wrap",
          "flex-flow",
          "justify-content",
          "align-items",
          "align-content",
          "flex-grow",
          "flex-shrink",
          "flex-basis",
          "align-self",
          "order",
          // Other properties
          "opacity",
          "cursor",
          "transform",
          "transition",
          "filter",
          "box-sizing",
        ],
        // Expose common style properties prominently
        stylableProperties: [
          "background",
          "background-color",
          "border",
          "border-radius",
          "padding",
          "margin",
          "box-shadow",
          "width",
          "max-width",
          "min-height",
        ],
      },
    },
  });

  bm.add("page-last-updated", {
    label: `
      <div style="text-align:center; padding:5px;">
        <svg width="40" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="#000" stroke-width="2"/>
          <path d="M16 2V6" stroke="#000" stroke-width="2"/>
          <path d="M8 2V6" stroke="#000" stroke-width="2"/>
          <path d="M3 10H21" stroke="#000" stroke-width="2"/>
        </svg>
        <div style="font-size:11px;">Last Updated</div>
      </div>
    `,
    category: "Basic",
    content: {
      tagName: "div",
      // Keep a temp marker only for first-time identification; will be removed on add
      attributes: { "data-plu": "true" },
      droppable: false,
      selectable: true,
      draggable: true,
      // Add toolbar to ease moving the whole block
      toolbar: [
        {
          attributes: { class: "fa fa-arrows", title: "Move" },
          command: "tlb-move",
        },
        {
          attributes: { class: "fa fa-clone", title: "Clone" },
          command: "tlb-clone",
        },
      ],
      style: {
        display: "flex",
        "align-items": "center",
        gap: "5px",
        padding: "10px",
      },
      components: [
        {
          // Not a text component to avoid dotted edit outline
          tagName: "span",
          attributes: { "data-role": "plu-label" },
          content: "Page Last Updated:",
          draggable: false,
          selectable: false,
          hoverable: false,
          highlightable: false,
        },
        {
          // Use default component (not text) to avoid placeholder overlay
          tagName: "span",
          attributes: { "data-role": "last-updated-date" },
          content: "",
          editable: false,
          draggable: false,
          selectable: false,
          hoverable: false,
          highlightable: false,
        },
      ],
      script: function (this: HTMLElement) {
        // Safety check: ensure 'this' is a valid HTMLElement
        if (!this || typeof this.querySelector !== "function") {
          console.warn("[BreadCrumbPlugin] Invalid context in script");
          return;
        }

        const dateSpan = this.querySelector(
          'span[data-role="last-updated-date"]'
        );
        if (!dateSpan) return;
        // Guard to avoid repeated updates that can cause flicker
        if (!(dateSpan as HTMLElement).getAttribute("data-date-set")) {
          (dateSpan as HTMLElement).textContent = new Date(
            Date.now()
          ).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });
          (dateSpan as HTMLElement).setAttribute("data-date-set", "1");
        }
      },
    },
  });

  // (Removed) Accordion component types and commands were here; fully deleted per request.

  // Custom Accordion Block
  // Fixed accordion component with improved event handling

  editor.Commands.add("set-breadcrumb-link", {
    run(ed: any) {
      const sel = ed.getSelected?.();
      if (!sel) return;

      // Find the closest breadcrumb-item from current selection
      const findClosestBreadcrumbItem = (comp: any) => {
        let cur = comp;
        while (cur) {
          const t = cur.get && cur.get("type");
          if (t === "breadcrumb-item") return cur;
          cur = cur.parent && cur.parent();
          if (!cur) break;
        }
        return null;
      };

      const tag = (sel.get && sel.get("tagName"))?.toLowerCase?.();
      let item: any = sel;
      if (tag === "a" && sel.parent) item = sel.parent();
      const closestItem = findClosestBreadcrumbItem(item);
      if (closestItem) item = closestItem;

      let anchor: any = null;
      if (item && item.find) {
        const res = item.find("a");
        anchor = res && res[0];
      }
      // If no anchor exists, create one by wrapping current text/content
      if (!anchor && item) {
        try {
          // Extract a text label from current content
          let raw = "";
          try {
            raw = (item.toHTML && item.toHTML()) || item.get?.("content") || "";
          } catch (_) {
            raw = item.get?.("content") || "";
          }
          const text =
            (raw || "")
              .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
              .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
              .replace(/<[^>]*>/g, " ")
              .replace(/\s+/g, " ")
              .trim() || "Item";

          // Remove existing children to avoid duplication
          const comps = item.components ? item.components() : null;
          if (comps && comps.length) {
            const toRemove = comps.models ? comps.models.slice() : [];
            toRemove.forEach((c: any) => c.remove && c.remove());
          }

          const added = item.append({
            tagName: "a",
            attributes: {
              href: "#",
            },
            editable: true,
            components: [
              {
                type: "text",
                tagName: "span",
                content: text,
              },
            ],
          });
          anchor = added && added[0] ? added[0] : null;
        } catch (_) {
          // if wrapping fails, just exit silently
          return;
        }
      }

      const currentAttrs = anchor.getAttributes ? anchor.getAttributes() : {};
      const currentHref = currentAttrs.href || "#";

      const modal = ed.Modal;
      const wrapper = document.createElement("div");
      wrapper.innerHTML = `
        <div style="padding:10px;">
          <label style="display:block; font-weight:600; margin-bottom:6px;">Link (href)</label>
          <input id="bc-link-input" type="text" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;" value="${currentHref}">
          <div style="margin-top:12px; text-align:right;">
            <button id="bc-link-save" class="gjs-btn-prim">Save</button>
          </div>
        </div>
      `;
      modal.setTitle("Change breadcrumb link");
      modal.setContent(wrapper);
      modal.open();

      const saveBtn = wrapper.querySelector(
        "#bc-link-save"
      ) as HTMLButtonElement;
      const inputEl = wrapper.querySelector(
        "#bc-link-input"
      ) as HTMLInputElement;
      if (saveBtn && inputEl) {
        saveBtn.addEventListener("click", () => {
          const v = (inputEl.value || "#").trim();
          if (anchor.addAttributes) anchor.addAttributes({ href: v });
          else if (anchor.set) {
            const prev = anchor.getAttributes ? anchor.getAttributes() : {};
            anchor.set("attributes", { ...prev, href: v });
          }
          modal.close();
        });
      }
    },
  });

  // Command: Add a new breadcrumb item after the selected one
  editor.Commands.add("breadcrumb-add-after", {
    run(ed: any) {
      const sel = ed.getSelected?.();
      if (!sel) return;

      // Find the closest breadcrumb-item from current selection
      const findClosestBreadcrumbItem = (comp: any) => {
        let cur = comp;
        while (cur) {
          const t = cur.get && cur.get("type");
          if (t === "breadcrumb-item") return cur;
          cur = cur.parent && cur.parent();
          if (!cur) break;
        }
        return null;
      };

      const tag = (sel.get && sel.get("tagName"))?.toLowerCase?.();
      let item: any = sel;
      if (tag === "a" && sel.parent) item = sel.parent();
      const closestItem = findClosestBreadcrumbItem(item);
      if (closestItem) item = closestItem;

      // Ensure we operate on a breadcrumb-item
      const type = item?.get && item.get("type");
      if (type !== "breadcrumb-item") return;

      const parent = item.parent && item.parent();
      if (!parent) return;

      try {
        const comps = parent.components ? parent.components() : null;
        let at = undefined as number | undefined;
        try {
          // Attempt to place after the selected item
          if (comps && comps.models && typeof comps.indexOf === "function") {
            const idx = comps.indexOf(item);
            if (typeof idx === "number" && idx >= 0) at = idx + 1;
          }
        } catch (_) {
          /* no-op */
        }

        const newItemDef = {
          type: "breadcrumb-item",
          components: [
            {
              type: "text",
              tagName: "span",
              content: "New Item",
            },
          ],
        };

        let newItem: any = null;
        if (
          typeof at === "number" &&
          comps &&
          typeof comps.add === "function"
        ) {
          // Use collection add with index when possible
          newItem = comps.add(newItemDef, { at });
        } else if (typeof parent.append === "function") {
          const added = parent.append(newItemDef);
          newItem = added && added[0] ? added[0] : null;
        }
        if (newItem) ed.select(newItem);
      } catch (_) {
        /* no-op */
      }
    },
  });

  // Command: Remove the selected breadcrumb item (or the parent item if an anchor is selected)
  editor.Commands.add("breadcrumb-remove", {
    run(ed: any) {
      const sel = ed.getSelected?.();
      if (!sel) return;

      // Find the closest breadcrumb-item from current selection
      const findClosestBreadcrumbItem = (comp: any) => {
        let cur = comp;
        while (cur) {
          const t = cur.get && cur.get("type");
          if (t === "breadcrumb-item") return cur;
          cur = cur.parent && cur.parent();
          if (!cur) break;
        }
        return null;
      };

      const tag = (sel.get && sel.get("tagName"))?.toLowerCase?.();
      let item: any = sel;
      if (tag === "a" && sel.parent) item = sel.parent();
      const closestItem = findClosestBreadcrumbItem(item);
      if (closestItem) item = closestItem;

      // Ensure we operate on a breadcrumb-item
      const type = item?.get && item.get("type");
      if (type !== "breadcrumb-item") return;

      try {
        // Optional: prevent removing if it would leave the breadcrumb empty
        const parent = item.parent && item.parent();
        const siblings = parent?.components ? parent.components() : null;
        const count = siblings?.length ?? 0;
        if (count <= 1) {
          // Keep at least one item; silently ignore
          return;
        }
      } catch (_) {
        /* ignore counting issues and proceed */
      }

      try {
        item.remove && item.remove();
      } catch (_) {
        /* no-op */
      }
      // Clear selection so the blue toolbar hides after deletion
      try {
        if (typeof ed.select === "function") {
          ed.select(null as any);
        }
      } catch (_) {
        /* no-op */
      }
    },
  });

  // Replace the toolbar+PLU handler with a fixed version (previous string literal was broken)
  editor.on("component:selected", (component: any) => {
    try {
      const type = component.get && component.get("type");
      const tag = (component.get && component.get("tagName"))?.toLowerCase?.();

      // Helper to check if current selection is inside a breadcrumb-item
      const findClosestBreadcrumbItem = (comp: any) => {
        let cur = comp;
        while (cur) {
          const t = cur.get && cur.get("type");
          if (t === "breadcrumb-item") return cur;
          cur = cur.parent && cur.parent();
          if (!cur) break;
        }
        return null;
      };
      const closestItem = findClosestBreadcrumbItem(component);
      const isInsideBreadcrumb = !!closestItem;

      if (isInsideBreadcrumb) {
        let toolbar = (component.get("toolbar") || []).filter((t: any) => {
          // Remove our commands to avoid duplicates
          if (
            t?.command === "set-breadcrumb-link" ||
            t?.command === "breadcrumb-add-after" ||
            t?.command === "breadcrumb-remove"
          )
            return false;
          // Remove delete/trash button variants so only our minus is used
          const cmd = t?.command;
          if (cmd === "tlb-delete" || cmd === "core:component-delete")
            return false;
          const attrs = (t && t.attributes) || {};
          const klass = attrs.class || "";
          if (typeof klass === "string" && klass.indexOf("fa-trash") >= 0)
            return false;
          const title = attrs.title;
          if (title === "Delete" || title === "Remove") return false;
          return true;
        });
        // Plus button: add new item after
        toolbar.push({
          attributes: { class: "fa fa-plus", title: "Add item after" },
          command: "breadcrumb-add-after",
        });
        // Minus button: remove current item
        toolbar.push({
          attributes: { class: "fa fa-minus", title: "Remove item" },
          command: "breadcrumb-remove",
        });
        // Link button: set/change href
        toolbar.push({
          attributes: { class: "fa fa-link", title: "Change link" },
          command: "set-breadcrumb-link",
        });
        if (component.set) component.set("toolbar", toolbar);

        // Ensure the toolbar is visible by giving some room above the selection
        try {
          const frameWin: any = editor.Canvas.getWindow?.();
          const frameDoc: any = editor.Canvas.getDocument?.();
          const el: HTMLElement | null =
            (closestItem && closestItem.getEl && closestItem.getEl()) ||
            (component.getEl && component.getEl()) ||
            null;
          if (
            frameWin &&
            frameDoc &&
            el &&
            typeof el.getBoundingClientRect === "function"
          ) {
            const rect = el.getBoundingClientRect();
            const offset = 70; // desired free space for the toolbar above the component
            const currentScroll =
              (typeof frameWin.scrollY === "number" && frameWin.scrollY) ||
              frameDoc?.documentElement?.scrollTop ||
              frameDoc?.body?.scrollTop ||
              0;
            if (rect.top < offset) {
              const target = Math.max(0, currentScroll + rect.top - offset);
              if (typeof frameWin.scrollTo === "function")
                frameWin.scrollTo(0, target);
              else
                frameDoc?.documentElement &&
                  (frameDoc.documentElement.scrollTop = target);
            }
          }
        } catch (_) {
          /* no-op */
        }

        // Defensive: if some other plugin marked canvas as empty and hid toolbars, undo it now
        try {
          const frameDoc: any = editor.Canvas.getDocument?.();
          const hostDoc: Document | null =
            typeof document !== "undefined" ? document : null;
          const docs: Array<Document | null | undefined> = [frameDoc, hostDoc];
          docs.forEach((d) => {
            try {
              if (!d) return;
              const b = d.body;
              if (b && b.getAttribute("data-empty-canvas") === "1") {
                b.removeAttribute("data-empty-canvas");
              }
              const bars = d.querySelectorAll(
                ".gjs-toolbar, .gjs-toolbar-item, .gjs-toolbar-panel"
              );
              bars.forEach((el) => {
                const hel = el as HTMLElement;
                if (hel.getAttribute("data-abm-hide-managed") === "1") {
                  hel.style.display = ""; // restore default display
                }
              });
            } catch (_) {
              /* ignore per-doc */
            }
          });
        } catch (_) {
          /* no-op */
        }
      }

      // Ensure Page Last Updated has a unique selector to prevent style bleed
      const attrs = component.getAttributes ? component.getAttributes() : {};
      const isPluWrapper =
        (attrs && attrs["data-plu"] === "true") ||
        (component.find &&
          component.find('span[data-role="last-updated-date"]').length > 0);
      if (isPluWrapper) {
        // Remove legacy shared class if present
        component.removeClass && component.removeClass("page-last_upd");

        // Ensure a unique class exists for scoping
        const classes = component.getClasses ? component.getClasses() : [];
        const hasUnique =
          Array.isArray(classes) &&
          classes.some(
            (c: any) => typeof c === "string" && c.startsWith("plu-")
          );
        if (!hasUnique) {
          const unique = `plu-${Date.now().toString(36)}-${Math.random()
            .toString(36)
            .slice(2, 8)}`;
          component.addClass && component.addClass(unique);
        }
      }

      // (Page Title inner H1 selection moved to pagetitle plugin)
    } catch (e) {
      /* no-op */
    }
  });

  // Helper to set date inside Page Last Updated component
  const applyLastUpdatedDate = (root: any) => {
    try {
      const dateTargets = root.find
        ? root.find('span[data-role="last-updated-date"]')
        : [];
      const dateStr = new Date(Date.now()).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      dateTargets.forEach((t: any) => {
        // Only set if empty to avoid overwriting manual edits
        if (!t.get("content")) t.set("content", dateStr);
      });
    } catch (_) {
      /* no-op */
    }
  };

  // When a new component is added, if it is (or contains) the Last Updated structure, inject date
  editor.on("component:add", (comp: any) => {
    try {
      const attrs = comp.getAttributes ? comp.getAttributes() : {};
      const isPlu = attrs?.["data-plu"] === "true";
      const hasTarget =
        (comp.find &&
          comp.find('span[data-role="last-updated-date"]').length > 0) ||
        false;
      if (isPlu || hasTarget) applyLastUpdatedDate(comp);

      // Disabled auto-convert on drop inside breadcrumb; users will use toolbar + to add items

      // (Page Title per-instance handling moved to pagetitle plugin)
    } catch (_) {
      /* no-op */
    }
  });

  // On initial load ensure any existing (reloaded) Last Updated components get a date
  editor.on("load", () => {
    const wrapper = editor.getWrapper();
    applyLastUpdatedDate(wrapper);

    // Inject editor-only CSS to outline breadcrumb items for easier selection/toolbar access
    try {
      const doc = editor.Canvas.getDocument();
      if (doc) {
        const id = "gjs-breadcrumb-outline-style";
        let styleEl = doc.getElementById(id) as HTMLStyleElement | null;
        const css = `/* Editor-only hint for breadcrumb items */\n.breadcrumb .breadcrumb-item > a,\n.breadcrumb .breadcrumb-item > span {\n \n  outline-offset: 1px;\n}\n`;
        if (!styleEl) {
          styleEl = doc.createElement("style");
          styleEl.id = id;
          styleEl.type = "text/css";
          doc.head.appendChild(styleEl);
        }
        if (styleEl) styleEl.textContent = css;
      }
    } catch (_) {
      /* no-op */
    }
  });

  // (Page Title block moved to pagetitle plugin)
}
