"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, TrendingUp, Users, Clock } from "lucide-react";

interface StatsCardsProps {
  totalAgendas: number;
  thisMonthAgendas: number;
  totalUsers: number;
  pendingAgendas: number;
}

export default function StatsCards({ 
  totalAgendas, 
  thisMonthAgendas, 
  totalUsers, 
  pendingAgendas 
}: StatsCardsProps) {
  const stats = [
    {
      title: "Total Agenda",
      value: totalAgendas,
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      description: "Semua agenda yang dibuat"
    },
    {
      title: "Agenda Bulan Ini",
      value: thisMonthAgendas,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50",
      description: "Agenda bulan September 2025"
    },
    {
      title: "Total Users",
      value: totalUsers,
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      description: "Pengguna terdaftar"
    },
    {
      title: "Pending Agenda",
      value: pendingAgendas,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      description: "Agenda menunggu persetujuan"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stat.value.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
