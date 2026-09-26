"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteExpense } from "./actions";

const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

type Expense = { id: string; description: string; amount: number };

export function ExpenseList({ expenses }: { expenses: Expense[] }) {
  const [isPending, startTransition] = useTransition();

  return (
    <ul className="mt-4 divide-y divide-black/5">
      {expenses.map((expense) => (
        <li key={expense.id} className="flex items-center justify-between py-3 text-sm">
          <span className="font-medium text-text-primary">{expense.description}</span>
          <div className="flex items-center gap-3">
            <span className="font-bold text-error">₹{inr.format(expense.amount)}</span>
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                if (!confirm(`Delete expense "${expense.description}"?`)) return;
                startTransition(() => deleteExpense(expense.id));
              }}
              className="text-gray-300 hover:text-error"
              aria-label="Delete expense"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
