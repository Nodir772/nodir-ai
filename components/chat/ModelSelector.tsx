"use client";

import { Check, ChevronDown, Sparkles } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { AI_MODELS, type AiModelId } from "@/lib/ai/models";
import { AUTO_MODEL_ID, type ModelSelectionId } from "@/lib/ai/auto-model";
import { cn } from "@/lib/utils";
import { useBilling } from "@/components/billing/useBilling";
import { canUseModel } from "@/lib/billing/access";
import { getPlan, requiredPlanForModel } from "@/lib/billing/plans";
import { openUpgradeModal } from "@/components/billing/UpgradeModal";

export function ModelSelector({
  value,
  onChange,
  usedModelId,
}: {
  value: ModelSelectionId;
  onChange: (id: ModelSelectionId) => void;
  usedModelId?: AiModelId;
}) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const { data } = useBilling();
  const plan = data?.plan ?? "free";
  const selected =
    value === AUTO_MODEL_ID
      ? null
      : AI_MODELS.find((model) => model.id === value) ?? AI_MODELS[1];
  const used = usedModelId ? AI_MODELS.find((model) => model.id === usedModelId) : null;

  useEffect(() => {
    function onClick() {
      setOpen(false);
    }
    if (open) document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [open]);

  return (
    <div className="relative" onClick={(event) => event.stopPropagation()}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-9 items-center gap-2 rounded-full border border-border bg-card px-3 text-xs font-medium sm:text-sm"
      >
        {value === AUTO_MODEL_ID ? (
          <>
            <Sparkles size={14} className="text-accent" />
            <span className="hidden sm:inline">Auto{used ? ` · ${used.name}` : ""}</span>
            <span className="sm:hidden">Auto</span>
          </>
        ) : (
          <>
            <span className="hidden sm:inline">{selected?.productName} — {selected?.name}</span>
            <span className="sm:hidden">{selected?.name}</span>
          </>
        )}
        <ChevronDown size={14} />
      </button>
      {open ? (
        <ul
          id={menuId}
          role="listbox"
          className="absolute right-0 z-30 mt-2 w-64 rounded-2xl border border-border bg-card p-1 shadow-2xl"
        >
          <li>
            <button
              type="button"
              role="option"
              aria-selected={value === AUTO_MODEL_ID}
              onClick={() => {
                onChange(AUTO_MODEL_ID);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-start gap-2 rounded-xl px-3 py-2 text-left hover:bg-surface-2",
                value === AUTO_MODEL_ID && "bg-surface-2",
              )}
            >
              <span className="mt-0.5 w-4 text-accent">
                {value === AUTO_MODEL_ID ? <Check size={14} /> : <Sparkles size={14} />}
              </span>
              <span>
                <span className="block text-sm font-medium">Auto</span>
                <span className="mt-0.5 block text-xs text-muted">
                  Server Fast / Balanced / Advanced dan tanlaydi
                  {used ? ` · hozir: ${used.name}` : ""}
                </span>
              </span>
            </button>
          </li>
          {AI_MODELS.map((model) => {
            const allowed = canUseModel(plan, model.id);
            return (
            <li key={model.id}>
              <button
                type="button"
                role="option"
                aria-selected={model.id === value}
                onClick={() => {
                  if (!allowed) {
                    openUpgradeModal({
                      currentPlan: plan,
                      requiredPlan: requiredPlanForModel(model.id),
                      feature: "model",
                      error: `${model.name} modeli ${getPlan(requiredPlanForModel(model.id)).name} rejasida mavjud.`,
                    });
                    setOpen(false);
                    return;
                  }
                  onChange(model.id);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-start gap-2 rounded-xl px-3 py-2 text-left hover:bg-surface-2",
                  model.id === value && "bg-surface-2",
                  !allowed && "opacity-70",
                )}
              >
                <span className="mt-0.5 w-4 text-accent">
                  {model.id === value ? <Check size={14} /> : null}
                </span>
                <span>
                  <span className="block text-sm font-medium">
                    {model.productName} — {model.name}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">
                    {allowed ? model.description : `${getPlan(requiredPlanForModel(model.id)).name} kerak`}
                  </span>
                </span>
              </button>
            </li>
            );
          })}
          <li className="px-3 py-2 text-[11px] leading-4 text-muted">
            Faqat sozlangan Fast / Balanced / Advanced ishlatiladi. Yangi model nomlari yaratilmaydi.
          </li>
        </ul>
      ) : null}
    </div>
  );
}
