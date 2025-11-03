import type { Editor } from "grapesjs";

// A lightweight, self-contained carousel block that users can drag to the canvas.
// It renders a two-column hero-like slide similar to the provided image: text on the left (blue background)
// and an image on the right, plus prev/next arrows and small dot indicators.
// The block content includes scoped styles so multiple instances can coexist.
export default function carouselPlugin(editor: Editor) {
  const bm = editor.BlockManager;

  bm.add("pcf-carousel", {
    label: "Carousel",
    media: `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
         viewBox="0 0 24 24">
      <!-- Left slide -->
      <rect x="2" y="6" width="7" height="12" rx="2" fill="currentColor"/>
      <!-- Center slide -->
      <rect x="8.5" y="4" width="7" height="16" rx="2" fill="currentColor"/>
      <!-- Right slide -->
      <rect x="15" y="6" width="7" height="12" rx="2" fill="currentColor"/>
    </svg>
  `,
    category: {
      id: "components",
      label: "Components",
      open: true,
    },
    content: `
<style>
	/* Scoped with .pcf-carousel to avoid leaking styles */
	.pcf-carousel { position: relative; width: 100%; overflow: hidden; border-radius: 6px; }
	.pcf-carousel .pcf-slides { display: flex; transition: transform .4s ease; }
	.pcf-carousel .pcf-slide { min-width: 100%; display: flex; align-items: stretch; }
	.pcf-carousel .pcf-slide .pcf-left { flex: 1 1 50%; background:#072c7c; color:#fff; padding: 48px 40px; display:flex; flex-direction:column; justify-content:center; align-items:flex-start; }
	.pcf-carousel .pcf-slide .pcf-title { font-size: 40px; line-height: 1.15; font-weight: 800; margin: 0 0 16px; }
	.pcf-carousel .pcf-slide .pcf-desc { font-size: 16px; line-height: 1.5; margin: 0 0 24px; opacity: .95; }
	.pcf-carousel .pcf-slide .pcf-btn { display: inline-block; margin-left: auto !important; background:#fff; color:#6d2c91; border:0; border-radius:24px; padding: 12px 20px; font-weight:700; cursor:pointer; text-decoration:none; }
	.pcf-carousel .pcf-slide .pcf-right { flex: 1 1 50%; background:#f4f6fb; position:relative; }
	.pcf-carousel .pcf-slide .pcf-right img { width:100%; height:100%; object-fit:cover; display:block; }
  .pcf-carousel .pcf-nav { position:absolute; top:50%; transform:translateY(-50%); display:flex; align-items:center; justify-content:center; background:transparent; color:#888; cursor:pointer; user-select:none; transition: color .15s ease; }
  .pcf-carousel .pcf-nav:hover { color:#fff; }
  .pcf-carousel .pcf-nav svg { width:44px; height:44px; display:block; }
  .pcf-carousel .pcf-nav svg path { stroke: currentColor; stroke-width: 2.5; stroke-linejoin: round; }
	.pcf-carousel .pcf-prev { left:12px; }
	.pcf-carousel .pcf-next { right:12px; }
  .pcf-carousel .pcf-dots { position:absolute; bottom:12px; left:50%; transform:translateX(-50%); display:flex; gap:10px; }
  .pcf-carousel .pcf-dot { width:12px; height:12px; border-radius:50%; border:2px solid #ffffff; background:transparent; opacity:.9; transition: background .15s ease, transform .15s ease, opacity .15s ease; }
  .pcf-carousel .pcf-dot.active { background:#ffffff; opacity:1; }
  .pcf-carousel .pcf-dot:hover { transform: scale(1.05); opacity:1; }
	@media (max-width: 768px) {
		.pcf-carousel .pcf-slide { flex-direction: column; }
		.pcf-carousel .pcf-slide .pcf-left { padding: 28px 20px; }
		.pcf-carousel .pcf-slide .pcf-title { font-size: 28px; }
	}
</style>

<div class="pcf-carousel-outer" data-gjs-type="pcf-carousel" style="border: 2px dashed #6aa0ff; border-radius: 8px; padding: 6px;">
<div class="pcf-carousel" data-index="0" data-interval="2000">
	<div class="pcf-slides">
		<!-- Slide 1 -->
		<div class="pcf-slide" data-gjs-droppable=".pcf-left, .pcf-right">
			<div class="pcf-left">
        <h2 class="pcf-title" data-gjs-type="text" data-gjs-editable="true">New Slide Title</h2>
        <p class="pcf-desc" data-gjs-type="text" data-gjs-editable="true">Slide description goes here.</p>
        <a class="pcf-btn" href="#" data-gjs-type="text" data-gjs-editable="true">Read More</a>
			</div>
			<div class="pcf-right">
				<img src="https://www.svgrepo.com/show/508699/landscape-placeholder.svg" />
			</div>
		</div>

		<!-- Slide 2 -->
    <div class="pcf-slide" data-gjs-droppable=".pcf-left, .pcf-right">
			<div class="pcf-left">
        <h2 class="pcf-title" data-gjs-type="text" data-gjs-editable="true">New Slide Title</h2>
        <p class="pcf-desc" data-gjs-type="text" data-gjs-editable="true">Slide description goes here.</p>
        <a class="pcf-btn" href="#" data-gjs-type="text" data-gjs-editable="true">Read More</a>
			</div>
			<div class="pcf-right">
				<img src="https://www.svgrepo.com/show/508699/landscape-placeholder.svg" />
			</div>
		</div>

		<!-- Slide 3 -->
    
	</div>

  <div class="pcf-nav pcf-prev" aria-label="Previous">
  <svg viewBox="-19.04 0 75.804 75.804" xmlns="http://www.w3.org/2000/svg" fill="currentColor" transform="matrix(-1, 0, 0, 1, 0, 0)">
      <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
      <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
      <g id="SVGRepo_iconCarrier">
        <g id="Group_65" data-name="Group 65" transform="translate(-831.568 -384.448)">
          <path id="Path_57" data-name="Path 57" d="M833.068,460.252a1.5,1.5,0,0,1-1.061-2.561l33.557-33.56a2.53,2.53,0,0,0,0-3.564l-33.557-33.558a1.5,1.5,0,0,1,2.122-2.121l33.556,33.558a5.53,5.53,0,0,1,0,7.807l-33.557,33.56A1.5,1.5,0,0,1,833.068,460.252Z" fill="currentColor"></path>
        </g>
      </g>
    </svg>
  </div>
  <div class="pcf-nav pcf-next" aria-label="Next">
  <svg viewBox="-19.04 0 75.804 75.804" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
      <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
      <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
      <g id="SVGRepo_iconCarrier">
        <g id="Group_65" data-name="Group 65" transform="translate(-831.568 -384.448)">
          <path id="Path_57" data-name="Path 57" d="M833.068,460.252a1.5,1.5,0,0,1-1.061-2.561l33.557-33.56a2.53,2.53,0,0,0,0-3.564l-33.557-33.558a1.5,1.5,0,0,1,2.122-2.121l33.556,33.558a5.53,5.53,0,0,1,0,7.807l-33.557,33.56A1.5,1.5,0,0,1,833.068,460.252Z" fill="currentColor"></path>
        </g>
      </g>
    </svg>
  </div>
  <div class="pcf-dots" role="tablist" aria-label="Slide indicators">
    <div class="pcf-dot active" role="button" aria-label="Go to slide 1"></div>
    <div class="pcf-dot" role="button" aria-label="Go to slide 2"></div>
  </div>
</div>

</div>

<script>
  (function(){
    var host = document.currentScript ? document.currentScript.previousElementSibling : null;
    var root = null;
    if(host){
      root = (host.classList && host.classList.contains('pcf-carousel')) ? host : host.querySelector('.pcf-carousel');
    }
    if(!root){ root = document.querySelector('.pcf-carousel'); }
    if(!root) return;

    // Don't run this inline script while editing in GrapesJS (editor adds 'gjs-dashed' to the body)
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

		var prev = root.querySelector('.pcf-prev');
		var next = root.querySelector('.pcf-next');
		prev && prev.addEventListener('click', function(e){ e.preventDefault(); go(idx-1); });
		next && next.addEventListener('click', function(e){ e.preventDefault(); go(idx+1); });
		dots.forEach(function(d, i){ d.addEventListener('click', function(){ go(i); }); });

  // Autoplay using configurable interval (ms) via data-interval
  var interval = parseInt(root.getAttribute('data-interval') || '2000', 10) || 2000;
  var autoplay = setInterval(function(){ go(idx+1); }, interval);
		root.addEventListener('mouseenter', function(){ clearInterval(autoplay); });
	})();
</script>

		`,
  });

  // Component type to enable toolbar actions on the root .pcf-carousel
  const dc = editor.DomComponents;
  dc.addType("pcf-carousel", {
    isComponent: (el: HTMLElement) => {
      if (!el) return false;
      if (
        el.getAttribute &&
        el.getAttribute("data-gjs-type") === "pcf-carousel"
      )
        return true;
      const cls = (el.classList || { contains: () => false }) as DOMTokenList;
      return cls.contains("pcf-carousel-outer") || cls.contains("pcf-carousel");
    },
    model: {
      defaults: {
        name: "Carousel",
        droppable: false,
        // Run inside canvas so arrows/dots work while editing
        script: function (this: any) {
          // Safety check: ensure 'this' is a valid context
          if (!this || typeof this.querySelector !== "function") {
            console.warn("[Carousel] Invalid context in script");
            return;
          }

          var host = this as unknown as HTMLElement;
          // avoid double binding
          if ((host as any).__pcfCarouselInit) return;
          (host as any).__pcfCarouselInit = true;

          var root: HTMLElement | null = host.classList.contains("pcf-carousel")
            ? (host as HTMLElement)
            : (host.querySelector(".pcf-carousel") as HTMLElement | null);
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
              prev: root!.querySelector(".pcf-prev") as HTMLElement,
              next: root!.querySelector(".pcf-next") as HTMLElement,
            };
          }

          function go(n: number) {
            var q = query();
            var total = q.slides.length || 1;
            idx = (n + total) % total;
            root!.setAttribute("data-index", String(idx));
            if (q.slidesWrap)
              q.slidesWrap.style.transform = "translateX(" + -idx * 100 + "%)";
            q.dots.forEach(function (d: HTMLElement, i: number) {
              if (i === idx) d.classList.add("active");
              else d.classList.remove("active");
            });
          }

          // Autoplay controls with selection awareness
          var pausedBySelection = false;
          function stopAutoplay() {
            var tm = (host as any).__pcfCarouselTimer;
            if (tm) clearInterval(tm);
            (host as any).__pcfCarouselTimer = null;
          }
          function startAutoplay() {
            stopAutoplay();
            var interval =
              parseInt(root!.getAttribute("data-interval") || "2000", 10) ||
              2000;
            (host as any).__pcfCarouselTimer = setInterval(function () {
              go(idx + 1);
            }, interval);
          }

          function isAnyPartSelected(): boolean {
            var sel = document.querySelector(
              ".gjs-selected"
            ) as HTMLElement | null;
            // Pause if a child is selected OR the outer border itself is selected
            return !!(sel && (host.contains(sel) || sel.contains(host)));
          }

          function updateSelectionPause() {
            var shouldPause = isAnyPartSelected();
            if (shouldPause && !pausedBySelection) {
              pausedBySelection = true;
              stopAutoplay();
            } else if (!shouldPause && pausedBySelection) {
              pausedBySelection = false;
              startAutoplay();
            }
          }

          // Observe selection changes (class mutations) across the document
          try {
            var mo = new MutationObserver(function () {
              updateSelectionPause();
            });
            mo.observe(document.body, {
              attributes: true,
              subtree: true,
              attributeFilter: ["class"],
            });
          } catch (_) {
            // Fallback: periodic check
            setInterval(updateSelectionPause, 400);
          }

          // Delegated events so newly added slides/dots also work
          host.addEventListener("click", function (ev: any) {
            var t = ev.target as HTMLElement;
            if (!t) return;
            if (t.closest(".pcf-prev")) {
              ev.preventDefault();
              // Allow manual nav even if selected; selection only pauses autoplay
              go(idx - 1);
              return;
            }
            if (t.closest(".pcf-next")) {
              ev.preventDefault();
              // Allow manual nav even if selected; selection only pauses autoplay
              go(idx + 1);
              return;
            }
            if (t.classList.contains("pcf-dot")) {
              var q = query();
              var i = q.dots.indexOf(t);
              // Allow manual nav even if selected; selection only pauses autoplay
              if (i >= 0) go(i);
              return;
            }
            // Any other click inside the border should pause autoplay immediately
            stopAutoplay();
          });

          // Autoplay every 2 seconds; pause on hover and when selected
          startAutoplay();
          host.addEventListener("mouseenter", function () {
            stopAutoplay();
          });
          host.addEventListener("mouseleave", function () {
            if (!pausedBySelection) startAutoplay();
          });

          // Initial paint
          go(idx);
          // Ensure initial selection state is respected
          updateSelectionPause();
        },
      },
      init() {
        // Remove move, up/select-parent, and copy/clone from the toolbar
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

        // Ensure our custom add/remove stay present
        if (
          !filtered.some((t: any) => t.command === "pcf-carousel:add-slide")
        ) {
          filtered.push({
            attributes: { class: "fa fa-plus", title: "Add slide" },
            command: "pcf-carousel:add-slide",
          });
        }

        // Add autoplay speed control button
        if (
          !filtered.some((t: any) => t.command === "pcf-carousel:set-interval")
        ) {
          filtered.push({
            attributes: { class: "fa fa-clock-o", title: "Set autoplay (ms)" },
            command: "pcf-carousel:set-interval",
          });
        }
        if (
          !filtered.some((t: any) => t.command === "pcf-carousel:remove-slide")
        ) {
          filtered.push({
            attributes: { class: "fa fa-trash", title: "Remove current slide" },
            command: "pcf-carousel:remove-slide",
          });
        }

        this.set("toolbar", filtered);
      },
    },
  });

  // Helpers to add/remove slides and dots
  const makeNewSlide = () => ({
    tagName: "div",
    attributes: { class: "pcf-slide" },
    components: [
      {
        tagName: "div",
        attributes: { class: "pcf-left" },
        components: [
          {
            tagName: "h2",
            type: "text",
            attributes: { class: "pcf-title", "data-gjs-type": "text" },
            content: "New Slide Title",
            editable: true,
          },
          {
            tagName: "p",
            type: "text",
            attributes: { class: "pcf-desc", "data-gjs-type": "text" },
            content: "Slide description goes here.",
            editable: true,
          },
          {
            tagName: "a",
            type: "text",
            attributes: {
              class: "pcf-btn",
              href: "#",
              "data-gjs-type": "text",
            },
            content: "Read More",
            editable: true,
          },
        ],
      },
      {
        tagName: "div",
        attributes: { class: "pcf-right" },
        components: [
          {
            tagName: "img",
            attributes: {
              src: "https://www.svgrepo.com/show/508699/landscape-placeholder.svg",
              alt: "Slide image",
            },
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
    const rootCmp = cmp.find(".pcf-carousel")[0] || cmp;
    const slides = cmp.find(".pcf-slide");
    const dotsWrap = cmp.find(".pcf-dots")[0];
    if (slides.length <= 1 || !dotsWrap) return; // keep at least one slide

    // Determine currently visible index from the runtime DOM attribute
    let currentIndex = 0;
    try {
      const hostEl =
        rootCmp?.view?.el?.querySelector?.(".pcf-carousel") ||
        rootCmp?.view?.el;
      if (hostEl) {
        // Prefer active dot position
        const dotEls = hostEl.querySelectorAll?.(".pcf-dot");
        if (dotEls && dotEls.length) {
          currentIndex = Array.prototype.findIndex.call(dotEls, (d: Element) =>
            d.classList.contains("active")
          );
          if (currentIndex < 0) currentIndex = 0;
        }
        // Fallback to data-index if needed
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

    // Remove the slide component at the current index
    const toRemove = slides[currentIndex];
    if (toRemove) toRemove.remove();

    // Remove corresponding dot
    const dots = dotsWrap.components();
    if (dots && dots.length && currentIndex < dots.length) {
      const d = dots.at(currentIndex);
      d && d.remove && d.remove();
    }

    // Adjust new index if deleted last slide
    const newSlides = cmp.find(".pcf-slide");
    let newIndex = Math.min(currentIndex, Math.max(0, newSlides.length - 1));

    // Update DOM transform and dot active state in the canvas runtime
    try {
      const hostEl =
        rootCmp?.view?.el?.querySelector?.(".pcf-carousel") ||
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
      /* ignore */
    }
  };

  // Commands bound to toolbar
  editor.Commands.add("pcf-carousel:add-slide", {
    run(ed) {
      const cmp = ed.getSelected();
      if (cmp) addSlide(cmp);
    },
  });

  editor.Commands.add("pcf-carousel:remove-slide", {
    run(ed) {
      const cmp = ed.getSelected();
      if (cmp) removeSlide(cmp);
    },
  });

  // Command to set autoplay interval (milliseconds)
  editor.Commands.add("pcf-carousel:set-interval", {
    run(ed) {
      const cmp: any = ed.getSelected();
      if (!cmp) return;
      const root = cmp.find(".pcf-carousel")[0] || cmp;
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

      // Show modal
      modal.open({ title: "Carousel Autoplay", content: container });

      function close() {
        modal.close();
      }
      function persist(val: number) {
        root.addAttributes({ "data-interval": String(val || 0) });
        if (el) el.setAttribute("data-interval", String(val || 0));
        try {
          const host: any = el?.closest?.(".pcf-carousel-outer") || el;
          if (host && host.__pcfCarouselTimer) {
            clearInterval(host.__pcfCarouselTimer);
            host.__pcfCarouselTimer = null;
          }
          if (el) el.dispatchEvent(new Event("mouseleave"));
        } catch (_) {
          /* noop */
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
}
