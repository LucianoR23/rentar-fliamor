import { PageHeader } from '@/components/shared/PageHeader'
import { ExpenseForm } from '@/components/expenses/ExpenseForm'

export default function NewExpensePage() {
  return (
    <div>
      <PageHeader title="Nuevo gasto" description="Registrá un gasto con adjuntos opcionales." backHref="/expenses" />

      <ExpenseForm />
    </div>
  )
}
