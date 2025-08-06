import { AuthWrapper } from "@/components/auth-wrapper";
import { Header } from "@/components/header";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthWrapper>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 bg-background">
          {children}
        </main>
      </div>
    </AuthWrapper>
  );
} 