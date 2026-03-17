
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, UserCog, Mail, Trash2, KeyRound } from "lucide-react";
import { useAuth } from '@/context/AuthContext';
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export const UserManagement = () => {
    const { apiProvider } = useAuth();
    const { toast } = useToast();
    const [users, setUsers] = useState<any[]>([]);
    const [companies, setCompanies] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [editingUser, setEditingUser] = useState<any>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<any>(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newUser, setNewUser] = useState({ name: "", email: "", password: "", companyId: "", role: "portal" });

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [usersResp, compResp] = await Promise.all([
                apiProvider.getUsers(),
                apiProvider.getCustomers()
            ]);

            if (usersResp.success) setUsers(usersResp.data || []);
            if (compResp.success) setCompanies(compResp.data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const resp = await apiProvider.createUser(newUser);
            if (resp.success) {
                toast({ title: "Successo", description: "Utente creato con successo" });
                setIsCreateOpen(false);
                setNewUser({ name: "", email: "", password: "", companyId: "", role: "portal" });
                fetchData();
            } else {
                toast({ title: "Errore", description: resp.error || "Impossibile creare l'utente", variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Errore", description: "Errore di rete", variant: "destructive" });
        }
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;

        try {
            const updateData: any = {
                name: editingUser.name,
                email: editingUser.email,
                role: editingUser.role,
                companyId: editingUser.companyId,
            };
            // Only send password if the admin entered a new one
            if (editingUser.password && editingUser.password.trim()) {
                updateData.password = editingUser.password;
            }
            const resp = await apiProvider.updateUser(editingUser.id, updateData);

            if (resp.success) {
                toast({ title: "Successo", description: "Utente aggiornato con successo" });
                setIsEditOpen(false);
                setEditingUser(null);
                fetchData();
            } else {
                toast({ title: "Errore", description: resp.error || "Impossibile aggiornare l'utente", variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Errore", description: "Errore di rete", variant: "destructive" });
        }
    };

    const handleDeleteUser = async () => {
        if (!userToDelete) return;

        try {
            const resp = await apiProvider.deleteUser(userToDelete.id);
            if (resp.success) {
                toast({ title: "Successo", description: "Utente eliminato" });
                setIsDeleteOpen(false);
                setUserToDelete(null);
                fetchData();
            } else {
                toast({ title: "Errore", description: resp.error || "Impossibile eliminare l'utente", variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Errore", description: "Errore di rete", variant: "destructive" });
        }
    };

    const openEditDialog = (user: any) => {
        setEditingUser({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role || 'portal',
            companyId: user.company_id || (companies.find(c => c.name === user.company)?.id) || '',
            password: '',
        });
        setIsEditOpen(true);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div className="relative w-72">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                        placeholder="Cerca utenti..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="flex items-center gap-2">
                            <Plus size={18} />
                            Nuovo Utente
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Crea Nuovo Utente</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreateUser} className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="u-name">Nome Completo</Label>
                                <Input id="u-name" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="u-email">Email</Label>
                                <Input id="u-email" type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="u-pass">Password</Label>
                                <Input id="u-pass" type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Ruolo</Label>
                                    <Select value={newUser.role} onValueChange={v => setNewUser({ ...newUser, role: v })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleziona ruolo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="portal">Portal User</SelectItem>
                                            <SelectItem value="admin">Administrator</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Azienda</Label>
                                    <Select value={newUser.companyId} onValueChange={v => setNewUser({ ...newUser, companyId: v })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleziona azienda" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {companies.map(c => (
                                                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <Button type="submit" className="w-full">Crea Utente</Button>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Edit Dialog */}
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Modifica Utente</DialogTitle>
                        </DialogHeader>
                        {editingUser && (
                            <form onSubmit={handleUpdateUser} className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="e-name">Nome Completo</Label>
                                    <Input id="e-name" value={editingUser.name} onChange={e => setEditingUser({ ...editingUser, name: e.target.value })} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="e-email">Email</Label>
                                    <Input id="e-email" type="email" value={editingUser.email} onChange={e => setEditingUser({ ...editingUser, email: e.target.value })} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="e-password" className="flex items-center gap-1.5">
                                        <KeyRound size={14} />
                                        Nuova Password
                                    </Label>
                                    <Input
                                        id="e-password"
                                        type="password"
                                        value={editingUser.password}
                                        onChange={e => setEditingUser({ ...editingUser, password: e.target.value })}
                                        placeholder="Lascia vuoto per non modificare"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Ruolo</Label>
                                        <Select value={editingUser.role} onValueChange={v => setEditingUser({ ...editingUser, role: v })}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleziona ruolo" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="portal">Portal User</SelectItem>
                                                <SelectItem value="admin">Administrator</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Azienda</Label>
                                        <Select value={editingUser.companyId} onValueChange={v => setEditingUser({ ...editingUser, companyId: v })}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleziona azienda" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Nessuna</SelectItem>
                                                {companies.map(c => (
                                                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <Button type="submit" className="w-full">Salva Modifiche</Button>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation */}
                <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Conferma Eliminazione</DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                            <p>Sei sicuro di voler eliminare l'utente <strong>{userToDelete?.name}</strong>?</p>
                            <p className="text-sm text-gray-500 mt-2">Questa azione non può essere annullata.</p>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Annulla</Button>
                            <Button variant="destructive" onClick={handleDeleteUser}>Elimina</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Utente</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Ruolo</TableHead>
                                <TableHead>Azienda</TableHead>
                                <TableHead className="text-right">Azioni</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500">Caricamento...</TableCell></TableRow>
                            ) : filteredUsers.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.name}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded text-xs ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                                            {user.role}
                                        </span>
                                    </TableCell>
                                    <TableCell>{user.company || 'N/A'}</TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            title="Modifica"
                                            onClick={() => openEditDialog(user)}
                                        >
                                            <UserCog size={16} className="text-blue-600" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            title="Elimina"
                                            className="text-red-500 hover:text-red-700"
                                            onClick={() => { setUserToDelete(user); setIsDeleteOpen(true); }}
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};
