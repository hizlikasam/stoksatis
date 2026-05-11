import { AdminLayoutClient } from "./admin-layout-client";

export const metadata = {
    title: "HızlıKasam - SaaS Admin Paneli",
};

export default function AdminRootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
