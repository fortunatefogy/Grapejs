import { Editor } from "grapesjs";

export const customLayoutBlocksPlugin = (editor: Editor) => {
  const bm = editor.BlockManager;
  const domc = editor.DomComponents;

  // Register custom component type for layout inner columns with restricted stylable properties
  domc.addType("layout-inner-column", {
    // This function tells GrapeJS how to identify this component type from saved HTML
    isComponent: (el: HTMLElement) => {
      if (
        el.getAttribute &&
        el.getAttribute("data-layout-inner-column") === "true"
      ) {
        return { type: "layout-inner-column" };
      }
    },
    model: {
      defaults: {
        tagName: "div",
        name: "Column",
        droppable: true,
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
      },
    },
  });

  // Register reusable column types (optional)
  const addColumnComponent = (type: string, width: string) => {
    domc.addType(type, {
      model: {
        defaults: {
          tagName: "div",
          name: "Column",
          type,
          classes: ["custom-col"],
          droppable: true,
          style: {
            width,
            padding: "10px",
            boxSizing: "border-box",
          },
          traits: [
            {
              type: "color",
              name: "background-color",
              label: "Background Color",
              changeProp: true,
            },
            {
              type: "text",
              name: "padding",
              label: "Padding",
              changeProp: true,
            },
          ],
        },
        init() {
          this.on("change:background-color", (_: any, value: string) => {
            this.addStyle({ backgroundColor: value });
          });
          this.on("change:padding", (_: any, value: string) => {
            this.addStyle({ padding: value });
          });
        },
      },
    });
  };

  addColumnComponent("col-100", "100%");
  addColumnComponent("col-50", "50%");
  addColumnComponent("col-33", "33.33%");
  addColumnComponent("col-30", "30%");
  addColumnComponent("col-70", "70%");

  const generateColumnsSVG = (columnWidths: string[]) => {
    const totalWidth = 100;
    const height = 40;
    let x = 0;
    let rects = "";

    columnWidths.forEach((w) => {
      const widthNum = parseFloat(w);
      rects += `<rect x="${x}%" y="0" width="${widthNum}%" height="${height}" fill="#080808ff" stroke="#999"/>`;
      x += widthNum;
    });

    return `
    <svg width="100" height="${height}" viewBox="0 0 100 ${height}" xmlns="http://www.w3.org/2000/svg">
      ${rects}
    </svg>
  `;
  };

  const formatLabel = (columnWidths: string[]) => {
    if (columnWidths.length === 1) return "1Section";
    if (columnWidths.length === 2) {
      if (columnWidths[0] === "50%" && columnWidths[1] === "50%")
        return "1/2Section";
      if (columnWidths[0] === "30%" && columnWidths[1] === "70%")
        return "3/7Section";
      if (columnWidths[0] === "70%" && columnWidths[1] === "30%")
        return "7/3Section";
      return `Two Columns ${columnWidths.join(" / ")}`;
    }
    if (columnWidths.length === 3) return "1/3Section";
    return `Columns ${columnWidths.join(" / ")}`;
  };

  const addRowComponent = (name: string, columnWidths: string[]) => {
    const block = {
      label: formatLabel(columnWidths),
      category: "Layout",
      media: generateColumnsSVG(columnWidths),
      content: () => {
        const uniqueId = Date.now() + "-" + Math.floor(Math.random() * 1000); // unique per drag
        const rowClass = `row-${name}-${uniqueId}`; // unique class for this row

        const columns = columnWidths.map((width, index) => {
          const uniqueClass = `col-${name}-${index}-${uniqueId}`; // unique per column

          return {
            type: "layout-inner-column", // Custom type for inner columns
            tagName: "div",
            style: {
              flex: `0 0 ${width}`,
              padding: "10px",
              boxSizing: "border-box",
              minWidth: "0",
              backgroundColor: "transparent",
            },
            attributes: {
              "data-gjs-custom-name": `Column-${name}-${index}`,
              "data-gjs-stylable": "",
              "data-layout-inner-column": "true", // Marker for inner columns
            },
            classes: [uniqueClass],
          };
        });

        return {
          type: "default",
          tagName: "div",
          style: {
            display: "flex",
            width: "100%",
            // gap: "10px",
            boxSizing: "border-box",
            padding: "10px",
            flexWrap: "wrap",
            backgroundColor: "transparent",
            // Editor-only borders are injected into the canvas document so
            // previews/exported HTML don't include section borders.
          },
          attributes: {
            "data-gjs-custom-name": `${name}-row`,
            "data-gjs-stylable": "",
          },
          // Add both unique + shared responsive class
          classes: [rowClass, "responsive-row"],
          components: columns,
        };
      },
    };

    bm.add(name, block);
  };

  // Responsive CSS
  const addResponsiveStyles = () => {
    const cssRules = `
    <style id="gjs-responsive-and-editor-borders">
      /* Responsive behavior for editor canvas */
      @media (max-width: 600px) {
        .responsive-row {
          flex-direction: column !important;
        }
        .responsive-row > div {
          flex: 0 0 100% !important;
          max-width: 100% !important;
        }
      }

      /* Editor-only visual borders for sections (injected into canvas head)
         These are purposely added only to the editor's iframe document so
         exported/preview HTML does NOT include them. */
      .responsive-row {
        border: 1px solid #999;
        box-sizing: border-box;
        background-color: transparent;
      }
      .responsive-row > div {
        border: 1px solid #999;
        box-sizing: border-box;
      }
    </style>
  `;
    const canvas = editor.Canvas.getDocument();
    // Avoid duplicate injection
    try {
      const existing = canvas.getElementById(
        "gjs-responsive-and-editor-borders"
      );
      if (!existing) canvas.head.insertAdjacentHTML("beforeend", cssRules);
    } catch (_e) {
      // graceful fallback: try simple insert
      try {
        canvas.head.insertAdjacentHTML("beforeend", cssRules);
      } catch (__) {
        /* ignore */
      }
    }
  };

  editor.on("load", () => {
    addResponsiveStyles();
  });

  // Example usage
  addRowComponent("layout-col-1", ["100%"]);
  addRowComponent("layout-col-2", ["50%", "50%"]);
  addRowComponent("layout-col-3", ["33%", "33%", "33%"]);
  addRowComponent("layout-col-2-3-7", ["30%", "70%"]);
  addRowComponent("layout-col-2-7-3", ["70%", "30%"]);
  domc.addType("form-input", {
    model: {
      defaults: {
        tagName: "input",
        attributes: {
          type: "text",
          placeholder: "Enter text",
        },
        style: {
          width: "100%",
          padding: "8px",
          border: "1px solid #ccc",
          boxSizing: "border-box",
        },
        traits: [
          "name",
          {
            type: "text",
            name: "placeholder",
            label: "Placeholder",
          },
        ],
        droppable: false,
      },
    },
  });

  bm.add("form-input", {
    label: "Input",
    media: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="24" viewBox="0 0 40 24" fill="none" stroke="#fff" stroke-width="1">
 <rect x="0.5" y="0.5" width="39" height="23" rx="4" ry="4" fill="#0e0d0dff" stroke="#fff"/>
</svg>`,
    category: "Forms",
    content: { type: "form-input" },
  });

  // Form Textarea
  domc.addType("form-textarea", {
    model: {
      defaults: {
        tagName: "textarea",
        attributes: {
          placeholder: "Enter message",
        },
        style: {
          width: "100%",
          minHeight: "100px",
          padding: "10px",
          resize: "both",
          boxSizing: "border-box",
        },
        traits: [
          "name",
          {
            type: "text",
            name: "placeholder",
            label: "Placeholder",
          },
        ],
        droppable: false,
      },
    },
  });

  bm.add("form-textarea", {
    label: "Textarea",
    media: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="32" viewBox="0 0 40 32" fill="none" stroke="#fff" stroke-width="1">
  <!-- Outer box -->
  <rect x="0.5" y="0.5" width="39" height="31" rx="4" ry="4" fill="none" stroke="#080808ff"/>
 
  <!-- Text lines -->
  <line x1="6" y1="10" x2="34" y2="10" stroke="#080808ff" stroke-width="1"/>
  <line x1="6" y1="16" x2="28" y2="16" stroke="#080808ff" stroke-width="1"/>
  <line x1="6" y1="22" x2="30" y2="22" stroke="#080808ff" stroke-width="1"/>
</svg>`,

    category: "Forms",
    content: { type: "form-textarea" },
  });

  // Form Select with toolbar support
  domc.addType("form-select", {
    // Ensure that after a page refresh, existing <select> elements are
    // recognized as our custom type so the custom toolbar reappears.
    // We intentionally map any SELECT element to this type in this editor.
    isComponent: (el: HTMLElement) => {
      if (el.tagName === "SELECT") {
        return { type: "form-select" } as any;
      }
      return undefined;
    },
    model: {
      defaults: {
        tagName: "select",
        // Add a stable marker so the saved HTML carries an identifier
        // (useful if storage strips data-gjs-type in some modes)
        attributes: { "data-form-select": "true" },
        components: `
          <option value="">-- Select --</option>
          <option value="opt1">Option 1</option>
          <option value="opt2">Option 2</option>
        `,
        style: {
          width: "100%",
          padding: "8px",
          border: "1px solid #ccc",
          boxSizing: "border-box",
          backgroundColor: "#fff",
        },
        traits: [
          {
            type: "text",
            name: "name",
            label: "Name",
          },
        ],
        droppable: false,
        // Add toolbar button
        toolbar: [
          {
            attributes: { class: "fa fa-list", title: "Manage Options" },
            command: "select-manage-options",
          },
          {
            attributes: { class: "fa fa-trash", title: "Delete" },
            command: "tlb-delete",
          },
        ],
      },
    },
  });

  bm.add("form-select", {
    label: "Select",
    media: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="24" viewBox="0 0 40 24" fill="none" stroke="#080808ff" stroke-width="1">
  <!-- Outer box -->
  <rect x="0.5" y="0.5" width="39" height="23" rx="4" ry="4" fill="none" stroke="#080808ff"/>
 
  <!-- Dropdown arrow (downward V) -->
  <polyline points="28,9 32,13 28,17" fill="none" stroke="#080808ff" stroke-width="1.5" transform="rotate(90 30 13)"/>
</svg>`,
    category: "Forms",
    content: { type: "form-select" },
  });

  // Unified Command: Manage all options in one scrollable modal
  editor.Commands.add("select-manage-options", {
    run(editor: any) {
      const selected = editor.getSelected();
      if (!selected || selected.get("tagName") !== "select") return;

      // Normalize the component type in case it lost its type after reload
      if (selected.get("type") !== "form-select") {
        selected.set("type", "form-select");
      }

      // Get current options
      const options = selected.components();

      // Create wrapper for modal
      const wrapper = document.createElement("div");

      // Store current option data (used when removing specific items)
      let currentOptionsData: Array<{ text: string; value: string }> = [];

      // Function to render the options form
      const renderOptionsForm = (
        count: number,
        optionsData?: Array<{ text: string; value: string }>
      ) => {
        // Use provided data or read from existing options
        if (!optionsData) {
          currentOptionsData = Array.from({ length: count }, (_, i) => {
            const existingOption = options.at(i) as any;
            if (!existingOption) return { text: "", value: "" };

            // Prefer rendered DOM text for robustness after refresh
            const el = existingOption?.view?.el as HTMLElement | undefined;
            let text = (el?.textContent || "").trim();

            // Fallback: read from component structure
            if (!text) {
              try {
                const comps = existingOption.components?.() || [];
                // Look for textnode/text or single child content
                const textComp = comps.find(
                  (c: any) =>
                    c.get?.("type") === "textnode" || c.get?.("type") === "text"
                );
                if (textComp) text = (textComp.get("content") || "").trim();
                if (!text) {
                  text =
                    existingOption?.get?.("content") ||
                    existingOption
                      ?.get?.("components")
                      ?.at(0)
                      ?.get?.("content") ||
                    "";
                  text = (text || "").trim();
                }
              } catch (_) {
                /* ignore */
              }
            }

            const value = existingOption?.get?.("attributes")?.value || "";
            return { text, value };
          });
        } else {
          currentOptionsData = optionsData;
        }

        const optionsHtml = currentOptionsData
          .map((opt, i) => {
            // First option (index 0) is the placeholder - simplified UI
            if (i === 0) {
              return `
              <div class="option-row" style="padding:12px; margin-bottom:10px; border:1px solid #ddd; border-radius:6px; background:#f9f9f9;">
                <div style="margin-bottom:8px;">
                  <label style="display:block; font-weight:600; margin-bottom:4px;">Placeholder Text:</label>
                  <input type="text" class="option-text" data-index="${i}" 
                         placeholder="-- Select --" value="${opt.text}"
                         style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px; box-sizing:border-box;">
                  <input type="hidden" class="option-value" data-index="${i}" value="">
                </div>
              </div>
            `;
            }

            // Regular options (index > 0) - full UI with text and value
            // Display option number sequentially (subtract 1 for placeholder)
            const displayNumber = i;
            return `
            <div class="option-row" style="padding:12px; margin-bottom:10px; border:1px solid #ddd; border-radius:6px; background:#f9f9f9;">
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
                <span style="font-weight:600; min-width:80px;">Option ${displayNumber}:</span>
                <button class="remove-option-btn" data-index="${i}" style="margin-left:auto; padding:4px 8px; background:#d9534f; color:white; border:none; border-radius:4px; cursor:pointer; font-size:11px;">
                  <i class="fa fa-trash"></i> Remove
                </button>
              </div>
              <div style="margin-bottom:8px;">
                <label style="display:block; font-size:12px; margin-bottom:4px; color:#666;">Display Text:</label>
                <input type="text" class="option-text" data-index="${i}" 
                       placeholder="Option ${displayNumber}" value="${opt.text}"
                       style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px; box-sizing:border-box;">
              </div>
              <div>
                <label style="display:block; font-size:12px; margin-bottom:4px; color:#666;">Value:</label>
                <input type="text" class="option-value" data-index="${i}" 
                       placeholder="opt${displayNumber}" value="${opt.value}"
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
                <input id="option-count" type="number" min="1" max="50" value="${
                  currentOptionsData.length - 1
                }" 
                       style="width:100px; padding:8px; border:1px solid #ccc; border-radius:4px;">
                <button id="update-count-btn" class="gjs-btn-prim" style="padding:8px 16px;">
                  Update
                </button>
              </div>
              <small style="display:block; margin-top:4px; color:#666;">Number of actual options (placeholder not counted)</small>
            </div>
            
            <div style="max-height:400px; overflow-y:auto; margin-bottom:16px; padding-right:8px;">
              ${optionsHtml}
            </div>
            
            <div style="border-top:1px solid #ddd; padding-top:12px; display:flex; gap:8px; justify-content:flex-end;">
              <button id="options-cancel" class="gjs-btn">Cancel</button>
              <button id="options-save" class="gjs-btn-prim">Save All Options</button>
            </div>
          </div>
        `;
      };

      // Initial render
      wrapper.innerHTML = renderOptionsForm(Math.max(options.length, 3));

      editor.Modal.setTitle("Manage Dropdown Options");
      editor.Modal.setContent(wrapper);
      editor.Modal.open();

      // Prevent closing this modal by clicking the overlay/background.
      // Only the modal's close button and the Cancel/Save controls should close it.
      try {
        const mdlContainer = document.querySelector(
          ".gjs-mdl-container"
        ) as HTMLElement | null;

        if (mdlContainer) {
          const overlayClickHandler = (ev: MouseEvent) => {
            if (ev.target === mdlContainer) {
              ev.stopPropagation();
              ev.preventDefault();
              const firstInput = wrapper.querySelector(
                "input, textarea, select, button"
              ) as HTMLElement | null;
              if (firstInput) firstInput.focus();
            }
          };

          mdlContainer.addEventListener("click", overlayClickHandler, true);

          // Remove handler when modal closes to avoid leaks
          try {
            editor.on("modal:close", () => {
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

      // Event: Update count button
      const updateCountBtn = wrapper.querySelector("#update-count-btn");
      const countInput = wrapper.querySelector(
        "#option-count"
      ) as HTMLInputElement;

      updateCountBtn?.addEventListener("click", () => {
        const newCount = parseInt(countInput.value, 10);
        if (newCount >= 1 && newCount <= 50) {
          // Collect current values before re-rendering
          const textInputs = Array.from(
            wrapper.querySelectorAll(".option-text")
          ) as HTMLInputElement[];
          const valueInputs = Array.from(
            wrapper.querySelectorAll(".option-value")
          ) as HTMLInputElement[];

          const currentData = textInputs.map((textInput, i) => ({
            text: textInput.value.trim(),
            value: valueInputs[i].value.trim(),
          }));

          // Adjust array size (newCount + 1 for placeholder)
          const totalCount = newCount + 1;
          if (totalCount > currentData.length) {
            // Add empty options
            for (let i = currentData.length; i < totalCount; i++) {
              currentData.push({ text: "", value: "" });
            }
          } else if (totalCount < currentData.length) {
            // Trim to new count (but keep at least placeholder + 1)
            currentData.length = Math.max(totalCount, 2);
          }

          wrapper.innerHTML = renderOptionsForm(
            currentData.length,
            currentData
          );
          attachEventListeners();
        }
      });

      // Function to attach event listeners after re-render
      const attachEventListeners = () => {
        // Update count button
        const updateBtn = wrapper.querySelector("#update-count-btn");
        const input = wrapper.querySelector(
          "#option-count"
        ) as HTMLInputElement;
        updateBtn?.addEventListener("click", () => {
          const newCount = parseInt(input.value, 10);
          if (newCount >= 1 && newCount <= 50) {
            // Collect current values before re-rendering
            const textInputs = Array.from(
              wrapper.querySelectorAll(".option-text")
            ) as HTMLInputElement[];
            const valueInputs = Array.from(
              wrapper.querySelectorAll(".option-value")
            ) as HTMLInputElement[];

            const currentData = textInputs.map((textInput, i) => ({
              text: textInput.value.trim(),
              value: valueInputs[i].value.trim(),
            }));

            // Adjust array size (newCount + 1 for placeholder)
            const totalCount = newCount + 1;
            if (totalCount > currentData.length) {
              // Add empty options
              for (let i = currentData.length; i < totalCount; i++) {
                currentData.push({ text: "", value: "" });
              }
            } else if (totalCount < currentData.length) {
              // Trim to new count (but keep at least placeholder + 1)
              currentData.length = Math.max(totalCount, 2);
            }

            wrapper.innerHTML = renderOptionsForm(
              currentData.length,
              currentData
            );
            attachEventListeners();
          }
        });

        // Remove individual option buttons
        wrapper.querySelectorAll(".remove-option-btn").forEach((btn) => {
          btn.addEventListener("click", (e) => {
            e.preventDefault();

            const indexToRemove = parseInt(
              (btn as HTMLElement).getAttribute("data-index") || "0",
              10
            );

            // Prevent removing the placeholder (index 0)
            if (indexToRemove === 0) {
              alert("Cannot remove the placeholder option.");
              return;
            }

            // Collect current values from all inputs
            const textInputs = Array.from(
              wrapper.querySelectorAll(".option-text")
            ) as HTMLInputElement[];
            const valueInputs = Array.from(
              wrapper.querySelectorAll(".option-value")
            ) as HTMLInputElement[];

            const currentData = textInputs.map((textInput, i) => ({
              text: textInput.value.trim(),
              value: valueInputs[i].value.trim(),
            }));

            // Check if we can remove (must keep at least placeholder + 1 option)
            if (currentData.length > 2) {
              // Remove the specific item
              currentData.splice(indexToRemove, 1);

              // Re-render with updated data
              wrapper.innerHTML = renderOptionsForm(
                currentData.length,
                currentData
              );
              attachEventListeners();
            } else {
              alert("At least one option (plus placeholder) must remain.");
            }
          });
        });

        // Cancel button
        const cancelBtn = wrapper.querySelector("#options-cancel");
        cancelBtn?.addEventListener("click", () => editor.Modal.close());

        // Save button
        const saveBtn = wrapper.querySelector("#options-save");
        saveBtn?.addEventListener("click", () => {
          const textInputs = Array.from(
            wrapper.querySelectorAll(".option-text")
          ) as HTMLInputElement[];
          const valueInputs = Array.from(
            wrapper.querySelectorAll(".option-value")
          ) as HTMLInputElement[];

          // Build new options data
          const newOptionsData = textInputs.map((textInput, i) => {
            // For placeholder (index 0), use empty value
            if (i === 0) {
              return {
                text: textInput.value.trim() || "-- Select --",
                value: "",
              };
            }
            // For regular options, use sequential numbering
            return {
              text: textInput.value.trim() || `Option ${i}`,
              value: valueInputs[i].value.trim() || `opt${i}`,
            };
          });

          // Batch operation: Clear and rebuild in one go
          // Preserve attributes and explicit marker so rehydration is stable
          const attrs = {
            ...(selected.get("attributes") || {}),
            "data-form-select": "true",
          } as any;

          selected.set("attributes", attrs);

          selected.components().reset();

          // Add all new options at once
          const newComponents = newOptionsData.map((opt) => ({
            tagName: "option",
            attributes: { value: opt.value },
            // Use a raw textnode to keep the content literal and avoid placeholders
            components: [
              {
                type: "textnode",
                content: opt.text,
                selectable: false,
                hoverable: false,
                editable: false,
              },
            ],
          }));

          selected.components().add(newComponents);

          // Single render at the end
          selected.view?.render();
          editor.trigger("component:update", selected);

          editor.Modal.close();
        });
      };

      // Attach initial event listeners
      attachEventListeners();
    },
  });

  const fontHref =
    "https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@400;700&display=swap";

  // Add to main document
  if (!document.getElementById("gjs-font-source-sans-main")) {
    const link = document.createElement("link");
    link.id = "gjs-font-source-sans-main";
    link.rel = "stylesheet";
    link.href = fontHref;
    document.head.appendChild(link);
  }

  // Preload for faster load
  const preload = document.createElement("link");
  preload.rel = "preload";
  preload.as = "style";
  preload.href = fontHref;
  document.head.appendChild(preload);

  editor.on("load", () => {
    // Add font to canvas iframe document
    const cdoc = editor.Canvas.getDocument();
    if (!cdoc.getElementById("gjs-font-source-sans")) {
      const link = cdoc.createElement("link");
      link.id = "gjs-font-source-sans";
      link.rel = "stylesheet";
      link.href = fontHref;
      cdoc.head.appendChild(link);
    }
  });

  interface Trait {
    get(name: string): any;
  }

  interface Component {
    get(name: string): any;
    on(
      event: string,
      callback: (
        comp: Component,
        traitName: string,
        newValue: string,
        oldValue: string
      ) => void
    ): void;
    addStyle(style: Record<string, string>): void;
  }

  editor.on("component:selected", (component: Component) => {
    const tagName = component.get("tagName") as string | undefined;
    const traits = component.get("traits") as Trait[] | undefined;

    if (
      tagName?.startsWith("h") &&
      traits?.find((t: Trait) => t.get("name") === "bgColor")
    ) {
      component.on(
        "change:traits",
        (
          comp: Component,
          traitName: string,
          newValue: string,
          oldValue: string
        ) => {
          if (traitName === "bgColor")
            comp.addStyle({ "background-color": newValue });
        }
      );
    }
  });

  //   bm.add("list-item-layout", {
  //     label: "List Items",
  //     media: `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"> <rect x="3" y="6" width="3" height="3"/> <rect x="3" y="10.5" width="3" height="3"/> <rect x="3" y="15" width="3" height="3"/> <rect x="8" y="6" width="13" height="1.5"/> <rect x="8" y="8" width="10" height="1"/> <rect x="8" y="10.5" width="13" height="1.5"/> <rect x="8" y="12" width="8" height="1"/> <rect x="8" y="15" width="13" height="1.5"/> <rect x="8" y="16.5" width="11" height="1"/> </svg>`,
  //     category: "Lists",
  //     content: `
  //   <table class="list-container" style="width: 100%; border-collapse: collapse;">
  //     <tr class="list-item">
  //       <td style="width: 100px; vertical-align: top;">
  //         <img src="https://via.placeholder.com/100" alt="Image" style="width: 100px; height: auto;" />
  //       </td>
  //       <td style="vertical-align: top;" data-gjs-droppable="true">
  //         <h4 style="margin: 0 0 5px 0; font-weight: bold;">Title here</h4>
  //         <p style="margin: 0; font-size: 13px;">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.</p>
  //       </td>
  //     </tr>
  //     <tr class="list-item" style="padding-top: 20px;">
  //       <td style="width: 100px; vertical-align: top;">
  //         <img src="https://via.placeholder.com/100" alt="Image" style="width: 100px; height: auto;" />
  //       </td>
  //       <td style="vertical-align: top;" data-gjs-droppable="true">
  //         <h4 style="margin: 0 0 5px 0; font-weight: bold;">Title here</h4>
  //         <p style="margin: 0; font-size: 13px;">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.</p>
  //       </td>
  //     </tr>
  //   </table>
  // `,
  //   });

  //   bm.add("grid-2-card", {
  //     label: "Grid Items",
  //     media: `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"> <rect x="3" y="3" width="7" height="7" rx="1"/> <rect x="14" y="3" width="7" height="7" rx="1"/> <rect x="3" y="14" width="7" height="7" rx="1"/> <rect x="14" y="14" width="7" height="7" rx="1"/> </svg>`,
  //     category: "Lists",
  //     content: `
  //   <style>
  //     .grid-card-row {
  //       display: flex;
  //       flex-wrap: wrap;
  //       gap: 10px;
  //       justify-content: space-between;
  //     }

  //     .grid-card-item {
  //       width: 48%;
  //       padding: 10px;
  //       box-sizing: border-box;
  //     }

  //     @media (max-width: 768px) {
  //       .grid-card-item {
  //         width: 100% !important;
  //       }
  //     }
  //   </style>
  //   <div class="grid-card-row">
  //     <div class="grid-card-item" data-gjs-droppable="true">
  //       <img src="https://via.placeholder.com/100" alt="Image" style="max-width: 100%; margin-bottom: 10px;" />
  //       <h4 style="margin: 0 0 5px; font-weight: bold;">Title here</h4>
  //       <p style="margin: 0; font-size: 13px;">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
  //     </div>
  //     <div class="grid-card-item" data-gjs-droppable="true">
  //       <img src="https://via.placeholder.com/100" alt="Image" style="max-width: 100%; margin-bottom: 10px;" />
  //       <h4 style="margin: 0 0 5px; font-weight: bold;">Title here</h4>
  //       <p style="margin: 0; font-size: 13px;">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
  //     </div>
  //   </div>
  // `,
  //   });

  bm.add("page-last-updated", {
    label: "Last Updated",
    category: "Data",
    media: `<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" fill="#000">
  <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H5V8h14v13zM12 12c.55 0 1 .45 1 1v3h-2v-3c0-.55.45-1 1-1zm0-6c.55 0 1 .45 1 1v3h-2V7c0-.55.45-1 1-1z"/>
</svg>`,
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
        {
          attributes: { class: "fa fa-trash", title: "Delete" },
          command: "tlb-delete",
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
          console.warn("[LayoutBlocks] Invalid context in script");
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

  // Assign a unique class to each Page Last Updated instance to isolate styles
  editor.on("component:add", (comp: any) => {
    try {
      const attrs = comp.getAttributes ? comp.getAttributes() : {};
      if (attrs && attrs["data-plu"] === "true") {
        const unique = `plu-${Date.now().toString(36)}-${Math.random()
          .toString(36)
          .slice(2, 8)}`;
        comp.addClass && comp.addClass(unique);
        // Remove the temporary attribute so no attribute-based CSS can target future instances
        const newAttrs = { ...(attrs || {}) } as any;
        delete newAttrs["data-plu"];
        comp.set && comp.set("attributes", newAttrs);
        // Removed explicit background reset to avoid visual flicker
      }
    } catch (e) {
      console.log(e);
    }
  });
  const formatPluDate = () =>
    new Date(Date.now()).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  // Helper to set the visible date text on the span model (works even if script doesn't run)
  const applyTodayToDateModel = (m: any) => {
    const today = formatPluDate();
    try {
      // Skip if already set to avoid flicker
      const at = (m.getAttributes && m.getAttributes()) || {};
      if (at && at["data-date-set"]) return;

      m.set && m.set("editable", false);
      if (typeof m.components === "function") {
        // Replace inner content of the span
        m.components(today);
      } else if (m.set) {
        m.set("content", today);
      }
      // Mark as set to prevent future updates/flicker
      if (m.addAttributes) {
        m.addAttributes({ "data-date-set": "1" });
      } else if (m.set) {
        const prev = (m.getAttributes && m.getAttributes()) || {};
        m.set("attributes", { ...prev, "data-date-set": "1" });
      }
      // Also update live element if available
      const el = (m.getEl && m.getEl()) || (m.view && m.view.el);
      if (el) (el as HTMLElement).textContent = today;
    } catch (e) {
      console.log(e);
    }
  };

  // Ensure date is populated on editor load
  const setNowOnLastUpdated = () => {
    try {
      const wrapper = editor.getWrapper && editor.getWrapper();
      if (!wrapper) return;
      const found =
        (wrapper.find && wrapper.find('span[data-role="last-updated-date"]')) ||
        [];
      (found as any[]).forEach((c: any) => applyTodayToDateModel(c));
    } catch (e) {
      /* no-op */
    }
  };
  editor.on("load", setNowOnLastUpdated);

  // Ensure when a PLU block or its children are added, the date shows immediately
  editor.on("component:add", (comp: any) => {
    try {
      if (
        comp?.getAttributes &&
        comp.getAttributes()["data-role"] === "last-updated-date"
      ) {
        applyTodayToDateModel(comp);
      } else if (comp?.find) {
        const found = comp.find('span[data-role="last-updated-date"]');
        found && found.forEach((c: any) => applyTodayToDateModel(c));
      }
    } catch (e) {
      console.log(e);
    }
  });

  // Define custom component for Top Button
  domc.addType("top-button", {
    model: {
      defaults: {
        tagName: "div",
        attributes: { class: "backtoTop" },
        components: `
        <img src="https://www.cdph.ca.gov/PublishingImages/homepage/Rebranding/ToTop.svg" alt="Back to top" style="width:48px; height:48px; cursor:pointer;" />
      `,
        // This script runs in the canvas (live site)
        // ...existing code...
        script: function (this: HTMLElement) {
          // Safety check: ensure 'this' is a valid HTMLElement
          if (!this || typeof this.querySelector !== "function") {
            console.warn("[LayoutBlocks] Invalid context in backtoTop script");
            return;
          }

          // Attach click to the image so it works in preview/live mode
          const btn = this.querySelector("img") as HTMLElement | null;
          if (btn) {
            btn.addEventListener("click", (e: MouseEvent) => {
              e.stopPropagation();
              window.scrollTo({ top: 0, behavior: "smooth" });
            });
          }

          // Show/hide the whole top-button wrapper based on scroll position
          const root = this as HTMLElement;
          const threshold = 100; // px from top before showing
          const getScrollTop = () =>
            (typeof window.pageYOffset === "number" && window.pageYOffset) ||
            document.documentElement.scrollTop ||
            (document.body && (document.body as any).scrollTop) ||
            0;

          const updateVisibility = () => {
            try {
              const y = getScrollTop();
              // Hide when at top (<= threshold), show otherwise
              if (y <= threshold) {
                root.style.display = "none";
              } else {
                root.style.display = ""; // restore default
              }
            } catch (_) {
              /* no-op */
            }
          };

          // Initialize and bind
          updateVisibility();
          window.addEventListener("scroll", updateVisibility, {
            passive: true,
          });
        },
        // ...existing code...
      },
    },
  });

  // Add block to Block Manager
  bm.add("top-button-control", {
    label: "TopButton",
    category: "Controls",
    media: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
           viewBox="0 0 24 24" fill="#800080" style="margin-bottom:8px;">
            <path d="M4 12l1.41 1.41L11 7.83V20h2V7.83l5.59 5.58L20 12l-8-8-8 8z"/>
          </svg>`,
    content: { type: "top-button" },
  });
};
