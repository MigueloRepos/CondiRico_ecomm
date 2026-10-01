# CONDIRICO ECOMMERCE — SISTEMA UNIFICADO DE PAGOS

Documentación técnica y operativa del sistema de procesamiento de pagos centralizado con **PayPal (PayPal Checkout, Tarjetas de Crédito/Débito y Google Pay)** sobre **React + TypeScript + Supabase**.

---

## 1. Arquitectura del Sistema

```text
React + TypeScript (Vite)
        │
        ▼
CondiRico Checkout (CheckoutModal / PaymentMethods)
        │
        ├── [1] PayPal Checkout (Smart Payment Buttons)
        ├── [2] Tarjetas Débito / Crédito (PayPal Hosted/Card Fields)
        └── [3] Google Pay (Device/Wallet Detection & PaymentRequest)
        │
        ▼
Backend / Supabase Edge Functions
        │
        ├── paypal-create-order  (Cálculo de precio en servidor + validación de stock)
        ├── paypal-capture-order (Captura de fondos con PayPal REST API v2)
        └── paypal-webhook       (Verificación de firma criptográfica + Idempotencia)
        │
        ▼
Supabase PostgreSQL
        │
        ├── public.payments               (Registro auditado con RLS)
        ├── public.orders                 (Estado comercial sincronizado)
        └── public.payment_webhook_events (Control de eventos duplicados)
```

---

## 2. Métodos de Pago Soportados

| Método | Proveedor | Detección Dinámica | Almacenamiento de Datos Sensibles |
| :--- | :--- | :--- | :--- |
| **PayPal** | PayPal REST API v2 | Siempre disponible si `PAYPAL_CLIENT_ID` está configurado | Ninguno en Supabase |
| **Tarjetas** | PayPal Card Fields | Tarjetas Visa, Mastercard, AMEX | Cero datos de tarjeta en Supabase |
| **Google Pay** | Google Pay via PayPal / W3C PaymentRequest | Se muestra **únicamente** si el dispositivo y navegador son compatibles | Tokenizado vía PayPal Gateway |

---

## 3. Seguridad y DevSecOps

1. **Precios Servidor (No Confianza en el Frontend)**:
   - El cliente únicamente envía `{ productId, quantity }`.
   - El backend consulta `products.price` y `products.stock` directamente en PostgreSQL.
   - Cualquier intento de manipular `subtotal`, `total` o `price` en DevTools es ignorado.

2. **Validación Atómica de Stock**:
   - Función PostgreSQL `create_secure_payment_order` ejecuta un bloqueo transaccional para verificar stock y reducir inventario de forma segura, evitando *race conditions* y sobreventas.

3. **Protección de Secretos**:
   - `PAYPAL_CLIENT_SECRET` reside exclusivamente en variables de entorno seguras en el servidor / Edge Functions.
   - Jamás se expone en `src/`, bundles de Vite, ni en `localStorage`.

4. **Idempotencia contra Doble Pago**:
   - Cada intento de pago genera una clave única `idempotency_key`.
   - Evita cobros duplicados por doble clic, recarga de página o webhook repetido.

5. **Row Level Security (RLS)**:
   - Los clientes solo pueden leer sus propios pagos (`user_id = auth.uid()`).
   - Solo administradores o funciones seguras (`SECURITY DEFINER`) pueden actualizar el estado de pago.

---

## 4. Variables de Entorno

### Configuración `.env`

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# PayPal Server Configuration
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_ENVIRONMENT=sandbox
PAYPAL_WEBHOOK_ID=your_paypal_webhook_id

# Google Pay (Opcional Merchant ID de Producción)
GOOGLE_PAY_MERCHANT_ID=your_google_merchant_id
```

---

## 5. Configuración en PayPal Developer Dashboard

1. Ingresar a [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/).
2. Ir a **Apps & Credentials** y seleccionar **Sandbox** (o **Live** para producción).
3. Crear una nueva aplicación: `CondiRico Ecommerce`.
4. Copiar el `Client ID` y `Secret Key`.
5. En la configuración de la aplicación, habilitar:
   - **PayPal Checkout**
   - **Advanced Credit and Debit Card Payments**
   - **Google Pay** (en cuentas elegibles)
6. En **Webhooks**, registrar la URL del webhook:
   - `https://your-domain.com/api/payments/paypal/webhook` o URL de Edge Function.
   - Suscribir a los eventos:
     - `PAYMENT.CAPTURE.COMPLETED`
     - `PAYMENT.CAPTURE.DENIED`
     - `PAYMENT.CAPTURE.REFUNDED`

---

## 6. Migraciones y Estructura de Base de Datos

### Tabla `payments`
```sql
CREATE TABLE IF NOT EXISTS public.payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id bigint NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id),
    provider text NOT NULL DEFAULT 'paypal',
    payment_method text NOT NULL DEFAULT 'paypal',
    provider_payment_id text,
    amount numeric(12,2) NOT NULL,
    currency text NOT NULL DEFAULT 'USD',
    status text NOT NULL DEFAULT 'pending',
    idempotency_key text UNIQUE,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    paid_at timestamptz
);
```

---

## 7. Pruebas y Troubleshooting

### Tarjetas de Prueba en Sandbox
- **Visa**: `4032 0000 0000 0001` (Cualquier fecha futura, CVV 123)
- **Mastercard**: `5424 0000 0000 0001` (Cualquier fecha futura, CVV 123)
- **Fondos Insuficientes**: Tarjetas de prueba designadas por PayPal para forzar declinación.

### Verificación de Compilación y Linter
```bash
npm run lint
npx tsc --noEmit
npm run build
```
