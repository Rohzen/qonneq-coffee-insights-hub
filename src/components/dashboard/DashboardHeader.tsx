
import React from 'react';
import { LogOut, ShieldCheck, Menu, Download, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export const DashboardHeader = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
      <Link to="/" className="flex items-center">
        <img
          src="/lovable-uploads/898be41c-5d3b-4c22-bd82-7a29cb864aea.png"
          alt="qonneq"
          className="h-12"
        />
      </Link>
      <div className="flex items-center space-x-4 mt-4 md:mt-0">
        {isAdmin && (
          location.pathname.startsWith('/admin') ? (
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => navigate('/dashboard')}
            >
              <LayoutDashboard size={16} />
              Dashboard Utente
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => navigate('/admin')}
            >
              <ShieldCheck size={16} />
              Area Admin
            </Button>
          )
        )}
        {user && (
          <span className="text-sm text-gray-600">
            {user.name || user.email}
          </span>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
              <Download size={16} />
              Esporta dati
            </DropdownMenuItem>
            {isAdmin && (
              location.pathname.startsWith('/admin') ? (
                <DropdownMenuItem
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() => navigate('/dashboard')}
                >
                  <LayoutDashboard size={16} />
                  Dashboard Utente
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() => navigate('/admin')}
                >
                  <ShieldCheck size={16} />
                  Area Admin
                </DropdownMenuItem>
              )
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-700"
              onClick={handleLogout}
            >
              <LogOut size={16} />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
