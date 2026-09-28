import React from "react";
import { ShieldCheck, ShoppingCart, Truck, UserCheck } from "lucide-react";

export const TrustSection: React.FC = () => {
  return (
    <section id="confianza" className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#0B7A45] block mb-2">
            Compromiso CondiRico
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#12352C] tracking-tight text-balance">
            Una experiencia de compra confiable y sin complicaciones
          </h2>
          <p className="mt-3 text-base text-[#66736D] font-normal">
            Garantizamos la calidad en cada producto y la tranquilidad de un servicio cercano.
          </p>
        </div>

        {/* 4 Trust Blocks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          
          {/* Block 1 */}
          <div className="rounded-3xl bg-white border border-[#E5EAE6] p-6 sm:p-7 shadow-xs">
            <div className="size-12 rounded-2xl bg-[#F0F6F2] grid place-items-center text-[#075B3A] mb-5">
              <ShieldCheck className="size-6" />
            </div>
            <h3 className="text-lg font-bold text-[#12352C]">
              Calidad seleccionada
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-[#66736D] leading-relaxed">
              Supervisamos cuidadosamente el origen, caducidad y empaque de cada artículo para asegurar frescura total.
            </p>
          </div>

          {/* Block 2 */}
          <div className="rounded-3xl bg-white border border-[#E5EAE6] p-6 sm:p-7 shadow-xs">
            <div className="size-12 rounded-2xl bg-[#F0F6F2] grid place-items-center text-[#075B3A] mb-5">
              <ShoppingCart className="size-6" />
            </div>
            <h3 className="text-lg font-bold text-[#12352C]">
              Compra sencilla
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-[#66736D] leading-relaxed">
              Agrega productos con un clic o solicita pedidos directos por WhatsApp con cotizaciones transparentes.
            </p>
          </div>

          {/* Block 3 */}
          <div className="rounded-3xl bg-white border border-[#E5EAE6] p-6 sm:p-7 shadow-xs">
            <div className="size-12 rounded-2xl bg-[#F0F6F2] grid place-items-center text-[#075B3A] mb-5">
              <Truck className="size-6" />
            </div>
            <h3 className="text-lg font-bold text-[#12352C]">
              Entrega confiable
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-[#66736D] leading-relaxed">
              Puntualidad en los despachos para que tu despensa o negocio nunca se queden sin abastecimiento.
            </p>
          </div>

          {/* Block 4 */}
          <div className="rounded-3xl bg-white border border-[#E5EAE6] p-6 sm:p-7 shadow-xs">
            <div className="size-12 rounded-2xl bg-[#F0F6F2] grid place-items-center text-[#075B3A] mb-5">
              <UserCheck className="size-6" />
            </div>
            <h3 className="text-lg font-bold text-[#12352C]">
              Atención humana
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-[#66736D] leading-relaxed">
              Un equipo real detrás de cada consulta para responder dudas y personalizar tus pedidos con agilidad.
            </p>
          </div>

        </div>

      </div>
    </section>
  );
};
