import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../ui/table";
import { Badge } from "../ui/badge";

const AdminConsole: React.FC = () => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const mockUsers = [
    { pi_username: 'user1', wallet: 'GD...7M3O', reputationScore: 850, level: 12, trustRank: 'Elite', balance: 1500, lastActiveAt: '2024-02-02' },
    { pi_username: 'user2', wallet: 'GB...X8Y2', reputationScore: 420, level: 5, trustRank: 'Trusted', balance: 120, lastActiveAt: '2024-02-01' },
  ];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') { 
      setIsAuthenticated(true);
    } else {
      alert('Unauthorized');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0A0B0F] text-white font-sans">
        <Card className="w-96 border-white/10 bg-[#15171E] shadow-2xl">
          <CardHeader>
            <CardTitle className="text-center text-purple-400 uppercase tracking-widest text-sm font-black">Admin Access</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="password"
                placeholder="Enter Admin Password"
                className="w-full p-3 rounded-xl bg-black/40 border border-white/10 focus:border-purple-500/50 outline-none transition-all text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 text-white font-bold py-3 rounded-xl transition-all uppercase tracking-wider text-[10px]">
                Unlock Console
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 bg-[#0A0B0F] min-h-screen text-slate-200 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">Admin Console</h1>
          <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em]">Reputa Score Protocol Management</p>
        </div>
        <Badge variant="outline" className="text-cyan-400 border-cyan-400/30 bg-cyan-400/5 px-3 py-1">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mr-2 animate-pulse" />
          Network: Mainnet
        </Badge>
      </div>

      <Card className="bg-[#15171E] border-white/5 overflow-hidden">
        <CardHeader className="border-b border-white/5 bg-white/5">
          <CardTitle className="text-sm font-bold uppercase tracking-wide">Pioneer Directory</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-[10px] uppercase font-black text-slate-500 py-4">Pioneer</TableHead>
                <TableHead className="text-[10px] uppercase font-black text-slate-500 py-4">Wallet</TableHead>
                <TableHead className="text-[10px] uppercase font-black text-slate-500 py-4 text-center">Score</TableHead>
                <TableHead className="text-[10px] uppercase font-black text-slate-500 py-4 text-center">Level</TableHead>
                <TableHead className="text-[10px] uppercase font-black text-slate-500 py-4 text-center">Trust</TableHead>
                <TableHead className="text-[10px] uppercase font-black text-slate-500 py-4 text-right">Balance</TableHead>
                <TableHead className="text-[10px] uppercase font-black text-slate-500 py-4 text-right">Activity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockUsers.map((user) => (
                <TableRow key={user.pi_username} className="border-white/5 hover:bg-white/5 transition-colors">
                  <TableCell className="font-bold text-purple-400 py-4">{user.pi_username}</TableCell>
                  <TableCell className="font-mono text-[10px] text-slate-400">{user.wallet}</TableCell>
                  <TableCell className="text-center font-black text-white">{user.reputationScore}</TableCell>
                  <TableCell className="text-center font-bold text-slate-300">{user.level}</TableCell>
                  <TableCell className="text-center">
                    <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-[9px] px-2">
                      {user.trustRank}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-black text-cyan-400">{user.balance} π</TableCell>
                  <TableCell className="text-right text-[10px] text-slate-500">{user.lastActiveAt}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#15171E] border border-white/5 p-5 rounded-2xl">
          <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Total Pioneers</h3>
          <p className="text-3xl font-black text-white">{mockUsers.length}</p>
        </div>
        <div className="bg-[#15171E] border border-white/5 p-5 rounded-2xl">
          <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Active Protocol</h3>
          <p className="text-3xl font-black text-cyan-400 uppercase">Atomic V1</p>
        </div>
        <div className="bg-[#15171E] border border-white/5 p-5 rounded-2xl">
          <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">System Status</h3>
          <p className="text-3xl font-black text-green-400 uppercase">Synced</p>
        </div>
        <div className="bg-[#15171E] border border-white/5 p-5 rounded-2xl">
          <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">DB Structure</h3>
          <p className="text-3xl font-black text-purple-400 uppercase">KV-STLR</p>
        </div>
      </div>
    </div>
  );
};

export default AdminConsole;
