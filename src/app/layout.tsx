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
const play = localFont({
	src: "./fonts/Play-Regular.ttf",
	variable: "--font-play",
	weight: "400",
});
const playBold = localFont({
	src: "./fonts/Play-Bold.ttf",
	variable: "--font-play-bold",
	weight: "700",
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
		<html lang="en" className="dark">
			<head>
				{/* Define onSpotifyWebPlaybackSDKReady globally */}
				<script
					dangerouslySetInnerHTML={{
						__html: `
            window.onSpotifyWebPlaybackSDKReady = function() {
              console.log("Spotify Web Playback SDK is ready.");
            };
          `,
					}}
				></script>
				{/* Add Spotify Web Playback SDK script */}
				<script
					id="spotify-sdk"
					src="https://sdk.scdn.co/spotify-player.js"
					async
				></script>
			</head>
			<body
				className={`${play.variable} font-sans antialiased`}
			>
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
