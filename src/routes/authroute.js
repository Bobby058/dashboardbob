import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import db from '../db.js'
import { authMiddleware } from '../middleware/authMiddleware.js'

const router = express.Router()


router.post('/auth/register', async (req, res) => {
    const { nama, email, password, role } = req.body
    if (!nama || !email || !password)
        return res.status(400).json({ message: 'Semua field wajib diisi' })

    try {
        const hash = await bcrypt.hash(password, 10)
        await db.execute(
            'INSERT INTO users (nama, email, password, role) VALUES (?, ?, ?, ?)',
            [nama, email, hash, role || 'staff']
        )
        res.status(201).json({ message: 'Registrasi berhasil' })
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY')
            return res.status(409).json({ message: 'Email sudah terdaftar' })
        res.status(500).json({ message: 'Server error' })
    }
})

router.post('/auth/login', async (req, res) => {
    const { email, password } = req.body
    if (!email || !password)
        return res.status(400).json({ message: 'Email dan password wajib diisi' })

    try {
        const [rows] = await db.execute(
            'SELECT * FROM users WHERE email = ?', [email]
        )
        if (rows.length === 0)
            return res.status(401).json({ message: 'Email tidak ditemukan' })

        const user = rows[0]
        const match = await bcrypt.compare(password, user.password)
        if (!match)
            return res.status(401).json({ message: 'Password salah' })

        const token = jwt.sign(
            { id: user.id, nama: user.nama, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        )
        res.json({ token, nama: user.nama, role: user.role })
    } catch {
        res.status(500).json({ message: 'Server error' })
    }
})

router.get('/auth/profile', authMiddleware, async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT id, nama, email, role, created_at FROM users WHERE id = ?',
            [req.user.id]
        )
        if (rows.length === 0)
            return res.status(404).json({ message: 'User tidak ditemukan' })
        res.json(rows[0])
    } catch {
        res.status(500).json({ message: 'Server error' })
    }
})

router.put('/auth/profile', authMiddleware, async (req, res) => {
    const { nama, email, password } = req.body
    try {
        if (password) {
            const hash = await bcrypt.hash(password, 10)
            await db.execute(
                'UPDATE users SET nama = ?, email = ?, password = ? WHERE id = ?',
                [nama, email, hash, req.user.id]
            )
        } else {
            await db.execute(
                'UPDATE users SET nama = ?, email = ? WHERE id = ?',
                [nama, email, req.user.id]
            )
        }
        res.json({ message: 'Profil berhasil diupdate' })
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY')
            return res.status(409).json({ message: 'Email sudah dipakai' })
        res.status(500).json({ message: 'Server error' })
    }
})


router.get('/barang', authMiddleware, async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM barang ORDER BY nama ASC')
        res.json(rows)
    } catch {
        res.status(500).json({ message: 'Server error' })
    }
})

router.post('/barang', authMiddleware, async (req, res) => {
    const { kode, nama, kategori, satuan, stok, min_stok } = req.body
    if (!kode || !nama || !kategori || !satuan)
        return res.status(400).json({ message: 'Semua field wajib diisi' })

    try {
        const status = stok === 0 ? 'habis' : stok <= min_stok ? 'menipis' : 'aman'
        await db.execute(
            'INSERT INTO barang (kode, nama, kategori, satuan, stok, min_stok, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [kode, nama, kategori, satuan, stok || 0, min_stok || 5, status]
        )
        res.status(201).json({ message: 'Barang berhasil ditambahkan' })
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY')
            return res.status(409).json({ message: 'Kode barang sudah ada' })
        res.status(500).json({ message: 'Server error' })
    }
})

router.put('/barang/:kode', authMiddleware, async (req, res) => {
    const { kode } = req.params
    const { nama, kategori, satuan, stok, min_stok } = req.body
    try {
        const status = stok === 0 ? 'habis' : stok <= min_stok ? 'menipis' : 'aman'
        const [result] = await db.execute(
            'UPDATE barang SET nama = ?, kategori = ?, satuan = ?, stok = ?, min_stok = ?, status = ? WHERE kode = ?',
            [nama, kategori, satuan, stok, min_stok, status, kode]
        )
        if (result.affectedRows === 0)
            return res.status(404).json({ message: 'Barang tidak ditemukan' })
        res.json({ message: 'Barang berhasil diupdate' })
    } catch {
        res.status(500).json({ message: 'Server error' })
    }
})

