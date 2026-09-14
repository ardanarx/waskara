WASKARA — WEBSITE PUBLIK + SUPABASE

Website ini mempertahankan desain versi revisi Indonesia dan menggunakan Supabase sebagai satu-satunya sumber data artikel. Data artikel demo/statis sudah dihapus.

Koneksi Supabase:
1. Buka config.js.
2. Isi SUPABASE_URL dengan URL project Supabase.
3. Isi SUPABASE_KEY dengan Publishable/Anon Key. Jangan gunakan service_role/secret key di website publik.
4. Pastikan tabel public.articles tersedia.
5. Pastikan RLS mengizinkan anon membaca artikel yang statusnya published.

Perilaku artikel:
- Admin membuat artikel di Waskara Admin.
- Jika status = published, artikel otomatis tampil di website publik.
- Jika status = draft, artikel tidak tampil.
- Halaman detail dan pencarian mengambil data langsung dari Supabase.
- Tidak ada daftar artikel demo/static atau riwayat artikel yang disimpan di browser.

File utama:
- index.html — daftar artikel dinamis
- article.html — detail artikel dinamis
- about.html — halaman Tentang
- contact.html — halaman Kontak
- style.css — tampilan
- script.js — navigasi + Supabase + artikel
- config.js — konfigurasi Supabase

Form Kontak menggunakan mailto dan mengarah ke ardanarx@gmail.com.
