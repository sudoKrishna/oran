"use client";


import { useState, useEffect, useRef } from "react";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import 'xterm/css/xterm.css';


const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:8080';

export default function FloatingTerminal() {
    const containerRef = useRef<HTMLDivElement>(null);
    const termRef = useRef<Terminal | null>(null);
    const fitAddon = useRef<FitAddon | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const [open, setOpen] = useState(false);
    const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');

    useEffect(() => {
        if (!open) return;
        if (!containerRef.current) return;
        if (termRef.current) {
            fitAddon.current?.fit();
            termRef.current.focus();
            return;
        }
        const term = new Terminal({
            cursorBlink: true,
            fontSize: 13,
            fontFamily: 'Menlo, Monaco, "Courier New", monospace',
            theme: {
                background: '#141414',
                foreground: '#d4d4d4',
                cursor: '#d4d4d4',
            },
        })
    })

    const fa = new FitAddon();
    term.loadAddon(fa);
    term.open(containerRef.current);
    fa.fit();
    termRef.current = term;
    fitAddon.current = fa;

    setStatus('connecting');
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    
}