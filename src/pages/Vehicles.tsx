import { useEffect, useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Vehicle {
  id: string;
  plate: string;
  model: string;
  year: number;
  brand: string | null;
  color: string | null;
  current_mileage: number;
}

const Vehicles = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    plate: "",
    model: "",
    year: new Date().getFullYear(),
    brand: "",
    color: "",
    current_mileage: 0,
  });

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setVehicles(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar veículos",
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (editingVehicle) {
        const { error } = await supabase
          .from("vehicles")
          .update(formData)
          .eq("id", editingVehicle.id);

        if (error) throw error;

        toast({
          title: "Veículo atualizado!",
          description: "As informações foram atualizadas com sucesso.",
        });
      } else {
        const { error } = await supabase
          .from("vehicles")
          .insert([{ ...formData, user_id: user.id }]);

        if (error) throw error;

        toast({
          title: "Veículo cadastrado!",
          description: "O veículo foi adicionado com sucesso.",
        });
      }

      setDialogOpen(false);
      resetForm();
      fetchVehicles();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este veículo?")) return;

    try {
      const { error } = await supabase.from("vehicles").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Veículo excluído",
        description: "O veículo foi removido com sucesso.",
      });

      fetchVehicles();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      plate: vehicle.plate,
      model: vehicle.model,
      year: vehicle.year,
      brand: vehicle.brand || "",
      color: vehicle.color || "",
      current_mileage: vehicle.current_mileage,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      plate: "",
      model: "",
      year: new Date().getFullYear(),
      brand: "",
      color: "",
      current_mileage: 0,
    });
    setEditingVehicle(null);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96">Carregando...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Veículos</h1>
          <p className="text-muted-foreground">Gerencie sua frota</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gradient-primary gap-2">
              <Plus className="h-5 w-5" />
              Adicionar Veículo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingVehicle ? "Editar Veículo" : "Novo Veículo"}
              </DialogTitle>
              <DialogDescription>
                Preencha as informações do veículo
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="plate">Placa *</Label>
                <Input
                  id="plate"
                  value={formData.plate}
                  onChange={(e) => setFormData({ ...formData, plate: e.target.value.toUpperCase() })}
                  placeholder="ABC-1234"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="brand">Marca</Label>
                  <Input
                    id="brand"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="Toyota"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Modelo *</Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    placeholder="Corolla"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year">Ano *</Label>
                  <Input
                    id="year"
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Cor</Label>
                  <Input
                    id="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="Preto"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="current_mileage">Quilometragem Atual</Label>
                <Input
                  id="current_mileage"
                  type="number"
                  value={formData.current_mileage}
                  onChange={(e) => setFormData({ ...formData, current_mileage: parseInt(e.target.value) })}
                  placeholder="50000"
                />
              </div>
              <Button type="submit" className="w-full gradient-primary">
                {editingVehicle ? "Atualizar" : "Cadastrar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Meus Veículos</CardTitle>
        </CardHeader>
        <CardContent>
          {vehicles.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum veículo cadastrado ainda.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Placa</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Ano</TableHead>
                  <TableHead>Cor</TableHead>
                  <TableHead>KM Atual</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicles.map((vehicle) => (
                  <TableRow key={vehicle.id}>
                    <TableCell className="font-medium">{vehicle.plate}</TableCell>
                    <TableCell>{vehicle.brand || "-"}</TableCell>
                    <TableCell>{vehicle.model}</TableCell>
                    <TableCell>{vehicle.year}</TableCell>
                    <TableCell>{vehicle.color || "-"}</TableCell>
                    <TableCell>{vehicle.current_mileage.toLocaleString()} km</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEdit(vehicle)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(vehicle.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Vehicles;
