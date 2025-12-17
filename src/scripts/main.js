
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const fileList = document.getElementById('file-list');
    const uploadBtn = document.getElementById('upload-btn');

    let filesArray = []; // Store files before uploading

    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      addFiles(e.dataTransfer.files);
    });

    fileInput.addEventListener('change', () => addFiles(fileInput.files));

    function addFiles(newFiles) {
      for (let i = 0; i < newFiles.length; i++) {
        filesArray.push(newFiles[i]);
      }
      renderFileList();
    }

    function renderFileList() {
      fileList.innerHTML = '';
      filesArray.forEach((file, index) => {
        const li = document.createElement('li');
        li.classList.add('file-item');
        li.innerHTML = `
          <span>${file.name} (${(file.size / 1024).toFixed(2)} KB)</span>
          <button data-index="${index}">Remove</button>
        `;
        fileList.appendChild(li);
      });

      // Add remove functionality
      document.querySelectorAll('.file-item button').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const index = e.target.getAttribute('data-index');
          filesArray.splice(index, 1);
          renderFileList();
        });
      });
    }

    uploadBtn.addEventListener('click', () => {
      if (filesArray.length === 0) {
        alert('No files to upload!');
        return;
      }

      const formData = new FormData();
      filesArray.forEach(file => formData.append('files', file));

      fetch('/upload', {
        method: 'POST',
        body: formData
      })
      .then(res => res.json())
      .then(data => {
        alert('Files uploaded successfully!');
        filesArray = [];
        renderFileList();
      })
      .catch(err => console.error('Upload error:', err));
    });
