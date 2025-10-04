-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create vehicles table
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  plate VARCHAR(20) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INTEGER NOT NULL,
  brand VARCHAR(50),
  color VARCHAR(30),
  current_mileage INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create maintenance_types table
CREATE TABLE public.maintenance_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  interval_months INTEGER,
  interval_km INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create maintenances table
CREATE TABLE public.maintenances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
  maintenance_type_id UUID REFERENCES public.maintenance_types(id),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  mileage INTEGER NOT NULL,
  cost DECIMAL(10,2),
  next_date DATE,
  next_mileage INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create expenses table
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('fuel', 'maintenance', 'insurance', 'other')),
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  liters DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(100),
  email VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vehicles
CREATE POLICY "Users can view their own vehicles" ON public.vehicles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own vehicles" ON public.vehicles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vehicles" ON public.vehicles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vehicles" ON public.vehicles
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for maintenance_types (public read)
CREATE POLICY "Everyone can view maintenance types" ON public.maintenance_types
  FOR SELECT USING (true);

-- RLS Policies for maintenances
CREATE POLICY "Users can view maintenances of their vehicles" ON public.maintenances
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.vehicles
      WHERE vehicles.id = maintenances.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create maintenances for their vehicles" ON public.maintenances
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vehicles
      WHERE vehicles.id = maintenances.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update maintenances of their vehicles" ON public.maintenances
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.vehicles
      WHERE vehicles.id = maintenances.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete maintenances of their vehicles" ON public.maintenances
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.vehicles
      WHERE vehicles.id = maintenances.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  );

-- RLS Policies for expenses
CREATE POLICY "Users can view expenses of their vehicles" ON public.expenses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.vehicles
      WHERE vehicles.id = expenses.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create expenses for their vehicles" ON public.expenses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vehicles
      WHERE vehicles.id = expenses.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update expenses of their vehicles" ON public.expenses
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.vehicles
      WHERE vehicles.id = expenses.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete expenses of their vehicles" ON public.expenses
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.vehicles
      WHERE vehicles.id = expenses.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  );

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maintenances_updated_at BEFORE UPDATE ON public.maintenances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert default maintenance types
INSERT INTO public.maintenance_types (name, description, interval_months, interval_km) VALUES
  ('Troca de Óleo', 'Troca de óleo do motor e filtro', 6, 10000),
  ('Troca de Filtro de Ar', 'Substituição do filtro de ar do motor', 12, 15000),
  ('Alinhamento e Balanceamento', 'Alinhamento e balanceamento das rodas', 6, 10000),
  ('Revisão de Freios', 'Verificação e manutenção do sistema de freios', 12, 20000),
  ('Troca de Pneus', 'Substituição dos pneus', 24, 40000),
  ('Troca de Bateria', 'Substituição da bateria', 36, NULL),
  ('Troca de Correia Dentada', 'Substituição da correia dentada', 48, 60000);
