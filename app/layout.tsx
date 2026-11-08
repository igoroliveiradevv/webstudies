import "./globals.css";
import type { Metadata, Viewport } from "next";
export const metadata: Metadata = { title: "Ritmo PAS — sua rotina, sua aprovação", description: "Organize matérias, acompanhe seu tempo e treine com simulados do PAS/UnB.", manifest: "/manifest.json", appleWebApp: { capable: true, statusBarStyle: "default", title: "Ritmo PAS" } };
export const viewport: Viewport = { themeColor: "#10131b", width: "device-width", initialScale: 1 };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="pt-BR"><body>{children}</body></html>; }