router.delete('/barang/:kode', authMiddleware, async (req, res) => {
    const { kode } = req.params
    try {
        const [result] = await db.execute(
            'DELETE FROM barang WHERE kode = ?', [kode]
        )
        if (result.affectedRows === 0)
            return res.status(404).json({ message: 'Barang tidak ditemukan' })
        res.json({ message: 'Barang berhasil dihapus' })
    } catch (err) {
        if (err.code === 'ER_ROW_IS_REFERENCED_2')
            return res.status(409).json({ message: 'Barang tidak bisa dihapus karena masih ada di histori transaksi' })
        res.status(500).json({ message: 'Server error' })
    }
})


router.get('/inbound', authMiddleware, async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT 
                i.id, i.tanggal,
                i.nomor_sj AS nomorSJ,
                i.supplier,
                i.kode_barang AS kodeBarang,
                i.jumlah, i.satuan,
                b.nama AS namaBarang
            FROM inbound i
            JOIN barang b ON i.kode_barang = b.kode
            ORDER BY i.tanggal DESC, i.created_at DESC
        `)
        res.json(rows)
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Server error' })
    }
})

router.post('/inbound', authMiddleware, async (req, res) => {
    const { id, tanggal, nomorSJ, supplier, kodeBarang, jumlah, satuan } = req.body
    if (!tanggal || !nomorSJ || !supplier || !kodeBarang || !jumlah)
        return res.status(400).json({ message: 'Semua field wajib diisi' })

    try {
        await db.execute(
            'INSERT INTO inbound (tanggal, nomor_sj, supplier, kode_barang, jumlah, satuan) VALUES (?, ?, ?, ?, ?, ?)',
            [tanggal, nomorSJ, supplier, kodeBarang, jumlah, satuan]
        )
        res.status(201).json({ message: 'Inbound berhasil ditambahkan' })
    } catch (err) {       
        console.error(err) 
        res.status(500).json({ message: 'Server error' })
    }
})

router.delete('/inbound/:id', authMiddleware, async (req, res) => {
    const { id } = req.params
    try {
        const [result] = await db.execute(
            'DELETE FROM inbound WHERE id = ?', [id]
        )
        if (result.affectedRows === 0)
            return res.status(404).json({ message: 'Data tidak ditemukan' })
        res.json({ message: 'Inbound berhasil dihapus' })
    } catch {
        res.status(500).json({ message: 'Server error' })
    }
})

router.get('/outbound', authMiddleware, async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT o.*, b.nama AS nama_barang
            FROM outbound o
            JOIN barang b ON o.kode_barang = b.kode
            ORDER BY o.tanggal DESC, o.created_at DESC
        `)
        res.json(rows)
    } catch {
        res.status(500).json({ message: 'Server error' })
    }
})

router.post('/outbound', authMiddleware, async (req, res) => {
    const { id, tanggal, kategori, kode_barang, jumlah, satuan, supplier, nomor_sj, keterangan } = req.body
    if (!tanggal || !kategori || !kode_barang || !jumlah)
        return res.status(400).json({ message: 'Semua field wajib diisi' })

    try {
        // cek stok cukup
        const [rows] = await db.execute(
            'SELECT stok FROM barang WHERE kode = ?', [kode_barang]
        )
        if (rows.length === 0)
            return res.status(404).json({ message: 'Barang tidak ditemukan' })
        if (rows[0].stok < jumlah)
            return res.status(400).json({ message: `Stok tidak cukup, stok saat ini: ${rows[0].stok}` })

        await db.execute(
            'INSERT INTO outbound (id, tanggal, kategori, kode_barang, jumlah, satuan, supplier, nomor_sj, keterangan) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [id, tanggal, kategori, kode_barang, jumlah, satuan, supplier || null, nomor_sj || null, keterangan || null]
        )
        res.status(201).json({ message: 'Outbound berhasil ditambahkan' })
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY')
            return res.status(409).json({ message: 'ID transaksi sudah ada' })
        res.status(500).json({ message: 'Server error' })
    }
})

