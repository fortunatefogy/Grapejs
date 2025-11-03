import type { Editor } from "grapesjs";

export default function accordionPlugin(editor: Editor) {
  console.debug("[GJS-PCF] accordion: plugin init");
  const dc = editor.DomComponents;
  const bm = editor.BlockManager;

  const uid = (pfx = "acc") =>
    `${pfx}-${Math.random().toString(36).slice(2, 9)}`;

  // Inject user-provided CSS so the accordion renders in canvas/preview
  const ACCORDION_CSS = `/* ACCORDION_CSS_MARKER */
/* Minimal accordion overrides leveraging Bootstrap panel styles.
   Removed redundant width:100% (panel-group already full width) */
.accordion.panel-group { position:relative; border:1px dashed #999; padding:12px; border-radius:4px; }
.accordion-item.panel { margin-bottom:8px; border-radius:4px; overflow:hidden; }
.accordion-item:last-child { margin-bottom:0; }
.accordion-header.panel-heading { cursor:pointer; display:flex; align-items:center; gap:8px; position:relative; }
.accordion-header.panel-heading::before { content:"\u276F"; display:inline-block; font-size:.75em; margin-right:4px; transition:transform .3s ease; }
.accordion-header.panel-heading.active::before { transform:rotate(90deg); }
.accordion-content.panel-collapse { max-height:0; overflow:hidden; transition:max-height .3s ease, padding .3s ease; }
.accordion-content.panel-collapse.show { max-height:500px; overflow-y:auto; }
.accordion-content .panel-body { padding:12px 16px; }
[data-role="acc-richtext"] { border:none !important; }
/* Remove GrapesJS outlines */
.accordion-item.gjs-selected, .accordion-header.gjs-selected, .accordion-content.gjs-selected,
.accordion-item.gjs-hovered, .accordion-header.gjs-hovered, .accordion-content.gjs-hovered { outline:none!important; box-shadow:none!important; }
.accordion-header [data-role="acc-title"] { outline:none!important; box-shadow:none!important; border:none!important; }
/* Highlight selected section (edit mode only) */
.accordion.panel-group[data-acc-editing="1"] .accordion-item.gjs-selected { box-shadow: 0 0 0 0px #1a73e8 inset !important; border-color: #1a73e8 !important; }
/* Edit/Save toggle button inside canvas */
.accordion.panel-group .acc-edit-toggle{ position:absolute!important; top:6px!important; right:6px!important; height:24px!important; padding:0 8px!important; border:1px solid #d0d0d0!important; border-radius:4px!important; background:#ffffff!important; color:#333!important; font-size:12px!important; line-height:22px!important; cursor:pointer!important; z-index:10010!important; box-shadow:0 1px 2px rgba(0,0,0,.08)!important; pointer-events:auto!important; }
.accordion.panel-group[data-acc-editing="1"] .acc-edit-toggle{ background:#0078d4!important; color:#fff!important; border-color:#0071c8!important; }
.gjs-preview-mode .acc-edit-toggle{ display:none!important; }
/* Hide dashed border in preview mode */
.gjs-preview-mode .accordion.panel-group{ border:none!important; padding:0!important; }
/* Hide dashed border and padding in final output (when not in GrapesJS editor iframe) */
body:not(.gjs-dashed) .accordion.panel-group:not([data-gjs-type]) { border:none!important; padding:0!important; }
/* Alternative: hide border when accordion doesn't have GrapesJS data attributes */
.accordion.panel-group:not([data-gjs-type]):not([class*="gjs-"]) { border:none; padding:0; }
/* (Inline header controls removed; controls moved to GrapesJS toolbar) */
`;

  const ACCORDION_SPACING_CSS = `/* ACCORDION_SPACING_MARKER */`;
  const ensureAccordionCss = () => {
    try {
      const current = (editor as any).getCss?.() || "";
      if (!current.includes("ACCORDION_CSS_MARKER")) {
        console.debug("[GJS-PCF] accordion: injecting CSS");
        editor.addStyle(ACCORDION_CSS);
      }
      // Also ensure canvas iframe has a copy in case CSS composer hasn't flushed yet
      try {
        const cdoc = (editor as any).Canvas?.getDocument?.();
        if (cdoc && !cdoc.getElementById("gjs-accordion-css")) {
          const st = cdoc.createElement("style");
          st.id = "gjs-accordion-css";
          st.textContent = ACCORDION_CSS;
          cdoc.head.appendChild(st);
        }
      } catch (_) {
        /* ignore */
      }
    } catch (e) {
      console.warn("[GJS-PCF] accordion: ensure CSS failed", e);
    }
  };
  const ensureAccordionSpacingCss = () => {
    try {
      const current = (editor as any).getCss?.() || "";
      if (!current.includes("ACCORDION_SPACING_MARKER")) {
        console.debug("[GJS-PCF] accordion: injecting spacing CSS");
        editor.addStyle(ACCORDION_SPACING_CSS);
      }
    } catch (e) {
      console.warn("[GJS-PCF] accordion: ensure spacing CSS failed", e);
    }
  };

  ensureAccordionCss();
  ensureAccordionSpacingCss();
  // Ensure Edit/Save toggle exists on accordion root
  const ensureEditToggle = (rootEl: HTMLElement) => {
    if (!rootEl || !rootEl.classList?.contains("accordion")) return;
    if (!rootEl.querySelector(".acc-edit-toggle")) {
      const doc = (rootEl.ownerDocument || document) as Document;
      const btn = doc.createElement("button");
      btn.type = "button";
      btn.className = "acc-edit-toggle";
      btn.setAttribute("data-acc-edit-toggle", "1");
      btn.textContent =
        rootEl.getAttribute("data-acc-editing") === "1"
          ? "Save Accordion"
          : "Edit Accordion";
      const cs = window.getComputedStyle(rootEl);
      if (cs.position === "static")
        (rootEl as HTMLElement).style.position = "relative";
      rootEl.appendChild(btn);
    }
  };
  editor.on("load", () =>
    setTimeout(() => {
      ensureAccordionCss();
      ensureAccordionSpacingCss();
      try {
        const cdoc = (editor as any).Canvas?.getDocument?.();
        if (cdoc) {
          cdoc
            .querySelectorAll(".accordion.panel-group")
            .forEach((el: Element) => ensureEditToggle(el as HTMLElement));
        }
      } catch (_) {
        /* ignore */
      }
    }, 0)
  );

  // After frame loads, re-inject CSS and ensure toggles
  editor.on("canvas:frame:load", () => {
    try {
      ensureAccordionCss();
      const cdoc = (editor as any).Canvas?.getDocument?.();
      if (cdoc) {
        cdoc
          .querySelectorAll(".accordion.panel-group")
          .forEach((el: Element) => ensureEditToggle(el as HTMLElement));
      }
    } catch (e) {
      console.warn("[GJS-PCF] accordion: frame load ensure failed", e);
    }
  });

  editor.on("component:add", (comp: any) => {
    try {
      const type = comp?.get?.("type");
      const el = comp?.getEl?.();
      if (type === "bs-accordion" || el?.classList?.contains("accordion")) {
        console.debug("[GJS-PCF] accordion: component:add -> ensure CSS");
        ensureAccordionCss();
        ensureAccordionSpacingCss();
        // No inline controls; toolbar buttons handle actions
      }
    } catch (e) {
      console.warn("[GJS-PCF] accordion: component:add hook failed", e);
    }
  });

  // (Inline header controls and edit toggle removed; actions moved to toolbar)

  const createAccordionItemHtml = (
    title: string,
    content: string,
    expanded = false
  ) => {
    const showCls = expanded ? " show" : "";
    const activeHdr = expanded ? " active" : "";
    return `
  <div class="accordion-item panel panel-default" data-role="acc-item" data-gjs-type="bs-accordion-item">
        <div class="accordion-header panel-heading${activeHdr}" data-role="acc-header" data-gjs-type="bs-accordion-header" role="tab">
          <h4 class="panel-title" data-role="acc-title" data-gjs-type="text">${title}</h4>
        </div>
        <div class="accordion-content panel-collapse${showCls}" data-role="acc-content" data-gjs-type="bs-accordion-content" role="tabpanel">
          <div class="panel-body" data-gjs-type="bs-accordion-richtext" data-role="acc-richtext">${
            content || "Start typing title and content"
          }</div>
        </div>
      </div>`;
  };

  // Component Type: bs-accordion
  dc.addType("bs-accordion", {
    isComponent: (el: HTMLElement) => el.classList?.contains("accordion"),
    model: {
      defaults: {
        tagName: "div",
        attributes: { class: "accordion panel-group", "data-acc-editing": "0" },
        // Allow moving the entire accordion as a unit
        draggable: false,

        // use the accordion-content areas for droppable regions instead
        droppable: false,
        // Allow selecting the accordion root directly
        selectable: true,
        hoverable: true,
        copyable: true,
        // Exclude typography and dimension properties from Style Manager for accordion container
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
        // Toolbar button as fallback (in addition to view button)
        toolbar: [
          {
            attributes: { class: "fa fa-arrows", title: "Move" },
            command: "tlb-move",
          },
          {
            attributes: { class: "fa fa-clone", title: "Clone" },
            command: "tlb-clone",
          },
          {
            attributes: { class: "fa fa-trash", title: "Delete" },
            command: "tlb-delete",
          },
        ],
        // Vanilla toggle behavior matching provided CSS
        script: function (this: HTMLElement) {
          // Safety check: ensure 'this' is a valid HTMLElement
          if (
            !this ||
            typeof this.querySelectorAll !== "function" ||
            typeof this.getAttribute !== "function" ||
            typeof this.addEventListener !== "function"
          ) {
            console.warn("[AccordionPlugin] Invalid context in script");
            return;
          }

          const root = this as HTMLElement;
          // Avoid wiring multiple times if GrapesJS re-renders
          if (root.getAttribute("data-acc-wired") === "1") return;
          root.setAttribute("data-acc-wired", "1");

          const toggle = (hdr: HTMLElement) => {
            if (!hdr) return;
            const item = hdr.closest(".accordion-item");
            const content =
              item?.querySelector<HTMLElement>(".accordion-content");
            if (!content) return;
            root
              .querySelectorAll<HTMLElement>(".accordion-content.show")
              .forEach((c) => {
                if (c !== content) c.classList.remove("show");
              });
            root
              .querySelectorAll<HTMLElement>(".accordion-header.active")
              .forEach((h) => {
                if (h !== hdr) h.classList.remove("active");
              });
            content.classList.toggle("show");
            hdr.classList.toggle("active");
          };

          // Delegated click handler so newly added headers work automatically
          root.addEventListener("click", (e: any) => {
            const target = (e?.target as HTMLElement) || null;
            if (!target) return;
            const hdr = target.closest?.(
              ".accordion-header"
            ) as HTMLElement | null;
            if (!hdr || !root.contains(hdr)) return;
            e.preventDefault?.();
            e.stopPropagation?.();
            toggle(hdr);
          });

          // Keyboard support (Enter/Space) on header
          root.addEventListener("keydown", (e: any) => {
            const target = (e?.target as HTMLElement) || null;
            if (!target) return;
            const hdr = target.closest?.(
              ".accordion-header"
            ) as HTMLElement | null;
            if (!hdr || !root.contains(hdr)) return;
            const code = e.key || e.code;
            if (code === "Enter" || code === " ") {
              e.preventDefault?.();
              e.stopPropagation?.();
              toggle(hdr);
            }
          });
        },
      },
    },
    view: {
      onRender() {
        const el = this.el as HTMLElement;
        try {
          ensureAccordionCss();
          ensureAccordionSpacingCss();
        } catch (e) {
          console.warn("[GJS-PCF] accordion: ensure CSS in view failed", e);
        }
        // Select section on header click only in Edit mode
        try {
          el.removeEventListener(
            "click",
            this.headerSelectHandler as any,
            true
          );
        } catch (_) {
          /* ignore detach failure */
        }
        this.headerSelectHandler = (e: Event) => {
          const t = e.target as HTMLElement;
          if (!(t && t.closest && t.closest(".accordion-header"))) return;
          const isEditing = el.getAttribute("data-acc-editing") === "1";
          // When editing is OFF we allow collapse to work; do not stop events.
          if (!isEditing) return;
          // When editing is ON, capture click to enable selecting the section in builder (and prevent collapse)
          e.preventDefault();
          e.stopPropagation();
          try {
            const itemEl = t.closest(".accordion-item") as HTMLElement | null;
            const children = (this.model as any).components?.();
            if (itemEl && children && children.length) {
              for (let i = 0; i < children.length; i++) {
                const c = children.at(i) as any;
                if (c?.getEl?.() === itemEl) {
                  (this.em as any)?.setSelected?.(c);
                  return;
                }
              }
            }
            (this.em as any)?.setSelected?.(this.model);
          } catch (_) {
            /* ignore selection failure */
          }
        };
        // Bind selection handler only when editing to avoid blocking collapse during normal mode
        if (el.getAttribute("data-acc-editing") === "1") {
          el.addEventListener("click", this.headerSelectHandler as any, true);
        }

        // Ensure Edit/Save toggle button and click handler
        try {
          ensureEditToggle(el);
        } catch (e) {
          console.warn("[GJS-PCF] accordion: ensureEditToggle failed", e);
        }
        try {
          el.removeEventListener("click", this.editToggleHandler as any, true);
        } catch (_) {
          /* ignore detach failure */
        }
        this.editToggleHandler = (ev: Event) => {
          const trg = ev.target as HTMLElement;
          if (
            !(
              trg &&
              trg.getAttribute &&
              trg.getAttribute("data-acc-edit-toggle")
            )
          )
            return;
          ev.preventDefault();
          ev.stopPropagation();
          const editing = el.getAttribute("data-acc-editing") === "1";
          el.setAttribute("data-acc-editing", editing ? "0" : "1");
          const btn = el.querySelector(
            ".acc-edit-toggle"
          ) as HTMLButtonElement | null;
          if (btn)
            btn.textContent = editing ? "Edit Accordion" : "Save Accordion";
          // Toggle per-item selectability
          try {
            const children = (this.model as any).components?.();
            if (children && children.length) {
              for (let i = 0; i < children.length; i++) {
                const c = children.at(i) as any;
                // When switching into editing (data-acc-editing=1), enable selection on items
                c?.set?.("selectable", !editing);
              }
            }
          } catch (_) {
            /* ignore */
          }
          // Surface the custom toolbar after entering edit mode by selecting the first item
          try {
            if (!editing) {
              const children = (this.model as any).components?.();
              const first =
                children && children.length ? children.at(0) : this.model;
              (this.em as any)?.setSelected?.(first);
            } else {
              (this.em as any)?.setSelected?.(null);
            }
          } catch (_) {
            /* ignore */
          }
          // Rebind header selection capture based on new state
          try {
            el.removeEventListener(
              "click",
              this.headerSelectHandler as any,
              true
            );
          } catch (_) {
            /* ignore rebind failure */
          }
          const nowEditing = el.getAttribute("data-acc-editing") === "1";
          if (nowEditing) {
            el.addEventListener("click", this.headerSelectHandler as any, true);
          }
        };
        el.addEventListener("click", this.editToggleHandler as any, true);
      },
      // No per-header inline events; actions are in toolbar
      onSelectWrapper() {
        try {
          (this.em as any)?.setSelected?.(this.model);
        } catch (e) {
          console.warn("[GJS-PCF] accordion: onSelectWrapper failed", e);
        }
      },
      onStartMove(e: MouseEvent) {
        e.preventDefault();
        e.stopPropagation();
        try {
          (this.em as any)?.setSelected?.(this.model);
          // Attempt to start move command so user can drag immediately
          (this.em as any)?.runCommand?.("tlb-move");
        } catch (e) {
          console.warn("[GJS-PCF] accordion: onStartMove failed", e);
        }
      },
      onAddItem() {
        const model: any = this.model;
        try {
          ensureAccordionCss();
        } catch (e) {
          console.warn("[GJS-PCF] accordion: ensure CSS before add failed", e);
        }
        // Count existing items to decide default title
        const items = (model.components && model.components()) || [];
        const idx = Array.isArray(items)
          ? items.length + 1
          : (items as any).length + 1;
        const html = createAccordionItemHtml(
          `Section`,
          "Start typing title and content",
          true
        );
        model.append(html);

        // No inline controls to refresh
        setTimeout(() => {
          try {
            // keep selection behavior consistent
            const root = this.el as HTMLElement;
            root && root.focus?.();
          } catch (e) {
            console.warn("[GJS-PCF] accordion: post-add update failed", e);
          }
        }, 100);

        // Select the newly added section's content container for convenience
        try {
          const added = model.components().at(model.components().length - 1);
          let selectTarget = added as any;
          if (added && (added as any).find) {
            // Prefer the inner richtext area if available
            const rich = (added as any).find('[data-role="acc-richtext"]');
            if (Array.isArray(rich) && rich[0]) {
              selectTarget = rich[0];
            } else {
              const contents = (added as any).find(".accordion-content");
              if (Array.isArray(contents) && contents[0])
                selectTarget = contents[0];
            }
          }
          if (selectTarget)
            this.em && (this.em as any).setSelected(selectTarget);
        } catch (e) {
          console.warn(
            "[GJS-PCF] accordion: selecting added component failed",
            e
          );
        }
      },
    },
  });

  // Each accordion-item should be a component to allow per-section selection and toolbar
  dc.addType("bs-accordion-item", {
    isComponent: (el: HTMLElement) => el.classList?.contains("accordion-item"),
    model: {
      defaults: {
        draggable: false,
        droppable: false,
        selectable: false, // enabled only in edit mode
        hoverable: true,
        attributes: { "data-role": "acc-item" },
        toolbar: [
          {
            attributes: { class: "fa fa-level-up", title: "Add above" },
            command: "bs-acc-add-above",
          },
          {
            attributes: { class: "fa fa-plus", title: "Add below" },
            command: "bs-acc-add-below",
          },
          {
            attributes: { class: "fa fa-minus", title: "Remove section" },
            command: "bs-acc-del",
          },
        ],
      },
    },
  });

  // Accordion header component type
  dc.addType("bs-accordion-header", {
    isComponent: (el: HTMLElement) =>
      el.classList?.contains("accordion-header"),
    model: {
      defaults: {
        draggable: false,
        droppable: false,
        selectable: false,
        hoverable: true,
        attributes: { "data-role": "acc-header" },
      },
    },
  });

  // Make accordion-content a dedicated droppable container
  dc.addType("bs-accordion-content", {
    isComponent: (el: HTMLElement) =>
      el.classList?.contains("accordion-content"),
    model: {
      defaults: {
        droppable: true,
        draggable: false,
        selectable: true,
        hoverable: true,
        // Keep content scrollable if it gets large while editing
        attributes: {},
      },
    },
  });

  // Block to insert accordion
  bm.add("bs-accordion", {
    label: "Accordion",
    media: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="50" viewBox="0 0 40 50" fill="none" stroke="#fff" stroke-width="1.2">
  <!-- First accordion section -->
  <rect x="4" y="4" width="40" height="12" rx="2" ry="2"/>
 
  <!-- Second accordion section -->
  <rect x="4" y="20" width="40" height="12" rx="2" ry="2"/>
 
  <!-- Third accordion section -->
  <rect x="4" y="36" width="40" height="12" rx="2" ry="2"/>
</svg>`,
    category: "Layout",
    content: () => {
      return {
        type: "bs-accordion",
        components: [
          createAccordionItemHtml(
            "Section",
            "Start typing title and content",
            true
          ),
          createAccordionItemHtml(
            "Section",
            "Start typing title and content",
            false
          ),
        ].join(""),
      } as any;
    },
  });

  // Richtext inside accordion content that is also droppable
  dc.addType("bs-accordion-richtext", {
    extend: "text",
    model: {
      defaults: {
        tagName: "div",
        droppable: true,
        draggable: false,
        selectable: true,
        hoverable: true,
        editable: true,
        attributes: { "data-role": "acc-richtext" },
      },
    },
  });

  // Command for toolbar add (wrapper or after selected item)
  editor.Commands.add("bs-acc-add", {
    run(ed: Editor) {
      const sel: any = (ed as any).getSelected?.();
      if (!sel) return;
      const isWrapper =
        (sel.get && sel.get("type")) === "bs-accordion" ||
        (sel.getEl && sel.getEl()?.classList.contains("accordion"));
      const isItem =
        (sel.get && sel.get("type")) === "bs-accordion-item" ||
        (sel.getEl && sel.getEl()?.classList.contains("accordion-item"));
      if (isWrapper || isItem) {
        try {
          ensureAccordionCss();
        } catch (e) {
          console.warn("[GJS-PCF] accordion: ensure CSS in command failed", e);
        }
        const html = createAccordionItemHtml(
          `Section`,
          "Start typing title and content",
          true
        );
        if (isWrapper) {
          sel.append(html);
        } else {
          // insert after selected item
          let acc: any = sel;
          while (acc && acc.get && acc.get("type") !== "bs-accordion") {
            acc = acc.parent && acc.parent();
          }
          if (!acc) return;
          const coll = acc.components && acc.components();
          let idx = -1;
          for (let i = 0; i < coll.length; i++) {
            if (coll.at(i) === sel) {
              idx = i;
              break;
            }
          }
          if (idx >= 0) coll.add(html as any, { at: idx + 1 } as any);
          else acc.append(html);
        }

        // No inline controls to maintain
        setTimeout(() => {}, 0);

        // Select the new section's accordion-content if present
        try {
          let added: any;
          if (isWrapper) {
            added = sel.components().at(sel.components().length - 1);
          } else {
            let acc: any = sel;
            while (acc && acc.get && acc.get("type") !== "bs-accordion")
              acc = acc.parent && acc.parent();
            if (!acc) return;
            const coll = acc.components();
            for (let i = 0; i < coll.length; i++) {
              if (coll.at(i) === sel) {
                added = coll.at(i + 1);
                break;
              }
            }
            if (!added) added = coll.at(coll.length - 1);
          }
          let selectTarget = added as any;
          if (added && (added as any).find) {
            const rich = (added as any).find('[data-role="acc-richtext"]');
            if (Array.isArray(rich) && rich[0]) {
              selectTarget = rich[0];
            } else {
              const contents = (added as any).find(".accordion-content");
              if (Array.isArray(contents) && contents[0])
                selectTarget = contents[0];
            }
          }
          (ed as any).setSelected?.(selectTarget);
        } catch (e) {
          console.warn("[GJS-PCF] accordion: command select added failed", e);
        }
        console.debug("[GJS-PCF] accordion: appended section");
      }
    },
  });

  // Add below currently selected item
  editor.Commands.add("bs-acc-add-below", {
    run(ed: Editor) {
      const sel: any = (ed as any).getSelected?.();
      if (!sel) return;
      if (
        (sel.get && sel.get("type")) === "bs-accordion-item" ||
        (sel.getEl && sel.getEl()?.classList.contains("accordion-item"))
      ) {
        (ed as any).runCommand?.("bs-acc-add");
      }
    },
  });

  // Add above currently selected item
  editor.Commands.add("bs-acc-add-above", {
    run(ed: Editor) {
      const sel: any = (ed as any).getSelected?.();
      if (!sel) return;
      if (
        (sel.get && sel.get("type")) === "bs-accordion-item" ||
        (sel.getEl && sel.getEl()?.classList.contains("accordion-item"))
      ) {
        let acc: any = sel;
        while (acc && acc.get && acc.get("type") !== "bs-accordion")
          acc = acc.parent && acc.parent();
        if (!acc) return;
        const coll = acc.components && acc.components();
        let idx = -1;
        for (let i = 0; i < coll.length; i++) {
          if (coll.at(i) === sel) {
            idx = i;
            break;
          }
        }
        if (idx < 0) return;
        const html = createAccordionItemHtml(
          `Section`,
          "Start typing title and content",
          true
        );
        coll.add(html as any, { at: idx } as any);
        try {
          (ed as any).setSelected?.(coll.at(idx));
        } catch (_) {
          /* ignore */
        }
      }
    },
  });

  // Command to remove section (from selected item or from end if root selected)
  editor.Commands.add("bs-acc-del", {
    run(ed: Editor) {
      const sel: any = (ed as any).getSelected?.();
      if (!sel) return;
      // Find the accordion root model
      let acc: any = sel;
      while (acc && acc.get && acc.get("type") !== "bs-accordion") {
        acc = acc.parent && acc.parent();
      }
      if (!acc) return;
      const coll = acc.components && acc.components();
      if (!coll || coll.length <= 1) return;
      if (sel.get && sel.get("type") === "bs-accordion") {
        try {
          const last = coll.at(coll.length - 1) as any;
          last && last.remove && last.remove();
          (ed as any).setSelected?.(acc);
        } catch (e) {
          console.warn("[GJS-PCF] accordion: toolbar delete last failed", e);
        }
        return;
      }
      try {
        const rootEl = acc.getEl && acc.getEl();
        const selEl = sel.getEl && sel.getEl();
        const itemEl =
          selEl && (selEl.closest ? selEl.closest(".accordion-item") : null);
        if (!itemEl) return;
        for (let i = 0; i < coll.length; i++) {
          const c = coll.at(i) as any;
          if (c?.getEl?.() === itemEl) {
            c.remove();
            const targetIdx = Math.max(0, Math.min(i, coll.length - 2));
            const target = coll.at(targetIdx) || acc;
            (ed as any).setSelected?.(target);
            break;
          }
        }
      } catch (e) {
        console.warn("[GJS-PCF] accordion: toolbar delete failed", e);
      }
    },
  });
}
