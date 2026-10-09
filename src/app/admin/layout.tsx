import { AuthWrapper } from "@/components/auth-wrapper";
import { Header } from "@/components/header";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthWrapper>
      <div className="w-screen max-w-none !overflow-x-hidden min-h-screen flex flex-col m-0 p-0">
        <div className="w-screen max-w-none m-0 p-0 flex-shrink-0">
          <Header />
        </div>
        <main className="flex-1 bg-background w-screen max-w-none !overflow-x-hidden m-0 p-0">
          {children}
        </main>
      </div>
    </AuthWrapper>
  );
} 