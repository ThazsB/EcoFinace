import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useAppStore } from '@/stores/appStore'
import { formatCurrency } from '@/utils/currency'
import { PieChart, LineChart } from '../components/charts'
import { TransactionList } from '../components/TransactionList'
import { BudgetSummary } from '../components/BudgetSummary'
import { Transaction } from '@/types'

export default function Dashboard() {
  const { user } = useAuthStore()
  const { data, init, loading } = useAppStore()
  const [currentMonth] = useState(new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' }))

  useEffect(() => {
    if (user) {
      init(user.id)
    }
  }, [user, init])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Calculate stats
  const totalBalance = data.transactions.reduce((sum: number, tx: Transaction) => 
    tx.type === 'income' ? sum + tx.amount : sum - tx.amount, 0
  )

  const monthlyTransactions = data.transactions.filter((tx: Transaction) => {
    const txDate = new Date(tx.date)
    const now = new Date()
    return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear()
  })

  const monthlyIncome = monthlyTransactions
    .filter((tx: Transaction) => tx.type === 'income')
    .reduce((sum: number, tx: Transaction) => sum + tx.amount, 0)

  const monthlyExpense = monthlyTransactions
    .filter((tx: Transaction) => tx.type === 'expense')
    .reduce((sum: number, tx: Transaction) => sum + tx.amount, 0)

  // Prepare data for charts
  const pieChartData = monthlyTransactions
    .filter((tx: Transaction) => tx.type === 'expense')
    .reduce((acc: Record<string, number>, tx: Transaction) => {
      acc[tx.category] = (acc[tx.category] || 0) + tx.amount
      return acc
    }, {} as Record<string, number>)

  const lineChartData = Array.from({ length: 6 }, (_, i) => {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    const monthTransactions = data.transactions.filter((tx: Transaction) => {
      const txDate = new Date(tx.date)
      return txDate.getMonth() === date.getMonth() && txDate.getFullYear() === date.getFullYear()
    })
    const income = monthTransactions.filter((tx: Transaction) => tx.type === 'income').reduce((sum: number, tx: Transaction) => sum + tx.amount, 0)
    const expense = monthTransactions.filter((tx: Transaction) => tx.type === 'expense').reduce((sum: number, tx: Transaction) => sum + tx.amount, 0)
    return {
      month: date.toLocaleString('pt-BR', { month: 'short' }),
      income,
      expense
    }
  }).reverse()

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Olá, {user?.name}</h1>
        <p className="text-muted-foreground">Aqui está o resumo das suas finanças para {currentMonth}.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card p-6 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground">Saldo Total</p>
          <p className="text-3xl font-bold mt-2">{formatCurrency(totalBalance)}</p>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground">Receitas do Mês</p>
          <p className="text-3xl font-bold mt-2 text-green-500">{formatCurrency(monthlyIncome)}</p>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground">Despesas do Mês</p>
          <p className="text-3xl font-bold mt-2 text-orange-500">{formatCurrency(monthlyExpense)}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card p-6 rounded-lg border border-border">
          <h3 className="text-lg font-semibold mb-4">Gastos por Categoria</h3>
          <PieChart data={pieChartData} />
        </div>

        <div className="bg-card p-6 rounded-lg border border-border">
          <h3 className="text-lg font-semibold mb-4">Evolução Mensal</h3>
          <LineChart data={lineChartData} />
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-card p-6 rounded-lg border border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Transações Recentes</h3>
          <button className="text-sm text-primary hover:underline">Ver todas</button>
        </div>
        <TransactionList transactions={data.transactions.slice(0, 5)} />
      </div>

      {/* Budget Summary */}
      {data.budgets.length > 0 && (
        <div className="bg-card p-6 rounded-lg border border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Orçamentos</h3>
            <button className="text-sm text-primary hover:underline">Ver todos</button>
          </div>
          <BudgetSummary budgets={data.budgets} transactions={data.transactions} />
        </div>
      )}
    </div>
  )
}
