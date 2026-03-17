import React from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Footer } from "@/components/Footer";
import { ScrollToTop } from "@/components/ScrollToTop";
import { CredentialsManager } from "@/components/settings/CredentialsManager";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Settings = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900">
            <section className="pt-8 pb-20">
                <div className="container mx-auto px-4">
                    <div className="flex items-center gap-4 mb-8">
                        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <h1 className="text-3xl font-bold tracking-tight">Settings / Configurazione</h1>
                    </div>

                    <div className="space-y-8">
                        <section>
                            <h2 className="text-xl font-semibold mb-4">API Connections</h2>
                            <CredentialsManager />
                        </section>
                    </div>
                </div>
            </section>
            <Footer minimal />
            <ScrollToTop />
        </div>
    );
};

export default Settings;
