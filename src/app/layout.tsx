import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "../styles/globals.scss";
import { Providers } from "./providers";
import React from 'react';
import { ToastContainer, Flip, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


const geistSans = localFont({
	src: "fonts/GeistVF.woff",
	variable: "--font-geist-sans",
	weight: "100 900",
});
const geistMono = localFont({
	src: "fonts/GeistMonoVF.woff",
	variable: "--font-geist-mono",
	weight: "100 900",
});
const dos = localFont({
	src: "fonts/Good-Old-DOS.woff",
	variable: "--font-dos",
	weight: "100 300 500 700 900",
});
const play = localFont({
	src: "fonts/Play-Regular.ttf",
	variable: "--font-play",
	weight: "400",
});
const playBold = localFont({
	src: "fonts/Play-Bold.ttf",
	variable: "--font-play-bold",
	weight: "700",
});

const reboot = localFont({
	src: "fonts/reboot-crush.ttf",
	variable: "--font-linebeam",
	weight: "400",
});

const linebeam = localFont({
	src: "fonts/Linebeam.ttf",
	variable: "--font-linebeam",
	weight: "400",
});

export const metadata: Metadata = {
	title: "Nerd Trivia 3000",
	description: "Trivia for nerds, by a nerd.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {


	return (
		<html lang="en" className="dark" suppressHydrationWarning>
			<head>
				<link rel="stylesheet" type="text/css" href="/augmented-ui.min.css" />

			</head>
			<body
				className={`${play.variable} ${dos.variable} ${playBold.variable} ${reboot.variable} ${linebeam.variable} font-sans antialiased grid-bg`}
			>
				<Providers>
					{children}
					<ToastContainer limit={3} />
				</Providers>
			</body>
		</html>
	);
}
