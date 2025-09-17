// api/download.js
module.exports = async (req, res) => {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { id } = req.query;
    
    if (!id) {
        return res.status(400).json({ error: 'File ID is required' });
    }

    try {
        // Konfigurasi JSONBin dari environment variables
        const masterKey = process.env.JSONBIN_MASTER_KEY;
        const accessKey = process.env.JSONBIN_ACCESS_KEY;

        if (!masterKey || !accessKey) {
            return res.status(500).json({ error: 'Server configuration error' });
        }

        // Ambil data dari JSONBin
        const response = await fetch(`https://api.jsonbin.io/v3/b/${id}`, {
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
        
        // Konversi base64 kembali ke buffer
        const buffer = Buffer.from(fileData.content, 'base64');
        
        // Set header untuk download
        res.setHeader('Content-Type', fileData.type);
        res.setHeader('Content-Length', buffer.length);
        res.setHeader('Content-Disposition', `attachment; filename="${fileData.filename}"`);
        
        // Kirim file
        res.send(buffer);
        
    } catch (error) {
        console.error('Error:', error);
        res.status(404).json({ error: 'File tidak ditemukan' });
    }
};
