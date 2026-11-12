# AI Gallery Sites — MVP v0.1

Website statis Android-first: Archive → Detail → Full Artwork Viewer, Summon ×1 gratis, dan My Collection. Tanpa backend, akun, mata uang, rarity, tracking, atau dependensi runtime eksternal. Semua gambar berasal dari ZIP pemilik dan dipertahankan byte-for-byte.

## Membuka dan menjalankan

Website harus disajikan melalui HTTP/HTTPS. Membuka `index.html` langsung dengan `file://` dapat memblokir modul JavaScript dan pengambilan registry. ZIP deploy berisi website siap unggah; ZIP source berisi source, dokumentasi, screenshot, dan tes.

Untuk pengembangan di komputer dengan Python 3:

```sh
python3 -m http.server 8080
```

Jalankan dari folder project, lalu buka `http://localhost:8080`. Dari Android di jaringan yang sama, gunakan alamat IP komputer dan port 8080. Untuk penggunaan smartphone tanpa komputer, unggah isi ZIP deploy ke hosting statis melalui dashboard hosting, lalu buka URL HTTPS-nya. Tidak perlu build di Android.

## Build dan deployment

```sh
python3 build.py
```

Unggah **isi** `dist/` ke direktori situs. File `index.html`, `src/`, `data/`, dan `assets/` harus berada berdampingan. Bisa dipasang di root atau subfolder, misalnya `/gallery/`. Semua path runtime relatif. Hash route seperti `#/character/G-002` tidak memerlukan rewrite server. Gunakan URL dengan trailing slash untuk direktori deployment. HTTPS dianjurkan untuk Web Locks API. Hindari cache permanen untuk HTML, JS, CSS, dan registry yang namanya tidak berversi. Tidak ada service worker atau jaminan penggunaan offline.

Tidak ada publikasi ke hosting produksi dalam paket ini. Ini adalah build portable yang siap dideploy. `.openai/hosting.json` hanya mengarahkan preview lokal ke `dist/`, tanpa identitas situs hosting.

## Struktur

- `index.html`: shell, navigasi, settings/reset dan viewer dialog.
- `src/app.js`: routing, UI, penyimpanan, koordinasi antar-tab, animasi dan gesture viewer.
- `src/state.js`: sanitasi state dan pemilihan summon.
- `src/styles.css`: layout, tema, aksesibilitas dan reduced motion.
- `data/characters.json`: satu registry keyed by stable ID; tidak berisi lore rekaan.
- `assets/characters/G-XXX/`: lima gambar WebP asli + crop project sumber untuk setiap karakter.
- `ASSET-MANIFEST.json`: mapping dari ZIP, dimensi, byte size, dan SHA-256 untuk 54 file.
- `tests/`: tes state, preflight aset, dan fixture layout responsive.
- `screenshots/`: hasil tangkapan browser; state screenshot berbeda sesuai tahap pengujian.
- `TEST-REPORT.md`: hasil tes aktual dan batas verifikasi.
- `build.py`: salinan build statis tanpa npm/dependensi build.

ZIP asli tidak digandakan ke bundle publik. Simpan ZIP asli sebagai arsip terpisah. Crop JSON bukan nama, deskripsi, atau lore karakter. Avatar/Banner disimpan untuk penggunaan masa depan dan tidak digunakan sebagai antarmuka tambahan.

## Registry dan posisi Archive

Featured: **G-002, G-005, G-009**, bisa dilihat dan otomatis dimiliki sejak awal. Collection dimulai pada 3/12 (sejak v0.1.5; 3/11 di v0.1.4, 3/10 di v0.1.3, 3/9 di v0.1.2). Mystery: G-001, G-003, G-004, G-006, G-007, G-008, G-010, G-011, G-012.

Urutan `archiveOrder` dimulai dari 0:

| Baris mobile | Kiri | Kanan |
| --- | --- | --- |
| 1 | G-002 Featured | G-001 mystery |
| 2 | G-005 Featured | G-003 mystery |
| 3 | G-009 Featured | G-004 mystery |
| 4 | G-006 mystery | G-007 mystery |
| 5 | G-008 mystery | G-010 mystery |
| 6 | G-011 mystery | G-012 mystery |

Kartu misteri membuka slot yang sama saat ditemukan. Tidak ada informasi identitas di kartu yang belum terbuka. Ini concealment UI, bukan keamanan aset: registry dan gambar statis dapat diunduh publik.

Edit `data/characters.json` untuk mengganti `displayName` dengan nama yang disetujui. Biarkan ID jika nama belum tersedia. Tag tidak ditampilkan dalam MVP karena data grounded belum diberikan. Jangan mengarang lore. Pertahankan `id`, `featured`, `archiveOrder`, dan mapping path kecuali perubahan produk memang diinginkan. `splash` menggunakan `Final_Original.webp`; `portrait` untuk Detail; `card` untuk grid.

## Menambah karakter baru (G-013 dan seterusnya)

G-010 (v0.1.3), G-011 (v0.1.4), dan G-012 (v0.1.5) ditambahkan sebagai Mystery dengan langkah di bawah. Ulangi dengan ID berikutnya.

