import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/card"; // Assuming Input is available or using standard HTML
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/app/components/ui/table";
import { Badge } from "@/app/components/ui/badge";

const AdminConsole: React.FC = () => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Mock data for demonstration - in production this would fetch from StorageAdapter
  const mockUsers = [
    { pi_username: 'user1', wallet: 'G...', reputationScore: 850, level: 12, trustRank: 'A+', balance: 1500, lastActiveAt: '2024-02-02' },
    { pi_username: 'user2', wallet: 'G...', reputationScore: 420, level: 5, trustRank: 'B', balance: 120, lastActiveAt: '2024-02-01' },
  ];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // This password should match process.env.VITE_ADMIN_PASSWORD
    if (password === 'admin123') { 
      setIsAuthenticated(true);
    } else {
      alert('Unauthorized');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
        <Card className="w-96 border-slate-700 bg-slate-800">
          <CardHeader>
            <CardTitle className="text-center">Admin Console Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="password"
                placeholder="Admin Password"
                className="w-full p-2 rounded bg-slate-700 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded transition-colors">
                Enter Console
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 bg-slate-950 min-h-screen text-slate-200">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Console</h1>
        <Badge variant="outline" className="text-green-400 border-green-400">Network: Connected</Badge>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle>Registered Users</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400">Username</TableHead>
                <TableHead className="text-slate-400">Wallet</TableHead>
                <TableHead className="text-slate-400 text-center">Score</TableHead>
                <TableHead className="text-slate-400 text-center">Level</TableHead>
                <TableHead className="text-slate-400 text-center">Rank</TableHead>
                <TableHead className="text-slate-400 text-right">Balance</TableHead>
                <TableHead className="text-slate-400 text-right">Last Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockUsers.map((user) => (
                <TableRow key={user.pi_username} className="border-slate-800 hover:bg-slate-800/50">
                  <TableCell className="font-medium text-blue-400">{user.pi_username}</TableCell>
                  <TableCell className="font-mono text-xs">{user.wallet}</TableCell>
                  <TableCell className="text-center">{user.reputationScore}</TableCell>
                  <TableCell className="text-center">{user.level}</TableCell>
                  <TableCell className="text-center">
                    <Badge className={user.trustRank.startsWith('A') ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}>
                      {user.trustRank}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">{user.balance} π</TableCell>
                  <TableCell className="text-right text-slate-500">{user.lastActiveAt}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-slate-900 border-slate-800 p-6">
          <h3 className="text-slate-400 text-sm mb-2">Total Users</h3>
          <p className="text-3xl font-bold">{mockUsers.length}</p>
        </Card>
        <Card className="bg-slate-900 border-slate-800 p-6">
          <h3 className="text-slate-400 text-sm mb-2">Network Status</h3>
          <p className="text-3xl font-bold text-blue-400">Mainnet</p>
        </Card>
        <Card className="bg-slate-900 border-slate-800 p-6">
          <h3 className="text-slate-400 text-sm mb-2">Protocol Health</h3>
          <p className="text-3xl font-bold text-green-400">Optimal</p>
        </Card>
      </div>
    </div>
  );
};

export default AdminConsole;
