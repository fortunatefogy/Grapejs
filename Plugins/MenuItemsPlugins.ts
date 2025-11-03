import { Editor } from "grapesjs";
// Common constants/helpers
const FORMATTING_TAGS = ["b", "strong", "i", "em", "u", "s", "span"];
const FORMATTING_SELECTOR = "b, strong, i, em, u, s, span[style]";

// Track Ctrl/Cmd key state globally for preventing modal on Ctrl+click
let isCtrlPressed = false;
if (typeof window !== "undefined") {
  window.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey) isCtrlPressed = true;
  });
  window.addEventListener("keyup", (e) => {
    if (!e.ctrlKey && !e.metaKey) isCtrlPressed = false;
  });
  window.addEventListener("blur", () => {
    isCtrlPressed = false; // Reset on window blur
  });
}

function findNearestAncestorByTag(model: any, tagName: string) {
  if (!model || !tagName) return null;
  try {
    let cur = model;
    while (cur) {
      const t = (cur.get && cur.get("tagName")) || "";
      if (typeof t === "string" && t.toLowerCase() === tagName) return cur;
      cur = cur.parent && cur.parent();
    }
  } catch {
    /* no-op */
  }
  return null;
}

// Shared toolbar builder usable from multiple scopes
function buildMenuToolbarForModel(model: any) {
  try {
    if (!model) return;
    const tag = model.get("tagName")?.toLowerCase();

    // Handle both anchors and LI elements
    if (tag === "a") {
      const classes = model.getClasses ? model.getClasses() : [];
      if (!(classes.includes("nav-link") || classes.includes("submenu-link")))
        return;

      const toolbar: any[] = [];
      // Do not expose move controls for menu items/subitems - movement is disabled
      toolbar.push({
        attributes: { class: "fa fa-link", title: "Change link" },
        command: "set-menu-link",
      });

      // Determine if this anchor is inside a submenu via parent chain
      let p = model.parent && model.parent();
      let isSub = false;
      while (p) {
        const t = (p.get && p.get("tagName")) || "";
        const attrs = p.getAttributes ? p.getAttributes() : {};
        const cls = (attrs && attrs.class) || "";
        if (t && t.toLowerCase() === "ul" && cls.includes("submenu")) {
          isSub = true;
          break;
        }
        p = p.parent && p.parent();
      }

      if (isSub) {
        toolbar.push({
          attributes: { class: "fa fa-plus", title: "Add sub item" },
          command: "nav-add-subitem-after",
        });
        toolbar.push({
          attributes: { class: "fa fa-minus", title: "Remove sub item" },
          command: "nav-remove-subitem",
        });
      } else {
        // Provide both options: insert above (before) and below (after) the selected top-level item
        // Use directional arrows to indicate insert above/below
        toolbar.push({
          attributes: { class: "fa fa-arrow-up", title: "Add item above" },
          command: "nav-add-item-before",
        });
        toolbar.push({
          attributes: { class: "fa fa-arrow-down", title: "Add item below" },
          command: "nav-add-item-after",
        });
        toolbar.push({
          attributes: { class: "fa fa-list", title: "Add submenu" },
          command: "nav-add-submenu",
        });
        toolbar.push({
          attributes: { class: "fa fa-minus", title: "Remove item" },
          command: "nav-remove-item",
        });
      }

      model.set && model.set("toolbar", toolbar);
    } else if (tag === "li") {
      // For LI elements: check if this is a subitem (inside ul.submenu)
      const parentUl = model.parent && model.parent();
      if (!parentUl) return;
      const parentAttrs = parentUl.getAttributes
        ? parentUl.getAttributes()
        : {};
      const parentClass = parentAttrs.class || "";

      const toolbar: any[] = [];

      if (parentClass.includes("submenu")) {
        // This is a submenu item LI - custom toolbar for subitems
        toolbar.push({
          attributes: { class: "fa fa-link", title: "Change link" },
          command: "set-menu-link",
        });
        toolbar.push({
          attributes: { class: "fa fa-arrow-up", title: "Add sub item above" },
          command: "nav-add-subitem-before",
        });
        toolbar.push({
          attributes: {
            class: "fa fa-arrow-down",
            title: "Add sub item below",
          },
          command: "nav-add-subitem-after",
        });
        toolbar.push({
          attributes: { class: "fa fa-minus", title: "Remove sub item" },
          command: "nav-remove-subitem",
        });
      } else {
        // Top-level LI: don't add toolbar (anchor inside will handle it)
        toolbar.length = 0;
      }

      model.set && model.set("toolbar", toolbar);
    }
  } catch (e) {
    /* no-op */
  }
}

// Add toolbar link editing for nav-link and submenu-link
export function addMenuLinkToolbar(editor: Editor) {
  // Command to open modal and update href
  editor.Commands.add("set-menu-link", {
    run(ed: any, sender: any, options: any = {}) {
      // Check if Ctrl key is pressed - if so, don't open modal (allow direct editing)
      if (
        isCtrlPressed ||
        (options.event && (options.event.ctrlKey || options.event.metaKey))
      ) {
        return;
      }

      const sel = ed.getSelected?.();
      if (!sel) return;
      const tag = (sel.get && sel.get("tagName"))?.toLowerCase?.();
      let anchor = sel;
      if (tag !== "a" && sel.find) {
        const found = sel.find("a");
        if (found && found[0]) anchor = found[0];
      }
      if (
        !anchor ||
        (anchor.get && !["a"].includes(anchor.get("tagName")?.toLowerCase?.()))
      )
        return;
      const currentAttrs = anchor.getAttributes ? anchor.getAttributes() : {};
      const currentHref = currentAttrs.href || "#";

      // Only open the link modal when:
      // 1. The container is in edit mode (has .editing class)
      // 2. The toggle is enabled (data-allow-link-edit is not 'false')
      try {
        const anchorEl = anchor.getEl && anchor.getEl();
        const containerEl =
          anchorEl &&
          anchorEl.closest &&
          anchorEl.closest(".custom-menu-container");
        if (
          !containerEl ||
          !containerEl.classList ||
          !containerEl.classList.contains("editing")
        ) {
          // Not in edit mode: don't open the Change Link modal
          return;
        }
        // Check toggle state (default to true if not set)
        const toggleEnabled =
          containerEl.getAttribute("data-allow-link-edit") !== "false";
        if (!toggleEnabled) {
          // Toggle is disabled: don't open the modal
          return;
        }
      } catch (e) {
        // If we can't determine edit mode, err on the side of caution and don't open
        return;
      }

      const modal = ed.Modal;
      const wrapper = document.createElement("div");
      wrapper.innerHTML = `
        <div style="padding:10px;">
          <label style="display:block; font-weight:600; margin-bottom:6px;">Link (href)</label>
          <input id="menu-link-input" type="text" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;" value="${currentHref}">
          <div style="margin-top:12px; text-align:right;">
            <button id="menu-link-save" class="gjs-btn-prim">Save</button>
          </div>
        </div>
      `;
      modal.setTitle("Change menu link");
      modal.setContent(wrapper);
      modal.open();
      // Prevent closing the modal by clicking the overlay; only Save should close
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
          let v = (inputEl.value || "#").trim();
          // Normalize: if user typed a bare domain or starts with www. without protocol, prepend https://
          const hasProtocol = /^(https?:|ftp:|mailto:|tel:)/i.test(v);
          const isHash = v.startsWith("#");
          const isRootRelative = v.startsWith("/");
          if (!hasProtocol && !isHash && !isRootRelative) {
            if (/^www\./i.test(v)) {
              v = `https://${v}`;
            } else if (/^[A-Za-z0-9.-]+\.[A-Za-z]{2,}(:\d+)?(\/.*)?$/.test(v)) {
              v = `https://${v}`;
            }
          }
          // Always open in new tab. Persist attributes to the model and
          // also update the DOM and re-render the view so changes appear immediately.
          try {
            const attrs = {
              href: v,
              target: "_blank",
              rel: "noopener noreferrer",
            } as any;

            // Prefer model API to persist
            if (anchor.addAttributes) anchor.addAttributes(attrs);
            else if (anchor.set) {
              const prev = anchor.getAttributes ? anchor.getAttributes() : {};
              anchor.set("attributes", { ...prev, ...attrs });
            }

            // Update underlying DOM element if available
            try {
              const el = anchor.getEl && anchor.getEl();
              if (el && el.setAttribute) {
                el.setAttribute("href", attrs.href);
                el.setAttribute("target", attrs.target);
                el.setAttribute("rel", attrs.rel);
              }
            } catch {
              /* no-op */
            }

            // Re-render the view so GrapesJS updates any visual state
            try {
              anchor.view &&
                typeof anchor.view.render === "function" &&
                anchor.view.render();
            } catch {
              /* no-op */
            }
          } catch (e) {
            /* no-op */
          }
          modal.close();
          // Keep the anchor selected so user can continue editing
          try {
            ed.setSelected && ed.setSelected(anchor);
          } catch {
            /* no-op */
          }
        });
      }
    },
  });

  // Custom command: move the parent LI instead of the anchor
  // Movement of menu items/subitems intentionally disabled. Previously a menu-li-move command
  // existed to start GrapesJS move handlers; removed to prevent accidental reordering.

  // Commands to add/remove items
  editor.Commands.add("nav-add-item-after", {
    run(ed: any) {
      const sel = ed.getSelected?.();
      if (!sel) return;
      // Walk up to LI model
      let li = sel;
      try {
        li = findNearestAncestorByTag(li, "li");
      } catch (e) {
        li = null;
      }
      if (!li) return;
      const parent = li.parent && li.parent();
      if (!parent) return;
      try {
        const siblings = parent.components && parent.components();
        const idx = siblings.indexOf
          ? siblings.indexOf(li)
          : siblings.models.indexOf(li);
        const newItem = siblings.add(
          {
            tagName: "li",
            draggable: false,
            // Ensure GrapesJS won't render this as draggable in persisted HTML
            attributes: { "data-gjs-draggable": "false" },
            components: [
              {
                tagName: "a",
                type: "link",
                attributes: {
                  href: "#",
                  class: "nav-link",
                  target: "_blank",
                  rel: "noopener noreferrer",
                },
                content: "New Item",
              },
            ],
          },
          { at: idx + 1 }
        );
        ed.setSelected && ed.setSelected(newItem);
      } catch (err) {
        console.warn("[NavPlugin] nav-add-item-after failed", err);
      }
    },
  });

  // Insert a top-level item BEFORE the selected LI
  editor.Commands.add("nav-add-item-before", {
    run(ed: any) {
      const sel = ed.getSelected?.();
      if (!sel) return;
      // Walk up to LI model
      let li = sel;
      try {
        li = findNearestAncestorByTag(li, "li");
      } catch (e) {
        li = null;
      }
      if (!li) return;
      const parent = li.parent && li.parent();
      if (!parent) return;
      try {
        const siblings = parent.components && parent.components();
        const idx = siblings.indexOf
          ? siblings.indexOf(li)
          : siblings.models.indexOf(li);
        const newItem = siblings.add(
          {
            tagName: "li",
            draggable: false,
            attributes: { "data-gjs-draggable": "false" },
            components: [
              {
                tagName: "a",
                type: "link",
                attributes: {
                  href: "#",
                  class: "nav-link",
                  target: "_blank",
                  rel: "noopener noreferrer",
                },
                content: "New Item",
              },
            ],
          },
          { at: idx }
        );
        ed.setSelected && ed.setSelected(newItem);
      } catch (err) {
        console.warn("[NavPlugin] nav-add-item-before failed", err);
      }
    },
  });

  editor.Commands.add("nav-remove-item", {
    run(ed: any) {
      const sel = ed.getSelected?.();
      if (!sel) return;
      let li = sel;
      try {
        li = findNearestAncestorByTag(li, "li");
      } catch (e) {
        li = null;
      }
      if (!li) return;
      try {
        // Deselect first so GrapesJS removes any toolbar attached to this component
        try {
          ed.select && ed.select(null);
        } catch {
          /* no-op */
        }
        li.remove && li.remove();
      } catch (err) {
        console.warn("[NavPlugin] nav-remove-item failed", err);
      }
    },
  });

  editor.Commands.add("nav-add-submenu", {
    run(ed: any) {
      const sel = ed.getSelected?.();
      if (!sel) return;
      let li = sel;
      try {
        li = findNearestAncestorByTag(li, "li");
      } catch (e) {
        li = null;
      }
      if (!li) return;
      try {
        // find existing submenu
        const found = li.find ? li.find("ul.submenu") : [];
        let submenu = Array.isArray(found) && found[0] ? found[0] : null;
        if (!submenu) {
          submenu = li.append({
            tagName: "ul",
            attributes: { class: "submenu" },
            components: [],
            style: {
              listStyle: "none",
              margin: "6px 0 0 14px",
              padding: "0",
              borderLeft: "2px solid #ddd",
              display: "block",
            },
          });
          if (Array.isArray(submenu)) submenu = submenu[0];
        }
        // add an item
        let newItem = submenu.append({
          tagName: "li",
          draggable: false,
          attributes: {
            "data-gjs-draggable": "false",
            "data-menu-subitem": "1",
          },
          components: [
            {
              tagName: "a",
              type: "link",
              attributes: {
                href: "#",
                class: "submenu-link",
                target: "_blank",
                rel: "noopener noreferrer",
              },
              content: "New Submenu Item",
            },
          ],
          style: { padding: "2px 4px", cursor: "text" },
        });
        if (Array.isArray(newItem)) newItem = newItem[0];
        // mark parent li for preview arrow
        try {
          if (li.addAttributes) li.addAttributes({ "data-has-submenu": "1" });
          else {
            const prev = li.getAttributes ? li.getAttributes() : {};
            li.set &&
              li.set("attributes", { ...prev, "data-has-submenu": "1" });
          }
        } catch (e) {
          /* no-op */
        }
        ed.setSelected && ed.setSelected(newItem || submenu);
      } catch (err) {
        console.warn("[NavPlugin] nav-add-submenu failed", err);
      }
    },
  });

  editor.Commands.add("nav-add-subitem-before", {
    run(ed: any) {
      const sel = ed.getSelected?.();
      if (!sel) return;
      let li = sel;
      try {
        while (
          li &&
          li.get &&
          (li.get("tagName") || "").toLowerCase() !== "li"
        ) {
          li = li.parent && li.parent();
        }
      } catch (e) {
        li = null;
      }
      if (!li) return;
      const parentUl = li.parent && li.parent();
      if (!parentUl) return;
      const pclass = parentUl.getAttributes
        ? parentUl.getAttributes().class || ""
        : "";
      if (!pclass.includes("submenu")) return; // only for subitems
      try {
        const siblings = parentUl.components && parentUl.components();
        const idx = siblings.indexOf
          ? siblings.indexOf(li)
          : siblings.models.indexOf(li);
        const newItem = siblings.add(
          {
            tagName: "li",
            draggable: false,
            attributes: {
              "data-gjs-draggable": "false",
              "data-menu-subitem": "1",
            },
            components: [
              {
                tagName: "a",
                type: "link",
                attributes: {
                  href: "#",
                  class: "submenu-link",
                  target: "_blank",
                  rel: "noopener noreferrer",
                },
                content: "New Submenu Item",
              },
            ],
            style: li.getStyle ? li.getStyle() : { padding: "2px 4px" },
          },
          { at: idx }
        );
        ed.setSelected && ed.setSelected(newItem);
      } catch (err) {
        console.warn("[NavPlugin] nav-add-subitem-before failed", err);
      }
    },
  });

  editor.Commands.add("nav-add-subitem-after", {
    run(ed: any) {
      const sel = ed.getSelected?.();
      if (!sel) return;
      let li = sel;
      try {
        while (
          li &&
          li.get &&
          (li.get("tagName") || "").toLowerCase() !== "li"
        ) {
          li = li.parent && li.parent();
        }
      } catch (e) {
        li = null;
      }
      if (!li) return;
      const parentUl = li.parent && li.parent();
      if (!parentUl) return;
      const pclass = parentUl.getAttributes
        ? parentUl.getAttributes().class || ""
        : "";
      if (!pclass.includes("submenu")) return; // only for subitems
      try {
        const siblings = parentUl.components && parentUl.components();
        const idx = siblings.indexOf
          ? siblings.indexOf(li)
          : siblings.models.indexOf(li);
        const newItem = siblings.add(
          {
            tagName: "li",
            draggable: false,
            attributes: {
              "data-gjs-draggable": "false",
              "data-menu-subitem": "1",
            },
            components: [
              {
                tagName: "a",
                type: "link",
                attributes: {
                  href: "#",
                  class: "submenu-link",
                  target: "_blank",
                  rel: "noopener noreferrer",
                },
                content: "New Submenu Item",
              },
            ],
            style: li.getStyle ? li.getStyle() : { padding: "2px 4px" },
          },
          { at: idx + 1 }
        );
        ed.setSelected && ed.setSelected(newItem);
      } catch (err) {
        console.warn("[NavPlugin] nav-add-subitem-after failed", err);
      }
    },
  });

  editor.Commands.add("nav-remove-subitem", {
    run(ed: any) {
      const sel = ed.getSelected?.();
      if (!sel) return;
      let li = sel;
      try {
        while (
          li &&
          li.get &&
          (li.get("tagName") || "").toLowerCase() !== "li"
        ) {
          li = li.parent && li.parent();
        }
      } catch (e) {
        li = null;
      }
      if (!li) return;
      const parentUl = li.parent && li.parent();
      if (!parentUl) return;
      const pclass = parentUl.getAttributes
        ? parentUl.getAttributes().class || ""
        : "";
      if (!pclass.includes("submenu")) return; // only for subitems
      try {
        // Get the parent LI (the main menu item that contains this submenu)
        const mainMenuLi = parentUl.parent && parentUl.parent();

        // Deselect the component first to remove toolbar
        ed.select && ed.select(null);

        // Remove the subitem
        li.remove && li.remove();

        // Check if submenu is now empty and remove it if so
        if (parentUl && parentUl.components) {
          const remainingItems = parentUl.components();
          if (remainingItems && remainingItems.length === 0) {
            // Remove the empty submenu container
            parentUl.remove && parentUl.remove();

            // Remove the data-has-submenu attribute from parent LI
            if (
              mainMenuLi &&
              mainMenuLi.get &&
              mainMenuLi.get("tagName")?.toLowerCase() === "li"
            ) {
              try {
                const currentAttrs = mainMenuLi.getAttributes
                  ? mainMenuLi.getAttributes()
                  : {};
                const { "data-has-submenu": _, ...newAttrs } = currentAttrs;
                mainMenuLi.set && mainMenuLi.set("attributes", newAttrs);
              } catch (e) {
                console.warn(
                  "[NavPlugin] Could not remove data-has-submenu attribute",
                  e
                );
              }
            }
          }
        }
      } catch (err) {
        console.warn("[NavPlugin] nav-remove-subitem failed", err);
      }
    },
  });

  // Add toolbar icon when nav-link or submenu-link is selected (only in edit mode)
  editor.on("component:selected", (component: any) => {
    try {
      const el = component.getEl && component.getEl();
      let inEdit = false;
      let insideCustomMenu = false;

      if (el) {
        const container = el.closest && el.closest(".custom-menu-container");
        insideCustomMenu = !!container;
        if (container) {
          inEdit = container.classList.contains("editing");
        }
      }

      // If inside our custom menu but not in edit mode: prevent selection and hide toolbars
      // Exception: allow selecting the outer custom-menu container itself so its toolbar (move/delete)
      // remains available. Only block selection for inner elements (anchors, LIs, etc.).
      if (insideCustomMenu && !inEdit) {
        try {
          const containerEl =
            el && el.closest && el.closest(".custom-menu-container");
          const isContainerModel = !!(
            component &&
            ((component.get && component.get("type") === "custom-menu") ||
              (component.getAttributes &&
                component.getAttributes()["data-gjs-type"] === "custom-menu") ||
              (component.getEl && component.getEl() === containerEl))
          );
          if (!isContainerModel) {
            component.set && component.set("toolbar", []);
            editor.select && editor.select(null as any);
            return;
          }
        } catch (e) {
          // Fallback to previous behavior if any check fails
          component.set && component.set("toolbar", []);
          editor.select && editor.select(null as any);
          return;
        }
      }

      // Existing behavior: add toolbar for anchors and LIs when in edit mode, otherwise strip entries
      const tag = component.get && component.get("tagName");
      const classes = component.getClasses ? component.getClasses() : [];
      const isMenuLink =
        tag &&
        tag.toLowerCase() === "a" &&
        (classes.includes("nav-link") || classes.includes("submenu-link"));

      // Check if this is a submenu LI
      const isSubitemLi =
        tag &&
        tag.toLowerCase() === "li" &&
        (() => {
          try {
            const parentUl = component.parent && component.parent();
            if (!parentUl) return false;
            const parentAttrs = parentUl.getAttributes
              ? parentUl.getAttributes()
              : {};
            return (parentAttrs.class || "").includes("submenu");
          } catch {
            return false;
          }
        })();

      // If in edit mode and user clicked inside an anchor (e.g., a span/text), normalize selection to the anchor
      // but do NOT trigger any modal or command. Only normalize selection.
      if (inEdit && !isMenuLink && !isSubitemLi) {
        try {
          const m = findNearestAncestorByTag(component, "a");
          if (m && m.get) {
            const classes = m.getClasses ? m.getClasses() : [];
            if (
              classes.includes("nav-link") ||
              classes.includes("submenu-link")
            ) {
              editor.select && editor.select(m);
              component = m;
            }
          }
        } catch {
          /* no-op */
        }
      }

      const componentTag = component.get && component.get("tagName");
      const componentClasses = component.getClasses
        ? component.getClasses()
        : [];
      const nowIsMenuLink =
        componentTag &&
        componentTag.toLowerCase() === "a" &&
        (componentClasses.includes("nav-link") ||
          componentClasses.includes("submenu-link"));

      const nowIsSubitemLi =
        componentTag &&
        componentTag.toLowerCase() === "li" &&
        (() => {
          try {
            const parentUl = component.parent && component.parent();
            if (!parentUl) return false;
            const parentAttrs = parentUl.getAttributes
              ? parentUl.getAttributes()
              : {};
            return (parentAttrs.class || "").includes("submenu");
          } catch {
            return false;
          }
        })();

      if ((nowIsMenuLink || nowIsSubitemLi) && inEdit) {
        try {
          // Delegate toolbar construction to the shared helper to avoid duplication
          (buildMenuToolbarForModel as any)(component);
        } catch (e) {
          // Fallback: ensure at least the change link exists
          if (nowIsMenuLink) {
            component.set?.("toolbar", [
              {
                attributes: { class: "fa fa-link", title: "Change link" },
                command: "set-menu-link",
              },
            ]);
          } else if (nowIsSubitemLi) {
            component.set?.("toolbar", [
              {
                attributes: { class: "fa fa-link", title: "Change link" },
                command: "set-menu-link",
              },
              {
                attributes: { class: "fa fa-minus", title: "Remove sub item" },
                command: "nav-remove-subitem",
              },
            ]);
          }
        }
      } else if (component.get("toolbar")) {
        const toolbar = (component.get("toolbar") || []).filter(
          (t: any) =>
            t?.command !== "set-menu-link" && !/^nav-/.test(t?.command || "")
        );
        component.set && component.set("toolbar", toolbar);
      }
    } catch {
      /* no-op */
    }
  });
}

