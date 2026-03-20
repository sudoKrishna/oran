"use client";

import { useEffect, useRef } from "react";
import { Terminal } from "xterm";
import "xterm/css/xterm.css";

export default function WebTerminal() {
    const terminalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const term = new Terminal({
            theme: {
                background: "#1e1e1e",
            },
        });

        term.open(terminalRef.current!);

        term.write("Welcome to your terminal \r\n");
        term.write("$ ");

        term.onData((data) => {
            if (data === "\r") {
                term.write("\r\n$ "); // Enter key
            } else if (data === "\u007F") {
                // Backspace
                term.write("\b \b");
            } else {
                term.write(data);
            }
        });

        return () => term.dispose();
    }, []);

    return <div ref={terminalRef} className="h-full w-full" />;
}