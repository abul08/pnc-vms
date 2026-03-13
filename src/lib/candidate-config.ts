export interface Candidate {
  id: string; // database column name
  name: string;
  number: number;
}

export interface CandidateCategory {
  title: string;
  candidates: Candidate[];
}

export interface ElectionGroup {
  title: string;
  categories: CandidateCategory[];
}

export const ELECTION_CONFIG: ElectionGroup[] = [
  {
    title: "Local Council",
    categories: [
      {
        title: "President",
        candidates: [
          { id: "nihadh", name: "Nihadh", number: 1 },
          { id: "athif", name: "Athif", number: 2 },
        ],
      },
      {
        title: "Women members",
        candidates: [
          { id: "nasheedha", name: "Nasheedha", number: 3 },
          { id: "nasrath", name: "Nasrath", number: 4 },
          { id: "haniyya", name: "Haniyya", number: 5 },
          { id: "zahiyya", name: "Zahiyya", number: 6 },
          { id: "sarumeela", name: "Sarumeela", number: 7 },
        ],
      },
      {
        title: "Members",
        candidates: [
          { id: "saeed", name: "Saeed", number: 8 },
          { id: "saif", name: "Saif", number: 9 },
          { id: "shiyam", name: "Shiyam", number: 10 },
          { id: "alim", name: "Alim", number: 11 },
        ],
      },
    ],
  },
  {
    title: "WDC",
    categories: [
      {
        title: "President",
        candidates: [
          { id: "yumna", name: "Yumna", number: 1 },
          { id: "fareesha", name: "Fareesha", number: 2 },
        ],
      },
      {
        title: "Members",
        candidates: [
          { id: "najeeba", name: "Najeeba", number: 3 },
          { id: "lamya", name: "Lamya", number: 4 },
          { id: "samrath", name: "Samrath", number: 5 },
          { id: "nuha", name: "Nuha", number: 6 },
          { id: "faathun", name: "Faathun", number: 7 },
          { id: "samaa", name: "Samaa", number: 8 },
          { id: "rasheedha", name: "Rasheedha", number: 9 },
          { id: "raashidha", name: "Raashidha", number: 10 },
        ],
      },
    ],
  },
];

export const ALL_CANDIDATE_IDS = ELECTION_CONFIG.flatMap(g => 
  g.categories.flatMap(c => c.candidates.map(can => can.id))
);
