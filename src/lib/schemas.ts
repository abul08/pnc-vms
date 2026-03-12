import { z } from "zod";

export const roleEnum = z.enum(["admin", "marker", "manager"]);
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
    sex: z.string().optional().nullable(),
    consit: z.string().optional().nullable(),
    registered_box: z.string().optional().nullable(),
    patch: z.string().optional().nullable(),
    age: z.coerce.number().optional().nullable(),
    national_id: z.string().optional().nullable(),
    present_address: z.string().optional().nullable(),
    contact: z.string().optional().nullable(),
    present_location: z.string().optional().nullable(),
    incharge: z.string().optional().nullable(),
    remarks: z.string().optional().nullable(),
    vote_status: z.boolean().default(false),
    voted_at: z.string().datetime().optional().nullable(),
});
export type Voter = z.infer<typeof voterSchema>;

export const userCreationSchema = z.object({
    username: z.string().min(3),
    password: z.string().min(6),
    full_name: z.string().min(1),
    role: roleEnum,
});
