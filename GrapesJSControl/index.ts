import { IInputs, IOutputs } from "./generated/ManifestTypes";
import grapesjs from "grapesjs";
import type { Editor } from "grapesjs";
import grapesjsPresetWebpage from "grapesjs-preset-webpage";
import grapesjsPresetNewsletter from "grapesjs-preset-newsletter";
import "grapesjs-preset-newsletter";
import * as CodeMirror from "codemirror";
import { html as beautifyHtml, css as beautifyCss } from "js-beautify";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/hopscotch.css";
import "codemirror/mode/htmlmixed/htmlmixed";
import "codemirror/mode/css/css";

import { customMenuItemsPlugin } from "./Plugins/MenuItemsPlugins";
import accordionPlugin from "./Plugins/Accordian";
import pageTitleControlPlugin from "./Plugins/PageTitleControl";
import HeadingsPlugin from "./Plugins/HeadingsPlugins";
import advancedBulletMenuPlugin from "./Plugins/BulletMenuPlugin";
import customTablePlugin from "./Plugins/CustomTablePlugin";
import imageCollagePlugin from "./Plugins/ImageCollagePlugin";
import carouselPlugin from "./Plugins/Carousel";
import heroCarouselPlugin from "./Plugins/HeroCarouselPlugin";
import { customLayoutBlocksPlugin } from "./Plugins/LayoutBlocksPlugins";
import horizMenuPlugin from "./Plugins/HorizontalMenuPlugins";
import VideoPlugin from "./Plugins/VideoPlugin";
import breadcrumbPlugin from "./Plugins/BreadCrumbPlugins";
import containerWithImagePlugin from "./Plugins/ContainerWithImagePlugins";
import countdownPlugin from "./Plugins/CountdownPlugin";
import textboxPlugin from "./Plugins/textbox";
import AzureImagePlugin from "./Plugins/AzureImagePlugin";

