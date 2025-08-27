'use client';

import React, { useState, useMemo, useRef } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import Image from 'next/image';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { 
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { cn } from '@/lib/utils';
import { Icons } from '@/components/icons';
import type { Budget, Expense, OptimizedBudget, BillExplanation, JournalEntry, SavingsTransaction } from '@/types';
import { suggestOptimizedBudget } from '@/ai/flows/suggest-optimized-budget';
import { explainBill } from '@/ai/flows/explain-bill-flow';
import { CalendarIcon, FileText, Loader2, LogOut, Pencil, PiggyBank, Trash2, Upload, User, X } from 'lucide-react';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const initialBudgets: Budget[] = [
  { id: '1', category: 'Groceries', amount: 500 },
  { id: '2', category: 'Transport', amount: 150 },
  { id: '3', category: 'Entertainment', amount: 200 },
  { id: '4', category: 'Utilities', amount: 250 },
];

const initialExpenses: Expense[] = [
  { id: '1', category: 'Groceries', amount: 75.5, date: new Date(2024, 5, 3) },
  { id: '2', category: 'Transport', amount: 22, date: new Date(2024, 5, 5) },
  { id: '3', category: 'Entertainment', amount: 45, date: new Date(2024, 5, 7) },
  { id: '4', category: 'Groceries', amount: 120.3, date: new Date(2024, 5, 10) },
  { id: '5', category: 'Utilities', amount: 180, date: new Date(2024, 5, 12) },
];

const initialJournalEntries: JournalEntry[] = [
    { id: '1', title: '2024 Financial Goals', content: '1. Save $5,000 for an emergency fund.\n2. Pay off credit card debt.\n3. Invest in a low-cost index fund.', date: new Date(2024, 0, 1) },
    { id: '2', title: 'Thoughts on Subscription Services', content: 'Reviewed all my monthly subscriptions. Canceled two that I barely use. Savings: $30/month.', date: new Date(2024, 4, 20) },
];

const initialSavingsTransactions: SavingsTransaction[] = [
    { id: '1', amount: 1000, date: new Date(2024, 4, 1), type: 'deposit' },
]

const budgetSchema = z.object({
    category: z.string().min(2, { message: "Category must be at least 2 characters." }),
    amount: z.coerce.number().positive({ message: "Amount must be a positive number." }),
});

const expenseSchema = z.object({
    category: z.string({ required_error: "Please select a category." }),
    amount: z.coerce.number().positive({ message: "Amount must be a positive number." }),
    date: z.date({ required_error: "A date is required." }),
});

const journalSchema = z.object({
    title: z.string().min(3, { message: "Title must be at least 3 characters." }),
    content: z.string().min(10, { message: "Content must be at least 10 characters." }),
});

const savingsSchema = z.object({
    amount: z.coerce.number().positive({ message: "Amount must be a positive number." }),
});


export default function DashboardPage() {
  const [budgets, setBudgets] = useState<Budget[]>(initialBudgets);
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(initialJournalEntries);
  const [savingsHistory, setSavingsHistory] = useState<SavingsTransaction[]>(initialSavingsTransactions);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{optimizedBudgets: OptimizedBudget[], summary: string} | null>(null);
  const [billFile, setBillFile] = useState<File | null>(null);
  const [billPreview, setBillPreview] = useState<string | null>(null);
  const [billExplanation, setBillExplanation] = useState<BillExplanation | null>(null);
  const [isBillLoading, setIsBillLoading] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();

  const budgetForm = useForm<z.infer<typeof budgetSchema>>({
    resolver: zodResolver(budgetSchema),
    defaultValues: { category: "", amount: 0 },
  });

  const expenseForm = useForm<z.infer<typeof expenseSchema>>({
    resolver: zodResolver(expenseSchema),
  });

  const journalForm = useForm<z.infer<typeof journalSchema>>({
    resolver: zodResolver(journalSchema),
    defaultValues: { title: "", content: "" },
  });

  const savingsForm = useForm<z.infer<typeof savingsSchema>>({
    resolver: zodResolver(savingsSchema),
    defaultValues: { amount: 0 },
  });

  const { totalBudget, totalSpent, spendingByCategory } = useMemo(() => {
    const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
    const spendingByCategory = budgets.map(budget => {
      const spent = expenses
        .filter(e => e.category === budget.category)
        .reduce((sum, e) => sum + e.amount, 0);
      return {
        ...budget,
        spent,
        progress: budget.amount > 0 ? (spent / budget.amount) * 100 : 0,
      };
    });
    return { totalBudget, totalSpent, spendingByCategory };
  }, [budgets, expenses]);
  
  const pieChartData = useMemo(() => {
    return spendingByCategory
    .filter(item => item.spent > 0)
    .map(item => ({
      name: item.category,
      value: item.spent
    }))
  }, [spendingByCategory]);

  const totalSavings = useMemo(() => {
    return savingsHistory.reduce((sum, t) => sum + t.amount, 0);
  }, [savingsHistory]);
  
  const PIE_CHART_COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
  ];

  function handleAddBudget(values: z.infer<typeof budgetSchema>) {
    setBudgets([...budgets, { id: crypto.randomUUID(), ...values }]);
    toast({ title: "Budget Added", description: `Category "${values.category}" added.` });
    budgetForm.reset();
  }

  function handleAddExpense(values: z.infer<typeof expenseSchema>) {
    setExpenses([...expenses, { id: crypto.randomUUID(), ...values }]);
    toast({ title: "Expense Added", description: `${values.amount} for ${values.category} logged.` });
    expenseForm.reset();
  }
  
  function deleteExpense(id: string) {
    setExpenses(expenses.filter(e => e.id !== id));
    toast({ title: "Expense Deleted", variant: "destructive" });
  }

  function handleAddJournalEntry(values: z.infer<typeof journalSchema>) {
    const newEntry = { id: crypto.randomUUID(), ...values, date: new Date() };
    setJournalEntries([newEntry, ...journalEntries]);
    toast({ title: "Journal Entry Added" });
    journalForm.reset();
  }

  function deleteJournalEntry(id: string) {
    setJournalEntries(journalEntries.filter(entry => entry.id !== id));
    toast({ title: "Journal Entry Deleted", variant: "destructive" });
  }

  function handleDeposit(values: z.infer<typeof savingsSchema>) {
    const newDeposit: SavingsTransaction = {
        id: crypto.randomUUID(),
        amount: values.amount,
        date: new Date(),
        type: 'deposit',
    };
    setSavingsHistory(prev => [newDeposit, ...prev]);
    toast({ title: "Deposit Successful", description: `$${values.amount.toFixed(2)} added to your savings.` });
    savingsForm.reset();
  }

  function handleAddInterest() {
      const interestAmount = totalSavings * 0.05;
      const newInterest: SavingsTransaction = {
        id: crypto.randomUUID(),
        amount: interestAmount,
        date: new Date(),
        type: 'interest',
      };
      setSavingsHistory(prev => [newInterest, ...prev]);
      toast({ title: "Interest Added", description: `You earned $${interestAmount.toFixed(2)} in interest!` });
  }


  const handleGetAiSuggestion = async (rules: string) => {
    setIsAiLoading(true);
    setAiSuggestion(null);
    try {
      const pastSpendingData = JSON.stringify(expenses.map(e => ({category: e.category, amount: e.amount})));
      const result = await suggestOptimizedBudget({ pastSpendingData, advancedBudgetingRules: rules });
      const parsedBudgets = JSON.parse(result.optimizedBudgets);
      setAiSuggestion({
        optimizedBudgets: parsedBudgets,
        summary: result.summary,
      });
    } catch (error) {
      console.error("AI suggestion error:", error);
      toast({
        title: "AI Error",
        description: "Could not get suggestions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleExport = () => {
    const headers = "Date,Category,Amount";
    const rows = expenses.map(e => `${e.date.toLocaleDateString()},${e.category},${e.amount}`).join("\n");
    const csvContent = `data:text/csv;charset=utf-8,${headers}\n${rows}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "mybillpal_expenses.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Export Successful", description: "Your expense data has been downloaded." });
  };

  const handleBillFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        setBillFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setBillPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
        setBillExplanation(null);
    }
  };

  const handleScanBill = async () => {
    if (!billFile || !billPreview) {
        toast({ title: "No file selected", description: "Please select a bill image to scan.", variant: "destructive" });
        return;
    }
    setIsBillLoading(true);
    setBillExplanation(null);
    try {
        const result = await explainBill({ billDataUri: billPreview });
        setBillExplanation(result);
        
        // Automatically add the scanned bill as an expense
        if (result.category && result.totalAmount) {
          const newExpense = {
            id: crypto.randomUUID(),
            category: result.category,
            amount: result.totalAmount,
            date: new Date(),
          };
          setExpenses(prev => [...prev, newExpense]);
          // Check if category exists in budget, if not add it.
          if (!budgets.find(b => b.category === result.category)) {
            const newBudget = {
              id: crypto.randomUUID(),
              category: result.category,
              amount: 0, // Set a default of 0, user can adjust
            };
            setBudgets(prev => [...prev, newBudget]);
            toast({ title: "New Category Added", description: `"${result.category}" was added to your budgets. Please set an amount.` });
          }
           toast({ title: "Expense Logged", description: `Scanned bill for ${result.vendor} of $${result.totalAmount.toFixed(2)} added to your expenses.` });
        }


    } catch (error) {
        console.error("Bill scanning error:", error);
        toast({ title: "Scanning Error", description: "Could not analyze the bill. Please try another image.", variant: "destructive" });
    } finally {
        setIsBillLoading(false);
    }
  };

  const clearBill = () => {
    setBillFile(null);
    setBillPreview(null);
    setBillExplanation(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  }


  return (
    <div className="min-h-screen w-full bg-background font-sans">
      <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
        <div className="hidden border-r bg-card lg:block">
          <div className="flex h-full max-h-screen flex-col gap-2">
            <div className="flex h-[60px] items-center border-b px-6">
              <a href="/" className="flex items-center gap-2 font-semibold">
                <Icons.Logo className="h-6 w-6 text-primary" />
                <span className="">myBill.Pal</span>
              </a>
            </div>
            <div className="flex-1 overflow-auto py-2">
            </div>
          </div>
        </div>
        <div className="flex flex-col">
          <header className="flex h-14 items-center gap-4 border-b bg-card px-6 lg:h-[60px]">
             <a href="/" className="flex items-center gap-2 font-semibold lg:hidden">
                <Icons.Logo className="h-6 w-6 text-primary" />
                <span>myBill.Pal</span>
              </a>
            <div className="flex-1">
                {/* Mobile Nav Trigger could go here */}
            </div>
            <Button onClick={handleExport} variant="outline" size="sm">
                <Icons.Download className="mr-2 h-4 w-4" /> Export Data
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src="#" alt="User Avatar" />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">User</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      user@example.com
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Personal Information</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <FileText className="mr-2 h-4 w-4" />
                  <span>Documents & Statements</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>
          <main className="flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
            <Tabs defaultValue="dashboard">
              <TabsList className="grid w-full grid-cols-4 sm:grid-cols-7 h-auto">
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                <TabsTrigger value="budgets">Budgets</TabsTrigger>
                <TabsTrigger value="expenses">Expenses</TabsTrigger>
                <TabsTrigger value="savings">Savings</TabsTrigger>
                <TabsTrigger value="journal">Journal</TabsTrigger>
                <TabsTrigger value="ai">AI Assistant</TabsTrigger>
                <TabsTrigger value="scan">Scan Bill</TabsTrigger>
              </TabsList>
              
              <TabsContent value="dashboard" className="mt-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
                      <Icons.Landmark className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">${totalBudget.toFixed(2)}</div>
                      <p className="text-xs text-muted-foreground">Your total monthly budget</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                      <Icons.CircleDollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">${totalSpent.toFixed(2)}</div>
                      <p className="text-xs text-muted-foreground">Total spending this month</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Remaining</CardTitle>
                      <Icons.Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold ${totalBudget - totalSpent < 0 ? 'text-destructive' : 'text-primary'}`}>
                        ${(totalBudget - totalSpent).toFixed(2)}
                      </div>
                      <p className="text-xs text-muted-foreground">Amount left to spend</p>
                    </CardContent>
                  </Card>
                   <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
                      <PiggyBank className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-primary">${totalSavings.toFixed(2)}</div>
                       <p className="text-xs text-muted-foreground">Your current savings balance</p>
                    </CardContent>
                  </Card>
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                  <Card className="lg:col-span-4">
                    <CardHeader>
                      <CardTitle>Budget vs. Actual</CardTitle>
                      <CardDescription>Track your spending against your budget for each category.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {spendingByCategory.map(b => (
                        <div key={b.id}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium">{b.category}</span>
                            <span className="text-muted-foreground">
                              ${b.spent.toFixed(2)} / ${b.amount.toFixed(2)}
                            </span>
                          </div>
                          <Progress value={b.progress} className="h-2" />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                  <Card className="lg:col-span-3">
                    <CardHeader>
                      <CardTitle>Spending by Category</CardTitle>
                      <CardDescription>A breakdown of your expenses.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Tooltip
                            contentStyle={{
                                background: "hsl(var(--background))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "var(--radius)",
                            }}
                          />
                          <Pie data={pieChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                            {pieChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="budgets" className="mt-6">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Manage Budgets</CardTitle>
                        <CardDescription>Set and adjust your monthly spending categories.</CardDescription>
                      </div>
                       <Dialog>
                          <DialogTrigger asChild>
                              <Button><Icons.Plus className="mr-2 h-4 w-4"/> Add Budget</Button>
                          </DialogTrigger>
                          <DialogContent>
                              <DialogHeader>
                                  <DialogTitle>Add a New Budget Category</DialogTitle>
                                  <DialogDescription>
                                      Define a new category and set a monthly budget for it.
                                  </DialogDescription>
                              </DialogHeader>
                              <Form {...budgetForm}>
                                  <form onSubmit={budgetForm.handleSubmit(handleAddBudget)} className="space-y-4">
                                      <FormField control={budgetForm.control} name="category" render={({ field }) => (
                                          <FormItem>
                                              <FormLabel>Category Name</FormLabel>
                                              <FormControl>
                                                  <Input placeholder="e.g., Shopping" {...field} />
                                              </FormControl>
                                              <FormMessage />
                                          </FormItem>
                                      )} />
                                      <FormField control={budgetForm.control} name="amount" render={({ field }) => (
                                          <FormItem>
                                              <FormLabel>Monthly Budget Amount</FormLabel>
                                              <FormControl>
                                                  <Input type="number" placeholder="e.g., 300" {...field} />
                                              </FormControl>
                                              <FormMessage />
                                          </FormItem>
                                      )} />
                                      <DialogFooter>
                                        <DialogClose asChild>
                                            <Button type="submit">Add Budget</Button>
                                        </DialogClose>
                                      </DialogFooter>
                                  </form>
                              </Form>
                          </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Category</TableHead>
                          <TableHead className="text-right">Budget Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {budgets.map(b => (
                          <TableRow key={b.id}>
                            <TableCell className="font-medium">{b.category}</TableCell>
                            <TableCell className="text-right">${b.amount.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="expenses" className="mt-6">
                 <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle>Log Expenses</CardTitle>
                                <CardDescription>Keep a record of all your transactions.</CardDescription>
                            </div>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button><Icons.Plus className="mr-2 h-4 w-4"/> Log Expense</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Log a New Expense</DialogTitle>
                                    </DialogHeader>
                                    <Form {...expenseForm}>
                                        <form onSubmit={expenseForm.handleSubmit(handleAddExpense)} className="space-y-4">
                                            <FormField control={expenseForm.control} name="category" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Category</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select a category" />
                                                        </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {budgets.map(b => <SelectItem key={b.id} value={b.category}>{b.category}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={expenseForm.control} name="amount" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Amount</FormLabel>
                                                    <FormControl><Input type="number" placeholder="$50.00" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={expenseForm.control} name="date" render={({ field }) => (
                                                <FormItem className="flex flex-col">
                                                    <FormLabel>Date</FormLabel>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                            variant={"outline"}
                                                            className={cn("w-[240px] pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                                            >
                                                            {field.value ? (
                                                                format(field.value, "PPP")
                                                            ) : (
                                                                <span>Pick a date</span>
                                                            )}
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={field.value}
                                                            onSelect={field.onChange}
                                                            disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                                                            initialFocus
                                                        />
                                                        </PopoverContent>
                                                    </Popover>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <DialogFooter>
                                                <DialogClose asChild>
                                                    <Button type="submit">Log Expense</Button>
                                                </DialogClose>
                                            </DialogFooter>
                                        </form>
                                    </Form>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="w-[50px]">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {expenses.sort((a,b) => b.date.getTime() - a.date.getTime()).map(e => (
                                <TableRow key={e.id}>
                                    <TableCell>{e.date.toLocaleDateString()}</TableCell>
                                    <TableCell className="font-medium">{e.category}</TableCell>
                                    <TableCell className="text-right">${e.amount.toFixed(2)}</TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" onClick={() => deleteExpense(e.id)}>
                                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="savings" className="mt-6">
                <div className="grid gap-6 lg:grid-cols-2">
                    <div className="space-y-6">
                        <Card>
                             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle>Savings Balance</CardTitle>
                                <PiggyBank className="h-6 w-6 text-primary" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-4xl font-bold">${totalSavings.toFixed(2)}</p>
                                <p className="text-muted-foreground">Your total saved amount.</p>
                            </CardContent>
                             <CardFooter>
                                <Button onClick={handleAddInterest} disabled={totalSavings <= 0}>
                                    <Icons.TrendingUp className="mr-2 h-4 w-4" />
                                    Calculate & Add 5% Monthly Interest
                                </Button>
                            </CardFooter>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Make a Deposit</CardTitle>
                                <CardDescription>Add money to your savings account.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Form {...savingsForm}>
                                    <form onSubmit={savingsForm.handleSubmit(handleDeposit)} className="space-y-4">
                                        <FormField control={savingsForm.control} name="amount" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Amount to Deposit</FormLabel>
                                                <FormControl>
                                                    <Input type="number" placeholder="e.g., 100" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <Button type="submit">Deposit</Button>
                                    </form>
                                </Form>
                            </CardContent>
                        </Card>
                    </div>
                    <Card>
                        <CardHeader>
                            <CardTitle>Savings History</CardTitle>
                            <CardDescription>Your history of deposits and interest earned.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {savingsHistory.sort((a,b) => b.date.getTime() - a.date.getTime()).map(t => (
                                        <TableRow key={t.id}>
                                            <TableCell>{t.date.toLocaleDateString()}</TableCell>
                                            <TableCell className="font-medium capitalize">{t.type}</TableCell>
                                            <TableCell className={`text-right font-semibold ${t.type === 'interest' ? 'text-primary' : ''}`}>
                                                ${t.amount.toFixed(2)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="journal" className="mt-6">
                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle>New Journal Entry</CardTitle>
                                <CardDescription>Add a new note, thought, or goal.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Form {...journalForm}>
                                    <form onSubmit={journalForm.handleSubmit(handleAddJournalEntry)} className="space-y-4">
                                        <FormField control={journalForm.control} name="title" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Title</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="My financial goal" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={journalForm.control} name="content" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Content</FormLabel>
                                                <FormControl>
                                                    <Textarea placeholder="Today I decided to..." {...field} rows={5} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <Button type="submit">Save Entry</Button>
                                    </form>
                                </Form>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Your Journal</CardTitle>
                                <CardDescription>Your collection of notes and entries.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {selectedEntry ? (
                                    <div>
                                        <Button variant="ghost" onClick={() => setSelectedEntry(null)} className="mb-4 pl-0">
                                            <Icons.ChevronLeft className="mr-2 h-4 w-4" /> Back to list
                                        </Button>
                                        <h3 className="text-xl font-semibold">{selectedEntry.title}</h3>
                                        <p className="text-sm text-muted-foreground mb-4">{format(selectedEntry.date, "PPP")}</p>
                                        <p className="whitespace-pre-wrap text-sm">{selectedEntry.content}</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {journalEntries.sort((a,b) => b.date.getTime() - a.date.getTime()).map(entry => (
                                            <div key={entry.id} className="flex items-start justify-between">
                                                <div className="flex-1 cursor-pointer" onClick={() => setSelectedEntry(entry)}>
                                                    <p className="font-medium">{entry.title}</p>
                                                    <p className="text-sm text-muted-foreground">{format(entry.date, "PPP")}</p>
                                                </div>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This action cannot be undone. This will permanently delete this journal entry.
                                                        </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => deleteJournalEntry(entry.id)}>Delete</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        ))}
                                         {journalEntries.length === 0 && (
                                            <p className="text-center text-muted-foreground py-8">No journal entries yet.</p>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
              </TabsContent>

              <TabsContent value="ai" className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Icons.Bot className="text-primary"/> AI Budget Assistant</CardTitle>
                        <CardDescription>Get AI-powered suggestions to optimize your budget based on your spending habits.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                const rules = formData.get('rules') as string;
                                handleGetAiSuggestion(rules);
                            }}>
                            <div className="space-y-2">
                                <Label htmlFor="ai-rules">Advanced Budgeting Rules (Optional)</Label>
                                <Textarea id="ai-rules" name="rules" placeholder="e.g., 'Prioritize saving 15% of total budget.' or 'Reduce entertainment spending by 20%.'" />
                                <p className="text-sm text-muted-foreground">Provide specific goals or constraints for the AI.</p>
                            </div>
                             <Button type="submit" className="mt-4" disabled={isAiLoading}>
                                {isAiLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</> : "Get Suggestions"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
                {aiSuggestion && (
                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle>AI Recommendations</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <h3 className="font-semibold mb-2">Optimized Budget Plan</h3>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Category</TableHead>
                                            <TableHead className="text-right">Suggested Budget</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {aiSuggestion.optimizedBudgets.map(b => (
                                            <TableRow key={b.category}>
                                                <TableCell>{b.category}</TableCell>
                                                <TableCell className="text-right">{b.suggestedBudget}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                             <div>
                                <h3 className="font-semibold mb-2">Summary & Tips</h3>
                                <p className="text-sm text-foreground/80 whitespace-pre-wrap">{aiSuggestion.summary}</p>
                            </div>
                        </CardContent>
                    </Card>
                )}
              </TabsContent>
              <TabsContent value="scan" className="mt-6">
                <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Scan a Bill</CardTitle>
                            <CardDescription>Upload an image of a bill to automatically log it as an expense and get insights.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Input
                                id="bill-upload"
                                type="file"
                                accept="image/*,.pdf"
                                onChange={handleBillFileChange}
                                className="hidden"
                                ref={fileInputRef}
                            />
                            {billPreview ? (
                                <div className="relative group">
                                    <Image src={billPreview} alt="Bill preview" width={400} height={400} className="rounded-md object-contain w-full h-auto max-h-[300px]" />
                                    <Button variant="destructive" size="icon" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100" onClick={clearBill}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <label
                                    htmlFor="bill-upload"
                                    className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted"
                                >
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
                                        <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                        <p className="text-xs text-muted-foreground">PNG, JPG, or PDF</p>
                                    </div>
                                </label>
                            )}

                            <Button onClick={handleScanBill} disabled={isBillLoading || !billFile} className="w-full">
                                {isBillLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Scanning...</> : "Scan Bill & Log Expense"}
                            </Button>
                        </CardContent>
                    </Card>
                    
                    { (isBillLoading || billExplanation) &&
                    <Card>
                        <CardHeader>
                            <CardTitle>Bill Analysis</CardTitle>
                            <CardDescription>Here is what the AI found in your bill.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isBillLoading ? (
                                <div className="space-y-4">
                                    <div className="flex items-center space-x-4">
                                        <div className="space-y-2">
                                            <div className="h-4 bg-muted rounded w-[250px]"></div>
                                            <div className="h-4 bg-muted rounded w-[200px]"></div>
                                        </div>
                                    </div>
                                    <div className="h-8 bg-muted rounded w-full"></div>
                                    <div className="space-y-2">
                                        <div className="h-4 bg-muted rounded w-full"></div>
                                        <div className="h-4 bg-muted rounded w-[90%]"></div>
                                        <div className="h-4 bg-muted rounded w-[80%]"></div>
                                    </div>
                                </div>
                            ) : billExplanation && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <p className="text-muted-foreground">Vendor</p>
                                            <p className="font-semibold">{billExplanation.vendor}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Amount</p>
                                            <p className="font-semibold">${billExplanation.totalAmount.toFixed(2)}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Category</p>
                                            <p className="font-semibold">{billExplanation.category}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-2">Spoken Explanation</h3>
                                        <p className="text-sm text-foreground/80 italic mb-2">"{billExplanation.explanation}"</p>
                                        <audio controls src={billExplanation.audioDataUri} className="w-full">
                                            Your browser does not support the audio element.
                                        </audio>
                                    </div>
                                     <div>
                                        <h3 className="font-semibold mb-2">Budgeting Tips</h3>
                                        <p className="text-sm text-foreground/80 whitespace-pre-wrap">{billExplanation.suggestions}</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    }
                </div>
              </TabsContent>

            </Tabs>
          </main>
        </div>
      </div>
    </div>
  );
}
