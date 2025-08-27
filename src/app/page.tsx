'use client';

import React, { useState, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
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
import { useToast } from "@/hooks/use-toast"
import { cn } from '@/lib/utils';
import { Icons } from '@/components/icons';
import type { Budget, Expense, OptimizedBudget } from '@/types';
import { suggestOptimizedBudget } from '@/ai/flows/suggest-optimized-budget';
import { CalendarIcon, Loader2, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

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

const budgetSchema = z.object({
    category: z.string().min(2, { message: "Category must be at least 2 characters." }),
    amount: z.coerce.number().positive({ message: "Amount must be a positive number." }),
});

const expenseSchema = z.object({
    category: z.string({ required_error: "Please select a category." }),
    amount: z.coerce.number().positive({ message: "Amount must be a positive number." }),
    date: z.date({ required_error: "A date is required." }),
});


export default function DashboardPage() {
  const [budgets, setBudgets] = useState<Budget[]>(initialBudgets);
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{optimizedBudgets: OptimizedBudget[], summary: string} | null>(null);
  const { toast } = useToast();

  const budgetForm = useForm<z.infer<typeof budgetSchema>>({
    resolver: zodResolver(budgetSchema),
    defaultValues: { category: "", amount: 0 },
  });

  const expenseForm = useForm<z.infer<typeof expenseSchema>>({
    resolver: zodResolver(expenseSchema),
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
    link.setAttribute("download", "transmitter_expenses.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Export Successful", description: "Your expense data has been downloaded." });
  };

  return (
    <div className="min-h-screen w-full bg-background font-sans">
      <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
        <div className="hidden border-r bg-card lg:block">
          <div className="flex h-full max-h-screen flex-col gap-2">
            <div className="flex h-[60px] items-center border-b px-6">
              <a href="/" className="flex items-center gap-2 font-semibold">
                <Icons.Logo className="h-6 w-6 text-primary" />
                <span className="">TRANSMITTER</span>
              </a>
            </div>
            <div className="flex-1 overflow-auto py-2">
              <p className="px-6 text-xs text-muted-foreground">BY LINDO.SHOOT</p>
              <p className="px-6 text-xs text-muted-foreground">UNDER THE PEEKARDO COLLECTIVES PTY LTD</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col">
          <header className="flex h-14 items-center gap-4 border-b bg-card px-6 lg:h-[60px]">
             <a href="/" className="flex items-center gap-2 font-semibold lg:hidden">
                <Icons.Logo className="h-6 w-6 text-primary" />
                <span>TRANSMITTER</span>
              </a>
            <div className="flex-1">
                {/* Mobile Nav Trigger could go here */}
            </div>
            <Button onClick={handleExport} variant="outline" size="sm">
                <Icons.Download className="mr-2 h-4 w-4" /> Export Data
            </Button>
          </header>
          <main className="flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
            <Tabs defaultValue="dashboard">
              <TabsList>
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                <TabsTrigger value="budgets">Budgets</TabsTrigger>
                <TabsTrigger value="expenses">Expenses</TabsTrigger>
                <TabsTrigger value="ai">AI Assistant</TabsTrigger>
              </TabsList>
              
              <TabsContent value="dashboard" className="mt-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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

            </Tabs>
          </main>
        </div>
      </div>
    </div>
  );
}
