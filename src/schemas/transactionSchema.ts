/**
 * Schema de validação para Transações
 * Usado com react-hook-form + zod
 */

import { z } from 'zod';

// Enum para tipo de transação
export const TransactionTypeEnum = z.enum(['income', 'expense']);

// Schema base de transação
export const TransactionSchema = z.object({
  desc: z
    .string()
    .min(1, 'A descrição é obrigatória')
    .max(200, 'A descrição deve ter no máximo 200 caracteres')
    .trim(),
  
  amount: z
    .string()
    .min(1, 'O valor é obrigatório')
    .refine(
      (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
      'O valor deve ser maior que zero'
    ),
  
  type: TransactionTypeEnum,
  
  category: z
    .string()
    .min(1, 'A categoria é obrigatória'),
  
  date: z
    .string()
    .min(1, 'A data é obrigatória')
    .refine(
      (val) => !isNaN(Date.parse(val)),
      'Data inválida'
    ),
});

// Schema para criar transação
export const CreateTransactionSchema = TransactionSchema;

// Schema para atualizar transação (parcial)
export const UpdateTransactionSchema = TransactionSchema.partial();

// Tipo inferido
export type TransactionFormData = z.infer<typeof TransactionSchema>;
export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof UpdateTransactionSchema>;

// Validação condicional
export const TransactionWithBudgetCheckSchema = TransactionSchema.refine(
  (data) => {
    if (data.type === 'expense') {
      // Poderia adicionar validação de orçamento aqui
      return true;
    }
    return true;
  },
  {
    message: 'Verifique o orçamento para esta categoria',
    path: ['category'],
  }
);

// Schema para filtro de transações
export const TransactionFilterSchema = z.object({
  search: z.string().optional(),
  type: z.union([TransactionTypeEnum, z.literal('all')]).optional(),
  category: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  minAmount: z.number().optional(),
  maxAmount: z.number().optional(),
});

export type TransactionFilterData = z.infer<typeof TransactionFilterSchema>;

// Mensagens de erro formatadas
export const TRANSACTION_ERROR_MESSAGES = {
  desc_required: 'A descrição é obrigatória',
  desc_too_long: 'A descrição deve ter no máximo 200 caracteres',
  amount_required: 'O valor é obrigatório',
  amount_invalid: 'O valor deve ser maior que zero',
  type_required: 'Selecione o tipo de transação',
  category_required: 'Selecione uma categoria',
  date_required: 'Selecione uma data',
  date_invalid: 'Data inválida',
} as const;
