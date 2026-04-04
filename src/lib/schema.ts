import { pgTable, text, timestamp, varchar, boolean } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("emailVerified").notNull(),
	image: text("image"),
	createdAt: timestamp("createdAt").notNull(),
	updatedAt: timestamp("updatedAt").notNull()
});

export const session = pgTable("session", {
	id: text("id").primaryKey(),
	expiresAt: timestamp("expiresAt").notNull(),
    token: text("token").notNull().unique(),
	ipAddress: text("ipAddress"),
	userAgent: text("userAgent"),
	userId: text("userId").notNull().references(() => user.id),
    createdAt: timestamp("createdAt"),
    updatedAt: timestamp("updatedAt")
});

export const account = pgTable("account", {
	id: text("id").primaryKey(),
	accountId: text("accountId").notNull(),
	providerId: text("providerId").notNull(),
	userId: text("userId").notNull().references(() => user.id),
	accessToken: text("accessToken"),
	refreshToken: text("refreshToken"),
	idToken: text("idToken"),
	expiresAt: timestamp("expiresAt"),
	password: text("password"),
    createdAt: timestamp("createdAt"),
    updatedAt: timestamp("updatedAt")
});

export const verification = pgTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: timestamp("expiresAt").notNull(),
    createdAt: timestamp("createdAt"),
    updatedAt: timestamp("updatedAt")
});

export const alumni = pgTable("alumni", {
    id: text("id").primaryKey(),
    nama_lulusan: varchar("nama_lulusan", { length: 255 }).notNull(),
    nim: varchar("nim", { length: 50 }).notNull().unique(),
    tahun_masuk: varchar("tahun_masuk", { length: 4 }).notNull(),
    tanggal_lulus: varchar("tanggal_lulus", { length: 50 }).notNull(),
    fakultas: varchar("fakultas", { length: 255 }).notNull(),
    program_studi: varchar("program_studi", { length: 255 }).notNull(),
    linkedin_url: text("linkedin_url"),
    ig_url: text("ig_url"),
    fb_url: text("fb_url"),
    tiktok_url: text("tiktok_url"),
    email: varchar("email", { length: 255 }),
    no_hp: varchar("no_hp", { length: 50 }),
    nama_perusahaan: text("nama_perusahaan"),
    alamat_perusahaan: text("alamat_perusahaan"),
    posisi: varchar("posisi", { length: 255 }),
    kategori_pekerjaan: varchar("kategori_pekerjaan", { length: 50 }),
    sosmed_perusahaan: text("sosmed_perusahaan"),
    status_pelacakan: varchar("status_pelacakan", { length: 50 }).default("Belum Dilacak"),
    createdAt: timestamp("createdAt").defaultNow(),
    updatedAt: timestamp("updatedAt").defaultNow(),
});