export const customMenuItemsPlugin = (editor: Editor) => {
  addMenuLinkToolbar(editor);
  const bm = editor.BlockManager;
  const domc = editor.DomComponents;
  // Define a lightweight component type for formatting wrappers inside our menu anchors
  try {
    domc.addType("menu-formatting-wrapper", {
      isComponent: (el: any) => {
        if (!el || !el.tagName) return false;
        const tag = (el.tagName || "").toLowerCase();
        const isWrapper = FORMATTING_TAGS.includes(tag);
        const inMenuAnchor = !!(
          el.closest && el.closest("a.nav-link, a.submenu-link")
        );
        return isWrapper && inMenuAnchor
          ? ({ type: "menu-formatting-wrapper" } as any)
          : false;
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
          traits: [],
        },
      },
      view: {
        onRender() {
          try {
            const el = (this as any).el as HTMLElement | null;
            if (!el) return;
            el.style.pointerEvents = "none";
            el.style.userSelect = "none";
            el.removeAttribute && el.removeAttribute("data-gjs-type");
            el.classList.add("gjs-wrapper-neutralized");
          } catch {
            /* no-op */
          }
        },
      },
    });
  } catch {
    /* ignore registration errors (hot reload) */
  }
  console.log("[NavPlugin] Initializing custom menu plugin");

  function setupRTEFixes(editor: Editor) {
    try {
      const rte = (editor as any).RichTextEditor;
      if (!rte) {
        console.warn(
          "[NavPlugin] RichTextEditor not available (setupRTEFixes)"
        );
        return;
      }
      console.log("[NavPlugin] Setting up RTE post-processing fixes");

      const findMenuAnchor = (component: any) => {
        let cur = component;
        while (cur) {
          const tag = (cur.get && cur.get("tagName"))?.toLowerCase?.();
          const classes = cur.getClasses ? cur.getClasses() : [];
          if (
            tag === "a" &&
            (classes.includes("nav-link") || classes.includes("submenu-link"))
          )
            return cur;
          cur = cur.parent && cur.parent();
        }
        return null;
      };

      // use shared cleanupWrappersAtAnchor helper defined at module scope

      // Hook rte:disable to clean up after the native RTE finishes
      (editor as any).on &&
        (editor as any).on("rte:disable", (component: any) => {
          try {
            const anchor = findMenuAnchor(component);
            if (anchor) setTimeout(() => cleanupWrappersAtAnchor(anchor), 20);
          } catch (e) {
            void e;
          }
        });

      console.log("[NavPlugin] RTE post-processing enabled");
    } catch (err) {
      console.warn("[NavPlugin] setupRTEFixes failed", err);
    }
  }

  // Shared helper: cleanup formatting wrappers inside an anchor model
  function cleanupWrappersAtAnchor(anchor: any) {
    if (!anchor) return;
    try {
      const el = anchor.getEl && anchor.getEl();
      if (!el) return;

      // Find formatting wrappers inside the anchor
      const wrappers = el.querySelectorAll(FORMATTING_SELECTOR);

      const combined: any = {};
      // If multiple wrappers exist, presence of tag types wins.
      // Also preserve common inline CSS that RTE may apply: color, background, font-size, family, etc.
      if (wrappers && wrappers.length) {
        wrappers.forEach((w: Element) => {
          const t = w.tagName.toLowerCase();
          const st = (w as HTMLElement).style;
          if (t === "b" || t === "strong")
            combined.fontWeight = combined.fontWeight || "700";
          if (t === "i" || t === "em")
            combined.fontStyle = combined.fontStyle || "italic";
          if (t === "u")
            combined.textDecoration =
              (combined.textDecoration || "") + " underline";
          if (st) {
            // typography
            if (st.fontWeight) combined.fontWeight = st.fontWeight;
            if (st.fontStyle) combined.fontStyle = st.fontStyle;
            if (st.fontSize) combined.fontSize = st.fontSize;
            if (st.fontFamily) combined.fontFamily = st.fontFamily;
            if (st.lineHeight) combined.lineHeight = st.lineHeight;
            if (st.letterSpacing) combined.letterSpacing = st.letterSpacing;
            // colors
            if (st.color) combined.color = st.color;
            if (st.backgroundColor)
              combined.backgroundColor = st.backgroundColor;
            if (st.textDecoration) combined.textDecoration = st.textDecoration;
            if (st.textDecorationColor)
              combined.textDecorationColor = st.textDecorationColor;
          }
        });
      }

      // Also inspect any inline styles applied directly on the anchor itself (RTE may style the anchor)
      try {
        const aSt = (el as HTMLElement).style;
        if (aSt) {
          if (aSt.color) combined.color = combined.color || aSt.color;
          if (aSt.backgroundColor)
            combined.backgroundColor =
              combined.backgroundColor || aSt.backgroundColor;
          if (aSt.fontWeight)
            combined.fontWeight = combined.fontWeight || aSt.fontWeight;
          if (aSt.fontStyle)
            combined.fontStyle = combined.fontStyle || aSt.fontStyle;
          if (aSt.fontSize)
            combined.fontSize = combined.fontSize || aSt.fontSize;
          if (aSt.fontFamily)
            combined.fontFamily = combined.fontFamily || aSt.fontFamily;
          if (aSt.lineHeight)
            combined.lineHeight = combined.lineHeight || aSt.lineHeight;
          if (aSt.letterSpacing)
            combined.letterSpacing =
              combined.letterSpacing || aSt.letterSpacing;
          if (aSt.textDecoration)
            combined.textDecoration =
              combined.textDecoration || aSt.textDecoration;
        }
      } catch {
        /* no-op */
      }

      const text = (el.textContent || "").replace(/\s+/g, " ").trim();

      const hasStyling = Object.keys(combined).length > 0;
      if (!hasStyling && (!wrappers || wrappers.length === 0)) {
        // nothing to do
        return;
      }

      // Update model content first (normalize text nodes) so DOM is stable for inline style application
      try {
        anchor.set && anchor.set("content", text);
        anchor.view &&
          typeof anchor.view.render === "function" &&
          anchor.view.render();
      } catch {
        /* no-op */
      }

      if (hasStyling) {
        const importantize = (v: any) => {
          if (v == null) return v;
          const s = String(v).trim();
          if (!s) return s;
          if (s.indexOf("!important") !== -1) return s;
          return s + " !important";
        };

        const styled: any = { ...combined };
        if (styled.color) styled.color = importantize(styled.color);
        if (styled.backgroundColor)
          styled.backgroundColor = importantize(styled.backgroundColor);
        if (styled.fontSize) styled.fontSize = importantize(styled.fontSize);
        if (styled.fontFamily)
          styled.fontFamily = importantize(styled.fontFamily);
        if (styled.lineHeight)
          styled.lineHeight = importantize(styled.lineHeight);
        if (styled.letterSpacing)
          styled.letterSpacing = importantize(styled.letterSpacing);
        if (styled.textDecoration)
          styled.textDecoration = importantize(styled.textDecoration);
        if (styled.textDecorationColor)
          styled.textDecorationColor = importantize(styled.textDecorationColor);
        if (styled.fontWeight) {
          styled.fontWeight = importantize(styled.fontWeight);
        }
        if (styled.fontStyle) styled.fontStyle = importantize(styled.fontStyle);

        // Persist model styles
        anchor.addStyle && anchor.addStyle(styled);

        // Apply inline DOM styles with !important after the next paint so GrapesJS re-renders don't clobber them.
        try {
          const applyDomImportant = (a: any, props: any) => {
            try {
              const el = a.getEl && a.getEl();
              if (!el) return;
              const toCss = (k: string) =>
                k.replace(/([A-Z])/g, "-$1").toLowerCase();
              Object.keys(props || {}).forEach((k) => {
                try {
                  let v = props[k];
                  if (v == null) return;
                  v = String(v)
                    .replace(/\s*!important\s*$/i, "")
                    .trim();
                  (el as HTMLElement).style.setProperty(
                    toCss(k),
                    v,
                    "important"
                  );
                } catch {
                  /* no-op */
                }
              });
            } catch {
              /* no-op */
            }
          };

          // schedule after render using requestAnimationFrame (may call twice to ensure paint)
          requestAnimationFrame(() =>
            requestAnimationFrame(() => applyDomImportant(anchor, styled))
          );
        } catch {
          /* no-op */
        }
      }
      // ensure selection/visuals update
      try {
        anchor.view &&
          typeof anchor.view.render === "function" &&
          anchor.view.render();
      } catch {
        /* no-op */
      }
    } catch (e) {
      console.warn("[NavPlugin] cleanupWrappersAtAnchor error", e);
    }
  }

  // Debounced cleanup when GrapesJS creates wrapper components during editing
  let cleanupTimeout: any = null;
  editor.on &&
    editor.on("component:add", (model: any) => {
      try {
        const parent = model && model.parent && model.parent();
        // If LI or A components are added anywhere inside our custom menu, ensure they are non-draggable
        try {
          const el = model && model.getEl && model.getEl();
          const insideMenu =
            el && el.closest && el.closest(".custom-menu-container");
          const modelTag = (
            (model.get && model.get("tagName")) ||
            ""
          ).toLowerCase();
          if (insideMenu && (modelTag === "li" || modelTag === "a")) {
            // Neutralize dragging at the model level
            model.set && model.set({ draggable: false });
            try {
              model.addAttributes &&
                model.addAttributes({ "data-gjs-draggable": "false" });
            } catch {
              /* no-op */
            }
            try {
              if (el && el.setAttribute)
                el.setAttribute("data-gjs-draggable", "false");
            } catch {
              /* no-op */
            }
            try {
              if (el) (el as HTMLElement).draggable = false;
            } catch {
              /* no-op */
            }
          }
        } catch (e) {
          /* no-op */
        }

        if (!parent) return;
        const pTag = (
          (parent.get && parent.get("tagName")) ||
          ""
        ).toLowerCase();
        const pClasses = parent.getClasses ? parent.getClasses() : [];
        const isMenuAnchor =
          pTag === "a" &&
          (pClasses.includes("nav-link") || pClasses.includes("submenu-link"));
        if (!isMenuAnchor) return;
        const modelTag = (
          (model.get && model.get("tagName")) ||
          ""
        ).toLowerCase();
        const isWrapper = FORMATTING_TAGS.includes(modelTag);
        if (!isWrapper) return;

        // Immediately attempt to neutralize the model so it never becomes interactive
        try {
          model.set &&
            model.set({
              selectable: false,
              draggable: false,
              hoverable: false,
              layerable: false,
              copyable: false,
              removable: false,
              resizable: false,
              editable: false,
              toolbar: [],
            });
          const domEl = model.getEl && model.getEl();
          if (domEl && domEl.classList)
            domEl.classList.add("gjs-wrapper-neutralized");
          try {
            domEl &&
              domEl.removeAttribute &&
              domEl.removeAttribute("data-gjs-type");
          } catch {
            /* no-op */
          }
        } catch {
          /* no-op */
        }

        if (cleanupTimeout) clearTimeout(cleanupTimeout);
        cleanupTimeout = setTimeout(() => {
          try {
            cleanupWrappersAtAnchor(parent);
          } catch (e) {
            void e;
          }
        }, 50);
      } catch (e) {
        void e;
      }
    });

  // After editor load, scan existing components and enforce non-draggability for any LIs/A inside our custom menu
  try {
    (editor as any).on &&
      (editor as any).on("load", () => {
        setTimeout(() => {
          try {
            const wrapper = editor.getWrapper && editor.getWrapper();
            if (!wrapper || !wrapper.find) return;
            const all = wrapper.find("*") || [];
            all.forEach((m: any) => {
              try {
                const tag = ((m.get && m.get("tagName")) || "").toLowerCase();
                const el = m.getEl && m.getEl();
                const inside =
                  el && el.closest && el.closest(".custom-menu-container");
                if (inside && (tag === "li" || tag === "a")) {
                  m.set && m.set({ draggable: false });
                  try {
                    m.addAttributes &&
                      m.addAttributes({ "data-gjs-draggable": "false" });
                  } catch {
                    /* no-op */
                  }
                  try {
                    if (el && el.setAttribute)
                      el.setAttribute("data-gjs-draggable", "false");
                  } catch {
                    /* no-op */
                  }
                  try {
                    if (el) (el as HTMLElement).draggable = false;
                  } catch {
                    /* no-op */
                  }
                }
              } catch (e) {
                /* no-op */
              }
            });
          } catch (e) {
            /* no-op */
          }
        }, 200);
      });
  } catch {
    /* no-op */
  }

  // If a wrapper somehow becomes selected, immediately redirect selection to its parent anchor
  editor.on &&
    editor.on("component:selected", (model: any) => {
      try {
        if (!model) return;
        const tag = ((model.get && model.get("tagName")) || "").toLowerCase();
        if (!FORMATTING_TAGS.includes(tag)) return;
        const parent = model.parent && model.parent();
        const parentTag = (
          (parent && parent.get && parent.get("tagName")) ||
          ""
        ).toLowerCase();
        const parentClasses =
          parent && parent.getClasses ? parent.getClasses() : [];
        const isMenuAnchor =
          parentTag === "a" &&
          (parentClasses.includes("nav-link") ||
            parentClasses.includes("submenu-link"));
        if (isMenuAnchor) {
          try {
            editor.select && editor.select(parent);
          } catch {
            /* no-op */
          }
        }
      } catch (e) {
        void e;
      }
    });

  function setupDOMNeutralizer() {
    try {
      const canvasBody =
        editor.Canvas && editor.Canvas.getBody && editor.Canvas.getBody();
      if (!canvasBody || !(window as any).MutationObserver) return;
      const observer = new MutationObserver((mutations) => {
        try {
          mutations.forEach((m) => {
            m.addedNodes &&
              m.addedNodes.forEach((n) => {
                if (n && (n as Element).nodeType === 1) {
                  const el = n as Element;
                  const anchored =
                    el.closest && el.closest("a.nav-link, a.submenu-link");
                  if (anchored) {
                    const t = (el.tagName || "").toLowerCase();
                    if (FORMATTING_TAGS.includes(t)) {
                      try {
                        el.removeAttribute &&
                          el.removeAttribute("data-gjs-type");
                        el.removeAttribute &&
                          el.removeAttribute("data-gjs-draggable");
                        el.removeAttribute &&
                          el.removeAttribute("data-gjs-selectable");
                        el.classList &&
                          el.classList.add("gjs-wrapper-neutralized");
                        (el as HTMLElement).style.pointerEvents = "none";
                      } catch {
                        /* no-op */
                      }
                    }
                  }
                }
              });
          });
        } catch {
          /* no-op */
        }
      });
      observer.observe(canvasBody, { childList: true, subtree: true });
      // Prevent native drag operations from elements inside our custom menu container
      try {
        const dragHandler = (ev: Event) => {
          try {
            const t = ev.target as Element | null;
            if (!t) return;
            const inside = t.closest && t.closest(".custom-menu-container");
            if (inside) {
              ev.preventDefault && ev.preventDefault();
              ev.stopPropagation && ev.stopPropagation();
              // For good measure also set dataTransfer effect if available
              try {
                (ev as DragEvent).dataTransfer &&
                  ((ev as DragEvent).dataTransfer!.dropEffect = "none");
              } catch {
                /* no-op */
              }
            }
          } catch {
            /* no-op */
          }
        };
        // Use capture phase so we intercept before other handlers
        canvasBody.addEventListener("dragstart", dragHandler, true);
        // Also attach to document to catch any elements that may be moved outside canvas
        document.addEventListener("dragstart", dragHandler, true);
      } catch {
        /* no-op */
      }
    } catch {
      /* no-op */
    }
  }

  try {
    (editor as any).on &&
      (editor as any).on("load", () => setTimeout(setupDOMNeutralizer, 50));
  } catch {
    /* no-op */
  }

  // Let GrapeJS handle toolbar positioning naturally

  let rteActive = false;
  try {
    const hideAllToolbars = () => {
      try {
        const canvasBody =
          editor.Canvas && editor.Canvas.getBody && editor.Canvas.getBody();
        const docs = [
          document,
          (canvasBody && (canvasBody as any).ownerDocument) || document,
        ];
        docs.forEach((d: Document) => {
          try {
            const toolbars = Array.from(
              d.querySelectorAll(".gjs-toolbar")
            ) as Element[];
            toolbars.forEach((tb) => {
              try {
                (tb as HTMLElement).setAttribute("data-navplugin-hidden", "1");
                (tb as HTMLElement).style.display = "none";
              } catch {
                /* no-op */
              }
            });
          } catch {
            /* no-op */
          }
        });
      } catch {
        /* no-op */
      }
    };

    const restoreToolbars = () => {
      try {
        const hidden = Array.from(
          document.querySelectorAll("[data-navplugin-hidden]")
        ) as Element[];
        hidden.forEach((tb) => {
          try {
            tb.removeAttribute("data-navplugin-hidden");
            (tb as HTMLElement).style.display = "";
          } catch {
            /* no-op */
          }
        });
        // Also check canvas document
        const canvasBody =
          editor.Canvas && editor.Canvas.getBody && editor.Canvas.getBody();
        const doc = canvasBody && (canvasBody as any).ownerDocument;
        if (doc && doc !== document) {
          const hidden2 = Array.from(
            doc.querySelectorAll("[data-navplugin-hidden]")
          ) as Element[];
          hidden2.forEach((tb) => {
            try {
              tb.removeAttribute("data-navplugin-hidden");
              (tb as HTMLElement).style.display = "";
            } catch {
              /* no-op */
            }
          });
        }
      } catch {
        /* no-op */
      }
    };

    // Observe for toolbar nodes so we can hide them immediately if RTE is active
    let toolbarObserver: MutationObserver | null = null;
    const ensureToolbarObserver = () => {
      try {
        if (toolbarObserver) return;
        const canvasBody =
          editor.Canvas && editor.Canvas.getBody && editor.Canvas.getBody();
        const root = canvasBody || document.body;
        toolbarObserver = new MutationObserver((mutations) => {
          try {
            mutations.forEach((m) => {
              m.addedNodes &&
                m.addedNodes.forEach((n) => {
                  if (n && (n as Element).nodeType === 1) {
                    const el = n as Element;
                    if (el.classList && el.classList.contains("gjs-toolbar")) {
                      if (rteActive) {
                        try {
                          (el as HTMLElement).setAttribute(
                            "data-navplugin-hidden",
                            "1"
                          );
                          (el as HTMLElement).style.display = "none";
                        } catch {
                          /* no-op */
                        }
                      } else {
                        // Don't override toolbar position - let GrapeJS handle it naturally
                        // const sel = editor.getSelected && editor.getSelected();
                        // if (sel) setTimeout(() => positionToolbarAtRight(sel), 10);
                      }
                    }
                  }
                });
            });
          } catch {
            /* no-op */
          }
        });
        toolbarObserver.observe(root, { childList: true, subtree: true });
      } catch {
        /* no-op */
      }
    };

    (editor as any).on &&
      (editor as any).on("rte:enable", (cmp: any) => {
        try {
          rteActive = true;
          hideAllToolbars();
          ensureToolbarObserver();
        } catch {
          /* no-op */
        }
      });

    (editor as any).on &&
      (editor as any).on("rte:disable", (cmp: any) => {
        try {
          rteActive = false;
          // restore any hidden toolbars - let GrapeJS handle positioning naturally
          restoreToolbars();
          // Don't override toolbar position
          // const sel = editor.getSelected && editor.getSelected();
          // if (sel) setTimeout(() => positionToolbarAtRight(sel), 10);
        } catch {
          /* no-op */
        }
      });
  } catch {
    /* no-op */
  }

  // Reposition toolbar on component selection if it's a menu anchor and we're in edit mode
  try {
    editor.on &&
      editor.on("component:selected", (component: any) => {
        try {
          if (!component) return;
          const tag = (
            (component.get && component.get("tagName")) ||
            ""
          ).toLowerCase();
          const classes = component.getClasses ? component.getClasses() : [];
          const isMenuLink =
            tag === "a" &&
            (classes.includes("nav-link") || classes.includes("submenu-link"));
          // Check edit mode via DOM
          const el = component.getEl && component.getEl();
          const inEdit = !!(
            el &&
            el.closest &&
            el.closest(".custom-menu-container") &&
            el.closest(".custom-menu-container").classList.contains("editing")
          );
          if (isMenuLink && inEdit) {
            // Don't override toolbar position - let GrapeJS handle it naturally
            // The global resetToolbarPosition in index.ts will ensure proper positioning
            // setTimeout(() => positionToolbarAtRight(component), 10);
          }
        } catch {
          /* no-op */
        }
      });
  } catch {
    /* no-op */
  }

  // Wire setup after editor loads and a small fallback
  try {
    (editor as any).on &&
      (editor as any).on("load", () => setupRTEFixes(editor));
  } catch {
    /* no-op */
  }
  setTimeout(() => setupRTEFixes(editor), 150);

  // Avoid duplicate registration if hot-reloaded
  if (!bm.get("custom-menu")) {
    console.log("[NavPlugin] Registering block 'custom-menu'");
    bm.add("custom-menu", {
      label: "Custom Menu",
      // Use its own category so it's easier to locate
      category: "Navigation",
      content: `
      <style data-custom-menu-scrollbar>
  /* Hide scrollbar (still scrollable) */
  /* Use a subtle solid border instead of dotted to match production styling */
  .custom-menu-container { 
    scrollbar-width: none; 
    -ms-overflow-style: none; 
    border: 1px solid #e0e0e0;
    font-size: 16px; /* default base font-size for menu items (user can override with trait) */
  }
        .custom-menu-container::-webkit-scrollbar { width:0; height:0; }

        /* BULLETPROOF: Remove ALL bullets and markers from lists inside menu */
        .custom-menu-container ul,
        .custom-menu-container ol {
          list-style: none !important;
          list-style-type: none !important;
          list-style-image: none !important;
          list-style-position: outside !important;
          padding-left: 0 !important;
          margin-left: 0 !important;
        }

        .custom-menu-container li {
          list-style: none !important;
          list-style-type: none !important;
          list-style-image: none !important;
          list-style-position: outside !important;
        }

        /* Hide the ::marker pseudo-element that creates bullets - AGGRESSIVE APPROACH */
        .custom-menu-container li::marker,
        .custom-menu-container ul li::marker,
        .custom-menu-container ol li::marker,
        .custom-menu-container li::before {
          content: none !important;
          display: none !important;
          width: 0 !important;
          height: 0 !important;
          font-size: 0 !important;
          line-height: 0 !important;
          visibility: hidden !important;
        }

        /* Additional marker suppression for different browsers */
        .custom-menu-container li {
          position: relative;
        }

        .custom-menu-container li::marker {
          unicode-bidi: isolate;
          font-variant-numeric: tabular-nums;
          text-transform: none;
          text-indent: 0px !important;
          text-align: start !important;
          text-align-last: auto !important;
          content: "" !important;
          display: none !important;
        }

        /* Force override any user agent styles */
        .custom-menu-container * {
          list-style: none !important;
          list-style-type: none !important;
        }

  /* Ensure edit/action buttons maintain fixed styling - completely isolated from container traits */
  .custom-menu-container .edit-menu-btn {
    font-size: 12px !important; 
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
    font-weight: 400 !important;
    color: white !important;
    background: #0078d4 !important;
    line-height: 1 !important; 
    padding: 8px 6px !important; /* More top/bottom padding */
    cursor: pointer !important; 
  }
  
  .custom-menu-container .menu-edit-btn, 
  .custom-menu-container .item-action-btn {
    font-size: 12px !important; 
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
    font-weight: 400 !important;
    color: inherit !important;
    line-height: 1 !important; 
    padding: 2px 4px !important; /* Small action buttons */
    cursor: pointer !important; 
  }
  
  /* COMPLETE ISOLATION: Toggle button and label - NO traits should affect these at all */
  .custom-menu-container .toggle-link-modal-btn {
    font-size: 12px !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
    font-weight: 600 !important;
    color: white !important;
    background: #0078d4 !important;
    padding: 4px 0 !important;
    border: none !important;
    text-decoration: none !important;
    text-transform: none !important;
    letter-spacing: normal !important;
    word-spacing: normal !important;
    line-height: 1 !important;
  }
  
  .custom-menu-container .mobile-menu-toggle {
    font-size: 0 !important; /* hamburger uses bars, not text */
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
    font-weight: 400 !important;
    color: transparent !important;
    background: #fff !important;
  }
  
  /* COMPLETE ISOLATION: "Link Modal" label text - NO traits should affect this */
  .custom-menu-container .link-modal-toggle span {
    font-size: 13px !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
    font-weight: 400 !important;
    color: #333 !important;
    text-decoration: none !important;
    text-transform: none !important;
    letter-spacing: normal !important;
    word-spacing: normal !important;
    line-height: 1.4 !important;
  }
  
  /* COMPLETE ISOLATION: link-modal-toggle wrapper */
  .custom-menu-container .link-modal-toggle {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
    font-weight: 400 !important;
    color: #333 !important;
  }
  
  .item-action-btn { margin-left:4px; }
  /* Mobile-only sub-toggle button hidden by default; shown only in mobile media query */
  .custom-menu-container .mobile-sub-toggle { display: none !important; }
  /* Hide action buttons in preview (non-edit) */
  .custom-menu-container:not(.editing) .item-action-btn { display:none !important; }
  /* Allow horizontal overflow for flyouts while keeping vertical scroll */
  .custom-menu-container { overflow-x:visible !important; overflow-y:auto !important; }
  /* Arrow indicator on parents with submenu (only when not editing AND not in-editor canvas) */
  /* Do not show extra parent arrows in the editor preview */
  .custom-menu-container:not(.editing):not(.in-editor) li[data-has-submenu] { position:relative; }
  
  /* Menu list inherits font-size from container (allows trait to work), default 16px */
  .custom-menu-container .menu-list {
    font-size: inherit; /* inherit from container when trait is applied */
  }
  
  /* Base link styling (top-level & submenu) - overridable via CSS variable so items can keep their own colors */
  .custom-menu-container a { color: var(--menu-link-color, #000); text-decoration:none !important; display:inline-block; padding:2px 0; }
  .custom-menu-container a:hover, .custom-menu-container a:focus { text-decoration:none !important; }
  /* Prevent browser default visited link color (black/purple) from overriding our styles */
  .custom-menu-container a:visited { text-decoration:none !important; color: inherit !important; }
  /* Enhanced padding for parent (top-level) items - increased for better click targets and visual parity */
  .custom-menu-container .menu-list > li > a.nav-link {
    padding: 10px 12px !important;
    display: block !important;
    font-size: inherit; /* inherit from .menu-list */
    border: none !important;
  }
  /* Ensure nav-link always gets correct padding, even if DOM changes */
  .custom-menu-container a.nav-link {
    padding: 10px 12px !important;
    display: block !important;
    font-size: inherit; /* inherit from .menu-list */
  }
  /* High-specificity overrides scoped to editor menu to defeat portal/site styles that
     force bold on top-level nav anchors (e.g. .topNavContainer .navbar-nav > li > a)
     Keep these selectors scoped under .custom-menu-container so production site CSS
     doesn't leak into the editor preview. 
     Font-weight removed to allow inheritance from container */
  .custom-menu-container .topNavContainer .navbar-nav > li > a,
  .custom-menu-container .navbar-nav > li > a,
  .custom-menu-container li.menuItem1 > a,
  .custom-menu-container li.menuItem2 > a,
  .custom-menu-container li.menuItem3 > a,
  .custom-menu-container li.menuItem4 > a,
  .custom-menu-container .ms-core-listMenu-horizontalBox a.ms-core-listMenu-item,
  .custom-menu-container .ms-core-listMenu-horizontalBox a.ms-core-listMenu-item:link,
  .custom-menu-container .ms-core-listMenu-horizontalBox a.ms-core-listMenu-item:visited {
    /* font-weight removed - will inherit from container or parent a tag */
  }
  /* Use correct default font matching the site. Fallback to system sans-serif. 
     Don't use !important so font-family and font-weight traits can override 
     Set on container and let items inherit */
  .custom-menu-container {
    font-family: "Stone Sans", Arial, sans-serif;
    font-weight: 400; /* default weight, can be overridden by trait */
    -webkit-font-smoothing: antialiased !important;
    -moz-osx-font-smoothing: grayscale !important;
  }
  
  .custom-menu-container a,
  .custom-menu-container .menu-list > li > a.nav-link {
    font-family: inherit; /* inherit from container so trait works */
    font-weight: inherit; /* inherit from container so trait works */
  }

  /* Top-level sizing and colors tuned to portal */
  .custom-menu-container .menu-list > li > a.nav-link {
    font-size: inherit; /* inherit from .menu-list */
    line-height: 1.2 !important;
    padding: 6px 12px !important;
  }

  /* Desktop: grey hover background on top-level items */
  .custom-menu-container .menu-list > li > a.nav-link:hover,
  .custom-menu-container .menu-list > li > a.nav-link:focus {
    background: #eeeeee !important;
    color: inherit !important;
  }

  /* Per-item color banding (mirror portal's menuItemN colors) - only for non-selected/non-visited items
     Don't use !important so color trait can override */
  .custom-menu-container li.menuItem1 > a:not(.selected):not(.visited) { color: #141F68; }
  .custom-menu-container li.menuItem2 > a:not(.selected):not(.visited) { color: #007888; }
  .custom-menu-container li.menuItem3 > a:not(.selected):not(.visited) { color: #B56F2C; }
  .custom-menu-container li.menuItem4 > a:not(.selected):not(.visited) { color: #902A92; }
  
  /* Ensure visited pseudo-class on menuItem links doesn't override selected/visited class - keep blue */
  .custom-menu-container li.menuItem1 > a.selected:visited,
  .custom-menu-container li.menuItem2 > a.selected:visited,
  .custom-menu-container li.menuItem3 > a.selected:visited,
  .custom-menu-container li.menuItem4 > a.selected:visited,
  .custom-menu-container li.menuItem1 > a.visited:visited,
  .custom-menu-container li.menuItem2 > a.visited:visited,
  .custom-menu-container li.menuItem3 > a.visited:visited,
  .custom-menu-container li.menuItem4 > a.visited:visited {
    color: #0071bc !important; /* keep brand blue even with :visited pseudo-class */
  }

  /* Match production spacing: default left margin 15px; active margin-left 0; left blue bar 5px */
  .custom-menu-container .sm-clean li a,
  .custom-menu-container .menu-list li > a {
    margin-left: 15px !important;
    padding-left: 12px !important;
    box-sizing: border-box !important; /* ensure consistent box model */
  }

  /* Selected / visited: use brand blue + bold and show blue left bar (production values) */
  .custom-menu-container .menu-list > li > a.selected,
  .custom-menu-container .menu-list > li > a.visited,
  .custom-menu-container .sm-clean li.active a {
    color: #0071bc !important; /* brand blue */
    font-weight: 600 !important;
    background-color: transparent !important;
    box-shadow: none !important;
    border-left: 5px solid #0071bc !important; /* blue left bar at the edge */
    margin-left: 0 !important; /* start from edge for the border */
    padding-left: 15px !important; /* 5px border + 15px space = 20px from edge, shifted closer to blue bar than unselected (27px) */
    font-size: 18px; /* selected becomes bigger */
  line-height: 1.2 !important;
  }

  /* Caret/angle-down styling: use FontAwesome style mimic so editor preview shows the same indicator */
  .custom-menu-container .menu-list > li > a .fa-angle-down,
  .custom-menu-container .menu-list > li > a .fa.fa-angle-down,
  .custom-menu-container .menu-list > li > a .caret,
  .custom-menu-container .menu-list > li > a > span.fa {
    margin-left: 6px !important;
  font-size: 14px !important;
    vertical-align: middle !important;
    color: inherit !important;
  }

  /* Submenu / flyout styling — tuned to match production (scoped to .custom-menu-container) */
  /* Use SmartMenus (sm-clean) and portal like defaults: white card, 1px border, subtle dropshadow, rounded corners */
  .custom-menu-container .sm-clean ul,
  .custom-menu-container ul.submenu,
  .custom-menu-container .dropdown-menu,
  .custom-menu-container .mega-dropdown-menu {
    background: #fff !important;
    border: 1px solid #bbbbbb !important; /* portal uses #bbbbbb-ish borders for dropdowns */
    border-radius: 5px !important;
    box-shadow: 0 5px 9px rgba(0,0,0,0.20) !important;
    padding: 0 !important; /* no padding to allow blue bars to align with parent */
    min-width: 220px !important;
    z-index: 9999 !important;
  }

  /* Submenu anchor sizing/padding and font sizing match production (sm-clean uses 16px) 
     Don't use !important on color so color trait can override */
  .custom-menu-container .sm-clean ul a,
  .custom-menu-container ul.submenu > li > a,
  .custom-menu-container .mega-dropdown-menu > li > ul > li > a {
    padding: 10px 10px 10px 22px !important; /* 22px left padding to align with top-level selected text (after blue bar) */
    font-size: inherit; /* inherit from .menu-list */
    color: #555555;
    display: block !important;
    text-decoration: none !important;
  }

  /* Hover: only change background, do NOT change text color */
  .custom-menu-container .sm-clean ul a:hover,
  .custom-menu-container ul.submenu > li > a:hover,
  .custom-menu-container .sm-clean ul a:focus {
    background: #eeeeee !important;
    /* Intentionally do not change text color on hover */
    color: inherit !important;
  }

  /* Selected/visited items: keep blue color on hover and on :visited pseudo-class, do NOT turn black */
  .custom-menu-container .menu-list > li > a.selected:hover,
  .custom-menu-container .menu-list > li > a.visited:hover,
  .custom-menu-container .menu-list > li > a.selected:visited,
  .custom-menu-container .menu-list > li > a.visited:visited,
  .custom-menu-container ul.submenu > li > a.selected:hover,
  .custom-menu-container ul.submenu > li > a.visited:hover,
  .custom-menu-container ul.submenu > li > a.selected:visited,
  .custom-menu-container ul.submenu > li > a.visited:visited {
    color: #0071bc !important;
    background: transparent !important; /* no hover background on desktop top-level */
  }
  
  /* For submenu items, allow grey hover background */
  .custom-menu-container ul.submenu > li > a.selected:hover,
  .custom-menu-container ul.submenu > li > a.visited:hover {
    background: #eeeeee !important;
  }

  /* Desktop: make the arrow area (sub-arrow) also use the grey hover so the hover is continuous */
  .custom-menu-container ul.submenu > li > a:hover > .sub-arrow,
  .custom-menu-container .sm-clean ul a:hover > .sub-arrow,
  .custom-menu-container ul.submenu > li > a:hover > span.sub-arrow {
    background: #eeeeee !important;
    color: inherit !important;
    pointer-events: none !important;
  }

  /* Ensure the right-side arrow area (sub-arrow) also receives the hover background on mobile;
    actual mobile styles are added inside the @media block below to avoid desktop impact. */
  /* Current (semantic/current page) should display as brand blue and bold */
  /* Desktop: submenu selected items do NOT have blue bar, only color + bold */
  .custom-menu-container .sm-clean ul a.current,
  .custom-menu-container .sm-clean ul a.current,
  .custom-menu-container .sm-clean ul a.visited,
  .custom-menu-container ul.submenu > li > a.current,
  .custom-menu-container ul.submenu > li > a.visited {
    color: #0071bc !important;
    font-weight: 600 !important;
    font-size: 18px; /* selected/current/visited subitems also bigger */
    /* NO blue bar in desktop - removed border-left and adjusted padding */
    border-left: none !important;
    padding: 10px 10px 10px 22px !important; /* Same as unselected subitems */
  }

  /* Sub-arrow / toggle area (right-side rounded area used by sm-clean) */
  .custom-menu-container a span.sub-arrow,
  .custom-menu-container a > .sub-arrow {
    position: absolute !important;
    right: 6px !important;
    top: 50% !important;
    transform: translateY(-50%) !important;
    width: 34px !important;
    height: 34px !important;
    line-height: 34px !important;
    text-align: center !important;
    background: rgba(255,255,255,0.5) !important;
    border-radius: 5px !important;
    font-size: 14px !important;
    color: #555 !important;
    pointer-events: none !important; /* decorative in editor */
  }

  /* Remove triangular pointer above submenu for the editor preview (no top arrow) */
  .custom-menu-container > .menu-list li > ul:before,
  .custom-menu-container > .menu-list li > ul:after,
  .custom-menu-container .sm-clean > li > ul:before,
  .custom-menu-container .sm-clean > li > ul:after {
    /* ensure no pointer/triangle shown */
  }
  .custom-menu-container > .menu-list li > ul:before,
  .custom-menu-container > .menu-list li > ul:after,
  .custom-menu-container .sm-clean > li > ul:before,
  .custom-menu-container .sm-clean > li > ul:after {
    display: none !important;
    content: none !important;
    pointer-events: none !important;
  }

  /* Nested indentation behavior (increase left padding per depth) */
  .custom-menu-container ul.submenu ul a { padding-left: 26px !important; }
  .custom-menu-container ul.submenu ul ul a { padding-left: 34px !important; }

  /* Keep top-level li layout stable and avoid shifting when borders are applied */
  .custom-menu-container .menu-list > li > a { box-sizing: border-box !important; position: relative; }

  /* Flyout card for submenu in preview (non-edit) mode: absolute/fixed placement handled by JS; hidden until hover */
  .custom-menu-container:not(.editing):not(.in-editor) li[data-has-submenu] > ul.submenu {
    position: absolute; /* JS will convert to fixed for viewport-safe placement */
    left: 0; /* align with parent item left edge so blue bars line up */
    top: 100%; /* position below the parent item */
    background: #fff;
    border: 1px solid #cccccc;
    box-shadow: 0 2px 6px rgba(0,0,0,0.15);
    padding: 8px 0; /* vertical padding only, let items handle horizontal */
    min-width: 180px;
    z-index: 50;
    display: none !important; /* shown on hover/enter by JS or :hover */
    margin: 0 !important;
    margin-top: 2px !important; /* small gap between parent and submenu */
  }
  .custom-menu-container:not(.editing):not(.in-editor) li[data-has-submenu]:hover > ul.submenu {
    display: block !important;
  }

  /* Show a right-pointing arrow for items that have a submenu (visual indicator) */
  .custom-menu-container:not(.editing):not(.in-editor) li[data-has-submenu] {
    position: relative;
  }
  .custom-menu-container:not(.editing):not(.in-editor) li[data-has-submenu]::after {
    content: '\u25B6'; /* black right-pointing triangle */
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 12px;
    color: inherit;
    opacity: 0.9;
    pointer-events: none;
  }
  /* Ensure the hover background covers the arrow area for items that have submenus.
     Apply hover to the LI itself so the right-side arrow (pseudo element or absolute child)
     sits on the same background as the anchor text. This preserves selected/visited
     anchor styling because those selectors target the anchor with higher specificity. */
  /* On desktop keep previous behavior (hover only on anchor). When the mobile
    menu is open (.mobile-open) expand the hover background to cover the
    entire LI including the arrow area so the tap target looks contiguous. */
  /* Mobile-only expanded LI hover rules are added inside the @media block to avoid changing desktop */

  /* Mobile responsiveness: hamburger, plus/minus toggles, dotted focus and separators */
  @media (max-width: 768px) {
    .custom-menu-container { width: 100% !important; box-shadow: none !important; border: none !important; }
    .custom-menu-container .edit-menu-btn { display: none !important; }
    /* Mobile hamburger: three inline bars (thin icon-style). Default: transparent/white background. On open/click: filled with #f2f2f2 and a subtle border. */
    .custom-menu-container .mobile-menu-toggle {
      display: inline-block !important;
      margin-bottom: 10px;
      margin-left: 5px;
  background: #fff; /* default white background like the image */
  border: 1px solid #e6e6e6; /* subtle light border around the button */
  padding: 6px 10px;
  border-radius: 4px;
      cursor: pointer;
      font-size: 0; /* reset text rendering */
      color: transparent;
  min-width: 48px; 
      text-align: center;
      line-height: 1;
      position: relative;
    }
    .custom-menu-container .mobile-menu-toggle .bar {
      display: block;
      height: 2px; /* default for top/bottom */
      background: #888888; /* line color as requested */
  width: 20px;
      margin: 4px auto; /* more spacing between bars */
      border-radius: 1px;
    }
    /* tiny bit thicker middle bar */
  .custom-menu-container .mobile-menu-toggle .bar.middle { height: 3px; }
    /* On open/click: apply fill background and border color #f2f2f2 */
    .custom-menu-container.mobile-open .mobile-menu-toggle,
    .custom-menu-container .mobile-menu-toggle:active {
      background: #f2f2f2 !important;
      border: 1px solid #f2f2f2 !important;
      color: transparent !important;
    }
    /* Hover and focus should use the same fill as the active/open state */
    .custom-menu-container .mobile-menu-toggle:hover,
    .custom-menu-container .mobile-menu-toggle:focus {
      background: #f2f2f2 !important;
      border: 1px solid #f2f2f2 !important;
      color: transparent !important;
    }
    /* Ensure desktop hover/flyout does NOT show on touch/mobile: force submenu hidden on hover */
    .custom-menu-container:not(.editing):not(.in-editor) li[data-has-submenu]:hover > ul.submenu { display: none !important; }
    /* Hide desktop pseudo-arrow on mobile so only plus/minus shows */
    .custom-menu-container li[data-has-submenu]::after { content: none !important; }
    /* Hide flyout behavior on mobile; show stacked list */
    .custom-menu-container .menu-list { display: none !important; }
    .custom-menu-container.mobile-open .menu-list { display: block !important; margin-left: 5px !important; }
    /* When closed on mobile, collapse the outer container so only the hamburger remains visible. 
       This overrides any inline preview styles (height/padding) and ensures the component does not
       reserve extra vertical space when collapsed. */
    .custom-menu-container:not(.mobile-open) {
      padding: 0 !important;
      height: auto !important;
      min-height: 0 !important;
      overflow: visible !important;
      border: none !important;
    }
    .custom-menu-container:not(.mobile-open) .menu-list {
      display: none !important;
      height: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    /* Keep the mobile toggle visible and reduce bottom spacing so collapsed height is minimal */
    .custom-menu-container .mobile-menu-toggle {
      display: inline-block !important;
      margin-bottom: 4px !important;
    }
    /* Remove ALL hover effects on mobile for items and subitems */
    .custom-menu-container .menu-list > li > a.nav-link:hover,
    .custom-menu-container .menu-list > li > a.nav-link:focus,
    .custom-menu-container .menu-list li > ul.submenu > li > a:hover,
    .custom-menu-container .menu-list li > ul.submenu > li > a:focus {
      background: transparent !important;
    }
    /* Make each item full width with subtle divider; parent LI must be position:relative for toggle button positioning */
  .custom-menu-container .menu-list > li { position: relative; border-bottom: 1px solid #f3f3f3; padding: 0; margin: 0; box-sizing: border-box; width: 100%; }
  /* Remove bottom border on expanded items so blue bars touch */
  .custom-menu-container .menu-list > li.expanded { border-bottom: none !important; }
  /* When expanded on mobile, contain the submenu without overflow hidden which causes layout shift */
    .custom-menu-container .menu-list > li > a.nav-link { 
      padding: 10px 44px 10px 40px !important; /* fixed left padding for all items */
      margin-left: 19px !important; /* consistent margin for all */
      display: block !important; 
      font-size: inherit; /* inherit from container when trait is applied */
    }
  /* Use plus/minus button inline with the parent item text (visible on mobile) - smaller size */
  .custom-menu-container .mobile-sub-toggle { 
    display: inline-block !important; 
    position: absolute; 
    right: 8px; 
    top: 8px; 
    background: transparent; 
    border: none; 
    color: #000; 
    font-size: 18px; 
    font-weight: normal; 
    cursor: pointer; 
    z-index: 3; 
    line-height: 1; 
    padding: 0; 
    width: 24px; 
    text-align: center; 
  }
  /* Blue bar ONLY appears on selected/visited anchors (single left border) */
  .custom-menu-container .menu-list > li > a.selected,
  .custom-menu-container .menu-list > li > a.visited {
    border-left: 5px solid #0071bc !important;
    padding: 10px 44px 10px 28px !important; /* 5px border + 28px = 33px total left, shifted closer to blue bar than unselected (40px + 19px margin = 59px) */
    box-sizing: border-box !important;
  }
  /* Mobile: default font sizing */
  .custom-menu-container .menu-list > li > a.nav-link { font-size: inherit; }
  .custom-menu-container .menu-list > li > a.nav-link.selected,
  .custom-menu-container .menu-list > li.selected > a.nav-link,
  .custom-menu-container .menu-list > li > a.nav-link.visited {
    color: #0071bc !important;
    font-size: 18px; /* selected size */
    font-weight: 600 !important;
  }

  /* Slightly extend the left blue bar vertically so parent and first subitem bars visually connect as one stripe */
  .custom-menu-container .menu-list > li > a.nav-link.selected,
  .custom-menu-container .menu-list > li > a.nav-link.visited,
  .custom-menu-container .menu-list li.expanded > ul.submenu > li > a.selected,
  .custom-menu-container .menu-list li.expanded > ul.submenu > li > a.visited {
    position: relative !important;
    z-index: 2 !important;
  }
  /* Extend selected parent anchor padding-bottom when expanded so blue bar reaches submenu */
  .custom-menu-container .menu-list > li.expanded > a.nav-link.selected,
  .custom-menu-container .menu-list > li.expanded > a.nav-link.visited {
    /* Keep original padding - don't reduce it */
    padding-bottom: 12px !important; /* extend blue bar to touch submenu */
    margin-bottom: -2px !important; /* pull submenu up by 1px to close gap */
  }
  /* Dotted rectangle around ONLY the parent anchor when expanded (smaller, closer dots, blue color) */
  .custom-menu-container .menu-list li.expanded > a.nav-link { 
    outline: 1px dotted #000 !important; 
    outline-offset: -2px;
    border-radius: 4px 4px 0 0 !important; /* top-left and top-right rounded corners */
  }
  /* When selected or visited, plus/minus and outline change to blue */
  .custom-menu-container .menu-list > li.selected .mobile-sub-toggle,
  .custom-menu-container .menu-list > li > a.nav-link.selected + .mobile-sub-toggle,
  .custom-menu-container .menu-list > li > a.nav-link.visited + .mobile-sub-toggle {
    color: #0071bc !important;
  }
  .custom-menu-container .menu-list > li.selected > a.nav-link,
  .custom-menu-container .menu-list > li > a.nav-link.selected,
  .custom-menu-container .menu-list > li > a.nav-link.visited,
  .custom-menu-container .menu-list > li.selected > a.nav-link.expanded,
  .custom-menu-container .menu-list > li.expanded > a.nav-link.selected {
    outline: 1px dotted #0071bc !important;
  }
  /* Subitems: stacked with light grey background (static, not hover), no shadow, full width, left-aligned with parent text */
  .custom-menu-container .menu-list li.expanded > ul.submenu { 
    display: block !important; 
    position: static !important; 
    margin: 0 !important; 
    padding: 0 !important; 
    border: none !important;
    border-radius: 0 !important;
    border-top: none !important; /* remove white gap between parent and submenu */
    background: #f5f5f5 !important; 
    box-sizing: border-box !important;
    width: 100% !important; 
    list-style: none !important;
    box-shadow: none !important;
    will-change: max-height, opacity;
  }
  /* Submenu collapsed by default (animated) */
  .custom-menu-container .menu-list > li > ul.submenu {
    max-height: 0 !important;
    overflow: hidden !important;
    transition: max-height 350ms cubic-bezier(0.4, 0, 0.2, 1), opacity 300ms ease-in-out;
    opacity: 0; 
    display: none !important;
  }
  .custom-menu-container .menu-list > li.expanded > ul.submenu {
    display: block !important;
    opacity: 1 !important;
    max-height: 100vh !important;
    /* when expanded the inline JS will set max-height to scrollHeight */
  }
  /* Shift submenu container to the right on preview (mobile) without moving the parent anchor.
     This indents the grey background and reduces its effective width so it starts closer to the '+' toggle. */
  .custom-menu-container:not(.editing):not(.in-editor) .menu-list > li > ul.submenu {
    margin-left: 19px !important; /* shift grey bg to align with blue bar edge */
    width: calc(100% - 19px) !important; /* adjust width accordingly */
    box-sizing: border-box !important;
  }
  /* When collapsing, override the expanded rule */
  .custom-menu-container .menu-list > li.expanded > ul.submenu.collapsing {
    max-height: 0 !important;
    opacity: 0 !important;
  }

  /* Ensure the shifted submenu respects collapsing animation as well */
  .custom-menu-container:not(.editing):not(.in-editor) .menu-list > li.expanded > ul.submenu.collapsing {
    margin-left: 14px !important;
    width: calc(100% - 14px) !important;
  }
  /* Remove the visual separator between a selected parent and its first subitem so left blue bars align seamlessly */
  .custom-menu-container .menu-list > li.selected > ul.submenu { border-top: none !important; }
  .custom-menu-container .menu-list > li > ul.submenu > li:first-child { border-top: none !important; }
  /* Menu open 'sling' animation when hamburger is clicked */
  @keyframes menuSlingDown {
    from { transform: translateY(-10px); opacity: 0; }
    60% { transform: translateY(4px); }
    to { transform: translateY(0); opacity: 1; }
  }
  .custom-menu-container.mobile-open .menu-list {
    animation: menuSlingDown 320ms cubic-bezier(.2,.8,.2,1);
  }
  /* Remove extra left padding on submenu so subitem left-border aligns with top-level left bar */
  .custom-menu-container .menu-list li.expanded > ul.submenu { padding: 0 !important; }
  /* Each subitem link: simple padding, grey background (static, not hover), left-aligned with parent */
  .custom-menu-container .menu-list li.expanded > ul.submenu > li { 
    list-style: none !important; 
    margin: 0 !important; 
    padding: 0 !important; 
    border: none !important;
    background: #f5f5f5 !important;
    box-sizing: border-box !important;
    display: block !important;
  }
  .custom-menu-container .menu-list li.expanded > ul.submenu > li > a { 
    display: block !important; 
    padding: 12px 44px 12px 44px !important; /* further indent subitems so they sit after parent text */
    margin-left: 0px !important; /* no additional margin since container already has 19px */
    background: #f5f5f5 !important; 
    border: none !important;
    color: #333; /* don't use !important so color trait can override */
  font-size: inherit; /* inherit from .menu-list */
    box-sizing: border-box !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    white-space: nowrap !important;
  }
  /* Selected/visited subitem: blue color, slightly larger, and left blue bar aligned with top-level bar */
  .custom-menu-container .menu-list li.expanded > ul.submenu > li > a.selected,
  .custom-menu-container .menu-list li.expanded > ul.submenu > li > a.visited,
  .custom-menu-container .menu-list li.expanded > ul.submenu > li.selected > a {
    color: #0071bc !important;
    font-size: 18px; /* selected subitem slightly larger */
    font-weight: 600 !important;
    border-left: 5px solid #0071bc !important;
    padding-left: 30px !important; /* 5px border + 32px = 37px total, shifted closer to blue bar than unselected (44px) */
    box-sizing: border-box !important;
  }
  /* Separator line between subitems */
  .custom-menu-container .menu-list li.expanded > ul.submenu > li + li { 
  border-top: 1px solid #f3f3f3 !important; 
  }

      </style>
  <div class="custom-menu-container" style="width:250px; padding:10px; height:400px; overflow-y:scroll;">
        <button class="edit-menu-btn" style="width:100%; margin-bottom:10px; background:#0078d4; color:white; border:none; padding:6px; cursor:pointer;">Edit Menu</button>
        <div class="link-modal-toggle" style="display:none; align-items:center; padding:0; margin:0; margin-bottom:10px;">
          <button class="toggle-link-modal-btn" data-state="on" style="background:#0078d4; color:white; border:none; width:44px; min-width:44px; padding:4px 0; cursor:pointer; font-size:12px; border-radius:3px; margin-right:8px; text-align:center;">ON</button>
          <span style="font-size:13px;">Link Modal</span>
        </div>
        <!-- Mobile hamburger toggle (visible only on small screens) -->
        <button class="mobile-menu-toggle" aria-label="Toggle menu" style="display:none;">
          <span class="bar top"></span>
          <span class="bar middle"></span>
          <span class="bar bottom"></span>
        </button>
  <ul class="menu-list" style="list-style:none; padding-left:0; margin:0;">
          <li><a href="#" target="_blank" rel="noopener noreferrer" class="nav-link">Lorem ipsum dolor amet consectetur</a></li>
          <li><a href="#" target="_blank" rel="noopener noreferrer" class="nav-link">Praesent commodo cursus magna vel scelerisque</a></li>
          <li><a href="#" target="_blank" rel="noopener noreferrer" class="nav-link">Integer posuere erat a ante venenatis dapibus</a></li>
          <li><a href="#" target="_blank" rel="noopener noreferrer" class="nav-link">Aenean eu leo quam pellentesque ornare</a></li>
          <li><a href="#" target="_blank" rel="noopener noreferrer" class="nav-link">Cras mattis consectetur purus sit amet</a></li>
          <li><a href="#" target="_blank" rel="noopener noreferrer" class="nav-link">Donec ullamcorper nulla non metus auctor</a></li>
          <li><a href="#" target="_blank" rel="noopener noreferrer" class="nav-link">Etiam porta sem malesuada magna</a></li>
        </ul>
      </div>
    `,
      media: `<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" fill="#000">
  <rect x="3" y="5" width="18" height="2"/>
  <rect x="3" y="11" width="18" height="2"/>
  <rect x="3" y="17" width="18" height="2"/>
</svg>`,
    });
  } else {
    console.log(
      "[NavPlugin] Block 'custom-menu' already registered (skipping)"
    );
  }

  domc.addType("custom-menu", {
    model: {
      defaults: {
        draggable: true,
        droppable: true,
        resizable: false,
        editable: false,
        stylable: true,
        // Add default toolbar buttons for the container
        toolbar: [
          {
            attributes: { class: "fa fa-arrows", title: "Move" },
            command: "tlb-move",
          },
          {
            attributes: { class: "fa fa-trash", title: "Delete" },
            command: "tlb-delete",
          },
        ],
        script: function (this: HTMLElement) {
          // Safety check: ensure 'this' is a valid HTMLElement with required methods
          if (
            !this ||
            typeof this.querySelector !== "function" ||
            typeof this.querySelectorAll !== "function"
          ) {
            console.warn(
              "[NavPlugin] Invalid context in script function - skipping"
            );
            return;
          }

          const root = this as HTMLElement;
          const editBtn =
            root.querySelector<HTMLButtonElement>(".edit-menu-btn");
          const toggleWrapper =
            root.querySelector<HTMLElement>(".link-modal-toggle");
          const inEditor = root.closest("[data-gjs-type]") ? true : false;

          // Initialize the toggle state attribute (default to enabled)
          if (inEditor && !root.hasAttribute("data-allow-link-edit")) {
            root.setAttribute("data-allow-link-edit", "true");
          }

          // Ensure the toggle button appearance matches the stored state on first render
          try {
            const btn = root.querySelector<HTMLButtonElement>(
              ".toggle-link-modal-btn"
            );
            const enabled =
              root.getAttribute("data-allow-link-edit") !== "false";
            if (btn) {
              btn.setAttribute("data-state", enabled ? "on" : "off");
              btn.textContent = enabled ? "ON" : "OFF";
              btn.style.background = enabled ? "#0078d4" : "#005a9c";
              btn.style.color = "#ffffff";
            }
          } catch (e) {
            /* no-op */
          }

          if (!inEditor) {
            // Runtime (outside GrapesJS editor)
            if (editBtn) editBtn.style.display = "none";
            if (toggleWrapper) toggleWrapper.style.display = "none";
          } else {
            // In editor: toggle starts hidden, will show when entering edit mode
            if (toggleWrapper) toggleWrapper.style.display = "none";
          }

          if (!inEditor) {
            // Always hide any submenu lists when not in editor
            root.querySelectorAll<HTMLElement>("ul.submenu").forEach((ul) => {
              ul.style.display = "none";
            });
            // Hide any action buttons that might have been persisted
            root
              .querySelectorAll<HTMLElement>(
                ".add-submenu-btn, .add-item-btn, .remove-item-btn, .add-subitem-btn, .remove-subitem-btn"
              )
              .forEach((b) => (b.style.display = "none"));
            // Mark parents that have submenu for arrow indicator
            root.querySelectorAll("li > ul.submenu").forEach((ul) => {
              const parent = ul.parentElement as HTMLElement | null;
              if (parent) parent.setAttribute("data-has-submenu", "1");
            });

            // Flyout positioning: make submenu fixed for desktop so it can overflow container
            // but disable hover/flyout behavior on small screens (mobile) in favor of click-to-expand.
            const parents = root.querySelectorAll<HTMLElement>(
              "li[data-has-submenu]"
            );
            const vw =
              window.innerWidth || document.documentElement.clientWidth;
            if (vw > 768) {
              // Desktop only: attach hover flyout behavior
              parents.forEach((parent) => {
                parent.addEventListener("mouseenter", () => {
                  const sub = parent.querySelector<HTMLElement>("ul.submenu");
                  if (!sub) return;
                  // Don't interfere if this parent is in a click-expanded state (has expanded class from mobile toggle)
                  try {
                    if (
                      parent.classList &&
                      parent.classList.contains("expanded")
                    )
                      return;
                  } catch (e) {
                    /* proceed with hover */
                  }
                  // Show temporarily to measure
                  sub.style.display = "block";
                  // Switch to fixed positioning relative to viewport
                  const rect = parent.getBoundingClientRect();
                  const scrollY =
                    window.scrollY || document.documentElement.scrollTop;
                  const scrollX =
                    window.scrollX || document.documentElement.scrollLeft;
                  sub.style.position = "fixed";
                  sub.style.top = rect.top + scrollY + "px";
                  let left = rect.right + scrollX; // default to right side
                  const subWidth = sub.offsetWidth || 220;
                  const vw2 =
                    window.innerWidth || document.documentElement.clientWidth;
                  if (left + subWidth > vw2 - 8) {
                    // overflow right, flip to left
                    left = rect.left + scrollX - subWidth;
                    if (left < 4) left = 4; // clamp
                  }
                  sub.style.left = left + "px";
                });
                parent.addEventListener("mouseleave", () => {
                  const sub = parent.querySelector<HTMLElement>("ul.submenu");
                  if (!sub) return;
                  try {
                    // If expanded via click, don't hide on mouseleave; '-' should collapse it.
                    if (
                      parent.classList &&
                      parent.classList.contains("expanded")
                    )
                      return;
                  } catch (e) {
                    /* fall through to hide */
                  }
                  sub.style.display = "none";
                });
              });
            } else {
              // Mobile: ensure submenus are static and hidden until expanded via plus/minus
              // DO NOT attach any mouseenter/mouseleave listeners on mobile (click-only interaction)
              parents.forEach((parent) => {
                const sub = parent.querySelector<HTMLElement>("ul.submenu");
                if (!sub) return;
                // Only hide if not already expanded by a previous click
                if (!parent.classList.contains("expanded")) {
                  sub.style.display = "none";
                }
                sub.style.position = "static";
                // ensure anchor remains visible and parent does not overlay submenu
                sub.style.left = "auto";
                sub.style.top = "auto";
              });
            }

            // Convert any top-level LI plain text into links if missing
            root
              .querySelectorAll<HTMLElement>(".menu-list > li")
              .forEach((li) => {
                if (!li.querySelector("a")) {
                  const text = (li.textContent || "").trim();
                  // If the LI is empty, don't auto-generate a placeholder anchor
                  if (!text) return;
                  li.innerHTML = "";
                  const a = document.createElement("a");
                  a.href = "#";
                  a.className = "nav-link";
                  a.target = "_blank";
                  a.rel = "noopener noreferrer";
                  a.textContent = text;
                  li.appendChild(a);
                }
              });

            // Selection handling (outside editor)
            if (!(root as any)._selectionBound) {
              root.addEventListener("click", (ev) => {
                const a = (ev.target as HTMLElement).closest("a");
                if (!a || !root.contains(a)) return;
                // Clear existing selected & visited markers
                root.querySelectorAll("a.selected, a.visited").forEach((el) => {
                  el.classList.remove("selected");
                  el.classList.remove("visited");
                });
                const li = a.closest("li");
                if (
                  li &&
                  li.parentElement &&
                  li.parentElement.classList.contains("submenu")
                ) {
                  // Sub item: mark itself and parent top-level
                  a.classList.add("selected", "visited");
                  const topLi = li.closest("ul.menu-list > li");
                  if (topLi) {
                    const topA = topLi.querySelector(":scope > a");
                    if (topA) topA.classList.add("selected", "visited");
                  }
                } else {
                  a.classList.add("selected", "visited");
                }
                // No preventDefault -> allow navigation
              });
              (root as any)._selectionBound = true;
            }
          }

          // Mobile behavior: hamburger toggle and per-item expand/collapse
          try {
            const mobileToggle = root.querySelector<HTMLButtonElement>(
              ".mobile-menu-toggle"
            );
            const containerEl = root as HTMLElement;
            const menuList = root.querySelector<HTMLElement>(".menu-list");

            // Function to check if we're in mobile mode (matches CSS media query)
            const isMobileMode = () => {
              if (inEditor) {
                // In editor, check the iframe width (GrapesJS canvas)
                const canvasFrame = root.ownerDocument?.defaultView;
                if (canvasFrame && canvasFrame.innerWidth) {
                  return canvasFrame.innerWidth <= 768;
                }
              }
              return window.innerWidth <= 768;
            };

            // Function to reset mobile state when switching viewport modes
            const resetMobileState = () => {
              const nowMobile = isMobileMode();

              if (!nowMobile) {
                // Switching to desktop: close mobile menu, collapse all submenus, clear inline styles
                containerEl.classList.remove("mobile-open");
                root
                  .querySelectorAll<HTMLElement>("li.expanded")
                  .forEach((li) => {
                    li.classList.remove("expanded");
                    const toggle =
                      li.querySelector<HTMLButtonElement>(".mobile-sub-toggle");
                    if (toggle) {
                      toggle.innerText = "+";
                      toggle.setAttribute("aria-expanded", "false");
                    }
                  });
                root
                  .querySelectorAll<HTMLElement>("ul.submenu")
                  .forEach((ul) => {
                    ul.classList.remove("collapsing");
                    ul.style.maxHeight = "";
                    ul.style.opacity = "";
                    ul.style.display = "";
                    ul.style.position = "";
                    ul.style.left = "";
                    ul.style.top = "";
                    ul.style.zIndex = "";
                    ul.style.overflow = "";
                  });
              }
            };

            if (mobileToggle && menuList) {
              mobileToggle.addEventListener("click", () => {
                // Toggle the mobile-open class only. CSS handles the menu visibility and collapsed sizing.
                containerEl.classList.toggle("mobile-open");

                // Force GrapesJS to recalculate toolbar position after layout change
                // The timeout ensures CSS transitions complete before repositioning
                if (inEditor) {
                  setTimeout(() => {
                    // Trigger a reflow by modifying a non-visual style property
                    const prev = containerEl.style.transform || "";
                    containerEl.style.transform = "translateZ(0)";
                    // Force reflow
                    void containerEl.offsetHeight;
                    // Restore original transform
                    containerEl.style.transform = prev;

                    // Dispatch a custom event that GrapesJS may listen to for repositioning
                    try {
                      containerEl.dispatchEvent(
                        new Event("gjsResize", { bubbles: true })
                      );
                      // Also try standard resize on window (some GrapesJS versions listen to this)
                      window.dispatchEvent(new Event("resize"));
                    } catch (e) {
                      /* no-op */
                    }
                  }, 50);
                }
              });
            }

            // Listen for viewport changes and reset state when switching between mobile/desktop
            if (inEditor && !root.hasAttribute("data-resize-listener-bound")) {
              root.setAttribute("data-resize-listener-bound", "true");
              let resizeTimer: any;
              const handleResize = () => {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(() => {
                  resetMobileState();
                }, 150);
              };

              // Listen on the canvas window if available, otherwise main window
              const targetWindow = root.ownerDocument?.defaultView || window;
              targetWindow.addEventListener("resize", handleResize);
            }

            // Add sub-toggle buttons for any li that contains a submenu
            root
              .querySelectorAll<HTMLElement>("li > ul.submenu")
              .forEach((ul) => {
                const parent = ul.parentElement as HTMLElement | null;
                if (!parent) return;
                parent.setAttribute("data-has-submenu", "1");
                // Ensure there's a mobile sub-toggle button only once
                if (!parent.querySelector(".mobile-sub-toggle")) {
                  const btn = document.createElement("button");
                  btn.type = "button";
                  btn.className = "mobile-sub-toggle";
                  btn.innerText = "+";
                  btn.setAttribute("aria-expanded", "false");
                  // Insert after the anchor
                  const a = parent.querySelector(":scope > a");
                  if (a) a.insertAdjacentElement("afterend", btn);
                  // Initially hide submenu on mobile; leave existing desktop behavior intact
                  ul.style.display = "none";
                  btn.addEventListener("click", (ev) => {
                    ev.stopPropagation();
                    const expanding = !parent.classList.contains("expanded");
                    btn.innerText = expanding ? "-" : "+";
                    btn.setAttribute(
                      "aria-expanded",
                      expanding ? "true" : "false"
                    );
                    if (expanding) {
                      parent.classList.add("expanded");
                      // prepare for animation: set display first so scrollHeight can be measured
                      try {
                        ul.style.setProperty("display", "block", "important");
                      } catch (e) {
                        ul.style.display = "block";
                      }
                      ul.style.position = "static";
                      ul.style.left = "auto";
                      ul.style.top = "auto";
                      ul.style.zIndex = "2";
                      ul.style.overflow = "visible";
                      // force reflow to ensure display:block is applied before measuring
                      const _ = ul.offsetHeight;
                      // now measure scrollHeight and animate; use larger value as fallback
                      const full =
                        Math.max(ul.scrollHeight, ul.clientHeight) + "px";
                      console.log(
                        "Expanding submenu - scrollHeight:",
                        ul.scrollHeight,
                        "clientHeight:",
                        ul.clientHeight,
                        "full:",
                        full
                      );
                      ul.style.maxHeight = full;
                      ul.style.opacity = "1";
                    } else {
                      // collapse with animation - add collapsing class to override expanded CSS rules
                      console.log("Collapsing submenu");
                      // Force reflow to ensure current state is rendered before adding collapsing class
                      const _ = ul.offsetHeight;
                      ul.classList.add("collapsing");
                      // when transition ends (or fallback timeout), hide the element and remove expanded
                      let done = false;
                      const cleanup = () => {
                        if (done) return;
                        done = true;
                        console.log("Cleanup called");
                        parent.classList.remove("expanded");
                        ul.classList.remove("collapsing");
                        // Clear animation-related inline styles to reset layout
                        ul.style.maxHeight = "";
                        ul.style.opacity = "";
                        ul.style.position = "";
                        ul.style.left = "";
                        ul.style.top = "";
                        ul.style.zIndex = "";
                        ul.style.overflow = "";
                        try {
                          ul.style.setProperty("display", "none", "important");
                        } catch (e) {
                          ul.style.display = "none";
                        }
                        ul.removeEventListener("transitionend", onEnd as any);
                        clearTimeout(fallback);
                      };
                      const onEnd = (ev2?: TransitionEvent) => {
                        // accept any transition end (some browsers report different property names)
                        console.log("Transitionend fired");
                        cleanup();
                      };
                      ul.addEventListener("transitionend", onEnd as any);
                      const fallback = setTimeout(() => {
                        console.log("Fallback timeout called");
                        cleanup();
                      }, 320);
                    }
                  });
                }
              });
          } catch (e) {
            /* no-op */
          }
        },
      },
    },
    view: {
      events() {
        return {
          "click .edit-menu-btn": "toggleEditMode",
          "click .toggle-link-modal-btn": "toggleLinkModal",
        };
      },
      toggleLinkModal() {
        const el = (this as any).el as HTMLElement;
        const btn = el.querySelector<HTMLButtonElement>(
          ".toggle-link-modal-btn"
        );
        const container = el.closest(".custom-menu-container");
        if (container && btn) {
          // Get current state
          const currentState = btn.getAttribute("data-state") || "on";
          const newState = currentState === "on" ? "off" : "on";

          // Update button appearance and data attribute
          btn.setAttribute("data-state", newState);
          if (newState === "on") {
            btn.textContent = "ON";
            btn.style.background = "#0078d4"; // brand blue
            btn.style.color = "#ffffff";
            container.setAttribute("data-allow-link-edit", "true");
          } else {
            btn.textContent = "OFF";
            btn.style.background = "#005a9c"; // slightly darker
            btn.style.color = "#ffffff";
            container.setAttribute("data-allow-link-edit", "false");
          }
        }
      },
      updateInteractivity(editMode: boolean) {
        const rootModel: any = (this as any).model;
        if (!rootModel) return;

        // Root stays selectable but not draggable
        try {
          rootModel.set?.({ draggable: false, selectable: true });
        } catch (e) {
          void e;
        }

        const children: any[] = (rootModel.find && rootModel.find("*")) || [];
        (children || []).forEach((m: any) => {
          try {
            const tag = ((m.get && m.get("tagName")) || "")
              .toString()
              .toLowerCase();
            const isAnchor = tag === "a";
            const isLi = tag === "li";

            if (editMode) {
              // Edit mode policy:
              // - LI: selectable + draggable
              // - A: selectable, NOT draggable, editable
              // - All other descendants: NOT selectable/draggable/editable (prevents inner blue borders)
              if (isLi) {
                // LI elements should be selectable in edit mode but NOT draggable.
                // Prevents moving of top-level items and subitems; container-level move remains available.
                m.set?.({
                  selectable: true,
                  draggable: false,
                  hoverable: true,
                  layerable: true,
                  copyable: true,
                  resizable: false,
                  editable: false,
                });
              } else if (isAnchor) {
                m.set?.({
                  selectable: true,
                  draggable: false,
                  hoverable: true,
                  layerable: true,
                  copyable: true,
                  resizable: false,
                  editable: true,
                });
              } else {
                m.set?.({
                  selectable: false,
                  draggable: false,
                  hoverable: false,
                  layerable: false,
                  copyable: false,
                  resizable: false,
                  editable: false,
                });
              }
            } else {
              m.set?.({
                selectable: false,
                draggable: false,
                hoverable: false,
                layerable: false,
                copyable: false,
                resizable: false,
                editable: false,
              });
              // Clear toolbars when not editing
              m.set?.("toolbar", []);
            }
          } catch (e) {
            void e;
          }
        });
      },

      refreshToolbars(editMode: boolean) {
        const rootModel: any = (this as any).model;
        if (!rootModel) return;

        // Anchors and submenu LIs get toolbars in edit mode; everyone else should have none
        const allChildren: any[] =
          (rootModel.find && rootModel.find("*")) || [];
        (allChildren || []).forEach((m: any) => {
          try {
            const tag = (m.get && m.get("tagName")) || "";
            if (!editMode) {
              m.set?.("toolbar", []);
              return;
            }

            // In edit mode: anchors and LI elements (subitems) get custom toolbars
            const tagLower = tag && tag.toLowerCase();
            if (tagLower === "a" || tagLower === "li") {
              try {
                (buildMenuToolbarForModel as any)(m);
              } catch (e) {
                // Fallback toolbar
                if (tagLower === "a") {
                  m.set?.("toolbar", [
                    {
                      attributes: { class: "fa fa-link", title: "Change link" },
                      command: "set-menu-link",
                    },
                  ]);
                } else {
                  m.set?.("toolbar", []);
                }
              }
            } else {
              m.set?.("toolbar", []);
            }
          } catch (e) {
            // no-op: ignore errors when setting toolbars
          }
        });
      },
      toggleEditMode() {
        const el = (this as any).el as HTMLElement;
        const btn = el.querySelector<HTMLButtonElement>(".edit-menu-btn");
        const toggleWrapper =
          el.querySelector<HTMLElement>(".link-modal-toggle");
        const currentlyEditing = !!(this as any).editMode;
        (this as any).editMode = !currentlyEditing;
        const editMode = !!(this as any).editMode;
        if (btn) btn.textContent = editMode ? "Save Menu" : "Edit Menu";

        // Show/hide the toggle wrapper based on edit mode
        if (toggleWrapper) {
          toggleWrapper.style.display = editMode ? "flex" : "none";
        }

        // Toggle editing class on container for CSS-based arrow visibility
        const container = el.closest(".custom-menu-container");
        if (container) {
          if (editMode) container.classList.add("editing");
          else container.classList.remove("editing");
        }

        // Show/hide submenus in editor
        el.querySelectorAll<HTMLElement>("ul.submenu").forEach((ul) => {
          if (editMode) {
            ul.style.display = "block";
            ul.style.position = "static";
            ul.style.top = "";
            ul.style.left = "";
            ul.style.zIndex = "";
          } else {
            ul.style.display = "none";
          }
        });

        //  Gate interactivity and toolbars by edit mode
        // Let GrapesJS manage text editing via its RTE (editable flag on models)
        (this as any).updateInteractivity?.(editMode);
        (this as any).refreshToolbars?.(editMode);

        if (!editMode) {
          // Stop any active text editing session (RTE) when leaving edit mode
          try {
            (this as any).em?.stopCommand?.("core:component-text-edit");
          } catch (e) {
            void e;
          }

          // Hide submenus when leaving edit mode
          el.querySelectorAll<HTMLElement>("ul.submenu").forEach((ul) => {
            ul.style.display = "none";
          });
          // Clear any current selection so no toolbar stays visible
          try {
            (this as any).em?.setSelected?.(null);
          } catch (e) {
            void e;
          }
        }

        // Re-bind preview flyouts inside editor when not editing
        this.managePreviewFlyouts();
        // Apply bulletproof styling scoped to this component
        try {
          const rootEl = (this as any).el as HTMLElement;
          const wrapperModel =
            (this as any).model && (this as any).model.closest
              ? (this as any).model.closest()
              : editor.getWrapper && editor.getWrapper();
          setTimeout(() => applyBulletproofStyling(rootEl, wrapperModel), 10);
        } catch (e) {
          void e;
        }
      },
      managePreviewFlyouts() {
        const root = (this as any).el as HTMLElement;

        const inEditorCanvas = !!root.closest("[data-gjs-type]");
        if (inEditorCanvas) return;
        const editMode = !!(this as any).editMode;
        // Remove any previous bindings
        const boundParents = (root as any)._flyoutParents as
          | HTMLElement[]
          | undefined;
        if (boundParents) {
          boundParents.forEach((p) => {
            p.onmouseenter = null as any;
            p.onmouseleave = null as any;
          });
        }
        (root as any)._flyoutParents = [];
        if (editMode) return; // only active in preview (non-edit) mode inside editor
        // Ensure data-has-submenu markers
        root.querySelectorAll("li > ul.submenu").forEach((ul) => {
          const parent = ul.parentElement as HTMLElement | null;
          if (parent) parent.setAttribute("data-has-submenu", "1");
        });

        // Check viewport width: only attach hover flyouts on desktop (>768px)
        const vw = window.innerWidth || document.documentElement.clientWidth;
        if (vw <= 768) {
          // Mobile: no hover flyouts, click-only interaction via '+'/'-' buttons
          return;
        }

        const parents = Array.from(
          root.querySelectorAll<HTMLElement>("li[data-has-submenu]")
        );
        parents.forEach((parent) => {
          const enter = () => {
            const sub = parent.querySelector<HTMLElement>("ul.submenu");
            if (!sub) return;
            // Don't interfere if this parent is in a click-expanded state
            try {
              if (parent.classList && parent.classList.contains("expanded"))
                return;
            } catch (e) {
              /* proceed with hover */
            }
            // Make visible first
            sub.style.display = "block";
            const rect = parent.getBoundingClientRect();
            const scrollY =
              window.scrollY || document.documentElement.scrollTop;
            const scrollX =
              window.scrollX || document.documentElement.scrollLeft;
            sub.style.position = "fixed";
            sub.style.top = rect.top + scrollY + "px";
            let left2 = rect.right + scrollX;
            const subWidth2 = sub.offsetWidth || 220;
            const vw2 =
              window.innerWidth || document.documentElement.clientWidth;
            if (left2 + subWidth2 > vw2 - 8) {
              left2 = rect.left + scrollX - subWidth2;
              if (left2 < 4) left2 = 4;
            }
            sub.style.left = left2 + "px";
            sub.style.zIndex = "9999";
            sub.style.maxHeight = "400px";
            sub.style.overflowY = "auto";
          };
          const leave = () => {
            const sub = parent.querySelector<HTMLElement>("ul.submenu");
            if (!sub) return;
            try {
              // If this parent has been expanded via click (mobile '+' -> adds .expanded),
              // don't hide the submenu on mouseleave; let the explicit '-' collapse handle it.
              if (parent.classList && parent.classList.contains("expanded"))
                return;
            } catch (e) {
              // ignore errors and fall back to hiding
            }
            sub.style.display = "none";
          };
          parent.onmouseenter = enter;
          parent.onmouseleave = leave;
          (root as any)._flyoutParents.push(parent);
        });
      },
      ensurePlusButtons() {
        // Inline buttons removed; toolbar commands handle add/remove.
      },
      ensureTopLevelControls() {
        // no-op: top-level inline controls removed
      },
      ensureSubItemControls() {
        // no-op: sub-item inline controls removed
      },
      onAddTopLevelItemAfter(e: MouseEvent) {
        const view: any = this;
        const btn = e.target as HTMLElement;
        const liEl = btn.closest("li");
        if (!liEl) return;
        const liComps = view.model.find ? view.model.find("li") : [];
        let liModel: any = null;
        for (const c of liComps || []) {
          if (c.getEl && c.getEl() === liEl) {
            liModel = c;
            break;
          }
        }
        if (!liModel) return;
        const parentModel = liModel.parent();
        try {
          const siblings = parentModel.components?.();
          const idx = siblings.indexOf
            ? siblings.indexOf(liModel)
            : siblings.models.indexOf(liModel);
          // Create LI with anchor link
          const newItem = siblings.add(
            {
              tagName: "li",
              draggable: false,
              attributes: { "data-gjs-draggable": "false" },
              components: [
                {
                  tagName: "a",
                  type: "link",
                  attributes: {
                    href: "#",
                    class: "nav-link",
                    target: "_blank",
                    rel: "noopener noreferrer",
                  },
                  content: "New Item",
                },
              ],
            },
            { at: idx + 1 }
          );
          view.em && view.em.setSelected?.(newItem);
          this.ensureTopLevelControls();
        } catch (e) {
          console.warn("[NavPlugin] Failed inserting item", e);
        }
      },
      onRemoveTopLevelItem(e: MouseEvent) {
        const view: any = this;
        const btn = e.target as HTMLElement;
        const liEl = btn.closest("li");
        if (!liEl) return;
        const liComps = view.model.find ? view.model.find("li") : [];
        for (const c of liComps || []) {
          if (c.getEl && c.getEl() === liEl) {
            try {
              c.remove();
            } catch (err) {
              console.warn("[NavPlugin] Failed removing item", err);
            }
            break;
          }
        }
        this.ensureTopLevelControls();
      },
      onAddSubItemAfter(e: MouseEvent) {
        const view: any = this;
        const btn = e.target as HTMLElement;
        const liEl = btn.closest("li");
        if (!liEl) return;
        // identify li model (sub item)
        const allLis = view.model.find ? view.model.find("li") : [];
        let liModel: any = null;
        for (const c of allLis || []) {
          if (c.getEl && c.getEl() === liEl) {
            liModel = c;
            break;
          }
        }
        if (!liModel) return;
        const parentUl = liModel.parent();
        // ensure parent is submenu
        if (
          !parentUl ||
          !(parentUl.getAttributes?.().class || "").includes("submenu")
        )
          return;
        try {
          const siblings = parentUl.components?.();
          const idx = siblings.indexOf
            ? siblings.indexOf(liModel)
            : siblings.models.indexOf(liModel);
          const newItem = siblings.add(
            {
              tagName: "li",
              draggable: false,
              attributes: {
                "data-gjs-draggable": "false",
                "data-menu-subitem": "1",
              },
              components: [
                {
                  tagName: "a",
                  type: "link",
                  attributes: {
                    href: "#",
                    class: "submenu-link",
                    target: "_blank",
                    rel: "noopener noreferrer",
                  },
                  content: "New Submenu Item",
                },
              ],
              // Copy style of the item we inserted after (if any) for consistency
              style: liModel.getStyle
                ? liModel.getStyle()
                : { padding: "2px 4px" },
            },
            { at: idx + 1 }
          );
          view.em && view.em.setSelected?.(newItem);
          this.ensureSubItemControls();
        } catch (e2) {
          console.warn("[NavPlugin] Failed adding sub item", e2);
        }
      },
      onRemoveSubItem(e: MouseEvent) {
        const view: any = this;
        const btn = e.target as HTMLElement;
        const liEl = btn.closest("li");
        if (!liEl) return;
        const allLis = view.model.find ? view.model.find("li") : [];
        for (const c of allLis || []) {
          if (c.getEl && c.getEl() === liEl) {
            // only remove if parent is submenu
            const parentUl = c.parent();
            if (
              parentUl &&
              (parentUl.getAttributes?.().class || "").includes("submenu")
            ) {
              try {
                c.remove();
              } catch (err) {
                console.warn("[NavPlugin] Failed removing sub item", err);
              }
              break;
            }
          }
        }
        this.ensureSubItemControls();
      },
      onAddSubmenu(e: MouseEvent) {
        const view: any = this;
        const rootEl = view.el as HTMLElement;
        const target = e.target as HTMLElement;
        const liEl = target.closest("li") as HTMLElement | null;
        if (!liEl) return;

        // Map the clicked LI element to its component model
        const liComps = view.model.find ? view.model.find("li") : [];
        let liModel: any = null;
        if (Array.isArray(liComps)) {
          for (const c of liComps) {
            try {
              if (c.getEl && c.getEl() === liEl) {
                liModel = c;
                break;
              }
            } catch (e) {
              console.warn("[NavPlugin] Failed mapping LI element to model", e);
            }
          }
        }
        if (!liModel) return;

        // Find/create submenu UL as a component
        let submenuModel: any = null;
        try {
          const found = liModel.find ? liModel.find("ul.submenu") : [];
          submenuModel = Array.isArray(found) && found[0] ? found[0] : null;
        } catch (e) {
          console.warn("[NavPlugin] Failed searching for submenu component", e);
        }

        if (!submenuModel) {
          submenuModel = liModel.append({
            tagName: "ul",
            attributes: { class: "submenu" },
            style: {
              listStyle: "none",
              margin: "6px 0 0 14px",
              padding: "0",
              borderLeft: "2px solid #ddd",
              display: "block",
            },
          });
          // append returns a collection for multiple; normalize to model
          if (Array.isArray(submenuModel)) submenuModel = submenuModel[0];
        } else {
          // ensure visible while editing
          try {
            submenuModel.addStyle &&
              submenuModel.addStyle({ display: "block" });
          } catch (e) {
            console.warn("[NavPlugin] Failed to show submenu in edit mode", e);
          }
        }

        // Force submenu DOM element to be at the end of the LI so it never appears above the label
        try {
          const liDom = liModel.getEl && liModel.getEl();
          const subEl = submenuModel.getEl && submenuModel.getEl();
          if (liDom && subEl && subEl !== liDom.lastElementChild) {
            liDom.appendChild(subEl); // moves to end
          }
        } catch (reorderErr) {
          console.warn("[NavPlugin] Failed reordering submenu", reorderErr);
        }

        // Mark parent LI so arrow shows in preview
        try {
          const liDom2 = liModel.getEl && liModel.getEl();
          if (liDom2) liDom2.setAttribute("data-has-submenu", "1");
        } catch (markErr) {
          console.warn("[NavPlugin] Failed marking parent for arrow", markErr);
        }

        // Append a new submenu LI as a text component for persistence
        let newItem: any = null;
        try {
          newItem = submenuModel.append({
            tagName: "li",
            draggable: false,
            attributes: {
              "data-gjs-draggable": "false",
              "data-menu-subitem": "1",
            },
            components: [
              {
                tagName: "a",
                type: "link",
                attributes: {
                  href: "#",
                  class: "submenu-link",
                  target: "_blank",
                  rel: "noopener noreferrer",
                },
                content: "New Submenu Item",
              },
            ],
            style: { padding: "2px 4px", cursor: "text" },
          });
          if (Array.isArray(newItem)) newItem = newItem[0];
        } catch (e) {
          console.warn("[NavPlugin] Failed appending submenu item", e);
        }

        // Select the new item for immediate editing
        try {
          view.em && (view.em as any).setSelected?.(newItem || submenuModel);
        } catch (e) {
          console.warn("[NavPlugin] Failed selecting new submenu item", e);
        }
      },
      onRender() {
        (this as any).el.setAttribute("data-gjs-type", "custom-menu");
        // Default to non-edit mode
        (this as any).editMode = false;
        this.ensurePlusButtons();
        this.ensureTopLevelControls();
        this.ensureSubItemControls();
        // Ensure submenus are hidden on initial render (will be shown only in edit mode)
        (this as any).el
          .querySelectorAll("ul.submenu")
          .forEach((ul: Element) => {
            (ul as HTMLElement).style.display = "none";
          });
        // Remove editing class just in case
        const container = (this as any).el.closest(".custom-menu-container");
        if (container) {
          container.classList.remove("editing");
          // If this component is rendered inside the GrapesJS editor canvas,
          // mark the container so editor-only styling can be applied.
          const inEditorCanvas = !!(this as any).el.closest("[data-gjs-type]");
          if (inEditorCanvas) container.classList.add("in-editor");
          else container.classList.remove("in-editor");
        }
        // Mark any existing submenu parents
        (this as any).el
          .querySelectorAll("li > ul.submenu")
          .forEach((ul: Element) => {
            const parent = ul.parentElement as HTMLElement | null;
            if (parent) parent.setAttribute("data-has-submenu", "1");
          });

        // NEW: Lock interactivity and clear toolbars initially
        (this as any).updateInteractivity?.(false);
        (this as any).refreshToolbars?.(false);

        // Enable preview flyouts inside editor (initial non-edit state)
        this.managePreviewFlyouts();
        // Apply bulletproof styling scoped to this component on render
        try {
          const rootEl = (this as any).el as HTMLElement;
          const wrapperModel =
            (this as any).model && (this as any).model.closest
              ? (this as any).model.closest()
              : editor.getWrapper && editor.getWrapper();
          setTimeout(() => applyBulletproofStyling(rootEl, wrapperModel), 10);
        } catch (e) {
          void e;
        }
      },
    },
  });

  domc.addType("custom-menu-container", {
    isComponent: (el) => {
      if (el.classList && el.classList.contains("custom-menu-container")) {
        return { type: "custom-menu" } as any;
      }
      return false;
    },
  });

  // Initial cleanup: replace toolbars for any existing anchors in the wrapper
  try {
    const wrapper = editor.getWrapper && editor.getWrapper();
    const anchors = wrapper && wrapper.find ? wrapper.find("a") : [];
    (anchors || []).forEach((m: any) => {
      try {
        const el = m.getEl && m.getEl();
        const container =
          el && el.closest ? el.closest(".custom-menu-container") : null;
        const inEdit = !!(container && container.classList.contains("editing"));
        if (inEdit) buildMenuToolbarForModel(m);
        else m.set && m.set("toolbar", []);
      } catch (e) {
        /* no-op */
      }
    });
  } catch (e) {
    /* no-op */
  }

  // Ensure newly created/added components are normalized
  editor.on &&
    editor.on("component:add", (model: any) => {
      try {
        if (!model) return;
        // Delay to allow the component DOM to be available
        setTimeout(() => {
          const processAnchor = (m: any) => {
            try {
              const el = m.getEl && m.getEl();
              const container =
                el && el.closest ? el.closest(".custom-menu-container") : null;
              const inEdit = !!(
                container && container.classList.contains("editing")
              );
              if (inEdit) buildMenuToolbarForModel(m);
              else m.set && m.set("toolbar", []);
            } catch (e) {
              /* no-op */
            }
          };

          // If model itself is an anchor or contains anchors, process them
          if (model.get && (model.get("tagName") || "").toLowerCase() === "a") {
            processAnchor(model);
          } else if (model.find) {
            const found = model.find("a") || [];
            (found || []).forEach((m: any) => processAnchor(m));
          }
        }, 0);
      } catch (e) {
        /* no-op */
      }
    });

  function normalizeMenuStructure(rootEl: HTMLElement | null) {
    try {
      if (!rootEl) return;

      // Ensure no bullets via inline styles (stronger than CSS in some editor contexts)
      const lists = Array.from(
        rootEl.querySelectorAll("ul, ol")
      ) as HTMLElement[];
      lists.forEach((ul) => {
        try {
          ul.style.listStyle = "none";
          ul.style.paddingLeft = "0";
          ul.style.marginLeft = "0";
        } catch (e) {
          void e;
        }
      });
      const listItems = Array.from(
        rootEl.querySelectorAll("li")
      ) as HTMLElement[];
      listItems.forEach((liEl) => {
        try {
          liEl.style.listStyle = "none";
        } catch (e) {
          void e;
        }
      });

      const anchors = Array.from(rootEl.querySelectorAll("a")) as HTMLElement[];
      (anchors || []).forEach((el: any) => {
        try {
          // If anchor is a direct child of UL/OL (i.e., not wrapped in LI), wrap it
          const parentTag = (
            (el.parentElement && el.parentElement.tagName) ||
            ""
          ).toLowerCase();
          if (parentTag === "ul" || parentTag === "ol") {
            const li = document.createElement("li");
            el.parentElement && el.parentElement.insertBefore(li, el);
            li.appendChild(el);
            // set inline style to prevent bullets
            li.style.listStyle = "none";
          }

          // Ensure submenu ULs are last children of their LI
          const li = el.closest && el.closest("li");
          if (li) {
            const submenu = li.querySelector && li.querySelector("ul.submenu");
            if (submenu && submenu !== li.lastElementChild) {
              li.appendChild(submenu);
            }
          }
        } catch (e) {
          void e;
        }
      });

      // Also remove empty LIs (no children or only whitespace)
      const lis = Array.from(rootEl.querySelectorAll("li")) as HTMLElement[];
      (lis || []).forEach((el) => {
        try {
          const txt = (el.textContent || "").trim();
          const hasAnchor = !!el.querySelector && !!el.querySelector("a");
          if (!hasAnchor && !txt) {
            el.parentElement && el.parentElement.removeChild(el);
          }
        } catch (e) {
          void e;
        }
      });
    } catch (e) {
      void e;
    }
  }

  function applyBulletproofStyling(
    rootEl: HTMLElement | null,
    wrapperModel?: any
  ) {
    try {
      if (!rootEl) return;

      const allLists = Array.from(
        rootEl.querySelectorAll("ul, ol")
      ) as HTMLElement[];
      allLists.forEach((list) => {
        try {
          list.style.listStyle = "none";
          list.style.listStyleType = "none";
          list.style.listStyleImage = "none";
          list.style.listStylePosition = "outside";
          list.style.paddingLeft = "0";
          list.style.marginLeft = "0";
        } catch (e) {
          void e;
        }
      });

      const allListItems = Array.from(
        rootEl.querySelectorAll("li")
      ) as HTMLElement[];
      allListItems.forEach((li) => {
        try {
          li.style.listStyle = "none";
          li.style.listStyleType = "none";
          li.style.listStyleImage = "none";
          li.style.listStylePosition = "outside";
        } catch (e) {
          void e;
        }
      });

      // Optionally persist styles to the provided wrapper model's child models
      if (wrapperModel) {
        try {
          const listModels = wrapperModel.find
            ? wrapperModel.find("ul, ol")
            : [];
          (listModels || []).forEach((m: any) => {
            try {
              m.addStyle &&
                m.addStyle({
                  listStyle: "none",
                  listStyleType: "none",
                  listStyleImage: "none",
                  paddingLeft: "0",
                  marginLeft: "0",
                });
            } catch (e) {
              void e;
            }
          });
          const liModels = wrapperModel.find ? wrapperModel.find("li") : [];
          (liModels || []).forEach((m: any) => {
            try {
              m.addStyle &&
                m.addStyle({
                  listStyle: "none",
                  listStyleType: "none",
                  listStyleImage: "none",
                });
            } catch (e) {
              void e;
            }
          });
        } catch (e) {
          void e;
        }
      }
    } catch (e) {
      void e;
    }
  }

  // Scoped listeners: only apply normalization/styling when events happen inside our menu component
  editor.on &&
    editor.on("component:drag:end", (model: any) => {
      try {
        // If model has an element inside a custom-menu-container, scope normalization
        const el = model && model.getEl && model.getEl();
        const container =
          el && el.closest ? el.closest(".custom-menu-container") : null;
        if (container) {
          setTimeout(() => {
            normalizeMenuStructure(container as HTMLElement);
            const wrapperModel = editor.getWrapper && editor.getWrapper();
            applyBulletproofStyling(container as HTMLElement, wrapperModel);
          }, 50);
        }
      } catch (e) {
        void e;
      }
    });

  editor.on &&
    editor.on("component:add", (model: any) => {
      try {
        const el = model && model.getEl && model.getEl();
        const container =
          el && el.closest ? el.closest(".custom-menu-container") : null;
        if (container) {
          setTimeout(() => {
            normalizeMenuStructure(container as HTMLElement);
            const wrapperModel = editor.getWrapper && editor.getWrapper();
            applyBulletproofStyling(container as HTMLElement, wrapperModel);
          }, 50);
        }
      } catch (e) {
        void e;
      }
    });
};

export default customMenuItemsPlugin;
