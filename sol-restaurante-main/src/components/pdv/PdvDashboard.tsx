import { useState, useEffect, useCallback, useRef } from "react";
import { User } from "@supabase/supabase-js";
import { LogOut, RefreshCw, ChefHat, DollarSign, ClipboardList, Package, Settings, Key, QrCode, BarChart3, Users, AlertTriangle, ShoppingCart, TrendingUp, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCashRegister } from "@/hooks/useCashRegister";
import { useProducts } from "@/hooks/useProducts";
import { useInactivityTimeout } from "@/hooks/useInactivityTimeout";
import { useTabs } from "@/hooks/useTabs";
import { useIngredients } from "@/hooks/useIngredients";
import { useCustomers } from "@/hooks/useCustomers";
import { OrderCard } from "./OrderCard";
import { CashRegisterOpen } from "./CashRegisterOpen";
import { CashRegisterPanel } from "./CashRegisterPanel";
import { CashRegisterHistory } from "./CashRegisterHistory";
import { PaymentProcessor } from "./PaymentProcessor";
import { ProductList } from "./ProductList";
import { OperatorManagement } from "./OperatorManagement";
import { ChangePasswordDialog } from "./ChangePasswordDialog";
import { PrinterScaleConfig } from "./PrinterScaleConfig";
import { SoundAlertConfig } from "./SoundAlertConfig";
import { StockManagement } from "./StockManagement";
import { TabList } from "./TabList";
import { TabEditor } from "./TabEditor";
import { TabPaymentProcessor } from "./TabPaymentProcessor";
import { RecipeManagement } from "./RecipeManagement";
import { DashboardGerencial } from "./DashboardGerencial";
import { WasteControl } from "./WasteControl";
import { CustomerCRM } from "./CustomerCRM";
import { PurchaseForecast } from "./PurchaseForecast";
import { ProfitReport } from "./ProfitReport";
import { CashCloseReports } from "./CashCloseReports";
import type { Order, OrderStatus, DeliveryType } from "@/types/pdv";
import { ORDER_STATUS_LABELS } from "@/types/pdv";
import type { Tab } from "@/types/tab";
import { useSoundAlerts } from "@/hooks/useSoundAlerts";
import { printDeliveryKitchenTicket, printOrderReceipt, printCashCloseReport } from "@/lib/printUtils";
import { ClosedDatesManager } from "./ClosedDatesManager";
import { RestaurantSettingsPanel } from "./RestaurantSettingsPanel";

const INACTIVITY_TIMEOUT_MINUTES = 15;

interface PdvDashboardProps {
  user: User;
  role: string;
  onLogout: () => Promise<{ error: Error | null }>;
  onUpdatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  onCreateUser: (email: string, password: string, role: string) => Promise<{ error: Error | null; userId?: string }>;
  onRemoveRole: (userId: string) => Promise<{ error: Error | null }>;
}

type MainTab = "orders" | "tabs" | "cash" | "products" | "stock" | "dashboard" | "recipes" | "waste" | "crm" | "forecast" | "profit" | "reports" | "settings";

