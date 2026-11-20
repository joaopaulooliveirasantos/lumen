import type { PlanStatusInfo } from "../services/readingPlans";
import type { ReadingPlan } from "../types/readingPlan";
import { Icon } from "./Icon";

type Props = {
  plan: ReadingPlan;
  size: "carrossel" | "lista" | "compacto";
  statusInfo?: PlanStatusInfo;
  onPress: () => void;
};

function progressLabel(status: PlanStatusInfo, duration: number): string | null {
  if (status.status === "concluido") return "Concluído ✓";
  if (status.status === "em-andamento") return `${status.diasConcluidos}/${duration} dias`;
  return null;
}

/** Cartão de plano de leitura nos três formatos do RN: carrossel (capa grande), lista e compacto. */
export function ReadingPlanCard({ plan, size, statusInfo, onPress }: Props) {
  const label = `${plan.titulo}, ${plan.duracaoDias} dias`;

  if (size === "carrossel") {
    const badge = statusInfo ? progressLabel(statusInfo, plan.duracaoDias) : null;
    return (
      <button type="button" class="plan-carousel" aria-label={label} onClick={onPress}>
        {/* Mesmo tamanho do ícone da lista "Todos os planos" (48×48). */}
        <img src={plan.capa.imagem} alt="" width={48} height={48} loading="lazy" style={{ backgroundColor: plan.capa.corBase }} />
        <span class="plan-carousel-title">{plan.titulo}</span>
        <span class={badge ? "plan-carousel-days plan-carousel-progress" : "plan-carousel-days"}>{badge ?? `${plan.duracaoDias} dias`}</span>
      </button>
    );
  }

  if (size === "compacto") {
    return (
      <button type="button" class="plan-compact" aria-label={label} onClick={onPress}>
        <img src={plan.capa.imagem} alt="" width={36} height={36} loading="lazy" style={{ backgroundColor: plan.capa.corBase }} />
        <span class="plan-compact-title">{plan.titulo}</span>
      </button>
    );
  }

  const status =
    statusInfo?.status === "concluido"
      ? "Concluído ✓"
      : statusInfo?.status === "em-andamento"
        ? `${statusInfo.diasConcluidos}/${plan.duracaoDias} dias · continuar no Dia ${statusInfo.proximoDia}`
        : null;
  return (
    <button type="button" class="list-row plan-row" aria-label={label} onClick={onPress}>
      <img src={plan.capa.imagem} alt="" width={48} height={48} loading="lazy" style={{ backgroundColor: plan.capa.corBase }} />
      <span class="list-row-body">
        <span class="list-row-title">{plan.titulo}</span>
        <span class="list-row-subtitle">
          {plan.subtitulo} · {plan.duracaoDias} dias
        </span>
        {status ? <span class="plan-row-status">{status}</span> : null}
      </span>
      <Icon name="chevronRight" size={18} class="list-row-chevron" />
    </button>
  );
}
