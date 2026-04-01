import { z } from "zod";

export const roleEnum = z.enum(["admin", "marker", "manager", "observer", "candi", "spectator"]);
export type Role = z.infer<typeof roleEnum>;

export const assignmentTypeEnum = z.enum(["marker", "manager"]);
export type AssignmentType = z.infer<typeof assignmentTypeEnum>;

export const profileSchema = z.object({
    id: z.string().uuid(),
    full_name: z.string().min(1, "Full name is required").nullable(),
    role: roleEnum,
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
});
export type Profile = z.infer<typeof profileSchema>;

export const voterSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1, "Name is required"),
    house_name: z.string().optional().nullable(),
    house_number: z.string().optional().nullable(),
    listq: z.string().optional().nullable(),
    mdp: z.string().optional().nullable(),
    registered_box: z.string().optional().nullable(),
    patch: z.string().optional().nullable(),
    national_id: z.string().optional().nullable(),
    present_location: z.string().optional().nullable(),
    contact: z.string().optional().nullable(),
    vote_status: z.boolean().default(false),
    voted_at: z.string().datetime().optional().nullable(),
    nihadh: z.coerce.number().default(0),
    athif: z.coerce.number().default(0),
    nasheedha: z.coerce.number().default(0),
    nasrath: z.coerce.number().default(0),
    haniyya: z.coerce.number().default(0),
    zahiyya: z.coerce.number().default(0),
    sarumeela: z.coerce.number().default(0),
    saeed: z.coerce.number().default(0),
    saif: z.coerce.number().default(0),
    shiyam: z.coerce.number().default(0),
    alim: z.coerce.number().default(0),
    yumna: z.coerce.number().default(0),
    fareesha: z.coerce.number().default(0),
    najeeba: z.coerce.number().default(0),
    lamya: z.coerce.number().default(0),
    samrath: z.coerce.number().default(0),
    nuha: z.coerce.number().default(0),
    faathun: z.coerce.number().default(0),
    samaa: z.coerce.number().default(0),
    rasheedha: z.coerce.number().default(0),
    raashidha: z.coerce.number().default(0),
});
export type Voter = z.infer<typeof voterSchema>;

export const userCreationSchema = z.object({
    username: z.string().min(3),
    password: z.string().min(6),
    full_name: z.string().min(1),
    role: roleEnum,
});
