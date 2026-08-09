"use client"

import { useState } from "react"
import { LoginForm } from "@/components/forms/LoginForm"
import { DemoCredentials } from "@/components/forms/DemoCredentials"
import Image from "next/image"

export default function LoginPage() {
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [selectedRole, setSelectedRole] = useState(null)

    const handleSelectDemo = (user) => {
        setUsername(user.username)
        setPassword(user.password)
        setSelectedRole(user.role)
    }

    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            {/* Left: Branding / Hero */}
            <div className="hidden lg:flex flex-col justify-center items-center bg-primary/5 relative overflow-hidden p-12">
                <div className="relative z-10 text-center space-y-6 max-w-lg">
                    <div className="inline-block p-4 rounded-full bg-white/10 mb-4 backdrop-blur-sm">
                        <Image
                            src="/raiseit-2-Photoroom.png"
                            alt="RaiseIt Logo"
                            width={150}
                            height={150}
                            className="w-30 h-30 object-contain"
                        />
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
                        RaiseIt
                    </h1>
                    <p className="text-lg text-muted-foreground">
                        A centralized platform for students and authorities to report, track, and resolve campus infrastructure issues efficiently.
                    </p>
                </div>

                {/* Abstract Background Element */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl -z-0 pointer-events-none" />
            </div>

            {/* Right: Login Form */}
            <div className="flex flex-col items-center justify-center p-6 sm:p-12 bg-background">
                <LoginForm
                    username={username}
                    password={password}
                    onUsernameChange={(value) => {
                        setUsername(value)
                        setSelectedRole(null)
                    }}
                    onPasswordChange={(value) => {
                        setPassword(value)
                        setSelectedRole(null)
                    }}
                />
                <DemoCredentials onSelect={handleSelectDemo} selectedRole={selectedRole} />
            </div>
        </div>
    )
}
