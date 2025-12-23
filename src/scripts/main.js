import JSZip from 'jszip';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabaseClient = window.supabase.createClient(
  supabaseUrl,
  supabaseAnonKey
);

// Constants
const BUCKET_NAME = 'shared-files';
const CODE_LENGTH = 6;


document.addEventListener('DOMContentLoaded', () => {

  // ==========================================
  // PAGE ROUTING LOGIC
  // ==========================================

  const dropZone = document.getElementById('drop-zone');
  const codeInput = document.getElementById('code-input');

  if (dropZone) {
    initUploadPage();
  } else if (codeInput) {
    initDownloadPage();
  }

});


// ==========================================
// UPLOAD PAGE LOGIC
// ==========================================
function initUploadPage() {
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  const fileList = document.getElementById('file-list');
  const uploadBtn = document.getElementById('upload-btn');
  const resultModal = document.getElementById('result-modal');
  const modalCodes = document.getElementById('modal-codes');
  const uploadProgress = document.getElementById('upload-progress');
  const progressFill = document.getElementById('progress-fill');
  const progressText = document.getElementById('progress-text');

  let filesArray = [];

  // Drag & Drop Handlers
  dropZone.addEventListener('click', () => fileInput.click());

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  });

  fileInput.addEventListener('change', () => {
    const files = Array.from(fileInput.files);
    addFiles(files);
  });

  // Add files to upload queue
  function addFiles(newFiles) {
    if (newFiles.length === 0) return;

    newFiles.forEach(file => {
      // Check file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        showToast(`${file.name} exceeds 50MB limit.`, "error");
        return;
      }

      // Check if file already exists in queue
      if (!filesArray.some(f => f.name === file.name && f.size === file.size)) {
        filesArray.push(file);
      }
    });

    renderFileList();
  }

  // Render file list
  function renderFileList() {
    fileList.innerHTML = '';

    if (filesArray.length === 0) {
      fileList.innerHTML = '<li class="empty-list">No files selected. Drag & drop files or click to upload.</li>';
      return;
    }

    filesArray.forEach((file, index) => {
      const li = document.createElement('li');
      li.className = 'file-item';
      li.innerHTML = `
            <div class="file-info">
              <div class="file-details">
                <span class="file-name">${truncateFileName(file.name, 25)}</span>
                <span class="file-size">${formatFileSize(file.size)}</span>
              </div>
            </div>
            <button class="remove-btn" data-index="${index}" title="Remove file">
              <i class="fa-solid fa-xmark"></i>
            </button>
          `;
      fileList.appendChild(li);
    });

    // Add remove functionality
    document.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.getAttribute('data-index'));
        filesArray.splice(index, 1);
        renderFileList();
      });
    });
  }

  // Upload files
  if (uploadBtn) {
    uploadBtn.addEventListener('click', async () => {
      if (filesArray.length === 0) {
        showToast("No files to upload!", "error");
        return;
      }

      // Disable button during upload
      const originalText = uploadBtn.textContent;
      uploadBtn.disabled = true;
      uploadBtn.textContent = 'Uploading...';
      uploadProgress.style.display = 'block';

      const results = [];
      let successCount = 0;
      let errorCount = 0;

      try {
        // ZIP LOGIC START
        console.log('Starting compression...');
        progressText.innerHTML = '<i class="fa-solid fa-file-zipper"></i> Compressing files...';
        const zip = new JSZip();

        // Add all files to the zip
        filesArray.forEach(file => {
          zip.file(file.name, file);
        });

        try {
          // Generate zip blob
          const zipBlob = await zip.generateAsync({
            type: "blob",
            mimeType: "application/zip",
            compression: "DEFLATE",
            compressionOptions: {
              level: 6
            }
          }, (metadata) => {
            const percent = Math.round(metadata.percent);
            progressFill.style.width = `${percent}%`;
            progressText.innerHTML = `<i class="fa-solid fa-file-zipper"></i> Compressing: ${percent}%`;
          });

          console.log('Compression complete. Uploading zip...');
          progressText.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Uploading bundle...';
          progressFill.style.width = '50%'; // Reset for upload phase

          // Generate unique code for the ZIP
          let code;
          let isUnique = false;
          let attempts = 0;

          while (!isUnique && attempts < 5) {
            code = generateCode();
            attempts++;
            const { data: existing } = await supabaseClient
              .from('shared_files')
              .select('code')
              .eq('code', code)
              .maybeSingle();
            if (!existing) isUnique = true;
          }

          if (!isUnique) throw new Error('Could not generate unique code');

          // Unique filename for zip
          const timestamp = Date.now();
          const randomId = Math.random().toString(36).substring(2, 8);
          const fileName = `bundle_${timestamp}_${randomId}.zip`;

          // Upload ZIP to Supabase
          const { error: uploadError } = await supabaseClient.storage
            .from(BUCKET_NAME)
            .upload(fileName, zipBlob, {
              contentType: 'application/zip',
              upsert: false
            });

          if (uploadError) throw uploadError;

          // Get public URL
          const { data: { publicUrl } } = supabaseClient.storage
            .from(BUCKET_NAME)
            .getPublicUrl(fileName);

          // Insert into DB
          const { error: dbError } = await supabaseClient
            .from('shared_files')
            .insert({
              code: code,
              file_name: `All_Files_${timestamp}.zip`, // User friendly name
              file_path: fileName,
              file_size: zipBlob.size
            });

          if (dbError) throw dbError;

          // Success
          results.push({
            fileName: `All_Files_${timestamp}.zip (Bundle)`,
            code: code
          });
          successCount = filesArray.length; // All files uploaded as one
          progressFill.style.width = '100%';
          progressText.innerHTML = '<i class="fa-solid fa-circle-check"></i> Upload Complete!';

        } catch (err) {
          console.error('Zip/Upload failed:', err);
          errorCount = filesArray.length;
          showToast('Failed to upload files. Please try again.', 'error');
        }
        // ZIP LOGIC END

        // Show results
        if (results.length > 0) {
          showUploadResults(results);
        }

        filesArray = [];
        renderFileList();


      } catch (error) {
        console.error('Upload error:', error);
        showToast('Upload failed: ' + error.message, "error");
      } finally {
        // Reset UI
        uploadBtn.disabled = false;
        uploadBtn.textContent = originalText;
        uploadProgress.style.display = 'none';
        progressFill.style.width = '0%';
      }
    });
  }

  function showUploadResults(results) {
    modalCodes.innerHTML = '';

    results.forEach(result => {
      const resultElement = document.createElement('div');
      resultElement.className = 'upload-result';
      resultElement.innerHTML = `
            <div style="margin-bottom: 10px;">
              <strong style="color: var(--slate-550--);"><i class="fa-regular fa-file"></i> ${result.fileName}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <div>
                <div style="font-size: 1.8em; font-weight: bold; letter-spacing: 2px; color: var(--slate-500--);">
                  ${result.code}
                </div>
                <div style="font-size: 0.85em; color: var(--slate-650--); margin-top: 5px;">
                  Share this 6-digit code
                </div>
              </div>
              <button class="copy-btn" data-code="${result.code}" style="
                background: var(--slate-800--);
                color: var(--slate-550--);
                border: none;
                padding: 8px 15px;
                border-radius: 8px;
                cursor: pointer;
              "><i class="fa-regular fa-copy"></i> Copy</button>
            </div>
          `;
      modalCodes.appendChild(resultElement);
    });

    document.querySelectorAll('.copy-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const code = e.target.getAttribute('data-code');
        navigator.clipboard.writeText(code).then(() => {
          const originalText = e.target.textContent;
          e.target.textContent = 'Copied!';
          e.target.style.background = '#10b981';
          setTimeout(() => {
            e.target.textContent = originalText;
            e.target.style.background = '';
          }, 2000);
        });
      });
    });

    resultModal.style.display = 'flex';
  }

  // Modal handlers
  document.getElementById('copy-all').addEventListener('click', () => {
    const codes = Array.from(document.querySelectorAll('.copy-btn'))
      .map(btn => btn.getAttribute('data-code'))
      .join('\n');
    navigator.clipboard.writeText(codes).then(() => {
      const btn = document.getElementById('copy-all');
      btn.textContent = 'All Codes Copied!';
      btn.style.background = '#10b981';
      setTimeout(() => {
        btn.textContent = 'Copy All Codes';
        btn.style.background = '';
      }, 2000);
    });
  });

  document.getElementById('close-modal').addEventListener('click', () => {
    resultModal.style.display = 'none';
  });

  resultModal.addEventListener('click', (e) => {
    if (e.target === resultModal) {
      resultModal.style.display = 'none';
    }
  });

  // Initial render
  renderFileList();
}


