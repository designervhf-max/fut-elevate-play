import { z } from 'zod';

export const peladaSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: 'Nome deve ter no mínimo 2 caracteres' })
    .max(60, { message: 'Nome deve ter no máximo 60 caracteres' }),
  weekday: z
    .string()
    .min(1, { message: 'Selecione o dia da semana' })
    .refine((v) => {
      const n = parseInt(v);
      return !isNaN(n) && n >= 0 && n <= 6;
    }, { message: 'Dia inválido' }),
  time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, { message: 'Informe um horário válido' }),
  location: z
    .string()
    .trim()
    .min(2, { message: 'Informe o local' })
    .max(120, { message: 'Local deve ter no máximo 120 caracteres' }),
  gameType: z.enum(['Futsal', 'Society', 'Campo'], {
    errorMap: () => ({ message: 'Selecione o tipo de jogo' }),
  }),
  maxPlayers: z
    .number({ invalid_type_error: 'Informe o número de jogadores' })
    .int('Número inválido')
    .min(2, { message: 'Número de jogadores deve ser entre 2 e 30' })
    .max(30, { message: 'Número de jogadores deve ser entre 2 e 30' }),
  pricePerGame: z
    .union([
      z.literal(''),
      z
        .number({ invalid_type_error: 'Valor inválido' })
        .min(0, { message: 'Valor não pode ser negativo' })
        .max(10000, { message: 'Valor muito alto' }),
    ])
    .optional(),
});

export type PeladaInput = z.infer<typeof peladaSchema>;
