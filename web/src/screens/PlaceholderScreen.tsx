type Props = { title: string };

export function PlaceholderScreen({ title }: Props) {
  return (
    <section class="screen">
      <div class="card">
        <h1 class="title">{title}</h1>
        <p class="muted">Tela ainda não migrada.</p>
      </div>
    </section>
  );
}