1. Tambahkan aset yang disetujui ke `assets/characters/G-XXX/`.
2. Tambahkan key ID baru dengan `id`, `displayName`, `featured`, `archiveOrder` unik di akhir, `tags: []`, dan path `card`, `portrait`, `splash`; avatar/banner opsional.
3. Pertahankan ID lama dan urutannya. Denominator dan pool summon dihitung dari registry; koleksi lama tidak dihapus. Collection tetap dalam discovery order. Tidak perlu mengganti key localStorage.
4. Perbarui manifest, preflight dan tes fixture yang sengaja mengunci jumlah karakter (kini dua belas).
5. Sesuaikan teks editorial yang menyebut “Twelve” (index.html dan src/app.js) dan “3 featured” bila jumlah/Featured berubah. Build ulang dan uji progres lama serta koleksi baru.

## Summon dan penyimpanan

Key: `ai-gallery.state.v1`.

```json
{"schemaVersion":1,"collectedIds":[],"pendingReveal":null}
```

`collectedIds` menyimpan discovery order. Sejak v0.1.2, tiga Featured (G-002, G-005, G-009) otomatis dimiliki sejak awal (sejak v0.1.5 koleksi mulai 3/12) dan tidak pernah keluar dari Summon. Summon hanya memilih merata di antara sembilan mystery yang belum dimiliki, jadi tamat dalam 9 tarikan. `collectedIds` hanya mencatat hasil Summon; daftar milik dihitung oleh `ownedIds()` (Featured dulu, lalu urutan penemuan). Progres lama yang sudah memuat Featured di `collectedIds` tetap valid dan dihitung sekali. Satu hasil ditambahkan dan ditulis sebelum animasi dimulai. `pendingReveal` adalah ID yang telah dimiliki, bukan calon hasil yang bisa di-roll ulang. Refresh menampilkan kembali hasil tersebut. Pending diakui ketika pengguna memilih View Character, Summon Again, atau View Collection; meninggalkan halaman lewat navigasi mempertahankannya untuk pemulihan. Summon Again membuka chamber kembali dan membutuhkan tap Summon ×1 untuk memperoleh karakter berikutnya. Setelah 12/12 tidak ada summon normal lagi.

Animasi menggunakan CSS/SVG, preload satu hasil, tombol Skip segera tersedia, reduced-motion diikuti, dan kegagalan gambar tidak mencabut akuisisi. Viewer menampilkan gambar Original secara contain dengan zoom display 1–4×, bukan upscaling resolusi sumber. Gesture memakai Pointer Events; tombol +/−/Reset adalah fallback keyboard/mouse.

Data dibaca dan disanitasi; ID tak dikenal, duplikat dan pending yang tidak dimiliki dibuang. JSON yang rusak menampilkan pemberitahuan dan menggunakan state yang masih dapat dipulihkan. Tidak ada reset pada update aplikasi. Origin/domain yang berbeda memiliki koleksi berbeda; subfolder pada origin yang sama berbagi key koleksi ini. Tidak ada cloud sync atau pemulihan setelah browser menghapus data.

Web Locks dipakai jika tersedia. Fallback lock bertoken di localStorage bersifat best effort dengan lease 3 detik, pembacaan ulang sebelum tindakan, dan storage-event reconciliation. **localStorage tidak transaksional; tidak ada jaminan atomic lintas tab pada fallback.** Hindari summon simultan di banyak tab. Jika penyimpanan diblokir/penuh, pemberitahuan menjelaskan mode sementara: progres diteruskan dalam memori tab tanpa menjanjikan persistensi setelah refresh.

Scroll posisi tampilan disimpan selama sesi aplikasi berjalan dan dipulihkan saat kembali. Scroll tidak dijanjikan bertahan setelah full reload. Browser Back menutup viewer dahulu, kemudian kembali ke halaman sebelumnya. Direct link ke mystery yang belum dimiliki menyembunyikan konten dan menawarkan Summon.

## Reset

Tekan ikon info di header → Reset Collection → baca peringatan → Yes, reset collection. Keep collection membatalkan. Reset menghapus koleksi dan pending pada browser/origin ini, termasuk di tab lain. Ini satu-satunya kontrol reset progres yang disengaja.

## Pengujian ulang

Dengan Node.js versi modern:

```sh
node --test tests/state.test.js
node --check src/app.js
```

Dengan Python dan Pillow terpasang:

```sh
python3 tests/preflight.py /path/to/Gallery-prototype.zip
```

Tanpa argumen ZIP, preflight memeriksa hash, dimensi, decoding dan JSON file source. Fixture `tests/responsive.html` dapat dibuka melalui server source untuk pemeriksaan layout. Fixture tidak masuk build publik.

Lakukan tes manual di Android: mulai 3/12, buka Featured, sembilan pull semuanya mystery, refresh saat reveal, Skip, lanjut hingga 12/12 (9 pull), periksa urutan dan Archive unlock, uji Back/Forward, pinch dua jari, drag, double-tap, keyboard, reduced motion, kondisi gambar gagal, dan storage tidak tersedia. Lihat TEST-REPORT untuk mana yang sudah benar-benar diuji.
