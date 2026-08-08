export type ChileGrade = '1ro' | '2do' | '3ro' | '4to' | '5to' | '6to' | '7mo' | '8vo';

const PLAYABLE_GRADE: ChileGrade = '2do';

export function migrateGrade(raw: string | undefined | null): ChileGrade {
  const g = String(raw ?? '');
  const map: Record<string, ChileGrade> = {
    '5th': '5to', '6th': '6to', '7th': '2do', '8th': '8vo',
    '5to': '5to', '6to': '6to', '7mo': '2do', '8vo': '8vo',
    '1ro': '1ro', '2do': '2do', '3ro': '3ro', '4to': '4to',
  };
  return map[g] ?? PLAYABLE_GRADE;
}
