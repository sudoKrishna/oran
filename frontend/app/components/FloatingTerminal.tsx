"use client";


import { setSocket } from "@/lib/terminalSocket";
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

        const fa = new FitAddon();
        term.loadAddon(fa);
        term.open(containerRef.current);
        fa.fit();
        termRef.current = term;
        fitAddon.current = fa;

        setStatus('connecting');
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
            setSocket(ws);
            setStatus('connected');
            term.focus();
        };
        ws.onmessage = (e) => term.write(e.data);
        ws.onerror = () => setStatus('disconnected');
        ws.onclose = () => {
            setStatus('disconnected');
            term.writeln('\r\n\x1b[31mConnection closed.\x1b[0m')
        }
        term.onData((data) => {
            if (ws.readyState === WebSocket.OPEN) ws.send(data);
        });

        const observer = new ResizeObserver(() => fa.fit());
        observer.observe(containerRef.current);

        return () => {
            observer.disconnect();
        };
    }, [open]);

    const close = () => setOpen(false);

    const kill = () => {
        wsRef.current?.close();
        termRef.current?.dispose();
        termRef.current = null;
        fitAddon.current = null;
        setStatus('disconnected');
        setOpen(false);
    };

    const statusColor = {
        connected: '#639922',
        connecting: '#EF9F27',
        disconnected: '#E24B4A',
    }[status];

    return (
        <>
            {!open && (
                <button onClick={() => setOpen(true)} className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-[#1a1a1a] border border-[#333] text-[#d4d4d4] text-[20px] cursor-pointer flex items-center justify-center z-[9999] shadow-[0_4px_12px_rgba(0,0,0,0.4)]"
                    title="Open terminal">{'＞_'}</button>
            )}
            <div
                className={`fixed bottom-6 right-6 w-[640px] h-[380px] bg-[#141414] border border-[#333] rounded-[10px] ${open ? 'flex flex-col' : 'hidden'
                    } z-[9999] overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)]`}
            >
                {/* Title bar */}
                <div className="flex items-center px-3 h-9 bg-[#1f1f1f] border-b border-[#2a2a2a] shrink-0 gap-2">

                    {/* Traffic lights */}
                    <button
                        onClick={kill}
                        className="w-3 h-3 rounded-full bg-[#E24B4A] cursor-pointer shrink-0"
                        title="Kill session"
                    />
                    <button
                        onClick={close}
                        className="w-3 h-3 rounded-full bg-[#EF9F27] cursor-pointer shrink-0"
                        title="Minimize"
                    />
                    <button
                        onClick={() => fitAddon.current?.fit()}
                        className="w-3 h-3 rounded-full bg-[#639922] cursor-pointer shrink-0"
                        title="Refit"
                    />

                    {/* Title */}
                    <span className="flex-1 text-center text-xs text-[#666] font-mono">
                        bash — ws://localhost:8080
                    </span>

                    {/* Status dot */}
                    <span
                        className="w-2 h-2 rounded-full inline-block"
                        style={{ background: statusColor }}
                    />
                </div>

                {/* xterm container */}
                <div
                    ref={containerRef}
                    className="flex-1 p-[6px] overflow-hidden"
                />
            </div>
        </>
    )
} 