export function PdvDashboard({ 
  user, role, onLogout, onUpdatePassword, onCreateUser, onRemoveRole,
}: PdvDashboardProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<OrderStatus | "all">("pending");
  const [mainTab, setMainTab] = useState<MainTab>("tabs");
  const [paymentOrder, setPaymentOrder] = useState<Order | null>(null);
  const [paymentTab, setPaymentTab] = useState<Tab | null>(null);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleInactivityTimeout = useCallback(() => {
    toast({ title: "Sessão encerrada", description: "Sua sessão foi encerrada por inatividade" });
    onLogout();
  }, [onLogout, toast]);

  useInactivityTimeout({ timeoutMinutes: INACTIVITY_TIMEOUT_MINUTES, onTimeout: handleInactivityTimeout, enabled: true });

  const {
    currentRegister, movements, loading: cashLoading, totals, cashInDrawer, drawerOpen,
    openRegister, closeRegister, registerPayment, registerMovement,
  } = useCashRegister(user.id);

  const { products, categories, loading: productsLoading, createProduct, updateProduct, updateStock, toggleProductActive, refresh: refreshProducts } = useProducts();

  const {
    tabs, loading: tabsLoading, activeTab: selectedTab, setActiveTab: setSelectedTab,
    fetchTabs, openTab, updateTabItems, requestPayment, finalizeTab, cancelTab,
  } = useTabs();

  const {
    ingredients, recipes, loading: ingredientsLoading,
    createIngredient, updateIngredient, deleteIngredient,
    addRecipeItem, removeRecipeItem, getProductRecipes, getProductCost, refresh: refreshIngredients,
  } = useIngredients();

  const { customers, loading: customersLoading, searchByPhone, upsertFromOrder } = useCustomers();

  const { playSound } = useSoundAlerts();
  const prevOrderCountRef = useRef(0);

  const mapOrder = (order: any): Order => ({
    ...order,
    items: order.items as unknown as Order["items"],
    status: order.status as OrderStatus,
    delivery_type: order.delivery_type as DeliveryType | null,
  });

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select(`*, address:addresses(street, number, complement, neighborhood:neighborhoods(name))`)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Erro ao carregar pedidos", description: error.message, variant: "destructive" });
    } else {
      setOrders((data || []).map((order) => mapOrder(order)));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
    const channel = supabase
      .channel("orders-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, (payload) => {
        if (payload.eventType === "INSERT") {
          supabase.from("orders").select(`*, address:addresses(street, number, complement, neighborhood:neighborhoods(name))`)
            .eq("id", payload.new.id).single().then(({ data }) => {
              if (data) {
                setOrders((prev) => [{
                  ...data,
                  items: data.items as unknown as Order["items"],
                  status: data.status as OrderStatus,
                  delivery_type: (data as any).delivery_type as DeliveryType | null,
                }, ...prev]);
                toast({ title: "🔔 Novo pedido!", description: `Pedido #${data.id.slice(0, 8).toUpperCase()} recebido` });
                playSound("new_online_order");

                // Auto-register customer CRM
                if (data.guest_name && data.guest_phone) {
                  upsertFromOrder({
                    name: data.guest_name as string,
                    phone: data.guest_phone as string,
                    address_street: data.guest_address_street as string | undefined,
                    address_number: data.guest_address_number as string | undefined,
                    address_complement: data.guest_address_complement as string | undefined,
                    neighborhood: data.guest_neighborhood_name as string | undefined,
                    order_total: data.total as number,
                  });
                }
              }
            });
        } else if (payload.eventType === "UPDATE") {
          setOrders((prev) => prev.map((o) => o.id === payload.new.id ? {
            ...o, ...payload.new,
            status: payload.new.status as OrderStatus,
            delivery_type: payload.new.delivery_type as DeliveryType | null,
          } : o));
        } else if (payload.eventType === "DELETE") {
          setOrders((prev) => prev.filter((o) => o.id !== payload.old.id));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    const updateData: any = { status: newStatus };
    if (newStatus === "preparing") updateData.prep_started_at = new Date().toISOString();
    if (newStatus === "ready") updateData.prep_finished_at = new Date().toISOString();

    const { error } = await supabase.from("orders").update(updateData).eq("id", orderId);
    if (error) {
      toast({ title: "Erro ao atualizar status", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Status atualizado", description: `Pedido marcado como "${ORDER_STATUS_LABELS[newStatus]}"` });
      if (newStatus === "preparing") {
        const order = orders.find((o) => o.id === orderId);
        if (order) {
          printDeliveryKitchenTicket({
            id: order.id,
            items: order.items,
            notes: order.notes,
            guest_name: order.guest_name,
          });
        }
      }
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    const { error } = await supabase.from("orders").update({ status: "cancelled" } as any).eq("id", orderId);
    if (error) {
      toast({ title: "Erro ao cancelar pedido", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Pedido cancelado", description: "Pedido cancelado", variant: "destructive" });
    }
  };

  const handleSetDeliveryType = async (orderId: string, deliveryType: DeliveryType) => {
    const { error } = await supabase.from("orders").update({ delivery_type: deliveryType } as any).eq("id", orderId);
    if (error) {
      toast({ title: "Erro ao definir tipo de entrega", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Tipo de entrega definido", description: deliveryType === "own" ? "Entrega própria" : "Entrega terceirizada" });
    }
  };

  const handleProcessPayment = (order: Order) => {
    if (!currentRegister) {
      toast({ title: "Caixa fechado", description: "Abra o caixa antes de processar pagamentos", variant: "destructive" });
      setMainTab("cash");
      return;
    }
    const isDelivery = !!order.guest_address_street || !!order.address_id;
    const isPickup = order.guest_neighborhood_name === "Retirada no local" || order.notes?.includes("[RETIRADA NO LOCAL]");
    if (isDelivery && !isPickup && !order.delivery_type) {
      toast({ title: "Tipo de entrega não definido", description: "Defina se a entrega é própria ou terceirizada antes de finalizar", variant: "destructive" });
      return;
    }
    setPaymentOrder(order);
  };

  const handlePaymentComplete = async () => {
    if (!paymentOrder || !currentRegister) return;
    await handleStatusChange(paymentOrder.id, "completed");
    const isDelivery = !!paymentOrder.guest_address_street || !!paymentOrder.address_id;
    const isPickup = paymentOrder.guest_neighborhood_name === "Retirada no local" || paymentOrder.notes?.includes("[RETIRADA NO LOCAL]");
    
    if (isDelivery && !isPickup && paymentOrder.delivery_type === "third_party" && paymentOrder.delivery_fee > 0) {
      const { error: expenseError } = await supabase.from("delivery_expenses").insert({
        order_id: paymentOrder.id,
        cash_register_id: currentRegister.id,
        amount: paymentOrder.delivery_fee,
        description: `Pagamento entregador - Pedido #${paymentOrder.id.slice(0, 8).toUpperCase()}`,
      });
      if (expenseError) {
        toast({ title: "Aviso", description: "Pedido finalizado, mas erro ao registrar despesa de entrega", variant: "destructive" });
      }
      await registerMovement("withdrawal", paymentOrder.delivery_fee, `Pagamento entregador - #${paymentOrder.id.slice(0, 8).toUpperCase()}`);
    }
  };

  const handleTabPayment = (tab: Tab) => {
    if (!currentRegister) {
      toast({ title: "Caixa fechado", description: "Abra o caixa antes de processar pagamentos", variant: "destructive" });
      setMainTab("cash");
      return;
    }
    setPaymentTab(tab);
  };

  const handleTabPaymentComplete = async () => {
    if (paymentTab) {
      await finalizeTab(paymentTab.id);
      setPaymentTab(null);
      fetchTabs();
    }
  };

  const filteredOrders = activeTab === "all" ? orders : orders.filter((o) => o.status === activeTab);
  const getOrderCount = (status: OrderStatus | "all") => status === "all" ? orders.length : orders.filter((o) => o.status === status).length;
  const tabsAwaitingPayment = tabs.filter((t) => t.status === "awaiting_payment");

  const deliveryExpensesTotal = orders
    .filter(o => o.status === "completed" && o.delivery_type === "third_party" && o.delivery_fee > 0)
    .reduce((sum, o) => sum + o.delivery_fee, 0);
  const deliveryRevenueTotal = orders
    .filter(o => o.status === "completed" && o.delivery_fee > 0)
    .reduce((sum, o) => sum + o.delivery_fee, 0);
  const productSalesTotal = orders
    .filter(o => o.status === "completed")
    .reduce((sum, o) => sum + o.subtotal, 0);

  const isAdmin = role === "admin" || role === "super_admin";
  const isAdminOrOperator = isAdmin || role === "operator";

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-display font-semibold">PDV Sol Nascente</h1>
              <p className="text-xs text-muted-foreground">
                {user.email} • {role === "super_admin" ? "Super Administrador" : role === "admin" ? "Administrador" : role === "operator" ? "Operador" : role === "cozinha" ? "Cozinha" : role === "estoque" ? "Estoque" : role}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {currentRegister ? (
              <Badge variant="default" className="gap-1"><DollarSign className="h-3 w-3" />Caixa Aberto</Badge>
            ) : (
              <Badge variant="secondary" className="gap-1"><DollarSign className="h-3 w-3" />Caixa Fechado</Badge>
            )}
            <Button variant="outline" size="sm" onClick={fetchOrders}><RefreshCw className="h-4 w-4 mr-1" />Atualizar</Button>
            <Button variant="ghost" size="sm" onClick={() => onLogout()}><LogOut className="h-4 w-4 mr-1" />Sair</Button>
          </div>
        </div>

        <div className="container mx-auto px-4 border-t overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            <Button variant={mainTab === "tabs" ? "default" : "ghost"} size="sm" className="rounded-none" onClick={() => setMainTab("tabs")}>
              <QrCode className="h-4 w-4 mr-1" />Comandas
              {tabs.filter((t) => t.status !== "free").length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">{tabs.filter((t) => t.status !== "free").length}</Badge>
              )}
            </Button>
            <Button variant={mainTab === "orders" ? "default" : "ghost"} size="sm" className="rounded-none" onClick={() => setMainTab("orders")}>
              <ClipboardList className="h-4 w-4 mr-1" />Pedidos Online
              {getOrderCount("pending") > 0 && <Badge variant="destructive" className="ml-1 text-xs">{getOrderCount("pending")}</Badge>}
            </Button>
            {isAdminOrOperator && (
              <Button variant={mainTab === "cash" ? "default" : "ghost"} size="sm" className="rounded-none" onClick={() => setMainTab("cash")}>
                <DollarSign className="h-4 w-4 mr-1" />Caixa
                {tabsAwaitingPayment.length > 0 && <Badge variant="destructive" className="ml-1 text-xs">{tabsAwaitingPayment.length}</Badge>}
              </Button>
            )}
            {(isAdmin || role === "estoque") && (
              <Button variant={mainTab === "products" ? "default" : "ghost"} size="sm" className="rounded-none" onClick={() => setMainTab("products")}>
                <Package className="h-4 w-4 mr-1" />Produtos
              </Button>
            )}
            {(isAdmin || role === "estoque") && (
              <Button variant={mainTab === "stock" ? "default" : "ghost"} size="sm" className="rounded-none" onClick={() => setMainTab("stock")}>
                <BarChart3 className="h-4 w-4 mr-1" />Estoque
              </Button>
            )}
            {(isAdmin || role === "estoque") && (
              <Button variant={mainTab === "recipes" ? "default" : "ghost"} size="sm" className="rounded-none" onClick={() => setMainTab("recipes")}>
                <Utensils className="h-4 w-4 mr-1" />Ficha Técnica
              </Button>
            )}
            {isAdmin && (
              <>
                <Button variant={mainTab === "dashboard" ? "default" : "ghost"} size="sm" className="rounded-none" onClick={() => setMainTab("dashboard")}>
                  <TrendingUp className="h-4 w-4 mr-1" />Dashboard
                </Button>
                <Button variant={mainTab === "crm" ? "default" : "ghost"} size="sm" className="rounded-none" onClick={() => setMainTab("crm")}>
                  <Users className="h-4 w-4 mr-1" />Clientes
                </Button>
                <Button variant={mainTab === "waste" ? "default" : "ghost"} size="sm" className="rounded-none" onClick={() => setMainTab("waste")}>
                  <AlertTriangle className="h-4 w-4 mr-1" />Desperdício
                </Button>
                <Button variant={mainTab === "forecast" ? "default" : "ghost"} size="sm" className="rounded-none" onClick={() => setMainTab("forecast")}>
                  <ShoppingCart className="h-4 w-4 mr-1" />Compras
                </Button>
                <Button variant={mainTab === "profit" ? "default" : "ghost"} size="sm" className="rounded-none" onClick={() => setMainTab("profit")}>
                  <DollarSign className="h-4 w-4 mr-1" />Lucro
                </Button>
                <Button variant={mainTab === "reports" ? "default" : "ghost"} size="sm" className="rounded-none" onClick={() => setMainTab("reports")}>
                  <BarChart3 className="h-4 w-4 mr-1" />Relatórios
                </Button>
              </>
            )}
            {isAdmin && (
              <Button variant={mainTab === "settings" ? "default" : "ghost"} size="sm" className="rounded-none" onClick={() => setMainTab("settings")}>
                <Settings className="h-4 w-4 mr-1" />Config
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-6">
        {mainTab === "tabs" && (
          <TabList tabs={tabs} loading={tabsLoading} role={role} onRefresh={fetchTabs}
            onOpenTab={openTab} onSelectTab={setSelectedTab} onCancelTab={cancelTab} />
        )}

        {mainTab === "orders" && (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as OrderStatus | "all")}>
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7 mb-6">
              <TabsTrigger value="all">Todos <Badge variant="secondary" className="ml-1.5 text-xs">{getOrderCount("all")}</Badge></TabsTrigger>
              <TabsTrigger value="pending">Novos <Badge variant="secondary" className="ml-1.5 text-xs">{getOrderCount("pending")}</Badge></TabsTrigger>
              <TabsTrigger value="preparing">Preparo <Badge variant="secondary" className="ml-1.5 text-xs">{getOrderCount("preparing")}</Badge></TabsTrigger>
              <TabsTrigger value="ready">Prontos <Badge variant="secondary" className="ml-1.5 text-xs">{getOrderCount("ready")}</Badge></TabsTrigger>
              <TabsTrigger value="out_for_delivery">Saiu <Badge variant="secondary" className="ml-1.5 text-xs">{getOrderCount("out_for_delivery")}</Badge></TabsTrigger>
              <TabsTrigger value="delivered">Entregue <Badge variant="secondary" className="ml-1.5 text-xs">{getOrderCount("delivered")}</Badge></TabsTrigger>
              <TabsTrigger value="completed">Finalizados <Badge variant="secondary" className="ml-1.5 text-xs">{getOrderCount("completed")}</Badge></TabsTrigger>
            </TabsList>
            <TabsContent value={activeTab} className="mt-0">
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">Carregando pedidos...</div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="text-lg">Nenhum pedido encontrado</p>
                  <p className="text-sm mt-1">Os novos pedidos aparecerão automaticamente aqui</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredOrders.map((order) => {
                    const isDelivery = !!order.guest_address_street || !!order.address_id;
                    const isPickup = order.guest_neighborhood_name === "Retirada no local" || order.notes?.includes("[RETIRADA NO LOCAL]");
                    const isReadyToFinalize = order.status === "delivered" || (isPickup && order.status === "ready");
                    return (
                      <OrderCard
                        key={order.id}
                        order={order}
                        role={role}
                        onStatusChange={handleStatusChange}
                        onSetDeliveryType={handleSetDeliveryType}
                        onProcessPayment={isReadyToFinalize ? () => handleProcessPayment(order) : undefined}
                        onCancelOrder={handleCancelOrder}
                      />
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        {mainTab === "cash" && (
          <div className="space-y-6">
            {cashLoading ? (
              <div className="text-center py-12 text-muted-foreground">Carregando caixa...</div>
            ) : !currentRegister ? (
              <div className="text-center py-12">
                <p className="text-lg text-muted-foreground mb-4">Nenhum caixa aberto</p>
                {isAdmin ? (
                  <CashRegisterOpen onOpen={openRegister} />
                ) : (
                  <p className="text-sm text-muted-foreground">Somente administradores podem abrir o caixa.</p>
                )}
              </div>
            ) : (
              <>
                {tabsAwaitingPayment.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <QrCode className="h-5 w-5" />
                      Comandas Aguardando Pagamento
                      <Badge variant="destructive">{tabsAwaitingPayment.length}</Badge>
                    </h3>
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {tabsAwaitingPayment.map((tab) => (
                        <div key={tab.id} className="border rounded-lg p-4 bg-card hover:border-primary/50 cursor-pointer transition-colors" onClick={() => handleTabPayment(tab)}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-mono font-bold text-xl">{tab.code}</span>
                            <Badge className="bg-yellow-500 text-white">Aguardando</Badge>
                          </div>
                          {tab.customer_name && <p className="text-sm text-muted-foreground mb-1">Cliente: {tab.customer_name}</p>}
                          <p className="text-sm text-muted-foreground">{tab.items.length} item(s)</p>
                          <p className="text-xl font-bold text-primary mt-2">
                            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(tab.subtotal)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {isAdmin && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="border rounded-lg p-3 bg-card">
                      <div className="text-xs text-muted-foreground">Vendas de Produtos</div>
                      <div className="text-lg font-bold text-green-600">
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(productSalesTotal)}
                      </div>
                    </div>
                    <div className="border rounded-lg p-3 bg-card">
                      <div className="text-xs text-muted-foreground">Taxa Entrega Recebida</div>
                      <div className="text-lg font-bold text-blue-600">
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(deliveryRevenueTotal)}
                      </div>
                    </div>
                    <div className="border rounded-lg p-3 bg-card">
                      <div className="text-xs text-muted-foreground">Pago a Entregadores</div>
                      <div className="text-lg font-bold text-destructive">
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(deliveryExpensesTotal)}
                      </div>
                    </div>
                    <div className="border rounded-lg p-3 bg-card">
                      <div className="text-xs text-muted-foreground">Faturamento Real</div>
                      <div className="text-lg font-bold text-primary">
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(productSalesTotal + deliveryRevenueTotal - deliveryExpensesTotal)}
                      </div>
                    </div>
                  </div>
                )}

                <CashRegisterPanel
                  register={currentRegister} movements={movements} totals={totals}
                  cashInDrawer={cashInDrawer} drawerOpen={drawerOpen} role={role}
                  operatorEmail={user.email || ""}
                  onClose={closeRegister} onRegisterMovement={registerMovement}
                />
              </>
            )}
            {isAdmin && !currentRegister && <CashRegisterHistory />}
          </div>
        )}

        {mainTab === "products" && (
          <ProductList products={products} categories={categories} loading={productsLoading}
            onCreateProduct={createProduct} onUpdateProduct={updateProduct}
            onToggleActive={toggleProductActive} onUpdateStock={updateStock} />
        )}

        {mainTab === "stock" && (
          <StockManagement
            products={products}
            userId={user.id}
            onRefreshProducts={refreshProducts}
            ingredients={ingredients}
            onCreateIngredient={createIngredient}
            onUpdateIngredient={updateIngredient}
            onDeleteIngredient={deleteIngredient}
            onRefreshIngredients={refreshIngredients}
          />
        )}

        {mainTab === "dashboard" && isAdmin && <DashboardGerencial />}

        {mainTab === "recipes" && (isAdmin || role === "estoque") && (
          <RecipeManagement
            products={products}
            ingredients={ingredients}
            getProductRecipes={getProductRecipes}
            getProductCost={getProductCost}
            onAddRecipeItem={addRecipeItem}
            onRemoveRecipeItem={removeRecipeItem}
            onCreateIngredient={createIngredient}
            onUpdateIngredient={updateIngredient}
            onDeleteIngredient={deleteIngredient}
          />
        )}

        {mainTab === "crm" && isAdmin && (
          <CustomerCRM customers={customers} loading={customersLoading} searchByPhone={searchByPhone} />
        )}

        {mainTab === "waste" && isAdmin && <WasteControl products={products} />}

        {mainTab === "forecast" && isAdmin && (
          <PurchaseForecast ingredients={ingredients} recipes={recipes} />
        )}

        {mainTab === "profit" && isAdmin && (
          <ProfitReport ingredients={ingredients} recipes={recipes} getProductCost={getProductCost} />
        )}

        {mainTab === "reports" && isAdmin && <CashCloseReports />}

        {mainTab === "settings" && isAdmin && (
          <div className="space-y-6">
            <RestaurantSettingsPanel />
            <div className="border-t pt-6">
              <OperatorManagement currentUserId={user.id} onCreateUser={onCreateUser} onRemoveRole={onRemoveRole} />
            </div>
            <div className="border-t pt-6"><SoundAlertConfig /></div>
            <div className="border-t pt-6"><PrinterScaleConfig /></div>
            <div className="border-t pt-6"><ClosedDatesManager /></div>
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Sua Conta</h3>
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setPasswordDialogOpen(true)}>
                  <Key className="h-4 w-4 mr-1" />Alterar Senha
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>

      {paymentOrder && (
        <PaymentProcessor
          open={!!paymentOrder}
          onOpenChange={(open) => !open && setPaymentOrder(null)}
          orderId={paymentOrder.id}
          orderTotal={paymentOrder.total}
          orderData={{
            id: paymentOrder.id,
            items: paymentOrder.items,
            subtotal: paymentOrder.subtotal,
            total: paymentOrder.total,
            delivery_fee: paymentOrder.delivery_fee,
            guest_name: paymentOrder.guest_name,
          }}
          onProcess={registerPayment}
          onComplete={handlePaymentComplete}
        />
      )}

      {paymentTab && (
        <TabPaymentProcessor
          open={!!paymentTab}
          onOpenChange={(open) => !open && setPaymentTab(null)}
          tab={paymentTab}
          onProcess={registerPayment}
          onComplete={handleTabPaymentComplete}
        />
      )}

      <ChangePasswordDialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen} onChangePassword={onUpdatePassword} />

      <TabEditor
        tab={selectedTab} products={products} categories={categories} role={role}
        onClose={() => setSelectedTab(null)} onUpdateItems={updateTabItems}
        onRequestPayment={requestPayment} onCancelTab={cancelTab}
      />
    </div>
  );
}
