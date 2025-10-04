import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Wrench, TrendingUp, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, differenceInMonths, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DashboardStats {
  totalVehicles: number;
  upcomingMaintenances: number;
  monthlyExpenses: number;
  pendingAlerts: number;
}

interface Alert {
  id: string;
  vehiclePlate: string;
  maintenanceTitle: string;
  nextDate: string | null;
  nextMileage: number | null;
  currentMileage: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalVehicles: 0,
    upcomingMaintenances: 0,
    monthlyExpenses: 0,
    pendingAlerts: 0,
  });
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch vehicles
      const { data: vehicles } = await supabase
        .from("vehicles")
        .select("*")
        .eq("user_id", user.id);

      // Fetch maintenances
      const { data: maintenances } = await supabase
        .from("maintenances")
        .select("*, vehicles(plate, current_mileage)")
        .in("vehicle_id", vehicles?.map(v => v.id) || []);

      // Fetch expenses from current month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      const { data: expenses } = await supabase
        .from("expenses")
        .select("amount")
        .in("vehicle_id", vehicles?.map(v => v.id) || [])
        .gte("date", startOfMonth.toISOString().split("T")[0]);

      const totalExpenses = expenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;

      // Calculate alerts
      const upcomingAlerts: Alert[] = [];
      const today = new Date();

      maintenances?.forEach((maintenance: any) => {
        if (maintenance.next_date || maintenance.next_mileage) {
          const vehicle = maintenance.vehicles;
          let shouldAlert = false;

          if (maintenance.next_date) {
            const nextDate = new Date(maintenance.next_date);
            const daysUntil = differenceInDays(nextDate, today);
            if (daysUntil <= 30 && daysUntil >= 0) shouldAlert = true;
          }

          if (maintenance.next_mileage && vehicle?.current_mileage) {
            const kmUntil = maintenance.next_mileage - vehicle.current_mileage;
            if (kmUntil <= 1000 && kmUntil >= 0) shouldAlert = true;
          }

          if (shouldAlert) {
            upcomingAlerts.push({
              id: maintenance.id,
              vehiclePlate: vehicle?.plate || "N/A",
              maintenanceTitle: maintenance.title,
              nextDate: maintenance.next_date,
              nextMileage: maintenance.next_mileage,
              currentMileage: vehicle?.current_mileage || 0,
            });
          }
        }
      });

      setStats({
        totalVehicles: vehicles?.length || 0,
        upcomingMaintenances: maintenances?.length || 0,
        monthlyExpenses: totalExpenses,
        pendingAlerts: upcomingAlerts.length,
      });

      setAlerts(upcomingAlerts);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral dos seus veículos</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-card hover:shadow-elevated transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Veículos</CardTitle>
            <Car className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalVehicles}</div>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-elevated transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Manutenções</CardTitle>
            <Wrench className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.upcomingMaintenances}</div>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-elevated transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Gastos do Mês</CardTitle>
            <TrendingUp className="h-5 w-5 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              R$ {stats.monthlyExpenses.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-elevated transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Alertas Pendentes</CardTitle>
            <AlertCircle className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.pendingAlerts}</div>
          </CardContent>
        </Card>
      </div>

      {alerts.length > 0 && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-accent" />
              Manutenções Próximas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-4 rounded-lg bg-accent/10 border border-accent/20"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{alert.vehiclePlate}</p>
                      <p className="text-sm text-muted-foreground">
                        {alert.maintenanceTitle}
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      {alert.nextDate && (
                        <p>
                          Data: {format(new Date(alert.nextDate), "dd/MM/yyyy", {
                            locale: ptBR,
                          })}
                        </p>
                      )}
                      {alert.nextMileage && (
                        <p>Próx: {alert.nextMileage.toLocaleString()} km</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
