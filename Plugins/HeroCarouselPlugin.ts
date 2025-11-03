import type { Editor } from "grapesjs";

export default function heroCarouselPlugin(editor: Editor) {
  const bm = editor.BlockManager;

  bm.add("pcf-hero-carousel", {
 label: "HeroCarousel",
  media: `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
      <!-- Large hero slide -->
      <rect x="2" y="4" width="14" height="16" rx="2" fill="currentColor"/>
      <!-- Small slide on top-right -->
      <rect x="17" y="4" width="5" height="7" rx="1" fill="currentColor"/>
      <!-- Small slide on bottom-right -->
      <rect x="17" y="13" width="5" height="7" rx="1" fill="currentColor"/>
    </svg>
  `,
    category: {
      id: "components",
      label: "Components",
      open: true,
    },
    content: `
<style>
  /* Scoped with .pcf-hero-carousel to avoid leaking styles */
  .pcf-hero-carousel { position: relative; width: 100%; overflow: hidden; --hero-title-color:#0a3ea9; }
  .pcf-hero-carousel .pcf-slides { display: flex; transition: transform .45s ease; }
  .pcf-hero-carousel .pcf-slide { position: relative; min-width: 100%; height: 500px; }
  .pcf-hero-carousel .pcf-img-wrap { position:absolute; inset:0; }
  .pcf-hero-carousel .pcf-img-wrap img { width:100%; height:100%; object-fit:cover; display:block; }
  .pcf-hero-carousel .pcf-overlay { position:absolute; inset:0; display:flex; align-items:flex-end; pointer-events:none; background: linear-gradient(180deg, rgba(0,0,0,0) 35%, rgba(0,0,0,0.65) 100%); }
  .pcf-hero-carousel .pcf-overlay-inner { width:100%; color:#fff; padding: 18px 28px 28px; max-width: 1100px; margin: 0 auto; pointer-events:auto; }
  .pcf-hero-carousel .pcf-title { font-size: 40px; line-height: 1.15; font-weight: 800; margin: 0 0 12px; color: var(--hero-title-color); }
  .pcf-hero-carousel .pcf-desc { font-size: 18px; line-height: 1.55; margin: 0 0 18px; opacity: .95; color:#ffffff; }
  .pcf-hero-carousel .pcf-btn { display:inline-block; color:#fff; border:2px solid #ffffff; background:transparent; border-radius:6px; padding: 10px 16px; font-weight:700; text-decoration:none; transition: all .15s ease; }
  .pcf-hero-carousel .pcf-btn:hover { background:#ffffff; color:#000; }
  /* Dots */
  .pcf-hero-carousel .pcf-dots { position:absolute; bottom:12px; left:50%; transform:translateX(-50%); display:flex; gap:8px; z-index:3; }
  .pcf-hero-carousel .pcf-dot { width:10px; height:10px; border-radius:50%; border:2px solid #ffffff; background:transparent; opacity:.9; transition: background .15s ease, transform .15s ease, opacity .15s ease; cursor:pointer; }
  .pcf-hero-carousel .pcf-dot.active { background:#ffffff; opacity:1; }
  .pcf-hero-carousel .pcf-dot:hover { transform: scale(1.05); opacity:1; }

  @media (max-width: 768px) {
    .pcf-hero-carousel .pcf-slide { height: 500px; }
    .pcf-hero-carousel .pcf-title { font-size: 28px; }
    .pcf-hero-carousel .pcf-desc { font-size: 15px; }
  }
  /* Show dashed border only inside GrapesJS editor */
  .gjs-dashed .pcf-hero-carousel-outer { border: 2px dashed #6aa0ff; padding: 6px; }
</style>

<div class="pcf-hero-carousel-outer" data-gjs-type="pcf-hero-carousel">
<div class="pcf-hero-carousel" data-index="0" data-interval="2000">
  <div class="pcf-slides">
    <!-- Slide 1 -->
    <div class="pcf-slide" data-gjs-droppable=".pcf-overlay-inner">
      <div class="pcf-img-wrap"><img src="https://www.svgrepo.com/show/508699/landscape-placeholder.svg" alt="Background" /></div>
      <div class="pcf-overlay">
        <div class="pcf-overlay-inner">
          <h2 class="pcf-title" data-gjs-editable="true">New Slide Title</h2>
          <p class="pcf-desc" data-gjs-editable="true">Slide description goes here.</p>
          <a class="pcf-btn" href="#" data-gjs-editable="true">LEARN MORE</a>
        </div>
      </div>
    </div>

    <!-- Slide 2 -->
    <div class="pcf-slide" data-gjs-droppable=".pcf-overlay-inner">
      <div class="pcf-img-wrap"><img src="https://www.svgrepo.com/show/508699/landscape-placeholder.svg" alt="Magnifiers" /></div>
      <div class="pcf-overlay">
        <div class="pcf-overlay-inner">
          <h2 class="pcf-title" data-gjs-editable="true">New Slide Title</h2>
          <p class="pcf-desc" data-gjs-editable="true">Slide description goes here.</p>
          <a class="pcf-btn" href="#" data-gjs-editable="true">LEARN MORE</a>
        </div>
      </div>
    </div>

    <!-- Slide 3 -->
    <div class="pcf-slide" data-gjs-droppable=".pcf-overlay-inner">
      <div class="pcf-img-wrap"><img src="https://www.svgrepo.com/show/508699/landscape-placeholder.svg" alt="Information" /></div>
      <div class="pcf-overlay">
        <div class="pcf-overlay-inner">
          <h2 class="pcf-title" data-gjs-editable="true">New Slide Title</h2>
          <p class="pcf-desc" data-gjs-editable="true">Slide description goes here.</p>
          <a class="pcf-btn" href="#" data-gjs-editable="true">LEARN MORE</a>
        </div>
      </div>
    </div>
  </div>

  <div class="pcf-dots" role="tablist" aria-label="Slide indicators">
    <div class="pcf-dot active" role="button" aria-label="Go to slide 1"></div>
    <div class="pcf-dot" role="button" aria-label="Go to slide 2"></div>
    <div class="pcf-dot" role="button" aria-label="Go to slide 3"></div>
  </div>
</div>

</div>

<script>
  (function(){
    var host = document.currentScript ? document.currentScript.previousElementSibling : null;
    var root = null;
    if(host){
      root = (host.classList && host.classList.contains('pcf-hero-carousel')) ? host : host.querySelector('.pcf-hero-carousel');
    }
    if(!root){ root = document.querySelector('.pcf-hero-carousel'); }
    if(!root) return;

    // Don't run this inline script while editing in GrapesJS
    try {
      if (document && document.body && document.body.classList && document.body.classList.contains('gjs-dashed')) {
        return;
      }
    } catch(_) {}

    var slidesWrap = root.querySelector('.pcf-slides');
    var dots = Array.prototype.slice.call(root.querySelectorAll('.pcf-dot'));
    var slides = Array.prototype.slice.call(root.querySelectorAll('.pcf-slide'));
    var idx = parseInt(root.getAttribute('data-index') || '0', 10) || 0;

    function go(n){
      idx = (n + slides.length) % slides.length;
      root.setAttribute('data-index', String(idx));
      slidesWrap.style.transform = 'translateX(' + (-idx * 100) + '%)';
      dots.forEach(function(d, i){ d.classList.toggle('active', i === idx); });
    }

    // Arrows removed
    dots.forEach(function(d, i){ d.addEventListener('click', function(){ go(i); }); });

    var interval = parseInt(root.getAttribute('data-interval') || '2000', 10) || 2000;
    var autoplay = setInterval(function(){ go(idx+1); }, interval);
    root.addEventListener('mouseenter', function(){ clearInterval(autoplay); });
  })();
</script>

    `,
  });

  const dc = editor.DomComponents;
  dc.addType("pcf-hero-carousel", {
    isComponent: (el: HTMLElement) => {
      if (!el) return false;
      if (
        el.getAttribute &&
        el.getAttribute("data-gjs-type") === "pcf-hero-carousel"
      )
        return true;
      const cls = (el.classList || { contains: () => false }) as DOMTokenList;
      return (
        cls.contains("pcf-hero-carousel-outer") ||
        cls.contains("pcf-hero-carousel")
      );
    },
    model: {
      defaults: {
        name: "Hero Carousel",
        droppable: false,
        attributes: {
          "data-current-slide": "0",
          "data-autoplay-paused": "false",
        },
        script: function (this: any) {
          // Safety check: ensure 'this' is a valid context
          if (!this || typeof this.querySelector !== 'function') {
            console.warn('[HeroCarousel] Invalid context in script');
            return;
          }
          
          var host = this as unknown as HTMLElement;

          // Check if already initialized and still valid
          if ((host as any).__pcfCarouselInit) {
            // Verify the initialization is still valid
            var existingTimer = (host as any).__pcfCarouselTimer;
            var rootCheck = host.classList.contains("pcf-hero-carousel")
              ? host
              : host.querySelector(".pcf-hero-carousel");

            if (rootCheck && existingTimer !== undefined) {
              // Already properly initialized, just update the current state
              try {
                var currentIdx =
                  parseInt(rootCheck.getAttribute("data-index") || "0", 10) ||
                  0;
                host.setAttribute("data-current-slide", String(currentIdx));
              } catch (_) {
                // Ignore update errors
              }
              return;
            }
          }

          (host as any).__pcfCarouselInit = true;

          var root: HTMLElement | null = host.classList.contains(
            "pcf-hero-carousel"
          )
            ? (host as HTMLElement)
            : (host.querySelector(".pcf-hero-carousel") as HTMLElement | null);
          if (!root) return;

          var idx = parseInt(root.getAttribute("data-index") || "0", 10) || 0;

          function query() {
            return {
              slidesWrap: root!.querySelector(".pcf-slides") as HTMLElement,
              slides: Array.prototype.slice.call(
                root!.querySelectorAll(".pcf-slide")
              ) as HTMLElement[],
              dots: Array.prototype.slice.call(
                root!.querySelectorAll(".pcf-dot")
              ) as HTMLElement[],
              // arrows removed
            };
          }

          function go(n: number) {
            var q = query();
            var total = q.slides.length || 1;
            idx = (n + total) % total;
            root!.setAttribute("data-index", String(idx));

            // Update host element's data attributes for GrapesJS component state
            try {
              host.setAttribute("data-current-slide", String(idx));
            } catch (_) {
              // Ignore attribute update errors
            }

            if (q.slidesWrap)
              q.slidesWrap.style.transform = "translateX(" + -idx * 100 + "%)";
            q.dots.forEach(function (d: HTMLElement, i: number) {
              if (i === idx) d.classList.add("active");
              else d.classList.remove("active");
            });

            // Trigger component update if we're in GrapesJS
            try {
              var gjsEditor = (window as any).editor || (parent as any).editor;
              if (gjsEditor && gjsEditor.trigger) {
                gjsEditor.trigger("component:update");
              }
            } catch (_) {
              // Ignore editor update errors
            }
          }

          var pausedBySelection = false;
          var pausedByEdit = false;

          function stopAutoplay() {
            var tm = (host as any).__pcfCarouselTimer;
            if (tm) clearInterval(tm);
            (host as any).__pcfCarouselTimer = null;
          }

          function startAutoplay() {
            // Don't start if paused by selection or editing
            if (pausedBySelection || pausedByEdit) return;

            stopAutoplay();
            var interval =
              parseInt(root!.getAttribute("data-interval") || "2000", 10) ||
              2000;

            // Don't start autoplay if interval is 0 (disabled)
            if (interval <= 0) return;

            (host as any).__pcfCarouselTimer = setInterval(function () {
              go(idx + 1);
            }, interval);
          }

          function isAnyPartSelected(): boolean {
            var sel = document.querySelector(
              ".gjs-selected"
            ) as HTMLElement | null;
            return !!(sel && (host.contains(sel) || sel.contains(host)));
          }

          function isEditingMode(): boolean {
            // Check if we're in GrapesJS editing mode
            try {
              if (document.body.classList.contains("gjs-dashed")) return true;
              if (document.querySelector(".gjs-editor")) return true;
              // Check for contenteditable elements within carousel
              var editableEls = host.querySelectorAll(
                '[contenteditable="true"]'
              );
              for (var i = 0; i < editableEls.length; i++) {
                if (editableEls[i] === document.activeElement) return true;
              }
              return false;
            } catch (_) {
              return false;
            }
          }

          function updateSelectionPause() {
            var shouldPause = isAnyPartSelected();
            var isEditing = isEditingMode();

            if ((shouldPause || isEditing) && !pausedBySelection) {
              pausedBySelection = true;
              pausedByEdit = isEditing;
              stopAutoplay();
            } else if (!shouldPause && !isEditing && pausedBySelection) {
              pausedBySelection = false;
              pausedByEdit = false;
              // Delay restart to ensure editing has finished
              setTimeout(startAutoplay, 500);
            }
          }

          try {
            var mo = new MutationObserver(function () {
              updateSelectionPause();
            });
            // Only observe the GrapesJS canvas area, not the entire document to avoid interfering with device manager
            const canvasEl =
              document.querySelector(".gjs-cv-canvas") ||
              document.querySelector(".gjs-frame");
            if (canvasEl) {
              mo.observe(canvasEl, {
                attributes: true,
                subtree: true,
                attributeFilter: ["class"],
              });
            } else {
              // Fallback: observe just the carousel host element
              mo.observe(host, {
                attributes: true,
                subtree: true,
                attributeFilter: ["class"],
              });
            }

            // Also observe changes within the carousel itself
            var carouselMo = new MutationObserver(function (mutations) {
              mutations.forEach(function (mutation) {
                if (
                  mutation.type === "attributes" &&
                  (mutation.attributeName === "contenteditable" ||
                    mutation.attributeName === "data-gjs-editable")
                ) {
                  updateSelectionPause();
                }
              });
            });
            carouselMo.observe(host, {
              attributes: true,
              subtree: true,
              attributeFilter: ["contenteditable", "data-gjs-editable"],
            });
          } catch (_) {
            setInterval(updateSelectionPause, 200);
          }

          host.addEventListener("click", function (ev: any) {
            var t = ev.target as HTMLElement;
            if (!t) return;

            // Stop autoplay during any interaction
            stopAutoplay();

            // arrows removed
            if (t.classList.contains("pcf-dot")) {
              var q = query();
              var i = q.dots.indexOf(t);
              if (i >= 0) go(i);
              return;
            }
          });

          // Handle focus events for better edit detection
          host.addEventListener("focusin", function (ev: any) {
            pausedByEdit = true;
            stopAutoplay();
          });

          host.addEventListener("focusout", function (ev: any) {
            // Delay check to see if focus moved to another element within carousel
            setTimeout(function () {
              var activeEl = document.activeElement;
              if (!host.contains(activeEl)) {
                pausedByEdit = false;
                updateSelectionPause();
              }
            }, 100);
          });

          // Handle double-click for editing
          host.addEventListener("dblclick", function (ev: any) {
            pausedByEdit = true;
            stopAutoplay();
          });

          startAutoplay();
          host.addEventListener("mouseenter", function () {
            stopAutoplay();
          });
          host.addEventListener("mouseleave", function () {
            if (!pausedBySelection && !pausedByEdit) {
              setTimeout(startAutoplay, 300);
            }
          });

          go(idx);
          updateSelectionPause();
        },
      },
      init() {
        const tb = (this.get("toolbar") || []) as any[];
        const filtered = tb.filter((t: any) => {
          const cmd = (t && t.command) || "";
          return !(
            cmd === "tlb-move" ||
            cmd === "select-parent" ||
            cmd === "tlb-clone" ||
            cmd === "core:component-copy"
          );
        });

        if (
          !filtered.some(
            (t: any) => t.command === "pcf-hero-carousel:add-slide"
          )
        ) {
          filtered.push({
            attributes: { class: "fa fa-plus", title: "Add slide" },
            command: "pcf-hero-carousel:add-slide",
          });
        }
        if (
          !filtered.some(
            (t: any) => t.command === "pcf-hero-carousel:set-interval"
          )
        ) {
          filtered.push({
            attributes: { class: "fa fa-clock-o", title: "Set autoplay (ms)" },
            command: "pcf-hero-carousel:set-interval",
          });
        }
        if (
          !filtered.some(
            (t: any) => t.command === "pcf-hero-carousel:remove-slide"
          )
        ) {
          filtered.push({
            attributes: { class: "fa fa-minus", title: "Remove current slide" },
            command: "pcf-hero-carousel:remove-slide",
          });
        }

        // Ensure any legacy change-image item is stripped
        const sanitized = filtered.filter(
          (t: any) => t.command !== "pcf-hero-carousel:change-image"
        );
        this.set("toolbar", sanitized);
      },
    },
  });

  // Helpers to add/remove slides and dots
  const makeNewSlide = () => ({
    tagName: "div",
    attributes: {
      class: "pcf-slide",
      "data-gjs-droppable": ".pcf-overlay-inner",
    },
    components: [
      {
        tagName: "div",
        attributes: { class: "pcf-img-wrap" },
        components: [
          {
            type: "image",
            tagName: "img",
            attributes: {
              src: "https://www.svgrepo.com/show/508699/landscape-placeholder.svg",
              alt: "Slide image",
            },
          },
        ],
      },
      {
        tagName: "div",
        attributes: { class: "pcf-overlay" },
        components: [
          {
            tagName: "div",
            attributes: { class: "pcf-overlay-inner" },
            components: [
              {
                type: "text",
                tagName: "h2",
                attributes: {
                  class: "pcf-title",
                  "data-gjs-editable": "true",
                },
                content: "New Slide Title",
                editable: true,
              },
              {
                type: "text",
                tagName: "p",
                attributes: {
                  class: "pcf-desc",
                  "data-gjs-editable": "true",
                },
                content: "Slide description goes here.",
                editable: true,
              },
              {
                type: "link",
                tagName: "a",
                attributes: {
                  class: "pcf-btn",
                  href: "#",
                  "data-gjs-editable": "true",
                },
                content: "LEARN MORE",
                editable: true,
              },
            ],
          },
        ],
      },
    ],
  });

  const addSlide = (cmp: any) => {
    if (!cmp) return;
    const slidesWrap = cmp.find(".pcf-slides")[0];
    const dotsWrap = cmp.find(".pcf-dots")[0];
    if (!slidesWrap || !dotsWrap) return;

    const currentDots = dotsWrap.components();
    const nextIndex = currentDots.length + 1;

    slidesWrap.append(makeNewSlide());
    dotsWrap.append({
      tagName: "div",
      attributes: {
        class: "pcf-dot",
        role: "button",
        "aria-label": `Go to slide ${nextIndex}`,
      },
    });
  };

  const removeSlide = (cmp: any) => {
    if (!cmp) return;
    const rootCmp = cmp.find(".pcf-hero-carousel")[0] || cmp;
    const slides = cmp.find(".pcf-slide");
    const dotsWrap = cmp.find(".pcf-dots")[0];
    if (slides.length <= 1 || !dotsWrap) return;

    let currentIndex = 0;
    try {
      const hostEl =
        rootCmp?.view?.el?.querySelector?.(".pcf-hero-carousel") ||
        rootCmp?.view?.el;
      if (hostEl) {
        const dotEls = hostEl.querySelectorAll?.(".pcf-dot");
        if (dotEls && dotEls.length) {
          currentIndex = Array.prototype.findIndex.call(dotEls, (d: Element) =>
            d.classList.contains("active")
          );
          if (currentIndex < 0) currentIndex = 0;
        }
        const idxAttr = hostEl.getAttribute?.("data-index");
        if (
          (dotEls?.length ? false : true) ||
          (dotEls &&
            dotEls.length &&
            !dotEls[currentIndex]?.classList?.contains("active"))
        ) {
          currentIndex = Math.max(
            0,
            Math.min(slides.length - 1, parseInt(idxAttr || "0", 10) || 0)
          );
        }
      }
    } catch (_) {
      currentIndex = 0;
    }

    const toRemove = slides[currentIndex];
    if (toRemove) toRemove.remove();

    const dots = dotsWrap.components();
    if (dots && dots.length && currentIndex < dots.length) {
      const d = dots.at(currentIndex);
      d && d.remove && d.remove();
    }

    const newSlides = cmp.find(".pcf-slide");
    let newIndex = Math.min(currentIndex, Math.max(0, newSlides.length - 1));

    try {
      const hostEl =
        rootCmp?.view?.el?.querySelector?.(".pcf-hero-carousel") ||
        rootCmp?.view?.el;
      const wrapEl = hostEl?.querySelector?.(
        ".pcf-slides"
      ) as HTMLElement | null;
      if (hostEl) hostEl.setAttribute("data-index", String(newIndex));
      if (wrapEl) wrapEl.style.transform = `translateX(${-newIndex * 100}%)`;
      const dotEls = (hostEl?.querySelectorAll?.(".pcf-dot") || []) as any;
      if (dotEls && dotEls.forEach) {
        let i = 0;
        dotEls.forEach((de: HTMLElement) => {
          de.classList.toggle("active", i === newIndex);
          i++;
        });
      }
    } catch (_) {
      // ignore
    }
  };

  editor.Commands.add("pcf-hero-carousel:add-slide", {
    run(ed) {
      const cmp = ed.getSelected();
      if (cmp) addSlide(cmp);
    },
  });

  editor.Commands.add("pcf-hero-carousel:remove-slide", {
    run(ed) {
      const cmp = ed.getSelected();
      if (cmp) removeSlide(cmp);
    },
  });

  editor.Commands.add("pcf-hero-carousel:set-interval", {
    run(ed) {
      const cmp: any = ed.getSelected();
      if (!cmp) return;
      const root = cmp.find(".pcf-hero-carousel")[0] || cmp;
      const el = root?.view?.el as HTMLElement | undefined;
      const current =
        parseInt(el?.getAttribute?.("data-interval") || "2000", 10) || 2000;

      const modal = ed.Modal;
      const id = "pcf-carousel-interval-modal";
      const container = document.createElement("div");
      container.id = id;
      container.style.padding = "10px";
      container.innerHTML = `
        <div style="font-size:14px;margin-bottom:8px;font-weight:600;">Set autoplay interval (ms)</div>
        <input id="pcf-interval-input" type="number" min="0" step="100" value="${current}"
               style="width:100%;padding:6px 8px;border:1px solid #ccc;border-radius:4px;margin-bottom:10px;" />
        <div style="display:flex;gap:8px;justify-content:flex-end;">
          <button id="pcf-interval-cancel" class="gjs-btn-prim gjs-btn" style="background:#888">Cancel</button>
          <button id="pcf-interval-save" class="gjs-btn-prim gjs-btn">Save</button>
        </div>
      `;

      modal.open({ title: "Hero Carousel Autoplay", content: container });

      function close() {
        modal.close();
      }
      function persist(val: number) {
        root.addAttributes({ "data-interval": String(val || 0) });
        if (el) el.setAttribute("data-interval", String(val || 0));
        try {
          const host: any = el?.closest?.(".pcf-hero-carousel-outer") || el;
          if (host && host.__pcfCarouselTimer) {
            clearInterval(host.__pcfCarouselTimer);
            host.__pcfCarouselTimer = null;
          }
          if (el) el.dispatchEvent(new Event("mouseleave"));
        } catch (_) {
          // ignore
        }
      }

      const inputEl = container.querySelector(
        "#pcf-interval-input"
      ) as HTMLInputElement | null;
      const saveBtn = container.querySelector(
        "#pcf-interval-save"
      ) as HTMLButtonElement | null;
      const cancelBtn = container.querySelector(
        "#pcf-interval-cancel"
      ) as HTMLButtonElement | null;

      cancelBtn?.addEventListener("click", function () {
        close();
      });
      saveBtn?.addEventListener("click", function () {
        const raw = (inputEl?.value || "").trim();
        const num = Math.max(0, parseInt(raw, 10) || 0);
        persist(num);
        close();
      });
    },
  });

  editor.Commands.add("pcf-hero-carousel:change-image", {
    run(ed) {
      const cmp: any = ed.getSelected();
      if (!cmp) return;

      const root = cmp.find(".pcf-hero-carousel")[0] || cmp;
      const el = root?.view?.el as HTMLElement | undefined;

      // Get current slide index
      let currentIndex = 0;
      try {
        const idxAttr = el?.getAttribute?.("data-index") || "0";
        currentIndex = parseInt(idxAttr, 10) || 0;
      } catch (_) {
        currentIndex = 0;
      }

      // Find the current slide
      const slides = cmp.find(".pcf-slide");
      if (!slides || slides.length === 0 || currentIndex >= slides.length)
        return;

      const currentSlide = slides[currentIndex];
      const imgComponent = currentSlide.find("img")[0];
      if (!imgComponent) return;

      const currentSrc = imgComponent.getAttributes().src || "";

      const modal = ed.Modal;
      const id = "pcf-carousel-image-modal";
      const container = document.createElement("div");
      container.id = id;
      container.style.padding = "15px";
      container.innerHTML = `
        <div style="font-size:16px;margin-bottom:15px;font-weight:600;">Change Slide Image</div>
        
        <div style="margin-bottom:15px;">
          <label style="display:block;font-weight:500;margin-bottom:5px;">Image URL:</label>
          <input id="pcf-image-url" type="url" placeholder="https://example.com/image.jpg" value="${currentSrc}"
                 style="width:100%;padding:8px;border:1px solid #ccc;border-radius:4px;font-size:14px;" />
        </div>
        
        <div style="margin-bottom:15px;">
          <label style="display:block;font-weight:500;margin-bottom:5px;">Or upload local image:</label>
          <input id="pcf-image-file" type="file" accept="image/*"
                 style="width:100%;padding:8px;border:1px solid #ccc;border-radius:4px;font-size:14px;" />
        </div>
        
        <div id="pcf-image-preview" style="margin-bottom:15px;text-align:center;min-height:100px;border:1px solid #eee;border-radius:4px;padding:10px;background:#f9f9f9;">
          ${
            currentSrc
              ? `<img src="${currentSrc}" style="max-width:100%;max-height:100px;object-fit:contain;" alt="Current image" />`
              : '<div style="color:#999;padding:20px;">No image selected</div>'
          }
        </div>
        
        <div style="display:flex;gap:10px;justify-content:flex-end;">
          <button id="pcf-image-cancel" class="gjs-btn-prim gjs-btn" style="background:#888;">Cancel</button>
          <button id="pcf-image-save" class="gjs-btn-prim gjs-btn">Change Image</button>
        </div>
      `;

      modal.open({ title: "Change Slide Image", content: container });

      const urlInput = container.querySelector(
        "#pcf-image-url"
      ) as HTMLInputElement;
      const fileInput = container.querySelector(
        "#pcf-image-file"
      ) as HTMLInputElement;
      const previewDiv = container.querySelector(
        "#pcf-image-preview"
      ) as HTMLDivElement;
      const saveBtn = container.querySelector(
        "#pcf-image-save"
      ) as HTMLButtonElement;
      const cancelBtn = container.querySelector(
        "#pcf-image-cancel"
      ) as HTMLButtonElement;

      let selectedImageSrc = currentSrc;

      function updatePreview(src: string) {
        selectedImageSrc = src;
        if (src) {
          previewDiv.innerHTML = `<img src="${src}" style="max-width:100%;max-height:100px;object-fit:contain;" alt="Preview" />`;
        } else {
          previewDiv.innerHTML =
            '<div style="color:#999;padding:20px;">No image selected</div>';
        }
      }

      function close() {
        modal.close();
      }

      function saveImage() {
        if (!selectedImageSrc) return;

        // Update the component's src attribute
        imgComponent.addAttributes({ src: selectedImageSrc });

        // Also update the DOM element directly for immediate visual feedback
        try {
          const imgEl = imgComponent.view?.el as HTMLImageElement;
          if (imgEl && imgEl.tagName === "IMG") {
            imgEl.src = selectedImageSrc;
          }
        } catch (_) {
          // ignore DOM update errors
        }

        close();
      }

      // URL input handler
      urlInput.addEventListener("input", function () {
        const url = this.value.trim();
        if (url) {
          fileInput.value = ""; // Clear file input
          updatePreview(url);
        }
      });

      // File input handler
      fileInput.addEventListener("change", function () {
        const file = this.files?.[0];
        if (file && file.type.startsWith("image/")) {
          urlInput.value = ""; // Clear URL input

          const reader = new FileReader();
          reader.onload = function (e) {
            const dataUrl = e.target?.result as string;
            updatePreview(dataUrl);
          };
          reader.readAsDataURL(file);
        }
      });

      // Button handlers
      cancelBtn.addEventListener("click", close);
      saveBtn.addEventListener("click", saveImage);
    },
  });

  // =========================
  // ONLY SHOW TOOLBAR ON ROOT
  // =========================

  // Inject a blue style for root toolbar
  (function injectToolbarStyle() {
    if (document.getElementById("pcf-hero-carousel-toolbar-style")) return;
    const style = document.createElement("style");
    style.id = "pcf-hero-carousel-toolbar-style";
    style.innerHTML = `
      .gjs-toolbar.pcf-blue-toolbar {
        background: #4285f4;
        border: 1px solid #2f6fcc;
        box-shadow: 0 2px 6px rgba(0,0,0,0.25);
      }
      .gjs-toolbar.pcf-blue-toolbar .gjs-toolbar-item,
      .gjs-toolbar.pcf-blue-toolbar .fa,
      .gjs-toolbar.pcf-blue-toolbar svg {
        color: #fff !important;
        fill: #fff !important;
        stroke: #fff !important;
      }
      .gjs-toolbar.pcf-blue-toolbar .gjs-toolbar-item:hover {
        background: rgba(255,255,255,0.15);
      }
    `;
    document.head.appendChild(style);
  })();

  // Helper: is this a table-related component that should be protected from carousel interference?
  function isTableRelatedComponent(cmp: any): boolean {
    if (!cmp) return false;
    
    // Check component type
    const type = cmp.get && cmp.get("type");
    if (type && (type.includes("custom-cell") || type.includes("custom-th") || type.includes("custom-row") || type.includes("custom-table"))) {
      return true;
    }
    
    // Check data-gjs-type attribute
    const attrs = cmp.getAttributes && cmp.getAttributes();
    if (attrs && attrs["data-gjs-type"]) {
      const gjsType = attrs["data-gjs-type"];
      if (gjsType.includes("custom-cell") || gjsType.includes("custom-th") || gjsType.includes("custom-row") || gjsType.includes("custom-table")) {
        return true;
      }
    }
    
    // Check tagName for table elements
    const tagName = cmp.get && cmp.get("tagName");
    if (tagName && (tagName.toLowerCase() === "table" || tagName.toLowerCase() === "td" || tagName.toLowerCase() === "th" || tagName.toLowerCase() === "tr")) {
      return true;
    }
    
    // Check if component is inside a table
    let parent = cmp.parent && cmp.parent();
    while (parent) {
      const parentTagName = parent.get && parent.get("tagName");
      if (parentTagName && parentTagName.toLowerCase() === "table") {
        return true;
      }
      const parentAttrs = parent.getAttributes && parent.getAttributes();
      if (parentAttrs && parentAttrs["data-gjs-type"] && parentAttrs["data-gjs-type"].includes("custom-table")) {
        return true;
      }
      parent = parent.parent && parent.parent();
    }
    
    return false;
  }

  // Helper: is this the root carousel component itself?
  function isCarouselRoot(cmp: any): boolean {
    if (!cmp) return false;
    const at = cmp.getAttributes?.() || {};
    if (at["data-gjs-type"] === "pcf-hero-carousel") return true;
    const el = cmp.getEl?.();
    if (!el) return false;
    return (
      el.classList.contains("pcf-hero-carousel-outer") ||
      el.classList.contains("pcf-hero-carousel")
    );
  }

  // Helper: is cmp inside a carousel (descendant) but not the root
  function isInsideCarouselButNotRoot(cmp: any): boolean {
    if (!cmp) return false;
    if (isCarouselRoot(cmp)) return false;
    let parent = cmp.parent();
    while (parent) {
      if (isCarouselRoot(parent)) return true;
      parent = parent.parent && parent.parent();
    }
    return false;
  }

  // Remove any existing left/right arrow elements from a hero carousel component
  function stripArrows(rootCmp: any) {
    if (!rootCmp) return;
    try {
      const prevs = rootCmp.find && rootCmp.find(".pcf-prev");
      const nexts = rootCmp.find && rootCmp.find(".pcf-next");
      (prevs || []).forEach((c: any) => c && c.remove && c.remove());
      (nexts || []).forEach((c: any) => c && c.remove && c.remove());
    } catch (_) {
      /* ignore */
    }
    // Also remove from the rendered DOM if still present
    try {
      const hostEl = rootCmp?.view?.el as HTMLElement | undefined;
      hostEl
        ?.querySelectorAll(".pcf-prev, .pcf-next")
        ?.forEach((n) => n.remove());
    } catch (_) {
      /* ignore */
    }
  }

  // Strip toolbars from inner nodes on demand
  function stripInnerToolbars(rootCmp: any) {
    if (!rootCmp) return;
    rootCmp.find("*").forEach((child: any) => {
      if (!isCarouselRoot(child)) {
        // Only set once to avoid reflow
        if (child.get("toolbar") && child.get("toolbar").length) {
          child.set("toolbar", []);
        }
      }
    });
  }

  // When a new component is added, if it's a root carousel, strip inner toolbars
  editor.on("component:add", (cmp: any) => {
    // PROTECTION: Skip table-related components to prevent interference with table functionality
    if (isTableRelatedComponent(cmp)) {
      return;
    }
    
    if (isCarouselRoot(cmp)) {
      // Delay to ensure children exist
      setTimeout(() => {
        stripInnerToolbars(cmp);
        stripArrows(cmp);
      }, 0);
    } else if (isInsideCarouselButNotRoot(cmp)) {
      cmp.set("toolbar", []);
    }
  });

  // Core selection logic
  editor.on("component:selected", (cmp: any) => {
    // Don't interfere with device manager or other core GrapesJS functionality
    if (!cmp || cmp.get?.("type") === "wrapper") return;

    const toolsEl = editor.Canvas.getToolsEl?.(); // container with toolbars
    if (!toolsEl) return;

    const toolbar = toolsEl.querySelector(".gjs-toolbar") as HTMLElement | null;

    const rootSelected = isCarouselRoot(cmp);
    const innerSelected = isInsideCarouselButNotRoot(cmp);

    if (rootSelected) {
      // Ensure root has its (custom-filtered) toolbar
      const tb = cmp.get("toolbar") || [];
      if (!tb.length) {
        // (Should already be set from init, but just in case)
        cmp.set("toolbar", [
          {
            attributes: { class: "fa fa-plus", title: "Add slide" },
            command: "pcf-hero-carousel:add-slide",
          },
          {
            attributes: { class: "fa fa-clock-o", title: "Set autoplay (ms)" },
            command: "pcf-hero-carousel:set-interval",
          },
          {
            attributes: { class: "fa fa-minus", title: "Remove current slide" },
            command: "pcf-hero-carousel:remove-slide",
          },
        ]);
      } else {
        // Strip any legacy change-image entry if present
        const sanitized = (tb as any[]).filter(
          (t: any) => t.command !== "pcf-hero-carousel:change-image"
        );
        if (sanitized.length !== (tb as any[]).length) {
          cmp.set("toolbar", sanitized);
        }
      }
      if (toolbar) {
        toolbar.style.display = "";
        toolbar.classList.add("pcf-blue-toolbar");
      }
    } else if (innerSelected) {
      // Hide toolbar completely for inner elements
      if (toolbar) {
        toolbar.style.display = "none";
        toolbar.classList.remove("pcf-blue-toolbar");
      }
      // Ensure the model has no toolbar buttons
      if (cmp.get("toolbar") && cmp.get("toolbar").length) {
        cmp.set("toolbar", []);
      }
    } else {
      // Outside carousel => normal behavior
      if (toolbar) {
        toolbar.style.display = "";
        toolbar.classList.remove("pcf-blue-toolbar");
      }
    }
  });

  // When deselecting, we might re-show toolbar if previously hidden for inner selection
  editor.on("component:deselected", () => {
    const toolsEl = editor.Canvas.getToolsEl?.();
    if (!toolsEl) return;
    const toolbar = toolsEl.querySelector(".gjs-toolbar") as HTMLElement | null;
    if (toolbar && toolbar.style.display === "none") {
      // Let next selection event decide; don't forcibly show here if nothing is selected
      // If nothing selected, GrapesJS hides toolbar anyway.
    }
  });

  // Also ensure existing carousels (if loaded from stored project) are normalized
  editor.on("load", () => {
    const comps = editor.getComponents();
    (function traverse(col: any) {
      col.forEach((c: any) => {
        if (isCarouselRoot(c)) {
          stripInnerToolbars(c);
          stripArrows(c);
        } else if (isInsideCarouselButNotRoot(c)) {
          c.set("toolbar", []);
        }
        if (c.components) traverse(c.components());
      });
    })(comps);
  });
}

