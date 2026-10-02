import React, { useState, useEffect, useMemo } from "react";
import {
  Star,
  MessageSquare,
  Send,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  LogIn,
  ThumbsUp,
  UserCheck,
  Sparkles,
} from "lucide-react";
import { ProductReview, ProductReviewStats } from "@/types/database";
import { UserProfile } from "@/lib/auth";
import {
  getProductReviews,
  calculateReviewStats,
  submitProductReview,
  deleteProductReview,
  getUserProductReview,
} from "@/services/reviews";

interface ProductReviewsProps {
  productId: number;
  productName: string;
  currentUser: UserProfile | null;
  onRequireLogin: () => void;
  onReviewsCountChange?: (newCount: number, newAverage: number) => void;
}

const RATING_LABELS: Record<number, string> = {
  1: "Malo",
  2: "Regular",
  3: "Bueno",
  4: "Muy bueno",
  5: "¡Excelente!",
};

export const ProductReviews: React.FC<ProductReviewsProps> = ({
  productId,
  productName,
  currentUser,
  onRequireLogin,
  onReviewsCountChange,
}) => {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form states
  const [selectedRating, setSelectedRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [commentText, setCommentText] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Existing user review (if any)
  const [existingUserReview, setExistingUserReview] = useState<ProductReview | null>(null);

  // Load reviews on mount or productId change
  const loadReviews = async () => {
    setIsLoading(true);
    try {
      const data = await getProductReviews(productId);
      setReviews(data);

      if (currentUser?.id) {
        const myReview = await getUserProductReview(productId, currentUser.id);
        setExistingUserReview(myReview);
        if (myReview) {
          setSelectedRating(myReview.rating);
          setCommentText(myReview.comment);
        }
      }

      const stats = calculateReviewStats(data);
      if (onReviewsCountChange) {
        onReviewsCountChange(stats.totalReviews, stats.averageRating);
      }
    } catch (err) {
      console.warn("[ProductReviews] Error loading reviews:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [productId, currentUser?.id]);

  const stats: ProductReviewStats = useMemo(() => {
    return calculateReviewStats(reviews);
  }, [reviews]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    if (!currentUser) {
      onRequireLogin();
      return;
    }

    if (!commentText.trim() || commentText.trim().length < 3) {
      setFormError("Por favor escribe una opinión de al menos 3 caracteres.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitProductReview({
        productId,
        rating: selectedRating,
        comment: commentText.trim(),
        userName: currentUser.name || "Cliente CondiRico",
        userEmail: currentUser.email,
      });

      if (res.success && res.review) {
        setSuccessMessage(
          existingUserReview
            ? "¡Tu reseña ha sido actualizada con éxito!"
            : "¡Gracias por calificar este producto!"
        );
        setTimeout(() => setSuccessMessage(null), 4000);

        // Update local list
        setReviews((prev) => {
          const filtered = prev.filter((r) => r.id !== res.review?.id && r.user_id !== currentUser.id);
          const next = [res.review!, ...filtered];
          const newStats = calculateReviewStats(next);
          if (onReviewsCountChange) {
            onReviewsCountChange(newStats.totalReviews, newStats.averageRating);
          }
          return next;
        });

        setExistingUserReview(res.review);
      } else {
        setFormError(res.error || "No se pudo registrar la reseña.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error inesperado al enviar la reseña.";
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (reviewId: string) => {
    setDeletingId(reviewId);
    try {
      const res = await deleteProductReview(reviewId);
      if (res.success) {
        setReviews((prev) => {
          const next = prev.filter((r) => r.id !== reviewId);
          const newStats = calculateReviewStats(next);
          if (onReviewsCountChange) {
            onReviewsCountChange(newStats.totalReviews, newStats.averageRating);
          }
          return next;
        });
        if (existingUserReview?.id === reviewId) {
          setExistingUserReview(null);
          setCommentText("");
          setSelectedRating(5);
        }
      }
    } catch (err) {
      console.warn("[ProductReviews] Delete error:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const activeStarCount = hoverRating ?? selectedRating;

  return (
    <div className="space-y-6 pt-4 text-brand-deep">
      {/* 1. Header & Summary Analytics */}
      <div className="rounded-3xl bg-slate-50/80 border border-slate-200/80 p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-center gap-6 justify-between">
          {/* Average Score Badge */}
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="size-20 rounded-2xl bg-white border border-slate-200/90 shadow-xs grid place-items-center shrink-0">
              <span className="text-3xl font-black text-brand-deep">
                {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "5.0"}
              </span>
              <div className="flex items-center gap-0.5 text-amber-400 mt-[-8px]">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`size-3 ${
                      s <= Math.round(stats.averageRating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-slate-200"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-base font-black text-brand-deep">
                  Calificaciones de Clientes
                </h4>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  100% Verificado
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Basado en {stats.totalReviews} {stats.totalReviews === 1 ? "opinión" : "opiniones"} de compradores
              </p>
            </div>
          </div>

          {/* Distribution Bars */}
          <div className="w-full sm:w-56 space-y-1.5 text-[11px] font-bold">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = stats.ratingDistribution[star as 1 | 2 | 3 | 4 | 5] || 0;
              const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2">
                  <div className="flex items-center gap-1 w-7 text-muted-foreground shrink-0">
                    <span>{star}</span>
                    <Star className="size-2.5 fill-amber-400 text-amber-400" />
                  </div>
                  <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-5 text-right text-muted-foreground text-[10px]">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Review Form / Authentication Guard */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
        {!currentUser ? (
          <div className="py-4 text-center space-y-3">
            <div className="size-12 rounded-2xl bg-primary/10 text-primary grid place-items-center mx-auto">
              <LogIn className="size-6" />
            </div>
            <div>
              <h4 className="text-base font-black text-brand-deep">
                ¿Has probado este producto?
              </h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Inicia sesión con tu cuenta de CondiRico para calificar del 1 al 5 y compartir tu opinión con la comunidad.
              </p>
            </div>
            <button
              type="button"
              onClick={onRequireLogin}
              className="inline-flex items-center gap-2 px-6 h-11 rounded-full bg-primary hover:bg-primary/90 text-white font-bold text-xs shadow-md shadow-primary/25 transition-all active:scale-95 cursor-pointer"
            >
              <LogIn className="size-4" />
              <span>Iniciar Sesión para Calificar</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="size-8 rounded-full bg-primary text-white text-xs font-black grid place-items-center uppercase">
                  {currentUser.name ? currentUser.name.charAt(0) : "U"}
                </span>
                <div>
                  <h4 className="text-xs font-black text-brand-deep">
                    {existingUserReview ? "Editar tu reseña" : "Escribe tu reseña"}
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Publicando como <strong>{currentUser.name}</strong>
                  </p>
                </div>
              </div>

              {existingUserReview && (
                <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full">
                  Ya has opinado
                </span>
              )}
            </div>

            {/* Interactive Stars Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-brand-deep">
                Tu puntuación:
              </label>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(null)}
                      onClick={() => setSelectedRating(star)}
                      className="p-1 text-slate-300 hover:scale-115 active:scale-95 transition-all cursor-pointer"
                      aria-label={`Calificar con ${star} estrellas`}
                    >
                      <Star
                        className={`size-7 transition-colors ${
                          star <= activeStarCount
                            ? "fill-amber-400 text-amber-400 drop-shadow-xs"
                            : "text-slate-200 fill-slate-100"
                        }`}
                      />
                    </button>
                  ))}
                </div>

                <span className="text-xs font-black text-amber-700 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
                  {RATING_LABELS[activeStarCount]} ({activeStarCount} de 5)
                </span>
              </div>
            </div>

            {/* Comment Textarea */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-brand-deep">
                Tu opinión o comentario:
              </label>
              <textarea
                rows={3}
                required
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={`¿Qué te pareció ${productName}? Cuéntanos sobre sabor, frescura, calidad, rendimiento...`}
                className="w-full p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs text-brand-deep outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none font-medium"
              />
              <div className="flex justify-between items-center text-[10px] text-muted-foreground px-1">
                <span>Mínimo 3 caracteres</span>
                <span>{commentText.length} caracteres</span>
              </div>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                <span>{successMessage}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              {existingUserReview && (
                <button
                  type="button"
                  onClick={() => handleDelete(existingUserReview.id)}
                  disabled={deletingId === existingUserReview.id}
                  className="px-4 h-10 rounded-full border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="size-3.5" />
                  <span>Eliminar mi reseña</span>
                </button>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !commentText.trim()}
                className="px-6 h-10 rounded-full bg-primary hover:bg-primary/90 text-white text-xs font-black shadow-md shadow-primary/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Send className="size-3.5" />
                    <span>{existingUserReview ? "Actualizar Reseña" : "Publicar Reseña"}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 3. Published Reviews List */}
      <div className="space-y-3.5">
        <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
          Opiniones de la Comunidad ({reviews.length})
        </h4>

        {isLoading ? (
          <div className="py-8 flex flex-col items-center justify-center text-center">
            <Loader2 className="size-6 animate-spin text-primary mb-2" />
            <p className="text-xs text-muted-foreground">Cargando opiniones...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 p-8 text-center space-y-2 bg-slate-50/50">
            <div className="size-12 rounded-2xl bg-amber-50 text-amber-600 grid place-items-center mx-auto border border-amber-200">
              <Sparkles className="size-6" />
            </div>
            <h5 className="text-sm font-black text-brand-deep">Aún no hay reseñas para este producto</h5>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              ¡Sé el primero en compartir tu experiencia y ayudar a otros clientes!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((rev) => {
              const isOwner = currentUser?.id === rev.user_id;
              const isAdmin = currentUser?.role === "admin";
              const formattedDate = new Date(rev.created_at).toLocaleDateString("es-ES", {
                day: "numeric",
                month: "short",
                year: "numeric",
              });

              return (
                <div
                  key={rev.id}
                  className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2.5 transition-all hover:border-slate-300"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="size-9 rounded-full bg-slate-100 text-brand-deep border border-slate-200 grid place-items-center font-black text-xs uppercase">
                        {rev.user_name ? rev.user_name.charAt(0) : "C"}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-brand-deep">
                            {rev.user_name}
                          </span>
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">
                            <UserCheck className="size-2.5" /> Compra verificada
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {formattedDate}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5 text-amber-400">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`size-3.5 ${
                              s <= rev.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"
                            }`}
                          />
                        ))}
                      </div>

                      {(isOwner || isAdmin) && (
                        <button
                          type="button"
                          onClick={() => handleDelete(rev.id)}
                          disabled={deletingId === rev.id}
                          className="size-7 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 grid place-items-center transition-colors cursor-pointer"
                          title="Eliminar reseña"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                    {rev.comment}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
