import { useState, useEffect, useRef } from "react";
import { Store, Save, Loader2, Upload, Trash2, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useRestaurantSettings, RestaurantSettings } from "@/hooks/useRestaurantSettings";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import logoFallback from "@/assets/logo-sol.png";

export function RestaurantSettingsPanel() {
  const { settings, loading, updateSettings } = useRestaurantSettings();
  const { toast } = useToast();
  const [form, setForm] = useState<Partial<RestaurantSettings>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading) setForm(settings);
  }, [loading, settings]);

  const handleChange = (field: keyof RestaurantSettings, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Arquivo inválido", description: "Selecione uma imagem (PNG, JPG, etc.)", variant: "destructive" });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "O logo deve ter no máximo 2MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const filePath = `logo.${ext}`;

    // Remove old logo if exists
    await supabase.storage.from("restaurant-assets").remove([filePath]);

    const { error: uploadError } = await supabase.storage
      .from("restaurant-assets")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast({ title: "Erro no upload", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("restaurant-assets").getPublicUrl(filePath);
    const logoUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    const { error } = await updateSettings({ logo_url: logoUrl });
    if (!error) {
      setForm((prev) => ({ ...prev, logo_url: logoUrl }));
      toast({ title: "Logo atualizado!" });
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveLogo = async () => {
    await supabase.storage.from("restaurant-assets").remove(["logo.png", "logo.jpg", "logo.jpeg", "logo.webp"]);
    const { error } = await updateSettings({ logo_url: null } as any);
    if (!error) {
      setForm((prev) => ({ ...prev, logo_url: null }));
      toast({ title: "Logo removido", description: "O logo padrão será usado." });
    }
  };

  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Arquivo inválido", description: "Selecione uma imagem (PNG, JPG, etc.)", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "A imagem deve ter no máximo 5MB", variant: "destructive" });
      return;
    }
    setUploadingHero(true);
    const ext = file.name.split(".").pop();
    const filePath = `hero.${ext}`;
    await supabase.storage.from("restaurant-assets").remove([filePath]);
    const { error: uploadError } = await supabase.storage
      .from("restaurant-assets")
      .upload(filePath, file, { upsert: true });
    if (uploadError) {
      toast({ title: "Erro no upload", description: uploadError.message, variant: "destructive" });
      setUploadingHero(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("restaurant-assets").getPublicUrl(filePath);
    const heroUrl = `${urlData.publicUrl}?t=${Date.now()}`;
    const { error } = await updateSettings({ hero_url: heroUrl } as any);
    if (!error) {
      setForm((prev) => ({ ...prev, hero_url: heroUrl }));
      toast({ title: "Imagem de fundo atualizada!" });
    }
    setUploadingHero(false);
    if (heroInputRef.current) heroInputRef.current.value = "";
  };

  const handleRemoveHero = async () => {
    await supabase.storage.from("restaurant-assets").remove(["hero.png", "hero.jpg", "hero.jpeg", "hero.webp"]);
    const { error } = await updateSettings({ hero_url: null } as any);
    if (!error) {
      setForm((prev) => ({ ...prev, hero_url: null }));
      toast({ title: "Imagem removida", description: "A imagem padrão será usada." });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const { id, ...rest } = form;
    const { error } = await updateSettings(rest);
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Configurações salvas!" });
    }
  };

  if (loading) {
    return <Loader2 className="h-6 w-6 animate-spin mx-auto" />;
  }

  const currentLogo = form.logo_url || logoFallback;

  const fields: { key: keyof RestaurantSettings; label: string; placeholder: string }[] = [
    { key: "name", label: "Nome do Restaurante", placeholder: "Ex: Restaurante Sol" },
    { key: "slogan", label: "Slogan", placeholder: "Ex: Comida caseira no fogão a lenha" },
    { key: "phone", label: "Telefone (exibição)", placeholder: "(13) 98115-9622" },
    { key: "whatsapp", label: "WhatsApp (apenas números)", placeholder: "5513981159622" },
    { key: "pix_key", label: "Chave PIX", placeholder: "Ex: seu@email.com, CPF ou telefone" },
    { key: "address_street", label: "Endereço resumido", placeholder: "Av. Santos Dumont, 952 - Guarujá" },
    { key: "address_full", label: "Endereço completo", placeholder: "Endereço completo com CEP" },
    { key: "city", label: "Cidade", placeholder: "Guarujá" },
    { key: "state", label: "Estado", placeholder: "SP" },
    { key: "maps_url", label: "Link Google Maps", placeholder: "https://maps.google.com/..." },
    { key: "instagram_url", label: "Link Instagram", placeholder: "https://www.instagram.com/..." },
    { key: "working_hours", label: "Horário de funcionamento", placeholder: "Segunda a Sexta: 11:00 às 15:30" },
    { key: "delivery_time", label: "Tempo estimado de entrega", placeholder: "30-45 min" },
    { key: "footer_text", label: "Texto do rodapé", placeholder: "Sabor caseiro, tradição e qualidade em cada refeição." },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Store className="h-5 w-5" /> Dados do Restaurante
        </CardTitle>
        <CardDescription>
          Personalize as informações exibidas no site e nos recibos. Ao vender o sistema para outro restaurante, basta alterar esses dados.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Logo upload section */}
        <div className="mb-6 p-4 border rounded-lg bg-muted/30">
          <Label className="text-sm font-medium mb-3 block">Logo do Restaurante</Label>
          <div className="flex items-center gap-4">
            <img
              src={currentLogo}
              alt="Logo atual"
              className="w-16 h-16 rounded-lg object-contain border bg-background p-1"
            />
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
                  {form.logo_url ? "Trocar Logo" : "Enviar Logo"}
                </Button>
                {form.logo_url && (
                  <Button variant="ghost" size="sm" onClick={handleRemoveLogo} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-1" /> Remover
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">PNG ou JPG, máximo 2MB</p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleLogoUpload}
          />
        </div>

        {/* Hero image upload section */}
        <div className="mb-6 p-4 border rounded-lg bg-muted/30">
          <Label className="text-sm font-medium mb-3 block">Imagem de Fundo (Hero)</Label>
          <div className="flex items-start gap-4">
            <div className="w-40 h-20 rounded-lg border bg-background overflow-hidden flex-shrink-0">
              {(form as any).hero_url ? (
                <img src={(form as any).hero_url} alt="Hero atual" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">Imagem padrão</div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => heroInputRef.current?.click()}
                  disabled={uploadingHero}
                >
                  {uploadingHero ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
                  {(form as any).hero_url ? "Trocar Imagem" : "Enviar Imagem"}
                </Button>
                {(form as any).hero_url && (
                  <Button variant="ghost" size="sm" onClick={handleRemoveHero} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-1" /> Remover
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">PNG ou JPG, máximo 5MB. Recomendado: 1920x600px</p>
            </div>
          </div>
          <input
            ref={heroInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleHeroUpload}
          />
        </div>

        {/* Theme colors */}
        <div className="mb-6 p-4 border rounded-lg bg-muted/30">
          <Label className="text-sm font-medium mb-3 flex items-center gap-2">
            <Palette className="h-4 w-4" /> Cores do Tema
          </Label>
          <p className="text-xs text-muted-foreground mb-3">Personalize as cores principais do site. Deixe vazio para usar as cores padrão.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="primary_color">Cor primária</Label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={form.primary_color || "#f07d2e"}
                  onChange={(e) => handleChange("primary_color", e.target.value)}
                  className="w-10 h-10 rounded border cursor-pointer"
                />
                <Input
                  id="primary_color"
                  value={form.primary_color || ""}
                  onChange={(e) => handleChange("primary_color", e.target.value)}
                  placeholder="#f07d2e (padrão)"
                  className="flex-1"
                />
                {form.primary_color && (
                  <Button variant="ghost" size="sm" onClick={() => setForm(prev => ({ ...prev, primary_color: null }))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="accent_color">Cor de destaque</Label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={form.accent_color || "#e63946"}
                  onChange={(e) => handleChange("accent_color", e.target.value)}
                  className="w-10 h-10 rounded border cursor-pointer"
                />
                <Input
                  id="accent_color"
                  value={form.accent_color || ""}
                  onChange={(e) => handleChange("accent_color", e.target.value)}
                  placeholder="#e63946 (padrão)"
                  className="flex-1"
                />
                {form.accent_color && (
                  <Button variant="ghost" size="sm" onClick={() => setForm(prev => ({ ...prev, accent_color: null }))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map(({ key, label, placeholder }) => (
            <div key={key} className="space-y-1.5">
              <Label htmlFor={key}>{label}</Label>
              <Input
                id={key}
                value={(form[key] as string) || ""}
                onChange={(e) => handleChange(key, e.target.value)}
                placeholder={placeholder}
              />
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar Configurações
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
