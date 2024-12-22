'use client';

import { pusherClient } from "../lib/pusher/client";
import React, { useEffect, useState } from "react";

interface Message {
    message: string;
    date: string;
}

interface MessageListProps {}

export default function MessageList({ }: MessageListProps) {
    const [messages, setMessages] = useState<Message[]>([]);

    useEffect(() => {
        const channel = pusherClient
            .subscribe('directives')
            .bind("evt::direct", (data: Message) => {
                console.log("test", data);
                setMessages((prevMessages) => [...prevMessages, data]); // Use functional update to avoid stale state
            });

        return () => {
            channel.unbind();
        };
    }, []);

    const handleTestClick = async () => {
        let data = await fetch('/api/direct', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: 'test' })
        });
        let json = await data.json();
        console.log(json);
    };

    return (
        <div className="flex flex-col">
            <button
                className="w-[240px] bg-slate-600 hover:bg-slate-500 rounded p-2 m-2"
                onClick={() => handleTestClick()}>
                Test
            </button>

            <div>
                {messages.map((message, index) => (
                    <div
                        className="border border-slate-600 rounded p-2 m-2"
                        key={index}>
                        {message.message}
                        <br />
                        {message.date}
                    </div>
                ))}
            </div>
        </div>
    );
};
