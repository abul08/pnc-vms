import LoginForm from "@/components/LoginForm";
import { Vote } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function LoginPage() {
    return (
        <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center p-4">
            <Card className="w-full max-w-sm shadow-md">
                <CardHeader className="items-center text-center pb-2">
                    <CardTitle className="text-2xl">Sign in</CardTitle>
                </CardHeader>
                <CardContent>
                    <LoginForm />
                </CardContent>
            </Card>
        </div>
    );
}
