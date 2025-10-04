import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Calendar } from "lucide-react";
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
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Maintenance {
  id: string;
  vehicle_id: string;
  title: string;
  description: string | null;
  date: string;
  mileage: number;
  cost: number | null;
  next_date: string | null;
  next_mileage: number | null;
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

interface MaintenanceType {
  id: string;
  name: string;
  description: string | null;
  interval_months: number | null;
  interval_km: number | null;
}

const Maintenances = () => {
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [maintenanceTypes, setMaintenanceTypes] = useState<MaintenanceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMaintenance, setEditingMaintenance] = useState<Maintenance | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    vehicle_id: "",
    maintenance_type_id: "",
    title: "",
    description: "",
    date: format(new Date(), "yyyy-MM-dd"),
    mileage: 0,
    cost: "",
    next_date: "",
    next_mileage: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [maintenancesRes, vehiclesRes, typesRes] = await Promise.all([
        supabase
          .from("maintenances")
          .select("*, vehicles(plate, model)")
          .order("date", { ascending: false }),
        supabase
          .from("vehicles")
          .select("id, plate, model")
          .eq("user_id", user.id),
        supabase
          .from("maintenance_types")
          .select("*")
          .order("name"),
      ]);

      if (maintenancesRes.error) throw maintenancesRes.error;
      if (vehiclesRes.error) throw vehiclesRes.error;
      if (typesRes.error) throw typesRes.error;

      setMaintenances(maintenancesRes.data || []);
      setVehicles(vehiclesRes.data || []);
      setMaintenanceTypes(typesRes.data || []);
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

  const handleMaintenanceTypeChange = (typeId: string) => {
    setFormData({ ...formData, maintenance_type_id: typeId });
    
    const type = maintenanceTypes.find(t => t.id === typeId);
    if (type) {
      setFormData(prev => ({
        ...prev,
        maintenance_type_id: typeId,
        title: type.name,
        description: type.description || "",
      }));

      // Calculate next maintenance
      if (type.interval_months || type.interval_km) {
        const currentDate = new Date(formData.date || new Date());
        
        if (type.interval_months) {
          const nextDate = new Date(currentDate);
          nextDate.setMonth(nextDate.getMonth() + type.interval_months);
          setFormData(prev => ({
            ...prev,
            next_date: format(nextDate, "yyyy-MM-dd"),
          }));
        }

        if (type.interval_km && formData.mileage) {
          setFormData(prev => ({
            ...prev,
            next_mileage: String(formData.mileage + type.interval_km),
          }));
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const maintenanceData = {
        vehicle_id: formData.vehicle_id,
        maintenance_type_id: formData.maintenance_type_id || null,
        title: formData.title,
        description: formData.description || null,
        date: formData.date,
        mileage: formData.mileage,
        cost: formData.cost ? parseFloat(formData.cost) : null,
        next_date: formData.next_date || null,
        next_mileage: formData.next_mileage ? parseInt(formData.next_mileage) : null,
      };

      if (editingMaintenance) {
        const { error } = await supabase
          .from("maintenances")
          .update(maintenanceData)
          .eq("id", editingMaintenance.id);

        if (error) throw error;

        toast({
          title: "Manutenção atualizada!",
          description: "As informações foram atualizadas com sucesso.",
        });
      } else {
        const { error } = await supabase
          .from("maintenances")
          .insert([maintenanceData]);

        if (error) throw error;

        toast({
          title: "Manutenção registrada!",
          description: "A manutenção foi adicionada com sucesso.",
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
    if (!confirm("Tem certeza que deseja excluir esta manutenção?")) return;

    try {
      const { error } = await supabase.from("maintenances").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Manutenção excluída",
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

  const handleEdit = (maintenance: Maintenance) => {
    setEditingMaintenance(maintenance);
    setFormData({
      vehicle_id: maintenance.vehicle_id,
      maintenance_type_id: "",
      title: maintenance.title,
      description: maintenance.description || "",
      date: maintenance.date,
      mileage: maintenance.mileage,
      cost: maintenance.cost?.toString() || "",
      next_date: maintenance.next_date || "",
      next_mileage: maintenance.next_mileage?.toString() || "",
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      vehicle_id: "",
      maintenance_type_id: "",
      title: "",
      description: "",
      date: format(new Date(), "yyyy-MM-dd"),
      mileage: 0,
      cost: "",
      next_date: "",
      next_mileage: "",
    });
    setEditingMaintenance(null);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96">Carregando...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Manutenções</h1>
          <p className="text-muted-foreground">Histórico e planejamento de manutenções</p>
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
              Registrar Manutenção
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingMaintenance ? "Editar Manutenção" : "Nova Manutenção"}
              </DialogTitle>
              <DialogDescription>
                Registre as informações da manutenção realizada
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
                <Label htmlFor="type">Tipo de Manutenção</Label>
                <Select
                  value={formData.maintenance_type_id}
                  onValueChange={handleMaintenanceTypeChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {maintenanceTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Troca de óleo"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detalhes da manutenção..."
                  rows={3}
                />
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
                  <Label htmlFor="mileage">Quilometragem *</Label>
                  <Input
                    id="mileage"
                    type="number"
                    value={formData.mileage}
                    onChange={(e) => setFormData({ ...formData, mileage: parseInt(e.target.value) })}
                    placeholder="50000"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cost">Custo (R$)</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  placeholder="150.00"
                />
              </div>

              <div className="border-t pt-4 space-y-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Próxima Manutenção
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="next_date">Próxima Data</Label>
                    <Input
                      id="next_date"
                      type="date"
                      value={formData.next_date}
                      onChange={(e) => setFormData({ ...formData, next_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="next_mileage">Próxima KM</Label>
                    <Input
                      id="next_mileage"
                      type="number"
                      value={formData.next_mileage}
                      onChange={(e) => setFormData({ ...formData, next_mileage: e.target.value })}
                      placeholder="60000"
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full gradient-primary">
                {editingMaintenance ? "Atualizar" : "Registrar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Histórico de Manutenções</CardTitle>
        </CardHeader>
        <CardContent>
          {maintenances.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma manutenção registrada ainda.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Veículo</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>KM</TableHead>
                    <TableHead>Custo</TableHead>
                    <TableHead>Próxima</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {maintenances.map((maintenance) => (
                    <TableRow key={maintenance.id}>
                      <TableCell className="font-medium">
                        {maintenance.vehicles?.plate || "N/A"}
                      </TableCell>
                      <TableCell>{maintenance.title}</TableCell>
                      <TableCell>
                        {format(new Date(maintenance.date), "dd/MM/yyyy", {
                          locale: ptBR,
                        })}
                      </TableCell>
                      <TableCell>{maintenance.mileage.toLocaleString()} km</TableCell>
                      <TableCell>
                        {maintenance.cost
                          ? `R$ ${maintenance.cost.toFixed(2)}`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {maintenance.next_date ? (
                          <span className="text-accent">
                            {format(new Date(maintenance.next_date), "dd/MM/yyyy", {
                              locale: ptBR,
                            })}
                          </span>
                        ) : maintenance.next_mileage ? (
                          <span className="text-accent">
                            {maintenance.next_mileage.toLocaleString()} km
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEdit(maintenance)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(maintenance.id)}
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

export default Maintenances;
