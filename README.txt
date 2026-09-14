WASKARA — WEBSITE PUBLIK + SUPABASE

Website ini menggunakan desain Waskara versi revisi dan mengambil artikel langsung dari Supabase.

Yang sudah terhubung:
- Daftar artikel: public.articles, hanya status = published.
- Urutan artikel: terbaru berdasarkan created_at.
- Detail artikel: berdasarkan slug, dengan fallback ke id.
- Isi artikel: field content dari Supabase (HTML dari editor admin).
- Pencarian: mencari judul, excerpt, dan isi artikel dari artikel published.
- Draft tidak ditampilkan di website publik.

KONFIGURASI
1. Buka config.js.
2. Isi SUPABASE_URL dengan URL project Supabase kamu.
3. Isi SUPABASE_KEY dengan Publishable/anon key dari project Supabase.
4. Jangan gunakan service_role/secret key di website publik.
5. Pastikan RLS pada tabel public.articles mengizinkan anon membaca artikel yang status-nya published.

Contoh:
window.WASKARA_CONFIG = {
  SUPABASE_URL: "https://project-kamu.supabase.co",
  SUPABASE_KEY: "publishable-or-anon-key-kamu"
};

DEPLOY
- Upload folder ini ke GitHub lalu hubungkan repository ke Vercel, atau deploy langsung dengan platform hosting kamu.
- Setelah config.js diisi, artikel yang dibuat dari Waskara Admin dan berstatus Published akan muncul di website publik.

KONTAK
Form kontak tetap menggunakan mailto dan mengarah ke ardanarx@gmail.com.

Catatan keamanan:
Publishable/anon key memang boleh berada di frontend selama RLS Supabase dikonfigurasi dengan benar. Jangan pernah menaruh service_role/secret key di file publik.
