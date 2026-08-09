import { RegisterForm } from "@/components/forms/RegisterForm"

export default function RegisterPage() {
    return (
        <div className="min-h-screen bg-muted/40 flex items-center justify-center p-4">
            <div className="w-full">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">Join the Network</h1>
                    <p className="text-muted-foreground mt-2">Create an account to report issues or manage them.</p>
                </div>
                <RegisterForm />
            </div>
        </div>
    )
}
