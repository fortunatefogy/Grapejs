import type { Editor } from "grapesjs";

export default function textboxPlugin(editor: Editor): void {
  const bm = editor.BlockManager;

  // Add a block that creates a default GrapesJS `text` component.
  // Using the built-in `text` type preserves GrapesJS' native editing
  // behavior and the editor's persistence mechanisms.
  bm.add("textbox", {
    label: "Text",
    media: `<svg width="24" height="24" viewBox="0 0 24 24" fill="#ffffff">
      <rect x="3" y="9" width="18" height="6" rx="2" stroke="currentColor" stroke-width="2" fill="none"/>
      <line x1="6" y1="12" x2="12" y2="12" stroke="currentColor" stroke-width="2"/>
    </svg>`,
    category: {
      id: "basic",
      label: "Basic",
      open: true,
    },
    content: {
      type: "text",
      tagName: "div",
      content: "Double-click to edit text",
      attributes: { contenteditable: "true" },
      editable: true,
      droppable: false,
      stylable: true,
      draggable: true,
      traits: [
        {
          type: "text",
          name: "placeholder",
          label: "Placeholder",
          changeProp: true,
        },
        {
          type: "text",
          name: "name",
          label: "Name",
        },
        {
          type: "text",
          name: "value",
          label: "Value",
        },
        {
          type: "checkbox",
          name: "required",
          label: "Required",
        },
        {
          type: "checkbox",
          name: "disabled",
          label: "Disabled",
        },
      ],
      style: {
        padding: "10px",
        border: "1px solid #ccc",
        "border-radius": "4px",
        width: "100%",
        "font-size": "14px",
        "box-sizing": "border-box",
        minHeight: "40px",
        wordBreak: "break-word",
        whiteSpace: "pre-wrap",
      },
    },
  });
}