router.delete('/outbound/:id', authMiddleware, async (req, res) => {
    const { id } = req.params
    try {
        const [result] = await db.execute(
            'DELETE FROM outbound WHERE id = ?', [id]
        )
        if (result.affectedRows === 0)
            return res.status(404).json({ message: 'Data tidak ditemukan' })
        res.json({ message: 'Outbound berhasil dihapus' })
    } catch {
        res.status(500).json({ message: 'Server error' })
    }
})

router.get('/retur', authMiddleware, async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT o.*, b.nama AS nama_barang
            FROM outbound o
            JOIN barang b ON o.kode_barang = b.kode
            WHERE o.kategori = 'retur'
            ORDER BY o.tanggal DESC, o.created_at DESC
        `)
        res.json(rows)
    } catch {
        res.status(500).json({ message: 'Server error' })
    }
})

router.get('/summary', authMiddleware, async (req, res) => {
    try {
        const [[{ total_barang }]] = await db.execute('SELECT COUNT(*) AS total_barang FROM barang')
        const [[{ total_stok }]] = await db.execute('SELECT COALESCE(SUM(stok), 0) AS total_stok FROM barang')
        const [[{ total_inbound }]] = await db.execute('SELECT COALESCE(SUM(jumlah), 0) AS total_inbound FROM inbound')
        const [[{ total_outbound }]] = await db.execute("SELECT COALESCE(SUM(jumlah), 0) AS total_outbound FROM outbound WHERE kategori = 'pengiriman'")
        const [[{ stok_menipis }]] = await db.execute("SELECT COUNT(*) AS stok_menipis FROM barang WHERE stok <= min_stok")

        const today = new Date().toISOString().split('T')[0]
        const [[{ inbound_today }]] = await db.execute('SELECT COALESCE(SUM(jumlah), 0) AS inbound_today FROM inbound WHERE tanggal = ?', [today])
        const [[{ outbound_today }]] = await db.execute("SELECT COALESCE(SUM(jumlah), 0) AS outbound_today FROM outbound WHERE tanggal = ? AND kategori = 'pengiriman'", [today])

        res.json({
            totalBarang: total_barang,
            totalStok: total_stok,
            inboundCount: total_inbound,
            outboundCount: total_outbound,
            inboundToday: inbound_today,
            outboundToday: outbound_today,
            lowStok: stok_menipis
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Server error' })
    }
})

router.get('/summary/chart', authMiddleware, async (req, res) => {
    try {
        const [inbound] = await db.execute(`
            SELECT DATE_FORMAT(tanggal, '%b') AS bulan, SUM(jumlah) AS total
            FROM inbound
            GROUP BY DATE_FORMAT(tanggal, '%Y-%m'), DATE_FORMAT(tanggal, '%b')
            ORDER BY DATE_FORMAT(tanggal, '%Y-%m') ASC
            LIMIT 6
        `)
        const [outbound] = await db.execute(`
            SELECT DATE_FORMAT(tanggal, '%b') AS bulan, SUM(jumlah) AS total
            FROM outbound WHERE kategori = 'pengiriman'
            GROUP BY DATE_FORMAT(tanggal, '%Y-%m'), DATE_FORMAT(tanggal, '%b')
            ORDER BY DATE_FORMAT(tanggal, '%Y-%m') ASC
            LIMIT 6
        `)
        const [kategori] = await db.execute(`
            SELECT kategori, SUM(stok) AS total FROM barang GROUP BY kategori
        `)

        const months = [...new Set([...inbound.map(r => r.bulan), ...outbound.map(r => r.bulan)])]
        const inboundByMonth = months.map(m => inbound.find(r => r.bulan === m)?.total || 0)
        const outboundByMonth = months.map(m => outbound.find(r => r.bulan === m)?.total || 0)

        res.json({
            months,
            inboundByMonth,
            outboundByMonth,
            kategoriLabels: kategori.map(k => k.kategori),
            kategoriValues: kategori.map(k => k.total)
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Server error' })
    }
})

export default router