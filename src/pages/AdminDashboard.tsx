
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, Coffee, ShieldCheck, Settings2 } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Footer } from "@/components/Footer";
import { CustomerManagement } from "@/components/admin/CustomerManagement";
import { UserManagement } from "@/components/admin/UserManagement";
import { MachineManagement } from "@/components/admin/MachineManagement";
import { ApiConfigurationManager } from "@/components/admin/ApiConfigurationManager";

const AdminDashboard = () => {
    return (
        <div className="min-h-screen bg-gray-50">
            <section className="pt-8 pb-20">
                <div className="container mx-auto px-4">
                    <DashboardHeader />

                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                            <ShieldCheck className="text-blue-600" />
                            Amministrazione Sistema
                        </h1>
                        <p className="text-gray-600">Gestisci clienti, utenti e configurazioni di sistema.</p>
                    </div>

                    <Tabs defaultValue="customers" className="space-y-6">
                        <TabsList className="grid w-full grid-cols-4 lg:w-[800px]">
                            <TabsTrigger value="customers" className="flex items-center gap-2">
                                <Building2 size={16} />
                                Clienti
                            </TabsTrigger>
                            <TabsTrigger value="users" className="flex items-center gap-2">
                                <Users size={16} />
                                Utenti
                            </TabsTrigger>
                            <TabsTrigger value="machines" className="flex items-center gap-2">
                                <Coffee size={16} />
                                Macchine
                            </TabsTrigger>
                            <TabsTrigger value="api-config" className="flex items-center gap-2">
                                <Settings2 size={16} />
                                Configurazioni API
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="customers">
                            <CustomerManagement />
                        </TabsContent>

                        <TabsContent value="users">
                            <UserManagement />
                        </TabsContent>

                        <TabsContent value="machines">
                            <MachineManagement />
                        </TabsContent>

                        <TabsContent value="api-config">
                            <ApiConfigurationManager />
                        </TabsContent>
                    </Tabs>
                </div>
            </section>
            <Footer minimal />
        </div>
    );
};

export default AdminDashboard;
