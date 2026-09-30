import * as React from "react";
import { Slot } from "@radix-ui/react-slot@1.1.2";
import { cva, type VariantProps } from "class-variance-authority@0.7.1";

import { cn } from "./utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background text-foreground hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> &
    VariantProps<typeof buttonVariants> & {
      asChild?: boolean;
    }
>(({ className, variant, size, asChild = false, onClick, disabled, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";

  // Protecção contra duplo clique / cliques repetidos: em todos os botões do
  // sistema, sem precisar de alterar cada ecrã. Ao clicar, o botão bloqueia-se
  // de imediato (fica desactivado) para nunca disparar a mesma acção duas
  // vezes (ex: gravar o mesmo registo duas vezes). Se o onClick devolver uma
  // Promise (ex: um guardar/submeter no servidor), o botão só desbloqueia
  // quando essa Promise terminar; caso contrário (acção síncrona, ou botões
  // type="submit" cuja lógica real está no onSubmit do formulário), fica
  // bloqueado por um curto intervalo, suficiente para travar um duplo clique
  // sem prejudicar o uso normal do botão a seguir.
  const [bloqueado, setBloqueado] = React.useState(false);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout>>();

  React.useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (bloqueado) return;

    // Botao type="submit" sem onClick proprio (a logica real esta no
    // onSubmit do formulario, ex: ecra de login): desactivar o botao
    // sincronamente dentro do proprio evento de click cancela a accao por
    // omissao do browser (submeter o formulario) antes de ela chegar a
    // acontecer - React aplica o novo estado (disabled) ainda dentro do
    // mesmo evento nativo. Por isso aqui o bloqueio e adiado para o tick
    // seguinte, depois da submissao nativa ja ter arrancado.
    if (!onClick) {
      setTimeout(() => {
        setBloqueado(true);
        timeoutRef.current = setTimeout(() => setBloqueado(false), 800);
      }, 0);
      return;
    }

    let resultado: unknown;
    try {
      resultado = onClick(event);
    } finally {
      if (resultado && typeof (resultado as any).then === "function") {
        setBloqueado(true);
        (resultado as Promise<unknown>).catch(() => {}).finally(() => setBloqueado(false));
      } else {
        setBloqueado(true);
        timeoutRef.current = setTimeout(() => setBloqueado(false), 800);
      }
    }
  };

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      onClick={handleClick}
      disabled={disabled || bloqueado}
      aria-busy={bloqueado || undefined}
      {...props}
    />
  );
});
Button.displayName = "Button";

export { Button, buttonVariants };
