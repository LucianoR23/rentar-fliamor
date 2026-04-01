import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { ExpenseForm } from '@/components/expenses/ExpenseForm'

export default function NewExpensePage() {
  return (
    <div>
      <PageHeader title="Nuevo gasto" description="Registrá un gasto con adjuntos opcionales.">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/expenses">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
        </Button>
      </PageHeader>

      <ExpenseForm />
    </div>
  )
}
