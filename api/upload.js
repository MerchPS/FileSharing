// api/upload.js
module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { filename, size, type, uploadedAt, content } = req.body;
        
        // Validasi data
        if (!filename || !content) {
            return res.status(400).json({ error: 'Data tidak lengkap' });
        }

        // Konfigurasi JSONBin dari environment variables
        const masterKey = process.env.JSONBIN_MASTER_KEY;
        const accessKey = process.env.JSONBIN_ACCESS_KEY;

        if (!masterKey || !accessKey) {
            return res.status(500).json({ error: 'Server configuration error' });
        }

        // Data yang akan disimpan
        const fileData = {
            filename,
            size,
            type,
            uploadedAt,
            content
        };

        // Simpan ke JSONBin
        const response = await fetch('https://api.jsonbin.io/v3/b', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': masterKey,
                'X-Access-Key': accessKey,
                'X-Bin-Name': filename,
                'X-Bin-Private': 'false'
            },
            body: JSON.stringify(fileData)
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Gagal menyimpan data: ${error}`);
        }

        const result = await response.json();
        const fileId = result.metadata.id;

        res.status(200).json({ 
            success: true, 
            id: fileId,
            message: 'File berhasil diunggah' 
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            error: 'Terjadi kesalahan server',
            message: error.message 
        });
    }
};
