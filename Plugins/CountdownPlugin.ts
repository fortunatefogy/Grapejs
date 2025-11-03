import type { Editor } from "grapesjs";

export default (editor: Editor) => {
  const bm = editor.BlockManager;
  const domc = editor.DomComponents;

  // Register command to set countdown date/time via modal
  editor.Commands.add("set-countdown-date", {
    run: (editor: any) => {
      const comp = editor.getSelected();
      if (!comp) return;

      const attrs = comp.getAttributes() || {};
      const currentDate = attrs["data-countdown-date"];
      const currentFormat = attrs["data-countdown-format"] || "full";
      const currentAutoHide = attrs["data-countdown-auto-hide"] === "true";

      // Parse current date to populate form, or use today's date/time as default
      let dateValue = "";
      let timeValue = "";

      if (currentDate) {
        // Use existing date if available
        try {
          const d = new Date(currentDate);
          if (!isNaN(d.getTime())) {
            // Format as YYYY-MM-DD
            dateValue = d.toISOString().split("T")[0];
            // Format as HH:mm:ss
            timeValue = d.toTimeString().split(" ")[0];
          }
        } catch (e) {
          // Fall through to use today's date
        }
      }

      // If no valid date, default to today's date and current time
      if (!dateValue) {
        const now = new Date();
        dateValue = now.toISOString().split("T")[0];
        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");
        const seconds = String(now.getSeconds()).padStart(2, "0");
        timeValue = `${hours}:${minutes}:${seconds}`;
      }

      // Create modal content
      const wrapper = document.createElement("div");
      wrapper.innerHTML = `
        <div style="padding: 20px; font-family: sans-serif;">
          <div style="margin-bottom: 20px;">
            <label style="display: block; font-weight: 600; margin-bottom: 8px; color: #fff;">
              Target Date
            </label>
            <input 
              id="countdown-date-input" 
              type="date" 
              value="${dateValue}"
              style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px;"
            />
          </div>
          
          <div style="margin-bottom: 20px;">
            <label style="display: block; font-weight: 600; margin-bottom: 8px; color: #fff;">
              Target Time
            </label>
            <input 
              id="countdown-time-input" 
              type="time" 
              value="${timeValue}"
              step="1"
              style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px;"
            />
          </div>
          
          <div style="margin-bottom: 20px;">
            <label style="display: block; font-weight: 600; margin-bottom: 8px; color: #fff;">
              Display Format
            </label>
            <select 
              id="countdown-format-select"
              style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px;"
            >
              <option value="full" ${
                currentFormat === "full" ? "selected" : ""
              }>Days, Hours, Minutes, Seconds</option>
              <option value="dhm" ${
                currentFormat === "dhm" ? "selected" : ""
              }>Days, Hours, Minutes</option>
              <option value="hms" ${
                currentFormat === "hms" ? "selected" : ""
              }>Hours, Minutes, Seconds</option>
              <option value="days" ${
                currentFormat === "days" ? "selected" : ""
              }>Days Only</option>
            </select>
          </div>
          
          <div style="margin-bottom: 20px;">
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
              <input 
                id="countdown-autohide-checkbox" 
                type="checkbox"
                ${currentAutoHide ? "checked" : ""}
                style="width: 18px; height: 18px; cursor: pointer;"
              />
              <span style="font-weight: 600; color: #fff;">Auto-hide when finished</span>
            </label>
          </div>
          
          <div style="background: #f0f0f0; padding: 12px; border-radius: 4px; margin-bottom: 20px;">
            <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Preview:</div>
            <div id="countdown-preview" style="font-weight: bold; color: #333; font-size: 14px;"></div>
          </div>
          
          <div style="display: flex; gap: 10px; justify-content: flex-end;">
            <button 
              id="countdown-cancel-btn" 
              class="gjs-btn"
              style="padding: 10px 20px; cursor: pointer;"
            >
              Cancel
            </button>
            <button 
              id="countdown-save-btn" 
              class="gjs-btn-prim"
              style="padding: 10px 20px; cursor: pointer;"
            >
              Save
            </button>
          </div>
        </div>
      `;

      editor.Modal.setTitle("Set Countdown Date & Time");
      editor.Modal.setContent(wrapper);
      editor.Modal.open();

      const dateInput = wrapper.querySelector(
        "#countdown-date-input"
      ) as HTMLInputElement;
      const timeInput = wrapper.querySelector(
        "#countdown-time-input"
      ) as HTMLInputElement;
      const formatSelect = wrapper.querySelector(
        "#countdown-format-select"
      ) as HTMLSelectElement;
      const autoHideCheckbox = wrapper.querySelector(
        "#countdown-autohide-checkbox"
      ) as HTMLInputElement;
      const previewDiv = wrapper.querySelector(
        "#countdown-preview"
      ) as HTMLDivElement;
      const cancelBtn = wrapper.querySelector(
        "#countdown-cancel-btn"
      ) as HTMLButtonElement;
      const saveBtn = wrapper.querySelector(
        "#countdown-save-btn"
      ) as HTMLButtonElement;

      // Update preview function
      const updatePreview = () => {
        try {
          const dateVal = dateInput.value;
          const timeVal = timeInput.value;
          if (dateVal && timeVal) {
            const combinedDateTime = `${dateVal}T${timeVal}`;
            const targetDate = new Date(combinedDateTime);
            if (!isNaN(targetDate.getTime())) {
              previewDiv.textContent = targetDate.toLocaleString();
              previewDiv.style.color = "#333";
            } else {
              previewDiv.textContent = "Invalid date/time";
              previewDiv.style.color = "#d9534f";
            }
          } else {
            previewDiv.textContent = "Please select date and time";
            previewDiv.style.color = "#999";
          }
        } catch (e) {
          previewDiv.textContent = "Invalid date/time";
          previewDiv.style.color = "#d9534f";
        }
      };

      // Initial preview update
      updatePreview();

      // Update preview on input changes
      dateInput.addEventListener("change", updatePreview);
      timeInput.addEventListener("change", updatePreview);

      // Cancel button handler
      cancelBtn.addEventListener("click", () => {
        editor.Modal.close();
      });

      // Save button handler
      saveBtn.addEventListener("click", () => {
        try {
          const dateVal = dateInput.value;
          const timeVal = timeInput.value;
          const formatVal = formatSelect.value;
          const autoHideVal = autoHideCheckbox.checked;

          if (!dateVal || !timeVal) {
            alert("Please select both date and time");
            return;
          }

          const combinedDateTime = `${dateVal}T${timeVal}`;
          const targetDate = new Date(combinedDateTime);

          if (isNaN(targetDate.getTime())) {
            alert("Invalid date/time selected");
            return;
          }

          // Update component attributes
          const currentAttrs = comp.getAttributes() || {};
          const newAttrs = {
            ...currentAttrs,
            "data-countdown-date": combinedDateTime,
            "data-countdown-format": formatVal,
            "data-countdown-auto-hide": autoHideVal ? "true" : "false",
          };

          comp.setAttributes(newAttrs);

          // Trigger change events
          comp.trigger && comp.trigger("change:attributes");
          comp.trigger && comp.trigger("change:attributes:data-countdown-date");
          comp.trigger &&
            comp.trigger("change:attributes:data-countdown-format");
          editor.trigger && editor.trigger("component:update", comp);

          // Get the DOM element and clean up old classes
          const compEl = comp.getEl();
          if (compEl) {
            // Remove hidden classes from all time unit containers
            const allUnits = compEl.querySelectorAll(
              ".countdown-days, .countdown-hours, .countdown-minutes, .countdown-seconds"
            );
            allUnits.forEach((unit: any) => {
              if (unit.parentElement) {
                unit.parentElement.classList.remove("hidden");
                unit.parentElement.style.display = "";
              }
            });
          }

          // Force re-render
          comp.view && comp.view.render && comp.view.render();

          // Re-run the script to reinitialize countdown with new format
          try {
            const scriptContent = comp.get("script");
            if (scriptContent && compEl) {
              // Clear any existing intervals
              if ((compEl as any).__countdownCleanup) {
                (compEl as any).__countdownCleanup();
              }

              // Re-execute the script
              const scriptFunc = new Function(scriptContent);
              scriptFunc.call(compEl);
            }
          } catch (err) {
            console.error("Error re-initializing countdown:", err);
          }

          editor.Modal.close();
        } catch (e) {
          console.error("Error saving countdown settings:", e);
          alert("Error saving settings. Please try again.");
        }
      });
    },
  });

  // Define the countdown component type
  domc.addType("countdown-timer", {
    isComponent: (el: HTMLElement) => {
      return (
        el.tagName === "DIV" &&
        (el.classList?.contains("pcf-countdown") ||
          el.getAttribute("data-countdown-component") === "true")
      );
    },

    model: {
      defaults: {
        tagName: "div",
        attributes: {
          class: "pcf-countdown",
          "data-countdown-component": "true",
        },
        stylable: true,
        droppable: false,
        editable: false,
        selectable: true,
        hoverable: true,
        layerable: false,
        highlightable: true,
        propagate: [],
        components: `
          <div class="countdown-display">
            <span class="countdown-label">Countdown: </span>
            <span class="countdown-days">00</span>
            <span class="countdown-unit">d </span>
            <span class="countdown-hours">00</span>
            <span class="countdown-unit">h </span>
            <span class="countdown-minutes">00</span>
            <span class="countdown-unit">m </span>
            <span class="countdown-seconds">00</span>
            <span class="countdown-unit">s</span>
          </div>
        `,
        traits: [
          {
            type: "text",
            name: "data-countdown-date",
            label: "Target Date",
            placeholder: "YYYY-MM-DDTHH:mm:ss",
          },
          {
            type: "select",
            name: "data-countdown-format",
            label: "Display Format",
            options: [
              {
                id: "full",
                value: "full",
                name: "Days, Hours, Minutes, Seconds",
              },
              { id: "dhm", value: "dhm", name: "Days, Hours, Minutes" },
              { id: "hms", value: "hms", name: "Hours, Minutes, Seconds" },
              { id: "days", value: "days", name: "Days Only" },
            ],
          },
          {
            type: "checkbox",
            name: "data-countdown-auto-hide",
            label: "Auto-hide when finished",
          },
        ] as any,
        script: function () {
          const initCountdown = () => {
            const el = this as unknown as HTMLElement;
            const targetDateStr = el.getAttribute("data-countdown-date");
            const format = el.getAttribute("data-countdown-format") || "full";
            const autoHide =
              el.getAttribute("data-countdown-auto-hide") === "true";

            if (!targetDateStr) {
              console.warn("Countdown: No target date specified");
              return;
            }

            const targetDate = new Date(targetDateStr);
            if (isNaN(targetDate.getTime())) {
              console.error("Countdown: Invalid date format");
              return;
            }

            const daysEl = el.querySelector(
              ".countdown-days"
            ) as HTMLElement | null;
            const hoursEl = el.querySelector(
              ".countdown-hours"
            ) as HTMLElement | null;
            const minutesEl = el.querySelector(
              ".countdown-minutes"
            ) as HTMLElement | null;
            const secondsEl = el.querySelector(
              ".countdown-seconds"
            ) as HTMLElement | null;

            // Function to pad numbers with leading zeros
            const pad = (num: number) => String(num).padStart(2, "0");

            const updateCountdown = () => {
              const now = new Date();
              const diff = targetDate.getTime() - now.getTime();

              if (diff <= 0) {
                // Countdown finished
                if (daysEl) daysEl.textContent = "00";
                if (hoursEl) hoursEl.textContent = "00";
                if (minutesEl) minutesEl.textContent = "00";
                if (secondsEl) secondsEl.textContent = "00";

                if (autoHide) {
                  el.style.display = "none";
                }

                // Dispatch custom event
                el.dispatchEvent(
                  new CustomEvent("countdown-finished", {
                    bubbles: true,
                    detail: { targetDate },
                  })
                );

                return false; // Stop interval
              }

              // Calculate time units
              const days = Math.floor(diff / (1000 * 60 * 60 * 24));
              const hours = Math.floor(
                (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
              );
              const minutes = Math.floor(
                (diff % (1000 * 60 * 60)) / (1000 * 60)
              );
              const seconds = Math.floor((diff % (1000 * 60)) / 1000);

              // Reset all elements to visible first
              if (daysEl) daysEl.style.display = "";
              if (hoursEl) hoursEl.style.display = "";
              if (minutesEl) minutesEl.style.display = "";
              if (secondsEl) secondsEl.style.display = "";

              // Reset unit labels
              const units = el.querySelectorAll(".countdown-unit");
              units.forEach((unit: Element) => {
                (unit as HTMLElement).style.display = "";
              });

              // Update display based on format
              switch (format) {
                case "dhm":
                  if (daysEl) daysEl.textContent = pad(days);
                  if (hoursEl) hoursEl.textContent = pad(hours);
                  if (minutesEl) minutesEl.textContent = pad(minutes);
                  if (secondsEl) {
                    secondsEl.style.display = "none";
                    const secondsUnit =
                      secondsEl.nextElementSibling as HTMLElement;
                    if (
                      secondsUnit &&
                      secondsUnit.classList.contains("countdown-unit")
                    ) {
                      secondsUnit.style.display = "none";
                    }
                  }
                  break;
                case "hms":
                  if (daysEl) {
                    daysEl.style.display = "none";
                    const daysUnit = daysEl.nextElementSibling as HTMLElement;
                    if (
                      daysUnit &&
                      daysUnit.classList.contains("countdown-unit")
                    ) {
                      daysUnit.style.display = "none";
                    }
                  }
                  if (hoursEl) hoursEl.textContent = pad(hours + days * 24);
                  if (minutesEl) minutesEl.textContent = pad(minutes);
                  if (secondsEl) secondsEl.textContent = pad(seconds);
                  break;
                case "days":
                  if (daysEl) daysEl.textContent = String(days);
                  if (hoursEl) {
                    hoursEl.style.display = "none";
                    const hoursUnit = hoursEl.nextElementSibling as HTMLElement;
                    if (
                      hoursUnit &&
                      hoursUnit.classList.contains("countdown-unit")
                    ) {
                      hoursUnit.style.display = "none";
                    }
                  }
                  if (minutesEl) {
                    minutesEl.style.display = "none";
                    const minutesUnit =
                      minutesEl.nextElementSibling as HTMLElement;
                    if (
                      minutesUnit &&
                      minutesUnit.classList.contains("countdown-unit")
                    ) {
                      minutesUnit.style.display = "none";
                    }
                  }
                  if (secondsEl) {
                    secondsEl.style.display = "none";
                    const secondsUnit =
                      secondsEl.nextElementSibling as HTMLElement;
                    if (
                      secondsUnit &&
                      secondsUnit.classList.contains("countdown-unit")
                    ) {
                      secondsUnit.style.display = "none";
                    }
                  }
                  break;
                default: // full
                  if (daysEl) daysEl.textContent = pad(days);
                  if (hoursEl) hoursEl.textContent = pad(hours);
                  if (minutesEl) minutesEl.textContent = pad(minutes);
                  if (secondsEl) secondsEl.textContent = pad(seconds);
              }

              return true; // Continue interval
            };

            // Initial update
            updateCountdown();

            // Update every second
            const intervalId = setInterval(() => {
              if (!updateCountdown()) {
                clearInterval(intervalId);
              }
            }, 1000);

            // Cleanup on element removal
            const cleanup = () => {
              clearInterval(intervalId);
            };

            // Store cleanup function for potential future use
            (el as any).__countdownCleanup = cleanup;
          };

          // Initialize when DOM is ready
          if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", initCountdown);
          } else {
            initCountdown();
          }
        },
        toolbar: [
          {
            attributes: { class: "fa fa-arrows", title: "Move" },
            command: "tlb-move",
          },
          {
            attributes: { class: "fa fa-clock-o", title: "Set Date & Time" },
            command: "set-countdown-date",
          },
          {
            attributes: { class: "fa fa-trash-o", title: "Delete" },
            command: "tlb-delete",
          },
        ],
      },

      init() {
        // Recursively disable selection on all child components
        const disableChildren = (comp: any) => {
          comp.set({
            selectable: false,
            hoverable: false,
            editable: false,
            draggable: false,
            droppable: false,
            layerable: false,
            highlightable: false,
          });
          const children: any = comp.components();
          if (children && typeof children.each === "function") {
            children.each((child: any) => disableChildren(child));
          }
        };

        // Disable all children after initialization
        const myChildren: any = this.components();
        if (myChildren && typeof myChildren.each === "function") {
          myChildren.each((child: any) => disableChildren(child));
        }

        // Listen for new children being added and disable them too
        this.on("add", (added: any) => {
          if (added !== this) {
            disableChildren(added);
          }
        });
      },
    },

    view: {
      init() {
        // Listen for attribute changes to update the countdown
        this.listenTo(
          this.model,
          "change:attributes:data-countdown-date",
          this.onDateChange
        );
        this.listenTo(
          this.model,
          "change:attributes:data-countdown-format",
          this.onFormatChange
        );
      },

      onDateChange() {
        // Re-render when date changes
        this.render();
      },

      onFormatChange() {
        // Re-render when format changes
        this.render();
      },
    },
  });

  // Add the countdown timer block to the block manager
  bm.add("countdown-timer", {
    label: "Countdown",
    media: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1" fill="none"/>
      <path d="M12 12L12 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <path d="M12 12L15 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <circle cx="12" cy="12" r="1" fill="currentColor"/>
      <circle cx="12" cy="4" r="0.5" fill="currentColor"/>
      <circle cx="12" cy="20" r="0.5" fill="currentColor"/>
      <circle cx="20" cy="12" r="0.5" fill="currentColor"/>
      <circle cx="4" cy="12" r="0.5" fill="currentColor"/>
    </svg>`,
    category: "Data",
    content: { type: "countdown-timer" },
  });

  // Add custom CSS for countdown component
  editor.on("load", () => {
    const frameDoc = editor.Canvas.getFrameEl()?.contentDocument;
    if (frameDoc && !frameDoc.getElementById("countdown-styles")) {
      const style = frameDoc.createElement("style");
      style.id = "countdown-styles";
      style.innerHTML = `
        .pcf-countdown {
          display: inline-block;
          border: 2px dotted #999;
          padding: 10px;
          min-width: 200px;
          cursor: pointer;
        }
        
        .countdown-display {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
        }
        
        .countdown-label {
          font-weight: 600;
          margin-right: 10px;
        }
        
        .countdown-days,
        .countdown-hours,
        .countdown-minutes,
        .countdown-seconds {
          font-family: 'Courier New', monospace;
          font-weight: bold;
          background: rgba(255, 255, 255, 0.2);
          padding: 2px 6px;
          border-radius: 4px;
        }
        
        .countdown-unit {
          font-size: 0.8em;
          opacity: 0.8;
        }
        
        .hidden {
          display: none !important;
        }
        
        @media (max-width: 768px) {
          .pcf-countdown {
            font-size: 18px;
          }
        }
      `;
      frameDoc.head.appendChild(style);
    }
  });
};
