import type { ReadingPlan } from "../types/readingPlan";
import type { ReadingPlanProgress } from "../storage/readingPlanProgress";

export type PlanStatus = "nao-iniciado" | "em-andamento" | "concluido";

export interface PlanStatusInfo {
  status: PlanStatus;
  diasConcluidos: number;
  proximoDia: number;
}

export function getPlanStatus(plan: ReadingPlan, progress: ReadingPlanProgress | undefined): PlanStatusInfo {
  const diasConcluidos = progress?.diasConcluidos.length ?? 0;

  if (diasConcluidos === 0) {
    return { status: "nao-iniciado", diasConcluidos: 0, proximoDia: 1 };
  }

  if (diasConcluidos >= plan.duracaoDias) {
    return { status: "concluido", diasConcluidos, proximoDia: plan.duracaoDias };
  }

  const concluidos = new Set(progress?.diasConcluidos ?? []);
  let proximoDia = 1;
  for (let dia = 1; dia <= plan.duracaoDias; dia++) {
    if (!concluidos.has(dia)) {
      proximoDia = dia;
      break;
    }
  }

  return { status: "em-andamento", diasConcluidos, proximoDia };
}
