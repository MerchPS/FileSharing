document.addEventListener('DOMContentLoaded', function() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const uploadButton = document.getElementById('uploadButton');
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const downloadSection = document.getElementById('downloadSection');
    const downloadLink = document.getElementById('downloadLink');
    const copyButton = document.getElementById('copyButton');

    // Konfigurasi JSONBin
    const binId = 'YOUR_BIN_ID'; // Ganti dengan ID bin Anda
    const masterKey = '$2a$10$37iV2HZGa9Jd00XfOi6YmeRHoyYN0fCyvE/CQJfkqINjrs/d2yM3C';
    const accessKey = '$2a$10$4VeEjwfvcnTsyjehf3YD/OES9lNI2Ef8Pfv6WN.O34ZSr06E6ix7m';

    let selectedFile = null;

    // Event listeners untuk drag and drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    function highlight() {
        dropZone.classList.add('highlight');
    }

    function unhighlight() {
        dropZone.classList.remove('highlight');
    }

    dropZone.addEventListener('drop', handleDrop, false);
    dropZone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', handleFileSelect);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }

    function handleFileSelect(e) {
        const files = e.target.files;
        handleFiles(files);
    }

    function handleFiles(files) {
        if (files.length > 0) {
            selectedFile = files[0];
            
            // Validasi ukuran file (max 500MB)
            if (selectedFile.size > 500 * 1024 * 1024) {
                alert('Ukuran file terlalu besar. Maksimal 500MB.');
                selectedFile = null;
                return;
            }
            
            dropZone.querySelector('.drop-zone__prompt').textContent = selectedFile.name;
        }
    }

    uploadButton.addEventListener('click', uploadFile);

    async function uploadFile() {
        if (!selectedFile) {
            alert('Pilih file terlebih dahulu.');
            return;
        }

        uploadButton.disabled = true;
        progressContainer.style.display = 'block';
        
        try {
            // Membaca file sebagai base64
            const reader = new FileReader();
            
            reader.onload = async function(e) {
                const base64Content = e.target.result.split(',')[1];
                
                // Data yang akan disimpan
                const fileData = {
                    filename: selectedFile.name,
                    size: selectedFile.size,
                    type: selectedFile.type,
                    uploadedAt: new Date().toISOString(),
                    content: base64Content
                };
                
                try {
                    // Simpan ke JSONBin
                    const response = await fetch(`https://api.jsonbin.io/v3/b`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Master-Key': masterKey,
                            'X-Access-Key': accessKey,
                            'X-Bin-Name': selectedFile.name,
                            'X-Bin-Private': 'false'
                        },
                        body: JSON.stringify(fileData)
                    });
                    
                    if (!response.ok) {
                        throw new Error('Gagal menyimpan data');
                    }
                    
                    const result = await response.json();
                    const fileId = result.metadata.id;
                    
                    // Generate download link
                    const link = `${window.location.origin}${window.location.pathname}?id=${fileId}`;
                    downloadLink.value = link;
                    downloadSection.style.display = 'block';
                    
                    // Scroll ke hasil
                    downloadSection.scrollIntoView({ behavior: 'smooth' });
                    
                } catch (error) {
                    console.error('Error:', error);
                    alert('Terjadi kesalahan saat mengunggah file.');
                } finally {
                    uploadButton.disabled = false;
                    progressContainer.style.display = 'none';
                }
            };
            
            reader.onprogress = function(e) {
                if (e.lengthComputable) {
                    const percentLoaded = Math.round((e.loaded / e.total) * 100);
                    progressBar.style.width = percentLoaded + '%';
                    progressText.textContent = `Mengunggah... ${percentLoaded}%`;
                }
            };
            
            reader.readAsDataURL(selectedFile);
            
        } catch (error) {
            console.error('Error:', error);
            alert('Terjadi kesalahan saat mengunggah file.');
            uploadButton.disabled = false;
            progressContainer.style.display = 'none';
        }
    }

    copyButton.addEventListener('click', function() {
        downloadLink.select();
        document.execCommand('copy');
        alert('Link berhasil disalin!');
    });

    // Cek jika ada parameter ID di URL untuk download
    const urlParams = new URLSearchParams(window.location.search);
    const fileId = urlParams.get('id');
    
    if (fileId) {
        downloadFile(fileId);
    }

    async function downloadFile(fileId) {
        try {
            // Ambil data dari JSONBin
            const response = await fetch(`https://api.jsonbin.io/v3/b/${fileId}`, {
                headers: {
                    'X-Master-Key': masterKey,
                    'X-Access-Key': accessKey
                }
            });
            
            if (!response.ok) {
                throw new Error('File tidak ditemukan');
            }
            
            const result = await response.json();
            const fileData = result.record;
            
            // Konversi base64 kembali ke blob
            const byteCharacters = atob(fileData.content);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: fileData.type });
            
            // Buat link download
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = fileData.filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            
        } catch (error) {
            console.error('Error:', error);
            alert('Terjadi kesalahan saat mengunduh file.');
        }
    }
});
