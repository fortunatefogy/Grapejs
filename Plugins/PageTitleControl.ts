import type { Editor, Component } from "grapesjs";

export default function pageTitlePlugin(editor: Editor): void {
  const DATA_ATTR = "data-page-title-control" as const;
  const OVERLAY_ATTR = "data-hide-pagetitle-overlays" as const;

  const dc = editor.DomComponents;
  const bm = editor.BlockManager;

  const getDoc = (): Document | null => {
    try {
      return editor.Canvas.getDocument();
    } catch (err) {
      console.error("Error getting GrapesJS document:", err);
      return null;
    }
  };

  const isTransparentColor = (c?: string | null): boolean => {
    return !c || c === "rgba(0, 0, 0, 0)" || c === "transparent";
  };

  type _GjsComponent = Component;

  dc.addType("page-title", {
    extend: "text",
    isComponent: (el: HTMLElement): boolean => {
      return el.tagName === "DIV" && el.getAttribute(DATA_ATTR) === "1";
    },
    model: {
      defaults: {
        tagName: "div",
        attributes: { [DATA_ATTR]: "1" },
        classes: ["innerPageBanner2Container"],
        droppable: false,
        draggable: true,
        selectable: true,
        hoverable: false,
        highlightable: false,
        badgable: false,
        resizable: false,
        editable: true,
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
        content: "PAGE TITLE",
        style: { padding: "20px" , border:"1px dotted #ccc"},
        traits: [
          { type: "text", name: "title", label: "Title" },
          { type: "text", name: "id", label: "ID" },
          { type: "link", name: "link", label: "Link (URL)" },
        ],
        script: function (this: HTMLElement) {
          // Safety check: ensure 'this' is a valid HTMLElement
          if (!this || typeof this.getAttribute !== 'function') {
            console.warn('[PageTitleControl] Invalid context in script');
            return;
          }
          
          var link = this.getAttribute("link");
          if (link && link.trim()) {
            this.style.cursor = "pointer";
            this.addEventListener("click", function () {
              if (link) window.open(link, "_blank");
            });
          }
        },
      },
      init(this: any) {
        try {
          const classes = this.getClasses ? this.getClasses() : [];
          const hasUniq =
            Array.isArray(classes) &&
            classes.some((c: unknown) => /^ptc-/.test(String(c)));
          if (!hasUniq) {
            const uniq = `ptc-${Date.now().toString(36)}-${Math.random()
              .toString(36)
              .slice(2, 6)}`;
            this?.addClass?.(uniq);
          }

          this?.on?.("change:bgColor", () => {
            const v = this.get("bgColor") as string | undefined;
            if (v) this?.addStyle?.({ "background-color": v });
          });

          this?.on?.("change:textColor", () => {
            const v = this.get("textColor") as string | undefined;
            if (v) this?.addStyle?.({ color: v });
          });

          this?.on?.("change:title", () => {
            const v = this.get("title") as string | undefined;
            if (v) this.set("content", v);
          });
        } catch (err) {
          console.error("Error in PageTitle init:", err);
        }
      },
    },
  });

  const isPageTitle = (cmp: any): boolean => {
    try {
      const attrs = cmp?.getAttributes ? cmp.getAttributes() : {};
      return !!attrs && attrs[DATA_ATTR] === "1";
    } catch (err) {
      console.error("Error checking PageTitle component:", err);
      return false;
    }
  };

  const getPageTitleRoot = (cmp: any): any | null => {
    try {
      let cur = cmp;
      while (cur) {
        if (isPageTitle(cur)) return cur;
        cur = cur.parent ? cur.parent() : null;
      }
    } catch (err) {
      console.error("Error finding PageTitle root:", err);
    }
    return null;
  };

  editor.on("component:selected", (cmp: any) => {
    if (isPageTitle(cmp)) {
      try {
        editor.runCommand("core:component-edit", { component: cmp });
      } catch (err) {
        console.error("Error selecting PageTitle:", err);
      }
    }
  });
  editor.on("component:deselected", (cmp: any) => {
    if (isPageTitle(cmp)) {
      try {
        editor.stopCommand && editor.stopCommand("core:component-edit");
      } catch (err) {
        console.error("Error deselecting PageTitle:", err);
      }
    }
  });

  editor.on("component:add", (comp: any) => {
    try {
      const attrs = comp.getAttributes ? comp.getAttributes() : {};
      if (attrs && attrs[DATA_ATTR] === "1") {
        const existingClasses = comp.getClasses ? comp.getClasses() : [];
        const hasUniq =
          Array.isArray(existingClasses) &&
          existingClasses.some((c: unknown) => /^ptc-/.test(String(c)));
        if (!hasUniq) {
          const uniq = `ptc-${Date.now().toString(36)}-${Math.random()
            .toString(36)
            .slice(2, 6)}`;
          comp.addClass && comp.addClass(uniq);
        }

        const traitColl: any = comp.get && comp.get("traits");
        if (traitColl && traitColl.length === 0) {
          comp.addTrait &&
            comp.addTrait([
              { type: "text", name: "title", label: "Title" },
              { type: "text", name: "id", label: "ID" },
              { type: "link", name: "link", label: "Link (URL)" },
            ]);
        }
      }
    } catch (err) {
      console.error("Error adding PageTitle component:", err);
    }
  });

  editor.on("load", () => {
    try {
      const doc = getDoc();
      if (!doc) return;

      try {
        const bg =
          doc.body &&
          doc.defaultView?.getComputedStyle(doc.body).backgroundColor;
        if (isTransparentColor(bg)) doc.body.style.backgroundColor = "#ffffff";
      } catch (err) {
        console.error("Error setting body background:", err);
      }

      const style = doc.createElement("style");
      style.setAttribute("data-gjs-pcf", "pagetitle-no-overlay");
      style.textContent = `
        [${DATA_ATTR}="1"],
        [${DATA_ATTR}="1"] * {
          outline: none !important;
          box-shadow: none !important;
        }
        [${DATA_ATTR}="1"].gjs-selected,
        [${DATA_ATTR}="1"].gjs-selected *,
        [${DATA_ATTR}="1"].gjs-hovered,
        [${DATA_ATTR}="1"].gjs-hovered * {
          outline: none !important;
          box-shadow: none !important;
        }
        body[${OVERLAY_ATTR}="1"] .gjs-highlighter {
          border: 0 !important;
          outline: 0 !important;
          box-shadow: none !important;
        }
        body[${OVERLAY_ATTR}="1"] .gjs-badge,
        body[${OVERLAY_ATTR}="1"] .gjs-resizer,
        body[${OVERLAY_ATTR}="1"] .gjs-spot-placer {
          display: none !important;
        }
      `;
      doc.head.appendChild(style);
    } catch (err) {
      console.error("Error injecting overlay styles:", err);
    }
  });

  const setOverlayHidden = (hidden: boolean): void => {
    try {
      const doc = getDoc();
      const body = doc?.body;
      if (!body) return;
      if (hidden) body.setAttribute(OVERLAY_ATTR, "1");
      else body.removeAttribute(OVERLAY_ATTR);
    } catch (err) {
      console.error("Error toggling overlay hidden:", err);
    }
  };

  let _reselecting = false;
  editor.on("component:selected", (cmp: any) => {
    const root = getPageTitleRoot(cmp);
    if (root) {
      setOverlayHidden(true);
      if (cmp !== root && !_reselecting) {
        try {
          _reselecting = true;
          editor.select(root);
          editor.runCommand("core:component-edit", { component: root });
        } catch (err) {
          console.error("Error reselecting PageTitle root:", err);
        } finally {
          _reselecting = false;
        }
      }
    } else {
      setOverlayHidden(false);
    }
  });
  editor.on("component:deselected", (cmp: any) => {
    const root = getPageTitleRoot(cmp);
    if (root) setOverlayHidden(false);
  });

  editor.on("rte:enable", (cmp: any) => {
    const root = getPageTitleRoot(cmp);
    if (root) setOverlayHidden(true);
  });
  editor.on("rte:disable", (cmp: any) => {
    const root = getPageTitleRoot(cmp);
    if (root) setOverlayHidden(false);
  });

  bm.add("page-title-control", {
    label: "Page Title",
 media: `
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
       viewBox="0 0 24 24">
    <rect x="3" y="4" width="18" height="4" rx="1" fill="#050505ff"/>
    <rect x="3" y="10" width="14" height="2" rx="1" fill="#080808ff"/>
    <rect x="3" y="14" width="10" height="2" rx="1" fill="#0a0a0aff"/>
  </svg>
`,
    category: "Headings",
    content: { type: "page-title" },
  });
}
