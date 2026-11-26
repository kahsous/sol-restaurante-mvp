import { Clock, MapPin, CreditCard, FileText, DollarSign, Truck, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { Order, OrderStatus, DeliveryType } from "@/types/pdv";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  PAYMENT_METHOD_LABELS,
  DELIVERY_STATUS_FLOW,
  PICKUP_STATUS_FLOW,
  DELIVERY_TYPE_LABELS,
} from "@/types/pdv";

interface OrderCardProps {
  order: Order;
  role: string;
  onStatusChange: (orderId: string, newStatus: OrderStatus) => void;
  onSetDeliveryType: (orderId: string, deliveryType: DeliveryType) => void;
  onProcessPayment?: () => void;
  onCancelOrder?: (orderId: string) => void;
}

export function OrderCard({ order, role, onStatusChange, onSetDeliveryType, onProcessPayment, onCancelOrder }: OrderCardProps) {

  const formatPrice = (price: number) =>
    `R$ ${price.toFixed(2).replace(".", ",")}`;

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  const isGuestOrder = !order.user_id && order.guest_name;
  const isDelivery = !!order.address_id || !!order.guest_address_street;
  const isPickup = order.guest_neighborhood_name === "Retirada no local" || order.notes?.includes("[RETIRADA NO LOCAL]");

  // Determine status flow based on order type
  const statusFlow = (isDelivery && !isPickup) ? DELIVERY_STATUS_FLOW : PICKUP_STATUS_FLOW;
  const currentStatusIndex = statusFlow.indexOf(order.status);
  const nextStatus = statusFlow[currentStatusIndex + 1];
  const prevStatus = statusFlow[currentStatusIndex - 1];

  // For delivery orders, require delivery type before finalizing
  const needsDeliveryType = isDelivery && !isPickup && !order.delivery_type;
  
  // Show financial info only to admin/operator
  const showFinancials = role === "admin" || role === "operator";

  const addressInfo = isGuestOrder
    ? {
        street: order.guest_address_street || "",
        number: order.guest_address_number || "",
        complement: order.guest_address_complement,
        neighborhoodName: order.guest_neighborhood_name,
      }
    : order.address
    ? {
        street: order.address.street,
        number: order.address.number,
        complement: order.address.complement,
        neighborhoodName: order.address.neighborhood?.name,
      }
    : null;

  const phoneDigits = (order.guest_phone || "").replace(/\D/g, "");
  const whatsappLink = phoneDigits.length >= 10
    ? `https://wa.me/55${phoneDigits.replace(/^55/, "")}`
    : null;

  // Can only finalize (completed) from the cash register
  const isReadyToFinalize = order.status === "delivered" || (isPickup && order.status === "ready");

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2 space-y-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm text-muted-foreground">
              #{(order.external_id?.slice(-6) || order.id.slice(0, 8)).toUpperCase()}
            </span>
            <Badge className={`${ORDER_STATUS_COLORS[order.status]} text-white border-0`}>
              {ORDER_STATUS_LABELS[order.status]}
            </Badge>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground text-sm">
            <Clock className="h-3.5 w-3.5" />
            {formatTime(order.created_at)}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Customer Info */}
        {isGuestOrder && (
          <div className="bg-primary/10 p-2 rounded-md space-y-1">
            <p className="font-medium text-sm">{order.guest_name}</p>
            <p className="text-xs text-muted-foreground">📱 {order.guest_phone}</p>
          </div>
        )}

        {/* Order Type */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={isDelivery && !isPickup ? "default" : "secondary"}>
            {isDelivery && !isPickup ? "🛵 Delivery" : "🏪 Retirada"}
          </Badge>
          {isGuestOrder && <Badge variant="outline" className="text-xs">Visitante</Badge>}
          {order.delivery_type && isDelivery && !isPickup && (
            <Badge variant="outline" className="text-xs">
              <Truck className="h-3 w-3 mr-1" />
              {DELIVERY_TYPE_LABELS[order.delivery_type]}
            </Badge>
          )}
        </div>

        {/* Delivery Type Selector (internal, for admin/operator) */}
        {isDelivery && !isPickup && showFinancials && needsDeliveryType && order.status !== "completed" && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-2">Definir tipo de entrega:</p>
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant="outline" onClick={() => onSetDeliveryType(order.id, "own")} className="text-xs">
                Própria
              </Button>
              <Button size="sm" variant="outline" onClick={() => onSetDeliveryType(order.id, "third_party")} className="text-xs">
                Terceirizada
              </Button>
            </div>
          </div>
        )}

        {/* Address */}
        {isDelivery && !isPickup && addressInfo && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded-md">
            <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
            <span>
              {addressInfo.street}, {addressInfo.number}
              {addressInfo.complement && ` - ${addressInfo.complement}`}
              {addressInfo.neighborhoodName && <> • {addressInfo.neighborhoodName}</>}
            </span>
          </div>
        )}

        <Separator />

        {/* Items */}
        <div className="space-y-1.5">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span>
                <span className="font-medium">{item.quantity}x</span> {item.name}
                <span className="text-muted-foreground ml-1">
                  ({item.size === "pequena" ? "Pequena" : item.size === "media" ? "Média" : "Grande"})
                </span>
              </span>
              {showFinancials && (
                <span className="text-muted-foreground">
                  {formatPrice((item.size === "pequena" ? item.pricePequena : item.size === "media" ? item.priceMedia : item.priceGrande) * item.quantity)}
                </span>
              )}
            </div>
          ))}
        </div>

        <Separator />

        {/* Notes */}
        {order.notes && (
          <div className="flex items-start gap-2 text-sm bg-accent/50 p-2 rounded-md border border-border">
            <FileText className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
            <span className="text-foreground">{order.notes}</span>
          </div>
        )}

        {/* Payment & Totals - only for admin/operator */}
        {showFinancials && (
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            {order.delivery_fee > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Taxa de entrega</span>
                <span>{formatPrice(order.delivery_fee)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-base">
              <span>Total</span>
              <span className="text-primary">{formatPrice(order.total)}</span>
            </div>
          </div>
        )}

        {showFinancials && (
          <div className="flex items-center gap-2 text-sm">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <span>{PAYMENT_METHOD_LABELS[order.payment_method]}</span>
            {order.payment_method === "cash" && order.cash_change && (
              <span className="text-muted-foreground">(Troco para {formatPrice(order.cash_change)})</span>
            )}
          </div>
        )}

        {/* Status Actions */}
        {order.status !== "completed" && order.status !== "cancelled" && (
          <div className="space-y-2 pt-2">
            <div className="flex gap-2">
              {prevStatus && order.status !== "pending" && (
                <Button variant="outline" size="sm" className="flex-1" onClick={() => onStatusChange(order.id, prevStatus)}>
                  ← {ORDER_STATUS_LABELS[prevStatus]}
                </Button>
              )}
              {isReadyToFinalize && onProcessPayment ? (
                <Button size="sm" className="flex-1" onClick={onProcessPayment}>
                  <DollarSign className="h-4 w-4 mr-1" />
                  Finalizar no Caixa
                </Button>
              ) : nextStatus && nextStatus !== "completed" ? (
                <Button 
                  size="sm" 
                  className="flex-1" 
                  onClick={() => onStatusChange(order.id, nextStatus)}
                >
                  {ORDER_STATUS_LABELS[nextStatus]} →
                </Button>
              ) : null}
            </div>
            <div className="flex gap-2">
              {whatsappLink && (
                <Button asChild variant="outline" size="sm" className="flex-1">
                  <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-4 w-4 mr-1" />
                    WhatsApp
                  </a>
                </Button>
              )}
              {onCancelOrder && (
                <Button variant="outline" size="sm" className="flex-1 text-destructive" onClick={() => onCancelOrder(order.id)}>
                  Cancelar
                </Button>
              )}
            </div>
          </div>
        )}


      </CardContent>
    </Card>
  );
}
