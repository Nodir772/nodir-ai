# Loyihalar (Projects)

PHASE 10 loyihalari suhbat, fayl va xotirani bitta joyda ushlab turadi. Jamoa ish maydonlari yo‘q — faqat shaxsiy hisob.

## Migratsiya

Supabase SQL editorida yoki CLI orqali `supabase/migrations/007_phase10.sql` ni ishga tushiring.

Ushbu migratsiya:

- `projects` jadvalini yaratadi (`id`, `user_id`, `name`, `description`, `instructions`, `icon`, `favorite`, vaqt belgilari)
- `conversations`, `documents` (fayllar) va `memories` ga `project_id` qo‘shadi
- `message_feedback` (like/dislike) jadvalini yaratadi
- xabar tahriri uchun `messages` UPDATE RLS siyosatini qo‘shadi
- `favorites.item_type` ga `project` ni ruxsat etadi

RLS har doim `auth.uid() = user_id` (yoki suhbat egasi) bo‘yicha ishlaydi. Mijoz yuborgan `user_id` ishonilmaydi.

## API

Barcha loyiha yo‘llari avval sessiya, keyin egalikni tekshiradi (IDOR yo‘q):

- `GET/POST /api/projects` — ro‘yxat (pagination: `limit`, `offset`) va yaratish
- `GET/PATCH/DELETE /api/projects/[id]` — o‘qish, yangilash, o‘chirish
- `GET /api/projects/[id]/chats`
- `GET /api/projects/[id]/files`
- `GET/POST /api/projects/[id]/memories`
- `POST /api/conversations` `{ "projectId": "..." }` — loyiha ichida suhbat
- `POST /api/documents` `projectId` form maydoni bilan fayl
- `POST /api/feedback` — like/dislike
- `GET /api/workspace/search?q=&filter=all|chats|projects|files`

Boshqa foydalanuvchi loyihasi: `403 FORBIDDEN`. Topilmasa: `404 NOT_FOUND`.

## UI

- `/projects` — ro‘yxat, bo‘sh holat o‘zbekcha
- `/projects/[id]` — sarlavha, yo‘riqnoma, suhbatlar, fayllar, xotira, sozlamalar
- Yon panelda shaxsiy ish maydoni va loyihalar
- Composer: matn, fayl, model (Fast/Balanced/Advanced/Auto), rejim, veb-qidiruv, ovoz, yuborish

## AI kontekst

Loyiha suhbatida server qo‘shadi (cheklangan hajm):

1. Loyiha yo‘riqnomasi
2. Loyiha xotirasi (qidiruv, to‘liq dump emas)
3. Suhbat tarixi
4. Tegishli hujjat bo‘laklari

Manba yoki iqtibos faqat haqiqiy qidiruv/hujjat bo‘lsa ko‘rsatiladi.

## Billing va maxfiylik

PHASE 1–9 o‘zgarishsiz: Free / Pro / Pro Plus / Pro Max, Stripe TEST MODE, PWA, onboarding, admin serverda. API kalitlari brauzerga chiqmaydi.
