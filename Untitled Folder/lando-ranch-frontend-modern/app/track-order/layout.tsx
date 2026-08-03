export const metadata = {
  title: 'Track Your Order | Lando Ranch',
  description: 'Track your order status in real-time',
};

export default function TrackOrderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      {children}
    </div>
  );
}