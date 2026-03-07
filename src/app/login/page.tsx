import LoginForm from "@/components/LoginForm";
import { Vote } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function LoginPage() {
    return (
        <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center p-4">
            <Card className="w-full max-w-sm shadow-md">
                <CardHeader className="items-center text-center pb-2">
                    <div className="p-3 bg-primary/10 text-primary rounded-full mb-2">
                        <Vote className="h-7 w-7" />
                    </div>
                    <CardTitle className="text-2xl">Sign in to VMS</CardTitle>
                    <CardDescription>Election Day Voter Management System</CardDescription>
                </CardHeader>
                <CardContent>
                    <LoginForm />
                </CardContent>
            </Card>
        </div>
    );
}
