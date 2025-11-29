import PresenterBroadcaster from "./PresenterBroadcaster";

export default function PresenterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PresenterBroadcaster />
      {children}
    </>
  );
}
