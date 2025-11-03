// ./Plugins/AzureImagePlugin.ts
import type { Editor } from "grapesjs";
import { AZURE_CONFIG } from "../config/azureConfig";

interface FolderState {
  prefix: string;
  path: string;
}
export default function AzureImagePlugin(editor: Editor) {
  const am: any = editor.AssetManager;
  const modal = editor.Modal;
  const bm: any = editor.BlockManager;

  // Do not import Azure SDK at module load time – use dynamic import inside the
  // explorer to avoid bundling the SDK into environments that can't handle it.

  try {
    if (am && typeof am.setConfig === "function") {
      am.setConfig({
        upload: true,
        autoAdd: true,
        openAssetsOnDrop: true,
      });
    }
  } catch (e) {
    /* ignore */
  }

  // Azure Blob Storage configuration
  const AZURE_CONTAINER_SAS_URL = AZURE_CONFIG.CONTAINER_SAS_URL;
  const CONTAINER_NAME_OVERRIDE = AZURE_CONFIG.CONTAINER_NAME;

  // second config call not needed; asset manager config was set above when available

  // When asset manager opens, offer the Azure explorer as an option
  editor.on("asset:open", () => {
    openAzureExplorer();
  });

  // Add a block in the Block Manager under the "Media" category so users can
  // insert an Azure-image placeholder. Selecting this placeholder will open
  // the Azure explorer to pick a real image.
  // Register block after the editor finishes loading so categories and panels are ready
  try {
    editor.on("load", () => {
      try {
        bm.add("azure-image", {
          label: "Image",
          media: `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                 xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2" fill="none"/>
              <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
              <path d="M3 17L8 12L12 16L16 12L21 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="#080808ff"/>
            </svg>
          `,
          category: {
            id: "basic",
            label: "Basic",
            open: true
          },
          content: {
            type: "image",
            attributes: {
              src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='150' viewBox='0 0 24 24'%3E%3Crect width='100%25' height='100%25' fill='%23f5f5f5'/%3E%3Cg transform='translate(0, -2)'%3E%3Cpath d='M12 12c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3z' fill='%23ccc'/%3E%3Cpath d='M20 4h-3.17L15 2H9L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 10c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z' fill='%23ccc'/%3E%3C/g%3E%3Ctext x='50%25' y='85%25' font-family='Arial' font-size='3' text-anchor='middle' fill='%23999'%3EClick to add image%3C/text%3E%3C/svg%3E",
              "data-azure-placeholder": "1",
              "class": "azure-placeholder",
              "style": "cursor: pointer;"
            },
          },
          // Add a small delay before showing the actual image
          onAdd: (component: any) => {
            setTimeout(() => {
              const img = component.viewEl?.querySelector('img');
              if (img) {
                // Keep the loading state for 4 seconds
                setTimeout(() => {
                  img.src = "https://via.placeholder.com/300x150?text=Image";
                  img.classList.remove('azure-loading');
                }, 4000);
              }
            }, 10);
          },
        });
      } catch (err) {
        // ignore block add failure
        console.warn('AzureImagePlugin: failed to add block', err);
      }
    });
  } catch (e) {
    // ignore if BlockManager isn't available or editor.on fails
  }

  // When a component is selected, if it's the Azure placeholder open the explorer
  try {
    editor.on("component:selected", (component: any) => {
      try {
        const attrs =
          (component && typeof component.getAttributes === "function")
            ? component.getAttributes()
            : component && component.attributes
            ? component.attributes
            : {};
        if (attrs && attrs["data-azure-placeholder"] === "1") {
          openAzureExplorer();
        }
      } catch (e) {
        /* ignore */
      }
    });
  } catch (e) {
    /* ignore */
  }

  async function openAzureExplorer() {
    const content = document.createElement("div");
    content.innerHTML = `
      <!-- Custom Confirmation Dialog -->
      <div id="customConfirmDialog" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; justify-content: center; align-items: center;">
        <div style="background: white; padding: 20px; border-radius: 8px; max-width: 400px; width: 90%; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
          <div id="customConfirmMessage" style="margin-bottom: 20px; font-size: 15px; line-height: 1.5;"></div>
          <div style="display: flex; justify-content: flex-end; gap: 10px;">
            <button id="confirmCancel" style="padding: 8px 16px; background: #f0f0f0; border: 1px solid #ddd; border-radius: 4px; cursor: pointer;">Cancel</button>
            <button id="confirmOk" style="padding: 8px 16px; background: #0078d4; color: white; border: none; border-radius: 4px; cursor: pointer;">OK</button>
          </div>
        </div>
      </div>
      
      <style>
        /* Custom Confirm Dialog Animation */
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        #customConfirmDialog > div {
          animation: fadeIn 0.2s ease-out;
        }
        .azure-popup { font-family: sans-serif; padding: 15px; max-width: 800px; }
        
        /* Loading animation */
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .azure-loading {
          position: relative;
          min-height: 100px;
          background: #f5f5f5;
          border: 2px dashed #ccc;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 10px;
          padding: 20px;
          box-sizing: border-box;
        }
        
        .azure-loading::before {
          content: '';
          width: 24px;
          height: 24px;
          border: 3px solid rgba(0,0,0,0.1);
          border-top-color: #3498db;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        .azure-loading::after {
          content: 'Loading Image...';
          color: #666;
          font-size: 14px;
          font-weight: 500;
        }
        .azure-actions { margin-bottom: 15px; display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
        .azure-actions button { padding: 6px 12px; border: 1px solid #ccc; border-radius: 4px; background: #f8f9fa; cursor: pointer; }
        .azure-actions button:hover { background: #e9ecef; }
        .azure-url-input { flex: 1; min-width: 200px; padding: 6px; border: 1px solid #ddd; border-radius: 4px; }
        .azure-url-container { display: flex; gap: 8px; width: 100%; margin-bottom: 10px; }
        .azure-folder-list { margin-top: 10px; }
        .azure-folder { 
          padding: 8px 10px; 
          display: flex; 
          align-items: center; 
          gap: 10px;
          border-radius: 4px;
          transition: background 0.2s;
          margin-bottom: 4px;
        }
        .azure-folder:hover { background: #f0f0f0; }
        .azure-folder .folder-name-span { 
          cursor: pointer; 
          user-select: none; 
          flex: 1;
          display: inline-block;
        }
        .azure-folder .folder-name-span:hover { color: #007bff; }
        .azure-folder .azure-folder-checkbox {
          cursor: pointer;
          width: 16px;
          height: 16px;
          margin: 0;
          flex-shrink: 0;
        }
        .azure-folder .azure-delete-folder-btn {
          display: none;
          background: #dc3545;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 4px 10px;
          cursor: pointer;
          font-size: 11px;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .azure-folder .azure-delete-folder-btn:hover {
          background: #c82333;
        }
        .azure-image-list { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px; max-height: 400px; overflow-y: auto; padding: 5px; }
        .azure-image-item { cursor: pointer; border: 1px solid #ddd; border-radius: 6px; padding: 5px; position: relative; transition: all 0.2s; }
        .azure-image-item:hover { border-color: #007bff; box-shadow: 0 0 0 2px rgba(0,123,255,.25); }
        .azure-image-item img { width: 100px; height: 100px; object-fit: cover; border-radius: 4px; display: block; }
        .azure-image-item .img-name { 
          font-size: 12px; 
          white-space: nowrap; 
          overflow: hidden; 
          text-overflow: ellipsis; 
          max-width: 100px;
          margin-top: 4px;
        }
        .azure-img-checkbox {
          position: absolute;
          top: 4px;
          left: 4px;
          z-index: 2;
          background: #fff;
          border: 1.5px solid #888;
          border-radius: 3px;
          width: 18px;
          height: 18px;
          margin: 0;
          padding: 0;
          box-shadow: 0 1px 2px rgba(0,0,0,0.08);
          cursor: pointer;
        }
        .azure-delete-btn { 
          position: absolute; 
          top: 2px; 
          right: 2px; 
          background: #dc3545; 
          color: #fff; 
          border: none; 
          border-radius: 3px; 
          font-size: 12px; 
          padding: 2px 6px; 
          cursor: pointer; 
          z-index: 2; 
          opacity: 0.9;
        }
        .azure-delete-btn:hover { opacity: 1; }
        .tab-buttons { display: flex; margin-bottom: 15px; border-bottom: 1px solid #dee2e6; }
        .tab-button { 
          padding: 8px 16px; 
          background: none; 
          border: none; 
          border-bottom: 2px solid transparent;
          cursor: pointer;
          font-weight: 500;
          color: #495057;
        }
        .tab-button.active { 
          border-bottom-color: #007bff; 
          color: #007bff;
        }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
      </style>
      <div class="azure-popup">
        <h3>📁 Image Manager</h3>
        
        <div class="tab-buttons">
          <button class="tab-button active" data-tab="azure">Repository</button>
          <button class="tab-button" data-tab="local">Local Upload</button>
          <button class="tab-button" data-tab="url">From URL</button>
        </div>
        
        <!-- Azure Storage Tab -->
        <div id="azure-tab" class="tab-content active">
          <div class="azure-actions">
            <button id="refreshBtn" title="Refresh">🔄 Refresh</button>
            <button id="newFolderBtn" title="Create New Folder">📁 New Folder</button>
            <input type="file" id="azureUploadInput" style="display:none" accept="image/*" multiple />
            <button id="uploadBtn" title="Upload to current folder">⬆️ Upload</button>
            <button id="backBtn" title="Back" style="margin-left:auto;">⬅️ Back</button>
          </div>
          <div id="azureFolders" class="azure-folder-list"></div>
          <div id="azureImages" class="azure-image-list"></div>
        </div>
        
        <!-- Local Upload Tab -->
        <div id="local-tab" class="tab-content">
          <div class="azure-actions">
            <label for="localUploadInput" style="display: inline-block; padding: 6px 12px; border: 1px solid #ccc; border-radius: 4px; background: #f8f9fa; cursor: pointer;">
              📁 Choose Image
              <input type="file" id="localUploadInput" accept="image/*" style="display: none;" />
            </label>
            <div style="font-size: 13px; color: #666; margin-top: 8px;">Select an image to upload</div>
          </div>
        </div>
        
        <!-- URL Input Tab -->
        <div id="url-tab" class="tab-content">
          <div class="azure-url-container">
            <input type="text" id="imageUrlInput" class="azure-url-input" placeholder="Enter image URL" />
            <button id="loadUrlBtn">Load Image</button>
          </div>
          <div id="urlPreview" style="margin-top: 15px; text-align: center; display: none;">
            <img id="urlImagePreview" style="max-width: 100%; max-height: 300px; border: 1px solid #ddd; border-radius: 4px;" />
            <div style="margin-top: 10px;">
              <button id="insertUrlBtn" style="padding: 6px 16px; background: #ddd; color: #000; border: 1px solid #000; border-radius: 4px; cursor: pointer;">
                Insert Image
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    modal.setTitle("Repository");
    modal.setContent(content);
    modal.open();
    
    // Custom dialog implementation
    const showDialog = (options: { 
      type: 'confirm' | 'prompt', 
      message: string, 
      defaultValue?: string 
    }): Promise<string | boolean> => {
      return new Promise((resolve) => {
        // Create dialog elements
        const dialog = document.createElement('div');
        dialog.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        `;
        
        const dialogContent = document.createElement('div');
        dialogContent.style.cssText = `
          background: white;
          padding: 20px;
          border-radius: 8px;
          width: 90%;
          max-width: 400px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          animation: fadeIn 0.2s ease-out;
        `;
        
        const messageEl = document.createElement('div');
        messageEl.style.cssText = 'margin-bottom: 15px; font-size: 15px; line-height: 1.5;';
        messageEl.textContent = options.message;
        
        let inputEl: HTMLInputElement | null = null;
        if (options.type === 'prompt') {
          inputEl = document.createElement('input');
          inputEl.type = 'text';
          inputEl.value = options.defaultValue || '';
          inputEl.style.cssText = `
            width: 100%;
            padding: 8px;
            margin-bottom: 15px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
            box-sizing: border-box;
          `;
        }
        
        const buttonsContainer = document.createElement('div');
        buttonsContainer.style.cssText = 'display: flex; justify-content: flex-end; gap: 10px;';
        
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.style.cssText = 'padding: 8px 16px; background: #f0f0f0; border: 1px solid #ddd; border-radius: 4px; cursor: pointer;';
        
        const confirmBtn = document.createElement('button');
        confirmBtn.textContent = 'OK';
        confirmBtn.style.cssText = 'padding: 8px 16px; background: #0078d4; color: white; border: none; border-radius: 4px; cursor: pointer;';
        
        const cleanup = () => {
          document.body.removeChild(dialog);
        };
        
        cancelBtn.onclick = () => {
          cleanup();
          resolve(false);
        };
        
        confirmBtn.onclick = () => {
          cleanup();
          if (options.type === 'prompt' && inputEl) {
            resolve(inputEl.value);
          } else {
            resolve(true);
          }
        };
        
        // Handle Enter key for prompt
        if (inputEl) {
          inputEl.onkeydown = (e) => {
            if (e.key === 'Enter') {
              confirmBtn.click();
            }
          };
          inputEl.focus();
        }
        
        // Assemble the dialog
        buttonsContainer.appendChild(cancelBtn);
        buttonsContainer.appendChild(confirmBtn);
        
        dialogContent.appendChild(messageEl);
        if (inputEl) dialogContent.appendChild(inputEl);
        dialogContent.appendChild(buttonsContainer);
        dialog.appendChild(dialogContent);
        
        // Add to document and focus input if exists
        document.body.appendChild(dialog);
        if (inputEl) inputEl.focus();
      });
    };
    
    // Alias for confirm dialogs
    const customConfirm = (message: string): Promise<boolean> => {
      return showDialog({ type: 'confirm', message }) as Promise<boolean>;
    };
    
    // Alias for prompt dialogs
    const customPrompt = (message: string, defaultValue: string = ''): Promise<string | false> => {
      return showDialog({ type: 'prompt', message, defaultValue }) as Promise<string | false>;
    };

  // Tab elements
  const tabButtons = content.querySelectorAll('.tab-button');
  const tabContents = content.querySelectorAll('.tab-content');
  
  // Azure tab elements
  const refreshBtn = content.querySelector("#refreshBtn") as HTMLButtonElement;
  const newFolderBtn = content.querySelector("#newFolderBtn") as HTMLButtonElement;
  const uploadBtn = content.querySelector("#uploadBtn") as HTMLButtonElement;
  const uploadInput = content.querySelector("#azureUploadInput") as HTMLInputElement;
  const foldersDiv = content.querySelector("#azureFolders") as HTMLDivElement;
  const imagesDiv = content.querySelector("#azureImages") as HTMLDivElement;
  
  // Local upload element
  const localUploadInput = content.querySelector("#localUploadInput") as HTMLInputElement;
  
  // URL input elements
  const imageUrlInput = content.querySelector("#imageUrlInput") as HTMLInputElement;
  const loadUrlBtn = content.querySelector("#loadUrlBtn") as HTMLButtonElement;
  const urlPreview = content.querySelector("#urlPreview") as HTMLDivElement;
  const urlImagePreview = content.querySelector("#urlImagePreview") as HTMLImageElement;
  const insertUrlBtn = content.querySelector("#insertUrlBtn") as HTMLButtonElement;

    let currentPrefix = "";
    let currentPath = "";
    let folderStack: FolderState[] = [];

    async function loadFoldersAndImages(prefix: string, folderPath: string) {
      foldersDiv.innerHTML = "<div class='azure-loading'>Loading folders...</div>";
      imagesDiv.innerHTML = "";
      
      try {
        const mod = await import("@azure/storage-blob");
        const { BlobServiceClient } = mod as any;
        if (!BlobServiceClient) throw new Error("BlobServiceClient not found in module");

        // Parse the container name from the URL if not provided
        let containerName = CONTAINER_NAME_OVERRIDE;
        if (!containerName) {
          try {
            const parsed = new URL(AZURE_CONTAINER_SAS_URL);
            // The container name is the first path segment
            containerName = parsed.pathname.split('/').filter(Boolean)[0] || '';
          } catch (e) {
            console.error('Error parsing container name from URL:', e);
            throw new Error('Invalid SAS URL format. Please check the URL and try again.');
          }
        }

        // Use the full SAS URL directly with the container client
        const containerClient = new mod.ContainerClient(AZURE_CONTAINER_SAS_URL);
        const delimiter = "/";
        const iter = containerClient.listBlobsByHierarchy(delimiter, { prefix });
        const folders: string[] = [];
        const images: { name: string; url: string }[] = [];
        for await (const item of iter) {
          if (item.kind === "prefix") {
            folders.push(item.name);
          } else if (item.kind === "blob") {
            if (/\.(jpg|jpeg|png|gif|bmp|svg|webp)$/i.test(item.name)) {
              // Get the blob client and its URL (which will include the SAS token)
              const blobClient = containerClient.getBlobClient(item.name);
              images.push({
                name: item.name.replace(prefix, ''),
                url: blobClient.url // The URL already includes the SAS token
              });
            }
          }
        }
        // Render folders
        let html = "";
        if (prefix) {
          html += `<div style='margin-bottom:8px;font-size:13px;'>${prefix.replace(/\/$/, "")}</div>`;
        } else {
          html += `<div style='margin-bottom:8px;font-size:13px;'>Root</div>`;
        }
        if (folders.length === 0) {
          html += `<div style='color:#888;'>No subfolders found.</div>`;
        } else {
          html += `<ul style='list-style:none;padding-left:0;margin:0;'>${folders
            .map(
              (folder) =>
                `<li class='azure-folder' data-folder='${folder}'>
                  <input type="checkbox" class="azure-folder-checkbox" title="Select for delete" onclick="event.stopPropagation();" style="margin:0;vertical-align:middle;" />
                  <span class='folder-name-span' style="vertical-align:middle;">📁 ${folder.replace(prefix, '').replace(/\/$/, '')}</span>
                  <button class="azure-delete-folder-btn" title="Delete Folder" onclick="event.stopPropagation();">🗑️ Delete</button>
                </li>`
            )
            .join("")}</ul>`;
        }
        foldersDiv.innerHTML = html;
        // Render images
        if (images.length === 0) {
          imagesDiv.innerHTML = `<div style='color:#888;'>No images in this folder.</div>`;
        } else {
          imagesDiv.innerHTML = images
            .filter(img => img.name && img.name.trim() !== '') // Filter out any empty names
            .map(img => {
              try {
                // Ensure the URL is properly formatted
                let imageUrl = img.url;
                
                // If the URL doesn't have a protocol, add https://
                if (!imageUrl.startsWith('http')) {
                  imageUrl = 'https://' + imageUrl;
                }
                
                // If the URL has a space, it's likely not properly encoded
                if (imageUrl.includes(' ')) {
                  imageUrl = encodeURI(imageUrl);
                }
                
                // Handle the case where the URL might already have query parameters
                const [baseUrl, ...rest] = imageUrl.split('?');
                const sasToken = rest.length > 0 ? rest.join('?') : '';
                const finalUrl = sasToken ? `${baseUrl}?${sasToken}` : baseUrl;
                
                const safeName = img.name ? img.name.replace(/[<>]/g, '') : 'image';
                
                return `
                  <div class='azure-image-item' data-img="${finalUrl}" data-blobname="${img.name || ''}">
                    <input type="checkbox" class="azure-img-checkbox" 
                           style="position:absolute;left:4px;top:4px;z-index:2;" 
                           title="Select for delete" />
                    <button class="azure-delete-btn" title="Delete" style="display:none;">🗑️</button>
                    <img src="${finalUrl}" 
                         alt="${safeName}" 
                         style="width:100px;height:100px;object-fit:contain;background:#f5f5f5;"
                         onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+CiAgPHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNmNWY1ZjUiLz4KICA8dGV4dCB4PSI1MCIgeT0iNTUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzk5OSI+RXJyb3IgbG9hZGluZyBpbWFnZTwvdGV4dD4KPC9zdmc+'">
                    <div style='font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;'>${safeName}</div>
                  </div>`;
              } catch (error) {
                console.error('Error rendering image:', img, error);
                return ''; // Skip this image if there's an error
              }
            })
            .filter(html => html !== '') // Remove any empty strings from the map
            .join('');
        }
  setTimeout(() => {
          // Folder click and delete functionality
          const folderEls = foldersDiv.querySelectorAll('[data-folder]');
          folderEls.forEach((el) => {
            const folderLi = el as HTMLElement;
            const checkbox = folderLi.querySelector('.azure-folder-checkbox') as HTMLInputElement;
            const deleteBtn = folderLi.querySelector('.azure-delete-folder-btn') as HTMLButtonElement;
            const folderNameSpan = folderLi.querySelector('.folder-name-span') as HTMLElement;
            
            // Navigate to folder when clicking on folder name
            if (folderNameSpan) {
              folderNameSpan.onclick = (e) => {
                e.stopPropagation();
                const folder = folderLi.getAttribute('data-folder');
                if (folder) {
                    folderStack.push({ prefix, path: currentPath });
                    // Enable back button when we navigate into a folder
                    try {
                      const backBtnEl = content.querySelector('#backBtn') as HTMLButtonElement | null;
                      if (backBtnEl) backBtnEl.disabled = false;
                    } catch (_) { /* ignore */ }
                  currentPrefix = folder;
                  const folderName = folder.replace(prefix, '').replace(/\/$/, '');
                  currentPath = currentPath ? `${currentPath}/${folderName}` : folderName;
                  loadFoldersAndImages(folder, currentPath);
                }
              };
            }
            
            // Show/hide delete button based on checkbox
            if (checkbox && deleteBtn) {
              checkbox.onchange = (e) => {
                e.stopPropagation();
                deleteBtn.style.display = checkbox.checked ? 'block' : 'none';
              };
              
              // Delete folder functionality
              deleteBtn.onclick = async (e) => {
                e.stopPropagation();
                if (!checkbox.checked) return;
                
                const folder = folderLi.getAttribute('data-folder');
                if (!folder) return;
                
                const folderName = folder.replace(prefix, '').replace(/\/$/, '');
                const shouldDelete = await customConfirm(`Delete folder "${folderName}" and all its contents?\n\nThis action cannot be undone.`);
                if (!shouldDelete) return;
                
                try {
                  const mod = await import("@azure/storage-blob");
                  const { BlobServiceClient } = mod as any;
                  
                  // Use the full SAS URL directly with the container client
                  const containerClient = new mod.ContainerClient(AZURE_CONTAINER_SAS_URL);
                  
                  // List and delete all blobs in the folder
                  const iter = containerClient.listBlobsFlat({ prefix: folder });
                  let deletedCount = 0;
                  let errorCount = 0;
                  
                  // First, collect all blob names to delete
                  const blobsToDelete: string[] = [];
                  for await (const blob of iter) {
                    blobsToDelete.push(blob.name);
                  }
                  
                  // Then delete them one by one
                  for (const blobName of blobsToDelete) {
                    try {
                      await containerClient.deleteBlob(blobName);
                      deletedCount++;
                    } catch (err) {
                      console.error(`Failed to delete blob ${blobName}:`, err);
                      errorCount++;
                    }
                  }
                  
                  await customConfirm(`Deleted folder "${folderName}" with ${deletedCount} item(s) successfully`);
                  if (errorCount > 0) {
                    await customConfirm(`(${errorCount} items could not be deleted)`);
                  }
                  
                  loadFoldersAndImages(prefix, currentPath);
                } catch (err) {
                  const msg = (typeof err === 'object' && err && 'message' in err) ? (err as any).message : String(err);
                  await customConfirm('Failed to delete folder: ' + msg);
                }
              };
            }
          });
          // Back button functionality is handled separately in the action bar
          try {
            const backBtn = content.querySelector('#backBtn') as HTMLButtonElement | null;
            if (backBtn) {
              backBtn.onclick = () => {
                const prev = folderStack.pop();
                if (prev) {
                  currentPrefix = prev.prefix;
                  currentPath = prev.path;
                  loadFoldersAndImages(prev.prefix, prev.path);
                }
              };
              // Disable when no history
              backBtn.disabled = folderStack.length === 0;
            }
          } catch (_) { /* ignore */ }
          // Image click and delete
          const imgEls = imagesDiv.querySelectorAll('[data-img]');
          imgEls.forEach((el) => {
            const imgDiv = el as HTMLElement;
            // Select image on click (but not delete button or checkbox)
            imgDiv.onclick = (ev) => {
              const target = ev.target as HTMLElement;
              if (target.classList.contains('azure-delete-btn') || target.classList.contains('azure-img-checkbox')) return;
              const url = imgDiv.getAttribute('data-img');
              if (url) selectImage(url);
            };
            // Checkbox logic
            const checkbox = imgDiv.querySelector('.azure-img-checkbox') as HTMLInputElement;
            const delBtn = imgDiv.querySelector('.azure-delete-btn') as HTMLButtonElement;
            if (checkbox && delBtn) {
              checkbox.onchange = () => {
                delBtn.style.display = checkbox.checked ? '' : 'none';
              };
              delBtn.onclick = async (ev) => {
                ev.stopPropagation();
                if (!checkbox.checked) return;
                
                const blobName = imgDiv.getAttribute('data-blobname');
                if (!blobName) {
                  alert('Error: Could not determine blob name');
                  return;
                }
                
                // Construct the full blob path
                let fullBlobName = blobName;
                if (prefix && !blobName.startsWith(prefix)) {
                  fullBlobName = prefix + blobName;
                }
                
                // Clean up the name for display
                const displayName = fullBlobName.split('/').pop() || fullBlobName;
                
                const shouldDelete = await customConfirm(`Delete image '${displayName}'?\n\nThis action cannot be undone.`);
                if (!shouldDelete) return;
                
                try {
                  // Use the direct container client with SAS URL
                  const mod = await import("@azure/storage-blob");
                  const containerClient = new mod.ContainerClient(AZURE_CONTAINER_SAS_URL);
                  
                  // Delete the blob
                  await containerClient.deleteBlob(fullBlobName);
                  
                  // Show success message and refresh
                  await customConfirm(`Successfully deleted '${displayName}'`);
                  loadFoldersAndImages(prefix, folderPath);
                } catch (err) {
                  const msg = (typeof err === 'object' && err && 'message' in err) ? (err as any).message : String(err);
                  alert('Delete failed: ' + msg);
                }
              };
            }
          });
    // Upload logic
    uploadBtn.onclick = () => {
      uploadInput.value = '';
      uploadInput.click();
    };
    uploadInput.onchange = async () => {
      const files = uploadInput.files;
      if (!files || files.length === 0) return;
      
      try {
        const mod = await import("@azure/storage-blob");
        // Use the direct container client with SAS URL
        const containerClient = new mod.ContainerClient(AZURE_CONTAINER_SAS_URL);
        
        // Process each selected file
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          if (!file.type.startsWith('image/')) {
            await customConfirm(`Skipping ${file.name}: Not a valid image file`);
            continue;
          }
          
          try {
            // Use the current folder prefix for the upload path
            const blobName = currentPrefix ? `${currentPrefix}${file.name}` : file.name;
            
            // Create a block blob client
            const blockBlobClient = containerClient.getBlockBlobClient(blobName);
            
            // Upload the file
            await blockBlobClient.uploadBrowserData(file, { 
              blobHTTPHeaders: { 
                blobContentType: file.type || 'application/octet-stream',
                blobCacheControl: 'public, max-age=31536000' // 1 year cache
              }
            });
            
            console.log(`Successfully uploaded: ${blobName}`);
          } catch (err) {
            const msg = (typeof err === 'object' && err && 'message' in err) 
              ? (err as any).message 
              : 'Unknown error';
            console.error(`Error uploading ${file.name}:`, err);
            await customConfirm(`Error uploading ${file.name}: ${msg}`);
          }
        }
        
        // Refresh the current view
        loadFoldersAndImages(currentPrefix, currentPath);
      } catch (err) {
        const msg = (typeof err === 'object' && err && 'message' in err) ? (err as any).message : String(err);
        await customConfirm('Upload failed: ' + msg);
      }
    };
        }, 0);
      } catch (error: any) {
        console.error("Error loading Azure folders/images:", error);
        const message = (error && error.message) ? error.message : String(error);
        foldersDiv.innerHTML = `❌ Failed to load folders/images. ${message}. Check SAS URL and container name.`;
        imagesDiv.innerHTML = "";
      }
    }

    // Tab switching
    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const tabId = button.getAttribute('data-tab');
        
        // Update active tab button
        tabButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Show active tab content
        tabContents.forEach(content => content.classList.remove('active'));
        document.getElementById(`${tabId}-tab`)?.classList.add('active');
      });
    });

    // Azure tab functionality
    refreshBtn.onclick = () => loadFoldersAndImages(currentPrefix, currentPath);
    
    // New Folder functionality
    newFolderBtn.onclick = async () => {
      try {
        const folderName = await customPrompt("Enter folder name:", "");
        if (!folderName) return;
        
        // Create a folder by uploading an empty blob with a trailing slash
        const folderPath = currentPrefix ? `${currentPrefix}${folderName}/` : `${folderName}/`;
        
        const mod = await import("@azure/storage-blob");
        const containerClient = new mod.ContainerClient(AZURE_CONTAINER_SAS_URL);
        const blockBlobClient = containerClient.getBlockBlobClient(folderPath);
        
        // Upload an empty blob as placeholder
        await blockBlobClient.upload("", 0);
        
        // Refresh the view
        loadFoldersAndImages(currentPrefix, currentPath);
      } catch (err) {
        console.error("Error creating folder:", err);
        const msg = (typeof err === 'object' && err && 'message' in err) ? (err as any).message : String(err);
        await customConfirm('Failed to create folder: ' + msg);
      }
    };
    
    loadFoldersAndImages(currentPrefix, currentPath);

    // Local upload functionality - simplified to upload immediately on file selection
    localUploadInput.addEventListener('change', async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files || files.length === 0) return;
      
      const file = files[0];
      if (!file.type.startsWith('image/')) {
        await customConfirm('Please select a valid image file');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result !== 'string') {
          console.error('Expected string result from FileReader');
          return;
        }
        
        selectImage(result);
        
        // Show success feedback
        const feedback = document.createElement('span');
        feedback.textContent = '✓ Uploaded!';
        feedback.style.marginLeft = '8px';
        feedback.style.color = '#28a745';
        
        localUploadInput.parentElement?.appendChild(feedback);
        
        // Reset after delay
        setTimeout(() => {
          feedback.remove();
          // Reset the input to allow selecting the same file again
          localUploadInput.value = '';
        }, 2000);
      };
      reader.onerror = async () => {
        await customConfirm('Error reading the file. Please try again.');
      };
      reader.readAsDataURL(file);
    });

    // URL input functionality
    loadUrlBtn.addEventListener('click', async () => {
      const url = imageUrlInput.value.trim();
      if (!url) return;
      
      // Simple URL validation
      try {
        new URL(url);
      } catch (e) {
        await customConfirm('Please enter a valid URL');
        return;
      }
      
      // Test if the URL is an image
      const img = new Image();
      img.onload = () => {
        urlImagePreview.src = url;
        urlPreview.style.display = 'block';
      };
      img.onerror = async () => {
        await customConfirm('Could not load image from the provided URL');
        urlPreview.style.display = 'none';
      };
      img.src = url;
    });
    
    insertUrlBtn.addEventListener('click', async () => {
      const url = imageUrlInput.value.trim();
      if (url) {
        try {
          // Test if the URL is an image
          const img = new Image();
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = () => reject(new Error('Invalid image URL'));
            img.src = url;
          });
          
          // If we get here, the image is valid
          selectImage(url);
          imageUrlInput.value = '';
          urlPreview.style.display = 'none';
        } catch (err) {
          await customConfirm('Could not load image from the provided URL');
        }
      }
    });
    
    // Handle Enter key in URL input
    imageUrlInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        loadUrlBtn.click();
      }
    });
  }

  function selectImage(url: string) {
    // If an image component is selected, update its src attribute robustly
    const selectedComponent = editor.getSelected && editor.getSelected();
    
    // Try to handle carousel/hero-carousel images (plain img inside slides, not GrapesJS image components)
    let updatedCarouselImage = false;
    if (selectedComponent) {
      try {
        const el = selectedComponent.getEl && selectedComponent.getEl();
        if (el) {
          // Check if selected component or its parent is part of a carousel slide
          const carouselSlide = el.closest && (el.closest('.pcf-slide') || el.closest('.pcf-hero-slide'));
          
          if (carouselSlide) {
            // Find the img inside this slide
            let imgEl: HTMLImageElement | null = null;
            
            // For regular carousel: img is inside .pcf-right
            const rightPanel = carouselSlide.querySelector('.pcf-right img');
            if (rightPanel && rightPanel.tagName === 'IMG') {
              imgEl = rightPanel as HTMLImageElement;
            }
            
            // For hero carousel: img is inside .pcf-img-wrap
            if (!imgEl) {
              const imgWrap = carouselSlide.querySelector('.pcf-img-wrap img');
              if (imgWrap && imgWrap.tagName === 'IMG') {
                imgEl = imgWrap as HTMLImageElement;
              }
            }
            
            // If we found an img, update it and its component model
            if (imgEl) {
              // Update DOM immediately
              imgEl.setAttribute('src', url);
              imgEl.src = url;
              
              // Try to find the GrapesJS component for this img and update its model
              try {
                // Search for image component by matching the DOM element
                const wrapper = editor.getWrapper();
                if (!wrapper) throw new Error('No wrapper');
                const allImgs = wrapper.find('img');
                for (let i = 0; i < allImgs.length; i++) {
                  const imgCmp = allImgs[i];
                  try {
                    const cmpEl = imgCmp.getEl && imgCmp.getEl();
                    if (cmpEl === imgEl) {
                      // Found the component - update its attributes
                      if (typeof imgCmp.setAttributes === 'function') {
                        imgCmp.setAttributes({ src: url });
                      }
                      if (typeof imgCmp.set === 'function') {
                        imgCmp.set('src', url);
                      }
                      
                      // Trigger change events
                      if (typeof (imgCmp as any).trigger === 'function') {
                        (imgCmp as any).trigger('change:src');
                        (imgCmp as any).trigger('change:attributes');
                      }
                      
                      // Re-render view
                      const view = (imgCmp as any).view;
                      if (view && typeof view.render === 'function') {
                        view.render();
                      }
                      
                      break;
                    }
                  } catch (_) { /* ignore */ }
                }
              } catch (_) { /* ignore component update errors */ }
              
              // Trigger editor update
              try {
                editor.trigger('component:update', selectedComponent);
              } catch (_) { /* ignore */ }
              
              updatedCarouselImage = true;
            }
          }
        }
      } catch (e) {
        console.warn('Error updating carousel image:', e);
      }
    }
    
    // If we updated a carousel image, we're done
    if (updatedCarouselImage) {
      try {
        modal.close();
      } catch (_) { /* ignore */ }
      
      // Store and refresh
      try {
        if (editor.store) editor.store();
      } catch (_) { /* ignore */ }
      
      setTimeout(() => {
        try {
          ensureImagesInPreview();
        } catch (_) { /* ignore */ }
      }, 100);
      
      return;
    }
    
    // Handle image collage cells and card-container images before the
    // standard GrapesJS image component flow so background-image updates
    // and plain DOM imgs inside custom containers are updated and persisted.
    try {
      // Image Collage Cell Handler: update divs with background-image
      let updatedCollageCell = false;
      if (selectedComponent) {
        try {
          const el = (selectedComponent.getEl && selectedComponent.getEl()) as HTMLElement | null;
          const collageEl = el && (el.closest ? el.closest('.image-collage-cell') : null) as HTMLElement | null;
          if (collageEl) {
            // Try to find the GrapesJS component corresponding to this element
            let collageCmp: any = null;
            try {
              const wrapper = editor.getWrapper && (editor.getWrapper() as any);
              if (wrapper && typeof wrapper.find === 'function') {
                const allCells = wrapper.find('.image-collage-cell') || [];
                for (let i = 0; i < allCells.length; i++) {
                  const c = allCells[i] as any;
                  try {
                    const cEl = c.getEl && c.getEl();
                    if (cEl === collageEl) {
                      collageCmp = c;
                      break;
                    }
                  } catch (_) { /* ignore */ }
                }
              }
            } catch (_) { /* ignore */ }

            // Fallback to selectedComponent when wrapper search fails
            if (!collageCmp) collageCmp = selectedComponent;

            try {
              // Update the GrapesJS component model (style + attribute)
              if (typeof collageCmp.setStyle === 'function') {
                collageCmp.setStyle({
                  'background-image': `url("${url}")`,
                  'background-size': 'cover',
                  'background-position': 'center',
                  'background-repeat': 'no-repeat',
                  'border': 'none'
                });
              }
              if (typeof collageCmp.addAttributes === 'function') {
                collageCmp.addAttributes({ 'data-has-image': 'true' });
              } else if (typeof collageCmp.addAttributes === 'undefined' && collageCmp.set) {
                // Older models may only support set
                collageCmp.set('attributes', Object.assign({}, collageCmp.get && collageCmp.get('attributes'), { 'data-has-image': 'true' }));
              }
            } catch (_) { /* ignore */ }

            // Update DOM element immediately for visual feedback
            try {
              collageEl.style.setProperty('background-image', `url("${url}")`);
              collageEl.style.setProperty('background-size', 'cover');
              collageEl.style.setProperty('background-position', 'center');
              collageEl.setAttribute('data-has-image', 'true');
            } catch (_) { /* ignore */ }

            // Trigger change and re-render
            try {
              (collageCmp as any).trigger && (collageCmp as any).trigger('change:style');
              const view = (collageCmp as any).view;
              view && typeof view.render === 'function' && view.render();
            } catch (_) { /* ignore */ }

            updatedCollageCell = true;
          }
        } catch (e) {
          /* ignore */
        }
      }

      if (updatedCollageCell) {
        try { modal.close(); } catch (_) { /* ignore */ }
        try { if (editor.store) editor.store(); } catch (_) { /* ignore */ }
        setTimeout(() => { try { ensureImagesInPreview(); } catch (_) { /* ignore */ } }, 100);
        return;
      }

      // Card Container Image Handler: update .card-image img inside .card-container
      let updatedCardImage = false;
      try {
        if (selectedComponent) {
          const el = (selectedComponent.getEl && selectedComponent.getEl()) as HTMLElement | null;
          const cardContainer = el && (el.closest ? el.closest('.card-container') : null) as HTMLElement | null;
          if (cardContainer) {
            const imgEl = (cardContainer.querySelector('.card-image img') || cardContainer.querySelector('img')) as HTMLImageElement | null;
            if (imgEl) {
              // Update DOM immediately
              try { imgEl.setAttribute('src', url); imgEl.src = url; } catch (_) { /* ignore */ }

              // Update GrapesJS component model if available
              try {
                const wrapper = editor.getWrapper && (editor.getWrapper() as any);
                if (wrapper && typeof wrapper.find === 'function') {
                  const allImgs = wrapper.find('img') || [];
                  for (let i = 0; i < allImgs.length; i++) {
                    const imgCmp = allImgs[i] as any;
                    try {
                      const cmpEl = imgCmp.getEl && imgCmp.getEl();
                      if (cmpEl === imgEl) {
                        if (typeof imgCmp.setAttributes === 'function') imgCmp.setAttributes({ src: url });
                        if (typeof imgCmp.set === 'function') imgCmp.set('src', url);
                        (imgCmp as any).trigger && (imgCmp as any).trigger('change:src');
                        const view = (imgCmp as any).view;
                        view && typeof view.render === 'function' && view.render();
                        break;
                      }
                    } catch (_) { /* ignore */ }
                  }
                }
              } catch (_) { /* ignore */ }

              updatedCardImage = true;
            }
          }
        }
      } catch (_) { /* ignore */ }

      if (updatedCardImage) {
        try { modal.close(); } catch (_) { /* ignore */ }
        try { if (editor.store) editor.store(); } catch (_) { /* ignore */ }
        setTimeout(() => { try { ensureImagesInPreview(); } catch (_) { /* ignore */ } }, 100);
        return;
      }

      // List Item Image Handler: update .list-img inside .list-item containers
      let updatedListImage = false;
      try {
        if (selectedComponent) {
          const el = (selectedComponent.getEl && selectedComponent.getEl()) as HTMLElement | null;
          const listItem = el && (el.closest ? el.closest('.list-item') : null) as HTMLElement | null;
          if (listItem) {
            const imgEl = listItem.querySelector('.list-img') as HTMLImageElement | null;
            if (imgEl) {
              // Update DOM immediately
              try { imgEl.setAttribute('src', url); imgEl.src = url; } catch (_) { /* ignore */ }

              // Update GrapesJS component model if available
              try {
                const wrapper = editor.getWrapper && (editor.getWrapper() as any);
                if (wrapper && typeof wrapper.find === 'function') {
                  const allImgs = wrapper.find('img') || [];
                  for (let i = 0; i < allImgs.length; i++) {
                    const imgCmp = allImgs[i] as any;
                    try {
                      const cmpEl = imgCmp.getEl && imgCmp.getEl();
                      if (cmpEl === imgEl) {
                        if (typeof imgCmp.setAttributes === 'function') imgCmp.setAttributes({ src: url });
                        if (typeof imgCmp.set === 'function') imgCmp.set('src', url);
                        (imgCmp as any).trigger && (imgCmp as any).trigger('change:src');
                        const view = (imgCmp as any).view;
                        view && typeof view.render === 'function' && view.render();
                        break;
                      }
                    } catch (_) { /* ignore */ }
                  }
                }
              } catch (_) { /* ignore */ }

              updatedListImage = true;
            }
          }
        }
      } catch (_) { /* ignore */ }

      if (updatedListImage) {
        try { modal.close(); } catch (_) { /* ignore */ }
        try { if (editor.store) editor.store(); } catch (_) { /* ignore */ }
        setTimeout(() => { try { ensureImagesInPreview(); } catch (_) { /* ignore */ } }, 100);
        return;
      }

      // Grid Card Image Handler: update img inside .grid-card-item containers
      let updatedGridImage = false;
      try {
        if (selectedComponent) {
          const el = (selectedComponent.getEl && selectedComponent.getEl()) as HTMLElement | null;
          const gridItem = el && (el.closest ? el.closest('.grid-card-item') : null) as HTMLElement | null;
          if (gridItem) {
            const imgEl = gridItem.querySelector('img') as HTMLImageElement | null;
            if (imgEl) {
              // Update DOM immediately
              try { imgEl.setAttribute('src', url); imgEl.src = url; } catch (_) { /* ignore */ }

              // Update GrapesJS component model if available
              try {
                const wrapper = editor.getWrapper && (editor.getWrapper() as any);
                if (wrapper && typeof wrapper.find === 'function') {
                  const allImgs = wrapper.find('img') || [];
                  for (let i = 0; i < allImgs.length; i++) {
                    const imgCmp = allImgs[i] as any;
                    try {
                      const cmpEl = imgCmp.getEl && imgCmp.getEl();
                      if (cmpEl === imgEl) {
                        if (typeof imgCmp.setAttributes === 'function') imgCmp.setAttributes({ src: url });
                        if (typeof imgCmp.set === 'function') imgCmp.set('src', url);
                        (imgCmp as any).trigger && (imgCmp as any).trigger('change:src');
                        const view = (imgCmp as any).view;
                        view && typeof view.render === 'function' && view.render();
                        break;
                      }
                    } catch (_) { /* ignore */ }
                  }
                }
              } catch (_) { /* ignore */ }

              updatedGridImage = true;
            }
          }
        }
      } catch (_) { /* ignore */ }

      if (updatedGridImage) {
        try { modal.close(); } catch (_) { /* ignore */ }
        try { if (editor.store) editor.store(); } catch (_) { /* ignore */ }
        setTimeout(() => { try { ensureImagesInPreview(); } catch (_) { /* ignore */ } }, 100);
        return;
      }
    } catch (_) { /* ignore whole handler errors */ }

    // Standard image component handling
    if (selectedComponent && selectedComponent.is && selectedComponent.is('image')) {
      // Update the src using both methods for compatibility
      if (typeof selectedComponent.setAttributes === 'function') {
        selectedComponent.setAttributes({ src: url });
      }
      selectedComponent.set('src', url);
      
      // Update the DOM element directly for immediate visual feedback
      try {
        const el = selectedComponent.getEl();
        if (el && el.tagName === 'IMG') {
          el.setAttribute('src', url);
          (el as HTMLImageElement).src = url;
        }
      } catch (e) {
        console.warn('Could not update DOM element:', e);
      }
      
      // Force component view to re-render
      const view = (selectedComponent as any).view;
      if (view && typeof view.render === 'function') {
        view.render();
      }
      
      // Trigger change events for proper state management
      if (typeof (selectedComponent as any).trigger === 'function') {
        (selectedComponent as any).trigger('change:src');
        (selectedComponent as any).trigger('change:attributes');
      }
      
      // Trigger editor-level events
      editor.trigger('component:update', selectedComponent);
      
      // Store the changes immediately
      if (editor.store) {
        try {
          editor.store();
        } catch (e) {
          console.warn('Store failed:', e);
        }
      }
      
      // Ensure the canvas is refreshed
      setTimeout(() => {
        ensureImagesInPreview();
      }, 100);
      
    } else {
      // Fallback: add to asset manager and select
      const selected = { src: url };
      try {
        am.add(selected);
        
        if (typeof am.select === "function") am.select(selected);
        else if (typeof (am as any).onSelect === "function") (am as any).onSelect(selected);
      } catch (e) {
        try {
          am.open && am.open();
        } catch (_e) { /* ignore */ }
      }
    }
    try {
      modal.close();
    } catch (_) { /* ignore */ }
  }

  // Add preview mode handlers to ensure images display correctly
  editor.on('load', () => {
    ensureImagesInPreview();
  });

  // Re-inject image styles when entering preview mode
  editor.on('run:preview', () => {
    setTimeout(() => ensureImagesInPreview(), 100);
  });

  // Re-inject image styles when exiting preview mode
  editor.on('stop:preview', () => {
    setTimeout(() => ensureImagesInPreview(), 100);
  });

  function ensureImagesInPreview() {
    try {
      const frameEl = editor.Canvas.getFrameEl();
      const frameDoc = frameEl?.contentDocument || frameEl?.contentWindow?.document;
      if (!frameDoc) return;

      // Ensure all images have proper src attributes
      const images = frameDoc.querySelectorAll('img[data-gjs-type="image"]');
      images.forEach((img: any) => {
        const component = editor.DomComponents.getWrapper()?.find(`#${img.id}`)?.[0];
        if (component) {
          // Cast to any to access GrapesJS component methods
          const comp = component as any;
          const src = comp.get('src') || comp.getAttributes()?.src;
          if (src && img.src !== src) {
            img.src = src;
          }
        }
      });

      // Add defensive styles for images
      let existingStyle = frameDoc.querySelector('#azure-image-styles');
      if (!existingStyle) {
        existingStyle = frameDoc.createElement('style');
        existingStyle.id = 'azure-image-styles';
        frameDoc.head.appendChild(existingStyle);
      }
      existingStyle.textContent = `
        img[data-gjs-type="image"] {
          max-width: 100%;
          height: auto;
          display: block;
        }
      `;
    } catch (e) {
      console.error('Error ensuring images in preview:', e);
    }
  }

  // Expose a command to open the Azure image explorer so other code (e.g. dblclick handlers)
  // can trigger the same modal in a safe, decoupled way.
  try {
    editor.Commands.add('azure-image:open', {
      run: function (ed: any, sender: any, opts: any) {
        try {
          // Allow an optional callback/opts in future; for now simply open the explorer
          openAzureExplorer();
        } catch (e) {
          console.error('azure-image:open command failed', e);
        }
      },
    });
  } catch (e) {
    /* ignore */
  }

}
