import { useEffect, useState } from "react";
import React from "react";
import { Plus, Edit, Trash2, TrendingUp, Fuel, Wrench, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Expense {
  id: string;
  vehicle_id: string;
  type: string;
  amount: number;
  date: string;
  description: string | null;
  liters: number | null;
  vehicles?: {
    plate: string;
    model: string;
  };
}

interface Vehicle {
  id: string;
  plate: string;
  model: string;
}

const expenseTypes = [
  { value: "fuel", label: "Combustível", icon: Fuel },
  { value: "maintenance", label: "Manutenção", icon: Wrench },
  { value: "insurance", label: "Seguro", icon: Shield },
  { value: "other", label: "Outros", icon: TrendingUp },
];

const Expenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    fuel: 0,
    maintenance: 0,
    insurance: 0,
    other: 0,
  });
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    vehicle_id: "",
    type: "fuel",
    amount: "",
    date: format(new Date(), "yyyy-MM-dd"),
    description: "",
    liters: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [expensesRes, vehiclesRes] = await Promise.all([
        supabase
          .from("expenses")
          .select("*, vehicles(plate, model)")
          .order("date", { ascending: false }),
        supabase
          .from("vehicles")
          .select("id, plate, model")
          .eq("user_id", user.id),
      ]);

      if (expensesRes.error) throw expensesRes.error;
      if (vehiclesRes.error) throw vehiclesRes.error;

      setExpenses(expensesRes.data || []);
      setVehicles(vehiclesRes.data || []);

      // Calculate stats
      const total = expensesRes.data?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;
      const byType = expensesRes.data?.reduce((acc: any, exp) => {
        acc[exp.type] = (acc[exp.type] || 0) + Number(exp.amount);
        return acc;
      }, {});

      setStats({
        total,
        fuel: byType?.fuel || 0,
        maintenance: byType?.maintenance || 0,
        insurance: byType?.insurance || 0,
        other: byType?.other || 0,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const expenseData = {
        vehicle_id: formData.vehicle_id,
        type: formData.type,
        amount: parseFloat(formData.amount),
        date: formData.date,
        description: formData.description || null,
        liters: formData.liters ? parseFloat(formData.liters) : null,
      };

      if (editingExpense) {
        const { error } = await supabase
          .from("expenses")
          .update(expenseData)
          .eq("id", editingExpense.id);

        if (error) throw error;

        toast({
          title: "Despesa atualizada!",
          description: "As informações foram atualizadas com sucesso.",
        });
      } else {
        const { error } = await supabase
          .from("expenses")
          .insert([expenseData]);

        if (error) throw error;

        toast({
          title: "Despesa registrada!",
          description: "A despesa foi adicionada com sucesso.",
        });
      }

      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta despesa?")) return;

    try {
      const { error } = await supabase.from("expenses").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Despesa excluída",
        description: "O registro foi removido com sucesso.",
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      vehicle_id: expense.vehicle_id,
      type: expense.type,
      amount: expense.amount.toString(),
      date: expense.date,
      description: expense.description || "",
      liters: expense.liters?.toString() || "",
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      vehicle_id: "",
      type: "fuel",
      amount: "",
      date: format(new Date(), "yyyy-MM-dd"),
      description: "",
      liters: "",
    });
    setEditingExpense(null);
  };

  const getTypeLabel = (type: string) => {
    return expenseTypes.find((t) => t.value === type)?.label || type;
  };

  const getTypeIcon = (type: string) => {
    const Icon = expenseTypes.find((t) => t.value === type)?.icon || TrendingUp;
    return <Icon className="h-5 w-5" />;
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96">Carregando...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Despesas</h1>
          <p className="text-muted-foreground">Controle de gastos com veículos</p>
        </div>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button className="gradient-primary gap-2">
              <Plus className="h-5 w-5" />
              Adicionar Despesa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingExpense ? "Editar Despesa" : "Nova Despesa"}
              </DialogTitle>
              <DialogDescription>
                Registre uma nova despesa do veículo
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="vehicle">Veículo *</Label>
                <Select
                  value={formData.vehicle_id}
                  onValueChange={(value) => setFormData({ ...formData, vehicle_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o veículo" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.plate} - {vehicle.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Tipo *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          {React.createElement(type.icon, { className: "h-4 w-4" })}
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Data *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Valor (R$) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="150.00"
                    required
                  />
                </div>
              </div>

              {formData.type === "fuel" && (
                <div className="space-y-2">
                  <Label htmlFor="liters">Litros</Label>
                  <Input
                    id="liters"
                    type="number"
                    step="0.01"
                    value={formData.liters}
                    onChange={(e) => setFormData({ ...formData, liters: e.target.value })}
                    placeholder="40.5"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detalhes da despesa..."
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full gradient-primary">
                {editingExpense ? "Atualizar" : "Registrar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <Card className="shadow-card hover:shadow-elevated transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <TrendingUp className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {stats.total.toFixed(2)}</div>
          </CardContent>
        </Card>

        {expenseTypes.map((type) => (
          <Card key={type.value} className="shadow-card hover:shadow-elevated transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{type.label}</CardTitle>
              {React.createElement(type.icon, { className: "h-5 w-5 text-primary" })}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {stats[type.value as keyof typeof stats].toFixed(2)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Histórico de Despesas</CardTitle>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma despesa registrada ainda.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Veículo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Litros</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium">
                        {expense.vehicles?.plate || "N/A"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(expense.type)}
                          {getTypeLabel(expense.type)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(expense.date), "dd/MM/yyyy", {
                          locale: ptBR,
                        })}
                      </TableCell>
                      <TableCell className="font-semibold text-success">
                        R$ {Number(expense.amount).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {expense.liters ? `${expense.liters} L` : "-"}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {expense.description || "-"}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEdit(expense)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(expense.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Expenses;
