# Agentlar, vazifalar va avtomatlashtirish (PHASE 12)

Tayyor agentlar, maxsus agentlar, cheklangan vazifa dvigateli va so‘rov orqali avtomatlashtirish.

## Marshrutlar

- `/agents` — katalog: Barchasi, Tayyor, Mening agentlarim, Sevimlilar
- `/agents/create` — maxsus agent
- `/agents/[agentId]` va `/agents/[agentId]/chat` — suhbat, xotira, vazifa
- `/agents/favorites`
- `/tasks`, `/tasks/history`, `/tasks/[id]`
- `/automations`, `/automations/create`
- `/a/[slug]` — ommaviy profil (yo‘riqnoma, xotira, fayl, kalit, suhbat yo‘q)

## Agentlar va vositalar

Katalog (`lib/agents/catalog.ts`): Umumiy, Tadqiqot, Dasturlash, Yozuvchi, O‘qish, Hujjat.

Vositalar: `web_search`, `documents`, `image`, `writing`, `code`, `translation`, `summarizer`.

Bajarish yo‘li (faqat server): autentifikatsiya → egalik yoki tayyor agent → tarif → feature flag → agent vositasi → usage → bajarish → `recordUsage`. Brauzer o‘tkazib yubora olmaydi. Kod **bajarilmaydi**.

`composeAgentSystem` avval `SYSTEM_PROMPT` va platforma xavfsizligini qo‘yadi. Foydalanuvchi yo‘riqnomasi `wrapUntrustedData("USER_AGENT_INSTRUCTIONS")` bilan pastroq turadi. Veb va hujjatlar ham untrusted.

## Vazifa dvigateli

`lib/tasks/engine.ts` — avtonom sikl emas. Aniq qadamlar (tadqiqot: qidiruv → manbalar → xulosa → hisobot). Limitlar rejadan: `maxStepsPerTask`, `maxToolCallsPerTask`, `maxTaskDurationMs`, `tasksPerMonth`.

Holatlar: pending, running, paused, completed, failed, cancelled. Bekor qilish keyingi qadamlarni to‘xtatadi. Qayta urinish yakunlangan qadamlarni o‘tkazadi va usage ni hurmat qiladi.

## Avtomatlashtirish

Once / Daily / Weekly / Custom serverda tekshiriladi. **Cron daemon yo‘q.** Jadval faqat `next_run_at` ni hisoblaydi. Ishga tushirish: «Hozir ishga tushirish» yoki foydalanuvchi so‘rovi.

## Limitlar

Markaziy: `PlanDefinition` maydonlari (`lib/billing/plans.ts` → `agentLimitsFor`).

- FREE: 3 tayyor agent, 0 maxsus, 5 vazifa
- PRO: ko‘proq agent va maxsus
- PRO PLUS: Dasturlash (advanced) va yuqori limit
- PRO MAX: maksimal

## Ma’lumotlar bazasi

`supabase/migrations/009_phase12_agents.sql`

Supabase SQL Editor yoki CLI:

```bash
supabase db push
```

yoki SQL faylni SQL Editor ga joylang. Tartib: 001 … 008, keyin **009**.

RLS: `auth.uid() = user_id` (agents, tasks, automations, agent_messages). `task_steps` vazifa egaligi orqali. Favorites `item_type` ga `agent` qo‘shiladi. `memories.agent_id` ixtiyoriy.

## Xavfsizlik va prompt injection

- Kalitlar brauzerga chiqmaydi
- Sensitive operatsiyalar serverda
- Agent/xotira/loyiha yo‘riqnomasi platforma qoidalarini yengib o‘ta olmaydi
- Ommaviy profil ichki prompt, xotira va suhbatni ochmaydi
- Kuzatuv (`lib/observability/monitor.ts`) matn, hujjat va xotira mazmunini yozmaydi

## Testlar

`npm test` ga Phase 12 fayllari qo‘shilgan. DB bo‘lmasa sof unit testlar.
