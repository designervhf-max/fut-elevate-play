import { z } from 'zod';

const positionEnum = z.enum([
  'Goleiro',
  'Fixo',
  'Ala',
  'Pivô',
  'Zagueiro',
  'Meia',
  'Atacante',
]);

const dominantFootEnum = z.enum(['Destro', 'Canhoto', 'Ambos']);
const gameTypeEnum = z.enum(['Futsal', 'Society', 'Campo']);

const nameSchema = z
  .string()
  .trim()
  .min(2, { message: 'Nome deve ter no mínimo 2 caracteres' })
  .max(60, { message: 'Nome deve ter no máximo 60 caracteres' });

const ageSchema = z
  .number({ invalid_type_error: 'Idade inválida' })
  .int('Idade inválida')
  .min(10, { message: 'Idade mínima é 10 anos' })
  .max(99, { message: 'Idade máxima é 99 anos' });

const shirtSchema = z
  .number({ invalid_type_error: 'Número da camisa inválido' })
  .int('Número da camisa inválido')
  .min(1, { message: 'Número da camisa deve ser entre 1 e 99' })
  .max(99, { message: 'Número da camisa deve ser entre 1 e 99' });

const phoneSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/\D/g, ''))
  .pipe(
    z
      .string()
      .min(10, { message: 'Telefone deve ter 10 ou 11 dígitos' })
      .max(11, { message: 'Telefone deve ter 10 ou 11 dígitos' })
  );

const emailSchema = z
  .string()
  .trim()
  .email({ message: 'E-mail inválido' })
  .max(255, { message: 'E-mail muito longo' });

const passwordSchema = z
  .string()
  .min(6, { message: 'Senha deve ter no mínimo 6 caracteres' })
  .max(72, { message: 'Senha deve ter no máximo 72 caracteres' });

export const registerSchema = z
  .object({
    name: nameSchema,
    age: ageSchema,
    position: positionEnum,
    shirtNumber: shirtSchema,
    dominantFoot: dominantFootEnum,
    email: emailSchema,
    phone: phoneSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

export const editProfileSchema = z.object({
  name: nameSchema,
  age: ageSchema,
  position: positionEnum,
  shirtNumber: shirtSchema,
  dominantFoot: dominantFootEnum,
  phone: phoneSchema,
  preferredGameType: gameTypeEnum.optional().or(z.literal('')),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type EditProfileInput = z.infer<typeof editProfileSchema>;
