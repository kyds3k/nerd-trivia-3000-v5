import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "../styles/globals.scss";
import { Providers } from "./providers";

const geistSans = localFont({
	src: "./fonts/GeistVF.woff",
	variable: "--font-geist-sans",
	weight: "100 900",
});
const geistMono = localFont({
	src: "./fonts/GeistMonoVF.woff",
	variable: "--font-geist-mono",
	weight: "100 900",
});
const dos = localFont({
  src: "./fonts/Good Old Dos.woff",
  variable: "--font-dos",
  weight: "100 300 500 700 900",
});
export const metadata: Metadata = {
	title: "Create Next App",
	description: "Generated by create next app",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className="dark">
			<body
				className={`${dos.variable} font-sans antialiased`} 
			>
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}