export class GrapesJSControl
  implements ComponentFramework.StandardControl<IInputs, IOutputs>
{
  private _container!: HTMLDivElement;
  private _editor: any;
  private _notifyOutputChanged!: () => void;
  private _value: string = "";
  private _context!: ComponentFramework.Context<IInputs>;
  private _updateTimeout: any;

  constructor() {}

  public async init(
    context: ComponentFramework.Context<IInputs>,
    notifyOutputChanged: () => void,
    state: ComponentFramework.Dictionary,
    container: HTMLDivElement
  ) {
    this._context = context;
    this._notifyOutputChanged = notifyOutputChanged;
    this._value = context.parameters.htmlcontent.raw || "";

    if (!context.mode.isVisible) {
      container.hidden = true;
      return;
    }

    if (context.mode.isControlDisabled) {
      container.innerHTML = this._value;
      return;
    }

    this._container = document.createElement("div");
    this._container.id = "gjs-editor";
    Object.assign(this._container.style, {
      height: "700px",
      width: "100%",
      border: "1px solid #ccc",
      overflow: "hidden",
    });
    container.appendChild(this._container);

    // Helper to derive a stable per-record storage key (fallback to a default)
    const getRecordStorageId = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const id =
          params.get("id") ||
          params.get("recordId") ||
          params.get("EntityId") ||
          "";
        return `pcf-gjs-${id || "default"}`;
      } catch {
        return "pcf-gjs-default";
      }
    };

    this._editor = grapesjs.init({
      container: this._container,
      // Ensure style changes target the specific component (ID) rather than shared classes
      selectorManager: { componentFirst: true },
      // Favor inline styles for per-element isolation inside the editor
      avoidInlineStyle: false,
      plugins: [
        grapesjsPresetNewsletter,
        grapesjsPresetWebpage,
        customTablePlugin,
        advancedBulletMenuPlugin,
        customLayoutBlocksPlugin,
        customMenuItemsPlugin,
        accordionPlugin,
        HeadingsPlugin,
        pageTitleControlPlugin,
        imageCollagePlugin,
        carouselPlugin,
        heroCarouselPlugin,
        VideoPlugin,
        breadcrumbPlugin,
        horizMenuPlugin,
        containerWithImagePlugin,
        countdownPlugin,
        textboxPlugin,
        AzureImagePlugin,
      ],
      // color picker is appended to the editor container so it remains visible
      colorPicker: {
        appendTo: this._container,
      },
      pluginsOpts: {
        "gjs-preset-newsletter": {},
        "gjs-preset-webpage": {},
      },
      deviceManager: {
        devices: [
          { name: "Desktop", width: "" },
          { name: "Tablet", width: "770px" },
          { name: "Mobile", width: "320px" },
          { name: "Mobile portrait", width: "320px" },
        ],
      },
      canvas: {
        styles: [
          "https://www.cdph.ca.gov/Style%20Library/CDPH/css/bootstrap.min.css",
          "https://cdphsharepointstorage.blob.core.windows.net/assets/styles.css",
        ],
      },
      assetManager: {
        autoAdd: true,
        openAssetsOnDrop: false, // Disabled to prevent modal opening on invalid drops
        upload: false as const,
      },

      // Persist content locally so user changes survive refresh even if the host form isn't saved yet
      storageManager: {
        type: "local",
        id: getRecordStorageId(),
        autoload: false, // we'll decide when to load to avoid overwriting server content
        autosave: true,
      },
    });

    // Configure Style Manager to remove Typography sector for image components
    const originalGetSectors = this._editor.StyleManager.getSectors.bind(
      this._editor.StyleManager
    );
    this._editor.StyleManager.getSectors = function () {
      const sectors = originalGetSectors();
      const selected = this.em?.getSelected();

      if (selected && selected.get && selected.get("type") === "image") {
        // Filter out typography sector for images
        return sectors.filter((sector: any) => {
          const sectorName = sector.get ? sector.get("name") : "";
          const sectorId = sector.get ? sector.get("id") : "";
          return sectorName !== "Typography" && sectorId !== "typography";
        });
      }

      return sectors;
    };

    //--------------------------------------------------
    // BLOCK DRAG DISABE (ESD)
    //--------------------------------------------------
    const SECTION_DROP_RESTRICTION_ENABLED = true;
    if (SECTION_DROP_RESTRICTION_ENABLED) {
      let currentDraggedBlock: any = null;
      let dragCursorElement: HTMLDivElement | null = null;

      // Section component identifiers
      const SECTION_BLOCK_IDS = [
        "layout-col-1", // 1 Section
        "layout-col-2", // 1/2 Section
        "layout-col-3", // 1/3 Section
        "layout-col-2-3-7", // 3/7 Section
        "layout-col-2-7-3", // 7/3 Section
      ];

      const isSectionBlock = (blockId: string): boolean => {
        return SECTION_BLOCK_IDS.includes(blockId);
      };

      // Create cursor element for drag feedback
      const createDragCursor = (isBlocked: boolean) => {
        if (dragCursorElement) {
          dragCursorElement.remove();
        }

        dragCursorElement = document.createElement("div");
        dragCursorElement.style.cssText = `
        position: fixed;
        pointer-events: none;
        z-index: 10001;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 600;
        white-space: nowrap;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        transition: all 0.2s;
        ${
          isBlocked
            ? "background: #4b3939; color: #fff; border: 1px solid #5b4545;"
            : "background: rgba(40, 167, 69, 0.95); color: white;"
        }
      `;

        const icon = isBlocked
          ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>`
          : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>`;

        const text = isBlocked
          ? "Drop Section or use components inside sections"
          : "Drop here";

        dragCursorElement.innerHTML = `${icon}<span>${text}</span>`;
        document.body.appendChild(dragCursorElement);

        return dragCursorElement;
      };

      const updateDragCursor = (x: number, y: number) => {
        if (dragCursorElement) {
          dragCursorElement.style.left = `${x + 15}px`;
          dragCursorElement.style.top = `${y + 15}px`;
        }
      };

      const removeDragCursor = () => {
        if (dragCursorElement) {
          dragCursorElement.remove();
          dragCursorElement = null;
        }
      };

      // Listen to block drag start
      this._editor.on("block:drag:start", (block: any) => {
        currentDraggedBlock = block;
      });

      // Listen to block drag stop
      this._editor.on("block:drag:stop", () => {
        currentDraggedBlock = null;
        removeDragCursor();
      });

      // Monitor mouse movement during drag
      document.addEventListener("mousemove", (e: MouseEvent) => {
        if (!currentDraggedBlock) {
          removeDragCursor();
          return;
        }

        try {
          const blockId =
            currentDraggedBlock.get && currentDraggedBlock.get("id");
          const isSection = isSectionBlock(blockId);

          // Check if mouse is over the canvas body/wrapper area
          const canvasFrame = this._editor.Canvas.getFrameEl();
          if (canvasFrame) {
            const frameRect = canvasFrame.getBoundingClientRect();
            const isOverCanvas =
              e.clientX >= frameRect.left &&
              e.clientX <= frameRect.right &&
              e.clientY >= frameRect.top &&
              e.clientY <= frameRect.bottom;

            if (isOverCanvas) {
              // Check if hovering over body/wrapper by checking target element
              const frameDoc = this._editor.Canvas.getDocument();
              if (frameDoc) {
                const elementUnderCursor = frameDoc.elementFromPoint(
                  e.clientX - frameRect.left,
                  e.clientY - frameRect.top
                );

                // Check if we're hovering over body or wrapper-level elements
                const isOverBody =
                  elementUnderCursor?.tagName === "BODY" ||
                  elementUnderCursor?.getAttribute("data-gjs-type") ===
                    "wrapper" ||
                  elementUnderCursor?.closest('[data-gjs-type="wrapper"]') ===
                    null;

                if (isOverBody && !isSection) {
                  // Show blocked cursor
                  if (
                    !dragCursorElement ||
                    !dragCursorElement.textContent?.includes("Section")
                  ) {
                    createDragCursor(true);
                  }
                  updateDragCursor(e.clientX, e.clientY);
                } else {
                  removeDragCursor();
                }
              }
            } else {
              removeDragCursor();
            }
          }
        } catch (err) {
          // Ignore errors
        }
      });
    }

    //--------------------------------------------------

    // Prefer locally saved content if present; otherwise, allow updateView to apply server content
    try {
      const storageKey = `gjs-${getRecordStorageId()}`;
      const hasLocal = !!window.localStorage.getItem(storageKey);
      if (hasLocal) {
        // Load from local storage and mark as loaded to prevent server overwrite
        this._editor.load();
        this._isContentLoaded = true;
      }
    } catch {
      // ignore storage access issues (e.g., disabled storage)
    }

    const normalizeUrl = (url: string): string => {
      if (!url || typeof url !== "string") return "";
      const trimmed = url.trim();
      if (/^https?:\/\//i.test(trimmed)) return trimmed;
      if (/^www\./i.test(trimmed)) return `https://${trimmed}`;
      if (trimmed.includes(".") && !trimmed.includes(" "))
        return `https://${trimmed}`;
      return trimmed;
    };

    // Shared modal for editing any anchor element inside canvas
    const showEditLinkModal = (linkEl: HTMLAnchorElement, component?: any) => {
      const wrapper = document.createElement("div");
      const currentHref = linkEl.getAttribute("href") || "";
      wrapper.innerHTML = `
        <div style="padding:10px;">
          <label style="display:block; font-weight:600; margin-bottom:6px;">Edit Link (href)</label>
          <input id="edit-link-input" type="text" placeholder="#" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;" value="${currentHref}">
          <div style="margin-top:12px; text-align:right; display:flex; gap:8px; justify-content:space-between;">
            <button id="edit-link-clear" class="gjs-btn" style="background:#dc3545; color:white; ${
              currentHref ? "" : "display:none;"
            }">Clear Link</button>
            <div style="display:flex; gap:8px;">
              <button id="edit-link-cancel" class="gjs-btn">Cancel</button>
              <button id="edit-link-save" class="gjs-btn-prim">Save</button>
            </div>
          </div>
        </div>
      `;
      this._editor.Modal.setTitle("Edit Link");
      this._editor.Modal.setContent(wrapper);
      this._editor.Modal.open();

      // Prevent closing the modal by clicking on the overlay/background.
      // Only the modal's close button (provided by GrapesJS) and the
      // Cancel/Clear buttons inside the modal should close it.
      try {
        const mdlContainer = document.querySelector(
          ".gjs-mdl-container"
        ) as HTMLElement | null;

        if (mdlContainer) {
          const overlayClickHandler = (ev: MouseEvent) => {
            // If the click target is the container itself (the overlay),
            // stop it so GrapesJS won't close the modal.
            if (ev.target === mdlContainer) {
              ev.stopPropagation();
              ev.preventDefault();
              // Optionally, re-focus the first input so keyboard works
              const input =
                wrapper.querySelector<HTMLInputElement>("#edit-link-input");
              if (input) input.focus();
            }
          };

          // Use capture to intercept early
          mdlContainer.addEventListener("click", overlayClickHandler, true);

          // Remove the handler when the modal closes to avoid leaks or duplicate handlers
          try {
            this._editor.on("modal:close", () => {
              try {
                mdlContainer.removeEventListener(
                  "click",
                  overlayClickHandler,
                  true
                );
              } catch (_) {
                /* ignore */
              }
            });
          } catch (_) {
            /* ignore */
          }
        }
      } catch (_) {
        /* ignore overlay protection errors */
      }

      const saveBtn =
        wrapper.querySelector<HTMLButtonElement>("#edit-link-save");
      const cancelBtn =
        wrapper.querySelector<HTMLButtonElement>("#edit-link-cancel");
      const clearBtn =
        wrapper.querySelector<HTMLButtonElement>("#edit-link-clear");
      const inputEl =
        wrapper.querySelector<HTMLInputElement>("#edit-link-input");

      const close = () => this._editor.Modal.close();
      cancelBtn && cancelBtn.addEventListener("click", close);

      // Clear Link button handler
      clearBtn &&
        clearBtn.addEventListener("click", () => {
          try {
            // Remove href attribute from DOM element
            linkEl.removeAttribute("href");
            linkEl.removeAttribute("target");
            linkEl.removeAttribute("rel");
            linkEl.style.color = "";
            linkEl.style.textDecoration = "";
            linkEl.style.cursor = "default";
          } catch (_) {
            /* ignore */
          }

          // Try to update the component model. Table plugin creates non-selectable
          // anchor components inside a TD, so the currently selected component
          // may be the TD (not the <a>). Prefer mapping the DOM anchor to the
          // component using data-gjs-id, and if a component was provided but
          // is not an anchor, search its children for an 'a' component.
          let cmp = component;
          try {
            // Prefer mapping DOM anchor -> component if data-gjs-id present
            const gjsId =
              linkEl.getAttribute && linkEl.getAttribute("data-gjs-id");
            if (gjsId) {
              try {
                const found = this._editor
                  .getWrapper()
                  .find(`[data-gjs-id="${gjsId}"]`);
                if (found && found.length) cmp = found[0];
              } catch (_) {
                /* ignore */
              }
            }

            // If we still have a component but it's not the anchor itself,
            // try to find an anchor component inside it (common for table cells)
            if (
              cmp &&
              cmp.get &&
              (cmp.get("tagName") || "").toLowerCase() !== "a" &&
              cmp.find
            ) {
              try {
                const innerA = cmp.find && cmp.find("a");
                if (innerA && innerA.length) cmp = innerA[0];
              } catch (_) {
                /* ignore */
              }
            }
          } catch (_) {
            /* ignore */
          }

          if (cmp) {
            try {
              // Remove href/target/rel from the component's attributes
              const attrs = (cmp.getAttributes && cmp.getAttributes()) || {};
              delete attrs.href;
              delete attrs.target;
              delete attrs.rel;
              cmp.setAttributes && cmp.setAttributes(attrs);

              // If the anchor component is a simple wrapper with only text,
              // we prefer to unwrap it (replace with plain text node) so the
              // table cell no longer contains an <a>. This mirrors image
              // unlink behavior where the image is moved out of the anchor.
              try {
                const tag = (
                  (cmp.get && cmp.get("tagName")) ||
                  ""
                ).toLowerCase();
                if (tag === "a") {
                  const parent = cmp.parent && cmp.parent();
                  // If anchor has no meaningful children except text, replace with text
                  const children = cmp.components && cmp.components();
                  const onlyTextChild =
                    !children ||
                    children.length === 0 ||
                    (children.length === 1 &&
                      children[0].isText &&
                      children[0].isText());
                  if (parent && onlyTextChild) {
                    try {
                      // Capture text content
                      const text =
                        (cmp.get && (cmp.get("content") || "")) || "";
                      // Remove the anchor component and insert plain text component
                      const atIndex = cmp.index && cmp.index();
                      cmp.remove && cmp.remove();
                      parent.components &&
                        parent.components().add(
                          {
                            type: "text",
                            content: text,
                            editable: true,
                          },
                          typeof atIndex === "number" ? { at: atIndex } : {}
                        );
                    } catch (_) {
                      /* ignore unwrap failure */
                    }
                  }
                }
              } catch (_) {
                /* ignore */
              }

              cmp.view && cmp.view.render && cmp.view.render();
            } catch (_) {
              /* ignore */
            }
          } else {
            this._editor.trigger("component:update");
          }

          close();
        });

      if (saveBtn && inputEl) {
        saveBtn.addEventListener("click", () => {
          let url = (inputEl.value || "").trim();
          if (!url) {
            close();
            return;
          }
          url = normalizeUrl(url);
          try {
            linkEl.setAttribute("href", url);
            linkEl.style.color = "#007bff";
            linkEl.setAttribute("target", "_blank");
            linkEl.setAttribute("rel", "noopener noreferrer");
          } catch (_) {
            /* ignore */
          }

          // Try map DOM <a> back to component via data-gjs-id
          let cmp = component;
          if (!cmp) {
            const gjsId = linkEl.getAttribute("data-gjs-id");
            if (gjsId) {
              try {
                // Find by selector using internal data attribute
                const found = this._editor
                  .getWrapper()
                  .find(`[data-gjs-id="${gjsId}"]`);
                if (found && found.length) cmp = found[0];
              } catch (_) {
                /* ignore */
              }
            }
          }

          if (cmp) {
            try {
              // Ensure href attribute updated on the component so export reflects change
              const attrs = (cmp.getAttributes && cmp.getAttributes()) || {};
              cmp.addAttributes && cmp.addAttributes({ ...attrs, href: url });
              // Some link components keep content as child text; ensure re-render
              cmp.view && cmp.view.render && cmp.view.render();
            } catch (_) {
              /* ignore */
            }
          } else {
            // Fallback: trigger update event so editor captures raw HTML change
            this._editor.trigger("component:update");
          }

          close();
        });
      }
    };

    // Shared modal for editing an IMG inside the carousel only
    // NOTE: Default built-in image editor intentionally removed. AzureImagePlugin
    // or the Asset Manager should provide image editing/upload flows. This
    // function is a no-op to ensure the default modal never appears.
    const showEditImageModal = (_imgEl: HTMLImageElement, _component?: any) => {
      // Intentionally empty — default image modal removed.
      return;
    };

    // Attach delegated click listener inside canvas iframe to intercept anchor clicks globally
    this._editor.on("load", () => {
      const frameEl = this._editor.Canvas.getFrameEl();
      const frameDoc =
        frameEl?.contentDocument || frameEl?.contentWindow?.document;
      if (!frameDoc) return;

      // Avoid multiple bindings
      if ((frameDoc as any).__globalLinkEditBound) return;
      (frameDoc as any).__globalLinkEditBound = true;

      frameDoc.addEventListener(
        "click",
        (e: MouseEvent) => {
          const target = e.target as HTMLElement | null;
          if (!target) return;
          // Treat clicks on <a> or inside an <a>
          const anchorEl =
            (target.tagName === "A" ? (target as HTMLAnchorElement) : null) ||
            (target.closest &&
              (target.closest("a") as HTMLAnchorElement | null));
          if (anchorEl) {
            const anchor = anchorEl as HTMLAnchorElement;
            // If this anchor wraps an image, allow navigation behavior (no edit modal)
            const isImageAnchor =
              target.tagName === "IMG" || !!anchor.querySelector("img");
            // If this anchor is used as a button-like element inside editor, ignore link editing/modal
            if (
              anchor.getAttribute("data-role") === "button-link" ||
              anchor.closest('[data-role="button-link"]')
            ) {
              // prevent navigation but don't open modal
              e.preventDefault();
              return;
            }
            // If inside horizontal menu (.pcf-hmenu), do not open link edit modal here
            // We have a dedicated "Edit link" toolbar action for horizmenu items
            const insideHmenu = anchor.closest(".pcf-hmenu");
            if (insideHmenu) {
              // prevent navigation in the canvas, but skip opening the modal
              e.preventDefault();
              return;
            }
            // If anchor contains an image, let it navigate (do not intercept with edit modal)
            if (isImageAnchor) {
              return; // Let bubble handler open the link in new tab
            }
            // For non-image anchors: keep edit modal behavior
            // If this anchor is inside our custom menu container, use the plugin's
            // dedicated set-menu-link command which properly persists to the model.
            // The global showEditLinkModal doesn't work for menu items because
            // component lookup fails for dynamically created menu anchors.
            const insideCustomMenu =
              anchor.closest && anchor.closest(".custom-menu-container");
            if (insideCustomMenu) {
              // Only open the link modal when:
              // 1. The container is in edit mode (has .editing class)
              // 2. The toggle is enabled (data-allow-link-edit is not 'false')
              const isInEditMode =
                insideCustomMenu.classList &&
                insideCustomMenu.classList.contains("editing");
              const toggleEnabled =
                insideCustomMenu.getAttribute("data-allow-link-edit") !==
                "false";
              if (!isInEditMode || !toggleEnabled) {
                // Not in edit mode or toggle disabled - do not open link modal; just prevent navigation
                e.preventDefault();
                return;
              }
              // Let the menu plugin's set-menu-link command handle this
              e.preventDefault();
              setTimeout(() => {
                const selected = this._editor.getSelected();
                if (selected) {
                  // Find the anchor component model
                  let anchorComp = selected;
                  const tag = (
                    selected.get && selected.get("tagName")
                  )?.toLowerCase?.();
                  if (tag !== "a" && selected.find) {
                    const found = selected.find("a");
                    if (found && found[0]) anchorComp = found[0];
                  }
                  // Select the anchor and run the menu plugin command
                  this._editor.setSelected &&
                    this._editor.setSelected(anchorComp);
                  this._editor.runCommand &&
                    this._editor.runCommand("set-menu-link");
                }
              }, 0);
              return;
            }
            // Allow Ctrl/Meta + click to open in new tab
            if (e.ctrlKey || e.metaKey) {
              return; // let later handler process
            }
            e.preventDefault();
            setTimeout(() => {
              const selected = this._editor.getSelected();
              showEditLinkModal(anchor, selected);
            }, 0);
            return;
          }

          // Intercept carousel & hero carousel image interactions:
          // 1. Direct click on IMG inside any .pcf-carousel or .pcf-hero-carousel
          // 2. Click on hero overlay area (excluding the textual .pcf-hero-content) -> treat as editing the underlying IMG
          const carouselRoot =
            target.closest &&
            (target.closest(".pcf-carousel") ||
              target.closest(".pcf-hero-carousel"));
          if (carouselRoot) {
            // Resolve image element based on click context
            let img: HTMLImageElement | null = null;
            if (target.tagName === "IMG") {
              img = target as HTMLImageElement;
            } else if (
              // Click somewhere within hero overlay but not inside hero content block
              (target.classList.contains("pcf-hero-overlay") ||
                target.closest(".pcf-hero-overlay")) &&
              !target.closest(".pcf-hero-content")
            ) {
              const slide = target.closest(".pcf-slide");
              img = (slide &&
                slide.querySelector("img")) as HTMLImageElement | null;
            }
            if (img) {
              // For carousel images, prefer opening the Azure image explorer/modal
              // Map the clicked IMG back to its GrapesJS component (if possible)
              try {
                // Try to find corresponding component by data-gjs-id or by matching the DOM element
                let cmp: any =
                  this._editor.getSelected && this._editor.getSelected();
                try {
                  const gjsId =
                    img.getAttribute && img.getAttribute("data-gjs-id");
                  if (!cmp && gjsId) {
                    const found = this._editor
                      .getWrapper()
                      .find(`[data-gjs-id="${gjsId}"]`);
                    if (found && found.length) cmp = found[0];
                  }
                } catch (_) {
                  /* ignore */
                }

                try {
                  if (!cmp && img.id) {
                    const foundById = this._editor
                      .getWrapper()
                      .find(`#${img.id}`);
                    if (foundById && foundById.length) cmp = foundById[0];
                  }
                } catch (_) {
                  /* ignore */
                }

                // If ctrl/meta pressed, allow default behavior
                if (e.ctrlKey || e.metaKey) return;

                e.preventDefault();
                setTimeout(() => {
                  try {
                    if (cmp && this._editor.setSelected) {
                      this._editor.setSelected(cmp);
                    }
                  } catch (_) {
                    /* ignore */
                  }

                  try {
                    // Run the Azure image open command if available
                    this._editor.runCommand &&
                      this._editor.runCommand("azure-image:open");
                  } catch (_) {
                    // Fallback: open default image modal
                    try {
                      const selected = this._editor.getSelected();
                      showEditImageModal(img!, selected || undefined);
                    } catch (_) {
                      /* ignore */
                    }
                  }
                }, 0);
              } catch (_) {
                /* ignore */
              }
              return;
            }
          }
        },
        true
      );

      // Double-click handler: open edit mode for button-like anchors and images
      try {
        frameDoc.addEventListener(
          "dblclick",
          (ev: MouseEvent) => {
            const tgt = ev.target as HTMLElement | null;
            if (!tgt) return;

            // Handle double-click on images (for list items, carousels, etc.)
            if (tgt.tagName === "IMG") {
              const img = tgt as HTMLImageElement;

              // Check if this image is inside a carousel (handled separately)
              const isCarouselImage =
                img.closest(".pcf-carousel") ||
                img.closest(".pcf-hero-carousel");

              if (!isCarouselImage) {
                // For non-carousel images (like list item images), open the image edit modal
                // But skip for Azure placeholder images so the Azure plugin can open its explorer
                try {
                  if (
                    img.hasAttribute &&
                    img.hasAttribute("data-azure-placeholder")
                  )
                    return;
                } catch (_) {
                  /*no-op*/
                }

                ev.preventDefault();
                ev.stopPropagation();

                setTimeout(() => {
                  try {
                    // Map the clicked DOM IMG back to its GrapesJS component and select it
                    let cmp: any =
                      this._editor.getSelected && this._editor.getSelected();

                    // If currently selected isn't the clicked image, try to locate by data-gjs-id
                    try {
                      if (
                        !(
                          cmp &&
                          cmp.is &&
                          cmp.is("image") &&
                          cmp.getEl &&
                          cmp.getEl() === img
                        )
                      ) {
                        const gjsId =
                          img.getAttribute && img.getAttribute("data-gjs-id");
                        if (gjsId) {
                          const found = this._editor
                            .getWrapper()
                            .find(`[data-gjs-id="${gjsId}"]`);
                          if (found && found.length) cmp = found[0];
                        }
                      }
                    } catch (_) {
                      /* ignore mapping errors */
                    }

                    // Fallback: search image components and compare underlying element
                    if (!cmp) {
                      try {
                        const imgs = this._editor
                          .getWrapper()
                          .find('[data-gjs-type="image"]');
                        for (let i = 0; i < imgs.length; i++) {
                          const c = imgs[i];
                          try {
                            const el = c.getEl && c.getEl();
                            if (el === img) {
                              cmp = c;
                              break;
                            }
                          } catch (_) {
                            /* ignore */
                          }
                        }
                      } catch (_) {
                        /* ignore */
                      }
                    }

                    if (cmp && this._editor.setSelected) {
                      try {
                        this._editor.setSelected(cmp);
                      } catch (_) {
                        /* ignore */
                      }
                    }

                    // Trigger the Azure image explorer via the plugin command so it handles
                    // updating the selected image component. This replaces the old default
                    // image modal behavior and ensures Azure handles all image edits.
                    try {
                      this._editor.runCommand &&
                        this._editor.runCommand("azure-image:open");
                    } catch (e) {
                      console.error(
                        "Failed to run azure-image:open command",
                        e
                      );
                    }
                  } catch (e) {
                    console.error(
                      "Error opening Azure explorer on image dblclick",
                      e
                    );
                  }
                }, 0);
                return;
              }
              // Carousel images are already handled by the single-click handler above
              return;
            }

            const anchor =
              (tgt.tagName === "A" ? (tgt as HTMLAnchorElement) : null) ||
              (tgt.closest && (tgt.closest("a") as HTMLAnchorElement | null));
            if (!anchor) return;
            // Only handle anchor buttons (data-role="button-link")
            if (
              anchor.getAttribute("data-role") !== "button-link" &&
              !anchor.closest('[data-role="button-link"]')
            )
              return;
            // Prevent default navigation in iframe
            ev.preventDefault();
            ev.stopPropagation();
            // Map DOM anchor back to component model
            try {
              // Prefer selected component if it matches
              let cmp = this._editor.getSelected();
              if (!cmp) {
                const gjsId = anchor.getAttribute("data-gjs-id");
                if (gjsId) {
                  const found = this._editor
                    .getWrapper()
                    .find(`[data-gjs-id="${gjsId}"]`);
                  if (found && found.length) cmp = found[0];
                }
              }
              // If not found, try to locate by matching DOM element
              if (!cmp) {
                const wrapper = this._editor.getWrapper();
                const allLinks = wrapper.find("a");
                for (let i = 0; i < allLinks.length; i++) {
                  const c = allLinks[i];
                  try {
                    if (c.getEl && c.getEl() === anchor) {
                      cmp = c;
                      break;
                    }
                  } catch (_) {
                    /* ignore */
                  }
                }
              }
              if (cmp) {
                // If the component has a child text component, prefer selecting it so
                // GrapesJS enters inline text editing. Otherwise select the anchor itself.
                try {
                  let targetForEdit = cmp;
                  // Search for a descendant component of type 'text' or with tagName 'span' or 'p'
                  const children =
                    (cmp.find && cmp.find('[data-gjs-type="text"]')) || [];
                  if (!children || !children.length) {
                    // fallback: look for components with type 'text'
                    const tChildren =
                      (cmp.find && cmp.find('[data-gjs-type="text"]')) || [];
                    if (tChildren && tChildren.length)
                      children.push(...tChildren);
                  }
                  if (children && children.length) {
                    targetForEdit = children[0];
                  } else {
                    // Last resort: search children by type 'text'
                    try {
                      const foundText = cmp.find(
                        (c: any) => c && c.get && c.get("type") === "text"
                      );
                      if (foundText && foundText.length)
                        targetForEdit = foundText[0];
                    } catch (_) {
                      /* ignore */
                    }
                  }

                  // Select the component to edit
                  this._editor.select && this._editor.select(targetForEdit);

                  // Try to enable inline DOM editing inside the iframe for text components
                  setTimeout(() => {
                    try {
                      const el =
                        targetForEdit &&
                        targetForEdit.getEl &&
                        targetForEdit.getEl();
                      // If we have a DOM element inside the iframe, make it editable and select contents
                      if (el && el.ownerDocument) {
                        try {
                          // Ensure the element is marked editable
                          el.setAttribute("contenteditable", "true");
                          // Focus the element (use ownerDocument.defaultView)
                          const win = el.ownerDocument
                            .defaultView as Window | null;
                          if (
                            win &&
                            typeof (el as HTMLElement).focus === "function"
                          ) {
                            (el as HTMLElement).focus();
                          }

                          // Select all contents inside the element
                          try {
                            const range = el.ownerDocument.createRange();
                            range.selectNodeContents(el);
                            const sel =
                              el.ownerDocument.getSelection &&
                              el.ownerDocument.getSelection();
                            sel && sel.removeAllRanges();
                            sel && sel.addRange(range);
                          } catch (selErr) {
                            // ignore selection errors
                          }

                          // On blur, persist content back to the model and disable editing
                          const blurHandler = () => {
                            try {
                              el.setAttribute("contenteditable", "false");
                              // Update component content
                              targetForEdit.set &&
                                targetForEdit.set("content", el.innerHTML);
                            } catch (_) {
                              /* ignore */
                            } finally {
                              try {
                                el.removeEventListener("blur", blurHandler);
                              } catch (_ /* ignore selection errors */) {
                                // noop
                              }
                            }
                          };

                          el.addEventListener("blur", blurHandler);
                          return;
                        } catch (domErr) {
                          // fall through to command fallback
                        }
                      }

                      // Fallback: use GrapesJS editor command to open editor
                      this._editor.runCommand &&
                        this._editor.runCommand("core:component-edit", {
                          component: targetForEdit,
                        });
                    } catch (_) {
                      /* ignore */
                    }
                  }, 10);
                } catch (_) {
                  // fallback behaviour: select and edit the original component
                  this._editor.select && this._editor.select(cmp);
                  setTimeout(() => {
                    try {
                      this._editor.runCommand &&
                        this._editor.runCommand("core:component-edit", {
                          component: cmp,
                        });
                    } catch (_) {
                      /* ignore */
                    }
                  }, 10);
                }
              }
            } catch (_) {
              /* ignore */
            }
          },
          true
        );
      } catch (_) {
        /* ignore */
      }
    });

    // Helper to ensure component gets a unique id so Style Manager targets it specifically
    const ensureUniqueComponentId = (cmp: any) => {
      try {
        if (!cmp || !cmp.get) return;
        // Skip wrapper/body
        const type = cmp.get("type");
        if (type === "wrapper") return;
        const attrs = (cmp.getAttributes && cmp.getAttributes()) || {};
        if (!attrs.id) {
          const uid = `gjsc-${Date.now().toString(36)}-${Math.random()
            .toString(36)
            .slice(2, 7)}`;
          cmp.addAttributes && cmp.addAttributes({ id: uid });
        }
      } catch (_) {
        /* ignore */
      }
    };

    //--------------------------------------------------
    // SECTION-ONLY BODY DROP RESTRICTION
    //--------------------------------------------------
    if (SECTION_DROP_RESTRICTION_ENABLED) {
      // Define section component names (these can be dropped into body)
      const SECTION_COMPONENTS = [
        "layout-col-1", // 1 Section
        "layout-col-2", // 1/2 Section
        "layout-col-3", // 1/3 Section
        "layout-col-2-3-7", // 3/7 Section
        "layout-col-2-7-3", // 7/3 Section
      ];

      // Helper to check if a component is a section
      const isSectionComponent = (cmp: any): boolean => {
        if (!cmp) return false;
        try {
          // Check by custom name attribute
          const customName =
            cmp.get && cmp.get("attributes")?.["data-gjs-custom-name"];
          if (customName) {
            const nameStr = String(customName);
            // Match section row patterns
            if (nameStr.includes("-row")) {
              return true;
            }
          }

          // Check by classes - look for our layout classes
          const classes = cmp.get && cmp.get("classes");
          if (classes && classes.models) {
            const classNames = classes.models
              .map((c: any) => c.get("name"))
              .join(" ");
            // Check if it has responsive-row class (added to all sections) or specific layout classes
            if (classNames.includes("responsive-row")) {
              return true;
            }
            // Also check for specific section class patterns
            for (const sectionName of SECTION_COMPONENTS) {
              if (classNames.includes(`row-${sectionName}`)) {
                return true;
              }
            }
          }

          return false;
        } catch (e) {
          console.error("Error checking if component is section:", e);
          return false;
        }
      };

      // Helper to check if parent is body/wrapper
      const isBodyOrWrapper = (parent: any): boolean => {
        if (!parent) return false;
        try {
          const type = parent.get && parent.get("type");
          const tagName = parent.get && parent.get("tagName");
          return type === "wrapper" || tagName === "body";
        } catch (e) {
          return false;
        }
      };

      // Create notification element for visual feedback
      let dropNotification: HTMLDivElement | null = null;
      let lastBlockedDropTime = 0; // Track when we last blocked a drop

      const showDropNotification = (message: string) => {
        // Remove existing notification if any
        if (dropNotification && dropNotification.parentNode) {
          dropNotification.parentNode.removeChild(dropNotification);
        }

        dropNotification = document.createElement("div");
        dropNotification.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #4b3939; /* match existing modal/dropdown brown */
        color: #ffffff;
        padding: 20px 30px;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        z-index: 10000;
        box-shadow: 0 6px 20px rgba(0,0,0,0.35);
        border: 1px solid #5b4545;
        display: flex;
        align-items: center;
        gap: 12px;
      `;

        dropNotification.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
        <span>${message}</span>
      `;

        document.body.appendChild(dropNotification);

        // Auto-remove after 2.5 seconds
        setTimeout(() => {
          if (dropNotification && dropNotification.parentNode) {
            dropNotification.style.opacity = "0";
            dropNotification.style.transition = "opacity 0.3s";
            setTimeout(() => {
              if (dropNotification && dropNotification.parentNode) {
                dropNotification.parentNode.removeChild(dropNotification);
              }
            }, 300);
          }
        }, 2500);
      };

      // Assign unique id as the user adds/selects components so Style Manager targets only that element
      // AND enforce section-only body drop restriction
      this._editor.on("component:add", (cmp: any) => {
        // First, ensure unique ID
        ensureUniqueComponentId(cmp);

        // Then check section restriction
        try {
          const parent = cmp.parent && cmp.parent();

          // Check if component is being added directly to body/wrapper
          if (isBodyOrWrapper(parent)) {
            // Check if it's a section component
            if (!isSectionComponent(cmp)) {
              // This is not a section - remove it and show notification
              console.log("Blocking non-section drop to body:", cmp);

              // Set flag to prevent modals from opening
              lastBlockedDropTime = Date.now();

              // Close any open modals immediately
              setTimeout(() => {
                try {
                  this._editor.Modal &&
                    this._editor.Modal.close &&
                    this._editor.Modal.close();
                } catch (e) {
                  // Ignore
                }
              }, 1);

              setTimeout(() => {
                try {
                  cmp.remove && cmp.remove();
                  showDropNotification(
                    "⛔ Please drop a Section component or drop components inside a section"
                  );
                } catch (e) {
                  console.error("Error removing non-section component:", e);
                }
              }, 10);
            } else {
              console.log("Allowing section drop to body:", cmp);
            }
          }
        } catch (e) {
          console.error("Error in component:add section check:", e);
        }
      });

      this._editor.on("component:selected", (cmp: any) =>
        ensureUniqueComponentId(cmp)
      );
      this._editor.on("component:clone", (cmp: any) =>
        ensureUniqueComponentId(cmp)
      );

      // Prevent asset manager modal from opening after a blocked drop
      this._editor.on("asset:add", () => {
        // If we just blocked a drop within the last 500ms, close the asset manager
        if (Date.now() - lastBlockedDropTime < 500) {
          setTimeout(() => {
            try {
              this._editor.Modal &&
                this._editor.Modal.close &&
                this._editor.Modal.close();
            } catch (e) {
              // Ignore
            }
          }, 1);
        }
      });

      // Also monitor modal open events
      this._editor.on("modal:open", () => {
        // If we just blocked a drop within the last 500ms, close the modal immediately
        if (Date.now() - lastBlockedDropTime < 500) {
          setTimeout(() => {
            try {
              this._editor.Modal &&
                this._editor.Modal.close &&
                this._editor.Modal.close();
            } catch (e) {
              // Ignore
            }
          }, 1);
        }
      });

      // Add custom CSS to canvas for blocked cursor during invalid drags
      this._editor.on("load", () => {
        try {
          const frameDoc = this._editor.Canvas.getDocument();
          if (frameDoc) {
            const style = frameDoc.createElement("style");
            style.id = "section-drop-restriction-styles";
            style.textContent = `
            .gjs-dashed.blocked-drop {
              border: 2px dashed #5b4545 !important;
              background: rgba(75, 57, 57, 0.08) !important;
            }
            .gjs-dashed.blocked-drop::after {
              content: '⛔ Section Only';
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              background: #4b3939;
              color: #fff;
              padding: 8px 16px;
              border-radius: 4px;
              font-size: 14px;
              font-weight: 600;
              pointer-events: none;
              white-space: nowrap;
              z-index: 1000;
            }
          `;
            frameDoc.head.appendChild(style);
          }
        } catch (e) {
          console.error("Error adding drop restriction styles:", e);
        }
      });
    }

    //--------------------------------------------------
    // Let GrapeJS handle toolbar positioning naturally - no custom positioning
    //---------------------------------
    // Toolbar pruning: keep toolbar only on outer carousel wrapper, remove from inner elements
    const ALLOWED_CAROUSEL_COMMANDS = [
      "add-slide",
      "remove-slide",
      "set-interval",
    ];
    this._editor.BlockManager.remove("sect100"); // 1 Section
    this._editor.BlockManager.remove("sect50"); // 1/2 Section
    this._editor.BlockManager.remove("sect30"); // 1/3 Section
    this._editor.BlockManager.remove("sect37"); // 3/7 Section
    this._editor.BlockManager.remove("divider"); // Divider
    this._editor.BlockManager.remove("link-block"); // Link Block
    this._editor.BlockManager.remove("grid-items"); // Grid Items
    this._editor.BlockManager.remove("list-items"); // List Items
    this._editor.BlockManager.remove("text-sect"); // Text Section
    // Remove default button block to keep only our custom blue button
    this._editor.BlockManager.remove("button"); // Default Button
    // Remove GrapesJS default image block so AzureImagePlugin provides the image block/icon
    try {
      this._editor.BlockManager.remove("image");
    } catch (e) {
      // non-fatal if block not present
      // console.warn('Could not remove default image block', e);
    }

    const bm = this._editor.BlockManager;
    ["quote", "text-sect", "link", "text-basic"].forEach((blockId) => {
      const block = bm.get(blockId);
      if (block) {
        block.set({
          category: {
            id: "basic",
            label: "Basic",
            open: true,
          },
        });
      }
    });

    this._editor.setDevice({ name: "Desktop", width: "" });

    // Remove typography traits from image components in Style Manager
    const hideTypographyForImages = () => {
      const selected = this._editor.getSelected();
      const isImage =
        selected && selected.get && selected.get("type") === "image";

      // Multiple attempts to find and hide typography sector
      const hideTypography = () => {
        // Method 1: Try all possible selectors for typography sector
        const selectors = [
          ".gjs-sm-sector.gjs-sm-sector__typography",
          '.gjs-sm-sector[id*="typography"]',
          '.gjs-sm-sector[id*="Typography"]',
          '[data-sector-id="typography"]',
          '[data-gjs-type="typography"]',
        ];

        let found = false;
        selectors.forEach((selector) => {
          const elements = document.querySelectorAll(selector);
          elements.forEach((el) => {
            const htmlEl = el as HTMLElement;
            // Check if this sector contains typography-related properties
            const sectorTitle = htmlEl.querySelector(".gjs-sm-sector-title");
            if (
              sectorTitle &&
              sectorTitle.textContent?.toLowerCase().includes("typography")
            ) {
              if (isImage) {
                htmlEl.style.display = "none";
              } else {
                htmlEl.style.display = "";
              }
              found = true;
            }
          });
        });

        // Method 2: Look through all sectors and check their titles
        const allSectors = document.querySelectorAll(".gjs-sm-sector");
        allSectors.forEach((sector) => {
          const titleEl = sector.querySelector(".gjs-sm-sector-title");
          if (titleEl) {
            const title = titleEl.textContent?.trim().toLowerCase() || "";
            if (title === "typography" || title.includes("typography")) {
              if (isImage) {
                (sector as HTMLElement).style.display = "none";
              } else {
                (sector as HTMLElement).style.display = "";
              }
              found = true;
            }
          }
        });

        return found;
      };

      // Try immediately
      hideTypography();

      // Try again after delays to catch late rendering
      setTimeout(hideTypography, 10);
      setTimeout(hideTypography, 50);
      setTimeout(hideTypography, 100);
      setTimeout(hideTypography, 200);
    };

    // Hide Typography and Dimensions sectors for inner section/layout columns, accordion container, and bullet list wrapper
    const hideSectorsForInnerColumns = () => {
      const selected = this._editor.getSelected();

      // Check if the selected component is an inner column, accordion container, or bullet list wrapper by type
      const isRestrictedComponent =
        selected &&
        selected.get &&
        (selected.get("type") === "section-inner-column" ||
          selected.get("type") === "layout-inner-column" ||
          selected.get("type") === "bs-accordion" ||
          selected.get("type") === "advanced-bullet-list-wrapper");

      // Function to hide/show sectors
      const toggleSectors = () => {
        // Hide Typography and Dimensions sectors
        const allSectors = document.querySelectorAll(".gjs-sm-sector");
        allSectors.forEach((sector) => {
          const titleEl = sector.querySelector(".gjs-sm-sector-title");
          if (titleEl) {
            const title = titleEl.textContent?.trim().toLowerCase() || "";
            // Hide Typography and Dimension sectors for restricted components
            if (
              title === "typography" ||
              title.includes("typography") ||
              title === "dimension" ||
              title.includes("dimension")
            ) {
              if (isRestrictedComponent) {
                (sector as HTMLElement).style.display = "none";
                // Also mark it with a class for easier debugging
                (sector as HTMLElement).classList.add("gjs-hidden-for-column");
              } else {
                // Check if sector has any visible properties before showing
                const hasVisibleProps = sector.querySelector(
                  '.gjs-sm-property:not([style*="display: none"])'
                );
                if (hasVisibleProps) {
                  (sector as HTMLElement).style.display = "";
                  (sector as HTMLElement).classList.remove(
                    "gjs-hidden-for-column"
                  );
                } else {
                  // Keep hidden if empty
                  (sector as HTMLElement).style.display = "none";
                }
              }
            }
          }
        });

        // Additional pass: hide any sector labels that contain "Typography" or "Dimension"
        if (isRestrictedComponent) {
          const sectorLabels = document.querySelectorAll(
            ".gjs-sm-sector-label"
          );
          sectorLabels.forEach((label) => {
            const text = label.textContent?.trim().toLowerCase() || "";
            if (
              text === "typography" ||
              text === "dimension" ||
              text.includes("typography") ||
              text.includes("dimension")
            ) {
              const sector = label.closest(".gjs-sm-sector");
              if (sector) {
                (sector as HTMLElement).style.display = "none";
              }
            }
          });
        }

        // Hide any empty sectors (sectors with no visible properties)
        allSectors.forEach((sector) => {
          const titleEl = sector.querySelector(".gjs-sm-sector-title");
          if (titleEl) {
            const title = titleEl.textContent?.trim().toLowerCase() || "";
            if (
              title === "typography" ||
              title.includes("typography") ||
              title === "dimension" ||
              title.includes("dimension")
            ) {
              const properties = sector.querySelector(".gjs-sm-properties");
              if (properties) {
                const hasVisibleProps = properties.querySelector(
                  '.gjs-sm-property:not([style*="display: none"])'
                );
                if (!hasVisibleProps) {
                  (sector as HTMLElement).style.display = "none";
                }
              }
            }
          }
        });
      };

      // Try immediately
      toggleSectors();

      // Try again after delays to catch late rendering
      setTimeout(toggleSectors, 10);
      setTimeout(toggleSectors, 50);
      setTimeout(toggleSectors, 100);
      setTimeout(toggleSectors, 200);
      setTimeout(toggleSectors, 500); // Extra delay for slow rendering
    };

    // Hide only Typography sector for breadcrumb outer container (keep Dimensions and Decorations)
    const hideTypographyForBreadcrumb = () => {
      const selected = this._editor.getSelected();

      // Check if the selected component is a breadcrumb outer container
      const isBreadcrumbOuter =
        selected && selected.get && selected.get("type") === "breadcrumb-outer";

      // Function to hide/show Typography sector only
      const toggleTypographyOnly = () => {
        const allSectors = document.querySelectorAll(".gjs-sm-sector");
        allSectors.forEach((sector) => {
          const titleEl = sector.querySelector(".gjs-sm-sector-title");
          if (titleEl) {
            const title = titleEl.textContent?.trim().toLowerCase() || "";
            // Hide only Typography sector (not Dimensions or Decorations)
            if (title === "typography" || title.includes("typography")) {
              if (isBreadcrumbOuter) {
                (sector as HTMLElement).style.display = "none";
                (sector as HTMLElement).classList.add(
                  "gjs-hidden-for-breadcrumb"
                );
              } else {
                // Check if sector has any visible properties before showing
                const hasVisibleProps = sector.querySelector(
                  '.gjs-sm-property:not([style*="display: none"])'
                );
                if (hasVisibleProps) {
                  (sector as HTMLElement).style.display = "";
                  (sector as HTMLElement).classList.remove(
                    "gjs-hidden-for-breadcrumb"
                  );
                } else {
                  // Keep hidden if empty
                  (sector as HTMLElement).style.display = "none";
                }
              }
            }
          }
        });

        // Additional pass: hide any sector labels that contain "Typography" only
        if (isBreadcrumbOuter) {
          const sectorLabels = document.querySelectorAll(
            ".gjs-sm-sector-label"
          );
          sectorLabels.forEach((label) => {
            const text = label.textContent?.trim().toLowerCase() || "";
            if (text === "typography" || text.includes("typography")) {
              const sector = label.closest(".gjs-sm-sector");
              if (sector) {
                (sector as HTMLElement).style.display = "none";
              }
            }
          });
        }

        // Hide any empty Typography sectors (sectors with no visible properties)
        allSectors.forEach((sector) => {
          const titleEl = sector.querySelector(".gjs-sm-sector-title");
          if (titleEl) {
            const title = titleEl.textContent?.trim().toLowerCase() || "";
            if (title === "typography" || title.includes("typography")) {
              const properties = sector.querySelector(".gjs-sm-properties");
              if (properties) {
                const hasVisibleProps = properties.querySelector(
                  '.gjs-sm-property:not([style*="display: none"])'
                );
                if (!hasVisibleProps) {
                  (sector as HTMLElement).style.display = "none";
                }
              }
            }
          }
        });
      };

      // Try immediately
      toggleTypographyOnly();

      // Try again after delays to catch late rendering
      setTimeout(toggleTypographyOnly, 10);
      setTimeout(toggleTypographyOnly, 50);
      setTimeout(toggleTypographyOnly, 100);
      setTimeout(toggleTypographyOnly, 200);
      setTimeout(toggleTypographyOnly, 500);
    };

    this._editor.on("component:selected", hideTypographyForImages);
    this._editor.on("component:selected", hideSectorsForInnerColumns);
    this._editor.on("component:selected", hideTypographyForBreadcrumb);

    // Also trigger when Style Manager is updated
    this._editor.on("styleable:change", hideTypographyForImages);
    this._editor.on("style-manager:update", hideTypographyForImages);
    this._editor.on("styleable:change", hideSectorsForInnerColumns);
    this._editor.on("style-manager:update", hideSectorsForInnerColumns);
    this._editor.on("styleable:change", hideTypographyForBreadcrumb);
    this._editor.on("style-manager:update", hideTypographyForBreadcrumb);

    // Trigger on load to handle saved components
    this._editor.on("load", () => {
      // Give time for Style Manager to render, then check selected component
      setTimeout(() => {
        const selected = this._editor.getSelected();
        if (selected) {
          hideSectorsForInnerColumns();
          hideTypographyForBreadcrumb();
        }
      }, 100);
    });

    this._editor.on("load", () => {
      const frame = this._container.querySelector(
        ".gjs-frame"
      ) as HTMLIFrameElement;
      if (frame) {
        frame.style.height = "100%";
        frame.style.width = "100%";
        frame.style.maxWidth = "none";
      }

      // Setup MutationObserver to watch for Style Manager changes
      const styleManagerPanel = document.querySelector(".gjs-sm-sectors");
      if (styleManagerPanel) {
        const observer = new MutationObserver(() => {
          hideTypographyForImages();
        });

        observer.observe(styleManagerPanel, {
          childList: true,
          subtree: true,
          attributes: false,
        });
      }

      // Also observe the entire right panel
      const rightPanel = document.querySelector(".gjs-pn-views-container");
      if (rightPanel) {
        const observer = new MutationObserver(() => {
          hideTypographyForImages();
        });

        observer.observe(rightPanel, {
          childList: true,
          subtree: true,
          attributes: false,
        });
      }

      // Also observe for inner column changes
      const styleManagerPanel2 = document.querySelector(".gjs-sm-sectors");
      if (styleManagerPanel2) {
        const observer = new MutationObserver(() => {
          hideSectorsForInnerColumns();
        });

        observer.observe(styleManagerPanel2, {
          childList: true,
          subtree: true,
          attributes: false,
        });
      }

      const rightPanel2 = document.querySelector(".gjs-pn-views-container");
      if (rightPanel2) {
        const observer = new MutationObserver(() => {
          hideSectorsForInnerColumns();
        });

        observer.observe(rightPanel2, {
          childList: true,
          subtree: true,
          attributes: false,
        });
      }

      // Also observe for breadcrumb changes
      const styleManagerPanel3 = document.querySelector(".gjs-sm-sectors");
      if (styleManagerPanel3) {
        const observer = new MutationObserver(() => {
          hideTypographyForBreadcrumb();
        });

        observer.observe(styleManagerPanel3, {
          childList: true,
          subtree: true,
          attributes: false,
        });
      }

      const rightPanel3 = document.querySelector(".gjs-pn-views-container");
      if (rightPanel3) {
        const observer = new MutationObserver(() => {
          hideTypographyForBreadcrumb();
        });

        observer.observe(rightPanel3, {
          childList: true,
          subtree: true,
          attributes: false,
        });
      }
    });

    // Register device change handler immediately, not nested in load event
    this._editor.on("change:device", (device: any) => {
      const frame = this._container.querySelector(
        ".gjs-frame"
      ) as HTMLIFrameElement;
      const devices = this._editor.getConfig().deviceManager.devices || [];
      let deviceName = device?.changed?.device || "Unknown";
      const matchedDevice = devices.find(
        (d: { name: string; width: string }) =>
          d.name === deviceName ||
          (deviceName.startsWith("Mobile") && d.name === "Mobile")
      );
      const deviceWidth = matchedDevice?.width || "100%";
      if (frame) {
        frame.style.width = deviceWidth;
        this._editor.refresh();
      }
    });

    this._editor.on("load", () => {
      const iframe = this._editor.Canvas.getFrameEl();
      if (iframe) {
        const iframeDoc = iframe.contentWindow?.document;
        if (iframeDoc) {
          iframeDoc.addEventListener("click", (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            // Support clicking on <a> or an <img> inside <a>
            const anchor =
              (target && target.tagName === "A"
                ? (target as HTMLAnchorElement)
                : target &&
                  (target.closest("a") as HTMLAnchorElement | null)) || null;
            if (anchor) {
              // Ignore anchors used as button-like elements inside editor
              if (
                anchor.getAttribute("data-role") === "button-link" ||
                anchor.closest('[data-role="button-link"]')
              ) {
                e.preventDefault();
                return;
              }
              const href = anchor.getAttribute("href");
              if (href) {
                e.preventDefault(); // prevent iframe navigation
                const tgt = anchor.getAttribute("target");
                window.open(href, tgt === "_blank" ? "_blank" : "_self");
              }
            }
          });
          const style = document.createElement("style");
          style.innerHTML = `
  /* Responsive images - exclude Azure-managed images so inline sizing works for them */
  img:not([data-azure-placeholder]) {
    max-width: 100%;
    height: auto;
  }

  @media (max-width: 768px) {
    .custom-row {
      display: flex !important;
      flex-wrap: wrap !important;
    }
      

    .custom-row > .custom-col {
      width: 100% !important;
      max-width: 100% !important;
      flex: 0 0 100% !important;
      box-sizing: border-box !important;
    }

    .custom-col {
      width: 100% !important;
    }

    /* Preserve mobile layout widths for non-image elements only.
       Exclude <img> (and Azure-managed images) so inline width can be applied to images. */
    [style*="width:"]:not(img):not([data-azure-placeholder]) {
      width: 100% !important;
    }
  }
`;

          iframeDoc.head.appendChild(style);

          // Inject editor-only border for carousel wrappers inside the canvas iframe
          try {
            let borderStyle = iframeDoc.getElementById(
              "pcf-editor-borders-style"
            ) as HTMLStyleElement | null;
            if (!borderStyle) {
              const s = iframeDoc.createElement("style");
              s.id = "pcf-editor-borders-style";
              iframeDoc.head.appendChild(s);
              borderStyle = s;
            }
            if (borderStyle)
              borderStyle.textContent = `
              /* Editor-only: show selection aid borders inside canvas */
              .pcf-carousel-outer,
              .pcf-hero-carousel-outer {
                border: 1px dotted #ccc !important;
                padding: 6px !important;
                box-sizing: border-box;
              }
              /* Pointer cursor for anchors wrapping images */
              a[href] img { cursor: pointer; }
              /* Editor-only: dotted borders for text-like components */
              [data-gjs-type="text"],
              [data-gjs-type="quote"],
              [data-gjs-type="text-sect"],
              [data-gjs-type="text-basic"] {
                border: 1px dotted #ccc !important;
                box-sizing: border-box;
                min-height: 20px; /* helps visualize empty text blocks */
              }
            `;
          } catch {
            /* ignore */
          }
        }
      }
    });

    this._editor.DomComponents.addType("text", {
      isComponent: (el: HTMLElement) =>
        el.getAttribute("data-gjs-type") === "text",
      model: {
        defaults: {
          tagName: "div",
          content: "Double-click to edit text",
          attributes: { "data-gjs-type": "text" },
          editable: true,
          droppable: false,
          style: {
            padding: "10px",
            // border: '1px dashed #999'
          },
        },
      },
    });

    // Override image component to exclude typography traits from Style Manager
    const imageType = this._editor.DomComponents.getType("image");
    this._editor.DomComponents.addType("image", {
      extend: "image",
      model: {
        defaults: {
          ...imageType.model.prototype.defaults,
          // Remove all typography-related style properties
          stylable: [
            "background",
            "background-color",
            "background-image",
            "background-repeat",
            "background-attachment",
            "background-position",
            "background-size",
            "position",
            "top",
            "right",
            "bottom",
            "left",
            "display",
            "float",
            "width",
            "height",
            "max-width",
            "max-height",
            "min-width",
            "min-height",
            "margin",
            "margin-top",
            "margin-right",
            "margin-bottom",
            "margin-left",
            "padding",
            "padding-top",
            "padding-right",
            "padding-bottom",
            "padding-left",
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
            "object-fit",
            "object-position",
            "vertical-align",
          ],
        },
      },
    });

    // Override link component to add toolbar with delete button
    const linkType = this._editor.DomComponents.getType("link");
    this._editor.DomComponents.addType("link", {
      extend: "link",
      model: {
        defaults: {
          ...linkType.model.prototype.defaults,
          toolbar: [
            {
              attributes: { class: "fa fa-arrows", title: "Move" },
              command: "tlb-move",
            },
            {
              attributes: { class: "fa fa-trash-o", title: "Delete" },
              command: "tlb-delete",
            },
          ],
        },
      },
    });

    // Force toolbar to appear on link components when selected
    this._editor.on("component:selected", (comp: any) => {
      try {
        if (!comp) return;
        const type = (comp.get && comp.get("type")) || "";

        if (type === "link") {
          console.log("[DEBUG] Link component selected:", comp);

          // Get current toolbar
          let toolbar = comp.get("toolbar");
          console.log("[DEBUG] Current toolbar:", toolbar);

          // If no toolbar or empty, set it
          if (!toolbar || toolbar.length === 0) {
            toolbar = [
              {
                attributes: { class: "fa fa-arrows", title: "Move" },
                command: "tlb-move",
              },
              {
                attributes: { class: "fa fa-trash-o", title: "Delete" },
                command: "tlb-delete",
              },
            ];
            comp.set("toolbar", toolbar);
            console.log("[DEBUG] Toolbar set on link component");

            // Force view refresh to show toolbar
            if (comp.view && comp.view.render) {
              comp.view.render();
            }
          }
        }
      } catch (e) {
        console.error("[DEBUG] Error adding toolbar to link:", e);
      }
    });

    this._editor.on("update", () => {
      clearTimeout(this._updateTimeout);
      this._updateTimeout = setTimeout(() => {
        const html = this._editor.getHtml();
        const css = this._editor.getCss();

        // PORTAL FIX: Backup href attributes to data-href to survive portal sanitization
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const allLinks = doc.querySelectorAll<HTMLAnchorElement>("a[href]");

        console.log(
          `[GrapesJS] Backing up ${allLinks.length} links before save`
        );

        allLinks.forEach((link) => {
          const href = link.getAttribute("href");
          if (href && href.trim() !== "") {
            // Store href in data attribute as backup
            link.setAttribute("data-href-backup", href);
            console.log(`[GrapesJS] Backed up link: ${href}`);
          }

          // Also backup target attribute
          const target = link.getAttribute("target");
          if (target && target.trim() !== "") {
            link.setAttribute("data-target-backup", target);
          }
        });

        const processedHtml = doc.body.innerHTML;

        // Add link restoration script that will run in portal preview
        const linkRestoreScript = `
<script>
(function() {
  console.log('[Portal Link Fix] Restoring links...');
  
  // Wait for DOM to be ready
  function restoreLinks() {
    const linksWithBackup = document.querySelectorAll('a[data-href-backup]');
    console.log('[Portal Link Fix] Found ' + linksWithBackup.length + ' links to restore');
    
    linksWithBackup.forEach(function(link) {
      const backupHref = link.getAttribute('data-href-backup');
      const backupTarget = link.getAttribute('data-target-backup');
      
      if (backupHref) {
        // Restore href attribute
        link.setAttribute('href', backupHref);
        console.log('[Portal Link Fix] Restored href:', backupHref);
        
        // Force pointer cursor
        link.style.cursor = 'pointer';
        link.style.textDecoration = 'underline';
        
        // Restore target if it existed
        if (backupTarget) {
          link.setAttribute('target', backupTarget);
        }
        
        // Add click handler as fallback (in case href still gets stripped)
        link.addEventListener('click', function(e) {
          const href = this.getAttribute('href') || this.getAttribute('data-href-backup');
          if (href && href !== '#') {
            e.preventDefault();
            const target = this.getAttribute('target') || this.getAttribute('data-target-backup');
            if (target === '_blank') {
              window.open(href, '_blank');
            } else {
              window.location.href = href;
            }
          }
        });
      }
    });
  }
  
  // PORTAL FIX: Force horizontal menu dropdown functionality
  function initHorizontalMenus() {
    console.log('[Portal Menu Fix] Initializing horizontal menus...');
    
    // Debug function to understand menu structure
    function debugMenuStructure() {
      console.log('[Portal Menu Fix] Analyzing menu structure...');
      
      // Find all li elements with data-menu-item
      var menuItems = document.querySelectorAll('li[data-menu-item]');
      console.log('[Portal Menu Fix] Found menu items:', menuItems.length);
      
      menuItems.forEach(function(item, index) {
        console.log('[Portal Menu Fix] Menu item', index + ':', item);
        var submenu = item.querySelector('ul');
        if (submenu) {
          console.log('[Portal Menu Fix] - Has submenu:', submenu);
          console.log('[Portal Menu Fix] - Submenu class:', submenu.className);
          console.log('[Portal Menu Fix] - Submenu ID:', submenu.id);
        }
      });
      
      // Also look for any nested UL elements
      var allUls = document.querySelectorAll('li ul');
      console.log('[Portal Menu Fix] All nested ULs:', allUls.length);
      allUls.forEach(function(ul, index) {
        console.log('[Portal Menu Fix] UL', index + ':', ul);
      });
    }
    
    // First, ensure menu structure has proper classes
    function ensureMenuStructure() {
      // Find all potential horizontal menus by looking for li elements with submenu children
      var potentialMenus = document.querySelectorAll('li[data-menu-item]');
      
      potentialMenus.forEach(function(menuItem) {
        var submenu = menuItem.querySelector('ul.submenu, ul[id*="gjsc-"]');
        if (submenu) {
          // Ensure submenu has proper class
          if (!submenu.classList.contains('submenu')) {
            submenu.classList.add('submenu');
          }
          
          // Find the parent ul (should be .hmenu)
          var parentUl = menuItem.parentElement;
          if (parentUl && parentUl.tagName === 'UL') {
            if (!parentUl.classList.contains('hmenu')) {
              parentUl.classList.add('hmenu');
            }
            
            // Find the nav wrapper
            var nav = parentUl.parentElement;
            if (nav) {
              if (!nav.classList.contains('pcf-hmenu')) {
                nav.classList.add('pcf-hmenu');
              }
            }
          }
        }
      });
    }
    
    // Inject essential horizontal menu CSS for portal
    function injectMenuCSS() {
      var existingStyle = document.getElementById('portal-hmenu-fix-css');
      if (existingStyle) return; // Already injected
      
      var style = document.createElement('style');
      style.id = 'portal-hmenu-fix-css';
      style.textContent = 
        '.pcf-hmenu { width: 100% !important; background: #ffffff !important; }' +
        '.pcf-hmenu * { box-sizing: border-box !important; }' +
        '.pcf-hmenu .hmenu { list-style: none !important; margin: 0 !important; padding: 0 12px !important; display: flex !important; gap: 24px !important; align-items: stretch !important; }' +
        '.pcf-hmenu .hmenu > li { position: relative !important; padding: 15px !important; margin: 0px 0px 5px !important; font-weight: 600 !important; color: inherit !important; cursor: pointer !important; height: 40px !important; display: flex !important; align-items: center !important; gap: 6px !important; }' +
        
        '/* Card-like submenu styling with reduced padding */' +
        '.pcf-hmenu .submenu { ' +
        '  list-style: none !important; ' +
        '  margin: 0 !important; ' +
        // '  padding: 6px !important; ' +
        '  position: absolute !important; ' +
        '  left: 0 !important; ' +
        '  top: calc(100% + 8px) !important; ' +
        '  min-width: 250px !important; ' +
        '  background: #ffffff !important; ' +
        '  border: 1px solid #e0e0e0 !important; ' +
        '  border-radius: 8px !important; ' +
        '  box-shadow: 0 8px 24px rgba(0,0,0,0.12) !important; ' +
        '  z-index: 99999 !important; ' +
        '  display: none !important; ' +
        '}' +
        
        '/* Open state for submenu */' +
        '.pcf-hmenu li.open > .submenu { display: block !important; opacity: 1 !important; visibility: visible !important; pointer-events: auto !important; }' +
        
        '/* Submenu items styling with reduced spacing */' +
        '.pcf-hmenu .submenu > li { ' +
        '  padding: 0 !important; ' +
        '  margin: 0 0 2px 0 !important; ' +
        '  white-space: nowrap !important; ' +
        '  background: transparent !important; ' +
        '  color: inherit !important; ' +
        '  border-radius: 4px !important; ' +
        '}' +
        
        '/* Submenu links styling with reduced padding */' +
        '.pcf-hmenu .submenu > li > a { ' +
        '  font-weight: 500 !important; ' +
        '  color: #333333 !important; ' +
        '  text-decoration: none !important; ' +
        '  padding: 6px 8px !important; ' +
        '  display: block !important; ' +
        '  border: none !important; ' +
        '  box-shadow: none !important; ' +
        '  outline: none !important; ' +
        '  background: transparent !important; ' +
        '  border-radius: 4px !important; ' +
        '  transition: none !important; ' +
        '}' +
        
        '/* Remove submenu hover effect */' +
        '.pcf-hmenu .submenu > li > a:hover { ' +
        '  background: transparent !important; ' +
        '  color: #333333 !important; ' +
        '  transform: none !important; ' +
        '}' +
        
        '.pcf-hmenu .caret-icon { width: 12px !important; height: 12px !important; fill: currentColor !important; opacity: .7 !important; pointer-events: none !important; margin-left: 4px !important; vertical-align: middle !important; }' +
        
        '/* Fallback menu items cursor */' +
        'li[data-menu-item] { cursor: pointer !important; }' +
        'li[data-menu-item] > a { cursor: pointer !important; pointer-events: auto !important; }' +
        
        '/* Maximum priority display rules */' +
        'li.open > ul { ' +
        '  display: block !important; ' +
        '  position: absolute !important; ' +
        '  z-index: 99999 !important; ' +
        '  background: #ffffff !important; ' +
        '  border: 1px solid #e0e0e0 !important; ' +
        '  border-radius: 8px !important; ' +
        '  padding: 6px !important; ' +
        '  min-width: 250px !important; ' +
        '  top: calc(100% + 8px) !important; ' +
        '  left: 0 !important; ' +
        '  box-shadow: 0 8px 24px rgba(0,0,0,0.12) !important; ' +
        '}' +
        
        'li.open > ul[id*="gjsc-"] { display: block !important; opacity: 1 !important; visibility: visible !important; }' +
        
        '/* Class-based overrides for multiple visibility approaches */' +
        '.show, .visible, .active { display: block !important; }' +
        'ul.show, ul.visible, ul.active { display: block !important; position: absolute !important; z-index: 99999 !important; }' +
        
        '/* Emergency nuclear overrides */' +
        'li.open ul { display: block !important; }' +
        'li.open > ul[style*="display: none"] { display: block !important; }' +
        'ul.show[style*="display: none"] { display: block !important; }' +
        
        '/* Force submenu positioning */' +
        'li[data-menu-item].open ul { ' +
        '  position: absolute !important; ' +
        '  top: 100% !important; ' +
        '  left: 0 !important; ' +
        '  z-index: 999999 !important; ' +
        '  display: block !important; ' +
        '}';
        
      document.head.appendChild(style);
      console.log('[Portal Menu Fix] Injected menu CSS');
    }
    
    // Enhanced click handler that works with any menu structure
    function handleMenuClick(e) {
      var target = e.target;
      if (!target) return;
      
      console.log('[Portal Menu Fix] Click detected on:', target);
      console.log('[Portal Menu Fix] Target parent elements:', target.parentElement, target.parentElement?.parentElement);
      
      // PRIORITY 1: Check if click is on a link inside a submenu - handle navigation FIRST
      var submenuLink = target.closest('.submenu a') || 
                       target.closest('ul[id*="gjsc-"] a') ||
                       (target.tagName === 'A' && target.closest('.submenu, ul[id*="gjsc-"]'));
      
      if (submenuLink) {
        console.log('[Portal Menu Fix] Click on submenu link detected:', submenuLink);
        
        // Stop all event propagation to prevent menu toggle
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        var href = submenuLink.getAttribute('href') || submenuLink.getAttribute('data-href-backup');
        var targetAttr = submenuLink.getAttribute('target') || submenuLink.getAttribute('data-target-backup');
        
        console.log('[Portal Menu Fix] Link href:', href, 'target:', targetAttr);
        
        if (href && href !== '#' && href.trim() !== '') {
          console.log('[Portal Menu Fix] Navigating to submenu link:', href);
          
          // Handle navigation based on target
          if (targetAttr === '_blank') {
            window.open(href, '_blank');
          } else {
            window.location.href = href;
          }
          
          return false;
        } else {
          console.log('[Portal Menu Fix] No valid href found, checking for click handlers');
          return false;
        }
      }
      
      // PRIORITY 2: Find the closest li that could be a menu item FIRST
      var li = target.closest('li[data-menu-item]') || 
               target.closest('li[class*="gjsc-"]') || // GrapesJS generated IDs
               target.closest('li'); // Any li as fallback
      
      console.log('[Portal Menu Fix] Found LI element:', li);
      
      if (li) {
        // Check if this LI has a submenu
        var submenu = li.querySelector('.submenu, ul[id*="gjsc-"]');
        if (!submenu) {
          // Try to find by looking for nested li elements
          var nestedLis = li.querySelectorAll('li');
          if (nestedLis.length > 0) {
            submenu = nestedLis[0].parentElement;
          }
        }
        
        console.log('[Portal Menu Fix] Found submenu:', submenu);
        
        if (submenu) {
          // This LI has a submenu, so check if we're clicking inside an already open submenu
          var clickInsideOpenSubmenu = target.closest('.submenu, ul[id*="gjsc-"]');
          var clickedLiWithSubmenu = clickInsideOpenSubmenu ? clickInsideOpenSubmenu.closest('li') : null;
          
          console.log('[Portal Menu Fix] Click inside open submenu:', clickInsideOpenSubmenu);
          console.log('[Portal Menu Fix] Clicked LI with submenu:', clickedLiWithSubmenu);
          console.log('[Portal Menu Fix] Current LI:', li);
          
          // If we're clicking inside an already open submenu of a DIFFERENT menu item, ignore
          if (clickInsideOpenSubmenu && clickedLiWithSubmenu && clickedLiWithSubmenu !== li) {
            console.log('[Portal Menu Fix] Click inside different submenu - ignoring');
            e.stopPropagation();
            return false;
          }
          
          // If we're clicking inside the same submenu that's already open, ignore  
          if (clickInsideOpenSubmenu && clickedLiWithSubmenu === li && li.classList.contains('open')) {
            console.log('[Portal Menu Fix] Click inside same open submenu - ignoring');
            e.stopPropagation();
            return false;
          }
          
          // Otherwise, this is a click on a menu item that should toggle the dropdown
          console.log('[Portal Menu Fix] Valid menu item click - toggling dropdown');
          
          // FORCE: Prevent ALL event propagation when submenu exists
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          
          console.log('[Portal Menu Fix] Toggling dropdown for:', li);
          
          // Close other open items in the same menu level FIRST
          var parentUl = li.parentElement;
          if (parentUl) {
            var siblings = parentUl.querySelectorAll('li.open');
            for (var i = 0; i < siblings.length; i++) {
              if (siblings[i] !== li) {
                siblings[i].classList.remove('open');
                var siblingSubmenu = siblings[i].querySelector('ul');
                if (siblingSubmenu) {
                  siblingSubmenu.style.setProperty('display', 'none', 'important');
                  siblingSubmenu.classList.remove('show', 'visible', 'active');
                }
              }
            }
          }
          
          // Check current state and toggle
          var isCurrentlyOpen = li.classList.contains('open');
          
          if (!isCurrentlyOpen) {
            // OPEN the menu
            li.classList.add('open');
            submenu.classList.add('show', 'visible', 'active');
            
            // Apply all styles immediately
            submenu.style.setProperty('display', 'block', 'important');
            submenu.style.setProperty('opacity', '1', 'important');
            submenu.style.setProperty('visibility', 'visible', 'important');
            submenu.style.setProperty('pointer-events', 'auto', 'important');
            submenu.style.setProperty('z-index', '99999', 'important');
            submenu.style.setProperty('position', 'absolute', 'important');
            submenu.style.setProperty('background', '#ffffff', 'important');
            submenu.style.setProperty('border', '1px solid #ddd', 'important');
            submenu.style.setProperty('border-radius', '8px', 'important');
            submenu.style.setProperty('padding', '6px', 'important');
            submenu.style.setProperty('min-width', '200px', 'important');
            submenu.style.setProperty('top', '100%', 'important');
            submenu.style.setProperty('left', '0', 'important');
            submenu.style.setProperty('box-shadow', '0 4px 8px rgba(0,0,0,0.2)', 'important');
            submenu.style.setProperty('list-style', 'none', 'important');
            submenu.style.setProperty('margin', '0', 'important');
            
            console.log('[Portal Menu Fix] Menu item now: OPENED');
            console.log('[Portal Menu Fix] Submenu display after opening:', window.getComputedStyle(submenu).display);
          } else {
            // CLOSE the menu
            li.classList.remove('open');
            submenu.classList.remove('show', 'visible', 'active');
            submenu.style.setProperty('display', 'none', 'important');
            
            console.log('[Portal Menu Fix] Menu item now: CLOSED');
          }
          
          return false;
        } else {
          // No submenu found, allow normal behavior
          console.log('[Portal Menu Fix] No submenu found for this LI - allowing normal behavior');
          return;
        }
      }
      
      console.log('[Portal Menu Fix] No menu context found - allowing normal behavior');
    }
    
    // Click outside to close - with delay to prevent immediate closing
    function handleOutsideClick(e) {
      // Add a small delay to prevent immediate closing after opening
      setTimeout(function() {
        var target = e.target;
        if (!target) return;
        
        console.log('[Portal Menu Fix] Outside click handler - target:', target);
        
        // IGNORE if click is on a submenu link - navigation should already be handled
        var isSubmenuLink = target.closest('.submenu a') || 
                           target.closest('ul[id*="gjsc-"] a') ||
                           (target.tagName === 'A' && target.closest('.submenu, ul[id*="gjsc-"]'));
        
        if (isSubmenuLink) {
          console.log('[Portal Menu Fix] Outside click on submenu link - ignoring (navigation handled elsewhere)');
          return; // Don't close dropdown, navigation is handled in main click handler
        }
        
        // Check if click is anywhere inside a submenu (but not on a link) - keep dropdown open
        var insideSubmenu = target.closest('.submenu, ul[id*="gjsc-"]');
        if (insideSubmenu) {
          console.log('[Portal Menu Fix] Click inside submenu (not on link) - keeping dropdown open');
          return; // Don't close dropdown
        }
        
        // Click outside any menu closes all - but be more specific
        var insideMenu = target.closest('.pcf-hmenu') || 
                        target.closest('li[data-menu-item]') || 
                        target.closest('li[id*="gjsc-"]') ||
                        target.closest('ul[id*="gjsc-"]');
        
        if (!insideMenu) {
          console.log('[Portal Menu Fix] Click outside menu area - closing all dropdowns');
          var allOpen = document.querySelectorAll('li.open');
          for (var j = 0; j < allOpen.length; j++) {
            allOpen[j].classList.remove('open');
            allOpen[j].classList.remove('show', 'visible', 'active');
            // Also hide submenus directly
            var submenu = allOpen[j].querySelector('ul');
            if (submenu) {
              submenu.style.setProperty('display', 'none', 'important');
              submenu.classList.remove('show', 'visible', 'active');
            }
          }
          console.log('[Portal Menu Fix] Closed all menus due to outside click');
        }
      }, 50); // 50ms delay
    }
    
    // Run setup
    debugMenuStructure();
    ensureMenuStructure();
    injectMenuCSS();
    
    // Attach event handlers - simplified approach
    document.addEventListener('click', handleMenuClick, true); // Capture phase only
    
    // Delay the outside click handler to prevent conflicts
    setTimeout(function() {
      document.addEventListener('click', handleOutsideClick, false); // Bubble phase
    }, 100);
    
    console.log('[Portal Menu Fix] Horizontal menu handlers attached');
  }
  
  // Run immediately and after a delay (to catch dynamically loaded content)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      restoreLinks();
      initHorizontalMenus();
    });
  } else {
    restoreLinks();
    initHorizontalMenus();
  }
  
  // Also run after a short delay to catch any late portal processing
  setTimeout(function() { restoreLinks(); initHorizontalMenus(); }, 100);
  setTimeout(function() { restoreLinks(); initHorizontalMenus(); }, 500);
  setTimeout(function() { restoreLinks(); initHorizontalMenus(); }, 1000);
  
  // Expose debug functions globally for troubleshooting
  window.portalMenuDebug = {
    testMenuToggle: function() {
      console.log('[Portal Menu Debug] Testing menu toggle...');
      var menuItems = document.querySelectorAll('li[data-menu-item]');
      if (menuItems.length > 0) {
        var firstItem = menuItems[0];
        var submenu = firstItem.querySelector('ul');
        if (submenu) {
          console.log('[Portal Menu Debug] Found submenu, toggling...');
          firstItem.classList.toggle('open');
          if (firstItem.classList.contains('open')) {
            submenu.style.display = 'block';
            submenu.style.opacity = '1';
            submenu.style.visibility = 'visible';
            submenu.style.pointerEvents = 'auto';
            submenu.style.zIndex = '9999';
            console.log('[Portal Menu Debug] Menu opened');
          } else {
            submenu.style.display = 'none';
            console.log('[Portal Menu Debug] Menu closed');
          }
        } else {
          console.log('[Portal Menu Debug] No submenu found');
        }
      } else {
        console.log('[Portal Menu Debug] No menu items found');
      }
    },
    forceMenuVisible: function() {
      console.log('[Portal Menu Debug] Force showing all submenus...');
      var submenus = document.querySelectorAll('li[data-menu-item] ul');
      console.log('[Portal Menu Debug] Found', submenus.length, 'submenus to force visible');
      submenus.forEach(function(submenu, index) {
        console.log('[Portal Menu Debug] Processing submenu', index, ':', submenu);
        
        // Remove any classes that might hide it
        submenu.classList.remove('hidden', 'collapse', 'd-none');
        submenu.classList.add('show', 'visible', 'active');
        
        // Apply aggressive inline styles
        submenu.style.setProperty('display', 'block', 'important');
        submenu.style.setProperty('opacity', '1', 'important');
        submenu.style.setProperty('visibility', 'visible', 'important');
        submenu.style.setProperty('pointer-events', 'auto', 'important');
        submenu.style.setProperty('z-index', '99999', 'important');
        submenu.style.setProperty('position', 'absolute', 'important');
        submenu.style.setProperty('background', '#ffffff', 'important');
        submenu.style.setProperty('border', '2px solid #ff0000', 'important'); // Red border for visibility test
        submenu.style.setProperty('padding', '6px', 'important'); // Reduced padding for visibility test
        submenu.style.setProperty('min-width', '300px', 'important');
        submenu.style.setProperty('top', '100%', 'important');
        submenu.style.setProperty('left', '0', 'important');
        submenu.style.setProperty('box-shadow', '0 8px 16px rgba(255,0,0,0.3)', 'important'); // Red shadow for visibility test
        
        // Also ensure parent has open class
        var parentLi = submenu.closest('li[data-menu-item]');
        if (parentLi) {
          parentLi.classList.add('open');
        }
        
        console.log('[Portal Menu Debug] Applied styles to submenu', index);
        console.log('[Portal Menu Debug] Submenu final computed display:', window.getComputedStyle(submenu).display);
      });
    }
  };
  
  console.log('[Portal Menu Debug] Debug functions available: window.portalMenuDebug.testMenuToggle() and window.portalMenuDebug.forceMenuVisible()');
})();
</script>`;

        this._value = `${processedHtml}\n<style>${css}</style>\n${linkRestoreScript}`;
        this._notifyOutputChanged();
        // Also persist to local storage so refresh doesn't lose unsaved edits
        try {
          this._editor.store();
        } catch {
          /* ignore */
        }
      }, 500);
    });

    this._editor.on("load", () => {
      const previewBtn = document.querySelector('.gjs-pn-btn[title="Preview"]');
      if (previewBtn) {
        previewBtn.remove();
      }
    });

    this._registerCustomBlocks();

    //button align code
    // Register button align commands and toolbar dropdown
    try {
      // Command to apply alignment to a button component
      this._editor.Commands.add("apply-button-align", {
        run: (ed: any, sender: any, opts: any = {}) => {
          try {
            const comp = opts.target || (ed.getSelected && ed.getSelected());
            if (!comp) return;

            // Ensure we operate on the button element model (supports both <button> and <a data-role="button-link">)
            const findButton = (m: any) => {
              let cur = m;
              while (cur) {
                const tag = (
                  (cur.get && cur.get("tagName")) ||
                  ""
                ).toLowerCase();
                const attrs = (cur.getAttributes && cur.getAttributes()) || {};
                const isButtonComponent =
                  tag === "button" ||
                  (cur.get && cur.get("type") === "button") ||
                  (tag === "a" && attrs["data-role"] === "button-link");
                if (isButtonComponent) return cur;
                cur = cur.parent && cur.parent();
              }
              return null;
            };

            const buttonModel = findButton(comp);
            if (!buttonModel) return;

            const alignment = (opts.align || "left") as
              | "left"
              | "center"
              | "right";

            try {
              const currentStyle =
                (buttonModel.getStyle && buttonModel.getStyle()) || {};
              delete currentStyle.margin;
              delete currentStyle["margin-left"];
              delete currentStyle["margin-right"];
              delete currentStyle.marginLeft;
              delete currentStyle.marginRight;
              buttonModel.setStyle && buttonModel.setStyle(currentStyle);
            } catch {
              /* ignore */
            }

            // Set alignment attribute for CSS targeting and persistence
            try {
              buttonModel.addAttributes &&
                buttonModel.addAttributes({ "data-btn-align": alignment });
            } catch {
              /* ignore */
            }

            // Apply alignment styles - use margin-based approach to avoid affecting siblings
            try {
              const currentStyle =
                (buttonModel.getStyle && buttonModel.getStyle()) || {};

              const essentialStyles: any = {
                textDecoration: "none",
              };

              if (!currentStyle.cursor) {
                essentialStyles.cursor = "pointer";
              }

              // Apply only the essential styles, preserving all user customizations
              Object.assign(currentStyle, essentialStyles);

              // Clear any previous margin styles
              delete currentStyle.margin;
              delete currentStyle["margin-left"];
              delete currentStyle["margin-right"];
              delete currentStyle.marginLeft;
              delete currentStyle.marginRight;

              // Apply alignment using margin instead of parent text-align
              if (alignment === "left") {
                currentStyle.display = "inline-block";
                currentStyle["margin-left"] = "0";
                currentStyle["margin-right"] = "auto";
                // Remove any width constraint for left alignment
                delete currentStyle.width;
              } else if (alignment === "center") {
                currentStyle.display = "table"; // Use table display to maintain intrinsic width
                currentStyle["margin-left"] = "auto";
                currentStyle["margin-right"] = "auto";
                // Ensure width is not 100%
                if (!currentStyle.width || currentStyle.width === "100%") {
                  delete currentStyle.width;
                }
              } else if (alignment === "right") {
                currentStyle.display = "table"; // Use table display to maintain intrinsic width
                currentStyle["margin-left"] = "auto";
                currentStyle["margin-right"] = "0";
                // Ensure width is not 100%
                if (!currentStyle.width || currentStyle.width === "100%") {
                  delete currentStyle.width;
                }
              }

              buttonModel.setStyle && buttonModel.setStyle(currentStyle);
            } catch {
              /* ignore */
            }

            try {
              if (buttonModel.set) {
                const currentAttrs =
                  (buttonModel.getAttributes && buttonModel.getAttributes()) ||
                  {};
                currentAttrs["data-btn-align"] = alignment;
                buttonModel.set("attributes", currentAttrs);
              }
            } catch {
              /* ignore */
            }

            // Force multiple change events for better persistence
            try {
              buttonModel.trigger && buttonModel.trigger("change:style");
              buttonModel.trigger && buttonModel.trigger("change:attributes");
              buttonModel.trigger && buttonModel.trigger("change");
              ed.trigger && ed.trigger("component:update", buttonModel);
              ed.trigger && ed.trigger("change:component", buttonModel);
              ed.refresh && ed.refresh();
            } catch {
              /* ignore */
            }
          } catch (err) {
            console.warn("apply-button-align failed", err);
          }
        },
      });

      // Command to open dropdown for button alignment
      this._editor.Commands.add("open-button-align-dropdown", {
        run: (ed: any, sender: any, opts: any = {}) => {
          const comp = opts.target || (ed.getSelected && ed.getSelected());
          if (!comp) return;

          // Find toolbar button element
          const toolbar = document.querySelector(".gjs-toolbar");
          const btn = toolbar?.querySelector(
            '[title="Button Align"]'
          ) as HTMLElement;
          if (!btn) return;

          // Toggle existing dropdown
          const existing = document.querySelector(".button-align-dropdown");
          if (existing) {
            existing.remove();
            return;
          }

          const dropdown = document.createElement("div");
          dropdown.className = "button-align-dropdown";
          dropdown.innerHTML = `
              <div style="
                position: absolute;
                background: #4b3939; /* modal brown background */
                border: 1px solid #5b4545;
                border-radius: 6px;
                padding: 10px;
                min-width: 180px;
                box-shadow: 0 6px 18px rgba(0,0,0,0.35);
                z-index: 1000;
                color: #fff;
                font-size: 14px;
              ">
                <div style="margin-bottom:8px;font-weight:600;">Button Align</div>
                <div class="align-option" data-align="left" style="padding:8px;border-radius:6px;cursor:pointer;display:flex;align-items:center;margin-bottom:6px;border:1px solid rgba(255,255,255,0.04);background:transparent;color:#fff;font-weight:500;">
                  <i class="fa fa-align-left" style="width:18px;text-align:center;margin-right:10px;color:#fff;"></i>Left
                </div>
                <div class="align-option" data-align="center" style="padding:8px;border-radius:6px;cursor:pointer;display:flex;align-items:center;margin-bottom:6px;border:1px solid rgba(255,255,255,0.04);background:transparent;color:#fff;font-weight:500;">
                  <i class="fa fa-align-center" style="width:18px;text-align:center;margin-right:10px;color:#fff;"></i>Center
                </div>
                <div class="align-option" data-align="right" style="padding:8px;border-radius:6px;cursor:pointer;display:flex;align-items:center;border:1px solid rgba(255,255,255,0.04);background:transparent;color:#fff;font-weight:500;">
                  <i class="fa fa-align-right" style="width:18px;text-align:center;margin-right:10px;color:#fff;"></i>Right
                </div>
              </div>
            `;

          // Position dropdown under the toolbar button
          const rect = btn.getBoundingClientRect();
          const content = dropdown.firstElementChild as HTMLElement;
          content.style.top = `${rect.bottom + 6}px`;
          content.style.left = `${rect.left}px`;
          document.body.appendChild(dropdown);

          dropdown.querySelectorAll(".align-option").forEach((opt) => {
            opt.addEventListener("click", (e) => {
              const a = (e.currentTarget as HTMLElement).getAttribute(
                "data-align"
              ) as "left" | "center" | "right";
              if (a)
                ed.runCommand("apply-button-align", { target: comp, align: a });
              dropdown.remove();
            });
            opt.addEventListener("mouseenter", () => {
              (opt as HTMLElement).style.background = "rgba(0,0,0,0.08)";
            });
            opt.addEventListener("mouseleave", () => {
              (opt as HTMLElement).style.background = "transparent";
            });
          });

          // Close handlers
          const close = (ev?: MouseEvent) => {
            if (ev && dropdown.contains(ev.target as Node)) return;
            if (ev && btn.contains(ev.target as Node)) return;
            dropdown.remove();
            document.removeEventListener("click", close);
            ed.off && ed.off("component:selected", close);
          };
          setTimeout(() => document.addEventListener("click", close), 100);
          ed.on && ed.on("component:selected", close);
        },
      });

      // Add a toolbar button for button components using DomComponents filtering
      try {
        const dc = this._editor.DomComponents;
        const originalGetToolbar =
          dc.getType && dc.getType("button")?.model?.prototype?.toolbar;
        // We'll add the toolbar in a selection hook instead to avoid breaking existing behavior
        this._editor.on("component:selected", (comp: any) => {
          try {
            if (!comp) return;
            const tag = ((comp.get && comp.get("tagName")) || "").toLowerCase();
            const attrs = (comp.getAttributes && comp.getAttributes()) || {};
            const isBtnComponent =
              tag === "button" ||
              (tag === "a" && attrs["data-role"] === "button-link");

            if (!isBtnComponent) return;

            // Check if button already has the alignment toolbar processed (to avoid duplicates on refresh)
            if (comp._buttonAlignToolbarAdded) return;

            // Build a toolbar entry and ensure it's present on the component view
            let toolbar = comp.get("toolbar") || [];

            // If toolbar is empty, add the default GrapesJS toolbar items (without clone)
            if (toolbar.length === 0) {
              toolbar = [
                {
                  attributes: { class: "fa fa-arrows", title: "Move" },
                  command: "tlb-move",
                },
                {
                  attributes: { class: "fa fa-trash-o", title: "Delete" },
                  command: "tlb-delete",
                },
              ];
            }

            // Add our custom Button Align tool if it doesn't exist
            const exists = toolbar.find(
              (t: any) => t && t.command === "open-button-align-dropdown"
            );
            if (!exists) {
              toolbar.push({
                attributes: {
                  class: "fa fa-align-left",
                  title: "Button Align",
                },
                command: "open-button-align-dropdown",
              });
            }

            // Add a Link/Edit Link tool for button-like anchors
            const linkExists = toolbar.find(
              (t: any) => t && t.command === "button-add-link"
            );
            if (!linkExists) {
              toolbar.push({
                attributes: { class: "fa fa-link", title: "Add/Edit Link" },
                command: "button-add-link",
              });
            }

            comp.set && comp.set("toolbar", toolbar);
            // Mark as processed to prevent re-adding on refresh
            comp._buttonAlignToolbarAdded = true;
            // Also ensure preview CSS for alignment exists
            try {
              this._injectButtonAlignPreviewStyles();
            } catch {
              /* ignore */
            }
          } catch (e) {
            /* ignore */
          }
        });
      } catch (e) {
        /* ignore */
      }
    } catch (e) {
      console.warn("Button align registration failed", e);
    }

    // Ensure button alignment styles are injected on load for persistence
    this._editor.on("load", () => {
      try {
        // Inject styles immediately when content loads
        this._injectButtonAlignPreviewStyles();

        // Also reapply alignment styles to any existing buttons with alignment data
        setTimeout(() => {
          const wrapper = this._editor.getWrapper();
          if (wrapper && wrapper.find) {
            // Find both regular buttons and button-link anchors with alignment data
            const buttons = wrapper.find("button[data-btn-align]");
            const buttonLinks = wrapper.find(
              'a[data-role="button-link"][data-btn-align]'
            );
            const allButtonComponents = [...buttons, ...buttonLinks];

            allButtonComponents.forEach((btn: any) => {
              try {
                const alignment =
                  btn.getAttributes && btn.getAttributes()["data-btn-align"];
                if (alignment) {
                  // Reapply the alignment styles for persistence
                  this._editor.runCommand("apply-button-align", {
                    target: btn,
                    align: alignment,
                  });
                }
              } catch (e) {
                /* ignore */
              }
            });
          }
        }, 100);
      } catch (e) {
        /* ignore */
      }
    });

    // Also inject styles when canvas is ready/refreshed
    this._editor.on("canvas:ready", () => {
      try {
        setTimeout(() => {
          this._injectButtonAlignPreviewStyles();
        }, 50);
      } catch (e) {
        /* ignore */
      }
    });
    //ended here

    // Image toolbar: Add/Edit Link button
    try {
      // Command to add or edit a link for the selected image
      this._editor.Commands.add("image-add-link", {
        run: (ed: any) => {
          try {
            let comp = ed.getSelected && ed.getSelected();
            if (!comp) return;

            // Resolve to the actual IMG component if a wrapper is selected
            const findImage = (m: any) => {
              let cur = m;
              // If the selected component is not an IMG, try to find an IMG within
              const isImgComp = () => {
                try {
                  const tag = (cur.get && cur.get("tagName")) || "";
                  const type = (cur.get && cur.get("type")) || "";
                  return (
                    (tag && tag.toLowerCase() === "img") || type === "image"
                  );
                } catch {
                  return false;
                }
              };
              if (isImgComp()) return cur;
              // Search children for an IMG
              try {
                const imgs = cur.find ? cur.find("img") : [];
                if (imgs && imgs.length) return imgs[0];
              } catch {
                /* ignore */
              }
              return null;
            };

            const imgComp = findImage(comp);
            if (!imgComp) return;

            // Check if image already wrapped with a link
            const parent = imgComp.parent && imgComp.parent();
            const parentTag =
              (parent && parent.get && parent.get("tagName")) || "";
            const parentType =
              (parent && parent.get && parent.get("type")) || "";
            const hasLinkParent =
              (parentTag && parentTag.toLowerCase() === "a") ||
              parentType === "link";

            const existingHref = hasLinkParent
              ? (parent.getAttributes && parent.getAttributes().href) || ""
              : "";
            const existingTarget = hasLinkParent
              ? (parent.getAttributes && parent.getAttributes().target) || ""
              : "";

            // Build modal UI
            const wrapper = document.createElement("div");
            wrapper.innerHTML = `
              <div style="padding:10px;">
                <label style="display:block; font-weight:600; margin-bottom:6px;">Link URL</label>
                <input id="img-link-href" type="text" placeholder="https://..." style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;" value="${
                  existingHref || ""
                }">
                <div style="margin-top:10px; display:flex; align-items:center; gap:8px;">
                </div>
                <div style="margin-top:12px; text-align:right; display:flex; gap:8px; justify-content:space-between;">
                  <button id="img-link-clear" class="gjs-btn" style="background:#dc3545; color:white; ${
                    hasLinkParent && existingHref ? "" : "display:none;"
                  }">Clear Link</button>
                  <div style="display:flex; gap:8px;">
                    <button id="img-link-cancel" class="gjs-btn">Cancel</button>
                    <button id="img-link-save" class="gjs-btn-prim">Save</button>
                  </div>
                </div>
              </div>
            `;
            ed.Modal.setTitle(
              hasLinkParent ? "Edit Image Link" : "Add Image Link"
            );
            ed.Modal.setContent(wrapper);
            ed.Modal.open();

            const cancelBtn =
              wrapper.querySelector<HTMLButtonElement>("#img-link-cancel");
            const saveBtn =
              wrapper.querySelector<HTMLButtonElement>("#img-link-save");
            const clearBtn =
              wrapper.querySelector<HTMLButtonElement>("#img-link-clear");
            const hrefInput =
              wrapper.querySelector<HTMLInputElement>("#img-link-href");
            const targetCheckbox =
              wrapper.querySelector<HTMLInputElement>("#img-link-target");

            const close = () => ed.Modal.close();
            cancelBtn && cancelBtn.addEventListener("click", close);

            // Clear Link button handler - removes the link wrapper and keeps only the image
            clearBtn &&
              clearBtn.addEventListener("click", () => {
                try {
                  if (hasLinkParent && parent) {
                    // Get the grandparent (where we'll move the image to)
                    const grandParent = parent.parent && parent.parent();
                    if (grandParent) {
                      const parentIndex = parent.index
                        ? parent.index()
                        : undefined;

                      // Move the image out of the link to the grandparent
                      grandParent.append(
                        imgComp,
                        typeof parentIndex === "number"
                          ? { at: parentIndex }
                          : {}
                      );

                      // Remove the now-empty link component
                      parent.remove && parent.remove();

                      // Select the image again
                      ed.select && ed.select(imgComp);
                      ed.trigger && ed.trigger("component:update", imgComp);
                    }
                  }
                } catch (e) {
                  console.warn("Clear image link failed", e);
                } finally {
                  try {
                    ed.store && ed.store();
                  } catch {
                    /* ignore */
                  }
                  close();
                }
              });

            saveBtn &&
              saveBtn.addEventListener("click", () => {
                try {
                  let url = (hrefInput?.value || "").trim();
                  const openNew = !!targetCheckbox?.checked;
                  if (!url) {
                    // If URL empty, just close without changes
                    close();
                    return;
                  }
                  // Reuse normalizeUrl from outer scope
                  url =
                    typeof (normalizeUrl as any) === "function"
                      ? (normalizeUrl as any)(url)
                      : url;

                  const attrs: any = { href: url };
                  if (openNew) attrs.target = "_blank";
                  else attrs.target = "";

                  if (hasLinkParent) {
                    // Update existing link component
                    try {
                      const curAttrs =
                        (parent.getAttributes && parent.getAttributes()) || {};
                      parent.setAttributes
                        ? parent.setAttributes({ ...curAttrs, ...attrs })
                        : parent.addAttributes &&
                          parent.addAttributes({ ...curAttrs, ...attrs });

                      // Update DOM element as well
                      const aEl =
                        parent.getEl &&
                        (parent.getEl() as HTMLAnchorElement | null);
                      if (aEl) {
                        aEl.setAttribute("href", url);
                        if (openNew) aEl.setAttribute("target", "_blank");
                        else aEl.removeAttribute("target");
                        aEl.setAttribute("rel", "noopener noreferrer");
                      }

                      parent.trigger && parent.trigger("change:attributes");
                      ed.trigger && ed.trigger("component:update", parent);
                    } catch {
                      /* ignore */
                    }
                  } else {
                    // Wrap image with a new link component
                    try {
                      const p = imgComp.parent && imgComp.parent();
                      if (!p) {
                        close();
                        return;
                      }
                      const idx = imgComp.index ? imgComp.index() : undefined;
                      const linkComp = p.append(
                        {
                          type: "link",
                          attributes: attrs,
                          style: {
                            display: "inline-block",
                            textDecoration: "none",
                          },
                        },
                        typeof idx === "number" ? { at: idx } : {}
                      );
                      // Move the image component inside the link (append moves existing comp)
                      const linkModel = Array.isArray(linkComp)
                        ? linkComp[0]
                        : linkComp;
                      if (linkModel && linkModel.append) {
                        linkModel.append(imgComp);
                      }

                      // Make sure DOM anchor has rel attr
                      try {
                        const aEl =
                          (Array.isArray(linkComp) ? linkComp[0] : linkComp)
                            ?.getEl &&
                          ((Array.isArray(linkComp)
                            ? linkComp[0]
                            : linkComp
                          ).getEl() as HTMLAnchorElement | null);
                        if (aEl) aEl.setAttribute("rel", "noopener noreferrer");
                      } catch {
                        /* ignore */
                      }

                      // Select the image again for continuity
                      ed.select && ed.select(imgComp);
                      ed.trigger &&
                        ed.trigger("component:update", linkModel || imgComp);
                    } catch {
                      /* ignore */
                    }
                  }
                } finally {
                  // Persist and close
                  try {
                    ed.store && ed.store();
                  } catch {
                    /* ignore */
                  }
                  close();
                }
              });
          } catch (e) {
            /* ignore */
          }
        },
      });

      // Command to add or edit a link for a button-like anchor (data-role="button-link")
      this._editor.Commands.add("button-add-link", {
        run: (ed: any) => {
          try {
            let comp = ed.getSelected && ed.getSelected();
            if (!comp) return;

            // Resolve to anchor component if wrapper or inner text is selected
            const findAnchorComp = (m: any) => {
              let cur = m;
              while (cur) {
                const tag = (
                  (cur.get && cur.get("tagName")) ||
                  ""
                ).toLowerCase();
                const attrs = (cur.getAttributes && cur.getAttributes()) || {};
                if (
                  tag === "a" ||
                  (attrs && attrs["data-role"] === "button-link")
                )
                  return cur;
                try {
                  const anchors = cur.find ? cur.find("a") : [];
                  if (anchors && anchors.length) return anchors[0];
                } catch (_) {
                  /* ignore */
                }
                cur = cur.parent && cur.parent();
              }
              return null;
            };

            const anchorComp = findAnchorComp(comp) || comp;
            if (!anchorComp) return;

            // Try to get DOM element for modal wiring
            let el: HTMLAnchorElement | null = null;
            try {
              el =
                anchorComp.getEl &&
                (anchorComp.getEl() as HTMLAnchorElement | null);
            } catch (_) {
              el = null;
            }

            // If el not available, attempt to resolve by data-gjs-id
            if (!el) {
              try {
                const gjsId =
                  anchorComp.getAttributes &&
                  anchorComp.getAttributes()["data-gjs-id"];
                if (gjsId) {
                  const found = this._editor
                    .getWrapper()
                    .find(`[data-gjs-id="${gjsId}"]`);
                  if (found && found.length)
                    el =
                      found[0].getEl &&
                      (found[0].getEl() as HTMLAnchorElement | null);
                }
              } catch (_) {
                /* ignore */
              }
            }

            // If we have an element, show modal; otherwise try to pass component so modal can map back
            if (el) {
              showEditLinkModal(el, anchorComp);
            } else {
              // Best-effort: ask shared modal to map via component when possible
              showEditLinkModal(
                document.createElement("a") as HTMLAnchorElement,
                anchorComp
              );
            }
          } catch (e) {
            /* ignore */
          }
        },
      });

      // Add toolbar button on image selection
      this._editor.on("component:selected", (comp: any) => {
        try {
          if (!comp) return;

          // Check if already processed to avoid re-processing
          if (comp._imageLinkToolbarAdded) return;

          const tag = ((comp.get && comp.get("tagName")) || "").toLowerCase();
          const type = (comp.get && comp.get("type")) || "";
          const isImage = tag === "img" || type === "image";
          if (!isImage) return;

          let toolbar = comp.get("toolbar") || [];
          if (toolbar.length === 0) {
            toolbar = [
              {
                attributes: { class: "fa fa-arrows", title: "Move" },
                command: "tlb-move",
              },
              {
                attributes: { class: "fa fa-trash-o", title: "Delete" },
                command: "tlb-delete",
              },
            ];
          }

          const exists = toolbar.find(
            (t: any) => t && t.command === "image-add-link"
          );
          if (!exists) {
            toolbar.push({
              attributes: { class: "fa fa-link", title: "Add/Edit Link" },
              command: "image-add-link",
            });
          }

          comp.set && comp.set("toolbar", toolbar);
          // Flag to avoid duplicate processing on frequent refreshes
          comp._imageLinkToolbarAdded = true;
        } catch (e) {
          /* ignore */
        }
      });
    } catch (e) {
      /* ignore */
    }

    this._registerCodeEditorCommand();
  }

  private _registerCustomBlocks() {
    const bm = this._editor.BlockManager;

    //     bm.add("header-block", {
    //       label: `
    //     <div style="text-align:center; padding:5px;">
    //      <img src="https://img.icons8.com/ios/50/title.png"
    //        style="width:24px; margin-bottom:10px; filter: brightness(0) invert(1);" />
    //       <div style="font-size:11px;">Header</div>
    //     </div>
    //   `,
    //       category: "Layout",
    //       content: {
    //         tagName: "header",
    //         attributes: { class: "custom-header" },
    //         components: [
    //           {
    //             tagName: "div",
    //             components: [
    //               {
    //                 tagName: "h1",
    //                 content: "My Website Header",
    //               },
    //               {
    //                 tagName: "p",
    //                 content: "Welcome to our site!",
    //               },
    //             ],
    //           },
    //         ],
    //         style: {
    //           backgroundColor: "#333",
    //           color: "#fff",
    //           padding: "20px",
    //           textAlign: "center",
    //         },
    //       },
    //     });

    //     bm.add("footer-block", {
    //       label: `
    //     <div style="text-align:center; padding:5px;">
    // <img src="https://img.icons8.com/ios/50/document-footer.png"
    //        style="width:24px; margin-bottom:10px; filter: brightness(0) invert(1);" />
    //          <div style="font-size:11px;">Footer</div>
    //     </div>
    //   `,
    //       category: "Layout",
    //       content: {
    //         tagName: "footer",
    //         attributes: { class: "custom-footer" },
    //         components: [
    //           {
    //             tagName: "div",
    //             components: [
    //               {
    //                 tagName: "h1",
    //                 content: "My Website Footer",
    //               },
    //             ],
    //           },
    //         ],
    //         style: {
    //           backgroundColor: "#222",
    //           color: "#fff",
    //           padding: "15px",
    //           textAlign: "center",
    //         },
    //       },
    //     });

    bm.add("list-item-layout", {
      label: "ListItems",
      media: `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"> <rect x="3" y="6" width="3" height="3"/> <rect x="3" y="10.5" width="3" height="3"/> <rect x="3" y="15" width="3" height="3"/> <rect x="8" y="6" width="13" height="1.5"/> <rect x="8" y="8" width="10" height="1"/> <rect x="8" y="10.5" width="13" height="1.5"/> <rect x="8" y="12" width="8" height="1"/> <rect x="8" y="15" width="13" height="1.5"/> <rect x="8" y="16.5" width="11" height="1"/> </svg>`,
      category: "Layout",
      // category: "Layout",
      content: `
    <style>
      .list-container {
        display: flex;
        flex-direction: column;
        gap: 20px;
        width: 100%;
      }

      .list-item {
        display: flex;
        align-items: flex-start;
        gap: 15px;
        flex-wrap: wrap;
      }

      .list-img {
        flex: 0 0 100px;
        max-width: 100px;
        cursor: pointer;
        width: 100px;
        height: 100px;
        object-fit: cover;
      }

      .list-content {
        flex: 1;
        min-width: 200px;
      }

      @media (max-width: 768px) {
        .list-item {
          flex-direction: column;
          align-items: flex-start;
        }

        .list-img,
        .list-content {
          width: 100% !important;
          max-width: 100% !important;
        }
      }
    </style>

    <div class="list-container">
      <div class="list-item">
        <img class="list-img" data-azure-list-img="true" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23e8e8e8'/%3E%3Ccircle cx='35' cy='35' r='8' fill='%23c0c0c0'/%3E%3Cpath d='M20 75 L35 55 L50 65 L65 45 L80 60 L80 85 L20 85 Z' fill='%23c0c0c0'/%3E%3C/svg%3E" alt="Click to add image" />
        <div class="list-content" data-gjs-droppable="true">
          <h4 style="margin: 0 0 5px; font-weight: bold;">Title here</h4>
          <p style="margin: 0; font-size: 13px;">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.</p>
        </div>
      </div>
      <div class="list-item">
        <img class="list-img" data-azure-list-img="true" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23e8e8e8'/%3E%3Ccircle cx='35' cy='35' r='8' fill='%23c0c0c0'/%3E%3Cpath d='M20 75 L35 55 L50 65 L65 45 L80 60 L80 85 L20 85 Z' fill='%23c0c0c0'/%3E%3C/svg%3E" alt="Click to add image" />
        <div class="list-content" data-gjs-droppable="true">
          <h4 style="margin: 0 0 5px; font-weight: bold;">Title here</h4>
          <p style="margin: 0; font-size: 13px;">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.</p>
        </div>
      </div>
    </div>
  `,
    });

    bm.add("grid-2-card", {
      label: "GridItems",
      media: `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"> <rect x="3" y="3" width="7" height="7" rx="1"/> <rect x="14" y="3" width="7" height="7" rx="1"/> <rect x="3" y="14" width="7" height="7" rx="1"/> <rect x="14" y="14" width="7" height="7" rx="1"/> </svg>`,
      category: "Layout",
      content: `
    <style>
      .grid-card-row {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        justify-content: space-between;
      }

      .grid-card-item {
        width: 48%;
        padding: 10px;
        box-sizing: border-box;
      }

      .grid-card-item img {
        cursor: pointer;
        width: 100%;
        height: auto;
        object-fit: cover;
      }

      @media (max-width: 768px) {
        .grid-card-item {
          width: 100% !important;
        }
      }
    </style>
    <div class="grid-card-row">
      <div class="grid-card-item" data-gjs-droppable="true">
        <img data-azure-grid-img="true" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='150' viewBox='0 0 200 150'%3E%3Crect width='200' height='150' fill='%23e8e8e8'/%3E%3Ccircle cx='60' cy='45' r='12' fill='%23c0c0c0'/%3E%3Cpath d='M30 115 L60 75 L90 95 L120 60 L150 85 L150 130 L30 130 Z' fill='%23c0c0c0'/%3E%3C/svg%3E" alt="Click to add image" style="max-width: 100%; margin-bottom: 10px;" />
        <h4 style="margin: 0 0 5px; font-weight: bold;">Title here</h4>
        <p style="margin: 0; font-size: 13px;">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
      </div>
      <div class="grid-card-item" data-gjs-droppable="true">
        <img data-azure-grid-img="true" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='150' viewBox='0 0 200 150'%3E%3Crect width='200' height='150' fill='%23e8e8e8'/%3E%3Ccircle cx='60' cy='45' r='12' fill='%23c0c0c0'/%3E%3Cpath d='M30 115 L60 75 L90 95 L120 60 L150 85 L150 130 L30 130 Z' fill='%23c0c0c0'/%3E%3C/svg%3E" alt="Click to add image" style="max-width: 100%; margin-bottom: 10px;" />
        <h4 style="margin: 0 0 5px; font-weight: bold;">Title here</h4>
        <p style="margin: 0; font-size: 13px;">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
      </div>
    </div>
  `,
    });

    bm.add("form-textarea", {
      label: `
    <div style="text-align:center; padding:5px;">
      <svg xmlns="http://www.w3.org/2000/svg" height="24" width="24" fill="#fff" viewBox="0 0 24 24" style="
    margin-bottom: 10px;
">
        <path d="M3 5v14h18V5H3zm2 2h14v2H5V7zm0 4h14v2H5v-2zm0 4h9v2H5v-2z"/>
      </svg>
      <div style="font-size:11px;">Textarea</div>
    </div>
  `,
      category: "Forms",
      content: `
    <div style="margin-bottom:10px;">
      <label for="message">Message:</label>
      <textarea name="message" placeholder="Enter your message" 
        style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px; min-height:80px;">
      </textarea>
    </div>
  `,
    });

    // Enhanced Radio Button Block with Toolbar
    const domc = this._editor.DomComponents;

    domc.addType("form-radio-group", {
      // Rehydrate custom type after refresh so toolbar persists
      isComponent: (el: HTMLElement) => {
        if (
          el.tagName === "DIV" &&
          ((el as HTMLElement).getAttribute("data-radio-group") === "true" ||
            (el as HTMLElement).classList.contains("gjs-radio-group-editor"))
        ) {
          return { type: "form-radio-group" } as any;
        }
        return undefined;
      },
      model: {
        defaults: {
          tagName: "div",
          attributes: {
            "data-radio-group": "true",
            class: "gjs-radio-group-editor",
          },
          components: [
            {
              tagName: "label",
              attributes: {
                style: "display:block; margin-bottom:8px; font-weight:600;",
              },
              content: "Choose Option:",
              toolbar: [],
              selectable: false,
              hoverable: false,
              editable: false,
            },
            {
              tagName: "label",
              attributes: { style: "display:block; margin-bottom:5px;" },
              components: [
                {
                  tagName: "input",
                  attributes: {
                    type: "radio",
                    name: "radio-group",
                    value: "option1",
                  },
                  toolbar: [],
                  selectable: false,
                  hoverable: false,
                },
                {
                  tagName: "text",
                  content: " Option 1",
                  toolbar: [],
                  selectable: false,
                  hoverable: false,
                  editable: false,
                },
              ],
              toolbar: [],
              selectable: false,
              hoverable: false,
            },
            {
              tagName: "label",
              attributes: { style: "display:block; margin-bottom:5px;" },
              components: [
                {
                  tagName: "input",
                  attributes: {
                    type: "radio",
                    name: "radio-group",
                    value: "option2",
                  },
                  toolbar: [],
                  selectable: false,
                  hoverable: false,
                },
                {
                  tagName: "text",
                  content: " Option 2",
                  toolbar: [],
                  selectable: false,
                  hoverable: false,
                  editable: false,
                },
              ],
              toolbar: [],
              selectable: false,
              hoverable: false,
            },
          ],
          style: {
            padding: "10px",
            boxSizing: "border-box",
          },
          droppable: false,
          toolbar: [
            {
              attributes: {
                class: "fa fa-list",
                title: "Manage Radio Options",
              },
              command: "radio-manage-options",
            },
            {
              attributes: {
                class: "fa fa-trash",
                title: "Delete",
              },
              command: "tlb-delete",
            },
          ],
        },
      },
    });

    bm.add("form-radio", {
      label: "Radio",
      media: `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
         viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 17a7 7 0 1 1 0-14 7 7 0 0 1 0 14zm0-10a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/>
    </svg>
  `,
      category: "Forms",
      content: { type: "form-radio-group" },
    });

    // Add CSS for radio button border in editing mode only
    this._editor.on("load", () => {
      const cdoc = this._editor.Canvas.getDocument();
      if (cdoc && !cdoc.getElementById("radio-group-editor-style")) {
        const style = cdoc.createElement("style");
        style.id = "radio-group-editor-style";
        style.innerHTML = `
          .gjs-radio-group-editor,
          [data-radio-group="true"] {
            border: 1px dashed #999 !important;
            -webkit-user-select: none !important;
            -moz-user-select: none !important;
            -ms-user-select: none !important;
            user-select: none !important;
          }
          .gjs-radio-group-editor *,
          .gjs-radio-group-editor *::selection,
          [data-radio-group="true"] *,
          [data-radio-group="true"] *::selection {
            -webkit-user-select: none !important;
            -moz-user-select: none !important;
            -ms-user-select: none !important;
            user-select: none !important;
          }
        `;
        cdoc.head.appendChild(style);
      }
    });

    // Command: Manage radio options
    this._editor.Commands.add("radio-manage-options", {
      run(editor: any) {
        const selected = editor.getSelected();
        if (!selected) return;

        // Normalize the component type/marker after reloads
        if (selected.get("type") !== "form-radio-group") {
          selected.set("type", "form-radio-group");
        }
        const curAttrs = (selected.get("attributes") || {}) as any;
        if (curAttrs["data-radio-group"] !== "true") {
          selected.set("attributes", {
            ...curAttrs,
            "data-radio-group": "true",
            class: `${curAttrs.class || ""} gjs-radio-group-editor`.trim(),
          });
        }

        if (!selected.get("attributes")["data-radio-group"]) return;

        const allComponents = selected.components();
        const radioOptions = allComponents.filter(
          (comp: any) =>
            comp.get("tagName") === "label" &&
            comp
              .components()
              .some((c: any) => c.get("attributes")?.type === "radio")
        );

        const wrapper = document.createElement("div");
        let currentOptionsData: Array<{ text: string; value: string }> = [];
        let groupName = "radio-group";

        const renderOptionsForm = (
          count: number,
          optionsData?: Array<{ text: string; value: string }>
        ) => {
          if (!optionsData) {
            currentOptionsData = Array.from({ length: count }, (_, i) => {
              const existingOption = radioOptions.at(i);
              if (existingOption) {
                const children = existingOption.components();
                const radioInput = children.find(
                  (c: any) => c.get("attributes")?.type === "radio"
                );
                // Prefer the rendered DOM text (excludes the <input>) for accuracy after refresh
                const el = (existingOption as any).view?.el as
                  | HTMLElement
                  | undefined;
                let displayText = (el?.textContent || "").trim();

                // If DOM text is empty or equals the generic placeholder, fall back to component scan
                const DEFAULT_PLACEHOLDER = "Double-click to edit text";
                if (!displayText || displayText === DEFAULT_PLACEHOLDER) {
                  // Find display text from either a textnode, a 'text' component, or a span that contains a textnode
                  displayText = "";
                  let textComp = children.find((c: any) => {
                    const typ = c.get && c.get("type");
                    const tg = c.get && c.get("tagName");
                    if (tg === "input") return false;
                    return (
                      typ === "textnode" || typ === "text" || tg === "span"
                    );
                  });

                  if (textComp) {
                    const typ = textComp.get("type");
                    const tg = textComp.get("tagName");
                    if (typ === "textnode" || typ === "text") {
                      displayText = (textComp.get("content") || "").trim();
                    } else if (tg === "span") {
                      try {
                        const innerNodes = textComp
                          .components()
                          ?.filter((cn: any) => cn.get("type") === "textnode")
                          ?.map((cn: any) => cn.get("content") || "");
                        displayText = (
                          innerNodes?.join("") ||
                          textComp.get("content") ||
                          ""
                        ).trim();
                      } catch (_) {
                        displayText = (textComp.get("content") || "").trim();
                      }
                    }
                  }
                }

                const value = radioInput?.get("attributes")?.value || "";
                const text = displayText;

                if (i === 0 && radioInput) {
                  groupName =
                    radioInput.get("attributes")?.name || "radio-group";
                }

                return { text, value };
              }
              return { text: "", value: "" };
            });
          } else {
            currentOptionsData = optionsData;
          }

          const optionsHtml = currentOptionsData
            .map((opt, i) => {
              return `
            <div class="option-row" style="padding:12px; margin-bottom:10px; border:1px solid #ddd; border-radius:6px; background:#f9f9f9;">
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
                <span style="font-weight:600; min-width:80px;">Option ${
                  i + 1
                }:</span>
                <button class="remove-radio-btn" data-index="${i}" style="margin-left:auto; padding:4px 8px; background:#d9534f; color:white; border:none; border-radius:4px; cursor:pointer; font-size:11px;">
                  <i class="fa fa-trash"></i> Remove
                </button>
              </div>
              <div style="margin-bottom:8px;">
                <label style="display:block; font-size:12px; margin-bottom:4px; color:#666;">Display Text:</label>
                <input type="text" class="radio-text" data-index="${i}" 
                       placeholder="Option ${i + 1}" value="${opt.text}"
                       style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px; box-sizing:border-box;">
              </div>
              <div>
                <label style="display:block; font-size:12px; margin-bottom:4px; color:#666;">Value:</label>
                <input type="text" class="radio-value" data-index="${i}" 
                       placeholder="option${i + 1}" value="${opt.value}"
                       style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px; box-sizing:border-box;">
              </div>
            </div>
          `;
            })
            .join("");

          return `
          <div style="padding:15px;">
            <div style="margin-bottom:16px;">
              <label style="display:block; font-weight:600; margin-bottom:8px;">Number of Options:</label>
              <div style="display:flex; gap:8px; align-items:center;">
                <input id="radio-count" type="number" min="1" max="50" value="${currentOptionsData.length}" 
                       style="width:100px; padding:8px; border:1px solid #ccc; border-radius:4px;">
                <button id="update-radio-count-btn" class="gjs-btn-prim" style="padding:8px 16px;">
                  Update
                </button>
              </div>
              <small style="display:block; margin-top:4px; color:#666;">Change this to add or remove option fields</small>
            </div>
            
            <div style="max-height:400px; overflow-y:auto; margin-bottom:16px; padding-right:8px;">
              ${optionsHtml}
            </div>
            
            <div style="border-top:1px solid #ddd; padding-top:12px; display:flex; gap:8px; justify-content:flex-end;">
              <button id="radio-cancel" class="gjs-btn">Cancel</button>
              <button id="radio-save" class="gjs-btn-prim">Save All Options</button>
            </div>
          </div>
        `;
        };

        wrapper.innerHTML = renderOptionsForm(Math.max(radioOptions.length, 1));

        editor.Modal.setTitle("Manage Radio Button Options");
        editor.Modal.setContent(wrapper);
        editor.Modal.open();

        const attachEventListeners = () => {
          const updateBtn = wrapper.querySelector("#update-radio-count-btn");
          const input = wrapper.querySelector(
            "#radio-count"
          ) as HTMLInputElement;

          updateBtn?.addEventListener("click", () => {
            const newCount = parseInt(input.value, 10);
            if (newCount >= 1 && newCount <= 50) {
              const textInputs = Array.from(
                wrapper.querySelectorAll(".radio-text")
              ) as HTMLInputElement[];
              const valueInputs = Array.from(
                wrapper.querySelectorAll(".radio-value")
              ) as HTMLInputElement[];

              const currentData = textInputs.map((textInput, i) => ({
                text: textInput.value.trim(),
                value: valueInputs[i].value.trim(),
              }));

              if (newCount > currentData.length) {
                for (let i = currentData.length; i < newCount; i++) {
                  currentData.push({ text: "", value: "" });
                }
              } else {
                currentData.length = newCount;
              }

              wrapper.innerHTML = renderOptionsForm(newCount, currentData);
              attachEventListeners();
            }
          });

          wrapper.querySelectorAll(".remove-radio-btn").forEach((btn) => {
            btn.addEventListener("click", (e) => {
              e.preventDefault();

              const indexToRemove = parseInt(
                (btn as HTMLElement).getAttribute("data-index") || "0",
                10
              );

              const textInputs = Array.from(
                wrapper.querySelectorAll(".radio-text")
              ) as HTMLInputElement[];
              const valueInputs = Array.from(
                wrapper.querySelectorAll(".radio-value")
              ) as HTMLInputElement[];

              const currentData = textInputs.map((textInput, i) => ({
                text: textInput.value.trim(),
                value: valueInputs[i].value.trim(),
              }));

              if (currentData.length > 1) {
                currentData.splice(indexToRemove, 1);
                wrapper.innerHTML = renderOptionsForm(
                  currentData.length,
                  currentData
                );
                attachEventListeners();
              } else {
                alert("At least one radio option must remain.");
              }
            });
          });

          const cancelBtn = wrapper.querySelector("#radio-cancel");
          cancelBtn?.addEventListener("click", () => editor.Modal.close());

          const saveBtn = wrapper.querySelector("#radio-save");
          saveBtn?.addEventListener("click", () => {
            const textInputs = Array.from(
              wrapper.querySelectorAll(".radio-text")
            ) as HTMLInputElement[];
            const valueInputs = Array.from(
              wrapper.querySelectorAll(".radio-value")
            ) as HTMLInputElement[];

            const newOptionsData = textInputs.map((textInput, i) => ({
              text: textInput.value.trim() || `Option ${i + 1}`,
              value: valueInputs[i].value.trim() || `option${i + 1}`,
            }));

            const components = selected.components();
            const firstLabel = components.at(0);

            components.reset();

            // Ensure marker attributes persist for rehydration
            const sAttrs = (selected.get("attributes") || {}) as any;
            selected.set("attributes", {
              ...sAttrs,
              "data-radio-group": "true",
              class: `${sAttrs.class || ""} gjs-radio-group-editor`.trim(),
            });

            if (
              firstLabel &&
              firstLabel.get("tagName") === "label" &&
              !firstLabel
                .components()
                .some((c: any) => c.get("attributes")?.type === "radio")
            ) {
              components.add(firstLabel);
            } else {
              components.add({
                tagName: "label",
                attributes: {
                  style: "display:block; margin-bottom:8px; font-weight:600;",
                },
                content: "Choose Option:",
                selectable: false,
                hoverable: false,
                editable: false,
              });
            }

            const newComponents = newOptionsData.map((opt) => ({
              tagName: "label",
              attributes: { style: "display:block; margin-bottom:5px;" },
              selectable: false,
              hoverable: false,
              components: [
                {
                  tagName: "input",
                  attributes: {
                    type: "radio",
                    name: groupName,
                    value: opt.value,
                  },
                  selectable: false,
                  hoverable: false,
                },
                {
                  // Use a raw text node to avoid GrapesJS injecting placeholder text
                  type: "textnode",
                  content: ` ${opt.text}`,
                  selectable: false,
                  hoverable: false,
                  editable: false,
                },
              ],
            }));

            components.add(newComponents);

            // Enforce non-selectable flags across all option parts (legacy safety)
            try {
              // All labels inside the group
              const allLabels = selected.find && selected.find("label");
              (allLabels || []).forEach((l: any) => {
                l.set && l.set({ selectable: false, hoverable: false });
              });

              // All inputs of type radio inside the group
              const allInputs = selected.find && selected.find("input");
              (allInputs || []).forEach((inp: any) => {
                try {
                  const at = inp.getAttributes && inp.getAttributes();
                  if (at && at.type === "radio") {
                    inp.set && inp.set({ selectable: false, hoverable: false });
                  }
                } catch (_) {
                  /* ignore */
                }
              });

              // All text nodes defined with tagName 'text'
              const allNodes = selected.find && selected.find("*");
              (allNodes || []).forEach((n: any) => {
                try {
                  const tag = (n.get && n.get("tagName")) || "";
                  const typ = (n.get && n.get("type")) || "";
                  if (
                    String(tag).toLowerCase() === "text" ||
                    String(typ).toLowerCase() === "textnode" ||
                    String(typ).toLowerCase() === "text"
                  ) {
                    n.set &&
                      n.set({
                        selectable: false,
                        hoverable: false,
                        editable: false,
                      });
                  }
                } catch (_) {
                  /* ignore */
                }
              });
            } catch (_) {
              /* ignore */
            }

            selected.view?.render();
            editor.trigger("component:update", selected);

            editor.Modal.close();
          });
        };

        const updateCountBtn = wrapper.querySelector("#update-radio-count-btn");
        updateCountBtn?.addEventListener("click", () => {
          const countInput = wrapper.querySelector(
            "#radio-count"
          ) as HTMLInputElement;
          const newCount = parseInt(countInput.value, 10);
          if (newCount >= 1 && newCount <= 50) {
            const textInputs = Array.from(
              wrapper.querySelectorAll(".radio-text")
            ) as HTMLInputElement[];
            const valueInputs = Array.from(
              wrapper.querySelectorAll(".radio-value")
            ) as HTMLInputElement[];

            const currentData = textInputs.map((textInput, i) => ({
              text: textInput.value.trim(),
              value: valueInputs[i].value.trim(),
            }));

            if (newCount > currentData.length) {
              for (let i = currentData.length; i < newCount; i++) {
                currentData.push({ text: "", value: "" });
              }
            } else {
              currentData.length = newCount;
            }

            wrapper.innerHTML = renderOptionsForm(newCount, currentData);
            attachEventListeners();
          }
        });

        attachEventListeners();
      },
    });

    // Checkbox Block
    bm.add("form-checkbox", {
      label: "Checkbox",
      media: `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
         viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V5a2 2 0 0 0-2-2zm-9 14L5 12.5l1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
    </svg>
  `,
      category: "Forms",
      content: `
    <div style="margin-bottom:10px;">
      <label><input type="checkbox" name="agree" /> I agree to the terms</label>
    </div>
  `,
    });

    // Define custom input component type with character limit
    this._editor.DomComponents.addType("form-input", {
      isComponent: (el: HTMLElement) =>
        el.tagName === "INPUT" &&
        el.getAttribute("data-gjs-type") === "form-input",
      model: {
        defaults: {
          tagName: "input",
          attributes: {
            type: "text",
            placeholder: "Enter text",
            maxlength: "100",
            "data-gjs-type": "form-input",
          },
          traits: [
            {
              type: "text",
              label: "Name",
              name: "name",
            },
            {
              type: "text",
              label: "Placeholder",
              name: "placeholder",
            },
            {
              type: "number",
              label: "Max Length",
              name: "maxlength",
              min: 1,
              max: 500,
            },
            {
              type: "text",
              label: "Value",
              name: "value",
            },
          ],
          script: function () {
            const input = this as unknown as HTMLInputElement;
            const maxLen = parseInt(
              input.getAttribute("maxlength") || "100",
              10
            );

            input.addEventListener("input", function () {
              if (this.value.length > maxLen) {
                this.value = this.value.slice(0, maxLen);
              }
            });

            input.addEventListener("keypress", function (e: KeyboardEvent) {
              if (this.value.length >= maxLen) {
                e.preventDefault();
              }
            });

            input.addEventListener("paste", function (e: ClipboardEvent) {
              setTimeout(() => {
                if (this.value.length > maxLen) {
                  this.value = this.value.slice(0, maxLen);
                }
              }, 0);
            });
          },
        },
      },
    });
    bm.add("form-input", {
      label: `
    <div style="text-align:center; padding:5px;">
      <svg xmlns="http://www.w3.org/2000/svg" height="24" width="24" viewBox="0 0 24 24" fill="#fff" style="
    margin-bottom: 10px;
">
        <path d="M4 17h16V7H4v10zm0 2q-.825 0-1.413-.588Q2 17.825 2 17V7q0-.825.587-1.412Q3.175 5 4 5h16q.825 0 1.413.588Q22 6.175 22 7v10q0 .825-.587 1.412Q20.825 19 20 19Zm3-4h2v-2H7v2Z"/>
      </svg>
      <div style="font-size:11px;">Input</div>
    </div>
  `,
      category: "Forms",
      content: {
        type: "form-input",
      },
    });
    // Select Dropdown
    bm.add("form-select", {
      label: `
    <div style="text-align:center; padding:5px;">
      <svg xmlns="http://www.w3.org/2000/svg" height="24" width="24" fill="#fff" viewBox="0 0 24 24" style="
    margin-bottom: 10px;
">
        <path d="M7 10l5 5 5-5H7z"/>
      </svg>
      <div style="font-size:11px;">Select</div>
    </div>
  `,
      category: "Forms",
      content: `
    <div style="margin-bottom:10px;">
      <label for="select-option">Select Option:</label>
      <select name="select-option" 
        style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
        <option value="">-- Select --</option>
        <option value="opt1">Option 1</option>
        <option value="opt2">Option 2</option>
        <option value="opt3">Option 3</option>
      </select>
    </div>
  `,
    });

    // Label (Only Label Element)
    bm.add("form-label", {
      label: "Label",
      media: `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="#ff80ab">
      <path d="M17.63 5.84C17.27 5.33 16.67 5 16 5H5c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h11c.67 0 1.27-.33 1.63-.84L22 12l-4.37-6.16z"/>
    </svg>
  `,
      category: "Forms",
      content: `
    <label style="display:block; margin-bottom:6px;">Label Text</label>
  `,
    });

    // Countdown timer is now a proper plugin - see Plugins/CountdownPlugin.ts

    bm.add("tooltip", {
      label: "Tooltip",
      media: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-4l-4 4-4-4H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
</svg>`,
      category: "Custom Blocks",
      content: `
    <span style="position:relative; cursor:help;" title="This is a tooltip!">
      Hover me for tooltip
    </span>
  `,
    });

    bm.add("tabs-block", {
      label: "Tabs",
      media: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="3" y="6" width="18" height="12" rx="1" stroke="currentColor" stroke-width="1" fill="none"/>
  <rect x="4" y="4" width="4" height="4" rx="0.5" fill="currentColor"/>
  <rect x="10" y="4" width="4" height="4" rx="0.5" fill="currentColor"/>
  <rect x="16" y="4" width="4" height="4" rx="0.5" fill="currentColor"/>
</svg>`,
      category: "Layout",
      content: `
    <div class="tabs" style="margin-bottom:10px;">
      <div class="tab-buttons" style="display:flex; gap:10px; margin-bottom:10px;">
        <button class="tab-btn" data-tab="0">Tab 1</button>
        <button class="tab-btn" data-tab="1">Tab 2</button>
      </div>
      <div class="tab-content">
        <div class="tab" style="display:block;">This is content for Tab 1.</div>
        <div class="tab" style="display:none;">This is content for Tab 2.</div>
      </div>
    </div>
    <script>
      const tabsContainer = this.closest ? this.closest('.tabs') : document.querySelector('.tabs');
      const buttons = tabsContainer.querySelectorAll('.tab-btn');
      const contents = tabsContainer.querySelectorAll('.tab');
      buttons.forEach(btn => {
        btn.addEventListener('click', () => {
          const index = parseInt(btn.dataset.tab);
          contents.forEach((tab, i) => {
            tab.style.display = i === index ? 'block' : 'none';
          });
        });
      });
    </script>
  `,
    });

    //   bm.add("typed-text", {
    //     label: `
    //   <div style="text-align:center; padding:5px;">
    //     <svg width="24" height="24" viewBox="0 0 24 24" fill="#ffffff" xmlns="http://www.w3.org/2000/svg" style="margin-bottom:10px;">
    //       <path d="M4 4H20V6H4V4ZM4 10H14V12H4V10ZM4 16H10V18H4V16Z"/>
    //     </svg>
    //     <div style="font-size:11px;">Typed</div>
    //   </div>
    // `,
    //     category: "Extra",
    //     content: `
    //   <div class="typed-wrapper" style="font-size: 24px; font-weight: bold;">
    //     <span class="typed-text"></span>
    //   </div>
    //   <script>
    //     (function() {
    //       // Load typed.js only if not already loaded
    //       if (!window.Typed) {
    //         const script = document.createElement('script');
    //         script.src = 'https://cdn.jsdelivr.net/npm/typed.js@2.0.12';
    //         script.onload = function () {
    //           new Typed('.typed-text', {
    //             strings: ['Text Row One', 'Text Row Two', 'More dynamic text...'],
    //             typeSpeed: 50,
    //             backSpeed: 25,
    //             loop: true
    //           });
    //         };
    //         document.body.appendChild(script);
    //       } else {
    //         new Typed('.typed-text', {
    //           strings: ['Text Row One', 'Text Row Two', 'More dynamic text...'],
    //           typeSpeed: 50,
    //           backSpeed: 25,
    //           loop: true
    //         });
    //       }
    //     })();
    //   </script>
    // `,
    //   });

    bm.add("form-button", {
      label: `
    <div style="text-align:center;">
      <svg xmlns="http://www.w3.org/2000/svg" height="24" width="24" fill="#fff" viewBox="0 0 24 24" style="
    margin-bottom: 10px;
">
        <path d="M4 10v4h16v-4H4zm0-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2z"/>
      </svg>
      <div style="font-size:11px;">Button</div>
    </div>
  `,
      category: "Forms",
      content: {
        type: "link",
        editable: true,
        attributes: {
          href: "#",
          "data-role": "button-link",
          "data-gjs-editable": "true",
          "data-btn-align": "left",
          class: "pcf-btn",
        },
        style: {
          alignSelf: "flex-start",
          background: "#007bff",
          color: "white",
          border: "0",
          padding: "12px 20px",
          fontWeight: "700",
          cursor: "pointer",
          textDecoration: "none",
          display: "inline-block",
          marginLeft: "0",
          marginRight: "auto",
        },
        components: [
          {
            type: "text",
            tagName: "span",
            editable: true,
            removable: false,
            draggable: false,
            selectable: true,
            attributes: { "data-gjs-type": "text" },
            content: "Click Me",
          },
        ],
      },
    });
    bm.add("custom-webpart", {
      label: "CustomCode",
      media: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <text x="12" y="16" text-anchor="middle" font-family="monospace" font-size="14" fill="#080808ff">&lt;/&gt;</text>
</svg>`,
      category: "Custom Blocks",
      content: `<div class="custom-webpart" data-type="webpart">Custom Block Content</div>`,
      selectable: true,
    });

    this._editor.on("component:selected", (component: any) => {
      if (component?.getEl()?.classList.contains("custom-webpart")) {
        const attrs = component.getAttributes();

        component.set({
          traits: [
            {
              name: "title",
              label: "Webpart Title",
              type: "text",
              changeProp: 1,
            },
            {
              name: "bgColor",
              label: "Background Color",
              type: "color",
              changeProp: 1,
            },
          ],
          attributes: {
            title: attrs.title || "",
            bgColor: attrs.bgColor || "#ffffff",
          },
        });

        component.on("change:attributes:title", () => {
          const title = component.getAttributes().title;
          component.components(`<div>${title}</div>`);
        });

        component.on("change:attributes:bgColor", () => {
          const bg = component.getAttributes().bgColor;
          component.addStyle({ "background-color": bg });
        });
      }
    });

    // NOTE: Button toolbar handler is already registered at line 1664
    // This duplicate handler has been removed to prevent toolbar conflicts

    // Ensure button styling is preserved after any component updates
    this._editor.on("component:update", (component: any) => {
      try {
        if (!component) return;
        const tag = (
          (component.get && component.get("tagName")) ||
          ""
        ).toLowerCase();
        const attrs =
          (component.getAttributes && component.getAttributes()) || {};
        const isBtnComponent =
          (tag === "a" && attrs["data-role"] === "button-link") ||
          tag === "button";

        if (isBtnComponent) {
          // Re-inject styles to ensure button appearance is maintained
          setTimeout(() => {
            try {
              this._injectButtonAlignPreviewStyles();
            } catch {
              /* ignore */
            }
          }, 50);
        }
      } catch (e) {
        /* ignore */
      }
    });

    // Runtime hardening for Radio Group selection behavior
    const getRadioGroupAncestor = (cmp: any) => {
      let cur = cmp as any;
      while (cur) {
        try {
          const type = cur.get && cur.get("type");
          const attrs = (cur.getAttributes && cur.getAttributes()) || {};
          const hasMarker = attrs["data-radio-group"] === "true";
          const cls = (cur.getClasses && cur.getClasses()) || [];
          if (
            type === "form-radio-group" ||
            hasMarker ||
            (Array.isArray(cls) && cls.indexOf("gjs-radio-group-editor") > -1)
          ) {
            return cur;
          }
          cur = cur.parent && cur.parent();
        } catch (_) {
          break;
        }
      }
      return null;
    };

    const makeRadioChildrenUnselectable = (group: any) => {
      try {
        // Labels
        (group.find && group.find("label"))?.forEach(
          (l: any) =>
            l.set &&
            l.set({ selectable: false, hoverable: false, editable: false })
        );
        // Inputs (type=radio)
        (group.find && group.find("input"))?.forEach((inp: any) => {
          try {
            const at = inp.getAttributes && inp.getAttributes();
            if (at && at.type === "radio") {
              inp.set &&
                inp.set({
                  selectable: false,
                  hoverable: false,
                  editable: false,
                });
            }
          } catch (_) {
            /* ignore */
          }
        });
        // Text nodes / text components
        (group.find && group.find("*"))?.forEach((n: any) => {
          try {
            const tag = (n.get && n.get("tagName")) || "";
            const typ = (n.get && n.get("type")) || "";
            if (
              String(tag).toLowerCase() === "text" ||
              String(typ).toLowerCase() === "textnode" ||
              String(typ).toLowerCase() === "text"
            ) {
              n.set &&
                n.set({ selectable: false, hoverable: false, editable: false });
            }
          } catch (_) {
            /* ignore */
          }
        });
      } catch (_) {
        /* ignore */
      }
    };

    // Enforce on load for existing groups
    try {
      this._editor.on("load", () => {
        try {
          const wrapper = this._editor.DomComponents.getWrapper();
          const groups = wrapper.find(
            '[data-radio-group="true"], .gjs-radio-group-editor'
          );
          (groups || []).forEach((g: any) => makeRadioChildrenUnselectable(g));
        } catch (_) {
          /* ignore */
        }
      });
    } catch (_) {
      /* ignore */
    }

    // Redirect accidental selection of radio children back to the group
    try {
      this._editor.on("component:selected", (cmp: any) => {
        try {
          if (!cmp) return;
          const grp = getRadioGroupAncestor(cmp);
          if (grp && grp !== cmp) {
            // ensure children are locked
            makeRadioChildrenUnselectable(grp);
            // redirect selection to the group
            this._editor.select && this._editor.select(grp);
          }
        } catch (_) {
          /* ignore */
        }
      });
    } catch (_) {
      /* ignore */
    }
  }

  //This code is for showing the preview in the portal site.

  private _registerCodeEditorCommand(recordId?: string) {
    this._editor.Commands.add("open-preview-tab", {
      run: (editor: any) => {
        try {
          // Try to get the Knowledge Article Id
          let kbId = recordId;

          // If not passed via property, try to extract from the URL
          if (!kbId) {
            const params = new URLSearchParams(window.location.search);
            kbId = params.get("id") || "";
          }

          if (!kbId) {
            alert("Knowledge Article Id not found!");
            return;
          }

          // Build the final preview URL
          const previewUrl = `https://cdph.powerappsportals.com/preview/?id=${kbId}`;

          // Open in a new browser tab
          window.open(previewUrl, "_blank");
        } catch (err) {
          console.error("Error while opening preview:", err);
        }
      },
    });

    // This is for showing the preview in the local.
    // private _registerCodeEditorCommand() {
    //   this._editor.Commands.add("open-preview-tab", {
    //     run: (editor: any) => {
    //       // Commit any inline edits before extracting HTML/CSS
    //       try {
    //         const frameEl = this._editor.Canvas.getFrameEl();
    //         const frameDoc =
    //           frameEl?.contentDocument || frameEl?.contentWindow?.document;
    //         const ae = frameDoc?.activeElement as HTMLElement | null;
    //         if (
    //           ae &&
    //           ae.getAttribute &&
    //           ae.getAttribute("contenteditable") === "true"
    //         ) {
    //           ae.blur();
    //         }
    //       } catch {
    //         /* ignore */
    //       }
    //       try {
    //         this._editor.trigger && this._editor.trigger("component:update");
    //       } catch {
    //         /* ignore */
    //       }

    //       const htmlRaw = this._editor.getHtml();
    //       const html = htmlRaw.replace(/border:\s*1px\s*dashed\s*#999;?/gi, "");
    //       const css = this._editor.getCss();

    //       const parser = new DOMParser();
    //       const doc: Document = parser.parseFromString(html, "text/html");

    //       // Remove all contenteditable attributes before preview
    //       const editableEls =
    //         doc.querySelectorAll<HTMLElement>("[contenteditable]");
    //       editableEls.forEach((el: HTMLElement) => {
    //         el.removeAttribute("contenteditable");
    //       });

    //       // Remove all data-gjs-editable attributes before preview
    //       const editableDataEls = doc.querySelectorAll<HTMLElement>(
    //         "[data-gjs-editable]"
    //       );
    //       editableDataEls.forEach((el: HTMLElement) => {
    //         el.removeAttribute("data-gjs-editable");
    //       });

    //       // Remove all tabindex attributes (optional, prevents accidental focus)
    //       const tabIndexEls = doc.querySelectorAll<HTMLElement>("[tabindex]");
    //       tabIndexEls.forEach((el: HTMLElement) => {
    //         el.removeAttribute("tabindex");
    //       });

    //       // Remove all spellcheck attributes (optional)
    //       const spellcheckEls = doc.querySelectorAll<HTMLElement>("[spellcheck]");
    //       spellcheckEls.forEach((el: HTMLElement) => {
    //         el.removeAttribute("spellcheck");
    //       });

    //       const cleanedHtml = doc.body.innerHTML;

    //       // Build dynamic CSS to persist bullet colors in preview from data-bullet-color attributes
    //       let bulletColorCss = "";
    //       try {
    //         const bulletEls = doc.querySelectorAll(
    //           "li.gjs-advanced-bullet-item[data-bullet-color]"
    //         );
    //         const colors = new Set<string>();
    //         bulletEls.forEach((el) => {
    //           const c =
    //             (el as HTMLElement).getAttribute("data-bullet-color") || "";
    //           if (c) colors.add(c);
    //         });
    //         if (colors.size > 0) {
    //           bulletColorCss = Array.from(colors)
    //             .map(
    //               (c) =>
    //                 `li.gjs-advanced-bullet-item[data-bullet-color="${c}"]::marker{color:${c} !important;}\nli.gjs-advanced-bullet-item[data-bullet-color="${c}"]{--bullet-color:${c};}`
    //             )
    //             .join("\n");
    //         }
    //       } catch {
    //         /* ignore */
    //       }

    //       const previewWindow = window.open("", "_blank");
    //       if (previewWindow) {
    //         previewWindow.document.open();
    //         previewWindow.document.write(`
    //             <!DOCTYPE html>
    //             <html lang="en">
    //               <head>
    //                 <meta charset="UTF-8" />
    //                 <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    //                 <title>Preview</title>
    //                 <!-- External resources mirroring canvas.styles order -->
    //                 <link rel="stylesheet" href="https://www.cdph.ca.gov/Style%20Library/CDPH/css/bootstrap.min.css" />
    //                 <link rel="stylesheet" href="https://cdphsharepointstorage.blob.core.windows.net/assets/styles.css" />
    //                 <script src="/Bootstrap5.3.7.js"></script>
    //                <style>
    //                   body {
    //                     margin: 0;
    //                     padding: 0;
    //                     box-sizing: border-box;
    //                     font-family: sans-serif;
    //                   }
    //                   [style*="dashed"] { border: none !important; outline:none !important; }
    //                   .gjs-com-dashed, .gjs-com-dashed * { outline: none !important; }
    //                   .custom-menu-container { scrollbar-width: none !important; -ms-overflow-style: none !important; overscroll-behavior: contain; }
    //                   .custom-menu-container::-webkit-scrollbar { width:0 !important; height:0 !important; display:none !important; }
    //                   ul, ol { list-style-position: outside; }
    //                   .gjs-advanced-bullet-item { cursor: pointer; position: relative; transition: background .15s, color .15s; }
    //                   /* Remove hover background in preview for bullet items */
    //                   .gjs-advanced-bullet-item:hover { background: transparent !important; }
    //                    .gjs-advanced-bullet-item.preview-selected::before {
    //                     /* Remove left blue border indicator in preview */
    //                     content: none !important; position: static !important; left: auto !important; top: auto !important; bottom: auto !important; width: 0 !important; background: transparent !important; border-radius: 0 !important; }
    //                   /* Do not show selection styling inside the horizontal menu */
    //                   .pcf-hmenu li.preview-selected::before { content: none !important; background: transparent !important; width: 0 !important; }
    //                   .pcf-hmenu li.preview-selected a,
    //                   .pcf-hmenu li.preview-selected span,
    //                   .pcf-hmenu li.preview-selected strong,
    //                   .pcf-hmenu .submenu li.preview-selected a,
    //                   .pcf-hmenu .submenu li.preview-selected span,
    //                   .pcf-hmenu .submenu li.preview-selected strong { color: inherit !important; }
    //                   /* Preview-only: show submenu on click (not hover) */
    //                   .pcf-hmenu .submenu { display: none; }
    //                   .pcf-hmenu li.open > .submenu { display: block; }
    //                   /* Ensure horizontal menu alignment matches editor in preview */
    //                   .pcf-hmenu .hmenu { align-items: stretch !important; }
    //                   .pcf-hmenu .hmenu { border-bottom: none !important; }
    //                   .pcf-hmenu .hmenu > li { height: 40px !important; display: flex !important; align-items: center !important; padding: 15px !important; margin: 0px 0px 5px !important; }
    //                   .pcf-hmenu .hmenu > li > a { display: flex !important; align-items: center !important; gap: 6px !important; height: 100% !important; margin: 0 !important; }
    //                   .pcf-hmenu .hmenu > li > a, .pcf-hmenu .hmenu > li > a * { margin: 0 !important; padding: 0 !important; }
    //                   .pcf-hmenu .submenu { top: calc(100% - 8px) !important; margin: 0 !important; padding: 0 !important; transform: none !important; }
    //                   .pcf-hmenu .submenu > li { padding: 0 !important; margin: 0 !important; }
    //                   /* Ensure marker uses CSS variable (fallback to default) */
    //                   li.gjs-advanced-bullet-item::marker { color: var(--bullet-color, #555); }
    //                   /* Dynamic bullet colors detected in HTML */
    //                   ${bulletColorCss}
    //                   ${css}
    //                 </style>
    //               </head>
    //               <body>${cleanedHtml}
    //                 <script>
    //                    (function(){

    //     var btn = document.querySelector('.backtoTop');
    //       if (btn) {
    //         // Start hidden
    //         btn.style.display = "none";

    //         // Show/hide on scroll
    //         window.addEventListener('scroll', function(){
    //           if (window.scrollY > 100) {
    //             btn.style.display = "flex"; // show (keeps flex layout for centering)
    //           } else {
    //             btn.style.display = "none"; // hide
    //           }
    //         });

    //         // Click handler
    //         btn.addEventListener('click', function(e){
    //           e.stopPropagation();
    //           window.scrollTo({ top: 0, behavior: 'smooth' });
    //         });
    //       }

    //                     function updateBulletLinkClasses() {
    //                       var links = document.querySelectorAll('.bm-text');
    //                       for (var i = 0; i < links.length; i++) {
    //                         var el = links[i];
    //                         var href = el.getAttribute('href');
    //                         if (href && href !== '#' && href.trim() !== '') {
    //                           el.classList.add('bm-link');
    //                         } else {
    //                           el.classList.remove('bm-link');
    //                         }
    //                       }
    //                     }
    //                     updateBulletLinkClasses();
    //                     // Horizontal menu: navigate if href set, else toggle dropdown on click (supports text-only items)
    //                     document.addEventListener('click', function(ev){
    //                       var tgt = ev.target;
    //                       if(!(tgt instanceof Element)) return;
    //                       // Detect top-level menu anchor or LI
    //                       var hAnchor = tgt.closest && tgt.closest('.pcf-hmenu .hmenu > li > a');
    //                       var hItem = tgt.closest && tgt.closest('.pcf-hmenu .hmenu > li');
    //                       if (hAnchor || hItem) {
    //                         var li = (hAnchor && hAnchor.closest('li')) || hItem;
    //                         if (!li) return;
    //                         var nav = li.closest('.pcf-hmenu');
    //                         if (!nav) return;
    //                         // Toggle only if submenu exists under this LI
    //                         var submenu = null;
    //                         var kids = li.children || [];
    //                         for (var k = 0; k < kids.length; k++) {
    //                           var n = kids[k];
    //                           if (n && n.tagName === 'UL' && n.classList && n.classList.contains('submenu')) { submenu = n; break; }
    //                         }
    //                         if (!submenu) {
    //                           return; // nothing to toggle; let default behavior happen
    //                         }
    //                         // Determine link behavior
    //                         var href = '';
    //                         var hasUrl = false;
    //                         var anchorInItem = li.querySelector('a');
    //                         if (hAnchor) {
    //                           href = hAnchor.getAttribute('href') || '';
    //                           hasUrl = href && href.trim() !== '' && href.trim() !== '#';
    //                           if (hasUrl) {
    //                             // Allow normal navigation when a real URL is provided
    //                             return;
    //                           }
    //                           // No URL: prevent navigation and toggle dropdown
    //                           ev.preventDefault();
    //                         } else if (anchorInItem) {
    //                           // Clicked LI; if inner anchor has real URL, navigate
    //                           var href2 = anchorInItem.getAttribute('href') || '';
    //                           var hasUrl2 = href2 && href2.trim() !== '' && href2.trim() !== '#';
    //                           if (hasUrl2) {
    //                             var tgt2 = anchorInItem.getAttribute('target') || '';
    //                             // Open in new tab if ctrl/meta pressed, otherwise respect target attribute
    //                             if (ev.ctrlKey || ev.metaKey) {
    //                               window.open(href2, '_blank');
    //                             } else {
    //                               window.open(href2, tgt2 ? tgt2 : '_self');
    //                             }
    //                             return;
    //                           }
    //                           // Otherwise, allow toggle on LI click when there's no real URL
    //                         }
    //                         // Close other open items in this menu
    //                         var opened = nav.querySelectorAll('li.open');
    //                         for (var i = 0; i < opened.length; i++) {
    //                           if (opened[i] !== li) opened[i].classList.remove('open');
    //                         }
    //                         li.classList.toggle('open');
    //                         return;
    //                       }
    //                       // Click outside any horizontal menu closes all
    //                       var insideHmenu = tgt.closest && tgt.closest('.pcf-hmenu');
    //                       if (!insideHmenu) {
    //                         var allOpen = document.querySelectorAll('.pcf-hmenu li.open');
    //                         for (var j = 0; j < allOpen.length; j++) allOpen[j].classList.remove('open');
    //                       }
    //                     }, true);
    //                     // Advanced bullet: selection highlight
    //                     document.addEventListener('click', function(ev){
    //                       var tgt = ev.target;
    //                       if(!(tgt instanceof Element)) return;
    //                       var liEl = tgt.closest('li');
    //                       if(!liEl) return;
    //                       var selected = document.querySelectorAll('.preview-selected');
    //                       for(var i=0;i<selected.length;i++){ selected[i].classList.remove('preview-selected'); }
    //                       liEl.classList.add('preview-selected');
    //                       updateBulletLinkClasses();
    //                     });
    //                   })();
    //                 </script>
    //               </body>
    //             </html>
    //           `);
    //         previewWindow.document.close();
    //       }
    //     },
    //   });

    //   this._editor.Commands.add("html-edit", {
    //     run: (editor: Editor, sender: any) => {
    //       sender && sender.set("active", false);

    //       const html = editor.getHtml();
    //       const css = editor.getCss();

    //       const formattedHtml = beautifyHtml(html ?? "", {
    //         indent_size: 2,
    //         preserve_newlines: true,
    //         wrap_line_length: 0,
    //       });

    //       const formattedCss = beautifyHtml(`<style>${css ?? ""}</style>`, {
    //         indent_size: 2,
    //         preserve_newlines: true,
    //         wrap_line_length: 0,
    //       })
    //         .replace(/^<style>|<\/style>$/g, "")
    //         .trim();

    //       // Fullscreen overlay wrapper
    //       const overlay = document.createElement("div");
    //       Object.assign(overlay.style, {
    //         position: "absolute",
    //         top: "0",
    //         left: "0",
    //         width: "100%",
    //         height: "100%",
    //         backgroundColor: "#1e1e1e",
    //         color: "#fff",
    //         zIndex: "9999",
    //         padding: "20px",
    //         display: "flex",
    //         flexDirection: "column",
    //         boxSizing: "border-box",
    //       });

    //       const header = document.createElement("div");
    //       header.innerHTML = `<h2 style="margin: 0 0 10px 0;">Edit HTML / CSS</h2>`;
    //       overlay.appendChild(header);

    //       const editorContainer = document.createElement("div");
    //       Object.assign(editorContainer.style, {
    //         display: "flex",
    //         flex: "1",
    //         gap: "10px",
    //       });

    //       // HTML Editor
    //       const htmlEditorWrapper = document.createElement("div");
    //       htmlEditorWrapper.style.flex = "1";
    //       htmlEditorWrapper.innerHTML = `<div style="font-weight:bold;padding-bottom:4px">HTML</div>`;
    //       const htmlEditorDiv = document.createElement("div");
    //       htmlEditorDiv.style.height = "100%";
    //       htmlEditorDiv.style.textAlign = "left";
    //       htmlEditorWrapper.appendChild(htmlEditorDiv);

    //       // CSS Editor
    //       const cssEditorWrapper = document.createElement("div");
    //       cssEditorWrapper.style.flex = "1";
    //       cssEditorWrapper.innerHTML = `<div style="font-weight:bold;padding-bottom:4px">CSS</div>`;
    //       const cssEditorDiv = document.createElement("div");
    //       cssEditorDiv.style.height = "100%";
    //       cssEditorDiv.style.textAlign = "left";
    //       cssEditorWrapper.appendChild(cssEditorDiv);

    //       editorContainer.appendChild(htmlEditorWrapper);
    //       editorContainer.appendChild(cssEditorWrapper);

    //       overlay.appendChild(editorContainer);

    //       // Save + Close Button
    //       const footer = document.createElement("div");
    //       footer.style.textAlign = "right";
    //       footer.style.marginTop = "10px";

    //       const saveBtn = document.createElement("button");
    //       saveBtn.textContent = "Save & Close";
    //       Object.assign(saveBtn.style, {
    //         padding: "8px 16px",
    //         backgroundColor: "#4caf50",
    //         color: "#fff",
    //         border: "none",
    //         borderRadius: "4px",
    //         cursor: "pointer",
    //       });

    //       footer.appendChild(saveBtn);
    //       overlay.appendChild(footer);

    //       // Add overlay inside GrapesJS editor container
    //       this._editor.getEl().appendChild(overlay);

    //       // Initialize CodeMirror editors
    //       const cmHtml = CodeMirror(htmlEditorDiv, {
    //         value: formattedHtml,
    //         mode: "htmlmixed",
    //         theme: "hopscotch",
    //         lineNumbers: true,
    //         lineWrapping: true,
    //         indentUnit: 2,
    //         tabSize: 2,
    //       });

    //       const cmCss = CodeMirror(cssEditorDiv, {
    //         value: formattedCss,
    //         mode: "css",
    //         theme: "hopscotch",
    //         lineNumbers: true,
    //         lineWrapping: true,
    //         indentUnit: 2,
    //         tabSize: 2,
    //       });

    //       setTimeout(() => {
    //         cmHtml.refresh();
    //         cmCss.refresh();
    //       }, 300);

    //       // Save button click
    //       saveBtn.onclick = () => {
    //         const updatedHtml = cmHtml.getValue();
    //         const updatedCss = cmCss.getValue();

    //         editor.setComponents(updatedHtml);
    //         editor.setStyle(updatedCss);

    //         overlay.remove();
    //       };
    //     },
    //   });

    // //     //     this._editor.Panels.addButton("options", {
    // //     //       id: "edit-code",
    // //     //       className: "fa fa-file-code-o",
    // //     //       command: "html-edit",
    // //     //       attributes: { title: "Edit Code" },
    // //     //     }),
    this._editor.Panels.addButton("options", [
      {
        id: "preview-full",
        className: "fa fa-eye",
        command: "open-preview-tab",
        attributes: { title: "Preview Design in New Tab" },
      },
    ]);
  }

  private _isContentLoaded: boolean = false;

  public updateView(context: ComponentFramework.Context<IInputs>): void {
    const newHtml = context.parameters.htmlcontent.raw || "";
    if (!this._editor || !newHtml) {
      return;
    }

    // Load only once → prevent overwriting GrapesJS edits
    if (this._isContentLoaded) {
      return;
    }

    const container = document.createElement("div");
    container.innerHTML = newHtml;

    const html = container.querySelector("body")?.innerHTML || newHtml;
    const css = container.querySelector("style")?.innerHTML || "";

    const applyContent = () => {
      try {
        this._editor.setComponents(html);
        this._editor.setStyle(css);
        this._value = newHtml;
        this._isContentLoaded = true;
      } catch (error) {
        console.log("Error applying GrapesJS content", error);
      }
    };

    if (this._editor.Canvas?.getFrameEl()) {
      applyContent();
    } else {
      this._editor.on("load", applyContent);
    }
  }

  public getOutputs(): IOutputs {
    return { htmlcontent: this._value };
  }

  public destroy(): void {
    this._editor?.destroy();
  }

  private _injectButtonAlignPreviewStyles() {
    const attemptInject = (retryCount: number = 0) => {
      try {
        const iframe =
          this._editor &&
          this._editor.Canvas &&
          this._editor.Canvas.getFrameEl &&
          this._editor.Canvas.getFrameEl();
        const iframeDoc =
          iframe && iframe.contentWindow && iframe.contentWindow.document;

        if (!iframeDoc) {
          // Retry up to 3 times with delays if iframe not ready
          if (retryCount < 3) {
            setTimeout(
              () => attemptInject(retryCount + 1),
              100 * (retryCount + 1)
            );
          }
          return;
        }

        const id = "gjs-btn-align-styles";
        let existing = iframeDoc.getElementById(id) as HTMLStyleElement | null;
        const css = `
          /* Button alignment using margin - does NOT affect siblings */
          button[data-btn-align="left"], a[data-role="button-link"][data-btn-align="left"] { 
            display: inline-block !important;
            margin-left: 0 !important;
            margin-right: auto !important;
          }
          button[data-btn-align="center"], a[data-role="button-link"][data-btn-align="center"] { 
            display: table !important;
            margin-left: auto !important;
            margin-right: auto !important;
          }
          button[data-btn-align="right"], a[data-role="button-link"][data-btn-align="right"] { 
            display: table !important;
            margin-left: auto !important;
            margin-right: 0 !important;
          }
          
          /* Default alignment for new buttons (left) */
          .pcf-btn:not([data-btn-align]), a[data-role="button-link"]:not([data-btn-align]) {
            display: inline-block !important;
            margin-left: 0 !important;
            margin-right: auto !important;
          }
          
          /* Essential button styling - Only lock layout properties, allow customization of appearance */
          .pcf-btn, a[data-role="button-link"] {
            /* Layout properties - keep !important to maintain button behavior */
            display: inline-block !important;
            cursor: pointer !important;
            text-decoration: none !important;
            
            /* Responsive button properties */
            max-width: 100% !important;
            width: auto !important;
            white-space: normal !important;
            word-wrap: break-word !important;
            box-sizing: border-box !important;
            
            /* Default appearance - removable via traits (no !important) */
            background: #007bff;
            color: white;
            border: 0;
            padding: 12px 20px;
            font-weight: 700;
            border-radius: 0;
          }
          
          /* Remove link properties from button-styled anchor tags - but allow color customization */
          a[data-gjs-editable]:not([href*="http"]), a[data-role="button-link"] {
            text-decoration: none !important;
            /* Remove color !important to allow trait customization */
          }
          a[data-gjs-editable]:not([href*="http"]):hover, a[data-role="button-link"]:hover {
            text-decoration: none !important;
            /* Remove color !important to allow trait customization */
          }
          a[data-gjs-editable]:not([href*="http"]):visited, a[data-role="button-link"]:visited {
            text-decoration: none !important;
            /* Remove color !important to allow trait customization */
          }
          a[data-gjs-editable]:not([href*="http"]):active, a[data-role="button-link"]:active {
            text-decoration: none !important;
            /* Remove color !important to allow trait customization */
          }
          
          /* Legacy wrapper support if any exist */
          .btn-container { display: flex !important; align-items: center !important; }
          .btn-container.align-left, .btn-container[data-btn-align="left"] { justify-content: flex-start !important; }
          .btn-container.align-center, .btn-container[data-btn-align="center"] { justify-content: center !important; }
          .btn-container.align-right, .btn-container[data-btn-align="right"] { justify-content: flex-end !important; }
          .btn-container button { max-width: 100% !important; }
        `;

        if (!existing) {
          const styleEl = iframeDoc.createElement("style");
          styleEl.id = id;
          styleEl.type = "text/css";
          styleEl.appendChild(iframeDoc.createTextNode(css));
          (iframeDoc.head || iframeDoc.documentElement).appendChild(styleEl);
        } else {
          existing.textContent = css;
        }
      } catch (e) {
        /* ignore */
      }
    };

    attemptInject();
  }
}
//added a comment - anc-dev