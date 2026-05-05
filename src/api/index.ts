import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { forecasts } from './database/schema';

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>().basePath('/api');

app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

// Buscar forecast por ano
app.get('/forecast/:year', async (c) => {
  const year = parseInt(c.req.param('year'));
  const db = drizzle(c.env.DB);
  
  const result = await db.select().from(forecasts).where(eq(forecasts.year, year)).get();
  
  if (!result) {
    return c.json({ message: 'Forecast not found' }, 404);
  }
  
  // Assegura que os campos JSON sejam parseados antes de retornar
  return c.json({
    ...result,
    custos: JSON.parse(result.custos || '[]'),
    months: JSON.parse(result.months || '[]')
  });
});

// Salvar ou atualizar forecast
app.post('/forecast', async (c) => {
  const body = await c.req.json();
  const db = drizzle(c.env.DB);
  
  const { year, ...data } = body;
  
  if (!year) {
      return c.json({ success: false, message: 'Year is required' }, 400);
  }

  const existing = await db.select().from(forecasts).where(eq(forecasts.year, year)).get();
  
  const values = {
    year,
    aporteInicial: data.aporteInicial,
    mesAporte: data.mesAporte || 0,
    cpl: data.cpl,
    taxaQualificado: data.taxaQualificado,
    taxaCallAgendada: data.taxaCallAgendada,
    taxaCallRealizada: data.taxaCallRealizada,
    taxaConversao: data.taxaConversao,
    taxaChurn: data.taxaChurn,
    custos: JSON.stringify(data.custos),
    months: JSON.stringify(data.months),
  };

  try {
    if (existing) {
      await db.update(forecasts).set(values).where(eq(forecasts.year, year)).run();
    } else {
      await db.insert(forecasts).values(values).run();
    }
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ success: false, message: e.message }, 500);
  }
});

app.get('/ping', (c) => c.json({ message: 'Pong!', time: new Date().toISOString() }));

export default app;
