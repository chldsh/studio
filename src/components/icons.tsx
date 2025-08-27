import type { SVGProps } from "react"
import { Landmark, TrendingUp, Wallet, Settings, CircleDollarSign, Plus, Download, Bot, ChevronLeft, BookOpen } from 'lucide-react';

export const Icons = {
  Logo: (props: SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="M6.34 17.66 4.93 19.07" />
      <path d="M19.07 4.93 17.66 6.34" />
      <path d="M19.07 19.07 17.66 17.66" />
      <path d="M6.34 6.34 4.93 4.93" />
      <circle cx="12" cy="12" r="2" />
      <path d="M12 16a4 4 0 0 1-4-4" />
      <path d="M12 8a4 4 0 0 1 4 4" />
    </svg>
  ),
  Landmark,
  TrendingUp,
  Wallet,
  Settings,
  CircleDollarSign,
  Plus,
  Download,
  Bot,
  ChevronLeft,
  BookOpen,
};
