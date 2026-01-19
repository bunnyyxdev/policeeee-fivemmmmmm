/**
 * Police Rank/Position definitions for police department system
 */

export interface PoliceRankOption {
  value: string;
  label: string;
  description: string;
}

export const POLICE_RANKS: PoliceRankOption[] = [
  {
    value: '10',
    label: 'ผู้บัญชาการตำรวจ',
    description: 'Police Commissioner',
  },
  {
    value: '09',
    label: 'รองผู้บัญชาการตำรวจ',
    description: 'Deputy Police Commissioner',
  },
  {
    value: '08',
    label: 'ผู้ช่วยผู้บัญชาการตำรวจ',
    description: 'Assistant Police Commissioner',
  },
  {
    value: '07',
    label: 'หัวหน้าตำรวจ',
    description: 'Police Chief',
  },
  {
    value: '06',
    label: 'รองหัวหน้าตำรวจ',
    description: 'Deputy Police Chief',
  },
  {
    value: '05',
    label: 'เลขานุการตำรวจ',
    description: 'Police Secretary',
  },
  {
    value: '04',
    label: 'ตำรวจชำนาญ',
    description: 'Expert Police Officer / Specialist',
  },
  {
    value: '03',
    label: 'ตำรวจปี 3',
    description: 'Police Officer Year 3',
  },
  {
    value: '02',
    label: 'ตำรวจปี 2',
    description: 'Police Officer Year 2',
  },
  {
    value: '01',
    label: 'ตำรวจปี 1',
    description: 'Police Officer Year 1',
  },
  {
    value: '00',
    label: 'นักเรียนตำรวจ',
    description: 'Police Cadet',
  },
];

/**
 * Get police rank label by value
 */
export function getPoliceRankLabel(value: string | undefined | null): string {
  if (!value) return '-';
  const rank = POLICE_RANKS.find((r) => r.value === value);
  return rank ? rank.label : value;
}

/**
 * Get police rank description by value
 */
export function getPoliceRankDescription(value: string | undefined | null): string {
  if (!value) return '';
  const rank = POLICE_RANKS.find((r) => r.value === value);
  return rank ? rank.description : '';
}
