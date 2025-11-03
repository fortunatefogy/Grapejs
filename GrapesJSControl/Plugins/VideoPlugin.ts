import grapesjs from "grapesjs";
import type { Editor } from "grapesjs";

export default function VideoPlugin(editor: Editor, opts: any = {}) {
  const options = { modalTitle: "Insert YouTube video", ...opts };

  // Helper: extract YouTube ID from url or id
  const extractYouTubeId = (value: string) => {
    if (!value) return null;
    value = value.trim();
    // If it's already an id (11 chars, letters numbers - underscore/dash)
    if (/^[A-Za-z0-9_-]{11}$/.test(value)) return value;
    // Try common URL patterns
    const regexes = [
      /v=([A-Za-z0-9_-]{11})/, // watch?v=ID
      /youtu\.be\/([A-Za-z0-9_-]{11})/, // youtu.be/ID
      /embed\/([A-Za-z0-9_-]{11})/, // embed/ID
      /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/, // shorts
    ];
    for (const r of regexes) {
      const m = value.match(r);
      if (m && m[1]) return m[1];
    }
    return null;
  };

  // Create modal content (DOM) and wire events
  // Helper to create embed URL with options like controls, autoplay and loop
  const createEmbedUrl = (videoId: string, opts: any = {}) => {
    const params = new URLSearchParams();
    if (opts.controls !== undefined)
      params.append("controls", String(opts.controls));
    if (opts.loop) {
      params.append("loop", "1");
      params.append("playlist", videoId);
    }
    if (opts.rel === false) params.append("rel", "0");
    const qs = params.toString();
    return `https://www.youtube.com/embed/${videoId}${qs ? "?" + qs : ""}`;
  };

  // Inject minimal dark modal styles similar to youtubevideoPlugins
  const injectModalStyles = () => {
    try {
      const id = "gjs-youtube-exp-modal-styles";
      const doc = editor.Canvas.getDocument();
      if (!doc) return;
      if (doc.getElementById(id)) return;
      const style = doc.createElement("style");
      style.id = id;
      style.textContent = `
        .gjs-yt-modal { padding: 24px; min-width: 350px; max-width: 520px; background: #2c2c2c; border-radius: 8px; color: #fff; text-align: left !important; }
        .gjs-yt-modal label { color: #fff; text-align: left !important; }
        .gjs-yt-modal input[type=text] { width:100%; padding:12px; border:1px solid #555; border-radius:6px; background:#1a1a1a; color:#fff; box-sizing:border-box; }
        .gjs-yt-modal .gjs-yt-options { display:flex; flex-direction:column; gap:10px; align-items: flex-start !important; justify-content: flex-start !important; }
        .gjs-yt-modal .gjs-yt-options label { display:flex !important; align-items:center !important; justify-content:flex-start !important; gap:8px !important; width:100% !important; text-align:left !important; }
        .gjs-yt-modal .gjs-yt-options input[type=checkbox] { margin:0 !important; transform:scale(1.05) !important; float:left !important; }
        .gjs-yt-modal .gjs-yt-options * { text-align:left !important; }
        .gjs-yt-modal .gjs-yt-buttons { display:flex; justify-content:flex-end; gap:12px; margin-top:20px; }
        .gjs-yt-modal button.gjs-yt-save, .gjs-yt-modal button.gjs-yt-cancel { padding:10px 20px; border-radius:6px; cursor:pointer; font-weight:500; }
        .gjs-yt-modal button.gjs-yt-save { background:#007bff !important; color:#fff !important; border:none !important; }
        .gjs-yt-modal button.gjs-yt-cancel { background:#007bff !important; color:#fff !important; border:1px solid #006ae6 !important; opacity:0.95 !important; }
      `;
      doc.head.appendChild(style);
    } catch (e) {
      // ignore
    }
  };

  // Inject responsive CSS into the canvas document so iframes/videos scale with their container
  const injectResponsiveStyles = () => {
    try {
      const id = "gjs-video-responsive-styles";
      const doc = editor.Canvas.getDocument();
      if (!doc) return;
      if (doc.getElementById(id)) return;
      const style = doc.createElement("style");
      style.id = id;
      style.textContent = `
        /* Make embedded videos/iframes responsive inside the editor canvas */
        /* GrapesJS video component wrapper - maintain 16:9 aspect ratio */
        [data-gjs-type="video"] {
          position: relative !important;
          width: 100% !important;
          padding-bottom: 56.25% !important; /* 16:9 aspect ratio */
          height: 0 !important;
          overflow: hidden !important;
        }
        
        /* Position iframe absolutely within the aspect-ratio container */
        [data-gjs-type="video"] iframe,
        [data-gjs-type="video"] video,
        [data-gjs-type="video"] embed,
        [data-gjs-type="video"] object {
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 100% !important;
          border: 0 !important;
        }
        
        /* Fallback for plain iframes/videos not in video component */
        iframe:not([data-gjs-type="video"] iframe), 
        video:not([data-gjs-type="video"] video) {
          max-width: 100% !important;
          height: auto !important;
          display: block !important;
        }
        
        /* Ensure all elements use border-box sizing */
        * { box-sizing: border-box; }
      `;
      doc.head.appendChild(style);
    } catch (e) {
      // ignore
    }
  };

  // Create modal content (DOM) and wire events (styled like youtubeVideoPlugin)
  const openModal = (componentToEdit?: any) => {
    injectModalStyles();
    const modal = editor.Modal;
    const wrapper = document.createElement("div");
    wrapper.className = "gjs-yt-modal";

    wrapper.innerHTML = `
      <div>
        <label style="display:block; font-weight:600; margin-bottom:12px; font-size:16px;">YouTube Video URL or ID</label>
        <input id="gjs-yt-input" type="text" placeholder="https://youtu.be/... or video id" value="" />

        <div style="margin-top:18px; margin-bottom:6px;">
          <label style="display:block; font-weight:600; margin-bottom:12px; font-size:16px;">Video Options</label>
          <div class="gjs-yt-options">
            <label style="display:flex; align-items:center; color:#e0e0e0; font-size:14px;">
              <input type="checkbox" id="gjs-yt-controls" style="margin-right:10px; width:auto; accent-color:#3b97e3;"> Show controls
            </label>
            <label style="display:flex; align-items:center; color:#e0e0e0; font-size:14px;">
              <input type="checkbox" id="gjs-yt-loop" style="margin-right:10px; width:auto; accent-color:#3b97e3;"> Loop video
            </label>
          </div>
        </div>

        <div style="display:flex; justify-content:flex-end; gap:12px; margin-top:20px;">
          <button id="gjs-yt-cancel" class="gjs-yt-cancel">Cancel</button>
          <button id="gjs-yt-insert" class="gjs-yt-save">Insert</button>
        </div>
      </div>
    `;

    modal.setTitle(options.modalTitle || "Add YouTube video");
    modal.setContent(wrapper);
    modal.open();

    const inp = wrapper.querySelector<HTMLInputElement>("#gjs-yt-input");
    const btnCancel =
      wrapper.querySelector<HTMLButtonElement>("#gjs-yt-cancel");
    const btnInsert =
      wrapper.querySelector<HTMLButtonElement>("#gjs-yt-insert");
    const chkControls =
      wrapper.querySelector<HTMLInputElement>("#gjs-yt-controls");
    const chkLoop = wrapper.querySelector<HTMLInputElement>("#gjs-yt-loop");

    const close = () => modal.close();
    btnCancel?.addEventListener("click", close);

    // Prefill if editing
    try {
      if (componentToEdit) {
        const vid =
          (typeof componentToEdit.get === "function"
            ? componentToEdit.get("videoId")
            : componentToEdit.videoId) || "";
        const src =
          (componentToEdit.get && componentToEdit.get("src")) ||
          (componentToEdit.attributes && componentToEdit.attributes.src) ||
          "";
        const youtubeUrl =
          (componentToEdit.get && componentToEdit.get("youtube-url")) ||
          componentToEdit["youtube-url"] ||
          "";
        if (inp) inp.value = youtubeUrl || vid || src || "";

        // Options
        const hasControls = componentToEdit.get
          ? componentToEdit.get("show-controls") !== false
          : true;
        const hasLoop = componentToEdit.get
          ? !!componentToEdit.get("loop")
          : false;
        if (chkControls) chkControls.checked = hasControls;
        if (chkLoop) chkLoop.checked = hasLoop;
      }
    } catch (e) {
      // ignore
    }

    const insert = () => {
      const val = inp?.value?.trim() || "";
      const id = extractYouTubeId(val);
      if (!id) {
        if (inp) {
          inp.style.borderColor = "crimson";
          setTimeout(() => (inp.style.borderColor = ""), 1600);
        }
        return;
      }

      const opts = {
        controls: chkControls?.checked ? 1 : 0,
        loop: !!chkLoop?.checked,
        rel: false,
      };

      const src = createEmbedUrl(id, opts);

      // If editing an existing component, update it. Otherwise create a new video component
      if (componentToEdit) {
        try {
          if (componentToEdit.set) {
            componentToEdit.set("provider", "yt");
            componentToEdit.set("videoId", id);
            componentToEdit.set("src", src);
            componentToEdit.set("youtube-url", val);
            componentToEdit.set("youtube-video-id", id);
            componentToEdit.set("show-controls", !!chkControls?.checked);
            componentToEdit.set("loop", !!chkLoop?.checked);
            const attrs = componentToEdit.getAttributes
              ? componentToEdit.getAttributes()
              : {};
            componentToEdit.set("attributes", { ...attrs, src });
            // Ensure default size if style missing
            try {
              const curStyle =
                (componentToEdit.get && componentToEdit.get("style")) ||
                componentToEdit.style ||
                {};
              const hasWidth = curStyle && curStyle.width;
              const hasHeight = curStyle && curStyle.height;
              if (!hasWidth || !hasHeight) {
                // Use fluid width and automatic height so videos scale with their container
                componentToEdit.set("style", {
                  ...(curStyle || {}),
                  width: curStyle?.width || "100%",
                  height: curStyle?.height || "auto",
                });
              }
            } catch (err) {
              // ignore
            }
          } else if (componentToEdit.addAttributes) {
            componentToEdit.addAttributes({ provider: "yt", videoId: id, src });
          }
          componentToEdit.view &&
            componentToEdit.view.render &&
            componentToEdit.view.render();
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error("youtubeExp: failed updating component", err);
        }
      } else {
        try {
          const wrapperCmp = (editor.getWrapper && editor.getWrapper()) as any;
          if (wrapperCmp && typeof wrapperCmp.append === "function") {
            const comp = wrapperCmp.append({
              type: "video",
              provider: "yt",
              videoId: id,
              src,
              "youtube-url": val,
              "youtube-video-id": id,
              "show-controls": !!chkControls?.checked,
              loop: !!chkLoop?.checked,
              // Default to fluid sizing so the video is responsive by default; editors can still set explicit sizes
              style: { width: "100%", height: "auto" },
            });
            if (comp && editor.select) editor.select(comp);
          } else {
            // eslint-disable-next-line no-console
            console.warn(
              "youtubeExp: wrapper.append not available, cannot insert component"
            );
          }
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error("Failed to insert youtube video component", e);
        }
      }

      close();
    };

    btnInsert?.addEventListener("click", insert);
    inp?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") insert();
    });
  };

  // Add command to open the modal
  editor.Commands.add("open-youtube-exp", {
    run(editorInst: Editor, sender?: any, opts?: any) {
      const selectedAny = (editorInst.getSelected &&
        editorInst.getSelected()) as any;
      // If selected component is a video, pass it to modal to edit
      const selectedType =
        selectedAny &&
        (typeof selectedAny.get === "function"
          ? selectedAny.get("type")
          : selectedAny.type);
      const isVideo = selectedType === "video";
      openModal(isVideo ? selectedAny : undefined);
      return true;
    },
    stop() {
      // nothing to cleanup for now
    },
  });

  // Add a block to the sidebar (BlockManager) so users can drag a YouTube video into the canvas
  try {
    editor.BlockManager.add("youtube-exp", {
      label: "YouTubeVideo",
      media: `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  `,
      category: "Media",
      // Provide a component definition so the block is draggable/insertable like others
      content: {
        type: "video",
        provider: "yt",
        videoId: "",
        src: "",
        // Use fluid default so block is responsive when dropped in
        style: { width: "100%", height: "auto" },
      },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("youtubeExp: failed to add block", err);
  }

  // Make double-click on video components open this modal (edit)
  try {
    const domcv = editor.DomComponents.getType("video");
    if (domcv && domcv.view && domcv.view.prototype) {
      const proto = domcv.view.prototype;
      // Preserve existing dblclick handler if any
      const oldEvents = proto.events || {};
      const oldDbl = oldEvents.dblclick || proto.onDblClick || null;

      proto.events = { ...oldEvents, dblclick: "onDblClick" };
      proto.onDblClick = function (e: any) {
        try {
          const selected = (editor.getSelected && editor.getSelected()) as any;
          editor.runCommand("open-youtube-exp");
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error("youtubeExp: error running command on dblclick", err);
        }

        // call previous if was present and is function
        if (typeof oldDbl === "function") {
          try {
            oldDbl.call(this, e);
          } catch (err) {
            // eslint-disable-next-line no-console
            console.error(
              "youtubeExp: error calling previous dblclick handler",
              err
            );
          }
        }
      };
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("youtubeExp: error wiring dblclick handler", err);
  }

  // Add a command to explicitly edit a given component (used by toolbar button)
  editor.Commands.add("youtube-exp-edit", {
    run(ed: any, sender?: any, opts?: any) {
      const cmp =
        opts && opts.component
          ? opts.component
          : ed.getSelected && ed.getSelected();
      openModal(cmp);
    },
  });

  // When a component is selected, attach an edit icon to the component's toolbar (the blue inline toolbar)
  try {
    editor.on("component:selected", (comp: any) => {
      if (!comp) return;
      const type =
        (typeof comp.get === "function" ? comp.get("type") : comp.type) || "";
      if (type !== "video") return;

      // Avoid adding the button multiple times
      if ((comp as any)._youtubeEditToolbarAdded) return;

      let toolbar = comp.get && comp.get("toolbar");
      toolbar = Array.isArray(toolbar) ? toolbar.slice() : [];

      // Prepend an edit button which calls our edit command and passes the component
      toolbar.unshift({
        attributes: { class: "fa fa-edit", title: "Edit video" },
        command: "youtube-exp-edit",
        // Provide options so the command receives the component when invoked by the toolbar
        // GrapesJS will call the command with component as `opts.component` when toolbar button clicked
        // If not, our command also falls back to editor.getSelected()
      });

      try {
        comp.set && comp.set("toolbar", toolbar);
        (comp as any)._youtubeEditToolbarAdded = true;
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("youtubeExp: failed to attach toolbar edit button", e);
      }
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("youtubeExp: error attaching toolbar handler", e);
  }

  // When attributes change on a video component (youtube options), update its src accordingly
  try {
    editor.on("component:update", (comp: any) => {
      if (!comp) return;
      const type =
        (typeof comp.get === "function" ? comp.get("type") : comp.type) || "";
      if (type !== "video") return;

      try {
        const id =
          (comp.get && comp.get("videoId")) ||
          (comp.attributes && comp.attributes.videoId) ||
          null;
        const urlVal =
          (comp.get && comp.get("youtube-url")) ||
          (comp.attributes && comp.attributes["youtube-url"]) ||
          "";
        const showControls = comp.get
          ? comp.get("show-controls") !== false
          : true;
        const loop = comp.get ? !!comp.get("loop") : false;
        if (id) {
          const newSrc = createEmbedUrl(id, {
            controls: showControls ? 1 : 0,
            loop,
            rel: false,
          });
          if (comp.set) comp.set("src", newSrc);
          if (comp.addAttributes) comp.addAttributes({ src: newSrc });
        } else if (urlVal) {
          const parsed = extractYouTubeId(urlVal);
          if (parsed) {
            const newSrc = createEmbedUrl(parsed, {
              controls: showControls ? 1 : 0,
              loop,
              rel: false,
            });
            if (comp.set) comp.set("src", newSrc);
            if (comp.addAttributes) comp.addAttributes({ src: newSrc });
          }
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(
          "youtubeExp: error updating component src on update",
          err
        );
      }
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(
      "youtubeExp: failed to register component:update handler",
      err
    );
  }

  // When a new component is added (for example by dropping the block), if it's a video we open the modal to ask for the URL
  try {
    editor.on("component:add", (model: any) => {
      try {
        const type =
          (typeof model.get === "function" ? model.get("type") : model.type) ||
          "";
        if (type !== "video") return;

        // Avoid opening modal if the model already has a videoId/src set
        const vid =
          (model.get && model.get("videoId")) ||
          (model.attributes && model.attributes.videoId) ||
          null;
        const src =
          (model.get && model.get("src")) ||
          (model.attributes && model.attributes.src) ||
          null;
        if (vid || src) return; // already configured

        // Schedule modal open after a short delay so the drop completes
        setTimeout(() => {
          try {
            // mark this model so other handlers can avoid duplicates
            (model as any)._youtubeExpJustAdded = true;
            // Ensure default size if not present
            try {
              const mStyle =
                (model.get && model.get("style")) || model.style || {};
              const hasW = mStyle && mStyle.width;
              const hasH = mStyle && mStyle.height;
              if (!hasW || !hasH) {
                // Default to fluid sizing so newly added video components are responsive
                model.set &&
                  model.set("style", {
                    ...(mStyle || {}),
                    width: mStyle?.width || "100%",
                    height: mStyle?.height || "auto",
                  });
              }
            } catch (e) {
              // ignore
            }
            openModal(model);
          } catch (err) {
            // eslint-disable-next-line no-console
            console.error("youtubeExp: error opening modal on add", err);
          }
        }, 80);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("youtubeExp: component:add handler error", e);
      }
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("youtubeExp: failed registering component:add handler", e);
  }

  // Ensure responsive styles are injected into the editor canvas (after helper defined)
  try {
    injectResponsiveStyles();
  } catch (e) {
    // ignore
  }
}
