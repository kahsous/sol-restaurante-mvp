import { Navigate } from "react-router-dom";

/**
 * Index page was deprecated. All routes now redirect to appropriate pages.
 * Public: "/" -> Menu.tsx
 * Delivery: "/delivery" -> Menu.tsx
 * PDV: "/admin/pdv" -> Pdv.tsx
 */
export default function Index() {
  return <Navigate to="/admin/pdv" replace />;
}
