import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Welcome to MediaForge AI</h1>
          <p className="text-muted-foreground mt-2">
            Sign in to access your AI-powered media creation studio
          </p>
        </div>
        <div className="flex justify-center">
          <SignIn 
            appearance={{
              elements: {
                rootBox: "w-full max-w-md",
                card: "bg-card border border-border shadow-lg w-full",
                headerTitle: "text-foreground",
                headerSubtitle: "text-muted-foreground",
                formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground",
                formFieldInput: "bg-background border border-input text-foreground",
                formFieldLabel: "text-foreground",
                footerActionLink: "text-primary hover:text-primary/90",
                dividerLine: "bg-border",
                dividerText: "text-muted-foreground",
                socialButtonsBlockButton: "bg-background border border-input text-foreground hover:bg-muted",
                formFieldLabelRow: "text-foreground",
                formFieldInputShowPasswordButton: "text-muted-foreground hover:text-foreground",
                formFieldInputShowPasswordIcon: "text-muted-foreground",
                formFieldInputShowPasswordIconContainer: "text-muted-foreground",
                formFieldInputShowPasswordButton__showPassword: "text-foreground",
                formFieldInputShowPasswordButton__hidePassword: "text-foreground",
                formFieldInputShowPasswordIcon__showPassword: "text-foreground",
                formFieldInputShowPasswordIcon__hidePassword: "text-foreground",
                formFieldInputShowPasswordIconContainer__showPassword: "text-foreground",
                formFieldInputShowPasswordIconContainer__hidePassword: "text-foreground"
              }
            }}
          />
        </div>
      </div>
    </div>
  );
} 