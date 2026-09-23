# AI Studio (PHASE 11)

`/studio` — matn, rasm, hujjat, kod, tadqiqot, tarjima, xulosa va ovoz bitta ish joyi.

## Marshrutlar

- `/studio` — dashboard
- `/studio/image` — rasm (mavjud `/api/images`)
- `/studio/documents` — hujjat (mavjud `/api/documents`)
- `/studio/writing` `/studio/code` `/studio/research` `/studio/translate` `/studio/summarize` `/studio/voice`
- `/studio/screenshot` — rasm tahlili (vision model)
- `/studio/history` — `studio_items`

## Backend

- `lib/ai/studio/run.ts` — autentifikatsiya, plan, usage, streaming
- `POST /api/studio/run` — writing/code/research/translate/summarize
- `GET/POST/DELETE /api/studio/items` — tarix (RLS: faqat o‘z qatorlari)
- Chat rasmlari: `images: [{ mime, data }]` — magic-byte tekshiruvi, Fast modelda `VISION_UNSUPPORTED`

## Migratsiya

`supabase/migrations/008_phase11_studio.sql`

Katta fayllar DB da emas, storage da.

## Xavfsizlik

Kod serverda bajarilmaydi. Manbalar faqat qidiruv natijasi. Kalitlar brauzerga chiqmaydi. Plan frontenddan ishonilmaydi.
