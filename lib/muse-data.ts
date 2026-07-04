export type Category = 'backbar' | 'utilities' | 'marketing' | 'supplies' | 'personal'

export type LedgerEntry = {
  id: string
  vendor: string
  description: string
  amount: number
  category: Category
  date: string
  resellable: boolean
}

export const CATEGORY_META: Record<
  Category,
  { label: string; tag: string }
> = {
  backbar: { label: 'Backbar', tag: '#backbar' },
  utilities: { label: 'Utilities', tag: '#utilities' },
  marketing: { label: 'Marketing', tag: '#marketing' },
  supplies: { label: 'Supplies', tag: '#supplies' },
  personal: { label: 'Personal (Ali & Kristina)', tag: '#personal' },
}

// Monthly backbar budget for non-resellable pro-use products not tracked in Vagaro.
export const MONTHLY_BACKBAR_BUDGET = 1500

// Seeded partly from the Skin Script Cash Sale CS1061110 ($317.79, 6/26/2026).
export const LEDGER: LedgerEntry[] = [
  {
    id: 'cs1061110',
    vendor: 'Skin Script Rx',
    description: 'Backbar restock — enzymes, masks & treatments',
    amount: 317.79,
    category: 'backbar',
    date: 'Jun 26',
    resellable: false,
  },
  {
    id: 'e-2',
    vendor: 'Cotton & Clay Co.',
    description: 'Cotton rounds, gauze & headbands',
    amount: 45.0,
    category: 'supplies',
    date: 'Jun 24',
    resellable: false,
  },
  {
    id: 'e-3',
    vendor: 'Meta Ads',
    description: 'June retargeting campaign — new client offer',
    amount: 180.0,
    category: 'marketing',
    date: 'Jun 22',
    resellable: false,
  },
  {
    id: 'e-4',
    vendor: 'SRP Energy',
    description: 'Studio electricity — June billing cycle',
    amount: 214.36,
    category: 'utilities',
    date: 'Jun 20',
    resellable: false,
  },
  {
    id: 'e-5',
    vendor: 'GloPro Wax Supply',
    description: 'Hard wax beads & pro-use disposables',
    amount: 132.5,
    category: 'backbar',
    date: 'Jun 17',
    resellable: false,
  },
  {
    id: 'e-6',
    vendor: 'Canva Pro',
    description: 'Design subscription — promo graphics',
    amount: 14.99,
    category: 'marketing',
    date: 'Jun 15',
    resellable: false,
  },
  {
    id: 'e-7',
    vendor: 'Skin Script Rx',
    description: 'Vitamin C serum — professional strength',
    amount: 61.2,
    category: 'backbar',
    date: 'Jun 11',
    resellable: false,
  },
  {
    id: 'e-8',
    vendor: 'City of Chandler',
    description: 'Water & waste — studio suite 28',
    amount: 68.4,
    category: 'utilities',
    date: 'Jun 8',
    resellable: false,
  },
]

export function currency(n: number) {
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  })
}
