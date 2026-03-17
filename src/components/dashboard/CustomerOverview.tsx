
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CustomerData } from '@/types/dashboard';
import { Coffee, Package, Users, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CustomerOverviewProps {
  customers: CustomerData[];
  totalMachines: number;
  totalAccessories: number;
  activeCustomers: number;
  onSelectCustomer: (customer: CustomerData) => void;
  onViewMachines: () => void;
}

export const CustomerOverview: React.FC<CustomerOverviewProps> = ({ 
  customers, 
  totalMachines,
  totalAccessories,
  activeCustomers,
  onSelectCustomer,
  onViewMachines 
}) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={onViewMachines}>
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Totale Macchine</p>
              <h3 className="text-2xl font-bold">{totalMachines}</h3>
              <p className="text-xs text-gray-600 mt-1">In tutta la rete clienti</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Coffee className="h-6 w-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Totale Accessori</p>
              <h3 className="text-2xl font-bold">{totalAccessories}</h3>
              <p className="text-xs text-gray-600 mt-1">Macinacaffè, filtri, ecc.</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Clienti attivi</p>
              <h3 className="text-2xl font-bold">{activeCustomers}</h3>
              <p className="text-xs text-gray-600 mt-1">Su {customers.length} totali</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Manutenzioni</p>
              <h3 className="text-2xl font-bold">7</h3>
              <p className="text-xs text-amber-600 mt-1">Previste questo mese</p>
            </div>
            <div className="p-3 bg-amber-100 rounded-lg">
              <Calendar className="h-6 w-6 text-amber-600" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">I Tuoi Clienti</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Città</TableHead>
                <TableHead>Contratto</TableHead>
                <TableHead>Macchine</TableHead>
                <TableHead>Accessori</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead>Ultimo contatto</TableHead>
                <TableHead>Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id} className={!customer.active ? "opacity-70" : ""}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>{customer.city}</TableCell>
                  <TableCell>{customer.contract}</TableCell>
                  <TableCell>{customer.machinesCount}</TableCell>
                  <TableCell>{customer.accessoriesCount}</TableCell>
                  <TableCell>
                    {customer.active ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Attivo
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        Inattivo
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{customer.lastContact}</TableCell>
                  <TableCell>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => onSelectCustomer(customer)}
                      className="text-qonneq hover:text-white hover:bg-qonneq"
                    >
                      Gestisci
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
