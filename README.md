# Tracker.io: Expense Tracker

Aplikasi web untuk mencatat uang masuk dan uang keluar, memantau saldo, dan mencari riwayat transaksi. Dibuat dengan HTML, CSS, dan JavaScript murni tanpa library eksternal, sebagai proyek akhir kelas **Front-End Web Pemula** di Dicoding.

**Coba langsung:** https://fil.github.io/expense-tracker/

## Fitur

- Mencatat transaksi dengan keterangan, nominal, tanggal, dan klasifikasi (pemasukan atau pengeluaran)
- Validasi form: keterangan tidak boleh kosong dan nominal minimal Rp 1
- Dasbor otomatis: saldo, total pemasukan, dan total pengeluaran diperbarui setiap data berubah
- Edit transaksi: form terisi otomatis dengan data yang dipilih, lalu kembali ke mode tambah setelah disimpan
- Hapus transaksi
- Ubah tipe: pindahkan transaksi antara daftar pemasukan dan pengeluaran dengan satu klik
- Pencarian langsung berdasarkan judul transaksi, dan seluruh daftar muncul kembali saat kolom dikosongkan
- Data tersimpan di `localStorage`, jadi tidak hilang saat halaman dimuat ulang
- Tampilan responsif untuk desktop, tablet, dan ponsel

## Teknologi

- HTML5 semantik
- CSS3 dengan penamaan class BEM
- JavaScript (ES6+) tanpa framework atau library
- Web Storage API (`localStorage`)

## Sorotan teknis

- **Manipulasi DOM murni.** Setiap kartu transaksi dibuat dengan `document.createElement()`, tanpa `innerHTML +=`, sehingga event listener pada tombol tetap terjaga.
- **Pembaruan tampilan lewat Custom Event.** Setiap perubahan data (tambah, edit, hapus, ubah tipe) mengirim sinyal `transaction:updated` melalui `dispatchEvent()`. Satu listener menangani pembaruan daftar transaksi dan dasbor sekaligus.
- **Satu sumber data.** Seluruh transaksi disimpan dalam satu array. Daftar, dasbor, dan pencarian selalu dihitung ulang dari array tersebut.

## Desain

Tampilan mengusung konsep **nota warung**: daftar transaksi dibuat seperti gulungan struk kasir dengan tepi bergerigi, garis putus-putus, dan ikon berbentuk cap stempel. Angka memakai font monospace agar terasa seperti hasil cetak printer kasir.

## Struktur proyek

```
expense-tracker/
├── index.html   # Struktur halaman
├── style.css    # Tampilan visual
├── main.js      # Logika aplikasi
└── README.md
```

## Menjalankan secara lokal

Proyek ini adalah situs statis, jadi tidak perlu instalasi apa pun.

1. Unduh atau *clone* repository ini:
   ```bash
   git clone https://github.com/fil/expense-tracker.git
   ```
2. Buka folder proyek, lalu buka `index.html` di browser.
   Atau gunakan ekstensi **Live Server** di VS Code: klik kanan `index.html`, lalu pilih **Open with Live Server**.

## Pembuat

Dibuat oleh **fil** ([@fil](https://github.com/fil)).

Proyek ini berawal dari starter project kelas Front-End Web Pemula di [Dicoding](https://www.dicoding.com). Logika JavaScript dan penyesuaian tampilan dikembangkan lebih lanjut untuk portofolio.
