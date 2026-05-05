import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const forecasts = sqliteTable('forecasts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  year: integer('year').notNull().unique(),
  aporteInicial: text('aporte_inicial').notNull(),
  mesAporte: integer('mes_aporte').notNull().default(0),
  cpl: text('cpl').notNull(),
  taxaQualificado: text('taxa_qualificado').notNull(),
  taxaCallAgendada: text('taxa_call_agendada').notNull(),
  taxaCallRealizada: text('taxa_call_realizada').notNull(),
  taxaConversao: text('taxa_conversao').notNull(),
  taxaChurn: text('taxa_churn').notNull(),
  // Armazenamos custos e dados mensais como JSON para flexibilidade no SQLite
  custos: text('custos').notNull(), // JSON array of CostItem
  months: text('months').notNull(), // JSON array of MonthInput
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$onUpdate(() => new Date()),
});
