import { log } from "console";
import type { Editor, Component } from "grapesjs";

export default function headingPlugin(editor: Editor): void {
  const bm = editor.BlockManager;
  const dc = editor.DomComponents;

  // Helper to generate heading type
  function createHeadingType(level: "h1" | "h2" | "h3") {
    const TYPE = `${level}-heading`;
    const DATA_ATTR = `data-${TYPE}-control`;
    const CLASS = `gjs-${TYPE}`;
    const OVERLAY_ATTR = `data-hide-${TYPE}-overlays`;

    dc.addType(TYPE, {
      extend: "text",
      isComponent: (el: HTMLElement): boolean =>
        el.tagName === level.toUpperCase() && el.getAttribute(DATA_ATTR) === "1",
      model: {
        defaults: {
          tagName: level,
          attributes: { [DATA_ATTR]: "1", class: CLASS },
          content: `${level.toUpperCase()} Heading`,
          style: { border: "1px dotted #ccc"},
          droppable: false,
          draggable: true,
          editable: true,
          selectable: true,
          hoverable: true,
          highlightable: true,
          badgable: false,
          resizable: false,
          toolbar: [
            { attributes: { class: "fa fa-arrows", title: "Move" }, command: "tlb-move" },
            { attributes: { class: "fa fa-clone", title: "Clone" }, command: "tlb-clone" },
            { attributes: { class: "fa fa-trash", title: "Delete" }, command: "tlb-delete" },
          ],
          traits: [
            { type: "text", name: "title", label: "Title" },
            { type: "text", name: "id", label: "ID" },
            { type: "link", name: "link", label: "Link (URL)" },
          ],
          script: function (this: HTMLElement) {
            // Safety check: ensure 'this' is a valid HTMLElement
            if (!this || typeof this.getAttribute !== 'function') {
              console.warn('[HeadingsPlugin] Invalid context in script');
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
            // Unique class
            const classes = this.getClasses ? this.getClasses() : [];
            const hasUniq =
              Array.isArray(classes) && classes.some((c: string) => new RegExp(`^${level}c-`).test(c));
            if (!hasUniq) {
              const uniq = `${level}c-${Date.now().toString(36)}-${Math.random()
                .toString(36)
                .slice(2, 6)}`;
              this.addClass?.(uniq);
            }

            // Title trait → updates text
            this?.on?.("change:title", () => {
              const v = this.get("title");
              if (v) this.set("content", v);
            });
       } catch (err) {
  console.error("Heading init error:", err);
}
        },
      },
    });

    // Inject CSS for default color
    editor.on("load", () => {
      const doc = editor.Canvas.getDocument();
      if (!doc) return;

      const style = doc.createElement("style");
      style.textContent = `
        .${CLASS} { color: #002095; }
      `;
      doc.head.appendChild(style);
    });

    // Block for block manager
    bm.add(TYPE, {
      label:"Heading",
      media:` <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" fill="#000">
            <text x="2" y="17" font-size="14" font-family="Arial" font-weight="bold">${level.toUpperCase()}</text>
          </svg>`,
      category: "Headings",
      content: { type: TYPE },
    });
  }

  // Create H1, H2, H3 types
  createHeadingType("h1");
  createHeadingType("h2");
  createHeadingType("h3");
}
