# Referral Components

This folder contains all reusable components for the referral system.

## Component Structure

```
referral/
├── ReferralStats.tsx      # Stats cards showing earnings, referrals, bonus %
├── ReferralLink.tsx       # Referral link display with copy functionality
├── HowItWorks.tsx         # Educational section explaining the referral process
├── BonusHistory.tsx       # Table/list of referral bonuses received
├── DownlineList.tsx       # List of referred users (downline)
└── index.ts               # Barrel export for easy imports
```

## Usage

### Import Individual Components
```tsx
import ReferralStats from '@/components/referral/ReferralStats';
import ReferralLink from '@/components/referral/ReferralLink';
```

### Import All Components
```tsx
import { 
  ReferralStats, 
  ReferralLink, 
  HowItWorks,
  BonusHistory,
  DownlineList 
} from '@/components/referral';
```

## Component Props

### ReferralStats
```tsx
interface ReferralStatsProps {
  referralEarnings: number;     // Total USD earned from referrals
  totalReferrals: number;       // Total number of referrals
  activeReferrals: number;      // Number of active trading referrals
  bonusPercent: number;         // Bonus percentage (e.g., 10)
}
```

### ReferralLink
```tsx
interface ReferralLinkProps {
  referralUrl: string;          // Full referral URL
  bonusPercent: number;         // Bonus percentage for description
}
```

### HowItWorks
```tsx
interface HowItWorksProps {
  bonusPercent: number;         // Bonus percentage for instructions
}
```

### BonusHistory
```tsx
interface BonusHistoryProps {
  bonuses: Array<{
    id: string;
    referee: { name: string; email: string } | null;
    bonusAmount: number;
    bonusPercent: number;
    basedOnAmount: number;
    level: number;              // Referral level (1, 2, or 3)
    createdAt: string;
  }>;
}
```

### DownlineList
```tsx
interface DownlineListProps {
  downline: Array<{
    id: string;
    name: string;
    email: string;
    joinedAt: string;
    isTradingActive: boolean;
    referralEarnings: number;
    totalReferrals: number;
  }>;
}
```

## Design Principles

1. **Component Separation**: Each section is a separate component for maintainability
2. **Type Safety**: All components use TypeScript interfaces
3. **Animations**: Uses Framer Motion for smooth transitions
4. **Responsive**: Mobile-first design with responsive layouts
5. **Accessibility**: Semantic HTML and ARIA labels where needed
6. **Icons**: Uses `react-icons/lu` (Lucide) for consistent iconography

## Future Enhancements

- [ ] Add pagination to BonusHistory
- [ ] Add filtering/sorting to DownlineList
- [ ] Add social sharing buttons to ReferralLink
- [ ] Add QR code generation for referral link
- [ ] Add detailed analytics dashboard
