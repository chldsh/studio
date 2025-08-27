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
      <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
      <path d="M18 9h-2a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2" />
      <path d="M8 12h.01" />
      <path d="M12 12h.01" />
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