// ==========================================
// DOWNLOAD PAGE LOGIC
// ==========================================
function initDownloadPage() {
  const resultDiv = document.getElementById('download-result');
  const codeInput = document.getElementById('code-input');
  const downloadBtn = document.getElementById('download-btn');

  // Input handling
  codeInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.toUpperCase();
  });

  function getCode() {
    return codeInput.value.toUpperCase();
  }

  // Check URL params
  const params = new URLSearchParams(window.location.search);
  const codeFromUrl = params.get('code');

  if (codeFromUrl && /^[A-Z0-9]{6}$/.test(codeFromUrl)) {
    codeInput.value = codeFromUrl;
    loadFile(codeFromUrl);
  }

  downloadBtn.addEventListener('click', () => {
    const code = getCode();
    if (code.length !== 6) {
      showError('Please enter a valid 6-digit code');
      return;
    }
    loadFile(code);
  });


  async function loadFile(code) {
    resultDiv.innerHTML = '<p>Loading file info...</p>';
    resultDiv.className = '';

    try {
      const { data, error } = await supabaseClient // Use shared client
        .from('shared_files')
        .select('*')
        .eq('code', code)
        .maybeSingle();

      if (error || !data) {
        // showError('File not found. Check your code.');
        showToast('File not found. Check your code.', 'error');
        resultDiv.innerHTML = '';
        return;
      }

      // Clear existing interval if any
      if (resultDiv._countdownInterval) {
        clearInterval(resultDiv._countdownInterval);
      }

      // Check expiry (24h)
      let countdownInterval;

      function updateCountdown() {
        const created = new Date(data.created_at);
        const expiryTime = new Date(created.getTime() + 24 * 60 * 60 * 1000);
        const now = new Date();
        const diffMs = expiryTime - now;

        if (diffMs <= 0) {
          clearInterval(countdownInterval);
          showToast('This file has expired.', 'error');
          resultDiv.innerHTML = '';
          return;
        }

        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

        const timeLeftElement = document.getElementById('time-left');
        if (timeLeftElement) {
          timeLeftElement.innerHTML = `<i class="fa-regular fa-clock"></i> Expires in: ${hours}h ${minutes}m ${seconds}s`;
        }
      }

      if (data.created_at) {
        const created = new Date(data.created_at);
        const now = new Date();
        const diffHours = (now - created) / 1000 / 60 / 60;
        if (diffHours > 24) {
          showToast('This file has expired.', 'error');
          resultDiv.innerHTML = '';
          return;
        }
      }

      const { data: { publicUrl } } = supabaseClient.storage
        .from(BUCKET_NAME)
        .getPublicUrl(data.file_path);

      resultDiv.innerHTML = `
        <div class="success">
          <h3><i class="fa-solid fa-circle-check"></i> File Found</h3>
          <p><strong>Name:</strong> ${data.file_name}</p>
          <p><strong>Size:</strong> ${formatFileSize(data.file_size)}</p>
          <p id="time-left" class="expiry-timer" style="color: var(--slate-500--); font-size: 0.9em; margin-top: 10px;"></p>

          <button id="force-download-btn" class="download-btn" style="margin-top: 15px;">
            Download Now
          </button>
        </div>
      `;

      // Start countdown
      updateCountdown();
      countdownInterval = setInterval(updateCountdown, 1000);

      // Store interval on the element to clear it if another search happens
      resultDiv._countdownInterval = countdownInterval;

      // Add click handler for force download
      document.getElementById('force-download-btn').addEventListener('click', async () => {
        const btn = document.getElementById('force-download-btn');
        const originalText = btn.textContent;
        btn.textContent = 'Downloading...';
        btn.disabled = true;

        try {
          // Manually construct the download URL to force Content-Disposition at the server level
          const fileName = data.file_name || 'download.zip';
          const finalName = fileName.toLowerCase().endsWith('.zip') ? fileName : `${fileName}.zip`;

          const downloadUrl = `${publicUrl}?download=${encodeURIComponent(finalName)}`;

          console.log('Download URL:', downloadUrl);

          // Trigger download via hidden link
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = downloadUrl;
          a.download = finalName;
          document.body.appendChild(a);
          a.click();

          // Cleanup
          setTimeout(() => {
            document.body.removeChild(a);
          }, 1000);

        } catch (err) {
          console.error('Download failed:', err);
          showToast('Download failed.', 'error');
          // Fallback to opening
          window.open(publicUrl, '_blank');
        } finally {
          setTimeout(() => {
            btn.textContent = originalText;
            btn.disabled = false;
          }, 1000);
        }
      });
    } catch (err) {
      console.error(err);
      showToast('Something went wrong.', 'error');
      resultDiv.innerHTML = '';
    }
  }

  function showError(msg) {
    showToast(msg, 'error');
    resultDiv.innerHTML = '';
  }



}


// ==========================================
// SHARED HELPERS
// ==========================================
function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function truncateFileName(name, maxLength) {
  if (name.length <= maxLength) return name;
  const extIndex = name.lastIndexOf('.');
  const ext = name.substring(extIndex);
  const nameWithoutExt = name.substring(0, extIndex);
  const truncated = nameWithoutExt.substring(0, maxLength - ext.length - 3) + '...';
  return truncated + ext;
}

function formatFileSize(bytes) {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return; // Toast container might not exist on download page

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  if (container.children.length > 5) {
    container.removeChild(container.firstChild);
  }
  setTimeout(() => {
    toast.remove();
  }, 5000);
}
