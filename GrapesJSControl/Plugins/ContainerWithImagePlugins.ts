import type { Editor } from "grapesjs";

export default function containerWithImagePlugin(editor: Editor) {
  const dc = editor.DomComponents;
  const bm = editor.BlockManager;

  // CSS for the card container with circle image
  const CARD_CONTAINER_CSS = `/* CARD_CONTAINER_CSS_MARKER */
.card-container {
  border: 3px solid rgb(103,71,172);
  border-radius: 30px;
  padding: 20px;
  min-height: 100px;
  word-wrap: break-word;
  position: relative;
  width: 250px;
  max-width: 100%;
  box-sizing: border-box;

}

.card-container .card-image {
  position: absolute;
  top: 0;
  right: -10px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
  z-index: 2;
  background: #f0f0f0;
}

.card-container .container-content {
  word-wrap: break-word;
  overflow-wrap: break-word;
  hyphens: auto;
}

/* Ensure proper preview rendering */
.gjs-preview-mode .card-container {
  position: relative;
}

.gjs-preview-mode .card-container .card-image {
  position: absolute;
  top: 0;
  right: -10px;
}
`;

  const ensureCardContainerCss = () => {
    try {
      const current = (editor as any).getCss?.() || "";
      if (!current.includes("CARD_CONTAINER_CSS_MARKER")) {
        editor.addStyle(CARD_CONTAINER_CSS);
      }

      // Also ensure canvas iframe has a copy
      try {
        const cdoc = (editor as any).Canvas?.getDocument?.();
        if (cdoc && !cdoc.getElementById("gjs-card-container-css")) {
          const st = cdoc.createElement("style");
          st.id = "gjs-card-container-css";
          st.textContent = CARD_CONTAINER_CSS;
          cdoc.head.appendChild(st);
        }
      } catch (_) {
        /* ignore */
      }
    } catch (e) {
      console.warn("[GJS-PCF] cardContainer: ensure CSS failed", e);
    }
  };

  ensureCardContainerCss();

  // Add custom command for restoring card image
  editor.Commands.add("add-card-image", {
    run(editor, sender, options = {}) {
      const selected = editor.getSelected();
      if (!selected || (selected as any).get?.("type") !== "card-container") {
        console.warn("[GJS-PCF] cardContainer: No card container selected");
        return;
      }

      // Check if image already exists
      let existingImage = selected.find(".card-image")[0];
      if (existingImage) {
        // If the model exists but its view/DOM is not attached (stale), remove it so we can recreate.
        try {
          const el = (existingImage as any).getEl && (existingImage as any).getEl();
          const attached = !!el && !!el.parentNode;
          if (!attached) {
            try { existingImage.remove(); } catch (_) { /*no-op*/ }
            existingImage = null as any;
          } else {
            editor.select(existingImage);
            return;
          }
        } catch (e) {
          console.warn("[GJS-PCF] cardContainer: Error checking existing image attachment", e);
          // If any error, prefer to remove and recreate
          try { existingImage.remove(); } catch (_) { /*no-op*/ }
          existingImage = null as any;
        }
      }

      // Add the image component back
      const imageComponent = {
        tagName: "img",
        type: "card-image",
        attributes: {
          class: "card-image",
          src: "https://via.placeholder.com/50x50/6347AC/FFFFFF?text=IMG",
          alt: "Card Image"
        },
        draggable: false,
        selectable: true,
        hoverable: true,
        removable: false,
        toolbar: [
          {
            attributes: { class: "fa fa-trash", title: "Clear Image" },
            command: "delete-card-image-only",
          },
        ],
        traits: [
          {
            type: "text",
            name: "src",
            label: "Image URL"
          },
          {
            type: "text",
            name: "alt",
            label: "Alt Text"
          }
        ]
      };

      // Insert as first child (to maintain positioning)
      const components = selected.components();
      const addedComponent = components.add(imageComponent);

      // Ensure the added component is rendered and selected immediately.
      // Some GrapesJS setups don't show newly-added components until a re-render
      // or selection happens, so force a short async render/selection here.
      if (addedComponent) {
        try {
          // Try to move it to the first position if collection supports removal/add
          try {
            (components as any).remove?.(addedComponent);
            // Re-add; if the 'at' option isn't supported in this runtime, it's fine — we still ensure render.
            (components as any).add?.(addedComponent, { at: 0 });
          } catch (_) {
            // Fallback: attempt to manipulate internal models array to put it first
            try {
              const models = (components as any).models;
              if (Array.isArray(models)) {
                // Remove any existing reference and unshift to front
                const idx = models.indexOf(addedComponent);
                if (idx >= 0) models.splice(idx, 1);
                models.unshift(addedComponent);
                (components as any).trigger && (components as any).trigger('update');
              }
            } catch (__) { /* no-op */ }
          }


          // Select and render the added component and its parent so it appears immediately
          setTimeout(() => {
            try { editor.select(addedComponent); } catch (e) { /*no-op*/ }
            try { (addedComponent as any).view && (addedComponent as any).view.render(); } catch { /*no-op*/ }
            try { (selected as any).view && (selected as any).view.render(); } catch { /*no-op*/ }
          }, 0);
        } catch (e) {
          console.warn("[GJS-PCF] cardContainer: restoring image failed to force-render", e);
        }
      }
    }
  });

  // Add custom command for clearing only the image content, not removing the component
  editor.Commands.add("delete-card-image-only", {
    run(editor, sender, options = {}) {

      // Determine the target image component robustly.
      let target: any = null;

      // 1) If options.target provided (some callers may pass the component)
      if (options && (options as any).target) {
        target = (options as any).target;
      }

      // 2) If sender has a model (toolbar sender) and it's a component
      if (!target && sender && (sender as any).model) {
        target = (sender as any).model;
      }

      // 3) Fallback to the selected component in the editor
      const selected = editor.getSelected();
      if (!target && selected) target = selected;

      if (!target) {
        console.warn("[GJS-PCF] cardContainer: No component available to clear");
        return;
      }

      // If the target is a container (card-container), find its .card-image child
      const tryFindImageIn = (comp: any) => {
        try {
          if (!comp) return null;
          // If comp is the image itself
          const tType = comp.get && comp.get('type');
          const tAttrs = comp.get && comp.get('attributes');
          const tTag = comp.get && comp.get('tagName');
          if (tType === 'card-image' || (tAttrs && (''+tAttrs.class || '').includes('card-image')) || (tTag === 'img' && (''+tAttrs.class || '').includes('card-image'))) {
            return comp;
          }

          // If comp is a container, search children
          try {
            const found = comp.find && comp.find('.card-image');
            if (found && found.length) return found[0];
          } catch (_) { /*no-op*/ }

          // Walk up to parent and try again (in case a child is selected)
          try {
            let cur = comp.parent && comp.parent();
            while (cur) {
              const found = cur.find && cur.find('.card-image');
              if (found && found.length) return found[0];
              cur = cur.parent && cur.parent();
            }
          } catch (_) { /*no-op*/ }

        } catch (e) { console.warn('[GJS-PCF] cardContainer: tryFindImageIn error', e); }
        return null;
      };

      const imgComp = tryFindImageIn(target) || tryFindImageIn(selected);
      if (!imgComp) {
        console.warn('[GJS-PCF] cardContainer: No card-image component found to clear');
        return;
      }

      // Clear the image attributes safely and force DOM update to prevent other listeners from reverting it
      try {
        const placeholder = 'https://via.placeholder.com/50x50/6347AC/FFFFFF?text=IMG';

        // Save previous src for debugging / potential undo
        try {
          const prevAttrs = (imgComp.get && imgComp.get('attributes')) || {};
          const prevSrc = prevAttrs.src || '';
          // Store previous on the model so other code can be aware
          (imgComp as any).set && (imgComp as any).set('prevSrc', prevSrc);
        } catch (_) { /*no-op*/ }

        // Prepare new attributes with a cleared flag to avoid reversion
        try {
          const newAttrs = Object.assign({}, (imgComp.get && imgComp.get('attributes')) || {});
          newAttrs.src = placeholder;
          newAttrs.alt = 'Card Image - Double click container to add custom image';
          newAttrs['data-cleared'] = '1';
          (imgComp as any).addAttributes ? (imgComp as any).addAttributes(newAttrs) : (imgComp.set && imgComp.set('attributes', newAttrs));
        } catch (e1) {
          console.warn('[GJS-PCF] cardContainer: failed to set attributes via addAttributes, trying set', e1);
          try {
            const attrs = (imgComp.get && imgComp.get('attributes')) || {};
            attrs.src = placeholder;
            attrs.alt = 'Card Image - Double click container to add custom image';
            attrs['data-cleared'] = '1';
            imgComp.set && imgComp.set('attributes', attrs);
          } catch (e2) { console.error('[GJS-PCF] cardContainer: failed to set attributes', e2); }
        }

        // Also set the 'src' property directly on the model if supported
        try { (imgComp as any).set && (imgComp as any).set('src', placeholder); } catch { /*no-op*/ }

        // Update DOM element directly to prevent visual flicker / later re-render reverting it
        try {
          const el = (imgComp.getEl && imgComp.getEl()) || ((imgComp as any).view && (imgComp as any).view.el);
          if (el && el.setAttribute) {
            el.setAttribute('src', placeholder);
            el.setAttribute('alt', 'Card Image - Double click container to add custom image');
            el.setAttribute('data-cleared', '1');
          }
        } catch (e3) { /*no-op*/ }


        // Force render of the image view and its parent, then select the image
        try { (imgComp as any).view && (imgComp as any).view.render(); } catch { /*no-op*/ }
        try {
          const p = imgComp.parent && imgComp.parent();
          if (p && p.view && typeof p.view.render === 'function') p.view.render();
        } catch { /*no-op*/ }
        // Update trait value if traits exist to avoid trait-sync reversion
        try {
          const traits = (imgComp.get && imgComp.get('traits')) || [];
          if (Array.isArray(traits)) {
            // Find src trait
            const srcTrait = traits.find((t: any) => (t && (t.name === 'src' || t.attributes?.name === 'src')));
            if (srcTrait) srcTrait.value = placeholder;
          }
          // Also set value via set on model for src
          try { (imgComp as any).set && (imgComp as any).set('src', placeholder); } catch { /*no-op*/ }
        } catch { /*no-op*/ }

        try { editor.select(imgComp); } catch { /*no-op*/ }

      } catch (error) {
        console.error('[GJS-PCF] cardContainer: Error clearing image', error);
      }
    }
  });

  // Ensure CSS on editor load
  editor.on("load", () => {
    setTimeout(() => {
      ensureCardContainerCss();
    }, 0);
  });

  // After frame loads, re-inject CSS
  editor.on("canvas:frame:load", () => {
    try {
      ensureCardContainerCss();
    } catch (e) {
      console.warn("[GJS-PCF] cardContainer: frame load ensure failed", e);
    }
  });

  editor.on("component:add", (comp: any) => {
    try {
      const type = comp?.get?.("type");
      const el = comp?.getEl?.();
      if (type === "card-container" || el?.classList?.contains("card-container")) {
        ensureCardContainerCss();
      }
    } catch (e) {
      console.warn("[GJS-PCF] cardContainer: component:add hook failed", e);
    }
  });

  // Component Type: card-container
  dc.addType("card-container", {
    isComponent: (el: HTMLElement) => el.classList?.contains("card-container"),
    model: {
      defaults: {
        tagName: "div",
        attributes: { class: "card-container" },
        draggable: true,
        droppable: true,
        selectable: true,
        hoverable: true,
        copyable: true,
        resizable: {
          ratioDefault: false,
          keepAutoHeight: true,
          keepAutoWidth: false,
        },
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
        components: [
          {
            tagName: "img",
            type: "card-image",
            attributes: {
              class: "card-image",
              src: "https://via.placeholder.com/50x50/6347AC/FFFFFF?text=IMG",
              alt: "Card Image"
            },
            draggable: false,
            selectable: true,
            hoverable: true,
            removable: false,
            toolbar: [
              {
                attributes: { class: "fa fa-trash", title: "Clear Image" },
                command: "delete-card-image-only",
              },
            ],
            traits: [
              {
                type: "text",
                name: "src",
                label: "Image URL"
              },
              {
                type: "text",
                name: "alt",
                label: "Alt Text"
              }
            ]
          },
          {
            tagName: "div",
            type: "text",
            attributes: { class: "container-content" },
            content: "Lorem ipsum, dolor sit amet consectetur adipisicing elit. Natus ullam, dolorum vitae vero fuga placeat dolorem. Officiis eaque, corrupti, accusantium quas harum facilis beatae ea at quibusdam pariatur mollitia molestiae.",
            draggable: false,
            selectable: true,
            hoverable: true,
            editable: true
          }
        ]
      },
    },
    view: {
      onRender() {
        const el = this.el as HTMLElement;
        try {
          ensureCardContainerCss();
        } catch (e) {
          console.warn("[GJS-PCF] cardContainer: ensure CSS in view failed", e);
        }
      },
      
      events: {
        dblclick: 'onDoubleClick'
      },
      
      onDoubleClick(e: Event) {
        e.preventDefault();
        e.stopPropagation();
        
        // Check if there's already an image in the container
        const model = this.model;
        const existingImage = model.find('.card-image')[0];
        
        if (!existingImage) {
          // No image exists, add one
          editor.runCommand('add-card-image');
        } else {
          // Check if the existing image is the default placeholder
          const imageSrc = (existingImage as any).get?.('attributes')?.src || '';
          const isDefaultPlaceholder = imageSrc.includes('via.placeholder.com') && imageSrc.includes('text=IMG');
          
          if (isDefaultPlaceholder) {
            // Allow user to select and edit the image properties
            editor.select(existingImage);
            // You can open the image editor or trait panel here if needed
          } else {
            editor.select(existingImage);
          }
        }
      }
    }
  });

  // Component Type: card-image (for the image inside the container)
  dc.addType("card-image", {
    extend: "image",
    isComponent: (el: HTMLElement) => el.classList?.contains("card-image"),
    model: {
      defaults: {
        tagName: "img",
        attributes: { class: "card-image" },
        draggable: false,
        removable: false, // Prevent removal of the component
        toolbar: [
          {
            attributes: { class: "fa fa-trash", title: "Clear Image" },
            command: "delete-card-image-only",
          },
        ],
        traits: [
          {
            type: "text",
            name: "src",
            label: "Image URL"
          },
          {
            type: "text",
            name: "alt",
            label: "Alt Text"
          }
        ]
      },
      
      // Override the remove method to clear image instead
      remove() {
        // Instead of removing, clear the image
        editor.runCommand('delete-card-image-only');
        return this;
      }
    }
  });

  // Add block to the block manager
  bm.add("card-container", {
label: `
      <div style="text-align:center;">
        <!-- Modified small-card icon: dot moved to the right side of the rectangle -->
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="1" y="4" width="22" height="16" rx="3" fill="#f3f4f6" stroke="#0a0a0aff "/>
          <circle cx="17.5" cy="9.5" r="3" fill="#0a0a0aff" stroke="#0a0a0aff"/>
          <rect x="3" y="7" width="8" height="2" rx="1" fill="#0a0a0aff"/>
          <rect x="3" y="11" width="7" height="1.5" rx="1" fill="#0a0a0aff"/>
        </svg>
        <div style="font-size:11px; margin-top:6px;">CardContainer</div>
      </div>
    `,
    category: {
      id: "components",
      label: "Components",
      open: true,
    },
    content: {
      type: "card-container",
    },
    attributes: { title: "Card Container" },
  });


}

export { containerWithImagePlugin };
